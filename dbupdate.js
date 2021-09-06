const { MongoClient } = require('mongodb');
const uwapi = require('./api/uwapi');
const fetch = require('node-fetch');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect();

const db = client.db('CourseDB');
const courses = db.collection('courses');
const uwFlowData = db.collection('uwflow-data');

const courseQuery = `
    query getCourse {
        course(order_by: {id: asc}) {
            ...CourseInfo
            ...CourseRequirements
            ...CourseRating
        }
    }

    fragment CourseInfo on course {
        id
        code
    }
            
    fragment CourseRequirements on course {
        id
        antireqs
        prereqs
        coreqs
        postrequisites {
            postrequisite {
                code
                name
            }
        }
    }

    fragment CourseRating on course {
        id
        rating {
            liked
            easy
            useful
            filled_count
            comment_count
        }
    }
`;

// Update UW course data in database
async function courseDataUpdate() {
    // Calculate for UWaterloo Term Code
    const currentTime = new Date();
    const yearDigits = currentTime.getFullYear().toString().substr(-2);
    const month = currentTime.getMonth();
    const monthDigit = Math.floor((month - 1) / 4) * 4 + 1;
    const termCode = '1' + yearDigits + monthDigit;

    const courseDataList = await uwapi.fetchCourse(termCode);

    courseDataList.forEach(item => {
        const courseCode = `${item.subjectCode}${item.catalogNumber}`
        item.courseCode = courseCode;
        item.timestamp = Date.now();
        courses.replaceOne({ courseCode }, item, { upsert: true });
    });
};

// Update UW Flow data in database
async function flowDataUpdate() {
    const flowData = await getFlowData();
    flowData.forEach(item => {
        item.timestamp = Date.now();
        uwFlowData.replaceOne({ courseCode: item.courseCode }, item, { upsert: true });
    });
}

// Fetch UW Flow data
async function getFlowData() {
    let flowData = await fetch('https://uwflow.com/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: courseQuery })
    });
    flowData = await flowData.json();
    flowData = await flowData.data.course;
    flowData = Array.from(flowData).map(item => {
        const courseCode = item.code.toUpperCase();
        const likedPerc = item.rating.liked ? Math.round(item.rating.liked * 100) + '%' : 0 + '%';
        const easyPerc = item.rating.easy ? Math.round(item.rating.easy * 100) + '%' : 0 + '%';
        const usefulPerc = item.rating.useful ? Math.round(item.rating.useful * 100) + '%' : 0 + '%';
        const commentNum = item.rating.comment_count;
        const ratingNum = item.rating.filled_count;
        const postreqs = Array.from(item.postrequisites).map(item => {
            return `${item.postrequisite.code.toUpperCase()} - ${item.postrequisite.name}`;
        });
        const relCourseArr = [
            item.prereqs ?? 'No prerequisites',
            item.coreqs ?? 'No corequisites',
            item.antireqs ?? 'No antirequisites',
            postreqs.length !== 0 ? postreqs : 'No other courses'
        ];
        return {
            courseId: item.id,
            courseCode,
            likedPerc,
            easyPerc,
            usefulPerc,
            commentNum,
            ratingNum,
            relCourseArr
        }
    });
    return flowData;
}

// Update database
function run() {
    courseDataUpdate();
    flowDataUpdate();
}

// Update every Tuesday
const today = new Date();
if (today.getDay() == 1) {
    run();
}
