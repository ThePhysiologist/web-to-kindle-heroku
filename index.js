const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const execFile = require('child_process').execFile;
const fs = require('fs');

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 600, height: 810 });

    await page.goto(
      process.env.SCREENSHOT_URL || 'https://darksky.net/details/40.7127,-74.0059/2021-1-6/us12/en',
      { waitUntil: 'networkidle0' }
    );

    // ⏱️ 7-second delay after page load
    await new Promise((resolve) => setTimeout(resolve, 7000));

    await page.screenshot({ path: '/tmp/screenshot.png' });
    await browser.close();

    await convert('/tmp/screenshot.png');

    const screenshot = fs.readFileSync('/tmp/screenshot.png');
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': screenshot.length,
    });
    return res.end(screenshot);
  } catch (err) {
    console.error('Error during screenshot process:', err);
    res.status(500).send('Screenshot failed.');
  }
});

// 🧠 Define the convert() function before use
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

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
