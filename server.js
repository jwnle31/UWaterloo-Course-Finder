const express = require('express');
const path = require('path');
const reddit = require('./api/reddit');
const uwflow = require('./api/uwflow');
// const dbupdate = require('./dbupdate');
require('dotenv').config();

// Connect to database
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect();

// Assign collections
const db = client.db('CourseDB');
const courses = db.collection('courses');
const redditPosts = db.collection('reddit-posts');
const uwflowData = db.collection('uwflow-data');

async function validCourse(course) {
    const validCourse = await courses.findOne({ courseCode: course });
    return Boolean(validCourse);
}

const app = express();

// Set a Static Folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Homepage Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/uwinfo/:course', (req, res) => {
    courses.findOne({ courseCode: req.params.course })
        .then(data => {
            res.status(200).json(data);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: err });
        });
});

// Access Reddit Info
app.get('/reddit/:course', (req, res) => {
    redditPosts.findOne({ courseCode: req.params.course })
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
                return;
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

// Access UW Flow Info
app.get('/uwflow/:course', (req, res) => {
    uwflowData.findOne({ courseCode: req.params.course })
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
                return;
            } else {
                throw {
                    status: 400, 
                    message: 'Bad Request: Enter a valid query!'
                };
            }
        })
        .then(res => {
            return uwflowData.findOne({ courseCode: req.params.course });
        })
        .then(data => {
            return uwflow.reviewDataUpdate(data.courseId);
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