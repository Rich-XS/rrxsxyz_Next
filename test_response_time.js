const https = require('https');

const urls = [
  'https://anyrouter.top',
  'https://pmpjfbhq.cn-nb1.rainapp.top', 
  'https://7a61fbe1b5f3.d93a09b6.top/',
  'https://q.quuvv.cn'
];

function testResponseTime(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    console.log(`正在测试: ${url}`);
    
    const req = https.get(url, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`✓ ${url}: ${responseTime}ms (状态码: ${res.statusCode})`);
      console.log('');
      resolve({ url, responseTime, status: 'success', statusCode: res.statusCode });
      
      // 消耗响应数据
      res.on('data', () => {});
    });
    
    req.on('error', (err) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`✗ ${url}: 错误 - ${err.message} (耗时: ${responseTime}ms)`);
      console.log('');
      resolve({ url, responseTime, status: 'error', error: err.message });
    });
    
    req.setTimeout(10000, () => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`✗ ${url}: 超时 (耗时: ${responseTime}ms)`);
      console.log('');
      req.destroy();
      resolve({ url, responseTime, status: 'timeout' });
    });
  });
}

async function testAllUrls() {
  console.log('='.repeat(60));
  console.log('网站响应时间测试');
  console.log('='.repeat(60));
  console.log('');
  
  const results = [];
  
  for (const url of urls) {
    const result = await testResponseTime(url);
    results.push(result);
  }
  
  console.log('='.repeat(60));
  console.log('测试结果汇总:');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    if (result.status === 'success') {
      console.log(`✓ ${result.url}: ${result.responseTime}ms`);
    } else if (result.status === 'error') {
      console.log(`✗ ${result.url}: 连接错误`);
    } else if (result.status === 'timeout') {
      console.log(`✗ ${result.url}: 请求超时`);
    }
  });
  
  console.log('');
  console.log('测试完成');
}

// 运行测试
testAllUrls().catch(err => {
  console.error('测试过程中发生错误:', err);
});