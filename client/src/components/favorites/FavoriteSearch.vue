<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'search'])

const localValue = ref(props.modelValue)
let debounceTimer = null

watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})

function onInput() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    emit('update:modelValue', localValue.value)
    emit('search', localValue.value)
  }, 300)
}

function clearSearch() {
  localValue.value = ''
  emit('update:modelValue', '')
  emit('search', '')
}
</script>

<template>
  <div class="relative">
    <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>
    <input 
      v-model="localValue"
      type="text"
      @input="onInput"
      placeholder="搜索收藏..."
      class="w-full pl-12 pr-10 py-3 rounded-full bg-surface-container-low border border-outline-variant/30 text-on-surface placeholder:text-secondary/50 focus:border-primary focus:outline-none transition-colors"
    />
    <button 
      v-if="localValue"
      @click="clearSearch"
      class="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-container-high rounded-full transition-colors"
    >
      <span class="material-symbols-outlined text-secondary text-sm">close</span>
    </button>
  </div>
</template>
