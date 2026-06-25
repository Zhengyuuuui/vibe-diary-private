<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useDiaryStore } from '@/stores/diary'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { getStats, getRandomFragment, getOnThisDay } from '@/api'

const store = useDiaryStore()
const authStore = useAuthStore()
const router = useRouter()
const showNewDialog = ref(false)
const showEditDialog = ref(false)
const newTitle = ref('')
const newStyle = ref('leather')
const editDiary = ref(null)
const editTitle = ref('')
const editStyle = ref('leather')

const userAvatar = computed(() => authStore.user?.avatar || '')
const userInitial = computed(() => {
  const name = authStore.user?.pen_name || authStore.user?.username || 'U'
  return name.charAt(0).toUpperCase()
})

const stats = ref({
  weekly_pages: 0,
  streak_days: 0,
  total_pages: 0
})

const ecoStats = computed(() => {
  const totalPages = stats.value.total_pages || 0
  
  const paperKg = (totalPages * 4 / 1000).toFixed(2)
  const co2Kg = (totalPages * 4 / 1000 * 2.4).toFixed(2)
  const trees = (totalPages / 8500).toFixed(2)
  
  return {
    paperKg,
    co2Kg,
    trees
  }
})

const moods = [
  { id: 'happy', icon: 'wb_sunny', label: '晴天', color: 'bg-amber-100' },
  { id: 'calm', icon: 'partly_cloudy_day', label: '多云', color: 'bg-sky-100' },
  { id: 'neutral', icon: 'cloud', label: '阴天', color: 'bg-gray-100' },
  { id: 'sad', icon: 'water_drop', label: '小雨', color: 'bg-blue-100' },
  { id: 'down', icon: 'thunderstorm', label: '雷雨', color: 'bg-indigo-100' }
]

const todayMood = ref(null)

async function loadStats() {
  try {
    const data = await getStats()
    stats.value = data
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

function loadTodayMood() {
  const today = new Date().toDateString()
  const saved = localStorage.getItem('todayMood')
  if (saved) {
    const { date, mood } = JSON.parse(saved)
    if (date === today) {
      todayMood.value = mood
    }
  }
}

function selectMood(moodId) {
  todayMood.value = moodId
  localStorage.setItem('todayMood', JSON.stringify({
    date: new Date().toDateString(),
    mood: moodId
  }))
}

const memoryFragment = ref(null)
const onThisDayData = ref(null)

async function loadMemoryFragment() {
  try {
    const data = await getRandomFragment()
    memoryFragment.value = data
  } catch (error) {
    console.error('加载回忆碎片失败:', error)
  }
}

async function loadOnThisDay() {
  try {
    const data = await getOnThisDay()
    onThisDayData.value = data
  } catch (error) {
    console.error('加载历史上的今天失败:', error)
  }
}

function refreshFragment() {
  loadMemoryFragment()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function goToDiary(diaryId) {
  router.push(`/diary/${diaryId}`)
}

const quotes = [
  { text: "孤独是一群人的狂欢，狂欢是一群人的孤独。", author: "木心" },
  { text: "每个人的内心都是一座孤岛，你可以在那里休息，但你无法永远居住。", author: "毛姆《月亮与六便士》" },
  { text: "我不属于任何地方，我只属于我自己。", author: "辛波斯卡" },
  { text: "我并不渴望变得完整，我只渴望变得真实。", author: "荣格" },
  { text: "你要爱荒野上的风声，胜过爱贫穷和思考。", author: "海子" },
  { text: "在这薄情的世界上深情地活着。", author: "木心《素履之往》" },
  { text: "死并非生的对立面，而作为生的一部分永存。", author: "村上春树《挪威的森林》" },
  { text: "在冬天的深处，我终于发现，我身体里有一个不可战胜的夏天。", author: "加缪" },
  { text: "时间永远分岔，通向无数的未来。", author: "博尔赫斯《小径分岔的花园》" },
  { text: "所有的结局都已写好，所有的泪水也都已启程。", author: "席慕蓉《青春》" },
  { text: "生活在别处。", author: "米兰·昆德拉" },
  { text: "每个瞬间，都是一次长久的告别。", author: "圣埃克苏佩里" },
  { text: "我们必须保持沉默，才能听见自己的声音。", author: "赫尔曼·黑塞" },
  { text: "满地都是六便士，他却抬头看见了月亮。", author: "毛姆《月亮与六便士》" },
  { text: "草在结它的种子，风在摇它的叶子，我们站着，不说话，就十分美好。", author: "顾城《门前》" },
  { text: "一切静止的东西，都有一种沉重的力量。", author: "陀思妥耶夫斯基" },
  { text: "星星发亮是为了让每一个人有一天都能找到属于自己的星星。", author: "《小王子》" },
  { text: "重要的东西，用眼睛是看不见的。", author: "《小王子》" },
  { text: "所谓生活，就是从一堆琐碎中提取诗意。", author: "伍尔夫" },
  { text: "世界如此之大，而我只想在我的角落里，安静地生长。", author: "三毛" },
  { text: "有些路，只能一个人走。", author: "龙应台《目送》" },
  { text: "在大地之上，万物都在以它们自己的方式修行。", author: "梭罗《瓦尔登湖》" },
  { text: "我步入丛林，因为我希望生活得有意义。", author: "梭罗《瓦尔登湖》" },
  { text: "如果你掉进了黑暗，记住，光总是在别处。", author: "石黑一雄《远山淡影》" },
  { text: "像水消失在水里。", author: "佩索阿《不安之书》" },
  { text: "你是一树一树的花开，是燕在梁间呢喃。", author: "林徽因" },
  { text: "风大得很，我为你守口如瓶。", author: "西川" },
  { text: "世界是一面镜子，每个人都在里面看到自己的影子。", author: "萨克雷" },
  { text: "人的一生，是寻找故乡的过程。", author: "黑塞" },
  { text: "所有这一切，都将像泪水消失在雨中。", author: "《银翼杀手》" }
]

const cardVariants = [
  { name: '默认深色', bg: 'bg-inverse-surface', textColor: 'text-inverse-on-surface', quoteColor: 'text-primary-fixed/30' },
  { name: '极简素白', bg: 'bg-[#FAF9F6]', textColor: 'text-[#3d3830]', quoteColor: 'text-[#695d4a]/30' },
  { name: '午夜书房', bg: 'bg-[#1a1a1a]', textColor: 'text-[#e8e4df]', quoteColor: 'text-[#a09080]/30' },
  { name: '羊皮故卷', bg: 'bg-[#f2e0c8]', textColor: 'text-[#4a3f30]', quoteColor: 'text-[#695d4a]/30' },
  { name: '石板灰', bg: 'bg-slate-800', textColor: 'text-slate-100', quoteColor: 'text-slate-400/30' },
  { name: '锌灰', bg: 'bg-zinc-800', textColor: 'text-zinc-100', quoteColor: 'text-zinc-400/30' },
  { name: '暖石', bg: 'bg-stone-800', textColor: 'text-stone-100', quoteColor: 'text-stone-400/30' },
  { name: '中性灰', bg: 'bg-neutral-800', textColor: 'text-neutral-100', quoteColor: 'text-neutral-400/30' }
]

const currentQuote = ref(quotes[Math.floor(Math.random() * quotes.length)])
const currentVariant = ref(Math.floor(Math.random() * cardVariants.length))
const countdown = ref(60)
let autoRefreshTimer = null

function changeQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length)
  currentQuote.value = quotes[randomIndex]
  currentVariant.value = (currentVariant.value + 1) % cardVariants.length
  countdown.value = 60
}

function startAutoRefresh() {
  stopAutoRefresh()
  autoRefreshTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      changeQuote()
    }
  }, 1000)
}

function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
}

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  await store.loadDiaries()
  await authStore.loadProfile()
  await loadStats()
  loadTodayMood()
  await loadMemoryFragment()
  await loadOnThisDay()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

function openDiary(id) {
  router.push(`/diary/${id}`)
}

async function handleCreate() {
  if (!newTitle.value.trim()) return
  const result = await store.addDiary({
    title: newTitle.value.trim(),
    cover_style: newStyle.value
  })
  showNewDialog.value = false
  newTitle.value = ''
  newStyle.value = 'leather'
  if (result?.id) {
    openDiary(result.id)
  }
}

function openEditDialog(diary) {
  editDiary.value = diary
  editTitle.value = diary.title
  editStyle.value = diary.cover_style
  showEditDialog.value = true
}

async function handleEdit() {
  if (!editDiary.value || !editTitle.value.trim()) return
  await store.editDiary(editDiary.value.id, {
    title: editTitle.value.trim(),
    cover_style: editStyle.value
  })
  showEditDialog.value = false
  editDiary.value = null
}

async function handleDelete() {
  if (!editDiary.value) return
  await store.removeDiary(editDiary.value.id)
  showEditDialog.value = false
  editDiary.value = null
}

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
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="bg-surface-container-low/85 backdrop-blur-md sticky top-0 z-50 shadow-[0_2px_20px_rgba(105,93,74,0.06)]">
      <div class="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <div class="text-2xl font-headline text-on-surface tracking-tighter">氛围日记</div>
        <div class="hidden md:flex items-center space-x-8 font-label uppercase tracking-wider text-xs">
          <router-link to="/" class="text-on-surface font-semibold border-b-0 hover:text-on-surface transition-colors duration-300">首页</router-link>
          <router-link to="/archive" class="text-on-surface-variant hover:text-on-surface transition-colors duration-300">存档</router-link>
          <router-link to="/favorites" class="text-on-surface-variant hover:text-on-surface transition-colors duration-300">灵感</router-link>
          <router-link to="/settings" class="text-on-surface-variant hover:text-on-surface transition-colors duration-300">设置</router-link>
        </div>
        <div class="flex items-center space-x-4">
          <button
            @click="showNewDialog = true"
            class="flex items-center justify-center p-2 rounded-full hover:bg-surface-container/50 transition-all"
          >
            <span class="material-symbols-outlined">add</span>
          </button>
          <router-link to="/settings" class="block w-8 h-8 rounded-full overflow-hidden border border-outline-variant bg-gradient-to-br from-primary to-primary-dim flex-shrink-0">
            <img v-if="userAvatar" :src="userAvatar" alt="Avatar" class="w-full h-full object-cover" />
            <span v-else class="w-full h-full flex items-center justify-center text-on-primary font-label text-xs font-semibold">{{ userInitial }}</span>
          </router-link>
        </div>
      </div>
    </header>

    <div class="flex max-w-7xl mx-auto">
      <aside class="bg-surface-container w-64 hidden md:flex flex-col h-screen p-4 space-y-6">
        <div class="px-2 py-4">
          <h2 class="text-xl font-headline text-on-surface">氛围日记</h2>
          <p class="font-label text-xs font-medium text-on-surface-variant">Digital Sanctuary</p>
        </div>
        <nav class="flex-1 space-y-1">
          <router-link to="/" class="flex items-center space-x-3 p-3 text-on-surface font-bold bg-surface-container-high/50 rounded-lg scale-[0.98] duration-150">
            <span class="material-symbols-outlined">auto_stories</span>
            <span class="font-label text-xs font-medium">首页</span>
          </router-link>
          <router-link to="/archive" class="flex items-center space-x-3 p-3 text-on-surface-variant hover:bg-surface-container-high/30 transition-all">
            <span class="material-symbols-outlined">inventory_2</span>
            <span class="font-label text-xs font-medium">存档</span>
          </router-link>
          <router-link to="/favorites" class="flex items-center space-x-3 p-3 text-on-surface-variant hover:bg-surface-container-high/30 transition-all">
            <span class="material-symbols-outlined">bookmark</span>
            <span class="font-label text-xs font-medium">灵感</span>
          </router-link>
          <router-link to="/settings" class="flex items-center space-x-3 p-3 text-on-surface-variant hover:bg-surface-container-high/30 transition-all">
            <span class="material-symbols-outlined">settings</span>
            <span class="font-label text-xs font-medium">设置</span>
          </router-link>
        </nav>
        <button
          @click="showNewDialog = true"
          class="w-full py-3 px-4 bg-primary text-on-primary rounded-md font-label text-sm font-semibold shadow-md active:opacity-70 transition-all"
        >
          开启新篇章
        </button>
      </aside>

      <main class="flex-1 p-8 md:p-12 lg:p-16">
        <div class="mb-12">
          <h1 class="text-4xl font-headline tracking-tight mb-2">我的精神角落</h1>
          <p class="text-on-surface-variant font-body italic opacity-80">将思绪凝结成永恒的回忆。</p>
        </div>

        <div v-if="store.loading" class="text-center py-20">
          <span class="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
          <p class="mt-4 font-label text-sm text-on-surface-variant">正在整理书架...</p>
        </div>

        <div v-else-if="store.diaries.length === 0" class="text-center py-20">
          <span class="material-symbols-outlined text-6xl text-outline-variant mb-4">auto_stories</span>
          <p class="font-headline text-xl text-on-surface-variant">书架空空如也</p>
          <p class="font-label text-sm text-on-surface-variant/70 mt-2">点击右上角 + 开启第一本日记</p>
        </div>

        <section v-else class="mb-24">
          <div class="relative">
            <div class="absolute bottom-0 left-0 right-0 h-4 bg-surface-container-lowest rounded-full shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05),inset_0_-4px_6px_rgba(0,0,0,0.05)] opacity-90 blur-[1px]"></div>
            <div class="flex items-end space-x-6 pb-2 px-4 overflow-x-auto">
              <div
                v-for="(diary, index) in store.diaries"
                :key="diary.id"
                class="group relative transition-transform duration-500 hover:-translate-y-2 cursor-pointer flex-shrink-0"
                @click="openDiary(diary.id)"
                @contextmenu.prevent="openEditDialog(diary)"
              >
                <div
                  :class="[
                    coverStyles[diary.cover_style]?.class || 'leather-texture',
                    getBookStyle(index).width,
                    getBookStyle(index).height,
                    'rounded-l-sm rounded-r-md custom-shadow flex items-center justify-center border-l border-white/10 relative overflow-hidden'
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
                  <button
                    @click.stop="openEditDialog(diary)"
                    class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-inverse-surface/20 hover:bg-inverse-surface/40"
                  >
                    <span class="material-symbols-outlined text-surface text-xs">edit</span>
                  </button>
                </div>
                <div class="absolute -top-8 left-0 w-max opacity-0 group-hover:opacity-100 transition-opacity font-label text-[10px] uppercase tracking-tighter text-on-surface-variant">
                  {{ diary.title }}
                </div>
              </div>
            </div>
          </div>
          <div class="mt-4 font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em] text-center md:text-left">
            近期日记 · 右键或点击编辑图标修改封面
          </div>
        </section>

        <section class="flex flex-col md:flex-row gap-8 items-stretch">
          <div class="w-full md:flex-1 space-y-8">
            <div class="bg-surface-container-lowest p-6 rounded-xl custom-shadow">
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-headline text-lg text-primary flex items-center gap-2">
                  <span class="material-symbols-outlined">edit_note</span>
                  本周写作
                </h4>
                <span class="text-xs text-on-surface-variant/60">{{ new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) }}</span>
              </div>
              
              <div class="space-y-3 mb-6">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-on-surface-variant">已写</span>
                  <span class="font-headline text-2xl text-primary">{{ stats.weekly_pages }} <span class="text-sm font-body">页</span></span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-on-surface-variant">连续打卡</span>
                  <span class="font-headline text-lg text-primary flex items-center gap-1">
                    {{ stats.streak_days }} 天
                    <span class="material-symbols-outlined text-sm text-amber-500">local_fire_department</span>
                  </span>
                </div>
              </div>
              
              <div class="border-t border-outline-variant/20 pt-4 mb-6">
                <h5 class="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">eco</span>
                  环保贡献
                </h5>
                <div class="grid grid-cols-3 gap-3 text-center">
                  <div class="bg-surface-container/50 p-3 rounded-lg">
                    <span class="material-symbols-outlined text-lg text-green-600 mb-1">description</span>
                    <p class="font-headline text-lg text-on-surface">{{ stats.total_pages }}</p>
                    <p class="text-[10px] text-on-surface-variant">累计书写(页)</p>
                  </div>
                  <div class="bg-surface-container/50 p-3 rounded-lg">
                    <span class="material-symbols-outlined text-lg text-blue-600 mb-1">receipt_long</span>
                    <p class="font-headline text-lg text-on-surface">{{ ecoStats.paperKg }}</p>
                    <p class="text-[10px] text-on-surface-variant">节省纸张(kg)</p>
                  </div>
                  <div class="bg-surface-container/50 p-3 rounded-lg">
                    <span class="material-symbols-outlined text-lg text-teal-600 mb-1">co2</span>
                    <p class="font-headline text-lg text-on-surface">{{ ecoStats.co2Kg }}</p>
                    <p class="text-[10px] text-on-surface-variant">减少CO₂(kg)</p>
                  </div>
                </div>
                <div class="mt-3 flex items-center justify-center gap-2 text-xs text-on-surface-variant/70">
                  <span class="material-symbols-outlined text-sm text-green-700">park</span>
                  <span>相当于保护了 <strong class="text-green-700">{{ ecoStats.trees }}</strong> 棵树</span>
                </div>
              </div>
              
              <div class="border-t border-outline-variant/20 pt-4">
                <h5 class="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">wb_sunny</span>
                  今日心情
                </h5>
                <div class="flex justify-between">
                  <button
                    v-for="mood in moods"
                    :key="mood.id"
                    @click="selectMood(mood.id)"
                    :class="[
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                      todayMood === mood.id 
                        ? `${mood.color} ring-2 ring-primary ring-offset-2 scale-110` 
                        : 'bg-surface-container hover:bg-surface-container-high'
                    ]"
                  >
                    <span class="material-symbols-outlined text-xl">{{ mood.icon }}</span>
                  </button>
                </div>
                <p v-if="todayMood" class="text-xs text-center text-on-surface-variant mt-3">
                  今日心情：{{ moods.find(m => m.id === todayMood)?.label }}
                </p>
              </div>
            </div>

            <div 
              :class="[
                'p-6 rounded-xl custom-shadow flex flex-col justify-between cursor-pointer transition-all duration-500',
                cardVariants[currentVariant].bg,
                cardVariants[currentVariant].textColor
              ]"
            >
              <div class="flex items-center justify-between">
                <span :class="['material-symbols-outlined text-4xl', cardVariants[currentVariant].quoteColor]">format_quote</span>
                <button 
                  @click.stop="changeQuote"
                  class="p-2 rounded-full hover:bg-white/10 transition-colors"
                  title="换一句"
                >
                  <span class="material-symbols-outlined text-xl">refresh</span>
                </button>
              </div>
              <p class="font-headline text-xl italic leading-snug my-4">"{{ currentQuote.text }}"</p>
              <div class="flex items-center justify-between">
                <span class="font-label text-[10px] tracking-widest opacity-60">— {{ currentQuote.author }}</span>
              </div>
            </div>
          </div>

          <div class="w-full md:flex-1 space-y-8">
            <div class="bg-surface-container-low p-6 rounded-xl border border-primary/5">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">最近书写</h3>
                <router-link to="/archive" class="text-xs font-label font-bold text-primary hover:underline flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">history_edu</span>
                  继续书写 →
                </router-link>
              </div>
              <ul v-if="store.diaries.length > 0" class="space-y-4">
                <li 
                  v-for="(diary, index) in store.diaries.slice(0, 5)" 
                  :key="diary.id"
                  :class="[
                    'flex items-center justify-between group',
                    index > 0 ? 'border-t border-outline/10 pt-4' : ''
                  ]"
                >
                  <span 
                    class="font-headline text-sm group-hover:text-primary transition-colors cursor-pointer"
                    @click="openDiary(diary.id)"
                  >
                    {{ diary.title }}
                  </span>
                  <span class="font-label text-[10px] text-on-surface-variant">{{ diary.page_count || 0 }} 页</span>
                </li>
              </ul>
              <div v-else class="text-center py-6">
                <div class="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 mx-auto">
                  <span class="material-symbols-outlined">history_edu</span>
                </div>
                <p class="text-xs text-on-surface-variant/60">暂无日记</p>
                <p class="text-xs text-on-surface-variant/40 mt-1">开启第一本日记吧</p>
              </div>
            </div>

            <div class="bg-surface-container-low p-8 rounded-xl relative overflow-hidden group">
              <div class="absolute top-0 right-0 p-4 flex items-center gap-2">
                <button 
                  @click="refreshFragment" 
                  class="p-2 rounded-full hover:bg-surface-container transition-colors"
                  title="换一篇回忆"
                >
                  <span class="material-symbols-outlined text-outline-variant hover:text-primary transition-colors">refresh</span>
                </button>
              </div>

              <div class="mb-6">
                <h4 class="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">history</span>
                  历史上的今天
                </h4>
                
                <div v-if="onThisDayData" 
                  class="bg-surface-container-lowest/50 p-4 rounded-lg cursor-pointer hover:bg-surface-container-lowest/80 transition-colors"
                  @click="goToDiary(onThisDayData.diary_id)"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <span class="font-label text-[10px] text-primary">{{ onThisDayData.year }}年{{ new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) }}</span>
                    <span class="text-on-surface-variant/40">·</span>
                    <span class="font-label text-[10px] text-on-surface-variant">{{ onThisDayData.diary_title }}</span>
                  </div>
                  <p class="text-on-surface-variant text-sm leading-relaxed line-clamp-2">"{{ onThisDayData.content }}{{ onThisDayData.has_more ? '...' : '' }}"</p>
                  <span class="font-label text-[10px] text-primary mt-2 inline-block hover:underline">查看完整内容 →</span>
                </div>
                
                <div v-else class="bg-surface-container-lowest/30 p-4 rounded-lg text-center">
                  <span class="material-symbols-outlined text-3xl text-outline-variant mb-2">history</span>
                  <p class="text-on-surface-variant text-sm">那年今日，你还没有开始书写</p>
                  <p class="text-on-surface-variant/60 text-xs mt-1">开始记录，让未来的你拥有回忆</p>
                </div>
              </div>

              <div class="border-t border-outline-variant/20 my-6"></div>

              <div>
                <h4 class="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">auto_awesome</span>
                  回忆碎片
                </h4>
                
                <div v-if="memoryFragment" 
                  class="bg-surface-container-lowest/50 p-4 rounded-lg cursor-pointer hover:bg-surface-container-lowest/80 transition-colors"
                  @click="goToDiary(memoryFragment.diary_id)"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <span class="font-label text-[10px] text-on-surface-variant">{{ memoryFragment.diary_title }}</span>
                    <span class="text-on-surface-variant/40">·</span>
                    <span class="font-label text-[10px] text-on-surface-variant/60">{{ formatDate(memoryFragment.created_at) }}</span>
                  </div>
                  <p class="text-on-surface-variant text-sm leading-relaxed line-clamp-2">"{{ memoryFragment.content }}{{ memoryFragment.has_more ? '...' : '' }}"</p>
                  <span class="font-label text-[10px] text-primary mt-2 inline-block hover:underline">查看完整内容 →</span>
                </div>
                
                <div v-else class="bg-surface-container-lowest/30 p-4 rounded-lg text-center">
                  <span class="material-symbols-outlined text-3xl text-outline-variant mb-2">auto_stories</span>
                  <p class="text-on-surface-variant text-sm">书架还没有日记</p>
                  <p class="text-on-surface-variant/60 text-xs mt-1">开启第一本日记吧</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>

    <footer class="bg-surface-container-low py-12 flex flex-col items-center justify-center w-full space-y-4">
      <div class="flex space-x-8">
        <a class="font-label text-[10px] tracking-widest text-on-surface-variant hover:text-on-surface underline decoration-outline/30 transition-opacity duration-500" href="#">隐私</a>
        <a class="font-label text-[10px] tracking-widest text-on-surface-variant hover:text-on-surface underline decoration-outline/30 transition-opacity duration-500" href="#">条款</a>
        <a class="font-label text-[10px] tracking-widest text-on-surface-variant hover:text-on-surface underline decoration-outline/30 transition-opacity duration-500" href="#">支持</a>
      </div>
      <p class="font-label text-[10px] tracking-widest text-on-surface-variant">© 2024 氛围日记. 为灵魂而作.</p>
    </footer>
    <Teleport to="body">
      <div v-if="showNewDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/30 backdrop-blur-sm" @click.self="showNewDialog = false">
        <div class="bg-surface-container-lowest rounded-xl p-8 w-full max-w-md mx-4 custom-shadow">
          <h3 class="font-headline text-2xl mb-6">开启新篇章</h3>
          <div class="space-y-4">
            <div>
              <label class="font-label text-xs text-on-surface-variant mb-1 block">日记本标题</label>
              <input
                v-model="newTitle"
                maxlength="20"
                placeholder="给日记本起个名字..."
                class="w-full px-4 py-3 rounded-lg border border-outline-variant/30 bg-surface-container-low focus:outline-none focus:border-primary font-body text-sm"
                @keyup.enter="handleCreate"
              />
            </div>
            <div>
              <label class="font-label text-xs text-on-surface-variant mb-2 block">封面材质</label>
              <div class="flex space-x-4">
                <button
                  v-for="(style, key) in coverStyles"
                  :key="key"
                  @click="newStyle = key"
                  :class="[
                    'flex-1 py-3 rounded-lg border-2 transition-all font-label text-xs',
                    newStyle === key ? 'border-primary bg-primary/5' : 'border-outline-variant/20'
                  ]"
                >
                  {{ key === 'leather' ? '皮革' : key === 'linen' ? '亚麻' : '花纹' }}
                </button>
              </div>
            </div>
          </div>
          <div class="flex space-x-3 mt-8">
            <button
              @click="showNewDialog = false"
              class="flex-1 py-3 px-4 rounded-md font-label text-sm text-on-surface-variant hover:bg-surface-container transition-all"
            >
              取消
            </button>
            <button
              @click="handleCreate"
              :disabled="!newTitle.trim()"
              class="flex-1 py-3 px-4 bg-primary text-on-primary rounded-md font-label text-sm font-semibold shadow-md active:opacity-70 transition-all disabled:opacity-40"
            >
              创建
            </button>
          </div>
        </div>
      </div>

      <div v-if="showEditDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/30 backdrop-blur-sm" @click.self="showEditDialog = false">
        <div class="bg-surface-container-lowest rounded-xl p-8 w-full max-w-md mx-4 custom-shadow">
          <h3 class="font-headline text-2xl mb-6">封面配置</h3>
          <div class="space-y-4">
            <div>
              <label class="font-label text-xs text-on-surface-variant mb-1 block">日记本标题</label>
              <input
                v-model="editTitle"
                maxlength="20"
                class="w-full px-4 py-3 rounded-lg border border-outline-variant/30 bg-surface-container-low focus:outline-none focus:border-primary font-body text-sm"
              />
            </div>
            <div>
              <label class="font-label text-xs text-on-surface-variant mb-2 block">封面材质</label>
              <div class="flex space-x-4">
                <button
                  v-for="(style, key) in coverStyles"
                  :key="key"
                  @click="editStyle = key"
                  :class="[
                    'flex-1 py-3 rounded-lg border-2 transition-all font-label text-xs',
                    editStyle === key ? 'border-primary bg-primary/5' : 'border-outline-variant/20'
                  ]"
                >
                  {{ key === 'leather' ? '皮革' : key === 'linen' ? '亚麻' : '花纹' }}
                </button>
              </div>
            </div>
            <div class="flex justify-center py-4">
              <div
                :class="[
                  coverStyles[editStyle]?.class || 'leather-texture',
                  'w-24 h-32 rounded-l-sm rounded-r-md custom-shadow flex items-center justify-center'
                ]"
              >
                <div
                  :class="[
                    'book-spine font-headline text-xs tracking-widest',
                    coverStyles[editStyle]?.textClass || 'text-on-primary'
                  ]"
                >
                  {{ editTitle || '预览' }}
                </div>
              </div>
            </div>
          </div>
          <div class="flex space-x-3 mt-6">
            <button
              @click="handleDelete"
              class="py-3 px-4 rounded-md font-label text-sm text-error hover:bg-red-50 transition-all"
            >
              删除
            </button>
            <div class="flex-1"></div>
            <button
              @click="showEditDialog = false"
              class="py-3 px-4 rounded-md font-label text-sm text-on-surface-variant hover:bg-surface-container transition-all"
            >
              取消
            </button>
            <button
              @click="handleEdit"
              :disabled="!editTitle.trim()"
              class="py-3 px-4 bg-primary text-on-primary rounded-md font-label text-sm font-semibold shadow-md active:opacity-70 transition-all disabled:opacity-40"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <nav class="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 flex justify-around items-center py-3 px-4 bg-surface-90 backdrop-blur-lg rounded-full shadow-[0_20_40px_rgba(105,93,74,0.06)]">
      <router-link to="/" class="flex flex-col items-center justify-center text-primary scale-110 active:scale-90 duration-200">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">auto_stories</span>
        <span class="font-label text-[10px] uppercase tracking-widest mt-1">首页</span>
      </router-link>
      <router-link to="/archive" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
        <span class="material-symbols-outlined">inventory_2</span>
        <span class="font-label text-[10px] uppercase tracking-widest mt-1">存档</span>
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
