import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getSettings, updateSettings } from '@/api'

export const useSettingsStore = defineStore('settings', () => {
  const fontSize = ref(16)
  const lineHeight = ref('medium')
  const theme = ref('light')
  
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
    lineHeightMap,
    loadSettings,
    saveSettings,
    applySettings,
    restoreFromLocal
  }
})
