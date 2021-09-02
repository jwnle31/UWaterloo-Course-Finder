const express = require('express');
const path = require('path');
const reddit = require('./api/reddit');
const scraper = require('./api/scraper');
require('dotenv').config();

// Connect to database
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const connect = client.connect();

// Assign collections
const db = client.db('CourseDB');
const courses = db.collection('courses');
const redditPosts = db.collection('reddit-posts');
const uwflowData = db.collection('uwflow-data');

async function validCourse(course) {
    const validCourse = await courses.findOne({ courseCode: course });
    return Boolean(validCourse);
}

// setInterval(db.run, 5000);

const app = express();

// Set a Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Homepage Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/uwinfo/:course', (req, res) => {
    connect
        .then(res => {
            return courses.findOne({ courseCode: req.params.course });
        })
        .then(data => {
            res.status(200).json(data);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: err });
        });
});

// Access Reddit API
app.get('/reddit/:course', (req, res) => {
    connect
        .then(res => {
            return redditPosts.findOne({ courseCode: req.params.course });
        })
        .then(data => {
            res.status(200).json(data);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: err });
        });
});

app.put('/reddit/:subject/:catalogNum', (req, res) => {
    const subject = req.params.subject;
    const catNum = req.params.catalogNum;

    validCourse(`${subject}${catNum}`)
        .then(isValid => {
            if (isValid) {
                return connect;
            } else {
                throw {
                    status: 400, 
                    message: 'Bad Request: Enter a valid query!'
                };
            }
        })
        .then(res => {
            return reddit.searchRedditUW(`(${subject}${catNum}) OR (${subject} ${catNum})`, 100, 'relevance');
        })
        .then(postData => {
            postObj = {
                posts: postData,
                courseCode: `${subject}${catNum}`,
                timestamp: Date.now()
            }
            return redditPosts.replaceOne({ courseCode: `${subject}${catNum}` }, postObj, { upsert: true });
        })
        .then(data => {
            res.status(201).json({
                message: 'Successfully updated Reddit posts!',
                result: data
            });
        })
        .catch(err => {
            const status = err.status || 500;
            if (status == 500) err.message = 'Server Error!';
            res.status(status).json({
                status,
                message: err.message
            });
        });
});

// Access UW Flow Scraper
app.get('/uwflow/:course', (req, res) => {
    connect
        .then(res => {
            return uwflowData.findOne({ courseCode: req.params.course });
        })
        .then(data => {
            res.status(200).json(data);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: err });
        });
});

app.put('/uwflow/:course', (req, res) => {
    const course = req.params.course;
    validCourse(course)
        .then(isValid => {
            if (isValid) {
                return connect;
            } else {
                throw {
                    status: 400, 
                    message: 'Bad Request: Enter a valid query!'
                };
            }
        })
        .then(res => {
            return scraper.scrapeCourseInfo(`https://uwflow.com/course/${course}`);
        })
        .then(data => {
            flowDataObj = {
                data,
                courseCode: course,
                timestamp: Date.now()
            }
            return uwflowData.replaceOne({ courseCode: course }, flowDataObj, { upsert: true });
        })
        .then(data => {
            res.status(201).json({
                message: 'Successfully updated UW Flow data!',
                result: data
            });
        })
        .catch(err => {
            const status = err.status || 500;
            if (status == 500) err.message = 'Server Error!';
            res.status(status).json({
                status,
                message: err.message
            });
        });
});

// 404 Page
app.get('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}...`));