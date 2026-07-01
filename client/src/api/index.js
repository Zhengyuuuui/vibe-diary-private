const BASE = '/api/v1'

function getToken() {
  return localStorage.getItem('token')
}

export async function request(url, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const res = await fetch(`${BASE}${url}`, {
    headers,
    ...options
  })
  const json = await res.json()
  if (json.code !== 200 && json.code !== 201) {
    throw new Error(json.msg || '请求失败')
  }
  return json.data
}

export function fetchDiaries(page = 1, limit = 20) {
  return request(`/diaries?page=${page}&limit=${limit}`)
}

export function fetchDiary(id) {
  return request(`/diaries/${id}`)
}

export function createDiary(data) {
  return request('/diaries', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export function updateDiary(id, data) {
  return request(`/diaries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export function deleteDiary(id) {
  return request(`/diaries/${id}`, {
    method: 'DELETE'
  })
}

export function savePage(pageId, content) {
  return request(`/pages/${pageId}`, {
    method: 'PUT',
    body: JSON.stringify({ content })
  })
}

export function addPage(diaryId, content = '') {
  return request(`/pages/${diaryId}`, {
    method: 'POST',
    body: JSON.stringify({ content })
  })
}

export function login(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
}

export function register(username, password) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
}

export function verifyToken() {
  return request('/auth/verify')
}

export function getProfile() {
  return request('/auth/profile')
}

export function updateProfile(data) {
  return request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export function uploadAvatar(formData) {
  const token = getToken()
  return fetch(`${BASE}/auth/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  }).then(res => res.json())
    .then(json => {
      if (json.code !== 200) throw new Error(json.msg)
      return json.data
    })
}

export function getSettings() {
  return request('/auth/settings')
}

export function updateSettings(data) {
  return request('/auth/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export function getStats() {
  return request('/diaries/stats')
}

export function getRandomFragment() {
  return request('/diaries/random-fragment')
}

export function getOnThisDay() {
  return request('/diaries/on-this-day')
}

export function getFavorites(params = {}) {
  const query = new URLSearchParams(params).toString()
  return request(`/favorites?${query}`)
}

export function getFavorite(id) {
  return request(`/favorites/${id}`)
}

export function createFavorite(data) {
  return request('/favorites', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export function updateFavorite(id, data) {
  return request(`/favorites/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export function deleteFavorite(id) {
  return request(`/favorites/${id}`, {
    method: 'DELETE'
  })
}

export function getRandomInspiration(count = 3) {
  return request(`/favorites/random/inspiration?count=${count}`)
}

export function getFavoriteStats() {
  return request('/favorites/stats/overview')
}

export function searchFavorites(query) {
  return request(`/favorites/search/query?q=${encodeURIComponent(query)}`)
}

export function uploadFavoriteImage(formData) {
  const token = getToken()
  return fetch(`${BASE}/favorites/upload-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  }).then(res => res.json())
    .then(json => {
      if (json.code !== 200) throw new Error(json.msg)
      return json.data
    })
}

// 新增：获取 AI 设置状态
export function getAISettings() {
  return request('/settings/ai')
}

// 新增：更新 AI 设置状态
export function updateAISettings(data) {
  return request('/settings/ai', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

// 新增：获取 AI API Key 状态（后端不返回实际 Key，只返回是否已配置）
export function getAPIKey() {
  return request('/settings/ai-api-key')
}

// 新增：更新 AI API Key
export function updateAPIKey(data) {
  return request('/settings/ai-api-key', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

// 新增：获取 AI Reflection 数据
export function getAIReflection() {
  return request('/ai/reflection', {
    method: 'POST'
  })
}

// ==================== 时光信箱 API ====================

// 获取信件列表（支持状态过滤、分页）
export function getLetters(params = {}) {
  const query = new URLSearchParams({
    page: params.page || 1,
    limit: params.limit || 20,
    ...(params.status && { status: params.status })
  })
  return request(`/letters?${query}`)
}

// 获取信件详情
export function getLetter(id) {
  return request(`/letters/${id}`)
}

// 创建信件
export function createLetter(data) {
  return request('/letters', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// 更新信件（仅未到期）
export function updateLetter(id, data) {
  return request(`/letters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

// 删除信件
export function deleteLetter(id) {
  return request(`/letters/${id}`, {
    method: 'DELETE'
  })
}

// 获取信件统计概览
export function getLetterStats() {
  return request('/letters/stats/overview')
}

// 拆信（仅到期信件）
export function openLetter(id) {
  return request(`/letters/${id}/open`, {
    method: 'POST'
  })
}
