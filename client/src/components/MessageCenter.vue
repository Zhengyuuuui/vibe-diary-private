<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLettersStore } from '@/stores/letters'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const router = useRouter()
const lettersStore = useLettersStore()

const activeTab = ref('all')

const tabs = [
  { id: 'all', label: '全部', icon: 'notifications' },
  { id: 'letters', label: '信箱', icon: 'mail' }
]

// 根据标签过滤消息
const filteredMessages = computed(() => {
  if (activeTab.value === 'all') {
    // 全部：显示信件 + 后期可扩展其他消息类型
    return lettersStore.letters.slice(0, 5) // 只显示最近 5 条
  } else if (activeTab.value === 'letters') {
    return lettersStore.letters.slice(0, 10)
  }
  return []
})

// 格式化时间
function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 信件状态
function getLetterStatus(letter) {
  const isDelivered = new Date(letter.deliver_at).getTime() <= Date.now()
  const isOpened = letter.is_opened === 1

  if (isOpened) {
    return { text: '已拆', icon: 'drafts', color: 'text-primary' }
  } else if (isDelivered) {
    return { text: '可拆', icon: 'mail', color: 'text-secondary animate-pulse' }
  } else {
    return { text: '封存', icon: 'lock', color: 'text-on-surface-variant' }
  }
}

// 点击信件
function handleLetterClick(letter) {
  emit('close')
  router.push(`/reflection/letters`)
}

// 查看全部信件
function viewAllLetters() {
  emit('close')
  router.push('/reflection/letters')
}

onMounted(() => {
  // 加载信件数据
  lettersStore.loadLetters().catch(() => {})
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <!-- 背景遮罩 -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="emit('close')"></div>

        <!-- 弹窗主体 -->
        <div class="relative bg-surface rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
          <!-- 头部 -->
          <div class="sticky top-0 bg-surface border-b border-outline-variant/20 px-4 py-3 flex justify-between items-center z-10">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">notifications</span>
              <h2 class="font-headline text-lg font-bold text-primary">消息中心</h2>
            </div>
            <button @click="emit('close')" class="p-2 hover:bg-surface-container-high rounded-full transition-colors">
              <span class="material-symbols-outlined text-primary">close</span>
            </button>
          </div>

          <!-- 标签切换 -->
          <div class="flex gap-2 px-4 py-3 bg-surface-container-low/30">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'px-4 py-2 rounded-full text-sm font-label transition-all flex items-center gap-1',
                activeTab === tab.id
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              ]"
            >
              <span class="material-symbols-outlined text-sm">{{ tab.icon }}</span>
              {{ tab.label }}
              <!-- 信箱标签显示红点 -->
              <span
                v-if="tab.id === 'letters' && lettersStore.deliverableCount > 0"
                class="ml-1 w-2 h-2 bg-secondary rounded-full"
              ></span>
            </button>
          </div>

          <!-- 消息列表 -->
          <div class="overflow-y-auto max-h-[400px]">
            <!-- 加载状态 -->
            <div v-if="lettersStore.loading" class="flex justify-center py-8">
              <span class="material-symbols-outlined text-primary text-2xl animate-spin">progress_activity</span>
            </div>

            <!-- 空状态 -->
            <div v-else-if="filteredMessages.length === 0" class="text-center py-12 px-4">
              <span class="material-symbols-outlined text-primary/40 text-4xl mb-3">notifications_off</span>
              <p class="font-body text-on-surface-variant text-sm">暂无消息</p>
            </div>

            <!-- 消息列表 -->
            <div v-else class="divide-y divide-outline-variant/10">
              <div
                v-for="letter in filteredMessages"
                :key="letter.id"
                @click="handleLetterClick(letter)"
                class="px-4 py-3 hover:bg-surface-container-low transition-colors cursor-pointer flex items-start gap-3"
              >
                <!-- 状态图标 -->
                <div class="flex-shrink-0">
                  <span
                    :class="[
                      'material-symbols-outlined text-xl',
                      getLetterStatus(letter).color
                    ]"
                  >{{ getLetterStatus(letter).icon }}</span>
                </div>

                <!-- 内容 -->
                <div class="flex-1 min-w-0">
                  <p class="font-label text-sm text-on-surface truncate">
                    {{ letter.title || '致未来的自己' }}
                  </p>
                  <p class="font-body text-xs text-on-surface-variant mt-1 truncate">
                    {{ letter.content?.substring(0, 30) || '...' }}
                  </p>
                </div>

                <!-- 时间 + 状态 -->
                <div class="flex-shrink-0 text-right">
                  <p class="font-label text-xs text-on-surface-variant">
                    {{ formatTime(letter.created_at) }}
                  </p>
                  <p class="font-label text-xs mt-1" :class="getLetterStatus(letter).color">
                    {{ getLetterStatus(letter).text }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部：查看全部 -->
          <div class="sticky bottom-0 bg-surface border-t border-outline-variant/20 px-4 py-3">
            <button
              @click="viewAllLetters"
              class="w-full py-2 rounded-lg bg-primary/10 text-primary font-label text-sm hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
            >
              <span class="material-symbols-outlined text-sm">expand_more</span>
              查看全部信件
            </button>
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
  transform: scale(0.95) translateY(-20px);
}
</style>