<script setup>
import { ref, watch } from 'vue'
import { uploadFavoriteImage } from '@/api'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  initialData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'create'])

const form = ref({
  type: 'quote',
  title: '',
  content: '',
  source: '',
  image: '',
  badge: '',
  tags: [],
  mood: ''
})

const newTag = ref('')
const loading = ref(false)
const uploadingImage = ref(false)
const imagePreview = ref('')
const fileInputRef = ref(null)

const moodOptions = [
  { value: 'calm', label: '平静', icon: 'spa' },
  { value: 'joyful', label: '愉悦', icon: 'sentiment_very_satisfied' },
  { value: 'melancholy', label: '忧伤', icon: 'water_drop' },
  { value: 'inspired', label: '灵感', icon: 'lightbulb' },
  { value: 'peaceful', label: '宁静', icon: 'nature' }
]

const typeOptions = [
  { value: 'quote', label: '引用', description: '经典语录或摘抄' },
  { value: 'image', label: '图片', description: '带有配图的灵感' },
  { value: 'vertical', label: '竖排', description: '竖排文字展示' },
  { value: 'featured', label: '精选', description: '年度精选内容' },
  { value: 'minimal', label: '简约', description: '简约风格展示' }
]

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.initialData) {
      form.value = {
        type: props.initialData.type || 'quote',
        title: props.initialData.title || '',
        content: props.initialData.content || '',
        source: props.initialData.source || '',
        image: props.initialData.image || '',
        badge: props.initialData.badge || '',
        tags: props.initialData.tags || [],
        mood: props.initialData.mood || ''
      }
      if (props.initialData.image) {
        imagePreview.value = props.initialData.image
      }
    } else {
      resetForm()
    }
  }
})

function resetForm() {
  form.value = {
    type: 'quote',
    title: '',
    content: '',
    source: '',
    image: '',
    badge: '',
    tags: [],
    mood: ''
  }
  newTag.value = ''
  imagePreview.value = ''
}

function close() {
  resetForm()
  emit('close')
}

function addTag() {
  const tag = newTag.value.trim()
  if (tag && form.value.tags.length < 5 && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
    newTag.value = ''
  }
}

function removeTag(index) {
  form.value.tags.splice(index, 1)
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleImageUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    alert('只支持 JPG、PNG、GIF 格式')
    return
  }
  
  if (file.size > 2 * 1024 * 1024) {
    alert('图片大小不能超过 2MB')
    return
  }
  
  uploadingImage.value = true
  
  const reader = new FileReader()
  reader.onload = async (e) => {
    imagePreview.value = e.target?.result
  }
  reader.readAsDataURL(file)
  
  try {
    const formData = new FormData()
    formData.append('image', file)
    
    const result = await uploadFavoriteImage(formData)
    form.value.image = result.image_url
  } catch (error) {
    alert(error.message || '上传失败')
    imagePreview.value = ''
  } finally {
    uploadingImage.value = false
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

function removeImage() {
  form.value.image = ''
  imagePreview.value = ''
}

async function submit() {
  if (!form.value.content.trim()) {
    alert('请输入内容')
    return
  }

  loading.value = true
  try {
    const data = { ...form.value }
    if (data.type === 'quote' || data.type === 'minimal') {
      data.title = ''
      data.image = ''
      data.badge = ''
    }
    if (data.type !== 'quote' && data.type !== 'featured') {
      data.source = ''
    }
    if (data.type !== 'featured') {
      data.badge = ''
    }
    if (data.type !== 'image' && data.type !== 'featured') {
      data.image = ''
    }
    
    emit('create', data)
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
          <div class="sticky top-0 bg-surface border-b border-outline-variant/20 px-6 py-4 flex justify-between items-center">
            <h2 class="font-headline text-xl font-bold text-primary">创建收藏</h2>
            <button @click="close" class="p-2 hover:bg-surface-container-high rounded-full transition-colors">
              <span class="material-symbols-outlined text-primary">close</span>
            </button>
          </div>

          <div class="p-6 space-y-6">
            <div>
              <label class="block font-label text-sm text-secondary mb-3">类型</label>
              <div class="grid grid-cols-2 gap-2">
                <button 
                  v-for="opt in typeOptions" 
                  :key="opt.value"
                  @click="form.type = opt.value"
                  :class="[
                    'p-3 rounded-xl text-left transition-all border-2',
                    form.type === opt.value 
                      ? 'border-primary bg-primary-container/50' 
                      : 'border-transparent bg-surface-container-low hover:bg-surface-container-high'
                  ]"
                >
                  <span class="font-label text-sm font-bold text-on-surface">{{ opt.label }}</span>
                  <span class="block font-body text-xs text-secondary mt-1">{{ opt.description }}</span>
                </button>
              </div>
            </div>

            <div v-if="form.type !== 'quote' && form.type !== 'minimal'">
              <label class="block font-label text-sm text-secondary mb-2">标题</label>
              <input 
                v-model="form.title" 
                type="text" 
                maxlength="100" 
                class="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none" 
                placeholder="输入标题..." 
              />
            </div>

            <div>
              <label class="block font-label text-sm text-secondary mb-2">内容 *</label>
              <textarea 
                v-model="form.content" 
                rows="4" 
                maxlength="1000" 
                class="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none resize-none" 
                placeholder="输入内容..."
              ></textarea>
              <p class="text-xs text-secondary/60 mt-1 text-right">{{ form.content.length }}/1000</p>
            </div>

            <div v-if="form.type === 'quote' || form.type === 'featured'">
              <label class="block font-label text-sm text-secondary mb-2">来源</label>
              <input 
                v-model="form.source" 
                type="text" 
                maxlength="100" 
                class="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none" 
                placeholder="输入来源..." 
              />
            </div>

            <div v-if="form.type === 'image' || form.type === 'featured'">
              <label class="block font-label text-sm text-secondary mb-2">图片</label>
              <input 
                ref="fileInputRef"
                type="file"
                accept="image/jpeg,image/png,image/gif"
                class="hidden"
                @change="handleImageUpload"
              />
              
              <div v-if="imagePreview" class="relative mb-3">
                <img 
                  :src="imagePreview" 
                  alt="预览图片" 
                  class="w-full h-48 object-cover rounded-lg"
                />
                <button 
                  @click="removeImage"
                  class="absolute top-2 right-2 p-1.5 bg-surface/80 backdrop-blur-sm rounded-full hover:bg-surface transition-colors"
                >
                  <span class="material-symbols-outlined text-error text-sm">close</span>
                </button>
              </div>
              
              <button 
                @click="triggerFileInput"
                :disabled="uploadingImage"
                class="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none text-left hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <span v-if="uploadingImage" class="flex items-center gap-2 text-secondary">
                  <span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  上传中...
                </span>
                <span v-else-if="form.image" class="flex items-center gap-2 text-primary">
                  <span class="material-symbols-outlined text-sm">check_circle</span>
                  已上传，点击更换
                </span>
                <span v-else class="flex items-center gap-2 text-secondary">
                  <span class="material-symbols-outlined text-sm">add_photo_alternate</span>
                  点击上传图片 (JPG/PNG/GIF, 最大2MB)
                </span>
              </button>
            </div>

            <div v-if="form.type === 'featured'">
              <label class="block font-label text-sm text-secondary mb-2">徽章</label>
              <input 
                v-model="form.badge" 
                type="text" 
                maxlength="20" 
                class="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none" 
                placeholder="如：年度精选" 
              />
            </div>

            <div>
              <label class="block font-label text-sm text-secondary mb-2">标签 (最多5个)</label>
              <div class="flex flex-wrap gap-2 mb-2">
                <span 
                  v-for="(tag, index) in form.tags" 
                  :key="index"
                  class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-sm"
                >
                  {{ tag }}
                  <button @click="removeTag(index)" class="hover:text-error">
                    <span class="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              </div>
              <div class="flex gap-2">
                <input 
                  v-model="newTag"
                  type="text"
                  maxlength="20"
                  @keyup.enter="addTag"
                  class="flex-1 px-4 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none text-sm"
                  placeholder="输入标签后按回车添加"
                  :disabled="form.tags.length >= 5"
                />
                <button 
                  @click="addTag"
                  :disabled="form.tags.length >= 5"
                  class="px-4 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 hover:bg-surface-container-high disabled:opacity-50 transition-colors"
                >
                  <span class="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </div>

            <div>
              <label class="block font-label text-sm text-secondary mb-2">心情</label>
              <div class="flex flex-wrap gap-2">
                <button 
                  v-for="mood in moodOptions" 
                  :key="mood.value" 
                  @click="form.mood = mood.value" 
                  :class="[
                    'px-4 py-2 rounded-full text-sm transition-all flex items-center gap-1',
                    form.mood === mood.value 
                      ? 'bg-primary text-on-primary' 
                      : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'
                  ]"
                >
                  <span class="material-symbols-outlined text-sm">{{ mood.icon }}</span>
                  {{ mood.label }}
                </button>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <button 
                @click="close" 
                class="px-6 py-3 rounded-full font-label text-secondary hover:bg-surface-container-high transition-colors"
              >
                取消
              </button>
              <button 
                @click="submit" 
                :disabled="loading || !form.content.trim()"
                class="px-6 py-3 rounded-full font-label bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <span v-if="loading" class="material-symbols-outlined text-sm animate-spin mr-1">progress_activity</span>
                创建
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
