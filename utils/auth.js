const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Define constants
// Since this file is in utils/, we need to go up one level to reach the root, then into data/
const API_KEY_FILE = path.join(__dirname, '..', 'data', 'api_key.json');
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// Helper to load API key
function loadApiKey() {
    let apiKey = null;
    if (fs.existsSync(API_KEY_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(API_KEY_FILE, 'utf8'));
            apiKey = data && data.apiKey ? data.apiKey : null;
        } catch (e) {
            apiKey = null;
        }
    }

    if (!apiKey && fs.existsSync(USERS_FILE)) {
        try {
            const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
            if (Array.isArray(users) && users.length > 0 && users[0].apiKey) {
                apiKey = users[0].apiKey;
                saveApiKey(apiKey);
            }
        } catch (e) {
            // ignore
        }
    }

    return apiKey;
}

// Helper to save API key
function saveApiKey(apiKey) {
    // Ensure the directory exists before writing
    const dir = path.dirname(API_KEY_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(API_KEY_FILE, JSON.stringify({ apiKey }, null, 2));
    if (fs.existsSync(USERS_FILE)) {
        try {
            const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
            if (Array.isArray(users) && users.length > 0) {
                users[0].apiKey = apiKey;
                fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
            }
        } catch (e) {
            // ignore
        }
    }
}

function generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
}

module.exports = {
    loadApiKey,
    saveApiKey,
    generateApiKey
};
