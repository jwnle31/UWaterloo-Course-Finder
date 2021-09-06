const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect();

const db = client.db('CourseDB');
const uwFlowData = db.collection('uwflow-data');

const reviewQuery = `
    query courseReviews($id: Int) {
        review(where: {course_id: {_eq: $id}, _and: [{course_comment: {_is_null: false}}]}, order_by: {created_at: desc}, limit: 10) {
            ...ReviewInfo
        }
    }

    fragment ReviewInfo on review {
        created_at
        course_comment
        author {
            full_name
            program
        }
        prof {
            name
        }
    }
`;

// Fetch current UW Flow review data
async function reviewDataUpdate(courseId) {
    let reviewData = await fetch('https://uwflow.com/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: reviewQuery, variables: { id: courseId } })
    });
    reviewData = await reviewData.json();
    reviewData = await reviewData.data.review;
    reviewData = Array.from(reviewData).map(item => {
        let postInfo = '— ';
        const fullName = item.author.full_name;
        const program = item.author.program;
        if (fullName && program) {
            postInfo += `${fullName}, ${program} student`;
        } else if (fullName) {
            postInfo += `${fullName}`;
        } else if (program) {
            postInfo += `${program} student`
        } else {
            postInfo += 'A student';
        }
        if (item.prof) {
            postInfo += `, taught by ${item.prof.name}`;
        }
        postInfo += ` (${new Date(item.created_at).toLocaleDateString()})`;
        return {
            courseComment: item.course_comment,
            postInfo
        }
    });
    return uwFlowData.updateOne({ courseId }, { $set: { reviewInfo: {
        timestamp: Date.now(),
        reviewData
    }} });
}

// Scrape UW Flow Course Page
// async function scrapeCourseInfo(url) {
//     const browser = await puppeteer.launch({
//         // Prevent Memory Runout on Heroku
//         'args': [
//             '--no-sandbox',
//             '--disable-setuid-sandbox',
//             '--disable-dev-shm-usage',
//             '--single-process' 
//         ]
//     });

//     const page = await browser.newPage();
//     await page.goto(url, { waitUntil: 'networkidle2' });

//     const scrapedData = await page.evaluate(() => {
//         const reviewArr = Array.from(document.querySelectorAll('.sc-pLwIe')).map(item => item.innerText);
//         const postInfoArr = Array.from(document.querySelectorAll('.sc-pTWqp')).map(item => item.innerText);
//         const likedPerc = document.querySelector('.sc-psQdR').innerText;
//         const easyPerc = document.querySelectorAll('.sc-pcJja')[0].innerText;
//         const usefulPerc = document.querySelectorAll('.sc-pcJja')[1].innerText;
//         const commentNum = (document.querySelector('.sc-qPwPv').innerText.match(/[0-9]+/))[0];
//         const ratingNum = (document.querySelector('.sc-qXRQq').innerText.match(/[0-9]+/))[0];
//         const relCourseArr = document.querySelector('.sc-pQsrT').innerText.split('\n\n\n').map(arr => {
//             newArr = arr.split('\n');
//             newArr.shift();
//             newStr = newArr.join('<br>');
//             return newStr;
//         });

//         return {
//             reviewArr,
//             postInfoArr,
//             likedPerc,
//             easyPerc,
//             usefulPerc,
//             commentNum,
//             ratingNum,
//             relCourseArr
//         }
//     });

//     await browser.close();
//     return scrapedData;
// }

module.exports = { reviewDataUpdate };