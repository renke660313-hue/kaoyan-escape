const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
// 使用环境变量指定端口，默认为 3001
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());
// 提供静态文件
app.use(express.static(__dirname));

// 内存存储作为后备
const inMemoryStorage = {
  activationCodes: [],
  users: []
};

// 数据库连接
let db = null;
let useMemoryStorage = true;

try {
  const mysql = require('mysql2');
  db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kaoyan_words',
    port: process.env.DB_PORT || 3306
  });
  
  db.connect((err) => {
    if (err) {
      console.error('数据库连接失败，使用内存存储:', err.message);
      useMemoryStorage = true;
    } else {
      console.log('数据库连接成功');
      useMemoryStorage = false;
      initDatabase();
    }
  });
} catch (error) {
  console.error('数据库模块加载失败，使用内存存储:', error.message);
  useMemoryStorage = true;
}

// 初始化数据库
function initDatabase() {
  if (useMemoryStorage) return;
  
  // 创建激活码表
  db.query(`
    CREATE TABLE IF NOT EXISTS activation_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(255),
      status VARCHAR(255) DEFAULT 'unused',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      used_at TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('创建激活码表失败:', err.message);
    } else {
      console.log('激活码表初始化成功');
    }
  });
  
  // 创建用户表
  db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      phone VARCHAR(255) UNIQUE NOT NULL,
      mastered_words TEXT DEFAULT '[]',
      favorite_words TEXT DEFAULT '[]',
      reading_progress TEXT DEFAULT '{"storyId": 1, "lastReadTime": 0}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('创建用户表失败:', err.message);
    } else {
      console.log('用户表初始化成功');
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
  
  if (useMemoryStorage) {
    // 使用内存存储
    codes.forEach(code => {
      inMemoryStorage.activationCodes.push({
        code,
        phone: null,
        status: 'unused',
        created_at: new Date(),
        used_at: null
      });
    });
    res.json({ success: true, codes });
  } else {
    // 插入数据库
    const query = 'INSERT INTO activation_codes (code) VALUES (?)';
    let errors = [];
    let completed = 0;
    
    codes.forEach(code => {
      db.query(query, [code], (err) => {
        if (err) {
          errors.push(err.message);
        }
        completed++;
        
        if (completed === codes.length) {
          if (errors.length > 0) {
            res.status(500).json({ error: '生成激活码失败', details: errors });
          } else {
            res.json({ success: true, codes });
          }
        }
      });
    });
  }
});

// 验证激活码
app.post('/api/verify-code', (req, res) => {
  const { phone, code } = req.body;
  
  if (useMemoryStorage) {
    // 使用内存存储
    const activationCode = inMemoryStorage.activationCodes.find(ac => ac.code === code);
    if (!activationCode) {
      res.json({ valid: false, message: '激活码不存在' });
      return;
    }
    
    if (activationCode.status === 'used') {
      res.json({ valid: false, message: '激活码已被使用' });
      return;
    }
    
    if (activationCode.phone && activationCode.phone !== phone) {
      res.json({ valid: false, message: '激活码已绑定其他手机号' });
      return;
    }
    
    // 验证成功，更新激活码状态
    activationCode.status = 'used';
    activationCode.phone = phone;
    activationCode.used_at = new Date();
    res.json({ valid: true, message: '激活码验证成功' });
  } else {
    // 查找激活码
    db.query('SELECT * FROM activation_codes WHERE code = ?', [code], (err, rows) => {
      if (err) {
        res.status(500).json({ error: '查询失败' });
        return;
      }
      
      const row = rows[0];
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
      db.query(
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
  }
});

// 获取激活码状态
app.get('/api/code-status/:code', (req, res) => {
  const { code } = req.params;
  
  if (useMemoryStorage) {
    // 使用内存存储
    const activationCode = inMemoryStorage.activationCodes.find(ac => ac.code === code);
    if (!activationCode) {
      res.json({ exists: false });
      return;
    }
    
    res.json({ 
      exists: true, 
      status: activationCode.status, 
      phone: activationCode.phone,
      created_at: activationCode.created_at,
      used_at: activationCode.used_at
    });
  } else {
    db.query('SELECT * FROM activation_codes WHERE code = ?', [code], (err, rows) => {
      if (err) {
        res.status(500).json({ error: '查询失败' });
        return;
      }
      
      const row = rows[0];
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
  }
});

// 小红书订单回调处理
app.post('/api/xiaohongshu/callback', (req, res) => {
  const { orderId, phone, productId } = req.body;
  
  // 验证请求参数
  if (!orderId || !phone) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }
  
  if (useMemoryStorage) {
    // 使用内存存储
    const activationCode = inMemoryStorage.activationCodes.find(ac => ac.status === 'unused');
    if (!activationCode) {
      res.status(400).json({ error: '暂无可用激活码' });
      return;
    }
    
    activationCode.status = 'used';
    activationCode.phone = phone;
    activationCode.used_at = new Date();
    
    // 检查用户是否存在，不存在则创建
    let user = inMemoryStorage.users.find(u => u.phone === phone);
    if (!user) {
      user = {
        phone,
        mastered_words: '[]',
        favorite_words: '[]',
        reading_progress: '{"storyId": 1, "lastReadTime": 0}',
        created_at: new Date(),
        updated_at: new Date()
      };
      inMemoryStorage.users.push(user);
    }
    
    // 返回激活码给小红书
    res.json({
      success: true,
      orderId,
      activationCode: activationCode.code,
      message: '激活码发放成功'
    });
  } else {
    // 查找可用的激活码
    db.query('SELECT * FROM activation_codes WHERE status = "unused" LIMIT 1', (err, rows) => {
      if (err) {
        res.status(500).json({ error: '查询激活码失败' });
        return;
      }
      
      const row = rows[0];
      if (!row) {
        res.status(400).json({ error: '暂无可用激活码' });
        return;
      }
      
      const activationCode = row.code;
      
      // 更新激活码状态
      db.query(
        'UPDATE activation_codes SET status = ?, phone = ?, used_at = CURRENT_TIMESTAMP WHERE code = ?',
        ['used', phone, activationCode],
        (err) => {
          if (err) {
            res.status(500).json({ error: '更新激活码状态失败' });
            return;
          }
          
          // 检查用户是否存在，不存在则创建
          db.query('SELECT * FROM users WHERE phone = ?', [phone], (err, userRows) => {
            if (err) {
              console.error('查询用户失败:', err.message);
            } else if (userRows.length === 0) {
              // 创建新用户
              db.query(
                'INSERT INTO users (phone) VALUES (?)',
                [phone],
                (err) => {
                  if (err) {
                    console.error('创建用户失败:', err.message);
                  }
                }
              );
            }
          });
          
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
  }
});

// 获取用户数据
app.get('/api/user/:phone', (req, res) => {
  const { phone } = req.params;
  
  if (useMemoryStorage) {
    // 使用内存存储
    let user = inMemoryStorage.users.find(u => u.phone === phone);
    if (!user) {
      // 如果用户不存在，创建新用户
      user = {
        phone,
        mastered_words: '[]',
        favorite_words: '[]',
        reading_progress: '{"storyId": 1, "lastReadTime": 0}',
        created_at: new Date(),
        updated_at: new Date()
      };
      inMemoryStorage.users.push(user);
      
      // 返回新创建的用户数据
      res.json({
        phone,
        masteredWords: [],
        favoriteWords: [],
        readingProgress: { storyId: 1, lastReadTime: Date.now() }
      });
    } else {
      // 返回用户数据
      res.json({
        phone: user.phone,
        masteredWords: JSON.parse(user.mastered_words),
        favoriteWords: JSON.parse(user.favorite_words),
        readingProgress: JSON.parse(user.reading_progress)
      });
    }
  } else {
    db.query('SELECT * FROM users WHERE phone = ?', [phone], (err, rows) => {
      if (err) {
        res.status(500).json({ error: '查询用户失败' });
        return;
      }
      
      const user = rows[0];
      if (!user) {
        // 如果用户不存在，创建新用户
        db.query('INSERT INTO users (phone) VALUES (?)', [phone], (err, result) => {
          if (err) {
            res.status(500).json({ error: '创建用户失败' });
            return;
          }
          
          // 返回新创建的用户数据
          res.json({
            phone,
            masteredWords: [],
            favoriteWords: [],
            readingProgress: { storyId: 1, lastReadTime: Date.now() }
          });
        });
      } else {
        // 返回用户数据
        res.json({
          phone: user.phone,
          masteredWords: JSON.parse(user.mastered_words),
          favoriteWords: JSON.parse(user.favorite_words),
          readingProgress: JSON.parse(user.reading_progress)
        });
      }
    });
  }
});

// 更新用户数据
app.post('/api/user/:phone', (req, res) => {
  const { phone } = req.params;
  const { masteredWords, favoriteWords, readingProgress } = req.body;
  
  if (useMemoryStorage) {
    // 使用内存存储
    let user = inMemoryStorage.users.find(u => u.phone === phone);
    if (!user) {
      // 如果用户不存在，创建新用户
      user = {
        phone,
        mastered_words: JSON.stringify(masteredWords || []),
        favorite_words: JSON.stringify(favoriteWords || []),
        reading_progress: JSON.stringify(readingProgress || { storyId: 1, lastReadTime: Date.now() }),
        created_at: new Date(),
        updated_at: new Date()
      };
      inMemoryStorage.users.push(user);
      res.json({ success: true, message: '用户数据创建成功' });
    } else {
      // 更新用户数据
      user.mastered_words = JSON.stringify(masteredWords || []);
      user.favorite_words = JSON.stringify(favoriteWords || []);
      user.reading_progress = JSON.stringify(readingProgress || { storyId: 1, lastReadTime: Date.now() });
      user.updated_at = new Date();
      res.json({ success: true, message: '用户数据更新成功' });
    }
  } else {
    // 检查用户是否存在
    db.query('SELECT * FROM users WHERE phone = ?', [phone], (err, rows) => {
      if (err) {
        res.status(500).json({ error: '查询用户失败' });
        return;
      }
      
      if (rows.length === 0) {
        // 如果用户不存在，创建新用户
        db.query(
          'INSERT INTO users (phone, mastered_words, favorite_words, reading_progress) VALUES (?, ?, ?, ?)',
          [phone, JSON.stringify(masteredWords || []), JSON.stringify(favoriteWords || []), JSON.stringify(readingProgress || { storyId: 1, lastReadTime: Date.now() })],
          (err) => {
            if (err) {
              res.status(500).json({ error: '创建用户失败' });
              return;
            }
            res.json({ success: true, message: '用户数据创建成功' });
          }
        );
      } else {
        // 更新用户数据
        db.query(
          'UPDATE users SET mastered_words = ?, favorite_words = ?, reading_progress = ? WHERE phone = ?',
          [JSON.stringify(masteredWords || []), JSON.stringify(favoriteWords || []), JSON.stringify(readingProgress || { storyId: 1, lastReadTime: Date.now() }), phone],
          (err) => {
            if (err) {
              res.status(500).json({ error: '更新用户数据失败' });
              return;
            }
            res.json({ success: true, message: '用户数据更新成功' });
          }
        );
      }
    });
  }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
});