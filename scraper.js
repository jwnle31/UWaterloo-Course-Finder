const puppeteer = require('puppeteer');

async function scrapeCourseInfo(url) {
    const browser = await puppeteer.launch({
        'args': [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });

    const scrapedData = await page.evaluate(() => {
        const reviewArr = Array.from(document.querySelectorAll('.sc-pLwIe')).map(item => item.innerText);
        const postInfoArr = Array.from(document.querySelectorAll('.sc-pTWqp')).map(item => item.innerText);
        const likedPerc = document.querySelector('.sc-psQdR').innerText;
        const easyPerc = document.querySelectorAll('.sc-pcJja')[0].innerText;
        const usefulPerc = document.querySelectorAll('.sc-pcJja')[1].innerText;
        const commentNum = (document.querySelector('.sc-qPwPv').innerText.match(/[0-9]+/))[0];
        const ratingNum = (document.querySelector('.sc-qXRQq').innerText.match(/[0-9]+/))[0];
        const relCourseArr = document.querySelector('.sc-pQsrT').innerText.split('\n\n\n').map(arr => {
            newArr = arr.split('\n');
            newArr.shift();
            newStr = newArr.join('<br>');
            return newStr;
        });

        return {
            reviewArr,
            postInfoArr,
            likedPerc,
            easyPerc,
            usefulPerc,
            commentNum,
            ratingNum,
            relCourseArr
        }
    });

    await browser.close();
    return scrapedData;
}

module.exports = { scrapeCourseInfo };