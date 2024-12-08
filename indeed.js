const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Worker } = require('worker_threads');
require('dotenv').config()
const router = express.Router();

const app = express();
const PORT = process.env.INDEEDPORT

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URL_SCRAPING, { useNewUrlParser: true, useUnifiedTopology: true })

const jobSchema = new mongoose.Schema({
  indeedtitle: String,
  indeedcompany: String,
  indeedlocation: String,
  indeeddescription: String,
  indeedlink: String,
  indeedjobPosted: String,
  indeedimageSrc: String, 
  indeedsalary: String, 

}, { collection: 'indeedjobs' });
const Job = mongoose.model('Job', jobSchema); 
// API key and base Indeed URL
const apiKey = process.env.API_KEY
const indeedUrl = 'https://de.indeed.com/jobs?q={jobTitle}&l={location}&fromage=last&start={}'; // {} for pagination

// Clean job descriptions
const cleanDescription = (description) => {
  return description.replace(/[\n+]/g, '').replace(/\s+/g, ' ').trim();
};
// Scrape a single Indeed page
// Extract job details with `.find` and your class names
const scrapeIndeedPage = async (jobTitle, location, pageNumber) => {
  const pageUrl = indeedUrl
    .replace('{jobTitle}', jobTitle)
    .replace('{location}', location)
    .replace('{}', pageNumber * 10); // Pagination increases by 10
  const scraperApiUrl = `http://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(pageUrl)}`;

  try {
    const response = await axios.get(scraperApiUrl);

    if (response.status === 200) {
      const $ = cheerio.load(response.data);

      const jobs = [];
      $('.job_seen_beacon').each((i, el) => {
        const role = $(el).find('.jcs-JobTitle.css-1baag51.eu4oa1w0').text().trim();
        const company = $(el).find('span.css-1h7lukg.eu4oa1w0').text().trim();
        const location = $(el).find('div.css-1restlb.eu4oa1w0').text().trim();
        const description = cleanDescription($(el).find('div.css-o11dc0.eu4oa1w0').text());
        const jobLink = `https://de.indeed.com${$(el).find('a.jcs-JobTitle.css-1baag51.eu4oa1w0').attr('href')}`;
        const jobPosted = $(el).find('span.css-1yxm164.eu4oa1w0').text().trim();
        const salary = $(el).find('span.css-19j1a75.eu4oa1w0').text().trim();
        const imageSrc = $(el).find('div.jobMetaDataGroup css-qspwa8 eu4oa1w0').text().trim();
        

        jobs.push({
          indeedtitle: role || null,
          indeedcompany: company || null,
          indeedlocation: location || null,
          indeeddescription: description || null,
          indeedlink: jobLink || null,
          indeedjobPosted: jobPosted || null,
          indeedsalary: salary || null,
          indeedimageSrc: imageSrc || null,
        });
      });

      return jobs;
    } else {
      console.error(`Failed to retrieve page ${pageNumber}. Status code: ${response.status}`);
      return [];
    }
  } catch (error) {
    console.error(`An error occurred while scraping page ${pageNumber}: ${error.message}`);
    return [];
  }
};

// Scrape pages concurrently
const scrapeIndeedPagesConcurrently = async (jobTitle, location, startPage, endPage, maxWorkers = 5) => {
    const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  
    const workerTasks = pageNumbers.map((page) => scrapeIndeedPage(jobTitle, location, page));
    const results = await Promise.all(workerTasks);
  
    // Flatten the results
    return results.flat();
  };
  

  router.post('/indeed/fetch-jobs', async (req, res) => {
    const jobTitle = req.body.job_title || 'developer';
    const location = req.body.location || 'germany';
    const startPage = 1;
    const endPage = 10;
  
    try {
      const jobs = await scrapeIndeedPagesConcurrently(jobTitle, location, startPage, endPage);
  
      await Job.deleteMany({});
      await Job.insertMany(jobs);
  
      res.json({ message: 'Job fetching completed', jobCount: jobs.length });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs. Please try again.' });
    }
  });
  
  // GET endpoint
  router.get('/indeed/indeed-jobs', async (req, res) => {
    try {
      const jobs = await Job.find({}, { _id: 0 });
      res.json(jobs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching job listings. Please try again.' });
    }
  });
  
  module.exports = router;