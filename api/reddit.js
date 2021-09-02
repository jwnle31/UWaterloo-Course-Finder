const fetch = require('node-fetch');

// Fetching from Uwaterloo Subreddit
async function searchRedditUW(searchTerm, searchLimit, sortBy) {
    return await fetch(`https://www.reddit.com/r/uwaterloo/search.json?q=${searchTerm}&sort=${sortBy}&limit=${searchLimit}&restrict_sr=on`)
        .then(res => res.json())
        .then(data => data.data.children)
        .then(arr => arr.map(item => item.data))
        .catch(err => console.log(err));
}

module.exports = { searchRedditUW };