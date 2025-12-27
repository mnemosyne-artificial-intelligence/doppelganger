const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STORAGE_STATE_PATH = path.join(__dirname, 'storage_state.json');

// Use a consistent User Agent or the same pool
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
];

let activeSession = null;

async function handleHeadful(req, res) {
    if (activeSession) {
        return res.status(409).json({ error: 'HEADFUL_ALREADY_RUNNING' });
    }

    activeSession = { status: 'starting' };

    const url = req.body.url || req.query.url || 'https://www.google.com';

    // We stick to the first UA in the list for headful mode to ensure consistency
    const selectedUA = userAgents[0];

    console.log(`Opening headful browser for: ${url}`);

    let browser;
    try {
        browser = await chromium.launch({
            headless: false,
            channel: 'chrome',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const contextOptions = {
            viewport: { width: 1280, height: 720 },
            userAgent: selectedUA,
            locale: 'en-US',
            timezoneId: 'America/New_York'
        };

        if (fs.existsSync(STORAGE_STATE_PATH)) {
            console.log('Loading existing storage state...');
            contextOptions.storageState = STORAGE_STATE_PATH;
        }

        const context = await browser.newContext(contextOptions);
        const page = await context.newPage();

        await page.goto(url);

        console.log('Browser is open. Please log in manually.');
        console.log('IMPORTANT: Close the page/tab or wait for saves.');

        // Function to save state
        const saveState = async () => {
            try {
                await context.storageState({ path: STORAGE_STATE_PATH });
                console.log('Storage state saved successfully.');
            } catch (e) {
                // If context is closed, this will fail, which is expected during shutdown
            }
        };

        // Auto-save every 10 seconds while the window is open
        const interval = setInterval(saveState, 10000);

        activeSession = { browser, context, interval, status: 'running' };

        // Save when the page is closed
        page.on('close', async () => {
            clearInterval(interval);
            await saveState();
        });

        // Respond immediately; cleanup runs after disconnect
        res.json({
            message: 'Headful session started. Close the browser window or call /headful/stop to end.',
            userAgentUsed: selectedUA,
            path: STORAGE_STATE_PATH
        });

        // Wait for the browser to disconnect (user closes the last window)
        await new Promise((resolve) => browser.on('disconnected', resolve));

        clearInterval(interval);

        // Final attempt to save if context is alive
        await saveState();
        activeSession = null;
    } catch (error) {
        console.error('Headful Error:', error);
        if (browser) await browser.close();
        activeSession = null;
        res.status(500).json({ error: 'Failed to start headful session', details: error.message });
    }
}

async function stopHeadful(req, res) {
    if (!activeSession) {
        return res.status(200).json({ message: 'No active headful session.' });
    }

    try {
        if (activeSession.interval) clearInterval(activeSession.interval);
        if (activeSession.context) {
            await activeSession.context.storageState({ path: STORAGE_STATE_PATH });
        }
    } catch {}

    try {
        if (activeSession.browser) {
            await activeSession.browser.close();
        }
    } catch {}

    activeSession = null;
    res.json({ message: 'Headful session stopped.' });
}

module.exports = { handleHeadful, stopHeadful };
