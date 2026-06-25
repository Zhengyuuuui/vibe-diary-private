<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      type: null,
      mood: null
    })
  }
})

const emit = defineEmits(['update:modelValue', 'reset'])

const typeOptions = [
  { value: null, label: '全部类型' },
  { value: 'quote', label: '引用' },
  { value: 'image', label: '图片' },
  { value: 'vertical', label: '竖排' },
  { value: 'featured', label: '精选' },
  { value: 'minimal', label: '简约' }
]

const moodOptions = [
  { value: null, label: '全部心情', icon: 'filter_list' },
  { value: 'calm', label: '平静', icon: 'spa' },
  { value: 'joyful', label: '愉悦', icon: 'sentiment_very_satisfied' },
  { value: 'melancholy', label: '忧伤', icon: 'water_drop' },
  { value: 'inspired', label: '灵感', icon: 'lightbulb' },
  { value: 'peaceful', label: '宁静', icon: 'nature' }
]

function updateFilter(key, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}

function resetFilters() {
  emit('reset')
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-4">
    <div class="flex items-center gap-2">
      <span class="material-symbols-outlined text-secondary text-sm">category</span>
      <select 
        :value="modelValue.type" 
        @change="updateFilter('type', $event.target.value || null)"
        class="px-4 py-2 rounded-full bg-surface-container-low border border-outline-variant/30 text-sm font-label text-on-surface focus:border-primary focus:outline-none cursor-pointer"
      >
        <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <div class="flex items-center gap-2">
      <span class="material-symbols-outlined text-secondary text-sm">mood</span>
      <select 
        :value="modelValue.mood" 
        @change="updateFilter('mood', $event.target.value || null)"
        class="px-4 py-2 rounded-full bg-surface-container-low border border-outline-variant/30 text-sm font-label text-on-surface focus:border-primary focus:outline-none cursor-pointer"
      >
        <option v-for="opt in moodOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <button 
      v-if="modelValue.type || modelValue.mood"
      @click="resetFilters"
      class="flex items-center gap-1 px-4 py-2 rounded-full bg-error-container text-on-error-container text-sm font-label hover:bg-error-container/80 transition-colors"
    >
      <span class="material-symbols-outlined text-sm">close</span>
      清除筛选
    </button>
  </div>
</template>
