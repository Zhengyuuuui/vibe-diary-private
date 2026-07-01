<script setup>
import { ref, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useLettersStore } from '@/stores/letters'
import { getAIReflection } from '@/api'

const router = useRouter()
const settingsStore = useSettingsStore()
const lettersStore = useLettersStore()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const API_BASE = `${API_BASE_URL}/api/v1`

// 从父级 ReflectionView 注入翻页方法
const flipBackToArchive = inject('flipBackToArchive', null)

// AI Reflection 数据（从后端 API 获取）
const reflectionData = ref({
  keywords: [],
  observation: '',
  mood: '',
  moodLabel: '',
  weeklyHighlight: '',
  emotionTrend: {} // 🆕 情绪趋势数据（各情绪出现次数）
})

// 🆕 情绪标签映射（中文）
const emotionLabelMap = {
  calm: '平静',
  happy: '开心',
  sad: '悲伤',
  anxious: '焦虑',
  inspired: '灵感',
  reflective: '反思'
}

// 🆕 情绪图标映射
const emotionIconMap = {
  calm: 'spa',
  happy: 'sentiment_satisfied',
  sad: 'sentiment_dissatisfied',
  anxious: 'sentiment_neutral',
  inspired: 'lightbulb',
  reflective: 'psychology'
}

// AI 是否启用（从设置 store 读取）
const isAIEnabled = ref(false)

// AI Reflection 数据加载状态
const isLoadingReflection = ref(false)
const reflectionError = ref(null)

// 🆕 缓存状态信息
const cacheInfo = ref({
  fromCache: false,       // 是否来自缓存
  cacheUpdatedAt: null    // 缓存更新时间
})

// 🆕 刷新状态
const isRefreshing = ref(false)

// 🆕 格式化缓存时间（相对时间格式）
function formatCacheTime(timestamp) {
  if (!timestamp) return ''

  const now = new Date()
  const cacheTime = new Date(timestamp)
  const diffMs = now - cacheTime
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`

  // 超过24小时显示完整日期
  return cacheTime.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 初始化时读取 AI 设置并加载 Reflection 数据
async function initAISettings() {
  try {
    await settingsStore.loadAISettings()
    isAIEnabled.value = settingsStore.aiSettings.ai_enabled === 1

    // 如果 AI 已启用，加载 Reflection 数据
    if (isAIEnabled.value) {
      await loadAIReflection()
    }
  } catch (error) {
    console.error('加载 AI 设置失败:', error)
  }
}

// 加载 AI Reflection 数据
async function loadAIReflection() {
  isLoadingReflection.value = true
  reflectionError.value = null

  try {
    const data = await getAIReflection()
    reflectionData.value = {
      keywords: data.keywords || [],
      observation: data.observation || '',
      mood: data.mood || 'calm',
      moodLabel: data.mood_label || '平静',
      weeklyHighlight: data.weekly_highlight || '',
      // 🆕 情绪趋势数据（后端返回 emotion_trend 或基于 mood 生成默认值）
      emotionTrend: data.emotion_trend || { [data.mood || 'calm']: 1 }
    }

    // 🆕 保存缓存信息
    cacheInfo.value = {
      fromCache: data.from_cache || false,
      cacheUpdatedAt: data.cache_updated_at || null
    }
  } catch (error) {
    console.error('加载 AI Reflection 数据失败:', error)
    reflectionError.value = error.message || '加载失败'

    // 降级方案：使用默认空数据
    reflectionData.value = {
      keywords: [],
      observation: '暂无 AI 分析数据，请稍后再试。',
      mood: 'unknown',
      moodLabel: '未知',
      weeklyHighlight: '',
      emotionTrend: {}
    }
  } finally {
    isLoadingReflection.value = false
  }
}

// 🆕 刷新 AI Reflection（强制重新分析）
async function refreshAIReflection() {
  if (isRefreshing.value) return

  isRefreshing.value = true
  reflectionError.value = null

  try {
    // 获取 token
    const token = localStorage.getItem('token')

    const response = await fetch(`${API_BASE}/ai/reflection?force_refresh=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    const result = await response.json()

    if (result.code === 200) {
      reflectionData.value = {
        keywords: result.data.keywords || [],
        observation: result.data.observation || '',
        mood: result.data.mood || 'calm',
        moodLabel: result.data.mood_label || '平静',
        weeklyHighlight: result.data.weekly_highlight || '',
        emotionTrend: result.data.emotion_trend || { [result.data.mood || 'calm']: 1 }
      }

      // 🆕 更新缓存信息（强制刷新后 from_cache 应为 false）
      cacheInfo.value = {
        fromCache: result.data.from_cache || false,
        cacheUpdatedAt: result.data.cache_updated_at || new Date().toISOString()
      }
    } else {
      throw new Error(result.msg || '刷新失败')
    }
  } catch (error) {
    console.error('刷新 AI Reflection 失败:', error)
    reflectionError.value = error.message || '刷新失败'
  } finally {
    isRefreshing.value = false
  }
}

onMounted(() => {
  initAISettings()
  // 加载信箱统计数据（用于红点提示）
  lettersStore.loadStats().catch(() => {})
})

// 触发翻页回时光存档
async function handleBackToArchive() {
  if (flipBackToArchive) {
    await flipBackToArchive()
  } else {
    router.push('/reflection')
  }
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-container/30 via-background to-surface-container-low relative overflow-hidden">
    <!-- 花园背景装饰（仅桌面端） -->
    <div class="hidden md:block absolute inset-0 pointer-events-none opacity-10">
      <span class="material-symbols-outlined absolute top-20 left-20 text-9xl text-primary">local_florist</span>
      <span class="material-symbols-outlined absolute top-40 right-32 text-7xl text-primary rotate-12">spa</span>
      <span class="material-symbols-outlined absolute bottom-32 left-1/4 text-8xl text-primary -rotate-12">park</span>
      <span class="material-symbols-outlined absolute bottom-20 right-20 text-9xl text-primary rotate-6">eco</span>
    </div>

    <!-- 顶部导航 -->
    <header class="bg-background/70 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4">
      <div class="flex items-center gap-3">
        <button @click="handleBackToArchive" class="material-symbols-outlined text-primary hover:scale-110 transition-transform cursor-pointer">
          arrow_back
        </button>
        <!-- 手机端显示轻提示 -->
        <span class="md:hidden font-label text-xs text-primary/60 uppercase tracking-widest">回到时光</span>
        <span class="text-xl font-bold text-primary font-headline tracking-tight">氛围日记</span>
      </div>
      <div class="hidden md:flex items-center gap-8">
  <router-link to="/" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-sm">首页</router-link>
  <router-link to="/reflection" class="text-primary font-bold hover:text-primary transition-colors duration-300 font-label text-sm">回望</router-link>
  <router-link to="/favorites" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-sm">灵感</router-link>
  <router-link to="/settings" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-sm">设置</router-link>
</div>
      <div class="flex items-center gap-3">
        <!-- 仅电脑端显示筛选图标 -->
        <span class="hidden md:block material-symbols-outlined text-primary/60">filter_list</span>
      </div>
    </header>

    <main class="relative z-10 max-w-4xl mx-auto px-6 py-12 pb-32">
      <!-- 页面标题 -->
      <header class="mb-12 text-center">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <span class="material-symbols-outlined text-4xl text-primary">local_florist</span>
        </div>
        <span class="font-label text-xs uppercase tracking-[0.3em] text-primary/40 mb-2 block">Inner Garden</span>
        <h1 class="font-headline text-5xl font-bold text-primary tracking-tighter leading-tight mb-4">心灵花园</h1>
        <p class="font-body italic text-on-surface-variant max-w-md mx-auto">
          在这里，让思绪沉淀为花朵，让回望生长为花园。
        </p>
      </header>

      <!-- AI Reflection 卡片 -->
      <div v-if="isAIEnabled" class="space-y-6">
        <!-- 加载状态 -->
        <div v-if="isLoadingReflection" class="bg-surface-container-lowest rounded-2xl p-6 shadow-xl text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 animate-pulse">
            <span class="material-symbols-outlined text-3xl text-primary">auto_awesome</span>
          </div>
          <h2 class="font-headline text-xl text-primary mb-4">正在分析您的日记...</h2>
          <p class="font-body text-on-surface-variant">AI 正在为您生成专属的洞察与回望。</p>
        </div>

        <!-- Reflection 数据 -->
        <div v-else class="space-y-6">
          <!-- 最近 7 天 Reflection -->
        <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-xl">
          <div class="flex items-center gap-3 mb-4">
            <span class="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
            <h2 class="font-headline text-xl text-on-surface">最近 7 天 Reflection</h2>
          </div>

          <!-- 🆕 缓存状态标识区域 -->
          <div class="flex items-center justify-between mb-6 px-1">
            <div class="flex items-center gap-2 text-sm text-on-surface-variant">
              <!-- 缓存状态图标 -->
              <span v-if="cacheInfo.fromCache" class="material-symbols-outlined text-base">
                cached
              </span>
              <!-- 缓存状态文本 -->
              <span v-if="cacheInfo.fromCache" class="hidden sm:inline">
                今日已分析 · {{ formatCacheTime(cacheInfo.cacheUpdatedAt) }}
              </span>
              <span v-else class="hidden sm:inline">
                刚刚分析
              </span>
              <!-- 手机端只显示时间 -->
              <span v-if="cacheInfo.fromCache" class="sm:hidden text-xs">
                {{ formatCacheTime(cacheInfo.cacheUpdatedAt) }}
              </span>
              <span v-else class="sm:hidden text-xs">
                刚刚
              </span>
            </div>

            <!-- 刷新按钮 -->
            <button
              @click="refreshAIReflection"
              :disabled="isRefreshing"
              class="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-sm
                     bg-surface-container-high hover:bg-surface-container
                     text-on-surface-variant hover:text-primary
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     md:gap-1 md:px-3"
              title="重新分析"
            >
              <span class="material-symbols-outlined text-base" :class="{ 'animate-spin': isRefreshing }">
                refresh
              </span>
              <!-- 手机端隐藏文字 -->
              <span class="hidden md:inline">{{ isRefreshing ? '分析中...' : '刷新' }}</span>
            </button>
          </div>

          <!-- 关键词标签 -->
          <div class="flex gap-2 mb-6 flex-wrap">
            <span
              v-for="keyword in reflectionData.keywords"
              :key="keyword"
              class="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-label"
            >
              {{ keyword }}
            </span>
          </div>

          <!-- AI 观察 -->
          <div class="mb-6">
            <h3 class="font-label text-[10px] uppercase tracking-widest text-outline mb-3">AI 观察</h3>
            <p class="font-body text-on-surface-variant leading-relaxed">
              {{ reflectionData.observation }}
            </p>
          </div>

          <!-- 本周亮点 -->
          <div class="border-t border-outline-variant/20 pt-4">
            <h3 class="font-label text-[10px] uppercase tracking-widest text-outline mb-3 flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">wb_sunny</span>
              本周亮点
            </h3>
            <p class="font-body text-on-surface-variant leading-relaxed">
              {{ reflectionData.weeklyHighlight }}
            </p>
          </div>
        </div>

        <!-- 情绪状态卡片 + 情绪趋势卡片（并排显示） -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 情绪状态卡片 -->
          <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-xl">
            <div class="flex items-center gap-3 mb-6">
              <span class="material-symbols-outlined text-primary text-2xl">mood</span>
              <h2 class="font-headline text-xl text-on-surface">情绪状态</h2>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-label text-[10px] uppercase tracking-widest text-outline mb-2">当前状态</p>
                <p class="font-headline text-2xl text-primary">{{ reflectionData.moodLabel }}</p>
              </div>
              <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-3xl text-primary">partly_cloudy_day</span>
              </div>
            </div>
          </div>

          <!-- 🆕 情绪趋势图卡片 -->
          <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-xl">
            <div class="flex items-center gap-3 mb-6">
              <span class="material-symbols-outlined text-primary text-2xl">monitoring</span>
              <h2 class="font-headline text-xl text-on-surface">最近 7 天情绪趋势</h2>
            </div>

            <div class="space-y-3">
              <!-- 情绪标签映射柱状图 -->
              <div
                v-for="(value, key) in emotionLabelMap"
                :key="key"
                class="flex items-center gap-3"
              >
                <span class="font-label text-sm text-on-surface-variant w-16 flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm text-primary/60">{{ emotionIconMap[key] }}</span>
                  {{ value }}
                </span>
                <div class="flex-1 bg-surface-container-high rounded-full h-3 overflow-hidden">
                  <div
                    class="bg-primary rounded-full h-3 transition-all duration-700 ease-out"
                    :style="{ width: `${(reflectionData.emotionTrend[key] || 0) * 10}%` }"
                  ></div>
                </div>
                <span class="font-label text-sm text-primary w-5 text-right">{{ reflectionData.emotionTrend[key] || 0 }}</span>
              </div>
            </div>

            <!-- 趋势说明 -->
            <div class="mt-5 pt-3 border-t border-outline-variant/20">
              <p class="font-body text-xs text-on-surface-variant italic">
                <span class="material-symbols-outlined text-sm align-middle mr-1">info</span>
                基于最近 7 天日记内容的情绪分析
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- AI 未启用提示 -->
      <div v-else class="bg-surface-container-lowest rounded-2xl p-8 shadow-xl text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <span class="material-symbols-outlined text-3xl text-primary">lock</span>
        </div>
        <h2 class="font-headline text-2xl text-primary mb-4">花园尚未绽放</h2>
        <p class="font-body text-on-surface-variant leading-relaxed max-w-md mx-auto mb-8">
          AI Reflection 功能默认关闭。前往设置开启后，花园将为你绽放专属的洞察与回望。
        </p>
        <button
          @click="router.push('/settings')"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/30 hover:scale-95 transition-all"
        >
          <span class="material-symbols-outlined text-xl">settings</span>
          <span class="font-label text-sm uppercase tracking-widest">前往开启</span>
        </button>
      </div>

      <!-- 🆕 时光信箱入口卡片（独立于 AI 功能，始终显示） -->
      <div
        @click="router.push('/reflection/letters')"
        class="mt-6 bg-surface-container-lowest rounded-2xl p-6 shadow-xl cursor-pointer group transition-all hover:shadow-2xl hover:scale-[1.01] relative overflow-hidden"
      >
        <!-- 装饰背景 -->
        <div class="absolute inset-0 pointer-events-none opacity-5">
          <span class="material-symbols-outlined absolute -right-4 top-0 text-9xl text-primary">mail</span>
        </div>

        <div class="relative z-10 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="relative">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <span class="material-symbols-outlined text-3xl text-primary">mail</span>
              </div>
              <!-- 红点提示 -->
              <span
                v-if="lettersStore.deliverableCount > 0"
                class="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-on-secondary rounded-full flex items-center justify-center text-xs font-bold animate-pulse"
              >
                {{ lettersStore.deliverableCount }}
              </span>
            </div>
            <div>
              <h2 class="font-headline text-xl text-on-surface mb-1">时光信箱</h2>
              <p class="font-body text-sm text-on-surface-variant">
                给未来的自己写一封信，在时光的彼岸等待拆开。
              </p>
            </div>
          </div>
          <span class="material-symbols-outlined text-primary text-2xl group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </div>
      </div>

      <!-- 隐私说明 -->
      <div class="mt-6 p-4 bg-surface-container rounded-lg">
        <p class="font-body text-xs text-on-surface-variant leading-relaxed text-center">
          <span class="material-symbols-outlined text-sm align-middle mr-1">shield</span>
          日记内容安全存储，时光信箱仅您本人可查看。
        </p>
      </div>
    </main>

    <!-- 返回按钮（左下角，仅电脑端显示） -->
    <div class="hidden md:block fixed bottom-12 left-12 z-20">
      <button
        @click="handleBackToArchive"
        class="group flex items-center gap-2 px-6 py-4 bg-surface-container text-primary rounded-full shadow-lg hover:scale-95 transition-all"
      >
        <span class="material-symbols-outlined text-xl">arrow_back</span>
        <span class="font-label text-sm uppercase tracking-widest">回到时光</span>
      </button>
    </div>

    <!-- 移动端底部导航 -->
    <nav class="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 flex justify-around items-center py-3 px-4 bg-surface-90 backdrop-blur-lg rounded-full shadow-lg">
  <router-link to="/" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
    <span class="material-symbols-outlined">auto_stories</span>
    <span class="font-label text-[10px] uppercase tracking-widest mt-1">首页</span>
  </router-link>
  <router-link to="/reflection" class="flex flex-col items-center justify-center text-primary scale-110">
    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">inventory_2</span>
    <span class="font-label text-[10px] uppercase tracking-widest mt-1">回望</span>
  </router-link>
  <router-link to="/favorites" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
    <span class="material-symbols-outlined">star</span>
    <span class="font-label text-[10px] uppercase tracking-widest mt-1">灵感</span>
  </router-link>
  <router-link to="/settings" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
    <span class="material-symbols-outlined">settings</span>
    <span class="font-label text-[10px] uppercase tracking-widest mt-1">设置</span>
  </router-link>
</nav>
  </div>
</template>
