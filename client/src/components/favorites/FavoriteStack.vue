<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import FavoriteCard from './FavoriteCard.vue'

const props = defineProps({
  group: {
    type: Object,
    required: true,
    // group 结构: { size: 'narrow'|'standard'|'wide', items: [], currentIndex: 0, count: number }
  }
})

const emit = defineEmits(['click-card'])

// 类型图标映射
const typeIconMap = {
  quote: 'star',           // 引用：收藏星星
  image: 'image',          // 图片：图片图标
  vertical: 'auto_stories', // 竖排：书籍竖排
  featured: 'lightbulb',   // 精选：灵感灯泡
  minimal: 'article'       // 简约：文章简约
}

// 当前显示的卡片索引
const currentIndex = ref(0)
// 是否展开状态
const isExpanded = ref(false)
// 长按计时器
let longPressTimer = null

// 当前卡片
const currentCard = computed(() => {
  return props.group.items[currentIndex.value] || null
})

// 类型图标（从第一张卡片获取 type）
const typeIcon = computed(() => {
  const firstCard = props.group.items[0]
  if (!firstCard) return 'star' // 默认图标
  return typeIconMap[firstCard.type] || 'star'
})

// 底层卡片（露出的一角）
const bottomCard = computed(() => {
  // 如果只剩 1 张，没有底层卡片
  if (props.group.count <= 1) return null
  // 底层卡片是下一张（循环）
  const nextIndex = (currentIndex.value + 1) % props.group.items.length
  return props.group.items[nextIndex]
})

// 点击切换下一张卡片
function handleTap() {
  if (isExpanded.value) {
    // 展开状态：不处理点击切换
    return
  }
  // 循环切换
  currentIndex.value = (currentIndex.value + 1) % props.group.items.length
}

// 长按展开
function handleLongPressStart() {
  // 500ms 后展开
  longPressTimer = setTimeout(() => {
    isExpanded.value = true
  }, 500)
}

// 取消长按
function handleLongPressEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

// 点击展开状态中的卡片
function handleClickCardFromExpanded(favorite) {
  emit('click-card', favorite)
}

// 折叠整摞
function collapseStack() {
  isExpanded.value = false
  currentIndex.value = 0
}

// 清理计时器
onBeforeUnmount(() => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
})
</script>

<template>
  <!-- 单张卡片：不折叠，直接渲染 -->
  <div v-if="group.count === 1">
    <FavoriteCard :favorite="currentCard" @click="emit('click-card', currentCard)" />
  </div>

  <!-- 多张卡片：折叠摞 -->
  <div v-else class="favorite-stack">
    <!-- 折叠状态 -->
    <div
      v-if="!isExpanded"
      class="stack-collapsed relative"
      @click="handleTap"
      @touchstart="handleLongPressStart"
      @touchend="handleLongPressEnd"
      @mousedown="handleLongPressStart"
      @mouseup="handleLongPressEnd"
      @mouseleave="handleLongPressEnd"
    >
      <!-- 底层卡片：向右下偏移，露出右下角 -->
      <div class="bottom-card absolute z-1 pointer-events-none">
        <FavoriteCard :favorite="bottomCard" />
      </div>

      <!-- 顶层卡片：当前显示 -->
      <div class="current-card z-3 relative">
        <FavoriteCard :favorite="currentCard" />

        <!-- 数量徽章（左上角，保有间距，主题色） -->
        <div class="absolute top-2 left-2 bg-primary text-on-primary rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold shadow-lg z-20">
          {{ group.count }}
        </div>

        <!-- 长按提示（底部） -->
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-on-surface-variant text-xs font-label opacity-50 whitespace-nowrap">
          长按展开 · 点击切换
        </div>
      </div>
    </div>

    <!-- 展开状态：垂直排列所有卡片 -->
    <div v-else class="stack-expanded space-y-4">
      <!-- 折叠按钮 -->
      <button
        @click="collapseStack"
        class="mb-4 flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-label hover:bg-surface-container-highest transition-colors"
      >
        <span class="material-symbols-outlined text-sm">unfold_less</span>
        折叠
      </button>

      <!-- 所有卡片垂直排列 -->
      <div v-for="(item, index) in group.items" :key="item.id">
        <FavoriteCard :favorite="item" @click="handleClickCardFromExpanded" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.favorite-stack {
  position: relative;
}

.stack-collapsed {
  /* 折叠摞的容器 */
  position: relative;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.stack-collapsed:hover {
  transform: translateY(-2px);
}

.current-card {
  /* 顶层卡片：不显示阴影，hover 时上浮 */
  position: relative;
  z-index: 3;
  box-shadow: none; /* 不显示自己的阴影 */
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease;
}

.current-card:hover {
  /* 悬停时上浮 8px，阴影加深（增强立体感） */
  transform: translateY(-8px);
  box-shadow: 0 8px 20px rgba(105, 93, 74, 0.2); /* hover 时显示阴影 */
}

.bottom-card {
  /* 底层卡片：向右下偏移，露出右下角，阴影增强层叠感 */
  position: absolute;
  top: 6px;   /* 向下偏移 6px */
  left: 6px;  /* 向右偏移 6px */
  z-index: 1;
  opacity: 0.6;
  pointer-events: none;
  filter: brightness(0.95);
  overflow: hidden;
  max-height: 60px;
  box-shadow: 4px 2px 12px rgba(105, 93, 74, 0.25); /* 右下方阴影 */
}

.stack-expanded {
  /* 展开状态 */
  animation: expandIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes expandIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>