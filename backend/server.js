const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());
// 提供静态文件
app.use(express.static(__dirname));

// 数据库连接
const db = new sqlite3.Database('./activation_codes.db', (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功');
    initDatabase();
  }
});

// 初始化数据库
function initDatabase() {
  // 创建激活码表
  db.run(`
    CREATE TABLE IF NOT EXISTS activation_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      phone TEXT,
      status TEXT DEFAULT 'unused',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      used_at TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('创建表失败:', err.message);
    } else {
      console.log('数据库表初始化成功');
    }
  });
}

// 生成随机激活码
function generateActivationCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// 批量生成激活码
app.post('/api/generate-codes', (req, res) => {
  const { count } = req.body;
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    codes.push(generateActivationCode());
  }
  
  // 插入数据库
  const stmt = db.prepare('INSERT INTO activation_codes (code) VALUES (?)');
  let errors = [];
  
  codes.forEach(code => {
    stmt.run(code, function(err) {
      if (err) {
        errors.push(err.message);
      }
    });
  });
  
  stmt.finalize(() => {
    if (errors.length > 0) {
      res.status(500).json({ error: '生成激活码失败', details: errors });
    } else {
      res.json({ success: true, codes });
    }
  });
});

// 验证激活码
app.post('/api/verify-code', (req, res) => {
  const { phone, code } = req.body;
  
  // 查找激活码
  db.get('SELECT * FROM activation_codes WHERE code = ?', [code], (err, row) => {
    if (err) {
      res.status(500).json({ error: '查询失败' });
      return;
    }
    
    if (!row) {
      res.json({ valid: false, message: '激活码不存在' });
      return;
    }
    
    if (row.status === 'used') {
      res.json({ valid: false, message: '激活码已被使用' });
      return;
    }
    
    if (row.phone && row.phone !== phone) {
      res.json({ valid: false, message: '激活码已绑定其他手机号' });
      return;
    }
    
    // 验证成功，更新激活码状态
    db.run(
      'UPDATE activation_codes SET status = ?, phone = ?, used_at = CURRENT_TIMESTAMP WHERE code = ?',
      ['used', phone, code],
      (err) => {
        if (err) {
          res.status(500).json({ error: '更新激活码状态失败' });
          return;
        }
        res.json({ valid: true, message: '激活码验证成功' });
      }
    );
  });
});

// 获取激活码状态
app.get('/api/code-status/:code', (req, res) => {
  const { code } = req.params;
  
  db.get('SELECT * FROM activation_codes WHERE code = ?', [code], (err, row) => {
    if (err) {
      res.status(500).json({ error: '查询失败' });
      return;
    }
    
    if (!row) {
      res.json({ exists: false });
      return;
    }
    
    res.json({ 
      exists: true, 
      status: row.status, 
      phone: row.phone,
      created_at: row.created_at,
      used_at: row.used_at
    });
  });
});

// 小红书订单回调处理
app.post('/api/xiaohongshu/callback', (req, res) => {
  const { orderId, phone, productId } = req.body;
  
  // 验证请求参数
  if (!orderId || !phone) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }
  
  // 查找可用的激活码
  db.get('SELECT * FROM activation_codes WHERE status = "unused" LIMIT 1', (err, row) => {
    if (err) {
      res.status(500).json({ error: '查询激活码失败' });
      return;
    }
    
    if (!row) {
      res.status(400).json({ error: '暂无可用激活码' });
      return;
    }
    
    const activationCode = row.code;
    
    // 更新激活码状态
    db.run(
      'UPDATE activation_codes SET status = ?, phone = ?, used_at = CURRENT_TIMESTAMP WHERE code = ?',
      ['used', phone, activationCode],
      (err) => {
        if (err) {
          res.status(500).json({ error: '更新激活码状态失败' });
          return;
        }
        
        // 返回激活码给小红书
        res.json({
          success: true,
          orderId,
          activationCode,
          message: '激活码发放成功'
        });
      }
    );
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
