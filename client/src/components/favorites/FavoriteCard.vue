<script setup>
import { computed } from 'vue'

const props = defineProps({
  favorite: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click', 'edit', 'delete'])

const formattedDate = computed(() => {
  if (!props.favorite.created_at) return ''
  const date = new Date(props.favorite.created_at)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year} / ${month} / ${day}`
})

const parsedTags = computed(() => {
  if (!props.favorite.tags) return []
  return Array.isArray(props.favorite.tags) ? props.favorite.tags : []
})
</script>

<template>
  <div class="favorite-card group cursor-pointer" @click="emit('click', favorite)">
    <div v-if="favorite.type === 'quote'" class="bg-surface-container-low rounded-xl p-8 hover:bg-surface-container-highest transition-all duration-500">
      <div class="flex justify-between items-start mb-8">
        <span class="font-label text-[10px] uppercase tracking-[0.2em] text-outline">{{ formattedDate }}</span>
        <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">star</span>
      </div>
      <blockquote class="font-headline text-2xl leading-relaxed text-on-surface mb-6">
        {{ favorite.content }}
      </blockquote>
      <div v-if="favorite.source" class="flex items-center gap-3">
        <div class="h-[1px] w-8 bg-outline-variant/30"></div>
        <span class="font-label text-xs text-secondary">{{ favorite.source }}</span>
      </div>
    </div>

    <div v-else-if="favorite.type === 'image'" class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(105,93,74,0.03)] hover:shadow-[0_20px_40px_rgba(105,93,74,0.08)] transition-all duration-700">
      <div class="relative h-80 overflow-hidden">
        <img
          v-if="favorite.image"
          :src="favorite.image"
          :alt="favorite.title"
          class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        <div class="absolute top-4 right-4 bg-surface-60 backdrop-blur-md rounded-full p-2">
          <span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings: 'FILL' 1;">star</span>
        </div>
      </div>
      <div class="p-6">
        <div class="font-label text-[10px] uppercase tracking-[0.2em] text-outline mb-3">{{ formattedDate }}</div>
        <h3 v-if="favorite.title" class="font-headline text-lg font-bold text-on-surface mb-2">{{ favorite.title }}</h3>
        <p class="font-body text-secondary leading-relaxed">{{ favorite.content }}</p>
      </div>
    </div>

    <div v-else-if="favorite.type === 'vertical'" class="bg-surface-container-low rounded-xl p-8 relative min-h-[400px] flex flex-row-reverse justify-between hover:bg-surface-container-highest transition-all duration-500">
      <div class="writing-mode-vertical-rl font-headline text-3xl tracking-[0.3em] leading-loose text-primary/80 pt-8" style="writing-mode: vertical-rl;">
        {{ favorite.title }}
      </div>
      <div class="flex flex-col justify-between h-full">
        <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">star</span>
        <div class="space-y-4">
          <span class="font-label text-[10px] uppercase tracking-[0.2em] text-outline block">{{ formattedDate }}</span>
          <p class="font-body text-secondary max-w-[120px]">{{ favorite.content }}</p>
        </div>
      </div>
    </div>

    <div v-else-if="favorite.type === 'featured'" class="md:col-span-2 bg-primary-container rounded-xl overflow-hidden flex flex-col md:flex-row shadow-[0_20px_40px_rgba(105,93,74,0.06)] hover:bg-primary-container/80 transition-all duration-500">
      <div class="md:w-1/2 h-64 md:h-auto">
        <img
          v-if="favorite.image"
          :src="favorite.image"
          :alt="favorite.title"
          class="w-full h-full object-cover"
        />
      </div>
      <div class="p-10 md:w-1/2 flex flex-col justify-center">
        <div class="flex items-center gap-2 mb-6">
          <span class="material-symbols-outlined text-primary text-sm">auto_stories</span>
          <span v-if="favorite.badge" class="font-label text-[10px] uppercase tracking-[0.2em] text-primary/60">{{ favorite.badge }}</span>
        </div>
        <h2 v-if="favorite.title" class="font-headline text-3xl font-bold text-on-primary-container mb-4 leading-tight">{{ favorite.title }}</h2>
        <p class="font-body text-on-primary-container/80 text-lg mb-8 italic">{{ favorite.content }}</p>
        <div class="flex justify-between items-center">
          <span class="font-label text-[10px] uppercase tracking-[0.2em] text-on-primary-container/40">{{ formattedDate }}</span>
          <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">star</span>
        </div>
      </div>
    </div>

    <div v-else-if="favorite.type === 'minimal'" class="bg-surface-container-low rounded-xl p-8 border-l-4 border-primary/20 hover:border-primary transition-all duration-500">
      <div class="flex justify-between items-start mb-6">
        <span class="font-label text-[10px] uppercase tracking-[0.2em] text-outline">{{ formattedDate }}</span>
        <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">star</span>
      </div>
      <p class="font-headline text-xl text-on-surface leading-relaxed italic">
        {{ favorite.content }}
      </p>
      <div v-if="parsedTags.length > 0" class="mt-8 pt-6 border-t border-outline-variant/10">
        <span class="font-label text-xs text-secondary/60">分类: {{ parsedTags.join(' / ') }}</span>
      </div>
    </div>
  </div>
</template>
