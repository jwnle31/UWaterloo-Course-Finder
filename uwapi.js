const fetch = require('node-fetch');

async function searchCourse(termCode, subject, catalogNumber) {
    return await fetch(`https://openapi.data.uwaterloo.ca/v3/Courses/${termCode}/${subject}/${catalogNumber}`, {
        headers: {
            'x-api-key': process.env.UW_API_KEY
        }
    })
    .then(res => res.json())
    .catch(err => console.log(err));
}

module.exports = { searchCourse };