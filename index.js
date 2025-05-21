const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const execFile = require('child_process').execFile;
const fs = require('fs');

const PORT = process.env.PORT || 3000;

async function start() {

  express()
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', async (req, res) => {
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setViewport({ width: 600, height: 810 });

      await page.goto(process.env.SCREENSHOT_URL || 'https://darksky.net/details/40.7127,-74.0059/2021-1-6/us12/en', {
        waitUntil: 'networkidle0',
      });

      // 15s delay after page load
      await new Promise(resolve => setTimeout(resolve, 15000));

      await page.screenshot({ path: '/tmp/screenshot.png' });
      await browser.close();

      await convert('/tmp/screenshot.png');
      const screenshot = fs.readFileSync('/tmp/screenshot.png');

      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': screenshot.length,
      });
      return res.end(screenshot);
    })
    .listen(PORT, () => console.log(`Listening on ${PORT}`));
}

start(); // 👈 call the async function
