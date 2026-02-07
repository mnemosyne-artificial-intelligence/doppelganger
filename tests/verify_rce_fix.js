const { runExtractionScript } = require('../agent.js');

async function testRCE() {
    console.log("Running RCE verification test...");

    // Test 1: Attempt to access process via constructor escape
    const exploitScript = `
        try {
            const req = (function(){}).constructor('return process')();
            return "RCE Successful: " + (req ? req.version : 'null');
        } catch(e) {
            return "Error: " + e.message;
        }
    `;

    try {
        const result = await runExtractionScript(exploitScript, '<html></html>', 'http://example.com');
        console.log("Exploit 1 Result:", result.result);

        if (result.result && result.result.includes("RCE Successful")) {
            console.error("FAIL: RCE exploit 1 succeeded!");
            process.exit(1);
        } else {
            console.log("PASS: RCE exploit 1 failed (as expected).");
        }
    } catch (e) {
        console.log("PASS: RCE exploit 1 threw error:", e.message);
    }

    // Test 2: Attempt to access process via this.constructor.constructor
    const exploitScript2 = `
        try {
            const req = this.constructor.constructor('return process')();
            return "RCE Successful: " + (req ? req.version : 'null');
        } catch(e) {
            return "Error: " + e.message;
        }
    `;

    try {
        const result = await runExtractionScript(exploitScript2, '<html></html>', 'http://example.com');
        console.log("Exploit 2 Result:", result.result);

        if (result.result && result.result.includes("RCE Successful")) {
            console.error("FAIL: RCE exploit 2 succeeded!");
            process.exit(1);
        } else {
            console.log("PASS: RCE exploit 2 failed (as expected).");
        }
    } catch (e) {
        console.log("PASS: RCE exploit 2 threw error:", e.message);
    }

    // Test 3: Valid script (property access)
    const validScript = `return document.title;`;
    const html = '<title>Test Page</title>';

    try {
        const result = await runExtractionScript(validScript, html, 'http://example.com');
        console.log("Valid Script Result:", result.result);

        if (result.result === 'Test Page') {
            console.log("PASS: Valid script worked correctly.");
        } else {
            console.error("FAIL: Valid script failed. Expected 'Test Page', got:", result.result);
            process.exit(1);
        }
    } catch (e) {
        console.error("FAIL: Valid script threw error:", e);
        process.exit(1);
    }

    // Test 4: DOM Method Usage (ensures 'this' binding works)
    const domScript = `
        const el = document.querySelector('title');
        return el ? el.textContent : "Not found";
    `;

    try {
        const result = await runExtractionScript(domScript, html, 'http://example.com');
        console.log("DOM Method Result:", result.result);

        if (result.result === 'Test Page') {
            console.log("PASS: DOM methods work correctly.");
        } else {
            console.error("FAIL: DOM methods failed. Expected 'Test Page', got:", result.result);
            process.exit(1);
        }
    } catch (e) {
        console.error("FAIL: DOM methods threw error:", e);
        process.exit(1);
    }
}

testRCE();
