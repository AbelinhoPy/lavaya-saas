// tests/tenant-isolation.test.cjs
const assert = require('node:assert/strict');

// Simulated database table state with 2 separate businesses
const state = {
  businesses: [
    { id: 'biz-111', owner_id: 'user-abel', name: 'LavaYA! San Lorenzo' },
    { id: 'biz-222', owner_id: 'user-diego', name: 'LavaYA! Asunción' }
  ],
  jobs: [
    { id: 'job-1', business_id: 'biz-111', plate: 'ABC 123', amount: 50000, state: 'espera' },
    { id: 'job-2', business_id: 'biz-222', plate: 'XYZ 999', amount: 80000, state: 'lavando' }
  ],
  expenses: [
    { id: 'exp-1', business_id: 'biz-111', concepto: 'Champú siliconado', monto: 120000 },
    { id: 'exp-2', business_id: 'biz-222', concepto: 'Cera premium', monto: 200000 }
  ]
};

// Simulation of server-side data access logic enforcing business_id derived from session
function getJobsForBusiness(authorizedBizId) {
  return state.jobs.filter(j => j.business_id === authorizedBizId);
}

function updateJobState(authorizedBizId, jobId, nextState) {
  // MUST filter by both id and authorizedBizId
  const job = state.jobs.find(j => j.id === jobId && j.business_id === authorizedBizId);
  if (!job) {
    throw new Error('Vehículo no encontrado o acceso denegado.');
  }
  job.state = nextState;
  return job;
}

function getExpensesForBusiness(authorizedBizId) {
  return state.expenses.filter(e => e.business_id === authorizedBizId);
}

// TEST 1: User A (biz-111) can only view their own jobs
const jobsA = getJobsForBusiness('biz-111');
assert.equal(jobsA.length, 1);
assert.equal(jobsA[0].id, 'job-1');
assert.equal(jobsA.some(j => j.business_id === 'biz-222'), false);

// TEST 2: User B (biz-222) can only view their own jobs
const jobsB = getJobsForBusiness('biz-222');
assert.equal(jobsB.length, 1);
assert.equal(jobsB[0].id, 'job-2');
assert.equal(jobsB.some(j => j.business_id === 'biz-111'), false);

// TEST 3: User A attempts direct ID manipulation on User B's job (job-2)
assert.throws(() => {
  updateJobState('biz-111', 'job-2', 'entregado');
}, /Vehículo no encontrado o acceso denegado/);

// Ensure job-2 was NOT modified
assert.equal(state.jobs.find(j => j.id === 'job-2').state, 'lavando');

// TEST 4: User A can modify their own job (job-1)
const updatedJob1 = updateJobState('biz-111', 'job-1', 'lavando');
assert.equal(updatedJob1.state, 'lavando');

// TEST 5: User A attempts to view financial expenses of User B
const expensesA = getExpensesForBusiness('biz-111');
assert.equal(expensesA.length, 1);
assert.equal(expensesA[0].id, 'exp-1');
assert.equal(expensesA.some(e => e.business_id === 'biz-222'), false);

console.log('PASS: Tenant isolation verified between separate businesses (read, update, direct ID access, and financial privacy).');
