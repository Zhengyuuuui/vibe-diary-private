import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getSettings, updateSettings, getAISettings, updateAISettings } from '@/api'

export const useSettingsStore = defineStore('settings', () => {
  const fontSize = ref(16)
  const lineHeight = ref('medium')
  const theme = ref('light')

  // 新增：AI 设置状态
  const aiSettings = ref({
    ai_enabled: 0,
    ai_reflection_enabled: 0,
    ai_weekly_review_enabled: 0,
    ai_emotion_trend_enabled: 0
  })

  const lineHeightMap = {
    compact: '1.4',
    medium: '1.6',
    relaxed: '1.8'
  }
  
  async function loadSettings() {
    try {
      const data = await getSettings()
      fontSize.value = data.font_size
      lineHeight.value = data.line_height
      theme.value = data.theme
      applySettings()
    } catch (error) {
      console.error('加载设置失败:', error)
      restoreFromLocal()
    }
  }

  // 新增：加载 AI 设置
  async function loadAISettings() {
    try {
      const data = await getAISettings()
      aiSettings.value = {
        ai_enabled: data.ai_enabled || 0,
        ai_reflection_enabled: data.ai_reflection_enabled || 0,
        ai_weekly_review_enabled: data.ai_weekly_review_enabled || 0,
        ai_emotion_trend_enabled: data.ai_emotion_trend_enabled || 0
      }
    } catch (error) {
      console.error('加载 AI 设置失败:', error)
    }
  }
  
  async function saveSettings(newSettings) {
    try {
      await updateSettings(newSettings)
      if (newSettings.font_size) fontSize.value = newSettings.font_size
      if (newSettings.line_height) lineHeight.value = newSettings.line_height
      if (newSettings.theme) theme.value = newSettings.theme
      applySettings()
      return true
    } catch (error) {
      console.error('保存设置失败:', error)
      return false
    }
  }

  // 新增：保存 AI 设置
  async function saveAISettings(newAISettings) {
    try {
      await updateAISettings(newAISettings)
      aiSettings.value = { ...aiSettings.value, ...newAISettings }
      return true
    } catch (error) {
      console.error('保存 AI 设置失败:', error)
      return false
    }
  }

  // 新增：切换 AI 功能总开关
  async function toggleAIEnabled() {
    const newValue = aiSettings.value.ai_enabled === 1 ? 0 : 1
    await saveAISettings({ ai_enabled: newValue })

    // 如果关闭总开关，同时关闭所有子开关
    if (newValue === 0) {
      await saveAISettings({
        ai_reflection_enabled: 0,
        ai_weekly_review_enabled: 0,
        ai_emotion_trend_enabled: 0
      })
    }
  }

  // 新增：切换 AI Reflection 开关
  async function toggleAIReflection() {
    const newValue = aiSettings.value.ai_reflection_enabled === 1 ? 0 : 1
    await saveAISettings({ ai_reflection_enabled: newValue })
  }

  // 新增：切换 AI Weekly Review 开关
  async function toggleAIWeeklyReview() {
    const newValue = aiSettings.value.ai_weekly_review_enabled === 1 ? 0 : 1
    await saveAISettings({ ai_weekly_review_enabled: newValue })
  }

  // 新增：切换 AI 情绪趋势开关
  async function toggleAIEmotionTrend() {
    const newValue = aiSettings.value.ai_emotion_trend_enabled === 1 ? 0 : 1
    await saveAISettings({ ai_emotion_trend_enabled: newValue })
  }
  
  function applySettings() {
    const root = document.documentElement
    
    root.style.setProperty('--font-size-base', `${fontSize.value}px`)
    root.style.setProperty('--line-height-base', lineHeightMap[lineHeight.value])
    root.setAttribute('data-theme', theme.value)
    
    localStorage.setItem('settings', JSON.stringify({
      fontSize: fontSize.value,
      lineHeight: lineHeight.value,
      theme: theme.value
    }))
  }
  
  function restoreFromLocal() {
    const cached = localStorage.getItem('settings')
    if (cached) {
      try {
        const data = JSON.parse(cached)
        fontSize.value = data.fontSize || 16
        lineHeight.value = data.lineHeight || 'medium'
        theme.value = data.theme || 'light'
        applySettings()
      } catch (e) {
        console.error('Failed to parse cached settings:', e)
      }
    }
  }
  
  return {
    fontSize,
    lineHeight,
    theme,
    aiSettings,
    lineHeightMap,
    loadSettings,
    loadAISettings,
    saveSettings,
    saveAISettings,
    toggleAIEnabled,
    toggleAIReflection,
    toggleAIWeeklyReview,
    toggleAIEmotionTrend,
    applySettings,
    restoreFromLocal
  }
})
