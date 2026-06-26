<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const settingsStore = useSettingsStore()

// 从父级 ReflectionView 注入翻页方法
const flipBackToArchive = inject('flipBackToArchive', null)

// 模拟 AI Reflection 数据（P0 阶段使用静态数据，后续接入后端 API）
const reflectionData = ref({
  keywords: ['考试', '比赛', '客户'],
  observation: '你似乎正在努力平衡学习与项目开发。虽然压力较大，但你正在一步步推进自己的目标。',
  mood: 'calm',
  moodLabel: '平静',
  weeklyHighlight: '本周你完成了 3 篇日记，记录了许多关于项目开发的思考。'
})

// AI 是否启用（从设置 store 读取）
const isAIEnabled = ref(false)

// 初始化时读取 AI 设置
async function initAISettings() {
  try {
    await settingsStore.loadAISettings()
    isAIEnabled.value = settingsStore.aiSettings.ai_enabled === 1
  } catch (error) {
    console.error('加载 AI 设置失败:', error)
  }
}

initAISettings()

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
    <!-- 花园背景装饰 -->
    <div class="absolute inset-0 pointer-events-none opacity-10">
      <span class="material-symbols-outlined absolute top-20 left-20 text-9xl text-primary">local_florist</span>
      <span class="material-symbols-outlined absolute top-40 right-32 text-7xl text-primary rotate-12">spa</span>
      <span class="material-symbols-outlined absolute bottom-32 left-1/4 text-8xl text-primary -rotate-12">park</span>
      <span class="material-symbols-outlined absolute bottom-20 right-20 text-9xl text-primary rotate-6">eco</span>
    </div>

    <!-- 顶部导航 -->
    <header class="bg-background/70 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4">
      <div class="flex items-center gap-4">
        <button @click="handleBackToArchive" class="material-symbols-outlined text-primary hover:scale-110 transition-transform cursor-pointer">
          arrow_back
        </button>
        <span class="text-xl font-bold text-primary font-headline tracking-tight">氛围日记</span>
      </div>
      <div class="hidden md:flex items-center gap-8">
        <a href="/" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-sm">首页</a>
        <a href="/reflection" class="text-primary font-bold hover:text-primary transition-colors duration-300 font-label text-sm">回望</a>
        <a href="/favorites" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-sm">灵感</a>
        <a href="/settings" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-sm">设置</a>
      </div>
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined text-primary/60">filter_list</span>
      </div>
    </header>

    <main class="relative z-10 max-w-4xl mx-auto px-6 py-12 pb-32">
      <!-- 页面标题 -->
      <header class="mb-16 text-center">
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
      <div v-if="isAIEnabled" class="space-y-8">
        <!-- 最近 7 天 Reflection -->
        <div class="bg-surface-container-lowest rounded-2xl p-8 shadow-xl">
          <div class="flex items-center gap-3 mb-6">
            <span class="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
            <h2 class="font-headline text-xl text-on-surface">最近 7 天 Reflection</h2>
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

        <!-- 情绪状态卡片 -->
        <div class="bg-surface-container-lowest rounded-2xl p-8 shadow-xl">
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
      </div>

      <!-- AI 未启用提示 -->
      <div v-else class="bg-surface-container-lowest rounded-2xl p-12 shadow-xl text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <span class="material-symbols-outlined text-3xl text-primary">lock</span>
        </div>
        <h2 class="font-headline text-2xl text-primary mb-4">花园尚未绽放</h2>
        <p class="font-body text-on-surface-variant leading-relaxed max-w-md mx-auto mb-8">
          AI Reflection 功能默认关闭。前往设置开启后，花园将为你绽放专属的洞察与回望。
        </p>
        <button
          @click="router.push('/settings')"
          class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/30 hover:scale-95 transition-all"
        >
          <span class="material-symbols-outlined text-xl">settings</span>
          <span class="font-label text-sm uppercase tracking-widest">前往开启</span>
        </button>
      </div>

      <!-- 隐私说明 -->
      <div class="mt-12 p-4 bg-surface-container rounded-lg">
        <p class="font-body text-xs text-on-surface-variant leading-relaxed text-center">
          <span class="material-symbols-outlined text-sm align-middle mr-1">shield</span>
          所有 AI 分析均在本地进行，您的日记内容不会离开设备。
        </p>
      </div>
    </main>

    <!-- 返回按钮（左下角） -->
    <div class="fixed bottom-12 left-12 z-20">
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
      <a href="/" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
        <span class="material-symbols-outlined">auto_stories</span>
        <span class="font-label text-[10px] uppercase tracking-widest mt-1">首页</span>
      </a>
      <a href="/reflection" class="flex flex-col items-center justify-center text-primary scale-110">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">inventory_2</span>
        <span class="font-label text-[10px] uppercase tracking-widest mt-1">回望</span>
      </a>
      <a href="/favorites" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
        <span class="material-symbols-outlined">star</span>
        <span class="font-label text-[10px] uppercase tracking-widest mt-1">灵感</span>
      </a>
      <a href="/settings" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
        <span class="material-symbols-outlined">settings</span>
        <span class="font-label text-[10px] uppercase tracking-widest mt-1">设置</span>
      </a>
    </nav>
  </div>
</template>
