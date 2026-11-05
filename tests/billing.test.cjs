const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');

function load(file) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  const m = { exports: {} };
  const customRequire = (id) => {
    if (id === './plans') return load('src/lib/plans.ts');
    if (id.startsWith('./')) {
      const dir = path.dirname(file);
      const target = path.join(dir, id.endsWith('.ts') ? id : id + '.ts');
      return load(target);
    }
    return require(id);
  };
  new Function('require', 'module', 'exports', source)(customRequire, m, m.exports);
  return m.exports;
}

const { verifySignature, hasAccess, validPrice, PLANS } = load('src/lib/billing-core.ts');
const { validJob, canAdvance } = load('src/lib/jobs.ts');

const now = Date.now();
const timestamp = String(Math.floor(now / 1000));
const body = '{"event_id":"evt_test"}';
const secret = 'test-only-secret';
const signature = crypto.createHmac('sha256', secret).update(`${timestamp}:${body}`).digest('hex');

// 1. Webhook HMAC & Replay Tests
assert.equal(verifySignature(body, `ts=${timestamp};h1=${signature}`, secret, now), true);
assert.equal(verifySignature(body + ' ', `ts=${timestamp};h1=${signature}`, secret, now), false);
assert.equal(verifySignature(body, `ts=${timestamp};h1=${signature}`, secret, now + 6000), false);
assert.equal(verifySignature(body, `ts=${timestamp};h1=bad`, secret, now), false);
assert.equal(verifySignature(body, `ts=${timestamp};h1=${signature}`, 'wrong', now), false);

// 2. Subscription Access Verification
assert.equal(hasAccess(null, now), false);
assert.equal(hasAccess(undefined, now), false);
assert.equal(hasAccess({ status: 'trialing', access_until: new Date(now + 10000).toISOString() }, now), true);
assert.equal(hasAccess({ status: 'active', access_until: new Date(now + 10000).toISOString() }, now), true);
for (const status of ['active', 'trialing', 'past_due', 'paused', 'canceled']) {
  assert.equal(hasAccess({ status, access_until: new Date(now - 1000).toISOString() }, now), false);
}
assert.equal(hasAccess({ status: 'past_due', access_until: new Date(now + 10000).toISOString() }, now), false);

// 3. Multi-Plan Verification (Monthly, Semiannual, Annual)
// 3a. Monthly ($20/mo, 2000 cents, 7-day card trial)
const monthlyPrice = {
  status: 'active',
  billing_cycle: { interval: 'month', frequency: 1 },
  trial_period: { interval: 'day', frequency: 7, requires_payment_method: true },
  unit_price: { amount: '2000', currency_code: 'USD' }
};
assert.equal(validPrice(monthlyPrice, 'monthly'), true);
assert.equal(validPrice({ ...monthlyPrice, trial_period: { ...monthlyPrice.trial_period, requires_payment_method: false } }, 'monthly'), false);
assert.equal(validPrice({ ...monthlyPrice, trial_period: { ...monthlyPrice.trial_period, unit_price: { amount: '1' } } }, 'monthly'), false);
assert.equal(validPrice({ ...monthlyPrice, unit_price: { amount: '2900', currency_code: 'USD' } }, 'monthly'), false);
assert.equal(validPrice({ ...monthlyPrice, unit_price_overrides: [{}] }, 'monthly'), false);

// 3b. Semiannual ($108 every 6 months, 10800 cents, 7-day card trial)
const semiannualPrice = {
  status: 'active',
  billing_cycle: { interval: 'month', frequency: 6 },
  trial_period: { interval: 'day', frequency: 7, requires_payment_method: true },
  unit_price: { amount: '10800', currency_code: 'USD' }
};
assert.equal(validPrice(semiannualPrice, 'semiannual'), true);
assert.equal(validPrice({ ...semiannualPrice, unit_price: { amount: '10000', currency_code: 'USD' } }, 'semiannual'), false);
assert.equal(validPrice({ ...semiannualPrice, billing_cycle: { interval: 'month', frequency: 1 } }, 'semiannual'), false);

// 3c. Annual ($192 every 12 months / 1 year, 19200 cents, 7-day card trial)
const annualPrice = {
  status: 'active',
  billing_cycle: { interval: 'year', frequency: 1 },
  trial_period: { interval: 'day', frequency: 7, requires_payment_method: true },
  unit_price: { amount: '19200', currency_code: 'USD' }
};
assert.equal(validPrice(annualPrice, 'annual'), true);
assert.equal(validPrice({ ...annualPrice, billing_cycle: { interval: 'month', frequency: 12 } }, 'annual'), true);
assert.equal(validPrice({ ...annualPrice, unit_price: { amount: '1920', currency_code: 'USD' } }, 'annual'), false);

// Verify plan definitions
assert.equal(PLANS.monthly.totalCharge, 20);
assert.equal(PLANS.semiannual.totalCharge, 108);
assert.equal(PLANS.semiannual.monthlyEquivalent, 18);
assert.equal(PLANS.semiannual.savingsAmount, 12);
assert.equal(PLANS.annual.totalCharge, 192);
assert.equal(PLANS.annual.monthlyEquivalent, 16);
assert.equal(PLANS.annual.savingsAmount, 48);

// 4. Job Input Validation
assert.equal(validJob({ plate: 'ABC 123', service: 'Lavado', amount: 50000 }), true);
assert.equal(validJob({ plate: 'AAKD 793', service: 'Lavado Completo', amount: 50000, tipo: 'auto' }), true);
assert.equal(validJob({ plate: '123 ABC', service: 'Lavado Moto', amount: 25000, tipo: 'moto' }), true);
assert.equal(validJob({ plate: '<script>', service: 'Lavado', amount: 50000 }), false);
assert.equal(validJob({ plate: 'ABC 123', service: 'Lavado', amount: -1 }), false);
assert.equal(validJob({ plate: 'ABC 123', service: 'Lavado', amount: 1.5 }), false);
assert.equal(validJob({ plate: 'ABC 123', service: 'L', amount: 50000 }), false);

// 5. Job State Transitions
assert.equal(canAdvance('espera', 'lavando'), true);
assert.equal(canAdvance('lavando', 'listo'), true);
assert.equal(canAdvance('listo', 'entregado'), true);
assert.equal(canAdvance('espera', 'entregado'), false);
assert.equal(canAdvance('lavando', 'espera'), false);
assert.equal(canAdvance('entregado', undefined), false);

console.log('PASS: webhook signatures, replay protection, multi-plan pricing (monthly, semiannual, annual), trial verification, job validation and state transitions.');
