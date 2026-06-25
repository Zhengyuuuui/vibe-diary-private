<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFavoritesStore } from '@/stores/favorites'
import FavoriteCard from '@/components/favorites/FavoriteCard.vue'
import FavoriteDetail from '@/components/favorites/FavoriteDetail.vue'
import FavoriteFilter from '@/components/favorites/FavoriteFilter.vue'
import FavoriteSearch from '@/components/favorites/FavoriteSearch.vue'
import RandomInspiration from '@/components/favorites/RandomInspiration.vue'
import FavoriteStats from '@/components/favorites/FavoriteStats.vue'
import CreateFavoriteModal from '@/components/favorites/CreateFavoriteModal.vue'

const router = useRouter()
const store = useFavoritesStore()

const showDetail = ref(false)
const showCreateModal = ref(false)
const selectedFavorite = ref(null)  // 显式 null —— 页面加载时绝不弹详情
const searchQuery = ref('')
const showFilters = ref(false)
const showSidePanel = ref(true)

// 3D 场景状态机：控制时序
// 'idle' → 'falling' → 'ready' → 'hurricane' → (detail close) → 'falling' → 'ready'
const scenePhase = ref('idle')

// 飓风动画后需要重新散落
let hurricaneUsed = false

const filterValues = ref({
  type: null,
  mood: null
})

// ── 设备检测 ─────────────────────────────────────────────────
const isMobile = ref(window.innerWidth < 768)

// ── 2D 模式 gridItems (移动端) ───────────────────────────────
const gridItems = computed(() => {
  return store.favorites.map(fav => ({
    ...fav,
    span: fav.type === 'featured' ? 2 : 1
  }))
})

function cardRotation(index) {
  const seed = ((index * 9301 + 49297) % 233280) / 233280
  const deg = (seed * 2 - 1).toFixed(2)
  return { transform: `rotate(${deg}deg)` }
}

// ── 业务逻辑 ─────────────────────────────────────────────────
function goBack() {
  router.push('/')
}

function openDetail(favorite) {
  if (spotlightTl) { spotlightTl.kill(); spotlightTl = null }
  // 不杀 hurricaneTl —— 飓风动画调用 openDetail 是正常流程
  selectedFavorite.value = favorite
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  setTimeout(() => {
    if (!showDetail.value) selectedFavorite.value = null
  }, 350)

  // 飓风后关闭详情 → 重新散落所有卡片（落叶归位）
  if (hurricaneUsed && !isMobile.value && scene && renderer && gsap) {
    hurricaneUsed = false
    // 等弹窗关闭动画完成后再散落
    setTimeout(() => {
      scatterCardsOnDesk(store.favorites)
    }, 400)
  }
}

async function handleUpdate(id, data) {
  await store.updateFavorite(id, data)
  if (selectedFavorite.value?.id === id) {
    selectedFavorite.value = store.favorites.find(f => f.id === id)
  }
}

async function handleDelete(id) {
  await store.removeFavorite(id)
  closeDetail()
}

function handleFilterReset() {
  filterValues.value = { type: null, mood: null }
  searchQuery.value = ''
  store.resetFilters()
}

function handleSearch(query) {
  store.setFilters({ search: query })
}

async function handleCreate(data) {
  await store.addFavorite(data)
  showCreateModal.value = false
}

// ── 卡片 HTML 渲染 (5 种样式) ────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y} / ${m} / ${d}`
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function createCardElement(fav) {
  const el = document.createElement('div')
  const date = formatDate(fav.created_at)
  const content = escapeHtml(fav.content)
  const title = escapeHtml(fav.title)
  const source = escapeHtml(fav.source)
  const badge = escapeHtml(fav.badge)

  el.style.cssText = `
    font-family: system-ui, -apple-system, sans-serif;
    box-sizing: border-box;
    cursor: pointer;
    transition: box-shadow 0.4s ease, filter 0.4s ease;
  `

  if (fav.type === 'quote') {
    el.style.width = '320px'
    el.style.padding = '32px'
    el.style.background = 'var(--md-sys-color-surface-container-low, #f5f0e8)'
    el.style.borderRadius = '12px'
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;">
        <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:var(--md-sys-color-outline,#8a8070);">${date}</span>
        <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;color:var(--md-sys-color-primary,#695d4a);font-size:20px;">star</span>
      </div>
      <blockquote style="font-size:20px;line-height:1.7;color:var(--md-sys-color-on-surface,#1d1b16);margin:0 0 24px 0;font-weight:500;">
        ${content}
      </blockquote>
      ${source ? `<div style="display:flex;align-items:center;gap:12px;">
        <div style="height:1px;width:32px;background:rgba(138,128,112,0.3);"></div>
        <span style="font-size:12px;color:var(--md-sys-color-secondary,#605d56);">${source}</span>
      </div>` : ''}
    `
  } else if (fav.type === 'image') {
    el.style.width = '320px'
    el.style.background = 'var(--md-sys-color-surface-container-lowest, #fffbf5)'
    el.style.borderRadius = '12px'
    el.style.overflow = 'hidden'
    el.style.boxShadow = '0 20px 40px rgba(105,93,74,0.03)'
    el.innerHTML = `
      ${fav.image ? `<div style="height:200px;overflow:hidden;">
        <img src="${fav.image}" alt="${title}" style="width:100%;height:100%;object-fit:cover;" />
      </div>` : '<div style="height:200px;background:var(--md-sys-color-surface-container-low,#f5f0e8);display:flex;align-items:center;justify-content:center;"><span style="color:rgba(138,128,112,0.3);font-size:48px;">&#x1F5BC;</span></div>'}
      <div style="padding:24px;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:var(--md-sys-color-outline,#8a8070);margin-bottom:12px;">${date}</div>
        ${title ? `<h3 style="font-size:18px;font-weight:700;color:var(--md-sys-color-on-surface,#1d1b16);margin:0 0 8px 0;">${title}</h3>` : ''}
        <p style="font-size:14px;color:var(--md-sys-color-secondary,#605d56);line-height:1.6;margin:0;">${content}</p>
      </div>
    `
  } else if (fav.type === 'vertical') {
    el.style.width = '280px'
    el.style.minHeight = '360px'
    el.style.padding = '32px'
    el.style.background = 'var(--md-sys-color-surface-container-low, #f5f0e8)'
    el.style.borderRadius = '12px'
    el.style.display = 'flex'
    el.style.flexDirection = 'row-reverse'
    el.style.justifyContent = 'space-between'
    el.innerHTML = `
      <div style="writing-mode:vertical-rl;font-size:24px;letter-spacing:0.3em;line-height:1.8;color:rgba(105,93,74,0.8);padding-top:32px;font-weight:500;">
        ${title}
      </div>
      <div style="display:flex;flex-direction:column;justify-content:space-between;">
        <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;color:var(--md-sys-color-primary,#695d4a);font-size:20px;">star</span>
        <div>
          <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:var(--md-sys-color-outline,#8a8070);display:block;margin-bottom:16px;">${date}</span>
          <p style="font-size:14px;color:var(--md-sys-color-secondary,#605d56);max-width:120px;line-height:1.6;margin:0;">${content}</p>
        </div>
      </div>
    `
  } else if (fav.type === 'featured') {
    el.style.width = '560px'
    el.style.background = 'var(--md-sys-color-primary-container, #eedcb6)'
    el.style.borderRadius = '12px'
    el.style.overflow = 'hidden'
    el.style.display = 'flex'
    el.style.boxShadow = '0 20px 40px rgba(105,93,74,0.06)'
    el.innerHTML = `
      <div style="width:50%;min-height:240px;">
        ${fav.image ? `<img src="${fav.image}" alt="${title}" style="width:100%;height:100%;object-fit:cover;" />` : '<div style="width:100%;height:100%;background:rgba(105,93,74,0.1);display:flex;align-items:center;justify-content:center;"><span style="color:rgba(105,93,74,0.3);font-size:48px;">&#x2B50;</span></div>'}
      </div>
      <div style="width:50%;padding:40px;display:flex;flex-direction:column;justify-content:center;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
          <span class="material-symbols-outlined" style="color:var(--md-sys-color-primary,#695d4a);font-size:16px;">auto_stories</span>
          ${badge ? `<span style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(105,93,74,0.6);">${badge}</span>` : ''}
        </div>
        ${title ? `<h2 style="font-size:24px;font-weight:700;color:var(--md-sys-color-on-primary-container,#251a00);margin:0 0 16px 0;line-height:1.3;">${title}</h2>` : ''}
        <p style="font-size:16px;color:rgba(37,26,0,0.8);line-height:1.6;margin:0 0 32px 0;font-style:italic;">${content}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(37,26,0,0.4);">${date}</span>
          <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;color:var(--md-sys-color-primary,#695d4a);font-size:20px;">star</span>
        </div>
      </div>
    `
  } else {
    el.style.width = '320px'
    el.style.padding = '32px'
    el.style.background = 'var(--md-sys-color-surface-container-low, #f5f0e8)'
    el.style.borderRadius = '12px'
    el.style.borderLeft = '4px solid rgba(105,93,74,0.2)'
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
        <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:var(--md-sys-color-outline,#8a8070);">${date}</span>
        <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;color:var(--md-sys-color-primary,#695d4a);font-size:20px;">star</span>
      </div>
      <p style="font-size:18px;color:var(--md-sys-color-on-surface,#1d1b16);line-height:1.7;font-style:italic;margin:0;">
        ${content}
      </p>
      ${fav.tags && fav.tags.length > 0 ? `<div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(138,128,112,0.1);">
        <span style="font-size:12px;color:rgba(96,93,86,0.6);">分类: ${fav.tags.join(' / ')}</span>
      </div>` : ''}
    `
  }

  return el
}

// ══════════════════════════════════════════════════════════════
// ── Three.js 3D 场景 (仅桌面端 >=768px) ─────────────────────
// ══════════════════════════════════════════════════════════════
let scene, camera, renderer
let cardObjects = []
let animTimeline = null
let spotlightTl = null
let hurricaneTl = null  // 飓风动画 timeline
let THREE = null
let CSS3DRenderer_cls = null
let CSS3DObject_cls = null
let gsap = null

async function loadThreeDeps() {
  const [threeModule, cssRendererModule, gsapModule] = await Promise.all([
    import('three'),
    import('three/examples/jsm/renderers/CSS3DRenderer.js'),
    import('gsap')
  ])
  THREE = threeModule
  CSS3DRenderer_cls = cssRendererModule.CSS3DRenderer
  CSS3DObject_cls = cssRendererModule.CSS3DObject
  gsap = gsapModule.default
}

function initThreeScene() {
  const container = document.getElementById('three-container')
  if (!container || !THREE) return

  scene = new THREE.Scene()

  // Camera — 严格锁定 (0, 1800, 200)
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000)
  camera.position.set(0, 1800, 200)
  camera.lookAt(0, 0, 0)

  renderer = new CSS3DRenderer_cls()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.domElement.style.position = 'absolute'
  renderer.domElement.style.top = '0'
  renderer.domElement.style.left = '0'
  renderer.domElement.style.pointerEvents = 'none'
  renderer.domElement.style.overflow = 'visible'
  container.appendChild(renderer.domElement)

  const deskEl = document.createElement('div')
  deskEl.style.width = '4000px'
  deskEl.style.height = '3000px'
  deskEl.style.background = 'radial-gradient(ellipse at center, rgba(139,119,90,0.08) 0%, rgba(139,119,90,0.02) 60%, transparent 100%)'
  deskEl.style.borderRadius = '32px'
  deskEl.style.pointerEvents = 'none'

  const deskObj = new CSS3DObject_cls(deskEl)
  deskObj.rotation.x = -Math.PI / 2
  deskObj.position.set(0, -2, 0)
  scene.add(deskObj)

  renderer.render(scene, camera)
}

function renderScene() {
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

// ── 卡片乱序散落 + 落叶动画 ─────────────────────────────────
function scatterCardsOnDesk(favorites) {
  if (!scene || !renderer || !gsap) return

  // ── Phase 1: Silence — 清场 ──
  scenePhase.value = 'idle'

  if (animTimeline) { animTimeline.kill(); animTimeline = null }
  if (spotlightTl) { spotlightTl.kill(); spotlightTl = null }
  if (hurricaneTl) { hurricaneTl.kill(); hurricaneTl = null }

  cardObjects.forEach(obj => {
    scene.remove(obj.css3dObj)
    if (obj.css3dObj.element?.parentNode) {
      obj.css3dObj.element.remove()
    }
  })
  cardObjects = []

  if (favorites.length === 0) {
    renderScene()
    return
  }

  const positions = favorites.map((fav, i) => ({
    x: (Math.random() - 0.5) * 1600,
    z: (Math.random() - 0.5) * 1000,
    yFinal: i * 0.5,
    rotFinal: (Math.random() - 0.5) * 1.0472,
    rotInitial: (Math.random() - 0.5) * Math.PI * 2
  }))

  favorites.forEach((fav, i) => {
    const { x, z, yFinal, rotFinal, rotInitial } = positions[i]
    const cardEl = createCardElement(fav)

    cardEl.style.pointerEvents = 'auto'
    cardEl.style.opacity = '0'

    const objRef = { css3dObj: null, targetY: yFinal }

    cardEl.addEventListener('mouseenter', () => {
      if (!objRef.css3dObj || !gsap || scenePhase.value === 'hurricane') return
      gsap.to(objRef.css3dObj.position, {
        y: yFinal + 50, duration: 0.3, ease: 'power2.out', onUpdate: renderScene
      })
      cardEl.style.boxShadow = '0 40px 80px rgba(105,93,74,0.2)'
      cardEl.style.filter = 'brightness(1.03)'
    })

    cardEl.addEventListener('mouseleave', () => {
      if (!objRef.css3dObj || !gsap || scenePhase.value === 'hurricane') return
      gsap.to(objRef.css3dObj.position, {
        y: yFinal, duration: 0.4, ease: 'power2.inOut', onUpdate: renderScene
      })
      cardEl.style.boxShadow = ''
      cardEl.style.filter = ''
    })

    cardEl.addEventListener('click', (e) => {
      e.stopPropagation()
      if (scenePhase.value === 'hurricane') return
      openDetail(fav)
    })

    const css3dObj = new CSS3DObject_cls(cardEl)
    objRef.css3dObj = css3dObj

    css3dObj.rotation.x = -Math.PI / 2
    css3dObj.rotation.z = rotInitial
    css3dObj.position.set(x, 1200, z)

    scene.add(css3dObj)
    cardObjects.push({
      css3dObj, favorite: fav, targetY: yFinal, targetRot: rotFinal
    })
  })

  // ── Phase 2: Falling — 落叶飘降 ──
  scenePhase.value = 'falling'

  animTimeline = gsap.timeline({ onUpdate: renderScene })

  cardObjects.forEach((obj, i) => {
    const d = i * 0.15
    animTimeline.to(obj.css3dObj.position, { y: obj.targetY, duration: 1.2, ease: 'back.out(1.2)' }, d)
    animTimeline.to(obj.css3dObj.rotation, { z: obj.targetRot, duration: 1.0, ease: 'power2.inOut' }, d)
    animTimeline.to(obj.css3dObj.element.style, { opacity: 1, duration: 0.5, ease: 'power1.out' }, d)
  })

  // ── Phase 3: Ready — 全部落地，场景就绪，等待用户交互 ──
  animTimeline.eventCallback('onComplete', () => {
    scenePhase.value = 'ready'
    // 不自动弹窗 —— 静默等待用户点击卡片或点击"换一批"
  })
}

// ══════════════════════════════════════════════════════════════
// ── 灵感飓风动画 (The Inspiration Hurricane) ─────────────────
// ══════════════════════════════════════════════════════════════

function playHurricane(targetFav) {
  if (!gsap || !scene || cardObjects.length === 0) return
  if (scenePhase.value === 'hurricane') return // 防重复触发

  // 杀掉所有进行中的动画
  if (animTimeline) { animTimeline.kill(); animTimeline = null }
  if (spotlightTl) { spotlightTl.kill(); spotlightTl = null }
  if (hurricaneTl) { hurricaneTl.kill(); hurricaneTl = null }

  scenePhase.value = 'hurricane'
  hurricaneUsed = true

  // 找到目标卡片（匹配 id，找不到就随机选）
  let targetIdx = cardObjects.findIndex(obj => obj.favorite.id === targetFav?.id)
  if (targetIdx === -1) targetIdx = Math.floor(Math.random() * cardObjects.length)
  const target = cardObjects[targetIdx]

  hurricaneTl = gsap.timeline({ onUpdate: renderScene })

  // ── Phase 1: 狂风吹袭 (The Gust) ──────────────────────────
  // 所有卡片被吹上天，向外飞散，剧烈旋转
  cardObjects.forEach((obj, i) => {
    const isTarget = i === targetIdx
    const pos = obj.css3dObj.position
    const rot = obj.css3dObj.rotation

    // 飞散方向：从原位向外围扩散
    const angle = Math.atan2(pos.z, pos.x) + (Math.random() - 0.5) * 0.8
    const dist = 600 + Math.random() * 400
    const blownX = Math.cos(angle) * dist
    const blownZ = Math.sin(angle) * dist
    const blownY = 500 + Math.random() * 300 // 吹到空中

    // 随机剧烈旋转
    const spinZ = rot.z + (Math.random() - 0.5) * Math.PI * 3

    const gustDelay = i * 0.03 // 极快的错落，像冲击波

    hurricaneTl.to(pos, {
      x: isTarget ? blownX * 0.3 : blownX, // 目标卡片飞得近一点
      y: isTarget ? 600 : blownY,
      z: isTarget ? blownZ * 0.3 : blownZ,
      duration: 0.6,
      ease: 'power3.out'
    }, gustDelay)

    hurricaneTl.to(rot, {
      z: spinZ,
      duration: 0.6,
      ease: 'power2.out'
    }, gustDelay)
  })

  // ── Phase 2: 放逐与留存 (The Selection) ────────────────────
  // 非目标卡片：淡出消失
  // 目标卡片：飞向视觉中心
  const selectionStart = 0.5 // 在第一阶段还没完全结束时就开始

  cardObjects.forEach((obj, i) => {
    if (i === targetIdx) return // 目标卡片单独处理

    // 非目标：快速淡出
    hurricaneTl.to(obj.css3dObj.element.style, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in'
    }, selectionStart + i * 0.02)
  })

  // ── Phase 3: 中心呈现 (Final Focus) ────────────────────────
  // 目标卡片飞向相机视野中心
  // 相机在 (0, 1800, 200) lookAt(0,0,0)
  // 卡片放在 (0, 800, 100) 附近，面朝相机（保持平躺 rotation.x=-PI/2）
  const focusStart = selectionStart + 0.3

  // 高亮目标卡片
  hurricaneTl.to(target.css3dObj.element.style, {
    filter: 'brightness(1.1) drop-shadow(0 0 40px rgba(105,93,74,0.3))',
    duration: 0.3
  }, focusStart)

  // 飞向中心
  hurricaneTl.to(target.css3dObj.position, {
    x: 0,
    y: 800,
    z: 100,
    duration: 0.8,
    ease: 'power2.inOut'
  }, focusStart)

  // 旋转归正（平躺对准相机）
  hurricaneTl.to(target.css3dObj.rotation, {
    x: -Math.PI / 2,
    y: 0,
    z: 0,
    duration: 0.8,
    ease: 'power2.inOut'
  }, focusStart)

  // ── 定格后弹出详情 ──
  hurricaneTl.call(() => {
    // 清除高亮滤镜
    target.css3dObj.element.style.filter = ''
    openDetail(target.favorite)
  }, null, focusStart + 1.2) // 到达中心后等 0.4s
}

// RandomInspiration 的 @spotlight 回调 → 触发飓风
function handleSpotlight(favData) {
  if (isMobile.value) {
    // 移动端：直接弹详情
    openDetail(favData)
    return
  }
  if (!gsap || cardObjects.length === 0) return
  if (scenePhase.value !== 'ready') return

  playHurricane(favData)
}

function onWindowResize() {
  const nowMobile = window.innerWidth < 768
  if (nowMobile !== isMobile.value) {
    isMobile.value = nowMobile
    if (nowMobile) cleanupThreeScene()
    return
  }
  if (!camera || !renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderScene()
}

function cleanupThreeScene() {
  if (animTimeline) { animTimeline.kill(); animTimeline = null }
  if (spotlightTl) { spotlightTl.kill(); spotlightTl = null }
  if (hurricaneTl) { hurricaneTl.kill(); hurricaneTl = null }
  cardObjects = []
  if (renderer) { renderer.domElement.remove(); renderer = null }
  scene = null
  camera = null
  scenePhase.value = 'idle'
}

// ── 生命周期 ─────────────────────────────────────────────────
onMounted(async () => {
  await store.loadFavorites()
  await store.loadStats()
  window.addEventListener('resize', onWindowResize)

  if (!isMobile.value) {
    await loadThreeDeps()
    initThreeScene()
    scatterCardsOnDesk(store.favorites)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
  cleanupThreeScene()
})

// 数据变化 → 重新散落（搜索/筛选触发）
watch(() => store.favorites, (newFavs) => {
  if (!isMobile.value && scene && renderer) {
    scatterCardsOnDesk(newFavs)
  }
}, { deep: true })

watch(filterValues, (newVal) => {
  store.setFilters(newVal)
}, { deep: true })
</script>

<template>
  <div class="favorites-page" :class="{ 'is-desktop-3d': !isMobile }">

    <!-- ═══ Layer 1: 3D 场景 (仅桌面端) ═══ -->
    <div v-if="!isMobile" id="three-container"></div>

    <!-- ═══ Layer 2: HUD 全屏覆盖层 (桌面端) ═══ -->
    <div v-if="!isMobile" class="hud-layer">

      <!-- HUD 顶栏 -->
      <div class="hud-top">
        <!-- 左侧：返回 + 标题 + 创建 -->
        <div class="hud-top-left glass-panel">
          <button @click="goBack" class="material-symbols-outlined text-primary/60 hover:text-primary transition-all cursor-pointer text-xl">
            arrow_back
          </button>
          <div>
            <h1 class="font-headline text-2xl font-bold text-primary tracking-tight leading-tight">灵感撷萃</h1>
            <p class="text-secondary/60 font-body text-xs italic mt-0.5">散落在桌面的灵感碎片</p>
          </div>
          <button
            @click="showCreateModal = true"
            class="ml-4 flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-label hover:bg-primary/20 transition-colors"
          >
            <span class="material-symbols-outlined text-base">add</span>
            创建
          </button>
        </div>

        <!-- 右侧：搜索 + 筛选 -->
        <div class="hud-top-right glass-panel">
          <div class="w-64">
            <FavoriteSearch v-model="searchQuery" @search="handleSearch" />
          </div>
          <button
            @click="showFilters = !showFilters"
            :class="['material-symbols-outlined cursor-pointer hover:scale-95 transition-transform text-lg', (filterValues.type || filterValues.mood) ? 'text-primary' : 'text-primary/40']"
          >
            filter_list
          </button>
        </div>
      </div>

      <!-- HUD 筛选栏（展开时） -->
      <Transition name="slide">
        <div v-if="showFilters" class="hud-filter glass-panel">
          <FavoriteFilter v-model="filterValues" @reset="handleFilterReset" />
        </div>
      </Transition>

      <!-- HUD 右侧浮窗面板 -->
      <div class="hud-side-panel" :class="{ 'is-collapsed': !showSidePanel }">
        <!-- 折叠切换 -->
        <button
          @click="showSidePanel = !showSidePanel"
          class="side-panel-toggle glass-panel"
        >
          <span class="material-symbols-outlined text-primary/60 text-base">
            {{ showSidePanel ? 'chevron_right' : 'chevron_left' }}
          </span>
        </button>

        <Transition name="panel-slide">
          <div v-if="showSidePanel" class="side-panel-content">
            <div class="glass-panel side-widget">
              <RandomInspiration @spotlight="handleSpotlight" />
            </div>
            <div class="glass-panel side-widget">
              <FavoriteStats :stats="store.stats" />
            </div>
          </div>
        </Transition>
      </div>

      <!-- HUD 底部提示 -->
      <div v-if="store.favorites.length > 0" class="hud-bottom-hint">
        <span class="font-label text-[10px] text-primary/30 uppercase tracking-[0.3em]">
          {{ store.favorites.length }} 张灵感卡片散落在桌面上
        </span>
      </div>

      <!-- 空状态/加载态 -->
      <div v-if="store.loading && store.favorites.length === 0" class="hud-center-message">
        <span class="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
      </div>
      <div v-else-if="store.favorites.length === 0" class="hud-center-message">
        <div class="glass-panel p-12 text-center">
          <span class="material-symbols-outlined text-secondary text-6xl mb-6">lightbulb</span>
          <h2 class="font-headline text-2xl text-on-surface mb-2">还没有收藏内容</h2>
          <p class="font-body text-secondary mb-6">点击右上角的"创建"按钮添加你的第一个灵感</p>
          <button
            @click="showCreateModal = true"
            class="px-6 py-3 rounded-full bg-primary text-on-primary font-label hover:bg-primary/90 transition-colors"
          >
            创建收藏
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ 移动端 2D 布局 ═══ -->
    <div v-if="isMobile" class="mobile-layout">
      <nav class="top-nav-mobile">
        <div class="flex items-center gap-4">
          <button @click="goBack" class="material-symbols-outlined text-primary hover:scale-110 transition-transform cursor-pointer">arrow_back</button>
          <div class="text-xl font-bold text-primary font-headline tracking-tight">氛围日记</div>
        </div>
        <div class="flex items-center gap-4">
          <button @click="showFilters = !showFilters" :class="['material-symbols-outlined cursor-pointer', (filterValues.type || filterValues.mood) ? 'text-primary' : 'text-primary/60']">filter_list</button>
          <button @click="showCreateModal = true" class="material-symbols-outlined cursor-pointer text-primary">add</button>
        </div>
      </nav>

      <header class="px-4 pt-8 pb-4">
        <h1 class="text-3xl font-headline font-bold text-primary mb-2">灵感撷萃</h1>
        <div class="mt-4">
          <FavoriteSearch v-model="searchQuery" @search="handleSearch" />
        </div>
      </header>

      <Transition name="slide">
        <div v-if="showFilters" class="px-4 mb-4">
          <div class="p-4 bg-surface-container-lowest rounded-2xl">
            <FavoriteFilter v-model="filterValues" @reset="handleFilterReset" />
          </div>
        </div>
      </Transition>

      <div v-if="store.loading && store.favorites.length === 0" class="flex justify-center py-24">
        <span class="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
      </div>

      <div v-else-if="store.favorites.length === 0" class="text-center py-24 px-4">
        <span class="material-symbols-outlined text-secondary text-6xl mb-6">lightbulb</span>
        <h2 class="font-headline text-2xl text-on-surface mb-2">还没有收藏内容</h2>
        <p class="font-body text-secondary mb-6">点击右上角的 + 按钮添加灵感</p>
      </div>

      <div v-else class="px-4 pb-32">
        <div class="space-y-4">
          <template v-for="(item, index) in gridItems" :key="item.id">
            <FavoriteCard :favorite="item" :style="cardRotation(index)" @click="openDetail" />
          </template>
        </div>
        <div class="mt-8">
          <RandomInspiration @spotlight="handleSpotlight" />
        </div>
        <div class="mt-4">
          <FavoriteStats :stats="store.stats" />
        </div>
      </div>

      <nav class="mobile-bottom-nav">
        <a href="/" class="flex flex-col items-center text-primary/40 hover:text-primary transition-all">
          <span class="material-symbols-outlined">auto_stories</span>
          <span class="font-label text-[10px] uppercase tracking-widest mt-1">首页</span>
        </a>
        <a href="/archive" class="flex flex-col items-center text-primary/40 hover:text-primary transition-all">
          <span class="material-symbols-outlined">inventory_2</span>
          <span class="font-label text-[10px] uppercase tracking-widest mt-1">存档</span>
        </a>
        <a href="#" class="flex flex-col items-center text-primary scale-110">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>
          <span class="font-label text-[10px] uppercase tracking-widest mt-1">灵感</span>
        </a>
        <a href="/settings" class="flex flex-col items-center text-primary/40 hover:text-primary transition-all">
          <span class="material-symbols-outlined">settings</span>
          <span class="font-label text-[10px] uppercase tracking-widest mt-1">设置</span>
        </a>
      </nav>
    </div>

    <!-- 弹窗 -->
    <FavoriteDetail :show="showDetail" :favorite="selectedFavorite" @close="closeDetail" @update="handleUpdate" @delete="handleDelete" />
    <CreateFavoriteModal :show="showCreateModal" @close="showCreateModal = false" @create="handleCreate" />
  </div>
</template>

<style scoped>
.favorites-page {
  position: relative;
  min-height: 100vh;
  background: var(--md-sys-color-background, #fef7ee);
}

/* ══════════════════════════════════════════════════════════════ */
/* ── 毛玻璃通用样式 ── */
/* ══════════════════════════════════════════════════════════════ */

.glass-panel {
  background: rgba(255, 252, 245, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 119, 90, 0.08);
  border-radius: 16px;
  pointer-events: auto;
}

/* ══════════════════════════════════════════════════════════════ */
/* ── 桌面端 3D + HUD ── */
/* ══════════════════════════════════════════════════════════════ */

#three-container {
  position: fixed;
  inset: 0;
  z-index: 1;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  overflow: visible;
}

.hud-layer {
  position: fixed;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  overflow: hidden;
}

/* ── HUD 顶栏 ── */
.hud-top {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  z-index: 20;
}

.hud-top-left {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
}

.hud-top-right {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
}

/* ── HUD 筛选栏 ── */
.hud-filter {
  position: absolute;
  top: 80px;
  right: 16px;
  z-index: 20;
  padding: 16px 20px;
  max-width: 500px;
  pointer-events: auto;
}

/* ── HUD 右侧浮窗 ── */
.hud-side-panel {
  position: absolute;
  top: 80px;
  right: 16px;
  bottom: 60px;
  z-index: 15;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.hud-side-panel.is-collapsed {
  right: 0;
}

.side-panel-toggle {
  padding: 8px 4px;
  cursor: pointer;
  pointer-events: auto;
  border-radius: 8px;
  flex-shrink: 0;
  margin-top: 8px;
}

.side-panel-content {
  width: 320px;
  max-height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.side-panel-content::-webkit-scrollbar {
  display: none;
}

.side-widget {
  padding: 0;
  overflow: hidden;
}

/* 让子组件的圆角和 padding 生效，glass-panel 只提供背景 */
.side-widget :deep(> div) {
  background: transparent !important;
  box-shadow: none !important;
}

/* ── HUD 底部提示 ── */
.hud-bottom-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

/* ── HUD 中心消息 ── */
.hud-center-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: auto;
}

/* ══════════════════════════════════════════════════════════════ */
/* ── 移动端 2D ── */
/* ══════════════════════════════════════════════════════════════ */

.mobile-layout {
  position: relative;
  z-index: 2;
}

.top-nav-mobile {
  background: rgba(254, 247, 238, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px;
}

.mobile-bottom-nav {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: 92%;
  max-width: 28rem;
  z-index: 50;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 12px 16px;
  background: rgba(254, 247, 238, 0.9);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 9999px;
  box-shadow: 0 20px 40px rgba(105, 93, 74, 0.06);
}

/* ══════════════════════════════════════════════════════════════ */
/* ── 过渡动画 ── */
/* ══════════════════════════════════════════════════════════════ */

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
