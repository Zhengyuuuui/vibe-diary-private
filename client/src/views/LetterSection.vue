<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useLettersStore } from '@/stores/letters'
import CreateLetterModal from '@/components/letters/CreateLetterModal.vue'
import LetterCard from '@/components/letters/LetterCard.vue'
import LetterDetail from '@/components/letters/LetterDetail.vue'
import LetterStats from '@/components/letters/LetterStats.vue'

const router = useRouter()
const lettersStore = useLettersStore()

// 从父级 ReflectionView 注入翻页方法
const flipBackToGarden = inject('flipBackToGarden', null)

const showCreateModal = ref(false)
const selectedLetter = ref(null)
const showDetail = ref(false)

// 状态过滤选项
const filterOptions = [
  { value: null, label: '全部', icon: 'mail' },
  { value: 'pending', label: '封存中', icon: 'lock' },
  { value: 'deliverable', label: '可拆开', icon: 'notifications_active' },
  { value: 'opened', label: '已拆开', icon: 'drafts' }
]

const activeFilter = ref(null)

onMounted(async () => {
  await Promise.all([
    lettersStore.loadLetters(),
    lettersStore.loadStats()
  ])
})

async function applyFilter(status) {
  activeFilter.value = status
  lettersStore.setFilter(status)
}

async function handleCreate(data) {
  showCreateModal.value = false
  try {
    await lettersStore.addLetter(data)
  } catch (error) {
    alert('创建失败: ' + error.message)
  }
}

async function handleView(letter) {
  selectedLetter.value = letter
  showDetail.value = true
}

async function handleOpen(id) {
  try {
    const openedLetter = await lettersStore.openLetterById(id)
    selectedLetter.value = openedLetter
  } catch (error) {
    alert('拆信失败: ' + error.message)
  }
}

async function handleDelete(id) {
  if (!confirm('确定删除这封信吗？此操作不可撤销。')) return
  try {
    await lettersStore.removeLetter(id)
    showDetail.value = false
    selectedLetter.value = null
  } catch (error) {
    alert('删除失败: ' + error.message)
  }
}

function closeDetail() {
  showDetail.value = false
  selectedLetter.value = null
}

async function handleBackToArchive() {
  if (flipBackToGarden) {
    await flipBackToGarden()
  } else {
    router.push('/reflection/garden')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-container/30 via-background to-surface-container-low relative overflow-hidden">
    <!-- 背景装饰：邮局柜台氛围（仅桌面端） -->
    <div class="hidden md:block absolute inset-0 pointer-events-none overflow-hidden">
      <!-- 邮局柜台木质纹理 -->
      <div class="absolute inset-0 opacity-10"
        style="background-image: repeating-linear-gradient(90deg, rgba(105,93,74,0.4) 0px, rgba(105,93,74,0.4) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(0deg, rgba(139,108,78,0.3) 0px, rgba(139,108,78,0.3) 1px, transparent 1px, transparent 120px);">
      </div>

      <!-- 邮筒装饰 -->
      <div class="absolute bottom-24 left-16 w-24 h-28 opacity-20 rotate-12">
        <div class="relative w-full h-full">
          <div class="absolute left-0 bottom-0 w-20 h-24 rounded-t-full bg-secondary/40"></div>
          <div class="absolute left-0 bottom-0 w-20 h-9 rounded-t-lg bg-secondary/60"></div>
          <div class="absolute top-1/3 left-1/2 -translate-x-1/2">
            <span class="material-symbols-outlined text-secondary text-2xl">mail</span>
          </div>
        </div>
      </div>

      <!-- 邮戳装饰 -->
      <div class="absolute top-44 right-24 w-20 h-20 opacity-20 -rotate-12">
        <div class="w-16 h-16 rounded-full border-4 border-primary/40"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="font-label text-[10px] text-primary italic">时光邮局</span>
        </div>
      </div>

      <!-- 邮票装饰 -->
      <div class="absolute bottom-44 right-32 w-16 h-20 opacity-[0.15] rotate-6">
        <div class="w-full h-full bg-primary/10" style="border: 2px dashed rgba(105, 93, 74, 0.4)">
        </div>
        <div class="absolute inset-2 flex items-center justify-center">
          <span class="material-symbols-outlined text-primary text-lg">local_florist</span>
        </div>
      </div>

      <!-- 邮递员帽子 -->
      <div class="absolute top-24 left-1/3 w-16 h-16 opacity-10">
        <span class="material-symbols-outlined text-primary text-4xl">local_post_office</span>
      </div>
    </div>

    <!-- 顶部导航 -->
    <header class="bg-background/70 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4">
      <div class="flex items-center gap-3">
        <button @click="handleBackToArchive" class="material-symbols-outlined text-primary hover:scale-110 transition-transform cursor-pointer">
          arrow_back
        </button>
        <!-- 手机端显示轻提示 -->
        <span class="md:hidden font-label text-xs text-primary/60 uppercase tracking-widest">回到花园</span>
        <span class="text-xl font-bold text-primary font-headline tracking-tight">氛围日记</span>
      </div>
      <div class="hidden md:flex items-center gap-8">
        <a href="/" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-sm">首页</a>
        <a href="/reflection" class="text-primary font-bold hover:text-primary transition-colors duration-300 font-label text-sm">回望</a>
        <a href="/favorites" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-sm">灵感</a>
        <a href="/settings" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-sm">设置</a>
      </div>
    </header>

    <main class="relative z-10 max-w-6xl mx-auto px-6 py-12 pb-32">
      <!-- 页面标题 -->
      <header class="mb-12 text-center">
        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 mb-4 relative shadow-lg"
          style="border: 4px solid rgba(105, 93, 74, 0.2)">
          <span class="material-symbols-outlined text-5xl text-primary">local_post_office</span>
          <!-- 红点提示 -->
          <span
            v-if="lettersStore.deliverableCount > 0"
            class="absolute -top-2 -right-2 w-6 h-6 bg-secondary text-on-secondary rounded-full flex items-center justify-center text-xs font-bold animate-pulse shadow-lg"
          >
            {{ lettersStore.deliverableCount }}
          </span>
          <div class="absolute -bottom-2 -right-2 w-8 h-8 opacity-30">
            <span class="material-symbols-outlined text-primary text-lg">verified</span>
          </div>
        </div>

        <span class="font-label text-xs uppercase tracking-[0.3em] text-primary/40 mb-2 block">
          Time Post Office
        </span>

        <h1 class="font-headline text-5xl font-bold text-primary tracking-tighter leading-tight mb-4">
          时光邮局
        </h1>

        <p class="font-body italic text-on-surface-variant max-w-md mx-auto">
          在时光邮局，寄出一封给未来的信，在时光的彼岸等待拆开的那一刻。
        </p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 左侧：信件列表 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 操作栏 -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <!-- 状态过滤：信件处理区 -->
            <div class="w-full sm:w-auto sm:flex-1 min-w-0">
              <!-- 桌面端功能区标识 -->
              <div class="hidden sm:flex items-center gap-2 mb-2 opacity-60">
                <span class="material-symbols-outlined text-sm text-primary">local_post_office</span>
                <span class="font-label text-xs text-primary uppercase tracking-widest">信件处理区</span>
              </div>

              <!-- 过滤按钮：移动端横向滚动，桌面端自动换行 -->
              <div class="flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible px-1 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  v-for="opt in filterOptions"
                  :key="opt.label"
                  @click="applyFilter(opt.value)"
                  :class="[
                    'shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-label transition-all flex items-center gap-1 relative overflow-hidden',
                    activeFilter === opt.value
                      ? 'bg-primary text-on-primary shadow-lg'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  ]"
                  style="border: 1px dashed rgba(105, 93, 74, 0.2)"
                >
                  <!-- 邮戳装饰 -->
                  <div class="absolute top-0 right-0 w-4 h-4 opacity-20">
                    <span class="material-symbols-outlined text-xs">verified</span>
                  </div>

                  <span class="material-symbols-outlined text-sm">{{ opt.icon }}</span>
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- 寄信按钮 -->
            <button
              @click="showCreateModal = true"
              class="group shrink-0 self-start sm:self-auto px-7 py-3.5 bg-primary text-on-primary rounded-full font-label text-sm uppercase tracking-widest shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 transition-all flex items-center gap-2.5"
            >
              <span class="material-symbols-outlined text-lg group-hover:-rotate-12 group-hover:scale-110 transition-transform">send</span>
              <span>寄信</span>
            </button>
          </div>

          <!-- 加载状态 -->
          <div v-if="lettersStore.loading" class="flex justify-center py-12">
            <span class="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
          </div>

          <!-- 空状态 -->
          <div v-else-if="lettersStore.letters.length === 0" class="text-center py-16">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <span class="material-symbols-outlined text-primary/40 text-4xl">mail</span>
            </div>
            <h3 class="font-headline text-xl text-primary mb-2">还没有信件</h3>
            <p class="font-body text-on-surface-variant mb-6">写下第一封给未来的信</p>
            <button
              @click="showCreateModal = true"
              class="px-6 py-3 bg-primary text-on-primary rounded-full font-label text-sm uppercase tracking-widest hover:scale-95 transition-transform shadow-lg shadow-primary/20"
            >
              开始写信
            </button>
          </div>

          <!-- 信件网格 -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="letter in lettersStore.letters"
              :key="letter.id"
              class="relative"
            >
              <LetterCard
                :letter="letter"
                @view="handleView"
                @open="handleOpen"
                @delete="handleDelete"
              />
            </div>
          </div>
        </div>

        <!-- 右侧：邮局公告栏 -->
        <div class="lg:col-span-1">
          <div class="sticky top-24 space-y-6">
            <!-- 邮局公告栏 -->
            <div class="bg-surface-container-lowest rounded-xl p-6 shadow-lg relative overflow-hidden"
              style="background: linear-gradient(135deg, #faf9f6 0%, #f5f0e6 100%)">

              <!-- 公告栏手绘边框 -->
              <div class="absolute inset-3 border-2 border-dashed border-primary/20 rounded-lg pointer-events-none"></div>

              <!-- 公告栏标题 -->
              <div class="relative z-10">
                <div class="flex items-center gap-2 mb-4">
                  <span class="material-symbols-outlined text-primary text-lg">campaign</span>
                  <h3 class="font-headline text-lg text-on-surface">邮局公告</h3>
                </div>

                <LetterStats :stats="lettersStore.stats" :embedded="true" />
              </div>

              <!-- 邮戳装饰 -->
              <div class="absolute bottom-3 right-3 w-8 h-8 opacity-20 rotate-6">
                <span class="material-symbols-outlined text-primary text-lg">verified</span>
              </div>
            </div>

            <!-- 隐私说明：邮局保密承诺 -->
            <div class="p-4 bg-surface-container rounded-lg relative overflow-hidden"
              style="border: 1px dashed rgba(105, 93, 74, 0.3)">
              <!-- 保密印章 -->
              <div class="absolute top-2 right-2 w-6 h-6 opacity-30">
                <span class="material-symbols-outlined text-primary text-sm">shield</span>
              </div>

              <p class="font-body text-xs text-on-surface-variant leading-relaxed text-center relative z-10">
                <span class="material-symbols-outlined text-sm align-middle mr-1">shield</span>
                邮局承诺：所有信件加密存储，仅您本人可查看。
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 返回按钮（仅电脑端显示） -->
    <div class="hidden md:block fixed bottom-12 left-12 z-20">
      <button
        @click="handleBackToArchive"
        class="group flex items-center gap-2 px-6 py-4 bg-surface-container text-primary rounded-full shadow-lg hover:scale-95 transition-all"
      >
        <span class="material-symbols-outlined text-xl">arrow_back</span>
        <span class="font-label text-sm uppercase tracking-widest">回到花园</span>
      </button>
    </div>

    <!-- 移动端底部导航 -->
    <nav class="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 flex justify-around items-center py-3 px-4 bg-surface-90 backdrop-blur-lg rounded-full shadow-lg">
      <a href="/" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
        <span class="material-symbols-outlined">auto_stories</span>
        <span class="font-label text-[10px] uppercase tracking-widest mt-1">首页</span>
      </a>
      <a href="/reflection" class="flex flex-col items-center justify-center text-primary scale-110">
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

    <!-- 写信弹窗 -->
    <CreateLetterModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @create="handleCreate"
    />

    <!-- 信件详情 -->
    <LetterDetail
      v-if="selectedLetter"
      :letter="selectedLetter"
      @close="closeDetail"
      @open="handleOpen"
      @delete="handleDelete"
    />
  </div>
</template>
