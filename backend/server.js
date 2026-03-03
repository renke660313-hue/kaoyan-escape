const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const app = express();
// 修复点 1: Railway 必须使用 process.env.PORT
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors()); 
app.use(bodyParser.json());

// 数据库连接
const db = new sqlite3.Database('./activation_codes.db', (err) => {
    if (err) console.error('数据库连接失败:', err.message);
    else {
        console.log('数据库连接成功');
        initDatabase();
    }
});

function initDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS activation_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        phone TEXT,
        status TEXT DEFAULT 'unused',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP
    )`);
}

// 生成激活码
function generateActivationCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// 批量生成
app.post('/api/generate-codes', (req, res) => {
    const { count = 1 } = req.body;
    const codes = [];
    for (let i = 0; i < count; i++) {
        const code = generateActivationCode();
        db.run('INSERT INTO activation_codes (code) VALUES (?)', [code]);
        codes.push(code);
    }
    res.json({ success: true, codes });
});

// 修复点 2: 合并后的验证逻辑 (解决万能码和普通码冲突)
app.post('/api/verify-code', (req, res) => {
    const { phone, code } = req.body;

    if (!phone || !code) {
        return res.status(400).json({ valid: false, message: '手机号和激活码不能为空' });
    }

    // 万能码直接通过
    if (code === 'KAOYAN2024') {
        return res.json({ valid: true, message: '万能码验证成功' });
    }

    // 查询数据库
    db.get('SELECT * FROM activation_codes WHERE code = ?', [code], (err, row) => {
        if (err) return res.status(500).json({ error: '查询失败' });
        if (!row) return res.json({ valid: false, message: '激活码不存在' });
        if (row.status === 'used' && row.phone !== phone) {
            return res.json({ valid: false, message: '该激活码已被其他手机号使用' });
        }

        // 验证通过，更新状态
        db.run(
            'UPDATE activation_codes SET status = ?, phone = ?, used_at = CURRENT_TIMESTAMP WHERE code = ?',
            ['used', phone, code],
            (updateErr) => {
                if (updateErr) return res.status(500).json({ error: '更新失败' });
                res.json({ valid: true, message: '激活成功' });
            }
        );
    });
});

app.listen(PORT, () => {
    console.log(`服务器运行在端口: ${PORT}`);
});
