<script setup>
import { ref, computed, watch, nextTick, provide, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import html2canvas from 'html2canvas'
import PageFlipAnimation from '@/utils/PageFlipAnimation'

const router = useRouter()
const route = useRoute()

const flipState = ref('archive')
const isFlipping = ref(false)
const flipCanvasContainer = ref(null)
let pageFlipAnim = null

watch(
  () => route.path,
  (newPath) => {
    flipState.value = newPath.includes('/garden') ? 'garden' : 'archive'
  },
  { immediate: true }
)

/**
 * 截取当前页面（整页内容）为 canvas
 * 截取的是 ArchiveSection 或 GardenSection 的真实内容
 */
async function captureCurrentPage() {
  // 截取整个页面主体
  const target = document.querySelector('.reflection-container')
  const source = target || document.body

  const canvas = await html2canvas(source, {
    width: window.innerWidth,
    height: window.innerHeight,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    useCORS: true,
    backgroundColor: '#faf9f6',
    scale: Math.min(window.devicePixelRatio, 2),
    logging: false
  })
  return canvas
}

/**
 * 创建全屏翻页动画
 * @param {HTMLCanvasElement} frontCanvas 正面截图
 * @param {number} initialProgress 初始进度
 */
function createFlipAnim(frontCanvas, initialProgress = 0) {
  const isMobile = window.innerWidth < 768

  pageFlipAnim = new PageFlipAnimation(flipCanvasContainer.value, {
    width: window.innerWidth,
    height: window.innerHeight,
    duration: 1800,
    isMobile,
    frontCanvas,
    initialProgress
  })
}

function destroyFlipAnim() {
  if (pageFlipAnim) {
    pageFlipAnim.destroy()
    pageFlipAnim = null
  }
}

// 正向翻页：ArchiveSection → GardenSection
async function flipToGarden() {
  if (isFlipping.value) return
  isFlipping.value = true

  // 1. 创建带文字的 canvas 作为纸张正面纹理
  const textCanvas = createTextCanvas('进入心灵花园中....')

  // 2. 显示翻页层，创建动画
  await nextTick()
  createFlipAnim(textCanvas, 0)

  // 3. 播放翻页（整页像纸一样翻过去，文字随纸张弯曲）
  await pageFlipAnim.playForward()

  // 4. 路由跳转到花园页
  router.push('/reflection/garden')
  await nextTick()

  // 5. 清理动画
  destroyFlipAnim()
  flipState.value = 'garden'
  isFlipping.value = false
}

/**
 * 创建带文字的 canvas（背景跟随主题 + 文字）
 * 文字绘制在 canvas 上，会随 Page Curl 弯曲变形
 */
function createTextCanvas(text) {
  const canvas = document.createElement('canvas')
  const w = window.innerWidth
  const h = window.innerHeight
  // 高 DPI 支持：避免文字模糊
  const scale = window.devicePixelRatio || 1
  canvas.width = w * scale
  canvas.height = h * scale

  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale) // 缩放绘制，保持清晰

  // 从 CSS 变量获取背景颜色（跟随主题）
  const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary') || '#faf9f6'
  ctx.fillStyle = bgColor.trim()
  ctx.fillRect(0, 0, w, h)

  // 检测背景亮度，决定文字颜色（Dark 主题用亮色，Light/Sepia 用主题色）
  const bgHex = bgColor.trim().replace('#', '')
  const bgR = parseInt(bgHex.substring(0, 2), 16)
  const bgG = parseInt(bgHex.substring(2, 4), 16)
  const bgB = parseInt(bgHex.substring(4, 6), 16)
  const bgLuminance = (bgR * 0.299 + bgG * 0.587 + bgB * 0.114) / 255

  // Dark 主题（亮度 < 0.5）：文字用白色，透明度 40%
  // Light/Sepia 主题（亮度 >= 0.5）：文字用主题色，透明度 30%
  if (bgLuminance < 0.5) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  } else {
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary') || '#695d4a'
    const hex = primaryColor.trim().replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`
  }

  // 文字大小增大（从 18px → 24px）
  ctx.font = '24px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, w / 2, h / 2)

  return canvas
}

// 反向翻页：GardenSection → ArchiveSection
async function flipBackToArchive() {
  if (isFlipping.value) return
  isFlipping.value = true

  // 1. 截取当前页面（GardenSection 整页内容）
  const frontCanvas = await captureCurrentPage()

  // 2. 显示翻页层，初始为完成态（progress=1，已翻到左侧）
  await nextTick()
  createFlipAnim(frontCanvas, 1)

  // 3. 播放反向翻页（从左翻回右）
  await pageFlipAnim.playBackward()

  // 4. 路由跳转回存档页
  router.push('/reflection')
  await nextTick()

  // 5. 清理动画
  destroyFlipAnim()
  flipState.value = 'archive'
  isFlipping.value = false
}

// 🆕 反向翻页：LetterSection → GardenSection（信箱返回花园）
async function flipBackToGarden() {
  if (isFlipping.value) return
  isFlipping.value = true

  // 1. 截取当前页面（LetterSection 整页内容）
  const frontCanvas = await captureCurrentPage()

  // 2. 显示翻页层，初始为完成态（progress=1，已翻到左侧）
  await nextTick()
  createFlipAnim(frontCanvas, 1)

  // 3. 播放反向翻页（从左翻回右）
  await pageFlipAnim.playBackward()

  // 4. 路由跳转回花园页
  router.push('/reflection/garden')
  await nextTick()

  // 5. 清理动画
  destroyFlipAnim()
  flipState.value = 'garden'
  isFlipping.value = false
}

provide('flipToGarden', flipToGarden)
provide('flipBackToArchive', flipBackToArchive)
provide('flipBackToGarden', flipBackToGarden)
provide('isFlipping', isFlipping)

onBeforeUnmount(() => {
  destroyFlipAnim()
})
</script>

<template>
  <div class="reflection-container relative min-h-screen bg-background overflow-hidden">
    <!-- 路由出口（ArchiveSection / GardenSection） -->
    <router-view v-slot="{ Component }">
      <transition
          name="page-fade"
          mode="out-in"
          :duration="300"
      >
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- 全屏翻页动画层（覆盖在页面上方） -->
    <div
      v-if="isFlipping"
      ref="flipCanvasContainer"
      class="flip-overlay fixed inset-0 z-[100]"
    ></div>
  </div>
</template>

<style scoped>
.reflection-container {
  background: var(--bg-primary);
}

.flip-overlay {
  background: var(--bg-primary);
}

.flip-overlay :deep(canvas) {
  display: block;
  width: 100vw !important;
  height: 100vh !important;
}

/* 页面过渡 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
