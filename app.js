require('dotenv').config()
const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const port = process.env.PORT || 8080;
const validUrl = require('valid-url');
const auth = require('basic-auth');

const opts = {
    browser: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
        ]
    },
    goto: {
        waitUntil: 'networkidle0',
        timeout: 0
    },
    waitForTimeout: 10000
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
        console.log('Capturing: ' + urlToCapture);
        (async() => {
            const browser = await puppeteer.launch(opts.browser);
            const page = await browser.newPage();
            page.on('error', err => {
                console.error(err.message);
                browser.close();
                res.status(400).json({error: err.message});
            });

            try {
                await page.goto(urlToCapture, opts.goto);
                await page.waitForTimeout(opts.waitForTimeout);

                // Substitute emojis with Twemoji
                await page.addScriptTag({ url: 'https://unpkg.com/twemoji@latest/dist/twemoji.min.js' });
                await page.addStyleTag({content: 'img.emoji {height: 1em;width: 1em;margin: 0 .05em 0 .1em;vertical-align: -0.1em;}'});
                await page.waitForTimeout(1000);
                await page.evaluate(() => {
                   twemoji.parse(document.body);
                });
                await page.waitForTimeout(2000);


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
