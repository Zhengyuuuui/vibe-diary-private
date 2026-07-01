/**
 * 加密工具模块
 * 使用 AES-256 加密算法加密用户自定义 API Key
 */

const crypto = require('crypto');

// 加密密钥（从环境变量读取）
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// 加密算法
const ALGORITHM = 'aes-256-cbc';

/**
 * 加密文本
 * @param {string} text - 需要加密的文本
 * @returns {string} - 加密后的文本（hex 格式）
 */
function encrypt(text) {
  try {
    // 验证加密密钥
    if (!ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY 未配置，请在 server/.env 文件中设置');
    }

    // 生成随机 IV（初始化向量）
    const iv = crypto.randomBytes(16);

    // 创建加密器
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // 加密
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // 返回加密结果（IV + 加密文本）
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('❌ 加密失败:', error.message);
    throw new Error('加密失败');
  }
}

/**
 * 解密文本
 * @param {string} encryptedText - 加密后的文本（hex 格式）
 * @returns {string} - 解密后的文本
 */
function decrypt(encryptedText) {
  try {
    // 验证加密密钥
    if (!ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY 未配置，请在 server/.env 文件中设置');
    }

    // 分割 IV 和加密文本
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('加密文本格式错误');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    // 创建解密器
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // 解密
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('❌ 解密失败:', error.message);
    throw new Error('解密失败');
  }
}

/**
 * 验证加密文本格式
 * @param {string} encryptedText - 加密后的文本
 * @returns {boolean} - 是否为有效的加密文本
 */
function isValidEncryptedText(encryptedText) {
  try {
    if (!encryptedText || typeof encryptedText !== 'string') {
      return false;
    }

    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      return false;
    }

    // 验证 IV 是否为有效的 hex 格式
    const iv = Buffer.from(parts[0], 'hex');
    if (iv.length !== 16) {
      return false;
    }

    // 验证加密文本是否为有效的 hex 格式
    Buffer.from(parts[1], 'hex');

    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  encrypt,
  decrypt,
  isValidEncryptedText
};