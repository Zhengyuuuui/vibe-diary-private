<script setup>
import { ref, onMounted } from 'vue'
import { useFavoritesStore } from '@/stores/favorites'

const store = useFavoritesStore()
const randomFavorites = ref([])
const loading = ref(false)

const emit = defineEmits(['spotlight', 'close-panel'])

// 是否为首次加载（首次不触发 spotlight，避免页面刚进来就弹窗）
let isInitialLoad = true

async function refreshRandom() {
  loading.value = true
  try {
    randomFavorites.value = await store.getRandomInspiration(3)
    // 仅用户手动点"换一批"时才触发 3D 聚焦，首次加载静默
    if (!isInitialLoad && randomFavorites.value.length > 0) {
      const pick = randomFavorites.value[Math.floor(Math.random() * randomFavorites.value.length)]
      emit('spotlight', pick)
    }
    isInitialLoad = false
  } finally {
    loading.value = false
  }
}

function closePanel() {
  emit('close-panel')
}

onMounted(() => {
  refreshRandom()
})
</script>

<template>
  <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_20px_40px_rgba(105,93,74,0.03)] overflow-y-auto max-h-[320px] relative">
    <!-- 收起按钮在容器右上角 -->
    <button
      @click="closePanel"
      class="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
    >
      <span class="material-symbols-outlined text-primary/60 text-sm">chevron_right</span>
    </button>

    <div class="flex justify-between items-center mb-4 pr-8">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-xl" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
        <h3 class="font-headline text-lg font-bold text-on-surface">随机灵感</h3>
      </div>
      <button
        @click="refreshRandom"
        :disabled="loading"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-label hover:bg-primary/20 transition-all disabled:opacity-50"
      >
        <span class="material-symbols-outlined text-xs" :class="{ 'animate-spin': loading }">refresh</span>
        换一批
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <span class="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
    </div>

    <div v-else-if="randomFavorites.length === 0" class="text-center py-8">
      <span class="material-symbols-outlined text-secondary text-3xl mb-3">lightbulb</span>
      <p class="font-body text-secondary text-sm">还没有收藏内容</p>
    </div>

    <div v-else class="space-y-3">
      <TransitionGroup name="fade">
        <div
          v-for="fav in randomFavorites"
          :key="fav.id"
          class="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer group"
        >
          <div class="flex items-start gap-2">
            <span class="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors text-sm">format_quote</span>
            <div class="flex-1 min-w-0">
              <p class="font-body text-on-surface text-sm leading-relaxed line-clamp-2">{{ fav.content }}</p>
              <div v-if="fav.source" class="mt-1.5 flex items-center gap-1.5">
                <div class="h-[1px] w-3 bg-outline-variant/30"></div>
                <span class="font-label text-[10px] text-secondary">{{ fav.source }}</span>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
