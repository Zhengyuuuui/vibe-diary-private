import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchDiaries, fetchDiary, createDiary, updateDiary, deleteDiary } from '@/api'

export const useDiaryStore = defineStore('diary', () => {
  const diaries = ref([])
  const currentDiary = ref(null)
  const loading = ref(false)

  async function loadDiaries() {
    loading.value = true
    try {
      const data = await fetchDiaries()
      diaries.value = data.list
    } finally {
      loading.value = false
    }
  }

  async function loadDiary(id) {
    loading.value = true
    try {
      currentDiary.value = await fetchDiary(id)
    } finally {
      loading.value = false
    }
  }

  async function addDiary(data) {
    const result = await createDiary(data)
    await loadDiaries()
    return result
  }

  async function editDiary(id, data) {
    await updateDiary(id, data)
    if (currentDiary.value && currentDiary.value.id === id) {
      await loadDiary(id)
    }
  }

  async function removeDiary(id) {
    await deleteDiary(id)
    diaries.value = diaries.value.filter(d => d.id !== id)
  }

  return {
    diaries,
    currentDiary,
    loading,
    loadDiaries,
    loadDiary,
    addDiary,
    editDiary,
    removeDiary
  }
})
