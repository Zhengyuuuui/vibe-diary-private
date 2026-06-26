<script setup>
import { computed } from 'vue'

const props = defineProps({
  stats: {
    type: Object,
    default: null
  }
})

const typeLabels = {
  quote: '引用',
  image: '图片',
  vertical: '竖排',
  featured: '精选',
  minimal: '简约'
}

const moodLabels = {
  calm: { label: '平静', icon: 'spa', color: 'bg-blue-100 text-blue-700' },
  joyful: { label: '愉悦', icon: 'sentiment_very_satisfied', color: 'bg-yellow-100 text-yellow-700' },
  melancholy: { label: '忧伤', icon: 'water_drop', color: 'bg-indigo-100 text-indigo-700' },
  inspired: { label: '灵感', icon: 'lightbulb', color: 'bg-amber-100 text-amber-700' },
  peaceful: { label: '宁静', icon: 'nature', color: 'bg-green-100 text-green-700' }
}

const byTypeArray = computed(() => {
  if (!props.stats?.byType) return []
  return props.stats.byType.map(item => ({
    ...item,
    label: typeLabels[item.type] || item.type
  }))
})

const byMoodArray = computed(() => {
  if (!props.stats?.byMood) return []
  return props.stats.byMood.map(item => ({
    ...item,
    ...moodLabels[item.mood] || { label: item.mood, icon: 'help', color: 'bg-gray-100 text-gray-700' }
  }))
})
</script>

<template>
  <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_20px_40px_rgba(105,93,74,0.03)] overflow-y-auto max-h-[280px]">
    <div class="flex items-center gap-2 mb-4">
      <span class="material-symbols-outlined text-primary text-xl" style="font-variation-settings: 'FILL' 1;">analytics</span>
      <h3 class="font-headline text-lg font-bold text-on-surface">收藏统计</h3>
    </div>

    <div v-if="!stats" class="flex justify-center py-6">
      <span class="material-symbols-outlined text-primary text-2xl animate-spin">progress_activity</span>
    </div>

    <div v-else class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="p-3 rounded-xl bg-primary/10">
          <p class="font-label text-[10px] text-primary/60 uppercase tracking-wider mb-1">总收藏</p>
          <p class="font-headline text-2xl font-bold text-primary">{{ stats.total }}</p>
        </div>
        <div class="p-3 rounded-xl bg-secondary/10">
          <p class="font-label text-[10px] text-secondary/60 uppercase tracking-wider mb-1">本月新增</p>
          <p class="font-headline text-2xl font-bold text-secondary">{{ stats.thisMonth }}</p>
        </div>
      </div>

      <div v-if="byTypeArray.length > 0">
        <p class="font-label text-[10px] text-secondary/60 uppercase tracking-wider mb-2">按类型</p>
        <div class="flex flex-wrap gap-1.5">
          <div
            v-for="item in byTypeArray"
            :key="item.type"
            class="px-2 py-1 rounded-lg bg-surface-container-low"
          >
            <span class="font-label text-xs text-secondary">{{ item.label }}</span>
            <span class="font-headline text-xs font-bold text-on-surface ml-1">{{ item.count }}</span>
          </div>
        </div>
      </div>

      <div v-if="byMoodArray.length > 0">
        <p class="font-label text-[10px] text-secondary/60 uppercase tracking-wider mb-2">按心情</p>
        <div class="flex flex-wrap gap-1.5">
          <div
            v-for="item in byMoodArray"
            :key="item.mood"
            :class="['px-2 py-1 rounded-lg flex items-center gap-1', item.color]"
          >
            <span class="material-symbols-outlined text-xs">{{ item.icon }}</span>
            <span class="font-label text-xs">{{ item.label }}</span>
            <span class="font-headline text-xs font-bold">{{ item.count }}</span>
          </div>
        </div>
      </div>

      <div v-if="stats.topTags && stats.topTags.length > 0">
        <p class="font-label text-[10px] text-secondary/60 uppercase tracking-wider mb-2">常用标签</p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="item in stats.topTags.slice(0, 5)"
            :key="item.tag"
            class="px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary text-xs font-label"
          >
            {{ item.tag }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
