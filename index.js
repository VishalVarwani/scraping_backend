const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import scraper routes
const linkedinRoutes = require('./linkedin');
const stepstoneRoutes = require('./stepstone');
const glassdoorRoutes = require('./glassdoor');
const indeedRoutes = require('./indeed');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOptions = {
    origin: ["https://jobscanner-pb9s.onrender.com"], // Replace with your frontend URL
    methods: ["GET", "POST"],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB connection
const mongoUri = process.env.MONGO_URL_SCRAPING;
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

// Route handlers
app.use('/api', linkedinRoutes);
app.use('/api', stepstoneRoutes);
app.use('/api', glassdoorRoutes);
app.use('/api', indeedRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
