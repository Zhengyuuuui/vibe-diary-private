<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { savePage, addPage } from '@/api'
import html2canvas from 'html2canvas'

const route = useRoute()
const router = useRouter()
const store = useDiaryStore()
const diaryId = route.params.id

// ============================================================
// 双容器架构
//   sourceContainer (v-show="false") —— Vue 独占，v-for 渲染的真实节点永远在此
//   flipContainer   (始终可见)       —— StPageFlip 独占，只放 cloneNode 的副本
// 两者物理隔离，Vue patch 永远不会碰到被 StPageFlip 改造过的节点
// ============================================================
const sourceContainer = ref(null)
const flipContainer = ref(null)
const pageFlipInstance = ref(null)
const isUnmounted = ref(false)
const isLoadingNewPage = ref(false)
const currentPageIndex = ref(0)
const saveTimers = ref({})
const isFlipping = ref(false)
const pageContents = ref({})

const isEditMode = ref(false)
const editingPageId = ref(null)
const charLimit = 1000
const saveStatus = ref('')
const showSaveToast = ref(false)
const isComposing = ref(false)
const composingStartTime = ref(null)

// ============================================================
// sessionStorage 持久化 key（基于 diaryId 隔离）
// ============================================================
const SESSION_KEY_PAGE = `diary_flip_page_${diaryId}`

const coverStyles = {
  leather: { class: 'leather-texture', textClass: 'text-on-primary' },
  linen: { class: 'linen-texture bg-primary-container', textClass: 'text-primary' },
  pattern: { class: 'pattern-texture', textClass: 'text-on-surface' }
}

const displayPages = computed(() => {
  if (!store.currentDiary || !store.currentDiary.pages) return []

  const pages = []

  pages.push({
    id: 'cover',
    page_num: 0,
    content: '',
    isCover: true
  })

  pages.push(...store.currentDiary.pages)

  // ── 偶数页补齐（showCover 拟物闭环） ──
  // showCover: true 下 StPageFlip 需要总页数为偶数才能正确闭合。
  // 封面(1) + 内容页(N) + 封底(1) = N+2
  // 当 N+2 为奇数时（即 N 为奇数），在封底前插入一张空白补齐页。
  const totalWithoutPadding = 1 + store.currentDiary.pages.length + 1
  if (totalWithoutPadding % 2 !== 0) {
    pages.push({
      id: 'blank-pad',
      page_num: pages.length,
      content: '',
      isBlankPad: true
    })
  }

  pages.push({
    id: 'back-cover',
    page_num: pages.length,
    content: '',
    isBackCover: true
  })

  return pages
})

const totalPages = computed(() => {
  if (!pageFlipInstance.value) return 0
  return Math.max(0, pageFlipInstance.value.getPageCount() - 1)
})

const currentPageContent = computed(() => {
  if (!editingPageId.value) return ''
  return pageContents.value[editingPageId.value] || ''
})

const currentCharCount = computed(() => {
  return currentPageContent.value.length
})

const isOverLimit = computed(() => {
  return currentCharCount.value > charLimit
})

const isNearLimit = computed(() => {
  return currentCharCount.value > charLimit * 0.9
})

const contentPageCount = computed(() => {
  if (!store.currentDiary?.pages) return 0
  return store.currentDiary.pages.length
})

const currentContentPage = computed(() => {
  if (currentPageIndex.value === 0) return 0
  const lastPageIndex = pageFlipInstance.value?.getPageCount() - 1 || 0
  if (currentPageIndex.value >= lastPageIndex) return 0
  return currentPageIndex.value
})

const pageNavText = computed(() => {
  if (currentPageIndex.value === 0) return '封面'
  const lastPageIndex = pageFlipInstance.value?.getPageCount() - 1 || 0
  if (currentPageIndex.value >= lastPageIndex) return '封底'
  return `${currentPageIndex.value} / ${contentPageCount.value}`
})

function formatDateTime(dateStr) {
  if (!dateStr) return ''

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

const aestheticQuotes = [
  '时光静好，与君语；细水长流，与君同。',
  '岁月如歌，静守流年，心若向阳，无畏悲伤。',
  '浮生若梦，为欢几何，且将新火试新茶。',
  '山高水长，来日方长，愿所有的美好如期而至。',
  '云淡风轻，听风吟唱，看云卷云舒。',
  '一花一世界，一叶一追寻，一曲一场叹，一生为一人。',
  '岁月极美，在于它必然的流逝，春花、秋月、夏日、冬雪。',
  '心有猛虎，细嗅蔷薇，盛宴之后，泪流满面。',
  '人生若只如初见，何事秋风悲画扇。',
  '世间所有的相遇，都是久别重逢。',
  '愿你出走半生，归来仍是少年。',
  '山河远阔，人间烟火，无一是你，无一不是你。',
  '且将新火试新茶，诗酒趁年华。',
  '此心安处是吾乡，愿你眼里有光，心中有爱。',
  '陌上花开，可缓缓归矣。',
  '白茶清欢无别事，我在等风也等你。',
  '愿你三冬暖，愿你春不寒，愿你天黑有灯，下雨有伞。',
  '星河滚烫，你是人间理想；皓月清凉，你是人间曙光。',
  '半山烟雨半山晴，几分朦胧几分清。',
  '落花人独立，微雨燕双飞。',
  '人间忽晚，山河已秋。',
  '林深时见鹿，海蓝时见鲸，梦醒时见你。',
  '我见青山多妩媚，料青山见我应如是。',
  '山中何事？松花酿酒，春水煎茶。',
  '一蓑烟雨任平生，也无风雨也无晴。',
  '且停且忘且随风，且行且看且从容。',
  '岁月不声不响，你且不慌不忙。',
  '风起时，笑看落花；风停时，淡看天际。',
  '花开有时，花落有时，无需留恋，该走的终须会走。',
  '愿你遍历山河，觉得人间值得。'
]

function getRandomQuote() {
  return aestheticQuotes[Math.floor(Math.random() * aestheticQuotes.length)]
}

// ============================================================
// 工具函数：delay（Promise 化的 setTimeout）
// ============================================================
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================
// safeFlipTo：带双重校验的安全跳转
//
// 流程：
//   1. pf.update() 强制重算物理坐标
//   2. 等待 400ms（3D 矩阵初始化安全阈值）
//   3. 轮询校验 getPageCount() >= target + 1（确保目标页存在）
//      每 50ms 检查一次，最多轮询 20 次（~1 秒）
//   4. 执行 pf.flip(target)
//   5. 持久化到 sessionStorage
//
// 注意：不再操作 isEditMode。调用方负责在调用前处理编辑模式。
//       隐藏源模板已与 isEditMode 完全解耦，所以不存在
//       "切换 isEditMode 触发 Vue patch 破坏 flipContainer" 的风险。
//
// 返回 true = 跳转成功，false = 失败/中断
// ============================================================
async function safeFlipTo(target) {
  if (isUnmounted.value || !pageFlipInstance.value || target <= 0) return false

  const pf = pageFlipInstance.value

  // ── 1. 强制重算物理坐标 ──
  pf.update()

  // ── 2. 400ms 延迟（3D 矩阵初始化安全阈值） ──
  await delay(400)
  if (isUnmounted.value || !pageFlipInstance.value) return false

  // ── 3. 轮询校验：引擎是否已识别足够页数 ──
  let ready = false
  for (let poll = 0; poll < 20; poll++) {
    if (isUnmounted.value || !pageFlipInstance.value) return false
    const currentCount = pageFlipInstance.value.getPageCount()
    if (currentCount >= target + 1) {
      ready = true
      break
    }
    console.warn(`[safeFlipTo] 等待引擎就绪: ${currentCount} < ${target + 1}, poll ${poll + 1}`)
    await delay(50)
  }

  if (!ready || isUnmounted.value || !pageFlipInstance.value) {
    console.error('[safeFlipTo] 引擎页数不足，跳转取消')
    return false
  }

  // ── 4. 执行跳转 ──
  pageFlipInstance.value.flip(target)
  console.log('[safeFlipTo] flip(' + target + ') 已发射, pageCount =', pageFlipInstance.value.getPageCount())

  // ── 5. 持久化 ──
  try {
    sessionStorage.setItem(SESSION_KEY_PAGE, String(target))
  } catch (_) {}

  return true
}

// ============================================================
// cloneSourceToFlipSync：克隆结构 + 从内存数据"填鸭式"物理注入
//
// 纯同步操作。返回 boolean 表示成功与否。
// 当 sourceContainer 中的 .diary-page 数量少于 displayPages 时
// 直接返回 false（数量校验锁），调用方负责重试。
//
// 核心保证：克隆出的每个节点一定拥有正确的 data-page-id
// 和正文内容，因为它们从 displayPages 内存数据物理写入，
// 完全绕过 Vue 的属性绑定时序。
// ============================================================
function cloneSourceToFlipSync() {
  if (!sourceContainer.value || !flipContainer.value) return false

  const pages = displayPages.value
  if (pages.length === 0) return false

  // ── 数量校验锁 ──
  // sourceContainer 中 .diary-page 数量必须 >= displayPages.length
  // 如果 Vue 还没把新标签长出来，严禁克隆
  const sourcePages = sourceContainer.value.querySelectorAll('.diary-page')
  if (sourcePages.length < pages.length) {
    console.warn(
      '[cloneSourceToFlipSync] 数量校验不通过:',
      sourcePages.length, '<', pages.length,
      '— Vue 尚未渲染完毕，等待重试'
    )
    return false
  }

  // ── 清空展示区 ──
  flipContainer.value.innerHTML = ''

  // ── 遍历克隆 + 填鸭式物理注入 ──
  for (let i = 0; i < pages.length; i++) {
    const clone = sourcePages[i].cloneNode(true)
    const pageData = pages[i]

    // 物理写入 data-page-id —— 绝不依赖 Vue 绑定
    clone.setAttribute('data-page-id', String(pageData.id))
    clone.setAttribute('data-density', (pageData.isCover || pageData.isBackCover) ? 'hard' : 'soft')

    // 内容页：强制注入文字（封面/封底/空白补齐页跳过）
    if (!pageData.isCover && !pageData.isBackCover && !pageData.isBlankPad) {
      // data-content-page-id
      const contentWrapper = clone.querySelector('[data-content-page-id]') || clone.firstElementChild
      if (contentWrapper) {
        contentWrapper.setAttribute('data-content-page-id', String(pageData.id))
      }

      // 页码标题
      const headerEl = clone.querySelector('.font-label.tracking-widest')
      if (headerEl) {
        headerEl.textContent = `${store.currentDiary.title} · 第 ${pageData.page_num} 页`
      }

      // 正文 → .page-text-area
      const textArea = clone.querySelector('.page-text-area')
      if (textArea) {
        const content = pageContents.value[String(pageData.id)] ?? pageData.content ?? ''
        // 克隆阶段始终以浏览态注入（不设 contenteditable）
        // 编辑态通过 enableEditOnPages() 在已渲染的物理 DOM 上原地开启
        textArea.innerText = content || '（空白页）'
      }

      // 页脚页码
      const footerPageNum = clone.querySelector('.border-t .font-label:first-child')
      if (footerPageNum) {
        footerPageNum.textContent = String(pageData.page_num)
      }

      // 更新时间
      if (pageData.updated_at) {
        const timeSpans = clone.querySelectorAll('.border-t .font-label')
        if (timeSpans.length >= 2) {
          timeSpans[1].textContent = formatDateTime(pageData.updated_at)
        }
      }
    }

    flipContainer.value.appendChild(clone)

    // ── 强制布局重绘 (Force Reflow) ──
    // 读取 offsetHeight 强制浏览器立即计算该节点的物理宽高。
    // 没有这一步，动态插入的节点尺寸可能为 0，
    // 导致翻页库 loadFromHTML 时抓取到零尺寸页面。
    void clone.offsetHeight
  }

  // ── 容器级强制重绘 ──
  // 所有克隆节点插入完毕后，再读取一次容器高度，
  // 确保浏览器对整个 flipContainer 完成一次完整的 Layout 计算。
  void flipContainer.value.offsetHeight

  // ── 绑定双击事件 ──
  bindDblClickToClones()

  return true
}

// ============================================================
// cloneSourceToFlip（异步，带数量校验锁的轮询重试）
//
// 每轮迭代：
//   1. await nextTick()  —— 让 Vue 有机会在微任务中创建新节点
//   2. 尝试 cloneSourceToFlipSync()
//   3. 失败则 delay(50ms) 后再进入下一轮
//
// 最多重试 60 次（总计约 ~3 秒），覆盖极端慢设备。
// ============================================================
async function cloneSourceToFlip() {
  const maxRetries = 60

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (isUnmounted.value) return false

    // 先给 Vue 一次微任务机会把节点长出来
    await nextTick()

    const ok = cloneSourceToFlipSync()
    if (ok) {
      console.log(`[cloneSourceToFlip] 克隆+注入成功 (attempt ${attempt + 1})`)
      return true
    }

    // 校验不通过，等 50ms 让浏览器完成可能的宏任务渲染
    await delay(50)
  }

  console.error('[cloneSourceToFlip] 重试耗尽（60 次），克隆失败')
  return false
}

// ============================================================
// bindDblClickToClones：为克隆出的内容页绑定双击进入编辑模式
// ============================================================
function bindDblClickToClones() {
  if (!flipContainer.value) return

  const contentPages = flipContainer.value.querySelectorAll('[data-content-page-id]')
  contentPages.forEach(el => {
    const pageId = el.getAttribute('data-content-page-id')
    if (!pageId) return
    el.addEventListener('dblclick', () => {
      handlePageDoubleClick(pageId)
    })
  })
}

// ============================================================
// destroyPageFlip：销毁 StPageFlip + 深度清空 flipContainer
//
// StPageFlip 在 loadFromHTML 后会创建 .stf__parent > .stf__wrapper > .stf__block
// 等包裹结构。destroy() 不一定能完全移除这些节点。
// 必须显式移除所有 stf__ 开头的容器，再清空 innerHTML，
// 确保下一次克隆的节点能被库从零开始正确识别。
// ============================================================
function destroyPageFlip() {
  if (pageFlipInstance.value) {
    try {
      pageFlipInstance.value.destroy()
    } catch (e) {
      // destroy 可能重复调用，忽略
    }
    pageFlipInstance.value = null
  }

  if (flipContainer.value) {
    // 显式移除 StPageFlip 生成的包裹容器（stf__parent, stf__wrapper, stf__block 等）
    const stfNodes = flipContainer.value.querySelectorAll('[class*="stf__"]')
    stfNodes.forEach(node => {
      try { node.remove() } catch (_) {}
    })
    // 最终清空所有残留内容
    flipContainer.value.innerHTML = ''
  }
}

// ============================================================
// createPageFlipEngine：纯物理引擎初始化（异步 — 含双重 update 握手）
//
// 前提：flipContainer 中已有正确的、经过 force reflow 的 .diary-page 克隆节点。
// 本函数只做：new PageFlip → loadFromHTML → 双重 update → 绑定事件回调。
// 不涉及任何 destroy / clone 逻辑。
//
// 返回 true 表示成功，此时 pageFlipInstance 已赋值。
// ============================================================
async function createPageFlipEngine() {
  if (isUnmounted.value) return false
  if (!flipContainer.value) return false

  const St = window.St
  if (!St || !St.PageFlip) {
    console.error('[createPageFlipEngine] StPageFlip 库未加载')
    return false
  }

  const pages = flipContainer.value.querySelectorAll('.diary-page')
  if (pages.length === 0) {
    console.error('[createPageFlipEngine] flipContainer 中无 .diary-page')
    return false
  }

  const isMobile = window.innerWidth < 768
  const pageWidth = isMobile ? Math.min(window.innerWidth - 40, 400) : 480
  const pageHeight = Math.round(pageWidth * 4 / 3)

  try {
    const pf = new St.PageFlip(flipContainer.value, {
      width: pageWidth,
      height: pageHeight,
      size: 'stretch',
      minWidth: 280,
      maxWidth: 600,
      minHeight: 373,
      maxHeight: 800,
      drawShadow: true,
      flippingTime: 800,
      usePortrait: true,
      startZIndex: 0,
      autoSize: true,
      maxShadowOpacity: 0.7,
      showCover: true,
      mobileScrollSupport: true,
      clickEventForward: true,
      useMouseEvents: true,
      swipeDistance: 30,
      showPageCorners: true,
      disableFlipByClick: false
    })

    pf.loadFromHTML(pages)

    // ── 双重 update() 握手 ──
    // 第 1 次：同步调用，强制库立即重算所有页面的物理坐标。
    pf.update()

    // 第 2 次：在 nextTick 中再次调用。
    // 这确保在浏览器完成本轮微任务 + DOM 更新后，
    // 物理引擎的内部页面索引与实际 DOM 数量 100% 同步。
    await nextTick()
    if (isUnmounted.value) return false
    pf.update()

    // flip 事件回调：更新当前页码 + 持久化到 sessionStorage
    pf.on('flip', (e) => {
      currentPageIndex.value = e.data
      isFlipping.value = true
      setTimeout(() => { isFlipping.value = false }, 300)

      // 状态持久化
      try {
        sessionStorage.setItem(SESSION_KEY_PAGE, String(e.data))
      } catch (_) {}
    })

    pf.on('changeOrientation', () => {
      pf.update()
    })

    pageFlipInstance.value = pf
    console.log('[createPageFlipEngine] 引擎创建成功, pageCount =', pf.getPageCount())
    return true
  } catch (err) {
    console.error('[createPageFlipEngine] 失败:', err)
    return false
  }
}

// ============================================================
// initPageFlip：完整编排（销毁 → 校验克隆 → 引擎启动）
//
// 仅在 onMounted 时调用。编辑模式切换不走此函数。
//
// 流程：
//   1. destroyPageFlip()       —— 清除旧实例 + 清空 flipContainer
//   2. cloneSourceToFlip()     —— 异步带重试：校验锁 → 克隆 → 物理注入
//   3. createPageFlipEngine()  —— 在已注入的克隆体上启动翻页引擎
// ============================================================
async function initPageFlip() {
  if (isUnmounted.value) return false
  if (!sourceContainer.value || !flipContainer.value || !store.currentDiary) {
    console.warn('[initPageFlip] 前置条件不满足，跳过')
    return false
  }

  // 1. 销毁旧实例
  destroyPageFlip()

  // 2. 校验克隆（内含重试机制）
  const cloneOk = await cloneSourceToFlip()
  if (!cloneOk) {
    console.error('[initPageFlip] 克隆+注入失败')
    return false
  }

  if (isUnmounted.value) return false

  // 3. 启动物理引擎
  return createPageFlipEngine()
}

// ============================================================
// 生命周期
// ============================================================
onMounted(async () => {
  await store.loadDiary(diaryId)

  if (store.currentDiary) {
    // 同步 pageContents 镜像
    store.currentDiary.pages.forEach(p => {
      pageContents.value[String(p.id)] = p.content
    })
  }

  // 一次 nextTick 让 Vue 创建 sourceContainer 中的节点骨架
  await nextTick()

  if (!isUnmounted.value && store.currentDiary) {
    // 确保跳转前处于浏览模式（防止编辑态干扰物理引擎）
    isEditMode.value = false
    editingPageId.value = null

    // initPageFlip：clone + 物理注入 + 引擎启动
    const success = await initPageFlip()

    if (success && pageFlipInstance.value) {
      // ── 检测跳转标记 ──
      // 优先级 1：jump_to_new_page（addNewPage 刷新前写入的标记）
      //          → 翻到最后一页内容（pageCount - 2）
      // 优先级 2：SESSION_KEY_PAGE / diary_target_jump（常规位置恢复）
      //          → 翻到上次记录的位置
      const shouldJumpToNew = sessionStorage.getItem('jump_to_new_page') === 'true'

      if (shouldJumpToNew) {
        // 立即清除标记（无论跳转成功与否，防止无限刷新循环）
        sessionStorage.removeItem('jump_to_new_page')

        // 500ms 延迟：给物理引擎充足时间完成 3D 模型构建
        // 这是全新页面加载，浏览器需要从零完成布局，500ms 是安全阈值
        setTimeout(() => {
          if (!isUnmounted.value && pageFlipInstance.value) {
            const pageCount = pageFlipInstance.value.getPageCount()
            const target = pageCount - 2  // 封底前一页 = 最新内容页
            if (target > 0) {
              pageFlipInstance.value.flip(target)
              console.log('[onMounted] 新页跳转: flip(' + target + '), pageCount =', pageCount)

              // 持久化当前位置
              try {
                sessionStorage.setItem(SESSION_KEY_PAGE, String(target))
              } catch (_) {}
            }
          }
        }, 500)
      } else {
        // 常规位置恢复（非新页刷新）
        let targetIndex = null

        const jumpMark = sessionStorage.getItem('diary_target_jump')
        if (jumpMark !== null) {
          targetIndex = parseInt(jumpMark, 10)
          sessionStorage.removeItem('diary_target_jump')
        }

        if (targetIndex === null || isNaN(targetIndex)) {
          const savedPage = sessionStorage.getItem(SESSION_KEY_PAGE)
          if (savedPage !== null) {
            targetIndex = parseInt(savedPage, 10)
          }
        }

        if (targetIndex !== null && !isNaN(targetIndex) && targetIndex > 0) {
          await safeFlipTo(targetIndex)
        }
      }
    }
  }
})

onBeforeUnmount(() => {
  isUnmounted.value = true

  if (pageFlipInstance.value) {
    try {
      pageFlipInstance.value.destroy()
    } catch (e) {
      // 静默忽略
    }
    pageFlipInstance.value = null
  }

  // 清空 flipContainer，防止 Vue unmount 遍历到 StPageFlip 改造过的异形节点
  if (flipContainer.value) {
    flipContainer.value.innerHTML = ''
  }

  // 清除所有自动保存定时器
  Object.values(saveTimers.value).forEach(clearTimeout)
  saveTimers.value = {}
})

// ============================================================
// addNewPage："笨方法" —— API 成功后直接刷新页面
//
// 放弃在同一次生命周期内做 destroy → clone → engine → flip 的复杂编排。
// 改用最稳健的方式：
//   1. 调用 API 创建新页
//   2. 设置 sessionStorage 标记 jump_to_new_page = 'true'
//   3. window.location.reload() 强制刷新
//
// 刷新后 onMounted 会检测标记，在全新的、干净的生命周期中
// 完成 initPageFlip() 并自动翻到最后一页。
// 100% 成功率：因为刷新后的渲染流程与手动刷新完全一致。
// ============================================================
async function addNewPage() {
  if (!store.currentDiary) return
  if (isLoadingNewPage.value) return

  isLoadingNewPage.value = true

  try {
    // 1. 调用 API 创建新页
    await addPage(diaryId)

    // 2. 设置跳转标记（刷新后 onMounted 会读取）
    sessionStorage.setItem('jump_to_new_page', 'true')

    // 3. 强制刷新 —— 模拟用户手动刷新，一切从零开始
    window.location.reload()

    // 注意：reload() 后本函数的后续代码不会执行。
    // isLoadingNewPage 会在新页面的 onMounted 中被重置。
  } catch (err) {
    console.error('[addNewPage] API 请求失败:', err)
    isLoadingNewPage.value = false
  }
}

// ============================================================
// 自动保存
// ============================================================
function triggerAutoSave(pageIdStr, content) {
  saveStatus.value = 'saving'
  showSaveToast.value = true

  if (saveTimers.value[pageIdStr]) {
    clearTimeout(saveTimers.value[pageIdStr])
  }

  saveTimers.value[pageIdStr] = setTimeout(async () => {
    try {
      await savePage(pageIdStr, content)
      saveStatus.value = 'saved'

      const pageIndex = store.currentDiary.pages.findIndex(p => String(p.id) === pageIdStr)

      if (pageIndex !== -1) {
        store.currentDiary.pages[pageIndex].content = content
        store.currentDiary.pages[pageIndex].updated_at = new Date().toISOString()
      }

      delete saveTimers.value[pageIdStr]

      setTimeout(() => {
        showSaveToast.value = false
        saveStatus.value = ''
      }, 3000)
    } catch (err) {
      console.error('自动保存失败:', err)
      saveStatus.value = ''
      delete saveTimers.value[pageIdStr]
    }
  }, 2000)
}

function hasUnsavedChanges() {
  if (!store.currentDiary) return false

  for (const page of store.currentDiary.pages) {
    const pageIdStr = String(page.id)
    const localContent = pageContents.value[pageIdStr] ?? pageContents.value[page.id] ?? ''
    const storeContent = page.content ?? ''
    if (localContent !== storeContent) {
      return true
    }
  }
  return false
}

async function saveAllChanges() {
  for (const [pageId, content] of Object.entries(pageContents.value)) {
    try {
      await savePage(pageId, content)
      delete saveTimers.value[pageId]

      const pageIndex = store.currentDiary.pages.findIndex(p => String(p.id) === pageId)
      if (pageIndex !== -1) {
        store.currentDiary.pages[pageIndex].content = content
      }
    } catch (err) {
      console.error('保存失败:', err)
    }
  }
}

// ============================================================
// 导航
// ============================================================
function goBack() {
  router.push('/')
}

function flipNext() {
  if (pageFlipInstance.value && !isFlipping.value && !isLoadingNewPage.value) {
    const pageCount = pageFlipInstance.value.getPageCount()
    if (currentPageIndex.value < pageCount - 2) {
      pageFlipInstance.value.flipNext()
    }
  }
}

function flipPrev() {
  if (pageFlipInstance.value && !isFlipping.value && !isLoadingNewPage.value) {
    pageFlipInstance.value.flipPrev()
  }
}

// ============================================================
// 编辑模式：原地切换（零销毁、零克隆、零重建）
//
// 核心原则：StPageFlip 实例和它管理的 DOM 节点在模式切换时
// 绝不被销毁或重新创建。所有编辑状态的切换都通过原生 JS
// 直接操作 flipContainer 内部已存在的物理 DOM 完成。
// ============================================================

// WeakMap 存储每个 textArea 的事件处理器引用，用于 removeEventListener
const editHandlersMap = new WeakMap()

function disablePageFlip() {
  if (!pageFlipInstance.value) return
  // 通过 CSS 禁用翻页控制层的鼠标/触摸事件
  // 这比调用内部 API 更安全，不会破坏引擎状态
  const stfParent = flipContainer.value?.querySelector('.stf__parent')
  if (stfParent) {
    stfParent.style.pointerEvents = 'none'
  }
  // 同时尝试 API 方式（如果存在）
  try {
    const ui = pageFlipInstance.value.getUI()
    if (ui && typeof ui.removeHandlers === 'function') {
      ui.removeHandlers()
    }
  } catch (_) {}
}

function enablePageFlip() {
  if (!pageFlipInstance.value) return
  const stfParent = flipContainer.value?.querySelector('.stf__parent')
  if (stfParent) {
    stfParent.style.pointerEvents = ''
  }
  try {
    const ui = pageFlipInstance.value.getUI()
    if (ui && typeof ui.setHandlers === 'function') {
      ui.setHandlers()
    }
  } catch (_) {}
}

// ============================================================
// enableEditOnPages：原生 JS 开启编辑态
//
// 遍历 flipContainer 中所有 .page-text-area，为每个：
//   1. setAttribute('contenteditable', 'true')
//   2. 设置 pointer-events / cursor / outline 内联样式
//   3. 添加 editing-active class（纯视觉，不改变 display/position）
//   4. 绑定 input / compositionstart / compositionend / focus / click 事件
//   5. 将处理器引用存入 WeakMap 以便后续精确 remove
// ============================================================
function enableEditOnPages() {
  if (!flipContainer.value) return

  const textAreas = flipContainer.value.querySelectorAll('.page-text-area')
  textAreas.forEach(el => {
    // 找到最近的 .diary-page 祖先来获取 page id
    const diaryPage = el.closest('.diary-page')
    const pageId = diaryPage?.getAttribute('data-page-id')
    if (!pageId || pageId === 'cover' || pageId === 'back-cover' || pageId === 'blank-pad') return

    // 设置 contenteditable
    el.setAttribute('contenteditable', 'true')
    el.setAttribute('data-page-id', pageId)
    el.style.pointerEvents = 'auto'
    el.style.cursor = 'text'
    el.style.outline = 'none'
    el.classList.add('editing-active')

    // 写入最新内容（从内存镜像）
    const content = pageContents.value[String(pageId)] ?? ''
    if (content) {
      el.innerText = content
    } else {
      // 编辑模式下清除占位符
      if (el.innerText === '（空白页）') {
        el.innerText = ''
      }
    }

    // 构建事件处理器并存入 WeakMap
    const handlers = {
      input: (event) => {
        if (isComposing.value && composingStartTime.value) {
          if (Date.now() - composingStartTime.value > 5000) {
            isComposing.value = false
            composingStartTime.value = null
          }
        }
        if (isComposing.value) return

        const text = event.target.innerText || ''
        if (text.length > charLimit) {
          event.target.innerText = text.substring(0, charLimit)
          return
        }
        const pidStr = String(pageId)
        pageContents.value[pidStr] = text
        triggerAutoSave(pidStr, text)
      },
      compositionstart: () => {
        isComposing.value = true
        composingStartTime.value = Date.now()
      },
      compositionend: (event) => {
        isComposing.value = false
        composingStartTime.value = null
        const text = event.target.innerText || ''
        const pidStr = String(pageId)
        pageContents.value[pidStr] = text
        triggerAutoSave(pidStr, text)
      },
      focus: () => { editingPageId.value = pageId },
      click: () => { editingPageId.value = pageId }
    }

    el.addEventListener('input', handlers.input)
    el.addEventListener('compositionstart', handlers.compositionstart)
    el.addEventListener('compositionend', handlers.compositionend)
    el.addEventListener('focus', handlers.focus)
    el.addEventListener('click', handlers.click)

    editHandlersMap.set(el, handlers)
  })
}

// ============================================================
// disableEditOnPages：原生 JS 关闭编辑态
//
// 遍历 flipContainer 中所有 .page-text-area：
//   1. removeAttribute('contenteditable')
//   2. 清除内联样式
//   3. 移除 editing-active class
//   4. 用 WeakMap 中的引用精确 removeEventListener
//   5. 同步内存镜像中的最新内容回显到 innerText
// ============================================================
function disableEditOnPages() {
  if (!flipContainer.value) return

  const textAreas = flipContainer.value.querySelectorAll('.page-text-area')
  textAreas.forEach(el => {
    const pageId = el.getAttribute('data-page-id')

    // 移除编辑属性
    el.removeAttribute('contenteditable')
    el.removeAttribute('data-page-id')
    el.style.pointerEvents = ''
    el.style.cursor = ''
    el.style.outline = ''
    el.classList.remove('editing-active')

    // 恢复显示内容（从内存镜像回写，或显示占位符）
    if (pageId) {
      const content = pageContents.value[String(pageId)] ?? ''
      el.innerText = content || '（空白页）'
    }

    // 精确移除事件处理器
    const handlers = editHandlersMap.get(el)
    if (handlers) {
      el.removeEventListener('input', handlers.input)
      el.removeEventListener('compositionstart', handlers.compositionstart)
      el.removeEventListener('compositionend', handlers.compositionend)
      el.removeEventListener('focus', handlers.focus)
      el.removeEventListener('click', handlers.click)
      editHandlersMap.delete(el)
    }
  })
}

// ============================================================
// toggleToEditMode / toggleToBrowseMode
//
// 零销毁方案：StPageFlip 实例保持静止。
// 仅通过原生 JS 在已存在的物理 DOM 上开启/关闭 contenteditable。
// ============================================================
function toggleToEditMode() {
  if (isEditMode.value) return  // 已经是编辑模式

  isEditMode.value = true

  // 1. 锁定翻页（防止编辑时滑动翻页）
  disablePageFlip()

  // 2. 原生 JS 开启所有内容页的编辑态
  enableEditOnPages()

  console.log('[toggleToEditMode] 编辑模式已开启（原地切换，零重建）')
}

function toggleToBrowseMode() {
  if (!isEditMode.value) return  // 已经是浏览模式

  // 检查未保存内容
  if (hasUnsavedChanges()) {
    const confirmed = confirm('有未保存的内容，是否保存？')
    if (confirmed) {
      saveAllChanges()
    }
  }

  // 1. 原生 JS 关闭所有内容页的编辑态
  disableEditOnPages()

  isEditMode.value = false
  editingPageId.value = null

  // 2. 解锁翻页
  enablePageFlip()

  console.log('[toggleToBrowseMode] 浏览模式已恢复（原地切换，零重建）')
}

function handlePageDoubleClick(pageId) {
  if (!isEditMode.value) {
    editingPageId.value = pageId
    toggleToEditMode()
  }
}

watch(isEditMode, (newMode) => {
  if (!newMode) {
    editingPageId.value = null
  }
})

const copyToast = ref(false)
const copyToastMessage = ref('')

async function handleShare() {
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
    showCopyToast('已复制链接到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    const textArea = document.createElement('textarea')
    textArea.value = url
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    showCopyToast('已复制链接到剪贴板')
  }
}

async function handleExport() {
  if (!store.currentDiary) return

  let currentPage = null

  if (editingPageId.value) {
    currentPage = store.currentDiary.pages.find(p => p.id === editingPageId.value)
  }

  if (!currentPage) {
    const pageIndex = currentPageIndex.value
    if (pageIndex > 0 && pageIndex <= contentPageCount.value) {
      currentPage = store.currentDiary.pages[pageIndex - 1]
    }
  }

  if (!currentPage) {
    showCopyToast('当前页面无内容可导出')
    return
  }

  const title = store.currentDiary.title
  const content = pageContents.value[String(currentPage.id)] || currentPage.content || '（空白页）'
  const date = formatDateTime(currentPage.updated_at) || '未记录'
  const quote = getRandomQuote()

  const exportText = `《${title}》\n${content}\n${date}\n${quote}`

  try {
    await navigator.clipboard.writeText(exportText)
    showCopyToast('已复制内容到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    const textArea = document.createElement('textarea')
    textArea.value = exportText
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    showCopyToast('已复制内容到剪贴板')
  }
}

function showCopyToast(message) {
  copyToastMessage.value = message
  copyToast.value = true
  setTimeout(() => {
    copyToast.value = false
  }, 3000)
}

// ============================================================
// 导出功能（图片 + 文本菜单）
// ============================================================
const showExportMenu = ref(false)
const isExportingImage = ref(false)

function toggleExportMenu() {
  showExportMenu.value = !showExportMenu.value
}

function closeExportMenu() {
  showExportMenu.value = false
}

// ── 导出为图片（全能导出卡片） ──
//
// 构建"临时导出舞台"：在 onclone 回调中将日记页包裹进一个
// 带氛围渐变背景、物理阴影、环境元数据和品牌签名的容器中。
// 截图完成后舞台自动销毁，不影响用户当前界面。
//
// 视觉层次：
//   [氛围渐变背景]
//     └─ [60px 呼吸间距]
//         └─ [日记页 + 厚度阴影 + 纸张纹理 + 圆角]
//     └─ [左下: 品牌签名]
//     └─ [右下: 氛围图标 + 时间状态]
// ============================================================

function getAmbientMood() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 8) return { icon: '🌅', label: 'Early Morning' }
  if (hour >= 8 && hour < 12) return { icon: '☀️', label: 'Clear' }
  if (hour >= 12 && hour < 14) return { icon: '🌤️', label: 'Midday' }
  if (hour >= 14 && hour < 17) return { icon: '⛅', label: 'Afternoon' }
  if (hour >= 17 && hour < 19) return { icon: '🌇', label: 'Golden Hour' }
  if (hour >= 19 && hour < 22) return { icon: '🌙', label: 'Quiet Night' }
  return { icon: '🌌', label: 'Late Night' }
}

async function handleExportImage() {
  closeExportMenu()

  if (!store.currentDiary || isExportingImage.value) return
  isExportingImage.value = true

  try {
    // ── 0. 等待字体加载完毕 ──
    await document.fonts.ready

    // ── 1. 响应式判断 ──
    const isDesktop = window.innerWidth > 768
    const mood = getAmbientMood()
    const title = store.currentDiary.title || '日记'
    const contentPages = store.currentDiary.pages
    const pageIdx = currentPageIndex.value

    // ── 2. 全量页面数据获取器 ──
    // 从 displayPages 的物理索引精确查找对应的内容页数据
    // displayPages: [0]=封面, [1..N]=内容页, [N+1?]=补齐页, [last]=封底
    // contentPages = store.currentDiary.pages (只有真实内容页)
    function getPageData(physicalIdx) {
      if (physicalIdx < 1 || physicalIdx > contentPages.length) return null
      const page = contentPages[physicalIdx - 1]
      if (!page) return null
      return {
        pageNum: page.page_num,
        // 从内存镜像 pageContents 获取最新内容，确保编辑后的内容也能导出
        content: pageContents.value[String(page.id)] ?? page.content ?? '',
        updatedAt: page.updated_at ? formatDateTime(page.updated_at) : ''
      }
    }

    // ── 3. 确定左右页索引 ──
    // showCover: true 模式下：
    //   封面(index=0)单独展示
    //   后续内容以 (1,2), (3,4), (5,6)... 配对
    //   即：奇数索引=左页，偶数索引=右页
    let leftPage = null
    let rightPage = null

    if (isDesktop) {
      // 桌面双页模式
      let leftIdx, rightIdx
      if (pageIdx === 0) {
        // 在封面上 → 导出第一个内容页（如果有）
        leftIdx = 1
        rightIdx = 2
      } else if (pageIdx % 2 === 1) {
        // 奇数索引 = 左页
        leftIdx = pageIdx
        rightIdx = pageIdx + 1
      } else {
        // 偶数索引 = 右页 → 左页是前一个
        leftIdx = pageIdx - 1
        rightIdx = pageIdx
      }

      leftPage = getPageData(leftIdx)
      rightPage = getPageData(rightIdx)

      // 如果右页超出内容范围（可能是补齐页或封底），只导出左页
      // 如果左页为空（封面），只导出右页
      if (!leftPage && !rightPage) {
        // 都为空 → 降级为单页，尝试当前页
        leftPage = getPageData(pageIdx)
      }
    } else {
      // 移动端单页模式
      leftPage = getPageData(pageIdx)
    }

    if (!leftPage && !rightPage) {
      showCopyToast('当前页面无内容可导出')
      isExportingImage.value = false
      return
    }

    // 判断是否真正需要双页
    const actualDual = isDesktop && leftPage !== null && rightPage !== null

    await exportSingleOrDual(actualDual, leftPage, rightPage, title, mood)

  } catch (err) {
    console.error('[handleExportImage] 截图失败:', err)
    showCopyToast('图片导出失败，请重试')
  } finally {
    isExportingImage.value = false
  }
}

// ============================================================
// getExportThemeColors：从当前主题的 CSS 变量中读取导出专用颜色
//
// 通过 getComputedStyle 读取 <html> 上的 CSS custom properties，
// 确保导出的图片自动适配当前激活的主题（极简素白/午夜书房/羊皮故卷）。
// 零硬编码：所有颜色值都来自 App.vue 中定义的 --export-* 变量。
// ============================================================
function getExportThemeColors() {
  const s = getComputedStyle(document.documentElement)
  const v = (name, fallback) => s.getPropertyValue(name).trim() || fallback
  return {
    gradientStart: v('--export-gradient-start', '#f5f0eb'),
    gradientMid:   v('--export-gradient-mid', '#e8ddd4'),
    gradientEnd:   v('--export-gradient-end', '#d5ccc3'),
    paperBg:       v('--export-paper-bg', '#fffbf5'),
    gridColor:     v('--export-grid-color', 'rgba(105,93,74,0.06)'),
    spineColor:    v('--export-spine-color', 'rgba(105,93,74,0.15)'),
    textColor:     v('--export-text-color', '#1c1b1f'),
    textMuted:     v('--export-text-muted', 'rgba(28,27,31,0.4)'),
    textFaint:     v('--export-text-faint', 'rgba(28,27,31,0.3)'),
    borderColor:   v('--export-border-color', 'rgba(105,93,74,0.15)'),
    metaColor:     v('--export-meta-color', 'rgba(105,93,74,0.35)'),
    shadowColor:   v('--export-shadow-color', 'rgba(0,0,0,0.12)')
  }
}

// ============================================================
// exportSingleOrDual：构建离屏卡片 → 截图 → 下载
//
// 全主题自适应：所有颜色通过 getExportThemeColors() 从 CSS 变量读取。
// isDual: true = 双页并排（桌面端）, false = 单页（移动端）
// ============================================================
async function exportSingleOrDual(isDual, leftPage, rightPage, title, mood) {
  const t = getExportThemeColors()

  const singleW = 480
  const singleH = Math.round(singleW * 4 / 3)

  const cardW = isDual ? singleW * 2 + 2 : singleW
  const cardH = singleH
  const stagePadding = 60
  const stageW = cardW + stagePadding * 2
  const stageH = cardH + stagePadding * 2 + 60

  function buildPageHtml(pageData, side) {
    if (!pageData) {
      return `<div style="
        width: ${singleW}px; height: ${singleH}px;
        background: ${t.paperBg}; position: relative; flex-shrink: 0;
      ">
        <div style="position: absolute; inset: 0; opacity: 0.5;
          background-image:
            linear-gradient(${t.gridColor} 1px, transparent 1px),
            linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px);
          background-size: 24px 24px;
        "></div>
      </div>`
    }

    const spineDir = side === 'left' ? 'to left' : 'to right'
    const spinePos = side === 'left' ? 'right: 0;' : 'left: 0;'

    const safeContent = (pageData.content || '（空白页）')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')

    return `
      <div style="
        width: ${singleW}px; height: ${singleH}px;
        background: ${t.paperBg}; position: relative; overflow: hidden; flex-shrink: 0;
      ">
        <div style="position: absolute; inset: 0; opacity: 0.5;
          background-image:
            linear-gradient(${t.gridColor} 1px, transparent 1px),
            linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px);
          background-size: 24px 24px;
        "></div>
        <div style="position: absolute; top: 0; bottom: 0; width: 24px; pointer-events: none;
          ${spinePos} background: linear-gradient(${spineDir}, ${t.spineColor} 0%, transparent 100%);
        "></div>
        <div style="
          position: relative; z-index: 10;
          padding: 40px 36px 24px 36px;
          height: ${singleH}px; box-sizing: border-box;
          display: flex; flex-direction: column;
        ">
          <div style="font-size: 10px; color: ${t.textMuted}; letter-spacing: 2px; margin-bottom: 20px; flex-shrink: 0;">
            ${title} · 第 ${pageData.pageNum} 页
          </div>
          <div style="
            flex: 1; font-size: 14px; line-height: 1.8;
            color: ${t.textColor}; word-break: break-word; overflow: hidden;
          ">${safeContent}</div>
          <div style="
            display: flex; justify-content: space-between; align-items: center;
            margin-top: 12px; padding-top: 8px; flex-shrink: 0;
            border-top: 1px solid ${t.borderColor};
          ">
            <span style="font-size: 10px; color: ${t.textFaint};">${pageData.pageNum}</span>
            <span style="font-size: 10px; color: ${t.textFaint};">${pageData.updatedAt}</span>
            <span style="font-size: 10px; color: ${t.textFaint};">氛围日记</span>
          </div>
        </div>
      </div>
    `
  }

  const spineLineColor = t.spineColor
  const bookHtml = isDual
    ? `<div style="display: flex; flex-direction: row; width: ${cardW}px; height: ${cardH}px;">
        ${buildPageHtml(leftPage, 'left')}
        <div style="width: 2px; height: ${cardH}px; background: linear-gradient(to bottom, ${spineLineColor}, transparent 50%, ${spineLineColor}); flex-shrink: 0;"></div>
        ${buildPageHtml(rightPage, 'right')}
       </div>`
    : buildPageHtml(leftPage || rightPage, 'left')

  const exportCard = document.createElement('div')
  exportCard.style.cssText = `position: fixed; left: -9999px; top: 0; z-index: -1; pointer-events: none;`
  exportCard.innerHTML = `
    <div style="
      width: ${stageW}px; height: ${stageH}px;
      background: linear-gradient(135deg, ${t.gradientStart} 0%, ${t.gradientMid} 40%, ${t.gradientEnd} 100%);
      padding: ${stagePadding}px;
      display: flex; flex-direction: column; align-items: center;
      position: relative;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    ">
      <div style="position: absolute; inset: 0; opacity: 0.03; pointer-events: none; z-index: 1;
        filter: contrast(120%) brightness(98%);
        background-image: url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E&quot;);
        background-size: 128px 128px;
      "></div>
      <div style="
        position: relative; z-index: 2; border-radius: 4px; overflow: hidden;
        box-shadow: 0 30px 60px ${t.shadowColor}, 0 15px 30px ${t.shadowColor}, 0 4px 8px ${t.shadowColor};
      ">
        ${bookHtml}
      </div>
      <div style="
        position: relative; z-index: 2; width: 100%;
        display: flex; justify-content: space-between; align-items: flex-end;
        margin-top: 28px; padding: 0 8px;
      ">
        <div style="font-size: 11px; letter-spacing: 0.5px; color: ${t.metaColor}; font-weight: 300;">Created by Sheng · 氛围日记</div>
        <div style="font-size: 11px; letter-spacing: 0.3px; color: ${t.metaColor}; font-weight: 300;">${mood.icon} ${mood.label}</div>
      </div>
    </div>
  `

  // ── 挂载 + 强制重绘 ──
  document.body.appendChild(exportCard)
  void exportCard.offsetHeight

  const stageEl = exportCard.firstElementChild
  void stageEl.offsetHeight

  // ── 截图 ──
  const canvas = await html2canvas(stageEl, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: t.gradientStart,
    logging: false,
    width: stageW,
    height: stageH,
    windowWidth: stageW + 100,
    windowHeight: stageH + 100
  })

  // ── 清理 ──
  document.body.removeChild(exportCard)

  // ── 下载 ──
  const pageLabel = isDual
    ? `${leftPage?.pageNum || '?'}-${rightPage?.pageNum || '?'}`
    : `${(leftPage || rightPage)?.pageNum || currentPageIndex.value}`
  const now = new Date()
  const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
  const fileName = `氛围日记_第${pageLabel}页_${timeStr}.jpg`

  const link = document.createElement('a')
  link.download = fileName
  link.href = canvas.toDataURL('image/jpeg', 0.9)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  showCopyToast('图片已保存')
}

// 点击导出文本（复用原有逻辑）
function handleExportText() {
  closeExportMenu()
  handleExport()
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <header class="bg-transparent backdrop-blur-xl sticky top-0 z-50">
      <div class="flex justify-between items-center w-full px-6 py-4 max-w-4xl mx-auto">
        <button @click="goBack" class="flex items-center space-x-2 text-on-surface-variant hover:text-on-surface transition-colors">
          <span class="material-symbols-outlined">arrow_back</span>
          <span class="font-label text-xs hidden md:inline">书架</span>
        </button>
        <div class="font-headline text-lg text-on-surface tracking-tight hidden md:block">
          {{ store.currentDiary?.title || '加载中...' }}
        </div>
        <div class="flex items-center space-x-3">
          <div class="flex items-center bg-surface-container rounded-lg p-1">
            <button
              @click="toggleToBrowseMode"
              :class="[
                'flex items-center space-x-1 px-3 py-1.5 rounded-md font-label text-xs transition-all',
                !isEditMode
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              ]"
            >
              <span class="material-symbols-outlined text-sm">visibility</span>
              <span>浏览</span>
            </button>
            <button
              @click="toggleToEditMode"
              :class="[
                'flex items-center space-x-1 px-3 py-1.5 rounded-md font-label text-xs transition-all',
                isEditMode
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              ]"
            >
              <span class="material-symbols-outlined text-sm">edit</span>
              <span>编辑</span>
            </button>
          </div>

          <button
            @click="addNewPage"
            :disabled="isLoadingNewPage"
            class="hidden md:flex items-center space-x-1 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="material-symbols-outlined" :class="{ 'animate-spin': isLoadingNewPage }">note_add</span>
            <span class="font-label text-xs">{{ isLoadingNewPage ? '添加中...' : '新页' }}</span>
          </button>

          <button
            @click="addNewPage"
            :disabled="isLoadingNewPage"
            class="md:hidden p-2 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="material-symbols-outlined" :class="{ 'animate-spin': isLoadingNewPage }">note_add</span>
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 flex flex-col items-center justify-center py-8 px-4">
      <div v-if="!store.currentDiary" class="text-center">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
        <p class="mt-4 font-label text-sm text-on-surface-variant">正在翻开日记本...</p>
      </div>

      <template v-else>
        <div class="md:hidden w-full max-w-md mb-4 px-4">
          <div class="flex items-center justify-center bg-surface-container rounded-lg py-2">
            <div class="flex-1 h-px bg-on-surface-variant/20"></div>
            <h1 class="font-headline text-base text-on-surface tracking-wide px-4">
              {{ store.currentDiary.title }}
            </h1>
            <div class="flex-1 h-px bg-on-surface-variant/20"></div>
          </div>
        </div>

        <!-- ============================================================
             隐藏源 (Hidden Source)
             Vue 的 v-for 只在这里运行。这个 div 永远 display:none，
             用户看不到它，StPageFlip 也不会碰它。
             Vue 的 patch 算法可以安全地在此增删节点。
             ============================================================ -->
        <div v-show="false" ref="sourceContainer">
          <div
            v-for="(page, index) in displayPages"
            :key="page.id"
            class="diary-page"
            :data-density="(page.isCover || page.isBackCover) ? 'hard' : 'soft'"
            :data-page-id="page.id"
          >
            <!-- 封面 -->
            <div
              v-if="page.isCover"
              :class="[
                coverStyles[store.currentDiary.cover_style]?.class || 'leather-texture',
                'w-full h-full flex flex-col items-center justify-center relative overflow-hidden rounded-sm'
              ]"
            >
              <div class="absolute inset-0 book-spine-shadow pointer-events-none"></div>
              <div
                :class="[
                  'font-headline text-2xl tracking-widest mb-4 relative z-10',
                  coverStyles[store.currentDiary.cover_style]?.textClass || 'text-on-primary'
                ]"
              >
                {{ store.currentDiary.title }}
              </div>
              <div
                :class="[
                  'font-label text-xs relative z-10',
                  coverStyles[store.currentDiary.cover_style]?.textClass || 'text-on-primary'
                ]"
                style="opacity: 0.6"
              >
                {{ store.currentDiary.created_at?.substring(0, 10) }}
              </div>
              <div class="absolute bottom-8 flex items-center space-x-2 opacity-40 z-10">
                <span
                  :class="[
                    'material-symbols-outlined text-sm',
                    coverStyles[store.currentDiary.cover_style]?.textClass || 'text-on-primary'
                  ]"
                >
                  auto_stories
                </span>
              </div>
            </div>

            <!-- 空白补齐页（偶数页闭合用） -->
            <div
              v-else-if="page.isBlankPad"
              class="w-full h-full bg-surface relative overflow-hidden"
            >
              <div class="absolute inset-0 grid-paper opacity-50"></div>
              <div class="absolute inset-0 linen-texture opacity-10"></div>
            </div>

            <!-- 封底 -->
            <div
              v-else-if="page.isBackCover"
              :class="[
                coverStyles[store.currentDiary.cover_style]?.class || 'leather-texture',
                'w-full h-full flex flex-col items-center justify-center relative overflow-hidden rounded-sm'
              ]"
            >
              <div class="absolute inset-0 book-spine-shadow pointer-events-none"></div>

              <div class="relative z-10 flex flex-col items-center justify-center">
                <span
                  :class="[
                    'material-symbols-outlined text-4xl mb-4',
                    coverStyles[store.currentDiary.cover_style]?.textClass || 'text-on-primary'
                  ]"
                  style="opacity: 0.4"
                >
                  auto_stories
                </span>
                <div
                  :class="[
                    'font-label text-xs tracking-widest',
                    coverStyles[store.currentDiary.cover_style]?.textClass || 'text-on-primary'
                  ]"
                  style="opacity: 0.5"
                >
                  氛围日记
                </div>
                <div
                  :class="[
                    'font-label text-[10px] mt-2',
                    coverStyles[store.currentDiary.cover_style]?.textClass || 'text-on-primary'
                  ]"
                  style="opacity: 0.3"
                >
                  {{ store.currentDiary.created_at?.substring(0, 10) }}
                </div>
              </div>

              <div class="absolute bottom-8 flex items-center space-x-2 opacity-30 z-10">
                <span
                  :class="[
                    'material-symbols-outlined text-sm',
                    coverStyles[store.currentDiary.cover_style]?.textClass || 'text-on-primary'
                  ]"
                >
                  bookmark
                </span>
              </div>
            </div>

            <!-- 内容页 -->
            <div
              v-else
              class="w-full h-full bg-surface relative overflow-hidden"
              :data-content-page-id="page.id"
            >
              <div class="absolute inset-0 grid-paper opacity-50"></div>
              <div class="absolute inset-0 linen-texture opacity-10"></div>
              <div class="absolute left-0 top-0 bottom-0 w-6 book-spine-overlay pointer-events-none" v-if="index % 2 === 0"></div>
              <div class="absolute right-0 top-0 bottom-0 w-6 book-spine-overlay-right pointer-events-none" v-else></div>
              <div class="relative z-10 p-8 h-full flex flex-col">
                <div class="font-label text-[10px] text-on-surface-variant mb-4 tracking-widest">
                  {{ store.currentDiary.title }} · 第 {{ page.page_num }} 页
                </div>

                <!-- 统一结构：编辑/浏览的差异由 cloneSourceToFlipSync 在克隆时物理注入 -->
                <!-- 隐藏源永远只渲染浏览态骨架，避免 isEditMode 变化触发 Vue patch 破坏 flipContainer -->
                <div
                  class="page-text-area flex-1 font-body text-on-surface text-sm leading-relaxed whitespace-pre-wrap break-words overflow-y-auto"
                >{{ page.content || '（空白页）' }}</div>

                <div class="flex items-center justify-between mt-4 pt-2 border-t border-outline/30">
                  <span class="font-label text-[10px] text-on-surface-variant/50">{{ page.page_num }}</span>

                  <span
                    v-if="page.updated_at"
                    class="font-label text-[10px] text-on-surface-variant/50"
                  >
                    {{ formatDateTime(page.updated_at) }}
                  </span>

                  <span class="font-label text-[10px] text-on-surface-variant/50">氛围日记</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================
             物理展示区 (Display Container)
             这里初始为空。initPageFlip() 时通过 cloneSourceToFlip()
             从隐藏源克隆静态 DOM 副本到此处，然后交给 StPageFlip。
             Vue 永远不会对这个 div 内部做 patch 操作。
             ============================================================ -->
        <div class="page-flip-container w-full flex justify-center">
          <div ref="flipContainer" class="mx-auto"></div>
        </div>
      </template>
    </main>

    <div class="py-3 flex items-center justify-center space-x-4 border-t border-outline/20">
      <button
        @click="handleShare"
        class="flex items-center space-x-1 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface"
      >
        <span class="material-symbols-outlined text-sm">share</span>
        <span class="font-label text-xs">分享</span>
      </button>

      <!-- 导出下拉菜单 -->
      <div class="relative">
        <button
          @click="toggleExportMenu"
          :disabled="isExportingImage"
          class="flex items-center space-x-1 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span
            class="material-symbols-outlined text-sm"
            :class="{ 'animate-spin': isExportingImage }"
          >{{ isExportingImage ? 'refresh' : 'download' }}</span>
          <span class="font-label text-xs">{{ isExportingImage ? '生成中...' : '导出' }}</span>
          <span class="material-symbols-outlined text-xs" v-if="!isExportingImage">expand_more</span>
        </button>

        <!-- 弹出菜单 -->
        <Transition name="menu-fade">
          <div
            v-if="showExportMenu"
            class="export-menu absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 bg-surface-container-high rounded-xl shadow-lg overflow-hidden z-50"
          >
            <button
              @click="handleExportImage"
              class="w-full flex items-center space-x-2 px-4 py-2.5 text-on-surface hover:bg-surface-container transition-colors"
            >
              <span class="material-symbols-outlined text-sm">image</span>
              <span class="font-label text-xs">导出图片</span>
            </button>
            <div class="h-px bg-outline/20 mx-2"></div>
            <button
              @click="handleExportText"
              class="w-full flex items-center space-x-2 px-4 py-2.5 text-on-surface hover:bg-surface-container transition-colors"
            >
              <span class="material-symbols-outlined text-sm">content_copy</span>
              <span class="font-label text-xs">导出文本</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 点击外部关闭菜单的透明遮罩 -->
    <div
      v-if="showExportMenu"
      class="fixed inset-0 z-40"
      @click="closeExportMenu"
    ></div>

    <footer class="py-4 flex items-center justify-center space-x-8">
      <button
        @click="flipPrev"
        class="p-3 rounded-full hover:bg-surface-container/50 transition-all text-on-surface-variant hover:text-on-surface"
      >
        <span class="material-symbols-outlined">chevron_left</span>
      </button>
      <span class="font-label text-xs text-on-surface-variant">
        {{ pageNavText }}
      </span>
      <button
        @click="flipNext"
        class="p-3 rounded-full hover:bg-surface-container/50 transition-all text-on-surface-variant hover:text-on-surface"
      >
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    </footer>

    <Transition name="toast">
      <div
        v-if="showSaveToast"
        class="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div class="bg-surface-container-high px-6 py-3 rounded-full shadow-lg flex items-center space-x-2">
          <span
            v-if="saveStatus === 'saving'"
            class="material-symbols-outlined text-primary animate-spin text-sm"
          >
            refresh
          </span>
          <span
            v-else-if="saveStatus === 'saved'"
            class="material-symbols-outlined text-primary text-sm"
          >
            check_circle
          </span>
          <span class="font-label text-xs text-on-surface">
            {{ saveStatus === 'saving' ? '自动保存中...' : '已保存' }}
          </span>
        </div>
      </div>
    </Transition>

    <Transition name="toast">
      <div
        v-if="copyToast"
        class="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div class="bg-surface-container-high px-6 py-3 rounded-full shadow-lg flex items-center space-x-2">
          <span class="material-symbols-outlined text-primary text-sm">check_circle</span>
          <span class="font-label text-xs text-on-surface">{{ copyToastMessage }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.book-spine-shadow {
  background: linear-gradient(
    to right,
    rgba(105, 93, 74, 0.25) 0%,
    rgba(105, 93, 74, 0.15) 8%,
    rgba(105, 93, 74, 0.05) 15%,
    transparent 25%,
    transparent 75%,
    rgba(105, 93, 74, 0.05) 85%,
    rgba(105, 93, 74, 0.15) 92%,
    rgba(105, 93, 74, 0.25) 100%
  );
}

.page-shadow-left-enhanced {
  box-shadow:
    inset -30px 0 40px -15px rgba(105, 93, 74, 0.18),
    inset -8px 0 15px -5px rgba(105, 93, 74, 0.12);
}

.page-shadow-right-enhanced {
  box-shadow:
    inset 30px 0 40px -15px rgba(105, 93, 74, 0.18),
    inset 8px 0 15px -5px rgba(105, 93, 74, 0.12);
}

.book-spine-overlay {
  background: linear-gradient(
    to right,
    rgba(105, 93, 74, 0.12) 0%,
    rgba(105, 93, 74, 0.06) 40%,
    transparent 100%
  );
}

.book-spine-overlay-right {
  background: linear-gradient(
    to left,
    rgba(105, 93, 74, 0.12) 0%,
    rgba(105, 93, 74, 0.06) 40%,
    transparent 100%
  );
}

.page-flip-container :deep(.stf__item) {
  box-shadow: 0 25px 50px -12px rgba(105, 93, 74, 0.25);
}

.page-flip-container :deep(.stf__block) {
  box-shadow:
    0 0 30px rgba(105, 93, 74, 0.1),
    0 15px 35px -10px rgba(105, 93, 74, 0.2);
}

.editing-page {
  border: 2px solid var(--color-primary);
  box-shadow: 0 0 20px rgba(105, 93, 74, 0.3);
  background: rgba(105, 93, 74, 0.02);
}

/* 编辑模式下 .page-text-area 的可编辑视觉样式 —— 仅改变外观，绝不改变 display/position */
.page-flip-container :deep(.editing-active) {
  outline: none;
  cursor: text;
  min-height: 60%;
  border-radius: 4px;
  background: rgba(105, 93, 74, 0.02);
}

.page-flip-container :deep(.editing-active):focus {
  box-shadow: inset 0 0 0 2px var(--color-primary, #6750A4);
  background: rgba(105, 93, 74, 0.04);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}

/* 导出菜单弹出动画 */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.15s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 4px) scale(0.95);
}

.menu-fade-enter-to,
.menu-fade-leave-from {
  transform: translate(-50%, 0) scale(1);
}

.export-menu {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 1px 4px rgba(0, 0, 0, 0.08);
}
</style>
