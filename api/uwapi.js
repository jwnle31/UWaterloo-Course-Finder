const fetch = require('node-fetch');

// Fetch Current Official Course Data
async function fetchCourse(termCode) {
    return await fetch(`https://openapi.data.uwaterloo.ca/v3/Courses/${termCode}`, {
        headers: {
            'x-api-key': process.env.UW_API_KEY
        }
    })
        .then(res => res.json())
        .catch(err => console.log(err));
}

module.exports = { fetchCourse };