import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getLetters,
  getLetter,
  createLetter,
  updateLetter,
  deleteLetter,
  getLetterStats,
  openLetter
} from '@/api'

export const useLettersStore = defineStore('letters', () => {
  const letters = ref([])
  const currentLetter = ref(null)
  const stats = ref(null)
  const loading = ref(false)

  const filter = ref({
    status: null // null(全部) | pending(待拆) | deliverable(可拆) | opened(已拆)
  })

  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0
  })

  // 可拆信件数（红点提示用）
  const deliverableCount = computed(() => {
    return stats.value?.deliverable || 0
  })

  async function loadLetters(params = {}) {
    loading.value = true
    try {
      const data = await getLetters({
        page: params.page || pagination.value.page,
        limit: params.limit || pagination.value.limit,
        status: params.status !== undefined ? params.status : filter.value.status
      })
      letters.value = data.list
      pagination.value.total = data.total
      pagination.value.page = data.page
    } finally {
      loading.value = false
    }
  }

  async function loadLetter(id) {
    loading.value = true
    try {
      currentLetter.value = await getLetter(id)
    } finally {
      loading.value = false
    }
  }

  async function addLetter(data) {
    const result = await createLetter(data)
    await loadLetters()
    await loadStats()
    return result
  }

  async function editLetter(id, data) {
    await updateLetter(id, data)
    await loadLetters()
  }

  async function removeLetter(id) {
    await deleteLetter(id)
    letters.value = letters.value.filter(l => l.id !== id)
    await loadStats()
  }

  async function loadStats() {
    try {
      stats.value = await getLetterStats()
    } catch (error) {
      console.error('加载信件统计失败:', error)
    }
  }

  async function openLetterById(id) {
    const result = await openLetter(id)
    // 更新列表中对应信件状态
    const index = letters.value.findIndex(l => l.id === id)
    if (index !== -1) {
      letters.value[index] = result
    }
    currentLetter.value = result
    await loadStats()
    return result
  }

  function setFilter(status) {
    filter.value.status = status
    pagination.value.page = 1
    loadLetters()
  }

  return {
    letters,
    currentLetter,
    stats,
    loading,
    filter,
    pagination,
    deliverableCount,
    loadLetters,
    loadLetter,
    addLetter,
    editLetter,
    removeLetter,
    loadStats,
    openLetterById,
    setFilter
  }
})
