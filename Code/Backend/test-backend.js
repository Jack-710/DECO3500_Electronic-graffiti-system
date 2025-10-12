const http = require('http');

const tests = [
  { name: 'Health Check', path: '/api/health', method: 'GET' },
  { name: 'Create Guest User', path: '/api/users/guest', method: 'POST' },
  { name: 'Get Locations', path: '/api/locations', method: 'GET' },
  { name: 'Get Streams', path: '/api/streams', method: 'GET' }
];

async function runTest({ name, path, method }) {
  return new Promise((resolve) => {
    console.log(`🧪 Testing: ${name}`);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`✅ ${name}: SUCCESS`);
          } else {
            console.log(`❌ ${name}: FAILED (${res.statusCode})`);
            console.log(`   Error:`, result.error);
          }
        } catch (e) {
          console.log(`❌ ${name}: FAILED to parse response`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${name}: ERROR - ${error.message}`);
      resolve();
    });

    if (method === 'POST' && path === '/api/streams') {
      req.write(JSON.stringify({ title: 'Test Stream' }));
    }

    req.end();
  });
}

async function runAllTests() {
  console.log('🚀 Starting Backend Tests...\n');
  
  for (const test of tests) {
    await runTest(test);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }
  
  console.log('\n🎉 Testing completed!');
  console.log('📖 API Documentation: http://localhost:3001/api');
}

runAllTests();