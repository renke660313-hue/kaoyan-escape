const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// 测试激活码生成
async function testGenerateCodes() {
  try {
    const response = await fetch('http://localhost:3001/api/generate-codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ count: 5 }),
    });
    
    const data = await response.json();
    console.log('生成激活码结果:', data);
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 测试激活码验证
async function testVerifyCode() {
  try {
    // 先生成一个激活码
    const generateResponse = await fetch('http://localhost:3001/api/generate-codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ count: 1 }),
    });
    
    const generateData = await generateResponse.json();
    const code = generateData.codes[0];
    console.log('生成的激活码:', code);
    
    // 验证激活码
    const verifyResponse = await fetch('http://localhost:3001/api/verify-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: '13800138001', code }),
    });
    
    const verifyData = await verifyResponse.json();
    console.log('验证激活码结果:', verifyData);
  } catch (error) {
    console.error('测试失败:', error);
  }
} 

// 运行测试
testGenerateCodes();
testVerifyCode();
