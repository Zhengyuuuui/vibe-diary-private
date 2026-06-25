PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE diaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL CHECK(length(title) <= 20),
      cover_style TEXT NOT NULL DEFAULT 'leather',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    , user_id INTEGER REFERENCES users(id));
INSERT INTO diaries VALUES(1,'午夜书写','leather','2024-01-15 22:00:00',1);
INSERT INTO diaries VALUES(2,'2024 氛围日记','linen','2024-02-01 10:00:00',1);
INSERT INTO diaries VALUES(3,'夏日呓语','pattern','2024-03-20 14:30:00',1);
INSERT INTO diaries VALUES(4,'2026回忆','leather','2026-04-11 08:11:44',1);
INSERT INTO diaries VALUES(6,'0414','leather','2026-04-14 20:18:20',3);
INSERT INTO diaries VALUES(7,'1','leather','2026-04-14 21:58:01',3);
CREATE TABLE pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      diary_id INTEGER NOT NULL,
      content TEXT DEFAULT '',
      page_num INTEGER NOT NULL, updated_at TEXT,
      FOREIGN KEY (diary_id) REFERENCES diaries(id) ON DELETE CASCADE
    );
INSERT INTO pages VALUES(1,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(2,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(3,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(4,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(5,3,'夏天的风带着花香',1,'2026-04-15 15:13:36');
INSERT INTO pages VALUES(6,3,'',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(7,3,'',3,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(8,3,'',4,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(9,2,'',3,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(10,2,'',4,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(11,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(12,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(13,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(14,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(15,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(16,4,'',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(17,4,'我希望你以后别被烦恼困扰',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(18,4,'',3,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(19,4,'',4,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(20,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(21,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(22,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(23,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(24,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(25,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(26,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(27,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(28,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(29,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(30,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(31,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(32,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(33,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(34,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(35,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(36,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(37,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(38,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(39,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(40,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(41,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(42,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(43,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(44,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(45,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(46,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(47,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(48,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(49,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(50,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(51,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(52,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(53,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(54,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(55,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(56,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(57,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(58,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(59,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(60,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(61,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(62,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(63,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(64,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(65,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(66,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(67,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(68,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(69,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(70,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(71,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(72,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(73,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(74,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(75,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(76,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(77,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(78,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(79,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(80,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(81,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(82,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(83,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(84,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(85,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(86,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(87,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(88,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(89,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(90,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(91,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(92,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(93,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(94,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(95,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(96,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(97,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(98,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(99,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(100,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(101,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(102,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(103,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(104,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(105,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(106,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(107,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(108,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(109,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(110,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(111,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(112,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(113,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(114,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(115,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(116,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(117,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(118,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(119,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(120,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(121,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(122,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(123,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(124,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(125,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(126,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(127,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(128,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(129,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(130,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(131,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(132,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(133,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(134,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(135,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(136,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(137,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(138,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(139,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(140,1,'今天窗外的雨模糊了城市的边缘，每一扇窗都变成了一幅水彩画。我在窗边坐了很久，看着灰色的世界呼吸……',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(141,1,'静谧时分，墨见真我。在午夜的灯光下，笔尖触碰纸面的声音是最真实的回响。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(142,2,'新的一年，新的开始。愿每一天都值得被记录，每一刻都值得被珍藏。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(143,2,'清晨的阳光透过窗帘洒落，一杯乌龙茶的香气弥漫在空气中。',2,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(144,3,'夏天的风带着花香，吹过田野和小路。蝉鸣声声，时光仿佛静止。',1,'2026-04-13 15:05:25');
INSERT INTO pages VALUES(161,6,'',1,NULL);
INSERT INTO pages VALUES(162,6,'',2,'2026-04-14 20:18:24');
INSERT INTO pages VALUES(163,6,'',3,'2026-04-14 20:23:34');
INSERT INTO pages VALUES(164,6,'',4,'2026-04-14 20:28:06');
INSERT INTO pages VALUES(165,6,'',5,'2026-04-14 20:34:15');
INSERT INTO pages VALUES(166,6,'',6,'2026-04-14 20:40:01');
INSERT INTO pages VALUES(167,6,'',7,'2026-04-14 20:46:19');
INSERT INTO pages VALUES(168,7,'',1,NULL);
INSERT INTO pages VALUES(169,6,'',8,'2026-04-15 19:46:18');
INSERT INTO pages VALUES(170,6,'',9,'2026-04-15 19:46:19');
INSERT INTO pages VALUES(171,6,'',10,'2026-04-15 19:46:20');
INSERT INTO pages VALUES(172,6,'',11,'2026-04-15 19:50:57');
INSERT INTO pages VALUES(173,6,'',12,'2026-04-15 19:51:06');
INSERT INTO pages VALUES(174,6,'',13,'2026-04-15 20:00:20');
INSERT INTO pages VALUES(175,7,'',2,'2026-04-15 20:00:32');
INSERT INTO pages VALUES(176,7,'',3,'2026-04-15 20:00:34');
INSERT INTO pages VALUES(177,7,'',4,'2026-04-15 20:07:59');
INSERT INTO pages VALUES(178,7,'',5,'2026-04-15 20:08:08');
INSERT INTO pages VALUES(179,7,'',6,'2026-04-15 20:08:16');
INSERT INTO pages VALUES(180,7,'',7,'2026-04-15 20:13:14');
INSERT INTO pages VALUES(181,7,'',8,'2026-04-15 20:20:26');
INSERT INTO pages VALUES(182,7,'',9,'2026-04-15 20:20:27');
INSERT INTO pages VALUES(183,7,'',10,'2026-04-15 20:30:06');
INSERT INTO pages VALUES(184,7,'',11,'2026-04-15 20:30:24');
INSERT INTO pages VALUES(185,7,'',12,'2026-04-15 20:34:50');
INSERT INTO pages VALUES(186,7,'',13,'2026-04-15 20:36:46');
INSERT INTO pages VALUES(187,7,'',14,'2026-04-15 20:42:39');
INSERT INTO pages VALUES(188,7,'',15,'2026-04-15 20:42:58');
INSERT INTO pages VALUES(189,7,'',16,'2026-04-15 21:01:47');
INSERT INTO pages VALUES(190,7,'',17,'2026-04-15 21:11:04');
INSERT INTO pages VALUES(191,7,'',18,'2026-04-15 21:21:24');
INSERT INTO pages VALUES(192,7,'',19,'2026-04-15 21:27:40');
INSERT INTO pages VALUES(193,6,'',14,'2026-04-15 21:32:12');
INSERT INTO pages VALUES(194,7,'',20,'2026-04-15 21:32:45');
INSERT INTO pages VALUES(195,7,'',21,'2026-04-15 21:32:56');
INSERT INTO pages VALUES(196,7,'',22,'2026-04-15 21:39:56');
INSERT INTO pages VALUES(197,7,'',23,'2026-04-15 21:46:05');
INSERT INTO pages VALUES(198,7,'',24,'2026-04-15 21:46:09');
INSERT INTO pages VALUES(199,7,'你好',25,'2026-04-16 09:55:44');
INSERT INTO pages VALUES(200,7,replace('\n','\n',char(10)),26,'2026-04-16 09:55:34');
CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE CHECK(length(username) >= 3),
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      last_login TEXT
    , pen_name TEXT DEFAULT '林间漫步者', bio TEXT DEFAULT '在这数字时代的荒野，记录一抹温柔的呼吸。', avatar TEXT DEFAULT '');
INSERT INTO users VALUES(1,'111','$2b$10$QMKiQtnkZOXoO42kmSH/7.nRIiiF0XeLs1HfjtCwdLMh4u6Ail7Q2','2024-01-01 00:00:00','2026-04-15 14:06:22','111','这个家伙很神秘什么都没留下','/uploads/avatars/1-1775874265591-348868834.jpeg');
INSERT INTO users VALUES(2,'testuser','$2b$10$/WDo1u3qmGOznPVMBWMscOI3MSBUmEnXi3hGbGfe7PM0DB1/firye','2026-04-11 09:08:00',NULL,'testuser','','');
INSERT INTO users VALUES(3,'222','$2b$10$eJe/De8JiKvYwVP3cxiFEeC8MCgKV44L2dlP4OZlf9MRLhvz9.fbG','2026-04-11 16:24:48','2026-04-15 18:51:12','222','这个家伙很神秘什么都没留下','');
CREATE TABLE user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      font_size INTEGER DEFAULT 16 CHECK(font_size >= 12 AND font_size <= 24),
      line_height TEXT DEFAULT 'medium' CHECK(line_height IN ('compact', 'medium', 'relaxed')),
      theme TEXT DEFAULT 'light' CHECK(theme IN ('light', 'dark', 'sepia')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
INSERT INTO user_settings VALUES(1,1,19,'medium','light','2026-04-15 14:06:38');
INSERT INTO user_settings VALUES(2,3,16,'medium','sepia','2026-04-13 18:17:56');
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('diaries',7);
INSERT INTO sqlite_sequence VALUES('pages',200);
INSERT INTO sqlite_sequence VALUES('users',3);
INSERT INTO sqlite_sequence VALUES('user_settings',2);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_diaries_user_id ON diaries(user_id);
COMMIT;
