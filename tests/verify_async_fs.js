const Module = require('module');
const path = require('path');

const mockVideoPath = '/tmp/mock_video.webm';

const mockPromises = {
    rename: async (oldPath, newPath) => {
        console.log(`[Mock] fs.promises.rename called: ${oldPath} -> ${newPath}`);
        return;
    },
    copyFile: async (src, dest) => {
        console.log(`[Mock] fs.promises.copyFile called: ${src} -> ${dest}`);
        return;
    },
    unlink: async (path) => {
        console.log(`[Mock] fs.promises.unlink called: ${path}`);
        return;
    }
};

const mockFs = {
    existsSync: (p) => {
        if (p === mockVideoPath) return true;
        if (typeof p === 'string' && p.endsWith('api_key.json')) return false;
        if (typeof p === 'string' && p.endsWith('storage_state.json')) return false;
        // recordings dir?
        if (typeof p === 'string' && p.includes('recordings')) return true;
        // captures dir?
        if (typeof p === 'string' && p.includes('captures')) return true;
        return false;
    },
    mkdirSync: (p) => { console.log(`[Mock] fs.mkdirSync called for ${p}`); },
    statSync: () => ({ isDirectory: () => false }),
    readFileSync: () => '{}',
    promises: mockPromises,
    // Trap sync methods
    renameSync: (o, n) => {
        console.error(`FAIL: fs.renameSync called! ${o} -> ${n}`);
        process.exit(1);
    },
    copyFileSync: (s, d) => {
        console.error('FAIL: fs.copyFileSync called!');
        process.exit(1);
    },
    unlinkSync: (p) => {
        console.error('FAIL: fs.unlinkSync called!');
        process.exit(1);
    }
};

const mockPage = {
    goto: async () => {},
    viewportSize: () => ({ width: 1280, height: 720 }),
    evaluate: async () => {},
    video: () => ({
        path: async () => mockVideoPath
    }),
    screenshot: async () => {},
    url: () => 'http://mock',
    waitForTimeout: async () => {},
    waitForSelector: async () => {},
    $: async () => null,
    mouse: { move: async () => {}, click: async () => {} },
    keyboard: { press: async () => {}, type: async () => {} }
};

const mockContext = {
    addInitScript: async () => {},
    newPage: async () => mockPage,
    storageState: async () => {},
    close: async () => {}
};

const mockBrowser = {
    newContext: async () => mockContext,
    close: async () => {}
};

const mockPlaywright = {
    chromium: {
        launch: async () => mockBrowser
    }
};

const mockJSDOM = {
    JSDOM: class {
        constructor() {
            this.window = { document: {} };
        }
    }
};

// Override require
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
    if (id === 'playwright') return mockPlaywright;
    if (id === 'fs') return mockFs;
    if (id === 'jsdom') return mockJSDOM;
    return originalRequire.apply(this, arguments);
};

// Load agent
const { handleAgent } = require('../agent.js');

// Run test
(async () => {
    console.log('Starting verification test...');
    const req = {
        method: 'POST',
        body: {
            actions: [], // Empty actions
            disableRecording: false,
            statelessExecution: true
        },
        socket: {},
        protocol: 'http',
        query: {}
    };

    const res = {
        status: (code) => ({
             json: (data) => {
                 // console.log(`Response: ${code}`, data);
             }
        }),
        json: (data) => {
            // console.log('Response JSON:', data);
        }
    };

    try {
        await handleAgent(req, res);
        console.log('Test completed successfully (no sync calls detected).');
    } catch (e) {
        console.error('Test failed with error:', e);
        process.exit(1);
    }
})();
