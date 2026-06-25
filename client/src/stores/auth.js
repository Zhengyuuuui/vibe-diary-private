import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, register as registerApi, verifyToken, getProfile } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)
  
  const isLoggedIn = computed(() => !!token.value)
  
  async function login(username, password) {
    const data = await loginApi(username, password)
    token.value = data.token
    user.value = { id: data.id, username: data.username }
    localStorage.setItem('token', data.token)
    return data
  }
  
  async function register(username, password) {
    const data = await registerApi(username, password)
    token.value = data.token
    user.value = { id: data.id, username: data.username }
    localStorage.setItem('token', data.token)
    return data
  }
  
  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }
  
  async function checkAuth() {
    if (!token.value) return false
    try {
      const data = await verifyToken()
      user.value = { id: data.id, username: data.username }
      return true
    } catch {
      logout()
      return false
    }
  }
  
  async function loadProfile() {
    if (!token.value) return null
    try {
      const data = await getProfile()
      if (user.value) {
        user.value.pen_name = data.pen_name
        user.value.bio = data.bio
        user.value.avatar = data.avatar
      }
      return data
    } catch {
      return null
    }
  }
  
  return {
    token,
    user,
    isLoggedIn,
    login,
    register,
    logout,
    checkAuth,
    loadProfile
  }
})
