const http = require('http');

async function testRateLimit() {
  for (let i = 1; i <= 7; i++) {
    await new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/admin/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          console.log(`Attempt ${i}: Status ${res.statusCode}`);
          if (data) {
            try {
              const json = JSON.parse(data);
              console.log(`  Message: ${json.message}`);
            } catch (e) {
              console.log(`  Response: ${data.substring(0, 80)}`);
            }
          }
          resolve();
        });
      });

      req.on('error', (err) => {
        console.log(`Attempt ${i}: ERROR - ${err.message}`);
        resolve();
      });

      req.write(JSON.stringify({ username: 'wrong', password: 'wrong' }));
      req.end();

      setTimeout(resolve, 500);
    });
  }
}

testRateLimit();
