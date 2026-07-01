# Vibe Diary AI Roadmap

更新时间：2026-06-27
最后审计：2026-06-27

---

# Vibe Diary 产品原则

Vibe Diary 首先是一款数字日记产品。

AI 是增强体验的能力，而不是产品本身。

产品核心价值：

* 记录（Record）
* 回忆（Memory）
* 私密（Privacy）

AI 的存在是为了帮助用户更好地回顾自己，而不是替用户记录自己。

---

# 产品哲学

## Record First

先记录。

而不是先分析。

用户愿意写下真实内容，比获得 AI 反馈更重要。

---

## Privacy First

用户的数据属于用户。

默认情况下：

* 不上传给 AI
* 不自动分析
* 不自动生成内容

所有 AI 能力均由用户主动开启。

---

## AI Optional

AI 可选，而非必选。

用户可以：

* 完全关闭 AI
* 只开启部分 AI 功能
* 随时撤销授权

即使不使用 AI：

Vibe Diary 依然是完整可用的产品。

---

# AI 功能优先级规划

---

## P0：AI 权限与隐私开关

状态：优先实现

目标：

让用户决定是否与 AI 共享数据。

设置页增加：

```txt
隐私与 AI

☑ 默认不共享数据给 AI

☐ 开启 AI Reflection

☐ 开启 AI Weekly Review

☐ 开启情绪趋势分析
```

说明：

Vibe Diary 默认不会分析任何日记内容。

只有用户主动开启后，才会将用户选择的内容发送给 AI。

---

建议数据库字段：

```sql
ai_enabled BOOLEAN DEFAULT 0
```

或

```sql
privacy_mode BOOLEAN DEFAULT 1
```

---

## P1：AI Reflection（最优先）

状态：推荐首个 AI 功能

### 后端开发进度

✅ **后端已完成（2026-06-27）**

**已完成的功能**：
- ✅ DeepSeek API Key 配置（server/.env）
- ✅ AI 服务模块（server/services/ai-service.js）
- ✅ AI Reflection 端点（POST /api/v1/ai/reflection）
- ✅ AI 设置验证（检查 ai_enabled 和 ai_reflection_enabled）
- ✅ 数据库查询（获取最近 7 天日记内容）
- ✅ 降级方案（AI 服务失败时返回友好提示）
- ✅ 异常处理（try-catch）
- ✅ 用户隔离（authMiddleware）
- ✅ 用户自定义 API Key 功能（加密存储）
- ✅ API Key 加密工具（AES-256）
- ✅ API Key 端点（GET/PUT/DELETE /api/v1/settings/ai-api-key）
- ✅ **多供应商支持（OpenAI、Anthropic、DeepSeek）**
- ✅ **每日缓存机制（2026-06-28 完成）**
- ✅ **供应商类型字段（ai_provider，默认 deepseek）**
- ✅ **OpenAI 和 Anthropic API 调用模块**
- ✅ **供应商类型端点扩展（settings.js、ai.js）**

**测试结果**：
- ✅ AI Reflection API 正常工作
- ✅ AI 设置验证正常
- ✅ 数据库查询正常
- ✅ 降级方案正常
- ✅ 用户自定义 API Key 功能正常
- ✅ API Key 加密解密正常
- ✅ API Key 端点正常
- ✅ **多供应商功能正常（GET/PUT settings/ai 返回 ai_provider 字段）**
- ✅ **供应商类型更新正常（从 deepseek 更新到 openai/anthropic）**

**审计结果（2026-06-27）**：
- ✅ **审计结论：通过（有条件）**
- ✅ **数据库迁移正确**
- ✅ **多供应商 API 调用完整**
- ✅ **供应商选择逻辑正确**
- ✅ **安全性符合要求**
- ✅ **产品原则符合要求**

**审计发现的问题**：
- ✅ **问题1（已修复）**：错误提示硬编码供应商名称
  - **修复位置**：ai-service.js#L31, ai.js#L76
  - **修复方案**：将硬编码 "DeepSeek API Key" 改为通用 "API Key"
  - **修复时间**：2026-06-27
- ✅ **问题2（已修复）**：降级方案数据结构不一致
  - **修复位置**：ai-service.js#L190-L196
  - **修复方案**：统一降级返回数据结构（添加 fallback 字段，使用 reflection 替代 fallback_message）
  - **修复时间**：2026-06-27
- ✅ **问题3（已处理）**：多供应商 API Key 支持策略不一致
  - **处理方案**：已在 AI Roadmap 中文档说明策略差异
  - **处理时间**：2026-06-27
- ✅ **问题4（已修复）**：.env 缺少环境变量示例
  - **修复位置**：server/.env
  - **修复方案**：补充注释说明各供应商 API Key 配置策略
  - **修复时间**：2026-06-27

**待完成的功能**：
- ⏳ 前端集成（前端已完成，需要对接 API）

**功能状态**：
- ✅ **多供应商支持功能已上线就绪**（所有审计问题已修复）

---

### 用户自定义 API Key 功能

**目的**：项目公开后，开发者无需承担用户 AI 调用费用。

**功能说明**：
- 用户可以在设置中配置自己的 AI API Key（支持 DeepSeek、OpenAI、Anthropic）
- API Key 加密存储（AES-256），安全性高
- 不验证 API Key 有效性，用户自行确保
- 用户未配置 API Key 时提示"请先配置 AI API Key"

**多供应商 API Key 策略**：
- **DeepSeek**：支持用户自定义 API Key 或服务器级 DEEPSEEK_API_KEY 环境变量
- **OpenAI/Anthropic**：仅支持用户自定义 API Key，不支持服务器级配置
- **原因**：避免开发者承担用户 AI 调用费用，确保项目公开后可持续运营
- **注意**：用户切换供应商后，需重新配置对应的 API Key

**API 端点**：

```
GET /api/v1/settings/ai-api-key
PUT /api/v1/settings/ai-api-key
DELETE /api/v1/settings/ai-api-key
```

**加密方式**：
- 算法：AES-256-CBC
- 密钥：从环境变量 ENCRYPTION_KEY 读取
- 存储：加密后的 API Key 存储在数据库

**注意事项**：
- 需要在 server/.env 文件中配置 ENCRYPTION_KEY
- 用户配置 API Key 后，AI Reflection 会使用用户自定义的 API Key
- 用户删除 API Key 后，需要重新配置才能使用 AI 功能

---

**后端 API 端点**：

```
POST /api/v1/ai/reflection
```

**请求头**：
```
Authorization: Bearer <token>
```

**返回示例**：
```json
{
  "code": 200,
  "msg": "分析成功",
  "data": {
    "reflection": "AI 分析结果",
    "model": "deepseek-chat",
    "usage": {
      "prompt_tokens": 123,
      "completion_tokens": 456,
      "total_tokens": 579
    },
    "has_content": true,
    "pages_count": 5
  }
}
```

---

**注意事项**：
- 需要在 server/.env 文件中配置实际的 DEEPSEEK_API_KEY
- 默认关闭 AI 功能，需要用户在设置中开启
- 日记内容长度限制为 3000 字，避免发送过多数据给 AI

---

目标：

帮助用户回顾最近一段时间的自己。

示例：

最近 7 天

最常提到：

* 考试
* 比赛
* 客户

你似乎正在努力平衡学习与项目开发。

虽然压力较大，
但你正在一步步推进自己的目标。

---

特点：

* 开发成本低
* 展示效果好
* 与产品理念高度契合

---

数据来源：

```txt
pages.content
```

无需新增数据库结构。

---

## P1：AI Weekly Review

状态：推荐第二个 AI 功能

目标：

生成每周生活回顾。

示例：

本周记录：

* 日记数量：8篇
* 总字数：3200字

高频主题：

1. 专升本
2. Vibe Diary
3. 客户项目

关键词：

* 成长
* 坚持
* 压力
* 期待

---

特点：

符合用户复盘场景。

能够强化产品的长期价值。

---

## P2：AI 关键词提取

状态：后端已完成

目标：

自动提取日记关键词。

示例：

输入：

今天调试项目很久，
晚上复习英语，
还和客户沟通需求。

输出：

#开发
#学习
#客户

---

### 后端开发进度

✅ **后端已完成（2026-06-27）**

**已完成的功能**：
- ✅ AI Reflection API 已扩展，支持关键词提取
- ✅ keywords 字段已添加到返回数据（最多5个关键词）
- ✅ Prompt 已修改，让 AI 同时提取关键词和情绪趋势
- ✅ 数据验证函数已添加，确保关键词数组格式正确

**API 端点**：
- `POST /api/v1/ai/reflection` - 返回数据包含 keywords 字段

**返回数据示例**：
```json
{
  "code": 200,
  "msg": "分析成功",
  "data": {
    "keywords": ["压力", "美食", "雨景", "水彩画", "灰色世界"],
    ...
  }
}
```

**待完成的功能**：
- ⏳ 前端集成（关键词展示、标签搜索、趋势统计）

---

未来可用于：

* 历史上的今天
* 标签搜索
* 趋势统计
* AI Reflection

---

## P2：情绪趋势图

状态：后端已完成

目标：

帮助用户观察长期状态变化。

推荐方案：

```txt
最近30天

平静 ████████

期待 ██████

焦虑 ███

兴奋 ████
```

---

### 后端开发进度

✅ **后端已完成（2026-06-27）**

**已完成的功能**：
- ✅ AI Reflection API 已扩展，支持情绪趋势分析
- ✅ emotion_trend 字段已添加到返回数据（统计6种情绪：calm、happy、sad、anxious、inspired、reflective）
- ✅ Prompt 已修改，让 AI 分析日记中每种情绪的出现次数（0-10）
- ✅ 数据验证函数已添加，确保情绪趋势数据格式正确

**API 端点**：
- `POST /api/v1/ai/reflection` - 返回数据包含 emotion_trend 字段

**返回数据示例**：
```json
{
  "code": 200,
  "msg": "分析成功",
  "data": {
    "emotion_trend": {
      "calm": 1,
      "happy": 0,
      "sad": 0,
      "anxious": 1,
      "inspired": 0,
      "reflective": 2
    },
    ...
  }
}
```

**情绪状态说明**：
- calm: 平静
- happy: 开心
- sad: 悲伤
- anxious: 焦虑
- inspired: 充满灵感
- reflective: 深思

**待完成的功能**：
- ⏳ 前端集成（情绪趋势图展示、可视化图表）

---

不推荐：

```txt
开心 78%
焦虑 22%
```

原因：

过于机械。

容易削弱产品温度。

---

## P3：AI 提问引导

目标：

帮助用户进行深度复盘。

示例：

今天最值得感谢的人是谁？

今天最大的收获是什么？

如果重来一次，你会怎么做？

---

说明：

作为辅助功能即可。

无需优先开发。

---

# 不推荐优先开发的功能

## AI Chat

原因：

Vibe Diary 不是聊天机器人。

聊天能力无法形成产品差异化。

---

## AI Agent

原因：

开发成本高。

与当前比赛目标关联较弱。

---

## AI 自动写日记

原因：

违背产品理念。

Vibe Diary 希望帮助用户记录自己。

而不是让 AI 替用户记录自己。

---

# 当前比赛阶段重点

距离最终 Demo：

2026-07-15

---

优先级：

P0

* 数据库稳定性检查
* 用户权限检查
* AI 隐私开关

P1

* AI Reflection
* AI Weekly Review

P2

* AI 关键词提取

P3

* 情绪趋势图
* AI 提问引导

---

# 一句话原则

不要把 Vibe Diary 做成另一个 AI 产品。

而要把它做成最好的 Vibe Diary。

记录优先。

回忆优先。

隐私优先。

AI 可选。
