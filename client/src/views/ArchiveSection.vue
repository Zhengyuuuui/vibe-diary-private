<script setup>
import { onMounted, computed, ref, inject } from 'vue'
import { useDiaryStore } from '@/stores/diary'
import { useRouter } from 'vue-router'

const store = useDiaryStore()
const router = useRouter()
const searchQuery = ref('')

// 从父级 ReflectionView 注入翻页方法
const flipToGarden = inject('flipToGarden', null)

onMounted(() => {
  store.loadDiaries()
})

const coverStyles = {
  leather: { class: 'leather-texture', textClass: 'text-on-primary' },
  linen: { class: 'linen-texture bg-primary-container', textClass: 'text-primary' },
  pattern: { class: 'pattern-texture', textClass: 'text-on-surface' }
}

const bookHeights = ['h-56', 'h-60', 'h-64', 'h-68', 'h-72']
const bookWidths = ['w-14', 'w-16', 'w-18', 'w-20']

function getBookStyle(index) {
  return {
    height: bookHeights[index % bookHeights.length],
    width: bookWidths[index % bookWidths.length]
  }
}

function openDiary(id) {
  router.push(`/diary/${id}`)
}

const filteredDiaries = computed(() => {
  if (!searchQuery.value) return store.diaries
  return store.diaries.filter(diary =>
    diary.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const stats = computed(() => ({
  totalEntries: store.diaries.length,
  collections: Math.ceil(store.diaries.length / 5)
}))

function goBack() {
  router.push('/')
}

// 触发翻页到心灵花园
async function handleExploreGarden() {
  if (flipToGarden) {
    await flipToGarden()
  } else {
    router.push('/reflection/garden')
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <header class="bg-background-85 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4">
      <div class="flex items-center gap-4">
        <button @click="goBack" class="material-symbols-outlined text-primary hover:scale-110 transition-transform cursor-pointer">
          arrow_back
        </button>
        <span class="text-xl font-bold text-primary font-headline tracking-tight">氛围日记</span>
      </div>
      <div class="hidden md:flex items-center gap-8">
        <a href="/" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-sm">首页</a>
        <a href="#" class="text-primary font-bold hover:text-primary transition-colors duration-300 font-label text-sm">回望</a>
        <a href="/favorites" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-sm">灵感</a>
        <a href="/settings" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-sm">设置</a>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative group">
          <input
            v-model="searchQuery"
            class="bg-surface-container-low border-none focus:ring-0 text-sm font-label rounded-full py-2 pl-4 pr-10 w-48 md:w-64 transition-all focus:w-72"
            placeholder="搜索往事..."
            type="text"
          />
          <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary/40">search</span>
        </div>
        <button class="p-2 text-primary/60 hover:text-primary transition-colors">
          <span class="material-symbols-outlined">filter_list</span>
        </button>
      </div>
    </header>

    <main class="flex-1 w-full overflow-hidden relative">
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 pointer-events-none"></div>

      <div class="max-w-6xl mx-auto px-6 py-12 relative z-10 h-full">
        <header class="mb-16">
          <span class="font-label text-xs uppercase tracking-[0.3em] text-primary/40 mb-2 block">Library of Memories</span>
          <h1 class="font-headline text-5xl font-bold text-primary tracking-tighter leading-tight">时光之书</h1>

          <div class="mt-6 flex items-center gap-4">
            <a class="inline-flex items-center gap-2 group px-4 py-2 bg-primary/5 hover:bg-primary/10 rounded-full transition-all duration-300" href="#">
              <span class="material-symbols-outlined text-primary/60 group-hover:text-primary text-sm">timeline</span>
              <span class="font-label text-xs uppercase tracking-widest text-primary/60 group-hover:text-primary transition-colors">切换至时光轴</span>
            </a>
            <div class="h-4 w-[1px] bg-primary/10"></div>
            <div class="flex items-center gap-2 opacity-100">
              <span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings: 'FILL' 1;">grid_view</span>
              <span class="font-label text-xs uppercase tracking-widest text-primary font-bold">当前：书架</span>
            </div>
          </div>
        </header>

        <div class="space-y-32">
          <div class="relative" v-if="filteredDiaries.length > 0">
            <div class="flex items-end gap-1 px-4 mb-1 overflow-x-auto">
              <div
                v-for="(diary, index) in filteredDiaries"
                :key="diary.id"
                @click="openDiary(diary.id)"
                class="group relative cursor-pointer transform transition-all duration-500 hover:-translate-y-4 hover:rotate-1 flex-shrink-0"
              >
                <div
                  :class="[
                    coverStyles[diary.cover_style]?.class || 'leather-texture',
                    getBookStyle(index).width,
                    getBookStyle(index).height,
                    'rounded-l-sm rounded-r-md book-shadow flex items-center justify-center border-l border-white/10 relative overflow-hidden'
                  ]"
                >
                  <div
                    :class="[
                      'book-spine font-headline text-sm tracking-widest py-4',
                      coverStyles[diary.cover_style]?.textClass || 'text-on-primary'
                    ]"
                  >
                    {{ diary.title }}
                  </div>
                  <div
                    :class="[
                      'absolute bottom-4 font-label text-[10px]',
                      coverStyles[diary.cover_style]?.textClass || 'text-on-primary'
                    ]"
                    style="opacity: 0.6"
                  >
                    {{ diary.created_at?.substring(0, 7) }}
                  </div>
                </div>
                <div class="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-surface-80 backdrop-blur px-3 py-1 rounded text-[10px] font-label uppercase tracking-widest text-primary shadow-sm">
                  Explore Chapter
                </div>
              </div>
            </div>

            <div class="h-6 w-full bg-surface-container rounded-sm relative shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05),inset_0_-4px_6px_rgba(0,0,0,0.05)]">
              <div class="absolute inset-0 bg-inverse-surface/5 pointer-events-none"></div>
              <div class="absolute top-0 left-0 right-0 h-[1px] bg-surface/30"></div>
            </div>
            <div class="mt-4 font-label text-[10px] uppercase tracking-widest text-primary/40 pl-4">回望日记</div>
          </div>

          <div v-else class="text-center py-20">
            <span class="material-symbols-outlined text-6xl text-outline-variant mb-4">inventory_2</span>
            <p class="font-headline text-xl text-on-surface-variant">书架空空如也</p>
            <p class="font-label text-sm text-on-surface-variant/70 mt-2">还没有回望的日记</p>
          </div>
        </div>

        <div class="mt-24 flex items-center justify-center gap-16 border-t border-primary/10 pt-12">
          <div class="text-center">
            <span class="block font-headline text-4xl font-bold text-primary">{{ stats.totalEntries }}</span>
            <span class="font-label text-[10px] uppercase tracking-widest text-primary/40">Total Entries</span>
          </div>
          <div class="h-12 w-[1px] bg-primary/10"></div>
          <div class="text-center">
            <span class="block font-headline text-4xl font-bold text-primary">{{ stats.collections }}</span>
            <span class="font-label text-[10px] uppercase tracking-widest text-primary/40">Collections</span>
          </div>
        </div>
      </div>

      <!-- 探索花园按钮（右下角） -->
      <div class="fixed bottom-12 right-12 z-20 group">
        <!-- 微细提示 -->
        <div class="absolute -top-10 right-0 opacity-40 group-hover:opacity-100 transition-opacity">
          <span class="font-label text-[10px] uppercase tracking-[0.3em] text-primary whitespace-nowrap">
            翻开日记，探索内心
          </span>
        </div>
        <button
          @click="handleExploreGarden"
          class="flex items-center gap-2 px-6 py-4 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/30 hover:scale-95 transition-all"
        >
          <span class="material-symbols-outlined text-xl group-hover:animate-pulse">auto_stories</span>
          <span class="font-label text-sm uppercase tracking-widest">探索花园</span>
        </button>
      </div>

      <div class="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
        <span class="font-label text-[10px] uppercase tracking-[0.3em] text-primary">Scroll to explore deeper shelves</span>
        <span class="material-symbols-outlined animate-bounce text-primary">keyboard_double_arrow_down</span>
      </div>
    </main>

    <nav class="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 flex justify-around items-center py-3 px-4 bg-surface-90 backdrop-blur-lg rounded-full shadow-lg">
      <a href="/" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
        <span class="material-symbols-outlined">auto_stories</span>
        <span class="font-label text-[10px] uppercase tracking-widest mt-1">首页</span>
      </a>
      <a href="#" class="flex flex-col items-center justify-center text-primary scale-110">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">inventory_2</span>
        <span class="font-label text-[10px] uppercase tracking-widest mt-1">回望</span>
      </a>
      <a href="/favorites" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
        <span class="material-symbols-outlined">star</span>
        <span class="font-label text-[10px] uppercase tracking-widest mt-1">灵感</span>
      </a>
      <a href="/settings" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
        <span class="material-symbols-outlined">settings</span>
        <span class="font-label text-[10px] uppercase tracking-widest mt-1">设置</span>
      </a>
    </nav>
  </div>
</template>

<style scoped>
.book-spine {
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.book-shadow {
  box-shadow: 5px 0 15px rgba(0, 0, 0, 0.2), inset 1px 0 1px rgba(255, 255, 255, 0.1);
}
</style>
