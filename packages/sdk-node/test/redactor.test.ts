import { redactValue, redactAttributes } from '../src/redactor';

describe('SDK Redactor Tests', () => {
  it('should redact sensitive keys in attributes', () => {
    const raw = {
      'http.url': 'http://example.com/checkout',
      'authorization': 'Bearer my_secret_token_123',
      'user.password': 'superSecretPassword!',
      'db.statement': 'SELECT * FROM users',
    };

    const redacted = redactAttributes(raw);

    expect(redacted['http.url']).toBe('http://example.com/checkout');
    expect(redacted['authorization']).toBe('[REDACTED]');
    expect(redacted['user.password']).toBe('[REDACTED]');
    expect(redacted['db.statement']).toBe('SELECT * FROM users');
  });

  it('should redact values matching bearer patterns even if key is not sensitive', () => {
    const value = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M';
    expect(redactValue('custom_header', value)).toBe('[REDACTED]');
  });
});
