const mongoose = require("mongoose");

// Define the Job schema
const jobSchema = new mongoose.Schema({
    title: String,
    company: String,
    location: String,
    description: String,
    link: String,
    jobPosted: String,
    salary: String,
    logo: String,
    source: String, // Source of the job (e.g., Glassdoor, Indeed)
});

// Create the Job model
const Job = mongoose.model("Job", jobSchema);

module.exports = { Job };
