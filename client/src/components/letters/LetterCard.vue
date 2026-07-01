<script setup>
import { computed } from 'vue'

const props = defineProps({
  letter: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['open', 'view', 'delete'])

// 信件状态
const isDelivered = computed(() => {
  return new Date(props.letter.deliver_at).getTime() <= Date.now()
})

const isOpened = computed(() => {
  return props.letter.is_opened === 1
})

const status = computed(() => {
  if (isOpened.value) return 'opened'
  if (isDelivered.value) return 'deliverable'
  return 'pending'
})

// 剩余天数
const daysRemaining = computed(() => {
  if (isDelivered.value) return 0
  const diff = new Date(props.letter.deliver_at).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

// 摘要
const excerpt = computed(() => {
  const content = props.letter.content || ''
  return content.substring(0, 50) + (content.length > 50 ? '...' : '')
})

// 心情图标
const moodIcons = {
  calm: 'spa',
  happy: 'sentiment_very_satisfied',
  sad: 'sentiment_dissatisfied',
  anxious: 'sentiment_neutral',
  inspired: 'lightbulb',
  reflective: 'psychology'
}

const moodIcon = computed(() => moodIcons[props.letter.mood] || 'mail')
</script>

<template>
  <div
    class="bg-surface-container-lowest rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl cursor-pointer group relative overflow-hidden"
    @click="emit('view', letter)"
  >
    <!-- 信封装饰层 -->
    <div class="absolute inset-0 pointer-events-none z-0">
      <!-- 信封手绘边框 -->
      <div class="absolute inset-2 border-2 border-dashed border-primary/15 rounded-xl"></div>
      <!-- 信封封盖（仅封存状态，三角折纸，内缩留边，折痕落在虚线内侧） -->
      <div v-if="status === 'pending'" class="absolute top-4 left-6 right-6 h-16">
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" class="w-full h-full">
          <!-- 封盖主体：略深于信封主体（约 5%），带极浅阴影表现纸张厚度与层次 -->
          <path d="M8,0 L192,0 L100,100 Z" fill="rgba(105,93,74,0.05)" style="filter: drop-shadow(0 3px 2px rgba(105,93,74,0.16));"/>
          <!-- 封盖折痕：浅灰细实线（折线终点落在虚线内侧） -->
          <path d="M8,0 L100,100 L192,0" fill="none" stroke="rgba(105,93,74,0.3)" stroke-width="1" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>

    <div class="relative z-10">
    <!-- 状态标识条（封存状态移入封存内容块，此处隐藏） -->
    <div v-if="status !== 'pending'" class="flex items-center justify-between mb-4">
      <span
        :class="[
          'px-3 py-1 rounded-full text-xs font-label flex items-center gap-1',
          status === 'opened' ? 'bg-primary/10 text-primary' : '',
          status === 'deliverable' ? 'bg-secondary/10 text-secondary animate-pulse' : '',
          status === 'pending' ? 'bg-surface-container-high text-on-surface-variant' : ''
        ]"
      >
        <span class="material-symbols-outlined text-sm">
          {{ status === 'opened' ? 'drafts' : status === 'deliverable' ? 'notifications_active' : 'lock' }}
        </span>
        {{ status === 'opened' ? '已拆开' : status === 'deliverable' ? '可拆开' : '封存中' }}
      </span>
      <span class="material-symbols-outlined text-primary/40 text-xl group-hover:opacity-0 transition-all duration-200">
        {{ moodIcon }}
      </span>
    </div>

    <!-- 未到期：封存状态 -->
    <div v-if="status === 'pending'" class="text-center pt-16 pb-4">
      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-label bg-surface-container-high text-on-surface-variant mb-3">
        <span class="material-symbols-outlined text-sm">lock</span>
        封存中
      </span>
      <p class="font-headline text-lg text-on-surface mb-1">
        {{ letter.title || '致未来的自己' }}
      </p>
      <p class="font-body text-sm text-on-surface-variant">
        还有 <span class="font-bold text-primary">{{ daysRemaining }}</span> 天送达
      </p>
      <p class="font-label text-xs text-outline mt-2">
        送达日：{{ formatDate(letter.deliver_at) }}
      </p>
    </div>

    <!-- 已到期未拆：可拆状态 -->
    <div v-else-if="status === 'deliverable'" class="text-center py-4">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 mb-3 animate-pulse">
        <span class="material-symbols-outlined text-secondary text-3xl">mail</span>
      </div>
      <p class="font-headline text-lg text-on-surface mb-1">
        {{ letter.title || '致未来的自己' }}
      </p>
      <p class="font-body text-sm text-secondary mb-4">可以拆开了</p>
      <button
        @click.stop="emit('open', letter.id)"
        class="px-6 py-2 bg-primary text-on-primary rounded-full font-label text-sm hover:scale-95 transition-transform shadow-lg shadow-primary/20"
      >
        拆开信件
      </button>
    </div>

    <!-- 已拆：显示摘要 -->
    <div v-else>
      <p class="font-headline text-lg text-on-surface mb-2">
        {{ letter.title || '致未来的自己' }}
      </p>
      <p class="font-body text-sm text-on-surface-variant leading-relaxed">
        {{ excerpt }}
      </p>
      <div class="mt-4 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
        <p class="font-label text-xs text-outline">
          已拆开 · {{ formatDate(letter.opened_at) }}
        </p>
        <span class="material-symbols-outlined text-primary/60 text-sm">arrow_forward</span>
      </div>
    </div>

    </div>

    <!-- 删除按钮（悬浮） -->
    <button
      @click.stop="emit('delete', letter.id)"
      class="absolute top-4 right-4 z-20 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-error/10 transition-all"
      title="删除"
    >
      <span class="material-symbols-outlined text-error/60 text-sm">delete</span>
    </button>
  </div>
</template>
