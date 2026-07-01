<script setup>
const props = defineProps({
  stats: {
    type: Object,
    default: null
  },
  // 嵌入模式：父级提供容器与标题，本组件仅渲染统计内容
  embedded: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div :class="embedded ? '' : 'bg-surface-container-lowest rounded-2xl p-6 shadow-lg'">
    <div v-if="!embedded" class="flex items-center gap-2 mb-4">
      <span class="material-symbols-outlined text-primary text-xl" style="font-variation-settings: 'FILL' 1;">campaign</span>
      <h3 class="font-headline text-lg font-bold text-on-surface">邮局公告</h3>
    </div>

    <div v-if="!stats" class="flex justify-center py-6">
      <span class="material-symbols-outlined text-primary text-2xl animate-spin">progress_activity</span>
    </div>

    <div v-else class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <!-- 封存中 -->
        <div class="p-3 rounded-xl bg-surface-container-high/50">
          <p class="font-label text-[10px] text-on-surface-variant/60 uppercase tracking-wider mb-1">封存中</p>
          <p class="font-headline text-2xl font-bold text-on-surface">{{ stats.pending }}</p>
        </div>
        <!-- 可拆开 -->
        <div class="p-3 rounded-xl bg-secondary/10">
          <p class="font-label text-[10px] text-secondary/60 uppercase tracking-wider mb-1">可拆开</p>
          <p class="font-headline text-2xl font-bold text-secondary">{{ stats.deliverable }}</p>
        </div>
      </div>

      <!-- 已拆开 -->
      <div class="p-3 rounded-xl bg-primary/10 flex items-center justify-between">
        <div>
          <p class="font-label text-[10px] text-primary/60 uppercase tracking-wider mb-1">已拆开</p>
          <p class="font-headline text-2xl font-bold text-primary">{{ stats.opened }}</p>
        </div>
        <span class="material-symbols-outlined text-primary text-2xl">drafts</span>
      </div>

      <!-- 总计 -->
      <div class="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
        <span class="font-body text-sm text-on-surface-variant">总计</span>
        <span class="font-headline text-lg font-bold text-primary">{{ stats.total }}</span>
      </div>
    </div>
  </div>
</template>
