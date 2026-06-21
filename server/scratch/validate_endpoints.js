import assert from 'assert';

const BASE_URL = 'http://localhost:5001';

async function runTests() {
  console.log('----------------------------------------------------');
  console.log('STARTING REST API ENDPOINT VALIDATION CHECKS...');
  console.log('----------------------------------------------------');

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check Endpoint
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.status, 'Healthy');
    console.log('✅ TEST 1 PASSED: Server health endpoint returns 200 OK & Status Healthy.');
    passed++;
  } catch (err) {
    console.error('❌ TEST 1 FAILED: Health endpoint failed:', err.message);
    failed++;
  }

  // Test 2: Unauthorized route guard check
  try {
    const res = await fetch(`${BASE_URL}/api/v1/courses`);
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.match(data.message, /No authentication token provided/i);
    console.log('✅ TEST 2 PASSED: Security guard blocks unauthorized requests (401 Access Denied).');
    passed++;
  } catch (err) {
    console.error('❌ TEST 2 FAILED: Route security check failed:', err.message);
    failed++;
  }

  // Test 3: Bad login credentials validation
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': 'university_sms_secure_token',
        'x-requested-with': 'XMLHttpRequest'
      },
      body: JSON.stringify({ email: 'bad-email@univ.edu', password: 'wrongpassword' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.match(data.message, /Invalid credentials/i);
    console.log('✅ TEST 3 PASSED: Server securely handles incorrect login attempts (401 Unauthorized).');
    passed++;
  } catch (err) {
    console.error('❌ TEST 3 FAILED: Invalid credentials handling check failed:', err.message);
    failed++;
  }

  // Test 4: CSRF Header protection guard check
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Missing CSRF token/Requested-With headers
      },
      body: JSON.stringify({ email: 'admin@university.edu', password: 'password123' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 403);
    assert.strictEqual(data.success, false);
    assert.match(data.message, /CSRF token verification failed/i);
    console.log('✅ TEST 4 PASSED: Server rejects requests without custom CSRF validation headers (403 Forbidden).');
    passed++;
  } catch (err) {
    console.error('❌ TEST 4 FAILED: CSRF security check failed:', err.message);
    failed++;
  }

  // Test 5: Google OAuth simulation exchange check
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': 'university_sms_secure_token',
        'x-requested-with': 'XMLHttpRequest'
      },
      body: JSON.stringify({ token: 'mock-admin-token' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.accessToken);
    assert.strictEqual(data.data.user.role, 'ADMIN');
    console.log('✅ TEST 5 PASSED: Google OAuth simulation exchanges mock token and returns correct user profile details.');
    passed++;
  } catch (err) {
    console.error('❌ TEST 5 FAILED: Google OAuth simulation test failed:', err.message);
    failed++;
  }

  // Test 6: Discussions Group and Message flow
  try {
    // 1. Google login as Teacher to get token
    const authRes = await fetch(`${BASE_URL}/api/v1/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': 'university_sms_secure_token',
        'x-requested-with': 'XMLHttpRequest'
      },
      body: JSON.stringify({ token: 'mock-teacher-token' })
    });
    const authData = await authRes.json();
    const token = authData.data.accessToken;

    // 2. Create Group
    const groupRes = await fetch(`${BASE_URL}/api/v1/discussions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-csrf-token': 'university_sms_secure_token',
        'x-requested-with': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        name: 'CSE Questions Forum',
        description: 'Discuss CSE assignment queries and class doubts.'
      })
    });
    const groupData = await groupRes.json();
    assert.strictEqual(groupRes.status, 201);
    assert.strictEqual(groupData.success, true);
    const groupId = groupData.data.id;

    // 3. Post chat message
    const msgRes = await fetch(`${BASE_URL}/api/v1/discussions/${groupId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-csrf-token': 'university_sms_secure_token',
        'x-requested-with': 'XMLHttpRequest'
      },
      body: JSON.stringify({ content: 'Hello team, ask your DBMS doubts here!' })
    });
    const msgData = await msgRes.json();
    assert.strictEqual(msgRes.status, 201);
    assert.strictEqual(msgData.success, true);

    // 4. Get messages
    const fetchRes = await fetch(`${BASE_URL}/api/v1/discussions/${groupId}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-csrf-token': 'university_sms_secure_token',
        'x-requested-with': 'XMLHttpRequest'
      }
    });
    const fetchData = await fetchRes.json();
    assert.strictEqual(fetchRes.status, 200);
    assert.strictEqual(fetchData.data.length, 1);
    assert.strictEqual(fetchData.data[0].content, 'Hello team, ask your DBMS doubts here!');
    console.log('✅ TEST 6 PASSED: Discussion board creation, message publishing, and chat queries are fully functional.');
    passed++;
  } catch (err) {
    console.error('❌ TEST 6 FAILED: Discussion Group API check failed:', err.message);
    failed++;
  }

  console.log('----------------------------------------------------');
  console.log(`TEST SUITE RUN SUMMARY: Passed: ${passed} | Failed: ${failed}`);
  console.log('----------------------------------------------------');
}

runTests();
