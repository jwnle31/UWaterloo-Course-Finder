const express = require('express');
const path = require('path');
const uwapi = require('./uwapi.js');
const fetch = require('node-fetch');
const scraper = require('./scraper');
require('dotenv').config();

const app = express();

// Set a Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Homepage Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Access Waterloo OpenData API
app.get('/uwinfo', async (req, res) => {
    const uwInfo = await uwapi.searchCourse(req.query.code, req.query.subject, req.query.number);
    
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400'
    });
    res.end(JSON.stringify(uwInfo));
});

// Access Reddit API
app.get('/reddit', async (req, res) => {
    const redditInfo = await fetch(`${req.query.url}?q=${req.query.q}&sort=${req.query.sort}&limit=${req.query.limit}&restrict_sr=on`)
        .then(res => res.json())
        .then(data => data.data.children.map(data => data.data));

    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400'
    });
    res.end(JSON.stringify(redditInfo));
});

// Access UW Flow Scraper
app.get('/courseinfo', async (req, res) => {
    const courseInfo = await scraper.scrapeCourseInfo(req.query.url);

    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400'
    });
    res.end(JSON.stringify(courseInfo));
});

// 404 Page
app.get('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}...`));