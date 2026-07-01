<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  letter: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'open', 'delete'])

const isOpening = ref(false)
const isOpeningAnimation = ref(false)

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

// 剩余时间
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

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// 拆信
async function handleOpen() {
  if (isOpening.value) return

  isOpeningAnimation.value = true
  isOpening.value = true

  // 等待动画完成
  await new Promise(resolve => setTimeout(resolve, 1500))

  emit('open', props.letter.id)

  setTimeout(() => {
    isOpeningAnimation.value = false
    isOpening.value = false
  }, 500)
}

// 心情标签
const moodLabels = {
  calm: '平静',
  happy: '开心',
  sad: '忧伤',
  anxious: '焦虑',
  inspired: '灵感',
  reflective: '深思'
}

const moodIcons = {
  calm: 'spa',
  happy: 'sentiment_very_satisfied',
  sad: 'sentiment_dissatisfied',
  anxious: 'sentiment_neutral',
  inspired: 'lightbulb',
  reflective: 'psychology'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="letter" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')"></div>

        <div class="relative bg-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <!-- 头部 -->
          <div class="sticky top-0 bg-surface border-b border-outline-variant/20 px-6 py-4 flex justify-between items-center z-10">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">mail</span>
              <h2 class="font-headline text-xl font-bold text-primary">
                {{ isOpened ? '来自过去的信' : '时光信件' }}
              </h2>
            </div>
            <button @click="emit('close')" class="p-2 hover:bg-surface-container-high rounded-full transition-colors">
              <span class="material-symbols-outlined text-primary">close</span>
            </button>
          </div>

          <div class="p-6 space-y-6">
            <!-- 拆信动画 -->
            <div v-if="isOpeningAnimation" class="text-center py-16">
              <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6 animate-bounce">
                <span class="material-symbols-outlined text-primary text-5xl">mail</span>
              </div>
              <h3 class="font-headline text-2xl text-primary mb-2 animate-pulse">正在拆开...</h3>
              <p class="font-body text-on-surface-variant italic">一封来自过去的信</p>
            </div>

            <!-- 未到期：封蜡状态 -->
            <div v-else-if="status === 'pending'" class="text-center py-8">
              <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6">
                <span class="material-symbols-outlined text-primary/40 text-5xl">lock</span>
              </div>
              <h3 class="font-headline text-2xl text-on-surface mb-2">
                {{ letter.title || '致未来的自己' }}
              </h3>
              <p class="font-body text-on-surface-variant mb-4">
                这封信还在封存中
              </p>
              <div class="inline-block px-6 py-3 bg-primary/5 rounded-xl">
                <p class="font-label text-sm text-primary">
                  还有 <span class="font-bold text-2xl">{{ daysRemaining }}</span> 天送达
                </p>
                <p class="font-body text-xs text-on-surface-variant mt-1">
                  送达日：{{ formatDate(letter.deliver_at) }}
                </p>
              </div>
            </div>

            <!-- 已到期未拆：可拆状态 -->
            <div v-else-if="status === 'deliverable'" class="text-center py-8">
              <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary/10 mb-6 animate-pulse">
                <span class="material-symbols-outlined text-secondary text-5xl">mail</span>
              </div>
              <h3 class="font-headline text-2xl text-on-surface mb-2">
                {{ letter.title || '致未来的自己' }}
              </h3>
              <p class="font-body text-secondary mb-6">信件已到期，可以拆开了</p>
              <button
                @click="handleOpen"
                :disabled="isOpening"
                class="px-8 py-3 bg-primary text-on-primary rounded-full font-label text-sm uppercase tracking-widest hover:scale-95 transition-transform shadow-lg shadow-primary/30 disabled:opacity-50"
              >
                <span v-if="isOpening" class="material-symbols-outlined text-sm animate-spin mr-2">progress_activity</span>
                拆开信件
              </button>
            </div>

            <!-- 已拆开：显示完整内容 -->
            <div v-else class="space-y-6">
              <!-- 信件头部 -->
              <div class="text-center pb-6 border-b border-outline-variant/20">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <span class="material-symbols-outlined text-primary text-3xl">drafts</span>
                </div>
                <h3 class="font-headline text-2xl font-bold text-primary mb-2">
                  {{ letter.title || '致未来的自己' }}
                </h3>
                <p class="font-body text-sm text-on-surface-variant italic">
                  写于 {{ formatDate(letter.created_at) }}
                </p>
                <p class="font-body text-sm text-on-surface-variant italic">
                  拆于 {{ formatDateTime(letter.opened_at) }}
                </p>
              </div>

              <!-- 心情标签 -->
              <div v-if="letter.mood" class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">{{ moodIcons[letter.mood] || 'mail' }}</span>
                <span class="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-label">
                  {{ moodLabels[letter.mood] || letter.mood }}
                </span>
              </div>

              <!-- 信件内容 -->
              <div class="p-6 bg-surface-container-low rounded-xl">
                <p class="font-body text-on-surface leading-relaxed whitespace-pre-wrap">
                  {{ letter.content }}
                </p>
              </div>

              <!-- 仪式感文案 -->
              <div class="text-center py-4">
                <p class="font-body italic text-on-surface-variant text-sm">
                  一封来自过去的信，跨越时光的对话
                </p>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex justify-between gap-3 pt-4 border-t border-outline-variant/20">
              <button
                v-if="!isOpened && status === 'pending'"
                @click="emit('delete', letter.id)"
                class="px-6 py-3 rounded-full font-label text-error hover:bg-error/10 transition-colors flex items-center gap-2"
              >
                <span class="material-symbols-outlined text-sm">delete</span>
                删除
              </button>
              <div v-else></div>
              <button
                @click="emit('close')"
                class="px-6 py-3 rounded-full font-label bg-primary text-on-primary hover:bg-primary/90 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
