import * as fetchdata from './fetchdata.js';

window.onload = () => document.getElementById('submit-btn').disabled=false;

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const loadSpinner = `
    <div id="spin" class="d-flex justify-content-center align-items-center mt-5 mb-3">
        <div class="spinner-grow" role="status">
            <span class="sr-only"></span>
        </div>
    </div>`;

// Event Listener for Search Button
searchForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.getElementById('submit-btn').disabled = true;
    const searchTerm = searchInput.value;
    let searchTermArr = searchTerm.replace(/\s/g, '');
    searchInput.value = '';

    // Input Validation
    if (/([a-zA-Z]+)([0-9]+[a-zA-Z]{0,1})/.test(searchTermArr)) {
        searchTermArr = searchTermArr.match(/[a-zA-Z]+|[0-9]+[a-zA-Z]{0,1}/g);
    } else {
        courseInvalid();
        return;
    }

    // Input Partition
    const subject = searchTermArr[0].toUpperCase();
    const catalogNumber = searchTermArr[1].toUpperCase();
    
    // Calculate for UWaterloo Term Code
    const currentTime = new Date();
    const yearDigits = currentTime.getFullYear().toString().substr(-2);
    const month = currentTime.getMonth();
    const monthDigit = Math.floor((month - 1) / 4) * 4 + 1;

    // Grab Course Data from API
    const courseData = await fetchdata.searchCourseUW('1' + yearDigits + monthDigit, subject, catalogNumber);

    if (courseData === undefined) {
        courseInvalid();
        return;
    }

    // Put Load Spinners Before the Main Content
    reset(loadSpinner);

    // Main Course Content
    document.getElementById('container-l').innerHTML =  `
    <div id="course" class="card card-body border-0 mb-4 shadow-lg">
        <h2><b>${subject} ${catalogNumber}</b></h2>
        <h5><i>${courseData.title}</i></h5>
        <hr>
        <h4><b>Description:</b></h4>
        <p>${courseData.description}</p>
    </div>
    <div id="spec" class="card card-body border-0 mb-4 shadow-lg">
        <h4><b>Specification:</b></h4>
        <ul class="list-group list-group-flush">
            <li class="list-group-item">Academic Career: <i>${courseData.associatedAcademicCareer}</i></li>
            <li class="list-group-item">Faculty: <i>${courseData.associatedAcademicGroupCode}</i></li>
            <li class="list-group-item">Course ID: <i>${courseData.courseId}</i></li>
            <li class="list-group-item">Grading Basis: <i>${courseData.gradingBasis}</i></li>
        </ul>
    </div>
    `;

    // Grab UWaterloo Subreddit Data from API
    const redditData = await fetchdata.searchRedditUW(`(${subject}${catalogNumber}) OR (${subject} ${catalogNumber})`, 100, 'relevance');

    // Subreddit Posts Content
    let outputReddit = `
    <div id="reddit" class="card card-body mb-4 border-0 shadow-lg">
        <h2><b><i class="bi-reddit"></i> Reddit Posts</b></h2>
        <hr>
    `;

    if (redditData.length === 0) {
        outputReddit += `
        <div id="posts" class="d-flex justify-content-center align-items-center">
            <h3>No Posts Found</h3>`;
    } else {
        outputReddit += '<div id="posts" class="container">';
    }

    redditData.forEach(post => {
        // Integrate Preview Image
        const imageHTML = post.url.includes('.png') || post.url.includes('.jpg') || post.url.includes('.gif') || post.url.includes('.gifv') ? `<img src="${post.url}" class="card-img-top" alt="...">` : '';

        outputReddit += `
        <div class="card mt-3 border-0">
            ${imageHTML}
            <div class="card-body">
                <h5 class="card-title">${post.title}</h5>
                <p class="card-text">${truncateText(post.selftext, 100)}</p>
                <hr>
                <div class="d-flex justify-content-between p-0">
                    <a href="https://www.reddit.com${post.permalink}" target="_blank"><h3 class="m-0"><i class="bi-book"></i></h3></a>
                    <h3 class="m-0"><i class="bi-caret-up-fill"></i>${post.score}</h3>
                </div>
            </div>
        </div>
        `;
    });

    outputReddit += `
        </div>
    </div>`;
    document.getElementById('container-r').innerHTML = outputReddit;

    // Grab UW Flow Data from API
    const flowData = await fetchdata.searchFlowUW(`${subject}${catalogNumber}`)

    // UW Flow Statistics & Review
    document.getElementById('container-lb').innerHTML =  `
    <div id="req" class="card card-body border-0 mb-2 shadow-lg">
        <h4><b>Prerequisites:</b></h4>
        <p>${flowData.relCourseArr[0]}</p>
        <h4><b>Corequisites:</b></h4>
        <p>${flowData.relCourseArr[1]}</p>
        <h4><b>Antirequisites:</b></h4>
        <p>${flowData.relCourseArr[2]}</p>
        <h4><b>Leads to:</b></h4>
        <p>${flowData.relCourseArr[3]}</p>
    </div>
    `;

    if (flowData.likedPerc === 'N/A') flowData.likedPerc = '0%';
    if (flowData.easyPerc === 'N/A') flowData.easyPerc = '0%';
    if (flowData.usefulPerc === 'N/A') flowData.usefulPerc = '0%';

    document.getElementById('container-rb').innerHTML = `
    <div id="stat" class="card card-body border-0 text-center mb-2 shadow-lg">
        <h4><b>Review Statistics:</b></h4>
        <i>From&nbsp;&nbsp;<i class="bi-record-circle"></i>&nbsp;UWFlow</i>
        <br>
        <h5><b>${flowData.ratingNum}</b> ratings and <b>${flowData.commentNum}</b> comments</h5>

        <div class="row align-items-center mb-2">
            <div class="col-3 pe-0 text-end">
                <h5 class="mb-0">Liked:&nbsp;</h5>
            </div>
            <div class="col-8">
                <div class="progress">
                    <div class="progress-bar" role="progressbar" style="width: ${flowData.likedPerc};">${flowData.likedPerc}</div>
                </div>
            </div>
        </div>
        <div class="row align-items-center mb-2">
            <div class="col-3 pe-0 text-end">
                <h5 class="mb-0">Easy:&nbsp;</h5>
            </div>
            <div class="col-8">
                <div class="progress">
                    <div class="progress-bar" role="progressbar" style="width: ${flowData.easyPerc};">${flowData.easyPerc}</div>
                </div>
            </div>
        </div>
        <div class="row align-items-center mb-2">
            <div class="col-3 pe-0 text-end">
                <h5 class="mb-0">Useful:&nbsp;</h5>
            </div>
            <div class="col-8">
                <div class="progress">
                    <div class="progress-bar" role="progressbar" style="width: ${flowData.usefulPerc};">${flowData.usefulPerc}</div>
                </div>
            </div>
        </div>
    `;

    let outputFlow = `
    <div id="review" class="card card-body border-0 mb-2 shadow-lg">
        <h4><b>Recent Course Reviews:</b></h4>
        <br>`;
    
    if (flowData.reviewArr.length === 0) {
        outputFlow += `
        <div class="d-flex justify-content-center align-items-center pb-5">
            <h5>No Reviews Found</h5>
        </div>
        `;
    }

    for (let i = 0; i < flowData.reviewArr.length; i++) {
        outputFlow += `
        <div class="card card-body review-card border-0 w-auto mb-4 shadow-lg">
            <p>${flowData.reviewArr[i]}</p>
            <b><i class="review-info">${flowData.postInfoArr[i]}</i></b>
        </div>`;
    }

    outputFlow += '</div>';
    document.getElementById('container-b').innerHTML = outputFlow;
    document.getElementById('posts').style.height = `${document.getElementById('container-l').offsetHeight + document.getElementById('container-lb').offsetHeight - 357}px`;
    
    // Enable the Search Button Once All the Components Load
    document.getElementById('submit-btn').disabled = false;
});

function truncateText(text, limit) {
    const shortened = text.indexOf(' ', limit);
    if (shortened == -1) return text;
    return text.substring(0, shortened) + ' ...';
}

// Resets All the Grid Components to a Certain HTML Element
function reset(item) {
    document.getElementById('container-l').innerHTML = item;
    document.getElementById('container-r').innerHTML = item;
    document.getElementById('container-lb').innerHTML = item;
    document.getElementById('container-rb').innerHTML = item;
    document.getElementById('container-b').innerHTML = item;
}

// Not Found Display
function courseInvalid() {
    reset('');
    document.getElementById('container-b').innerHTML = '<h1 id="nf-notif" class="text-center">Course Not Found</h1>';
    document.getElementById('submit-btn').disabled = false;
}
