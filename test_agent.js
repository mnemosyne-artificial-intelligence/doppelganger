const { handleAgent } = require('./agent');

// Build a fake req/res to call handleAgent directly
class FakeRes {
  constructor() {
    this.statusCode = 200;
  }
  status(code) { this.statusCode = code; return this; }
  json(obj) { console.log('--- RESPONSE ---'); console.log(JSON.stringify(obj, null, 2)); return this; }
}

async function run() {
  const req = {
    method: 'POST',
    body: {
      url: 'https://example.com',
      actions: [
        { type: 'navigate', value: 'https://example.com' }
      ],
      rotateUserAgents: false,
      stealth: {}
    }
  };

  const res = new FakeRes();

  try {
    await handleAgent(req, res);
  } catch (e) {
    console.error('Test error:', e);
  }
}

run();
