const assert = require('assert');
const path = require('path');
const schema = require('../.tmp/quoteSettings.js');

const invalid = {
  firmName: 'Test',
  description: 'desc',
  palette: { primary: '#000', secondary: '#111', tertiary: '#222' },
  signer: { name: 'Jo', role: 'CEO', email: 'bad-email' }
};

const valid = {
  firmName: 'Test',
  description: 'desc',
  palette: { primary: '#000', secondary: '#111', tertiary: '#222' },
  signer: { name: 'John Doe', role: 'CEO', email: 'john@example.com' }
};

assert.strictEqual(schema.validateQuoteSettings(valid), true);
assert.strictEqual(schema.validateQuoteSettings(invalid), false);
console.log('All tests passed');
