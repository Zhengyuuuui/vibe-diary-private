<script setup>
import { onMounted, computed, ref, inject } from 'vue'
import { useDiaryStore } from '@/stores/diary'
import { useRouter } from 'vue-router'

const store = useDiaryStore()
const router = useRouter()
const searchQuery = ref('')
const showMobileSearch = ref(false) // 🆕 手机端搜索框显示状态
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const API_BASE = `${API_BASE_URL}/api/v1`
// 从父级 ReflectionView 注入翻页方法
const flipToGarden = inject('flipToGarden', null)

// 🆕 视图切换状态（'bookshelf' | 'timeline'）
const viewMode = ref('bookshelf')

// 🆕 里程碑统计数据
const milestoneStats = ref({
  total_entries: 0,
  total_pages: 0,
  streak_days: 0,
  max_streak_days: 0,
  years_of_use: 0,
  weekly_pages: 0, // 🆕 默认为数字（兼容数字和数组）
  milestones: []
})

// 🆕 加载里程碑统计数据
async function loadMilestoneStats() {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE}/diaries/stats`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    const result = await response.json()
    if (result.code === 200) {
      milestoneStats.value = {
        total_entries: result.data.total_entries || 0,
        total_pages: result.data.total_pages || 0,
        streak_days: result.data.streak_days || 0,
        max_streak_days: result.data.max_streak_days || 0,
        years_of_use: result.data.years_of_use || 0,
        weekly_pages: result.data.weekly_pages || [],
        milestones: result.data.milestones || []
      }
    }
  } catch (error) {
    console.error('加载里程碑统计失败:', error)
    // 降级处理：保持默认空数据
  }
}

// 🆕 切换视图模式
function toggleViewMode() {
  viewMode.value = viewMode.value === 'bookshelf' ? 'timeline' : 'bookshelf'
}

// 🆕 搜索过滤（必须在 sortedDiaries 之前声明，避免 TDZ）
const filteredDiaries = computed(() => {
  if (!searchQuery.value) return store.diaries
  return store.diaries.filter(diary =>
    diary.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 🆕 按时间排序的日记列表（用于时间轴）
const sortedDiaries = computed(() => {
  return [...filteredDiaries.value].sort((a, b) => {
    return new Date(a.created_at) - new Date(b.created_at)
  })
})

// 🆕 判断日记是否在里程碑位置（用于标注）
function isMilestonePosition(diary) {
  const totalEntries = milestoneStats.value.total_entries || store.diaries.length
  const currentCount = sortedDiaries.value.indexOf(diary) + 1

  // 检查是否匹配里程碑的进度值
  const milestones = milestoneStats.value.milestones || []
  for (const milestone of milestones) {
    if (milestone.achieved && milestone.progress === currentCount) {
      return milestone
    }
  }
  return null
}

// 🆕 横向滚动控制
const timelineContainer = ref(null)

// 🆕 同步滚动：书本容器滚动处理（简化版，不再需要 tickContainer）
function syncScroll(sourceContainer) {
  // 当前只有一个容器，不需要同步逻辑
}

function scrollTimeline(direction) {
  if (timelineContainer.value) {
    const scrollAmount = 200
    if (direction === 'left') {
      timelineContainer.value.scrollLeft -= scrollAmount
    } else {
      timelineContainer.value.scrollLeft += scrollAmount
    }
  }
}

// 🆕 鼓励语文案库（预设）
const celebrationMessages = [
  '坚持记录，成就非凡',
  '每一页都是成长的印记',
  '时光见证你的坚持',
  '记录让回忆永恒',
  '书写是最好的陪伴',
  '每一次落笔都是进步',
  '你的故事值得珍藏',
  '日记是最好的礼物'
]

// 🆕 关键词降级方案（后端未提供时）
const defaultKeywords = ['记录', '坚持', '成长']

// 🆕 获取里程碑关键词（后端提供或降级）
function getMilestoneKeywords(milestone) {
  return milestone.keywords || defaultKeywords
}

// 🆕 获取里程碑鼓励语（随机选择）
function getCelebrationMessage() {
  return celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]
}

// 🆕 格式化达成时间
function formatAchievedTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  store.loadDiaries()
  loadMilestoneStats() // 🆕 加载里程碑统计
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
    <header class="bg-background-85 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-4 md:px-6 py-4">
      <div class="flex items-center gap-2 md:gap-4">
        <button @click="goBack" class="material-symbols-outlined text-primary hover:scale-110 transition-transform cursor-pointer">
          arrow_back
        </button>
        <!-- 手机端显示较小的字体 -->
        <span class="text-lg md:text-xl font-bold text-primary font-headline tracking-tight">氛围日记</span>
      </div>
      <!-- 手机端隐藏导航链接 -->
     <div class="hidden md:flex items-center gap-8">
  <router-link to="/" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-sm">首页</router-link>
  <router-link to="/reflection" class="text-primary font-bold hover:text-primary transition-colors duration-300 font-label text-sm">回望</router-link>
  <router-link to="/favorites" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-sm">灵感</router-link>
  <router-link to="/settings" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-sm">设置</router-link>
</div>
      <!-- 手机端只显示搜索图标按钮，电脑端显示完整搜索框 -->
      <div class="flex items-center gap-2 md:gap-3">
        <!-- 手机端：搜索图标按钮 -->
        <button
          @click="showMobileSearch = !showMobileSearch"
          class="md:hidden p-2 text-primary/60 hover:text-primary transition-colors"
        >
          <span class="material-symbols-outlined">{{ showMobileSearch ? 'close' : 'search' }}</span>
        </button>
        <!-- 电脑端：搜索框 -->
        <div class="hidden md:block relative group">
          <input
            v-model="searchQuery"
            class="bg-surface-container-low border-none focus:ring-0 text-sm font-label rounded-full py-2 pl-4 pr-10 w-64 transition-all focus:w-72"
            placeholder="搜索往事..."
            type="text"
          />
          <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary/40">search</span>
        </div>
        <!-- 筛选按钮：仅电脑端显示 -->
        <button class="hidden md:block p-2 text-primary/60 hover:text-primary transition-colors">
          <span class="material-symbols-outlined">filter_list</span>
        </button>
      </div>
    </header>

    <!-- 手机端搜索框下拉区域 -->
    <div
      v-if="showMobileSearch"
      class="md:hidden bg-background border-b border-primary/10 px-4 py-3"
    >
      <div class="relative">
        <input
          v-model="searchQuery"
          class="w-full bg-surface-container-low border-none focus:ring-0 text-sm font-label rounded-full py-2 pl-4 pr-10"
          placeholder="搜索往事..."
          type="text"
        />
        <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary/40">search</span>
      </div>
    </div>

    <div class="max-w-6xl px-4 md:px-6 py-6 md:py-12 relative z-10">
      <header class="mb-16 md:mb-24 md:pl-6">
          <span class="font-label text-xs uppercase tracking-[0.3em] md:tracking-[0.5em] text-primary/40 mb-2 block">Library of Memories</span>
          <h1 class="font-headline text-5xl font-bold text-primary tracking-tighter leading-tight">时光之书</h1>

          <div class="mt-6 md:mt-10 flex items-center gap-4 md:gap-6">
            <!-- 🆕 视图切换按钮 -->
            <button
              @click="toggleViewMode"
              class="inline-flex items-center gap-2 group px-4 py-2 bg-primary/5 hover:bg-primary/10 rounded-full transition-all duration-300 cursor-pointer"
            >
              <span class="material-symbols-outlined text-primary/60 group-hover:text-primary text-sm">
                {{ viewMode === 'bookshelf' ? 'timeline' : 'grid_view' }}
              </span>
              <span class="font-label text-xs uppercase tracking-widest text-primary/60 group-hover:text-primary transition-colors">
                {{ viewMode === 'bookshelf' ? '切换至时光轴' : '切换至书架' }}
              </span>
            </button>
            <div class="h-4 w-[1px] bg-primary/10"></div>
            <!-- 🆕 当前视图标识 -->
            <div class="flex items-center gap-2 opacity-100">
              <span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings: 'FILL' 1;">
                {{ viewMode === 'bookshelf' ? 'grid_view' : 'timeline' }}
              </span>
              <span class="font-label text-xs uppercase tracking-widest text-primary font-bold">
                当前：{{ viewMode === 'bookshelf' ? '书架' : '时光轴' }}
              </span>
            </div>
          </div>
        </header>

        <!-- 🆕 视图内容区域 -->
        <div class="space-y-8">
          <!-- 书架视图（默认） -->
          <div v-if="viewMode === 'bookshelf'">
            <div class="relative md:py-8" v-if="filteredDiaries.length > 0">
              <div class="flex items-end gap-1 md:gap-6 px-4 md:px-10 mb-1 overflow-x-auto">
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

              <div class="h-6 w-full md:w-[calc(100vw-6rem)] md:ml-6 bg-surface-container rounded-sm relative shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05),inset_0_-4px_6px_rgba(0,0,0,0.05)]">
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

          <!-- 🆕 时光轴视图（人生时间线） -->
          <div v-else class="space-y-8">
            <!-- 时间轴说明 -->
            <div class="text-center mb-8">
              <span class="material-symbols-outlined text-primary text-xl">timeline</span>
              <h2 class="font-headline text-lg text-on-surface mt-2">人生时间线</h2>
              <p class="font-label text-xs text-on-surface-variant italic">沿着时间，缓缓前行</p>
            </div>

            <!-- 🆕 时间轴主体 -->
            <div class="relative max-w-6xl mx-auto px-4">
              <!-- 横向滚动容器（书本） -->
              <div
                ref="timelineContainer"
                class="overflow-x-auto px-8 py-12 flex items-center gap-4 relative"
                style="scrollbar-width: none;"
                @scroll="syncScroll(timelineContainer)"
              >
                <!-- 无日记提示 -->
                <div v-if="sortedDiaries.length === 0" class="text-center w-full py-12">
                  <span class="material-symbols-outlined text-6xl text-outline-variant mb-4">timeline</span>
                  <p class="font-headline text-xl text-on-surface-variant">时间线空空如也</p>
                  <p class="font-label text-sm text-on-surface-variant/70 mt-2 italic">还没有日记记录</p>
                </div>

                <!-- 日记节点 -->
                <div
                  v-for="(diary, index) in sortedDiaries"
                  :key="diary.id"
                  class="flex items-center gap-4"
                >
                  <!-- 里程碑标注 -->
                  <div
                    v-if="isMilestonePosition(diary)"
                    class="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center animate-pulse"
                  >
                    <span class="material-symbols-outlined text-primary text-lg">
                      {{ isMilestonePosition(diary).icon }}
                    </span>
                    <span class="font-label text-xs text-primary mt-1">
                      {{ isMilestonePosition(diary).category }}达成
                    </span>
                  </div>

                  <!-- 日记节点（竖向圆柱） -->
                  <div
                    @click="openDiary(diary.id)"
                    class="group relative cursor-pointer flex flex-col items-center"
                  >
                    <!-- 节点本体 -->
                    <div
                      :class="[
                        coverStyles[diary.cover_style]?.class || 'leather-texture',
                        'w-12 h-40 rounded-l-sm rounded-r-md book-shadow flex items-center justify-center border-l border-white/10 relative overflow-hidden'
                      ]"
                    >
                      <!-- 标题（前4个字） -->
                      <div
                        :class="[
                          'book-spine font-headline text-sm tracking-widest py-4',
                          coverStyles[diary.cover_style]?.textClass || 'text-on-primary'
                        ]"
                      >
                        {{ diary.title?.substring(0, 4) || '日记' }}
                      </div>
                    </div>

                    <!-- hover 提示 -->
                    <div class="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-surface-80 backdrop-blur px-3 py-1 rounded text-[10px] font-label uppercase tracking-widest text-primary shadow-sm">
                      {{ diary.title }}
                    </div>

                    <!-- 日期标签 -->
                    <div class="mt-2 text-center">
                      <span class="font-label text-xs text-on-surface-variant">
                        {{ new Date(diary.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) }}
                      </span>
                    </div>
                  </div>

                  <!-- 连线（最后一个节点不显示） -->
                  <div
                    v-if="index < sortedDiaries.length - 1"
                    class="w-16 h-[2px] bg-primary/20"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 🆕 底部统计区域 -->
        <div class="mt-4 md:mt-12 flex items-center justify-center gap-4 md:gap-24 border-t border-primary/10 pt-6 md:pt-12 md:mb-20 md:w-screen md:-ml-6">
          <div class="text-center">
            <span class="block font-headline text-2xl md:text-4xl font-bold text-primary">{{ milestoneStats.total_entries || stats.totalEntries }}</span>
            <span class="font-label text-[10px] uppercase tracking-widest text-primary/40">Total Entries</span>
          </div>
          <div class="h-8 md:h-12 w-[1px] bg-primary/10"></div>
          <div class="text-center">
            <span class="block font-headline text-2xl md:text-4xl font-bold text-primary">{{ milestoneStats.total_pages }}</span>
            <span class="font-label text-[10px] uppercase tracking-widest text-primary/40">Total Pages</span>
          </div>
          <div class="h-8 md:h-12 w-[1px] bg-primary/10"></div>
          <div class="text-center">
            <span class="block font-headline text-2xl md:text-4xl font-bold text-primary">{{ milestoneStats.streak_days }}</span>
            <span class="font-label text-[10px] uppercase tracking-widest text-primary/40">Streak Days</span>
          </div>
        </div>

        <!-- 🆕 手机端：探索花园按钮（卡片样式，统计区域下方） -->
        <div class="md:hidden mt-4 mb-20">
          <button
            @click="handleExploreGarden"
            class="w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl shadow-lg transition-all bg-surface-container-lowest text-primary hover:scale-[0.98]"
          >
            <span class="material-symbols-outlined text-2xl">auto_stories</span>
            <span class="font-headline text-lg tracking-wide">探索花园</span>
          </button>
        </div>
      </div>

    <!-- 探索花园按钮（右下角固定，仅电脑端显示） -->
    <div class="hidden md:block fixed bottom-12 right-12 z-20">
      <button
        @click="handleExploreGarden"
        class="flex items-center gap-2 px-6 py-4 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/30 hover:scale-95 transition-all"
      >
        <span class="material-symbols-outlined text-xl">auto_stories</span>
        <span class="font-label text-sm uppercase tracking-widest">探索花园</span>
      </button>
    </div>

    <nav class="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 flex justify-around items-center py-3 px-4 bg-surface-90 backdrop-blur-lg rounded-full shadow-lg">
  <router-link to="/" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
    <span class="material-symbols-outlined">auto_stories</span>
    <span class="font-label text-[10px] uppercase tracking-widest mt-1">首页</span>
  </router-link>
  <router-link to="/reflection" class="flex flex-col items-center justify-center text-primary scale-110">
    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">inventory_2</span>
    <span class="font-label text-[10px] uppercase tracking-widest mt-1">回望</span>
  </router-link>
  <router-link to="/favorites" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
    <span class="material-symbols-outlined">star</span>
    <span class="font-label text-[10px] uppercase tracking-widest mt-1">灵感</span>
  </router-link>
  <router-link to="/settings" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
    <span class="material-symbols-outlined">settings</span>
    <span class="font-label text-[10px] uppercase tracking-widest mt-1">设置</span>
  </router-link>
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
