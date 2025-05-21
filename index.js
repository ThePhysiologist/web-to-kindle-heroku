const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const execFile = require('child_process').execFile;
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const SCREENSHOT_PATH = '/tmp/screenshot.png';
const SCREENSHOT_URL = process.env.SCREENSHOT_URL || 'https://darksky.net/details/40.7127,-74.0059/2021-1-6/us12/en';

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Serve cached screenshot
app.get('/', (req, res) => {
  if (fs.existsSync(SCREENSHOT_PATH)) {
    const screenshot = fs.readFileSync(SCREENSHOT_PATH);
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': screenshot.length,
    });
    return res.end(screenshot);
  } else {
    return res.status(503).send('Screenshot not available yet.');
  }
});

// Background screenshot function
async function takeScreenshot() {
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 600, height: 810 });
    await page.goto(SCREENSHOT_URL, {
  waitUntil: 'networkidle0',
  timeout: 60000 // wait up to 60 seconds
});

    // 5 second wait after page load
    await new Promise(resolve => setTimeout(resolve, 5000));

    await page.screenshot({ path: SCREENSHOT_PATH });
    await browser.close();

    await convert(SCREENSHOT_PATH);

    console.log('Screenshot updated');
  } catch (err) {
    console.error('Screenshot generation failed:', err);
  }
}

// Convert function (ImageMagick)
function convert(filename) {
  return new Promise((resolve, reject) => {
    const args = [
      filename,
      '-gravity', 'center',
      '-extent', '600x800',
      '-colorspace', 'gray',
      '-depth', '8',
      filename,
    ];
    execFile('convert', args, (error, stdout, stderr) => {
      if (error) {
        console.error({ error, stdout, stderr });
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

// Run screenshot immediately on app start
takeScreenshot();

// Optionally re-run every X minutes
setInterval(takeScreenshot, 2 * 60 * 1000); // every 15 minutes

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
