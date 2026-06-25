# 氛围日记 (Vibe Diary) - 开发限制 & 约束文档（Vibe Coding 边界锁死）

> **📋 AI 阅读指南**
> 本文档是 Vibe Coding 开发的**技术边界红线**，所有编码决策必须在此约束内进行。
> - **核心路径：**
>   - 设计稿：`/Users/zhengyusheng/Desktop/diary/stitch_vibe_diary_bookshelf`
>   - 核心库：`/Users/zhengyusheng/Desktop/diary/StPageFlip-master`

---

## 一、技术栈与版本锁定

### 前端技术栈

| 类别 | 技术 | 推荐版本 | 用途 |
| ---- | ---- | -------- | ---- |
| 框架 | UniApp (Vue3 + Vite) | Vue 3.4+ | 核心跨端框架 |
| **翻页库** | **StPageFlip** | **本地源码** | **位于 /StPageFlip-master** |
| UI 库 | Tailwind CSS | 3.x | 样式与拟物化质感实现 |
| 状态管理 | Pinia | 2.x | 跨页面日记状态共享 |

### 后端技术栈

| 类别 | 技术 | 推荐版本 | 用途 |
| ---- | ---- | -------- | ---- |
| 运行时 | Node.js | 18 LTS+ | 服务端运行环境 |
| 框架 | Express | 4.x | RESTful API 框架 |
| 数据库 | **SQLite** | 3.x | **本地轻量级数据库文件** |

### 禁止引入的依赖

| 禁止项 | 原因 |
| ------ | ---- |
| npm 远程版 st-page-flip | 必须使用指定的本地 master 源码版本以确保 Vibe 一致性 |
| Element Plus 或 Ant Design | 破坏拟物化设计风格，样式过于“网页感” |

---

## 二、前端编码约束

### （一）核心库引用约束【强制】
- 必须通过 `file:` 协议或直接导入本地路径 `/Users/zhengyusheng/Desktop/diary/StPageFlip-master`。
- 在 Vue 组件中，必须在 `onMounted` 钩子内实例化 `PageFlip` 类。

### （二）样式规范约束【强制】
- **颜色锁死**：背景渐变必须使用 `#FAF9F6` 至 `#F3EFE0`。
- **尺寸单位**：使用 `rpx` 以适配移动端，但书本比例必须锁定为 `3:4`。
- **UI 参考**：直接提取 `stitch_vibe_diary_bookshelf` 中的 `.shadow-layered` 相关 CSS。

---

## 三、后端编码约束

### （一）架构约束【强制】
- 数据库文件存放在 `server/data/vibe.db`。
- 接口统一前缀 `/api/v1`。

### （二）接口规范约束【强制】

#### 统一返回格式
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
接口规则单次日记保存请求体积必须 ≤ 100KB。列表接口分页单页 ≤ 20 条日记。四、安全约束【强制】输入过滤：对日记内容进行 XSS 过滤。SQL 注入：使用 sqlite3 的参数化查询（如 db.run('INSERT...?', [val])）。五、目录结构/diary
  /stitch_vibe_diary_bookshelf   <-- UI 蓝图
  /StPageFlip-master             <-- 动画心脏
  /client                        <-- 前端项目
  /server                        <-- 后端项目
    /data/vibe.db
六、负面清单（禁止项）编号禁止事项原因BAN-101字符串拼接 SQL严防 SQL 注入风险BAN-102在页面组件中写原生 SQL必须通过 API 转发BAN-103移除本地库路径引用破坏项目可移植性
---

# 3. MVP 验收标准文档（ACCEPTANCE-CRITERIA）

```markdown
# 氛围日记 (Vibe Diary) - MVP 验收标准文档

---

## 一、功能验收标准

### AC-001：书架拟物化展示 (F-001)

| 场景 | 操作步骤 | 预期结果 | 判定标准 |
| ---- | -------- | -------- | -------- |
| 视觉一致性 | 打开浏览器访问首页 | 背景颜色、书本投影与 Stitch 项目完全一致 | ✅ 样式复刻成功 |
| 响应式检查 | 拉伸浏览器至手机宽度 | 栅格自动从多列降为单/双列 | ✅ 布局自适应 |

### AC-002：StPageFlip 物理动画 (F-002)

| 场景 | 操作步骤 | 预期结果 | 判定标准 |
| ---- | -------- | -------- | -------- |
| 物理模拟 | 鼠标/手指拖拽书本边缘 | 纸张产生动态弧度、背光处有阴影变化 | ✅ 动画流畅无卡顿 |
| 源码调用 | 检查 Network 载入资源 | 确认加载的是本地 `/StPageFlip-master` 资源 | ✅ 引用路径正确 |

### AC-003：日记内容持久化 (F-003)

| 场景 | 操作步骤 | 预期结果 | 判定标准 |
| ---- | -------- | -------- | -------- |
| 自动保存 | 在日记页输入一段话，刷新页面 | 重新进入后内容依然保留 | ✅ SQLite 写入成功 |

---

## 二、性能验收标准

| 编号 | 指标 | 要求 | 验证方法 | 判定标准 |
| ---- | ---- | ---- | -------- | -------- |
| PERF-001 | 翻页流畅度 | 60 FPS | Chrome Performance | ✅ 稳定无掉帧 |
| PERF-002 | 首屏渲染 | ≤ 1.0s | Lighthouse 测试 | ✅ 达标 |

---

## 三、代码规范验收标准

| 编号 | 检查项 | 要求 | 判定标准 |
| ---- | ------ | ---- | -------- |
| CODE-001 | 库引用路径 | 检查 package.json 确认指向本地 master 文件夹 | ✅ 非 npm 依赖 |
| CODE-002 | SQL 安全 | 检查 server 代码库，确认无拼接字符串 | ✅ 符合安全约束 |

---

## 四、Vibe Coding 完成判定标准

- [ ] **视觉达标**：完全还原 Stitch 的米色拟物化书架。
- [ ] **手感达标**：StPageFlip 翻页动画必须带有真实物理反馈。
- [ ] **架构达标**：Vue3 与 Node.js 成功通过 RESTful API 实现 SQLite 通讯。