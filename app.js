require('dotenv').config()
const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const port = process.env.PORT || 8080;
const validUrl = require('valid-url');
const auth = require('basic-auth');

const opts = {
    browser: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
        ]
    },
    goto: {
        waitUntil: 'networkidle0',
        timeout: 0
    }
};

var parseUrl = function(url) {
    url = decodeURIComponent(url)
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = 'http://' + url;
    }
    return url;
};

app.get('/', function(req, res) {
    var user = auth(req);
    if(!user || user.name != process.env.API_KEY){
        res.status(401).json({error: 'Please include a valid API key in your request'});
    }

    var urlToCapture = parseUrl(req.query.url);
    var format = req.query.format || 'Legal';
    var landscape = req.query.landscape == 'false' ? false : true;
    var scale = Number(req.query.scale) ? Number(req.query.scale) : 0.66;

    if (validUrl.isWebUri(urlToCapture)) {
        console.log('Capturing: ' + urlToCapture + ` | x${scale} ${format}`);
        (async() => {
            const browser = await puppeteer.launch(opts.browser);
            const page = await browser.newPage();
            page.on('error', err => {
                console.error(err.message);
                browser.close();
                res.status(400).json({error: err.message});
            });

            try {
                // Go to the page
                await page.goto(urlToCapture, opts.goto);

                // Wait for all images to finish loading
                await page.waitForFunction(
                  () =>
                    document.images.length &&
                    Array.from(document.images).every((img) => img.complete)
                );

                // Add Twemoji script
                await page.evaluate(() => {
                    return new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://cdn.jsdelivr.net/npm/@twemoji/api@latest/dist/twemoji.min.js';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                });
                
                // Add styles for Twemoji images
                await page.addStyleTag({content: 'img.emoji {height: 1em;width: 1em;margin: 0 .05em 0 .1em;vertical-align: -0.1em;}'});
                
                // Substitute emojis with Twemoji images
                await page.evaluate(() => {
                    twemoji.parse(document.body);
                });

                // Wait for all Twemoji images to finish loading
                await page.waitForFunction(
                  () =>
                    document.images.length &&
                    Array.from(document.images).every((img) => img.complete)
                );

                // Capture the page as a PDF
                await page.pdf({
                    printBackground: true,
                    scale: scale,
                    format: format,
                    landscape: landscape
                }).then(function(buffer) {
                    res.setHeader('Content-Disposition', 'attachment;filename="export.pdf"');
                    res.setHeader('Content-Type', 'application/pdf');
                    res.send(buffer);
                }).catch(function(err){
                    console.error(err.stack);
                    res.status(400).json({error: err.message});
                });

            } catch(err) {
                console.error(err.stack);
                res.status(400).json({error: err.message});
            } finally {
                await browser.close();
            }
        })();
    } else {
        res.status(400).json({error: 'Invalid url'});
    }

});

app.listen(port, function() {
    console.log('App listening on port ' + port)
})
