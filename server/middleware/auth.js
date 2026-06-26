const jwt = require('jsonwebtoken');

// 移除硬编码默认值，强制要求环境变量
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET 环境变量未设置，服务拒绝启动。请在 .env 文件中设置 JWT_SECRET。');
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      msg: '未提供认证令牌',
      data: null
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      msg: '令牌无效或已过期',
      data: null
    });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
