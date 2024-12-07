// app.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio'); // Use Cheerio for parsing
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoUri = 'mongodb://localhost:27017/job_listings';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

// Define Job schema and model
const jobSchema = new mongoose.Schema({
    Title: String,
    Company: String,
    Location: String,
    Link: String,
    Jobposted: String,
    Imagesrc: String
});

const Job = mongoose.model('Job', jobSchema);

// Function to fetch job data
async function fetchJobData(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching data: ${error}`);
        return null;
    }
}

// Function to parse job listings using Cheerio
function parseJobListings(html) {
    const jobs = [];
    const $ = cheerio.load(html); // Load HTML into Cheerio

    // Select job listings based on the actual HTML structure
    const jobListings = $('li'); // Adjust the selector based on the site's structure

    jobListings.each((_, job) => {
        const jobTitle = $(job).find('h3.base-search-card__title').text().trim();
        const company = $(job).find('h4.base-search-card__subtitle').text().trim();
        const location = $(job).find('span.job-search-card__location').text().trim();
        const link = $(job).find('a.base-card__full-link').attr('href');
        const jobposted = $(job).find('time.job-search-card__listdate').text().trim();
        const imageSrc = $(job).find('img.artdeco-entity-image').attr('data-delayed-url');  // Select the data-delayed-url attribute



        if (jobTitle && company && location && link) {
            jobs.push({ Title: jobTitle, Company: company, Location: location, Link: link , Jobposted: jobposted, Imagesrc: imageSrc});
        }
    });

    return jobs;
}

// Endpoint to fetch jobs
app.post('/fetch-jobs', async (req, res) => {
    const jobTitle = req.body.job_title || 'developer';
    const location = req.body.location || 'india';
    const allJobs = [];

    const urls = Array.from({ length: 40 }, (_, i) =>
        `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${jobTitle}&location=${location}&start=${i * 25}`
    );

    for (const url of urls) {
        const html = await fetchJobData(url);
        if (html) {
            const jobs = parseJobListings(html);
            allJobs.push(...jobs);
        }
    }

    // Clear previous jobs and save new ones
    await Job.deleteMany({});
    await Job.insertMany(allJobs);

    res.json({ message: 'Job fetching completed', jobCount: allJobs.length });
});

// Endpoint to get jobs
app.get('/get-jobs', async (req, res) => {
    try {
        const jobs = await Job.find({}, { _id: 0 });
        res.json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching job listings. Please try again.' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});