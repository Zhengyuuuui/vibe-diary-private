const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

function initDb(dbPath) {
  console.log('🚀 数据库初始化开始...');
  console.log('  - 数据库路径:', dbPath);
  
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  console.log('✅ 数据库连接成功');

  db.exec(`
    CREATE TABLE IF NOT EXISTS diaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL CHECK(length(title) <= 20),
      cover_style TEXT NOT NULL DEFAULT 'leather',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      diary_id INTEGER NOT NULL,
      content TEXT DEFAULT '',
      page_num INTEGER NOT NULL,
      FOREIGN KEY (diary_id) REFERENCES diaries(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE CHECK(length(username) >= 3),
      password_hash TEXT NOT NULL,
      pen_name TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      font_size INTEGER DEFAULT 16 CHECK(font_size >= 12 AND font_size <= 24),
      line_height TEXT DEFAULT 'medium' CHECK(line_height IN ('compact', 'medium', 'relaxed')),
      theme TEXT DEFAULT 'light' CHECK(theme IN ('light', 'dark', 'sepia')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
  `);

  const defaultUser = db.prepare('SELECT id FROM users WHERE username = ?').get('111');
  let defaultUserId = defaultUser?.id;
  
  if (!defaultUser) {
    const passwordHash = bcrypt.hashSync('123456', 10);
    const result = db.prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)').run(
      '111',
      passwordHash,
      '2024-01-01 00:00:00'
    );
    defaultUserId = result.lastInsertRowid;
  }

  const existingDiaries = db.prepare('SELECT COUNT(*) AS count FROM diaries').get().count;
  if (existingDiaries === 0 && defaultUserId) {
    db.prepare('INSERT INTO diaries (user_id, title, cover_style, created_at) VALUES (?, ?, ?, ?)').run(
      defaultUserId, '午夜书写', 'leather', '2024-01-15 22:00:00'
    );
    db.prepare('INSERT INTO diaries (user_id, title, cover_style, created_at) VALUES (?, ?, ?, ?)').run(
      defaultUserId, '2024 氛围日记', 'linen', '2024-02-01 10:00:00'
    );
    db.prepare('INSERT INTO diaries (user_id, title, cover_style, created_at) VALUES (?, ?, ?, ?)').run(
      defaultUserId, '夏日呓语', 'pattern', '2024-03-20 14:30:00'
    );

    db.prepare('INSERT INTO pages (diary_id, content, page_num) VALUES (?, ?, ?)').run(
      1, '今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……', 1
    );
    db.prepare('INSERT INTO pages (diary_id, content, page_num) VALUES (?, ?, ?)').run(
      1, '静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。', 2
    );
    db.prepare('INSERT INTO pages (diary_id, content, page_num) VALUES (?, ?, ?)').run(
      2, '新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。', 1
    );
    db.prepare('INSERT INTO pages (diary_id, content, page_num) VALUES (?, ?, ?)').run(
      2, '清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。', 2
    );
    db.prepare('INSERT INTO pages (diary_id, content, page_num) VALUES (?, ?, ?)').run(
      3, '夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。', 1
    );
  }

  migrateOldUsers(db);
  migrateUserProfiles(db);
  migrateDiariesToUsers(db);
  
  console.log('🔄 准备执行 pages 表迁移...');
  migratePagesUpdatedAt(db);
  console.log('✅ 所有迁移完成');

  migrateFavoritesTable(db);

  return db;
}

function migrateOldUsers(db) {
  try {
    const tableInfo = db.prepare('PRAGMA table_info(users)').all();
    const columns = tableInfo.map(col => col.name);
    
    if (!columns.includes('pen_name')) {
      db.exec('ALTER TABLE users ADD COLUMN pen_name TEXT DEFAULT \'\'');
    }
    
    if (!columns.includes('bio')) {
      db.exec('ALTER TABLE users ADD COLUMN bio TEXT DEFAULT \'\'');
    }
    
    if (!columns.includes('avatar')) {
      db.exec('ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT \'\'');
    }
  } catch (error) {
    console.log('Migration check:', error.message);
  }
}

function migrateUserProfiles(db) {
  try {
    const oldDefaultPenName = '林间漫步者';
    const oldDefaultBio = '在这数字时代的荒野，记录一抹温柔的呼吸。';
    
    const users = db.prepare(
      'SELECT id, username, pen_name, bio FROM users WHERE pen_name = ? OR bio = ?'
    ).all(oldDefaultPenName, oldDefaultBio);
    
    if (users.length > 0) {
      console.log(`发现 ${users.length} 个用户需要迁移个性化数据...`);
      
      const updateStmt = db.prepare(
        'UPDATE users SET pen_name = ?, bio = ? WHERE id = ?'
      );
      
      users.forEach(user => {
        const newPenName = user.pen_name === oldDefaultPenName ? user.username : user.pen_name;
        const newBio = user.bio === oldDefaultBio ? '' : user.bio;
        
        updateStmt.run(newPenName, newBio, user.id);
        console.log(`已迁移用户 ${user.username} 的数据`);
      });
      
      console.log('用户数据迁移完成');
    }
  } catch (error) {
    console.error('用户数据迁移失败:', error.message);
  }
}

function migrateDiariesToUsers(db) {
  try {
    const tableInfo = db.prepare('PRAGMA table_info(diaries)').all();
    const columns = tableInfo.map(col => col.name);
    
    if (!columns.includes('user_id')) {
      console.log('开始迁移日记数据到用户...');
      
      db.exec('ALTER TABLE diaries ADD COLUMN user_id INTEGER REFERENCES users(id)');
      
      const firstUser = db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get();
      
      if (firstUser) {
        db.prepare('UPDATE diaries SET user_id = ? WHERE user_id IS NULL').run(firstUser.id);
        console.log(`已将现有日记分配给用户 ID: ${firstUser.id}`);
      }
      
      db.exec('CREATE INDEX IF NOT EXISTS idx_diaries_user_id ON diaries(user_id)');
      
      console.log('日记数据迁移完成');
    }
  } catch (error) {
    console.error('日记数据迁移失败:', error.message);
  }
}

function migratePagesUpdatedAt(db) {
  try {
    const tableInfo = db.prepare('PRAGMA table_info(pages)').all();
    const columns = tableInfo.map(col => col.name);
    
    console.log('📋 pages 表当前字段:', columns);
    
    if (!columns.includes('updated_at')) {
      console.log('⏳ 开始为 pages 表添加 updated_at 字段...');
      
      // SQLite ALTER TABLE 不支持函数作为默认值，需要分两步
      // 1. 先添加字段，默认为 NULL
      db.exec('ALTER TABLE pages ADD COLUMN updated_at TEXT');
      console.log('✅ updated_at 字段添加成功');
      
      // 2. 更新现有记录的时间戳
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

function migrateFavoritesTable(db) {
  try {
    const tableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='favorites'"
    ).get();
    
    if (!tableExists) {
      console.log('⏳ 开始创建 favorites 表...');
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('quote', 'image', 'vertical', 'featured', 'minimal')),
          title TEXT,
          content TEXT NOT NULL,
          source TEXT,
          image TEXT,
          badge TEXT,
          tags TEXT,
          mood TEXT,
          diary_id INTEGER,
          page_id INTEGER,
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (diary_id) REFERENCES diaries(id) ON DELETE SET NULL,
          FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
        CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(type);
        CREATE INDEX IF NOT EXISTS idx_favorites_mood ON favorites(mood);
        CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at);
      `);
      
      console.log('✅ favorites 表创建成功');
      
      const firstUser = db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get();
      if (firstUser) {
        migrateStaticFavorites(db, firstUser.id);
      }
    } else {
      console.log('✅ favorites 表已存在，跳过创建');
    }
  } catch (error) {
    console.error('❌ favorites 表迁移失败:', error.message);
    console.error('❌ 错误堆栈:', error.stack);
  }
}

function migrateStaticFavorites(db, userId) {
  try {
    const existingFavorites = db.prepare('SELECT COUNT(*) AS count FROM favorites').get().count;
    
    if (existingFavorites === 0) {
      console.log('⏳ 开始迁移静态收藏数据...');
      
      const staticFavorites = [
        {
          type: 'quote',
          content: '"这里的阳光有一种陈旧的香气，像是翻开了一本很久没读的旧书。"',
          source: '《午后书屋》',
          created_at: '2023-11-02 10:00:00'
        },
        {
          type: 'image',
          title: '窗外的浮光',
          content: '这一刻，时间仿佛停滞了。我看着光斑在墙上缓慢移动，思考着关于存在的意义。',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6gxl3rHNUZg3Lk25xRkgVvwbgT5DEk6LT5UX0qgxhcRdXeV7z1U7XZNo_cOl2KRdNyh_D_Hkpi4M1xlJdLtk_w_48T-xAMQ7BbPXUDmIEyY-1U4YgTFPx7v-AuZnpdAGqLQZaGZTSaNc--XQaYypL8Ns-VutPJYqqxUOZRYi_1TS0D6nD33zct2LAgO-Xj2JU_O2zPW-dLWb2IBwllGrGnu_cIR5BajjkbX0Nkq-KtWVBYIQdN_8TlCXS2xoZKQw6wdQCnMurCx4',
          created_at: '2023-10-28 14:00:00'
        },
        {
          type: 'vertical',
          title: '静谧之森',
          content: '大雨过后的山林，充满了泥土与雪松的味道。呼吸变得如此轻盈。',
          created_at: '2023-12-15 09:00:00'
        },
        {
          type: 'featured',
          title: '在京都的那个雨后，我遇见了自己。',
          content: '"生活不只是生存，更是在每一个微小的瞬间里，找到灵魂的归处。"',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAx_YknSxDGuzF0tw6U-Wzyx7D6j_twI-8CnkRkcipmW1EG2QaqSI-Epf16T9a1U2gD0GNFgb-N8BhIvyT4WGRVkcubQx7QILvKiBPMMjC9e5inQOuzqDk0zlhPNzBrmKqdD22LakDTDt_R4JeC9O_6GH3rkvK-MrQoOzp12e4cfiicdIovDC5VSXjHnntlp5UTPGMfAl6RWuid8c0g4lMWwicw9_fFP54zO9lm9cZe6Sfpjv9qhtcrdTNJV66iwrmMWjKi-Yg0rY4',
          badge: '年度精选',
          created_at: '2023-09-12 16:00:00'
        },
        {
          type: 'minimal',
          content: '"有时候，沉默是比言语更动人的叙述。"',
          tags: JSON.stringify(['冥想', '夜读']),
          created_at: '2024-01-05 20:00:00'
        }
      ];
      
      const stmt = db.prepare(`
        INSERT INTO favorites (user_id, type, title, content, source, image, badge, tags, mood, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      staticFavorites.forEach(fav => {
        stmt.run(
          userId,
          fav.type,
          fav.title || null,
          fav.content,
          fav.source || null,
          fav.image || null,
          fav.badge || null,
          fav.tags || null,
          fav.mood || null,
          fav.created_at
        );
      });
      
      console.log('✅ 静态收藏数据迁移成功');
    }
  } catch (error) {
    console.error('❌ 静态数据迁移失败:', error.message);
  }
}

module.exports = initDb;
