# 前端 AI 隐私开关功能开发任务

你是 Vibe Diary 前端开发 Agent。

## 任务目标
实现 AI 权限与隐私开关功能的前端部分（P0 级别）

## 任务范围
1. 前端设置页面：新增"隐私与 AI"设置区域
2. 前端首页提示：轻量提示用户 AI 功能可用
3. 前端 Store：管理 AI 设置状态
4. 前端 API：调用后端 AI 设置接口

## 设计文档位置
/Users/zhengyusheng/Desktop/diary备份/功能开发文档管理/VIBE_DIARY_AI_ROADMAP.md

## 产品原则
- **Privacy First**：默认关闭所有 AI 功能，设置页面明确说明隐私承诺
- **AI Optional**：用户可以随时开启或关闭，不强制展示
- **Record First**：首页只轻量提示，不分散用户注意力

## UI 设计方案
- **设置页面**：主要控制入口，包含所有 AI 功能开关
- **首页**：轻量提示，仅在 AI 关闭时显示，点击跳转设置页面

---

## 第一部分：前端 Store 开发

### Store 设计

修改 `client/src/stores/settings.js`，添加 AI 设置管理：

```javascript
// client/src/stores/settings.js

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getSettings, updateSettings, getAISettings, updateAISettings } from '@/api'

export const useSettingsStore = defineStore('settings', () => {
  const fontSize = ref(16)
  const lineHeight = ref('medium')
  const theme = ref('light')
  
  // 新增：AI 设置状态
  const aiSettings = ref({
    ai_enabled: 0,
    ai_reflection_enabled: 0,
    ai_weekly_review_enabled: 0,
    ai_emotion_trend_enabled: 0
  })
  
  const lineHeightMap = {
    compact: '1.4',
    medium: '1.6',
    relaxed: '1.8'
  }
  
  async function loadSettings() {
    try {
      const data = await getSettings()
      fontSize.value = data.font_size
      lineHeight.value = data.line_height
      theme.value = data.theme
      applySettings()
    } catch (error) {
      console.error('加载设置失败:', error)
      restoreFromLocal()
    }
  }
  
  // 新增：加载 AI 设置
  async function loadAISettings() {
    try {
      const data = await getAISettings()
      aiSettings.value = {
        ai_enabled: data.ai_enabled || 0,
        ai_reflection_enabled: data.ai_reflection_enabled || 0,
        ai_weekly_review_enabled: data.ai_weekly_review_enabled || 0,
        ai_emotion_trend_enabled: data.ai_emotion_trend_enabled || 0
      }
    } catch (error) {
      console.error('加载 AI 设置失败:', error)
    }
  }
  
  async function saveSettings(newSettings) {
    try {
      await updateSettings(newSettings)
      if (newSettings.font_size) fontSize.value = newSettings.font_size
      if (newSettings.line_height) lineHeight.value = newSettings.line_height
      if (newSettings.theme) theme.value = newSettings.theme
      applySettings()
      return true
    } catch (error) {
      console.error('保存设置失败:', error)
      return false
    }
  }
  
  // 新增：保存 AI 设置
  async function saveAISettings(newAISettings) {
    try {
      await updateAISettings(newAISettings)
      aiSettings.value = { ...aiSettings.value, ...newAISettings }
      return true
    } catch (error) {
      console.error('保存 AI 设置失败:', error)
      return false
    }
  }
  
  // 新增：切换 AI 功能总开关
  async function toggleAIEnabled() {
    const newValue = aiSettings.value.ai_enabled === 1 ? 0 : 1
    await saveAISettings({ ai_enabled: newValue })
    
    // 如果关闭总开关，同时关闭所有子开关
    if (newValue === 0) {
      await saveAISettings({
        ai_reflection_enabled: 0,
        ai_weekly_review_enabled: 0,
        ai_emotion_trend_enabled: 0
      })
    }
  }
  
  // 新增：切换 AI Reflection 开关
  async function toggleAIReflection() {
    const newValue = aiSettings.value.ai_reflection_enabled === 1 ? 0 : 1
    await saveAISettings({ ai_reflection_enabled: newValue })
  }
  
  // 新增：切换 AI Weekly Review 开关
  async function toggleAIWeeklyReview() {
    const newValue = aiSettings.value.ai_weekly_review_enabled === 1 ? 0 : 1
    await saveAISettings({ ai_weekly_review_enabled: newValue })
  }
  
  // 新增：切换 AI 情绪趋势开关
  async function toggleAIEmotionTrend() {
    const newValue = aiSettings.value.ai_emotion_trend_enabled === 1 ? 0 : 1
    await saveAISettings({ ai_emotion_trend_enabled: newValue })
  }
  
  function applySettings() {
    const root = document.documentElement
    
    root.style.setProperty('--font-size-base', `${fontSize.value}px`)
    root.style.setProperty('--line-height-base', lineHeightMap[lineHeight.value])
    root.setAttribute('data-theme', theme.value)
    
    localStorage.setItem('settings', JSON.stringify({
      fontSize: fontSize.value,
      lineHeight: lineHeight.value,
      theme: theme.value
    }))
  }
  
  function restoreFromLocal() {
    const cached = localStorage.getItem('settings')
    if (cached) {
      try {
        const data = JSON.parse(cached)
        fontSize.value = data.fontSize || 16
        lineHeight.value = data.lineHeight || 'medium'
        theme.value = data.theme || 'light'
        applySettings()
      } catch (e) {
        console.error('Failed to parse cached settings:', e)
      }
    }
  }
  
  return {
    fontSize,
    lineHeight,
    theme,
    aiSettings,
    lineHeightMap,
    loadSettings,
    loadAISettings,
    saveSettings,
    saveAISettings,
    toggleAIEnabled,
    toggleAIReflection,
    toggleAIWeeklyReview,
    toggleAIEmotionTrend,
    applySettings,
    restoreFromLocal
  }
})
```

---

## 第二部分：前端 API 函数开发

### API 函数设计

修改 `client/src/api/index.js`，添加 AI 设置 API 函数：

```javascript
// client/src/api/index.js

// 在现有 API 函数后添加

// 获取 AI 设置状态
export function getAISettings() {
  return request('/settings/ai')
}

// 更新 AI 设置状态
export function updateAISettings(data) {
  return request('/settings/ai', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}
```

---

## 第三部分：前端设置页面开发

### 设置页面 UI 设计

修改 `client/src/views/SettingsView.vue`，添加"隐私与 AI"设置区域：

**在现有设置页面中添加以下代码：**

```vue
<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { getProfile, updateProfile, uploadAvatar } from '@/api'

const router = useRouter()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

// 现有代码保持不变...

// 新增：AI 设置相关函数
async function toggleAIEnabled() {
  await settingsStore.toggleAIEnabled()
}

async function toggleAIReflection() {
  await settingsStore.toggleAIReflection()
}

async function toggleAIWeeklyReview() {
  await settingsStore.toggleAIWeeklyReview()
}

async function toggleAIEmotionTrend() {
  await settingsStore.toggleAIEmotionTrend()
}

onMounted(async () => {
  isLoggedIn.value = authStore.isLoggedIn
  if (isLoggedIn.value) {
    await loadProfile()
    await loadSettings()
    await settingsStore.loadAISettings() // 新增：加载 AI 设置
  }
  isLoading.value = false
})
</script>

<template>
  <!-- 现有设置页面内容保持不变... -->
  
  <!-- 新增：隐私与 AI 设置区域 -->
  <section class="mb-16">
    <h3 class="font-label text-[10px] uppercase tracking-[0.2em] text-outline mb-8">
      隐私与 AI • Privacy & AI
    </h3>
    
    <div class="bg-surface-container-low rounded-xl p-8 space-y-6">
      <!-- AI 总开关 -->
      <div class="flex items-center justify-between">
        <div>
          <h4 class="font-headline text-lg text-primary">AI 功能总开关</h4>
          <p class="font-body text-sm text-on-surface-variant">
            默认关闭，开启后可使用 AI 辅助功能
          </p>
        </div>
        <button
          @click="toggleAIEnabled"
          :class="[
            'w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer',
            settingsStore.aiSettings.ai_enabled
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-highest border border-primary/20 text-primary'
          ]"
        >
          <span class="material-symbols-outlined">
            {{ settingsStore.aiSettings.ai_enabled ? 'check' : 'close' }}
          </span>
        </button>
      </div>
      
      <!-- AI Reflection 开关 -->
      <div v-if="settingsStore.aiSettings.ai_enabled" class="flex items-center justify-between">
        <div>
          <h4 class="font-headline text-lg text-primary">AI Reflection</h4>
          <p class="font-body text-sm text-on-surface-variant">
            分析最近 7 天的日记内容
          </p>
        </div>
        <button
          @click="toggleAIReflection"
          :class="[
            'w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer',
            settingsStore.aiSettings.ai_reflection_enabled
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-highest border border-primary/20 text-primary'
          ]"
        >
          <span class="material-symbols-outlined">
            {{ settingsStore.aiSettings.ai_reflection_enabled ? 'check' : 'close' }}
          </span>
        </button>
      </div>
      
      <!-- AI Weekly Review 开关 -->
      <div v-if="settingsStore.aiSettings.ai_enabled" class="flex items-center justify-between">
        <div>
          <h4 class="font-headline text-lg text-primary">AI Weekly Review</h4>
          <p class="font-body text-sm text-on-surface-variant">
            生成每周生活回顾
          </p>
        </div>
        <button
          @click="toggleAIWeeklyReview"
          :class="[
            'w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer',
            settingsStore.aiSettings.ai_weekly_review_enabled
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-highest border border-primary/20 text-primary'
          ]"
        >
          <span class="material-symbols-outlined">
            {{ settingsStore.aiSettings.ai_weekly_review_enabled ? 'check' : 'close' }}
          </span>
        </button>
      </div>
      
      <!-- AI 情绪趋势开关 -->
      <div v-if="settingsStore.aiSettings.ai_enabled" class="flex items-center justify-between">
        <div>
          <h4 class="font-headline text-lg text-primary">情绪趋势分析</h4>
          <p class="font-body text-sm text-on-surface-variant">
            观察长期状态变化
          </p>
        </div>
        <button
          @click="toggleAIEmotionTrend"
          :class="[
            'w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer',
            settingsStore.aiSettings.ai_emotion_trend_enabled
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-highest border border-primary/20 text-primary'
          ]"
        >
          <span class="material-symbols-outlined">
            {{ settingsStore.aiSettings.ai_emotion_trend_enabled ? 'check' : 'close' }}
          </span>
        </button>
      </div>
      
      <!-- 隐私说明 -->
      <div class="mt-8 p-4 bg-surface-container rounded-lg">
        <p class="font-body text-xs text-on-surface-variant leading-relaxed">
          <strong class="text-primary">隐私承诺：</strong>
          Vibe Diary 默认不会分析任何日记内容。
          只有您主动开启后，才会将您选择的内容发送给 AI。
          您可以随时关闭 AI 功能，关闭后产品依然完整可用。
        </p>
      </div>
    </div>
  </section>
  
  <!-- 现有保存按钮保持不变... -->
</template>
```

---

## 第四部分：前端首页提示开发

### 首页轻量提示设计

修改 `client/src/views/BookshelfView.vue`，添加 AI 功能提示：

**在首页顶部添加以下代码：**

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

// 现有代码保持不变...

// 新增：跳转到设置页面
function goToSettings() {
  router.push('/settings')
}

onMounted(async () => {
  // 现有代码保持不变...
  
  // 新增：加载 AI 设置
  if (authStore.isLoggedIn) {
    await settingsStore.loadAISettings()
  }
})
</script>

<template>
  <div class="min-h-screen bg-background text-on-surface">
    <header class="bg-background opacity-95 backdrop-blur-xl sticky top-0 z-50...">
      <!-- 现有头部内容保持不变... -->
    </header>
    
    <!-- 新增：AI 功能提示（仅在 AI 关闭且用户登录时显示） -->
    <div 
      v-if="!settingsStore.aiSettings.ai_enabled && authStore.isLoggedIn" 
      class="max-w-7xl mx-auto px-6 py-4 mb-6"
    >
      <div class="bg-surface-container-low rounded-lg flex items-center justify-between px-6 py-3">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary text-xl">tips_and_updates</span>
          <p class="font-body text-sm text-on-surface">
            AI 功能可用，可在设置中开启
          </p>
        </div>
        <button
          @click="goToSettings"
          class="font-label text-xs uppercase tracking-widest text-primary hover:underline cursor-pointer"
        >
          前往设置
        </button>
      </div>
    </div>
    
    <!-- 现有首页内容保持不变... -->
  </div>
</template>
```

---

## 开发要求

### 禁止事项
- 不修改任何后端代码（后端已由后端 Agent 完成）
- 不修改数据库结构
- 不修改现有页面的核心逻辑
- 不删除现有 UI 元素

### 必须事项
- 所有 AI 开关默认关闭状态
- 设置页面必须有隐私说明
- 首页提示仅在 AI 关闭时显示
- 所有操作必须有加载状态和错误处理
- 保持现有的设计风格（手绘风格、奶油色背景）

### UI 要求
- AI 开关使用圆形按钮（Material Symbols：check/close）
- 设置区域使用现有的卡片样式（rounded-xl）
- 隐私说明使用浅色背景（bg-surface-container）
- 首页提示使用轻量设计，不分散注意力

---

## 测试要求

1. 启动前端开发服务器
2. 登录用户，进入设置页面
3. 测试 AI 设置显示（默认关闭）
4. 测试 AI 开关切换功能
5. 测试首页提示显示逻辑
6. 测试跳转到设置页面功能
7. 测试不同用户的 AI 设置隔离

---

## 验证标准

开发成功后：
1. 设置页面包含"隐私与 AI"区域
2. AI 开关默认关闭状态
3. AI 开关切换功能正常
4. 隐私说明显示正确
5. 首页提示仅在 AI 关闭时显示
6. 跳转到设置页面功能正常
7. 不同用户的 AI 设置隔离正常

请开始开发。