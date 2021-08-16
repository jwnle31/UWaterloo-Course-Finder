// Fetching from Waterloo OpenData API
export async function searchCourseUW(termCode, subject, catalogNumber) {
    return await fetch(`./uwinfo?code=${termCode}&subject=${subject}&number=${catalogNumber}`)
        .then(res => res.json())
        .then(data => data[0])
        .catch(err => console.log(err));
}

// Fetching from Uwaterloo Subreddit
export async function searchRedditUW(searchTerm, searchLimit, sortBy) {
    return await fetch(`./reddit?url=https://www.reddit.com/r/uwaterloo/search.json&q=${searchTerm}&sort=${sortBy}&limit=${searchLimit}`)
        .then(res => res.json())
        .catch(err => console.log(err));
}

// Fetching from UW Flow
export async function searchFlowUW(course) {
    return await fetch(`./courseinfo?url=https://uwflow.com/course/${course}`)
        .then(res => res.json())
        .catch(err => console.log(err));
}

