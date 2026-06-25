# 页面编辑时间 SQLite 迁移问题修复文档

## 问题描述

在添加 `updated_at` 字段时，数据库迁移失败：
❌ pages 表迁移失败: Cannot add a column with non-constant default

## 问题原因

SQLite 的 `ALTER TABLE ADD COLUMN` 有一个限制：**DEFAULT 值必须是常量**，不能使用函数表达式。

**错误写法**：
```sql
ALTER TABLE pages ADD COLUMN updated_at TEXT DEFAULT (datetime('now', 'localtime'))
```

**原因**：`(datetime('now', 'localtime'))` 是一个函数表达式，不是常量。

## ⚠️ 重要限制

**数据库修改限制**：
- ✅ 只允许添加新字段，禁止删除现有字段
- ✅ 只允许添加新索引，禁止删除现有索引
- ✅ 只允许添加新表，禁止删除现有表
- ✅ 必须保持现有数据的完整性
- ✅ 必须保持现有功能的正常运行
- ✅ 迁移必须是幂等的，可安全多次执行

## 修复方案

### 分两步完成迁移

```sql
-- 步骤 1：添加字段（不带默认值）
ALTER TABLE pages ADD COLUMN updated_at TEXT

-- 步骤 2：更新现有记录的时间戳
UPDATE pages SET updated_at = datetime('now', 'localtime') WHERE updated_at IS NULL
```

### 修改后的代码

**文件**：`server/database.js`

**修改位置**：`migratePagesUpdatedAt` 函数

```javascript
function migratePagesUpdatedAt(db) {
  try {
    const tableInfo = db.prepare('PRAGMA table_info(pages)').all();
    const columns = tableInfo.map(col => col.name);
    
    console.log('📋 pages 表当前字段:', columns);
    
    if (!columns.includes('updated_at')) {
      console.log('⏳ 开始为 pages 表添加 updated_at 字段...');
      
      // 步骤 1：添加字段（SQLite ALTER TABLE 不支持函数作为默认值）
      db.exec('ALTER TABLE pages ADD COLUMN updated_at TEXT');
      console.log('✅ updated_at 字段添加成功');
      
      // 步骤 2：更新现有记录的时间戳
      db.exec("UPDATE pages SET updated_at = datetime('now', 'localtime') WHERE updated_at IS NULL");
      console.log('✅ 现有记录的 updated_at 已更新');
      
      // 验证迁移结果
      const newTableInfo = db.prepare('PRAGMA table_info(pages)').all();
      const newColumns = newTableInfo.map(col => col.name);
      console.log('📋 pages 表迁移后字段:', newColumns);
      
      // 检查数据
      const sampleData = db.prepare('SELECT id, updated_at FROM pages LIMIT 3').all();
      console.log('📊 示例数据:', sampleData);
    } else {
      console.log('✅ updated_at 字段已存在，跳过迁移');
      
      // 检查现有数据
      const sampleData = db.prepare('SELECT id, updated_at FROM pages LIMIT 3').all();
      console.log('📊 现有数据示例:', sampleData);
    }
  } catch (error) {
    console.error('❌ pages 表迁移失败:', error.message);
    console.error('❌ 错误堆栈:', error.stack);
  }
}
```

## 迁移前后对比

### 迁移前 pages 表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| diary_id | INTEGER | 日记ID |
| content | TEXT | 页面内容 |
| page_num | INTEGER | 页码 |

### 迁移后 pages 表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| diary_id | INTEGER | 日记ID |
| content | TEXT | 页面内容 |
| page_num | INTEGER | 页码 |
| **updated_at** | **TEXT** | **最后编辑时间（新增）** |

## 数据完整性保证

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 现有字段保留 | ✅ | id, diary_id, content, page_num 全部保留 |
| 现有数据保留 | ✅ | 所有记录的现有数据不变 |
| 新字段添加 | ✅ | updated_at 字段成功添加 |
| 现有记录时间戳 | ✅ | 自动设置为当前时间 |

## 预期日志输出

重启服务器后，控制台应显示：
🚀 数据库初始化开始...

- 数据库路径: /Users/zhengyusheng/Desktop/diary备份/server/data/vibe.db
  ✅ 数据库连接成功
  🔄 准备执行 pages 表迁移...
  📋 pages 表当前字段: [ 'id', 'diary_id', 'content', 'page_num' ]
  ⏳ 开始为 pages 表添加 updated_at 字段...
  ✅ updated_at 字段添加成功
  ✅ 现有记录的 updated_at 已更新
  📋 pages 表迁移后字段: [ 'id', 'diary_id', 'content', 'page_num', 'updated_at' ]
  📊 示例数据: [ { id: 1, updated_at: '2024-xx-xx xx:xx:xx' }, ... ]
  ✅ 所有迁移完成

## 注意事项

1. **幂等性**：迁移函数会检查字段是否存在，可安全多次执行
2. **向后兼容**：新字段添加后，现有代码仍可正常运行
3. **时区处理**：使用 `datetime('now', 'localtime')` 获取本地时间
4. **空值处理**：前端需处理 `updated_at` 为空的情况（虽然迁移后会填充）

## 测试验证

| 测试项 | 预期结果 |
|--------|----------|
| 服务器启动 | 无错误，迁移成功 |
| API 返回数据 | 包含 updated_at 字段 |
| 前端显示 | 页面底部显示编辑时间 |
| 编辑保存 | updated_at 更新为当前时间 |
| 新增页面 | updated_at 设置为当前时间 |