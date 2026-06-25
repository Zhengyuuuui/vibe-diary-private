import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { request } from '@/api'

export const useFavoritesStore = defineStore('favorites', () => {
  const favorites = ref([])
  const currentFavorite = ref(null)
  const stats = ref(null)
  const loading = ref(false)
  
  const filters = ref({
    type: null,
    mood: null,
    search: ''
  })
  
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0
  })
  
  const filteredFavorites = computed(() => {
    let result = favorites.value
    
    if (filters.value.type) {
      result = result.filter(f => f.type === filters.value.type)
    }
    
    if (filters.value.mood) {
      result = result.filter(f => f.mood === filters.value.mood)
    }
    
    if (filters.value.search) {
      const query = filters.value.search.toLowerCase()
      result = result.filter(f => 
        f.title?.toLowerCase().includes(query) ||
        f.content?.toLowerCase().includes(query) ||
        f.source?.toLowerCase().includes(query)
      )
    }
    
    return result
  })
  
  async function loadFavorites(params = {}) {
    loading.value = true
    try {
      const query = new URLSearchParams({
        page: params.page || pagination.value.page,
        limit: params.limit || pagination.value.limit,
        ...(filters.value.type && { type: filters.value.type }),
        ...(filters.value.mood && { mood: filters.value.mood }),
        ...(filters.value.search && { search: filters.value.search })
      })
      
      const data = await request(`/favorites?${query}`)
      favorites.value = data.list
      pagination.value.total = data.total
      pagination.value.page = data.page
    } finally {
      loading.value = false
    }
  }
  
  async function loadFavorite(id) {
    loading.value = true
    try {
      currentFavorite.value = await request(`/favorites/${id}`)
    } finally {
      loading.value = false
    }
  }
  
  async function addFavorite(data) {
    const result = await request('/favorites', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    await loadFavorites()
    return result
  }
  
  async function updateFavorite(id, data) {
    await request(`/favorites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
    await loadFavorites()
  }
  
  async function removeFavorite(id) {
    await request(`/favorites/${id}`, {
      method: 'DELETE'
    })
    favorites.value = favorites.value.filter(f => f.id !== id)
  }
  
  async function loadStats() {
    stats.value = await request('/favorites/stats/overview')
  }
  
  async function getRandomInspiration(count = 3) {
    return await request(`/favorites/random/inspiration?count=${count}`)
  }
  
  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1
    loadFavorites()
  }
  
  function resetFilters() {
    filters.value = {
      type: null,
      mood: null,
      search: ''
    }
    pagination.value.page = 1
    loadFavorites()
  }
  
  return {
    favorites,
    currentFavorite,
    stats,
    loading,
    filters,
    pagination,
    filteredFavorites,
    loadFavorites,
    loadFavorite,
    addFavorite,
    updateFavorite,
    removeFavorite,
    loadStats,
    getRandomInspiration,
    setFilters,
    resetFilters
  }
})
