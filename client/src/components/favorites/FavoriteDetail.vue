<script setup>
import { ref, computed, watch } from 'vue'
import { uploadFavoriteImage } from '@/api'

const props = defineProps({
  favorite: {
    type: Object,
    default: null
  },
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'update', 'delete'])

const editMode = ref(false)
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
  { value: 'quote', label: '引用' },
  { value: 'image', label: '图片' },
  { value: 'vertical', label: '竖排' },
  { value: 'featured', label: '精选' },
  { value: 'minimal', label: '简约' }
]

const formattedDate = computed(() => {
  if (!props.favorite?.created_at) return ''
  const date = new Date(props.favorite.created_at)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

watch(() => props.favorite, (newVal) => {
  if (newVal) {
    form.value = {
      type: newVal.type || 'quote',
      title: newVal.title || '',
      content: newVal.content || '',
      source: newVal.source || '',
      image: newVal.image || '',
      badge: newVal.badge || '',
      tags: newVal.tags || [],
      mood: newVal.mood || ''
    }
    if (newVal.image) {
      imagePreview.value = newVal.image
    }
  }
}, { immediate: true })

function close() {
  editMode.value = false
  emit('close')
}

function startEdit() {
  editMode.value = true
  if (props.favorite?.image) {
    imagePreview.value = props.favorite.image
  }
}

function cancelEdit() {
  editMode.value = false
  if (props.favorite) {
    form.value = {
      type: props.favorite.type || 'quote',
      title: props.favorite.title || '',
      content: props.favorite.content || '',
      source: props.favorite.source || '',
      image: props.favorite.image || '',
      badge: props.favorite.badge || '',
      tags: props.favorite.tags || [],
      mood: props.favorite.mood || ''
    }
    imagePreview.value = props.favorite.image || ''
  }
}

function saveEdit() {
  emit('update', props.favorite.id, form.value)
  editMode.value = false
}

function confirmDelete() {
  if (confirm('确定要删除这条收藏吗？')) {
    emit('delete', props.favorite.id)
    close()
  }
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
    imagePreview.value = form.value.image || ''
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
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show && favorite" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>
        
        <div class="relative bg-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-surface border-b border-outline-variant/20 px-6 py-4 flex justify-between items-center">
            <h2 class="font-headline text-xl font-bold text-primary">
              {{ editMode ? '编辑收藏' : '收藏详情' }}
            </h2>
            <div class="flex items-center gap-2">
              <button v-if="!editMode" @click="startEdit" class="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                <span class="material-symbols-outlined text-primary">edit</span>
              </button>
              <button v-if="!editMode" @click="confirmDelete" class="p-2 hover:bg-error-container rounded-full transition-colors">
                <span class="material-symbols-outlined text-error">delete</span>
              </button>
              <button @click="editMode ? cancelEdit() : close()" class="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                <span class="material-symbols-outlined text-primary">close</span>
              </button>
            </div>
          </div>

          <div v-if="editMode" class="p-6 space-y-6">
            <div>
              <label class="block font-label text-sm text-secondary mb-2">类型</label>
              <select v-model="form.type" class="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none">
                <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>

            <div v-if="form.type !== 'quote' && form.type !== 'minimal'">
              <label class="block font-label text-sm text-secondary mb-2">标题</label>
              <input v-model="form.title" type="text" maxlength="100" class="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none" placeholder="输入标题..." />
            </div>

            <div>
              <label class="block font-label text-sm text-secondary mb-2">内容 *</label>
              <textarea v-model="form.content" rows="4" maxlength="1000" class="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none resize-none" placeholder="输入内容..."></textarea>
            </div>

            <div v-if="form.type === 'quote' || form.type === 'featured'">
              <label class="block font-label text-sm text-secondary mb-2">来源</label>
              <input v-model="form.source" type="text" maxlength="100" class="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none" placeholder="输入来源..." />
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
              <input v-model="form.badge" type="text" maxlength="20" class="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:outline-none" placeholder="如：年度精选" />
            </div>

            <div>
              <label class="block font-label text-sm text-secondary mb-2">心情</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="mood in moodOptions" :key="mood.value" @click="form.mood = mood.value" :class="['px-4 py-2 rounded-full text-sm transition-all', form.mood === mood.value ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-secondary hover:bg-surface-container-high']">
                  <span class="material-symbols-outlined text-sm mr-1">{{ mood.icon }}</span>
                  {{ mood.label }}
                </button>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <button @click="cancelEdit" class="px-6 py-3 rounded-full font-label text-secondary hover:bg-surface-container-high transition-colors">
                取消
              </button>
              <button @click="saveEdit" class="px-6 py-3 rounded-full font-label bg-primary text-on-primary hover:bg-primary/90 transition-colors">
                保存
              </button>
            </div>
          </div>

          <div v-else class="p-6">
            <div class="mb-6">
              <span class="inline-block px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-xs font-label uppercase tracking-wider">
                {{ typeOptions.find(t => t.value === favorite.type)?.label || favorite.type }}
              </span>
            </div>

            <div v-if="favorite.image" class="mb-6 rounded-xl overflow-hidden">
              <img :src="favorite.image" :alt="favorite.title" class="w-full h-64 object-cover" />
            </div>

            <h3 v-if="favorite.title" class="font-headline text-2xl font-bold text-on-surface mb-4">{{ favorite.title }}</h3>
            
            <p class="font-body text-on-surface text-lg leading-relaxed mb-6">{{ favorite.content }}</p>

            <div v-if="favorite.source" class="flex items-center gap-3 mb-6">
              <div class="h-[1px] w-8 bg-outline-variant/30"></div>
              <span class="font-label text-sm text-secondary">{{ favorite.source }}</span>
            </div>

            <div v-if="favorite.badge" class="mb-6">
              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-sm">
                <span class="material-symbols-outlined text-sm">auto_stories</span>
                {{ favorite.badge }}
              </span>
            </div>

            <div v-if="favorite.tags && favorite.tags.length > 0" class="flex flex-wrap gap-2 mb-6">
              <span v-for="tag in favorite.tags" :key="tag" class="px-3 py-1 rounded-full bg-surface-container-high text-secondary text-sm">
                {{ tag }}
              </span>
            </div>

            <div v-if="favorite.mood" class="mb-6">
              <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-sm">
                <span class="material-symbols-outlined text-sm">{{ moodOptions.find(m => m.value === favorite.mood)?.icon }}</span>
                {{ moodOptions.find(m => m.value === favorite.mood)?.label }}
              </span>
            </div>

            <div class="pt-6 border-t border-outline-variant/20">
              <p class="font-label text-xs text-secondary">创建于 {{ formattedDate }}</p>
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
