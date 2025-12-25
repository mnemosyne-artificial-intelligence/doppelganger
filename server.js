const express = require('express');
const app = express();
const port = 11345;

const { handleScrape } = require('./scrape');
const { handleAgent } = require('./agent');
const { handleHeadful } = require('./headful');

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('<h1>Scraper is Online</h1><p>Usage: <code>/scrape</code>, <code>/agent</code>, <code>/headful</code>, or visit <code>/test</code> for UI.</p>');
});

app.get('/test', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/scraper/test', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/agent/test', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/headful/test', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/headful', (req, res) => {
    // If it's a GET request from a browser (no JSON header or specific flag), show UI
    // Otherwise, it might be an API call. 
    // To be safe, let's just make direct /headful GET return the UI.
    res.sendFile(__dirname + '/public/index.html');
});

// Scraping endpoint
app.all('/scrape', handleScrape);
app.all('/scraper', handleScrape);

// Agent endpoint
app.all('/agent', handleAgent);

// Headful login endpoint (Execution triggered by POST)
app.post('/headful', handleHeadful);

app.listen(port, '0.0.0.0', () => {
    console.log(`Scraper server running at http://0.0.0.0:${port}`);
});
