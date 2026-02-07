const fs = require('fs');
const path = require('path');

// Mock playwright
const playwright = require('playwright');
playwright.chromium.launch = async () => ({
    newContext: async (options) => {
        return {
            addInitScript: async () => {},
            newPage: async () => ({
                on: () => {},
                goto: async () => {},
                video: () => null,
                viewportSize: () => ({ width: 1280, height: 720 }),
            }),
            on: () => {},
            close: async () => {},
            storageState: async () => {}
        };
    },
    close: async () => {},
    on: (evt, cb) => { if(evt === 'disconnected') setTimeout(cb, 50); }
});

// Spy on fs
const originalExistsSync = fs.existsSync;
let existsSyncCalledForStorage = false;
fs.existsSync = (filepath) => {
    if (typeof filepath === 'string' && filepath.includes('storage_state.json')) {
        // Log it, but let it proceed
        console.log('fs.existsSync CALLED for storage_state.json');
        existsSyncCalledForStorage = true;
    }
    return originalExistsSync(filepath);
};

const originalAccess = fs.promises.access;
let accessCalledForStorage = false;
fs.promises.access = async (filepath) => {
    if (typeof filepath === 'string' && filepath.includes('storage_state.json')) {
        console.log('fs.promises.access CALLED for storage_state.json');
        accessCalledForStorage = true;
        // Simulate existence by resolving (success)
        return Promise.resolve();
    }
    return originalAccess(filepath);
};

console.log('Requiring headful.js...');
const { handleHeadful } = require('../headful');
console.log('headful.js loaded.');

// Reset the flag because require() might have triggered existsSync in the top-level IIFE
console.log(`Resetting existsSyncCalledForStorage (was ${existsSyncCalledForStorage})...`);
existsSyncCalledForStorage = false;

const req = { body: { url: 'http://example.com', statelessExecution: false }, query: {} };
const res = {
    json: (data) => {}, // console.log('Response:', data),
    status: (code) => ({ json: (data) => console.log(`Error ${code}:`, data) }),
    headersSent: false
};

(async () => {
    console.log('Running verification test...');
    try {
        await handleHeadful(req, res);

        console.log('--- Results ---');
        console.log(`fs.existsSync called (during handler): ${existsSyncCalledForStorage}`);
        console.log(`fs.promises.access called: ${accessCalledForStorage}`);

        if (accessCalledForStorage && !existsSyncCalledForStorage) {
            console.log('PASS: Optimization verified.');
            process.exit(0);
        } else if (existsSyncCalledForStorage) {
            console.log('FAIL: fs.existsSync was called!');
            process.exit(1);
        } else {
            console.log('FAIL: fs.promises.access was NOT called!');
            process.exit(1);
        }
    } catch (e) {
        console.error('Test Error:', e);
        process.exit(1);
    }
})();
