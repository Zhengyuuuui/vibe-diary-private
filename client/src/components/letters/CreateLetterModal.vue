<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'create'])

const form = ref({
  title: '',
  content: '',
  deliver_at: '',
  mood: ''
})

const loading = ref(false)
const error = ref('')

// 送达时间预设
const deliverOptions = [
  { value: '1y', label: '1 年后', description: '给一年后的自己' },
  { value: '3y', label: '3 年后', description: '给三年后的自己' },
  { value: '5y', label: '5 年后', description: '给五年后的自己' },
  { value: '10y', label: '10 年后', description: '给十年后的自己' },
  { value: 'custom', label: '自定义', description: '选择特定日期' }
]

const selectedPreset = ref('1y')
const customDate = ref('')

// 心情选项
const moodOptions = [
  { value: 'calm', label: '平静', icon: 'spa' },
  { value: 'happy', label: '开心', icon: 'sentiment_very_satisfied' },
  { value: 'reflective', label: '深思', icon: 'psychology' },
  { value: 'inspired', label: '灵感', icon: 'lightbulb' },
  { value: 'sad', label: '忧伤', icon: 'sentiment_dissatisfied' },
  { value: 'anxious', label: '焦虑', icon: 'sentiment_neutral' }
]

// 计算最终送达时间
const finalDeliverAt = computed(() => {
  if (selectedPreset.value === 'custom') {
    return customDate.value ? new Date(customDate.value).toISOString() : ''
  }
  const now = new Date()
  const years = parseInt(selectedPreset.value)
  now.setFullYear(now.getFullYear() + years)
  return now.toISOString()
})

// 是否可以提交
const canSubmit = computed(() => {
  return form.value.content.trim() && finalDeliverAt.value &&
    new Date(finalDeliverAt.value).getTime() > Date.now()
})

// 剩余天数预览
const previewDays = computed(() => {
  if (!finalDeliverAt.value) return 0
  const diff = new Date(finalDeliverAt.value).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

function selectPreset(value) {
  selectedPreset.value = value
  error.value = ''
}

function close() {
  resetForm()
  emit('close')
}

function resetForm() {
  form.value = {
    title: '',
    content: '',
    deliver_at: '',
    mood: ''
  }
  selectedPreset.value = '1y'
  customDate.value = ''
  error.value = ''
}

async function submit() {
  error.value = ''

  if (!form.value.content.trim()) {
    error.value = '请写下给未来的内容'
    return
  }

  if (!finalDeliverAt.value) {
    error.value = '请选择送达时间'
    return
  }

  if (new Date(finalDeliverAt.value).getTime() <= Date.now()) {
    error.value = '送达时间必须是未来时间'
    return
  }

  loading.value = true
  try {
    emit('create', {
      title: form.value.title.trim() || null,
      content: form.value.content.trim(),
      deliver_at: finalDeliverAt.value,
      mood: form.value.mood || null
    })
    close()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>

        <div class="relative bg-surface rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <!-- 头部 -->
          <div class="sticky top-0 bg-surface border-b border-outline-variant/20 px-6 py-4 flex justify-between items-center z-10">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">mail</span>
              <h2 class="font-headline text-xl font-bold text-primary">写给未来</h2>
            </div>
            <button @click="close" class="p-2 hover:bg-surface-container-high rounded-full transition-colors">
              <span class="material-symbols-outlined text-primary">close</span>
            </button>
          </div>

          <div class="p-6 space-y-6">
            <!-- 仪式感文案 -->
            <div class="text-center py-4 bg-primary/5 rounded-xl">
              <span class="material-symbols-outlined text-primary/40 text-3xl">schedule</span>
              <p class="font-body italic text-on-surface-variant text-sm mt-2">
                此刻写下的话，将在约定时间后拆开
              </p>
            </div>

            <!-- 标题（选填） -->
            <div>
              <label class="block font-label text-sm text-on-surface-variant mb-2">标题（选填）</label>
              <input
                v-model="form.title"
                type="text"
                maxlength="100"
                class="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none"
                placeholder="给这封信起个名字..."
              />
            </div>

            <!-- 内容 -->
            <div>
              <label class="block font-label text-sm text-on-surface-variant mb-2">信件内容 *</label>
              <textarea
                v-model="form.content"
                rows="6"
                maxlength="5000"
                class="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none resize-none"
                placeholder="亲爱的未来的我..."
              ></textarea>
              <p class="text-xs text-on-surface-variant/60 mt-1 text-right">{{ form.content.length }}/5000</p>
            </div>

            <!-- 送达时间 -->
            <div>
              <label class="block font-label text-sm text-on-surface-variant mb-3">送达时间</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="opt in deliverOptions"
                  :key="opt.value"
                  @click="selectPreset(opt.value)"
                  :class="[
                    'p-3 rounded-xl text-left transition-all border-2',
                    selectedPreset === opt.value
                      ? 'border-primary bg-primary-container/50'
                      : 'border-transparent bg-surface-container-low hover:bg-surface-container-high'
                  ]"
                >
                  <span class="font-label text-sm font-bold text-on-surface">{{ opt.label }}</span>
                  <span class="block font-body text-xs text-on-surface-variant mt-1">{{ opt.description }}</span>
                </button>
              </div>

              <!-- 自定义日期选择 -->
              <div v-if="selectedPreset === 'custom'" class="mt-3">
                <input
                  v-model="customDate"
                  type="date"
                  :min="new Date(Date.now() + 86400000).toISOString().split('T')[0]"
                  class="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none"
                />
              </div>

              <!-- 剩余天数预览 -->
              <div v-if="previewDays > 0" class="mt-3 p-3 rounded-lg bg-primary/5 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-sm">hourglass_empty</span>
                <p class="font-body text-sm text-primary">
                  将在 {{ previewDays }} 天后送达（约 {{ Math.floor(previewDays / 365) }} 年）
                </p>
              </div>
            </div>

            <!-- 心情 -->
            <div>
              <label class="block font-label text-sm text-on-surface-variant mb-2">此刻心情</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="mood in moodOptions"
                  :key="mood.value"
                  @click="form.mood = form.mood === mood.value ? '' : mood.value"
                  :class="[
                    'px-4 py-2 rounded-full text-sm transition-all flex items-center gap-1',
                    form.mood === mood.value
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  ]"
                >
                  <span class="material-symbols-outlined text-sm">{{ mood.icon }}</span>
                  {{ mood.label }}
                </button>
              </div>
            </div>

            <!-- 错误提示 -->
            <div v-if="error" class="p-3 rounded-lg bg-error/10 flex items-center gap-2">
              <span class="material-symbols-outlined text-error text-sm">error</span>
              <p class="font-body text-sm text-error">{{ error }}</p>
            </div>

            <!-- 操作按钮 -->
            <div class="flex justify-end gap-3 pt-4">
              <button
                @click="close"
                class="px-6 py-3 rounded-full font-label text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                取消
              </button>
              <button
                @click="submit"
                :disabled="loading || !canSubmit"
                class="px-6 py-3 rounded-full font-label bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span v-if="loading" class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                封存信件
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
