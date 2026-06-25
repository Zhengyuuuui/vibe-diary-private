import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

export function useTheme() {
  const settingsStore = useSettingsStore()
  
  const themeColors = {
    light: {
      background: '#FAF9F6',
      surface: '#FFFFFF',
      primary: '#695d4a',
      text: '#3d3830',
      textVariant: '#6b6357'
    },
    dark: {
      background: '#1a1a1a',
      surface: '#2d2d2d',
      primary: '#a09080',
      text: '#e8e4df',
      textVariant: '#b0a8a0'
    },
    sepia: {
      background: '#f2e0c8',
      surface: '#faf3e8',
      primary: '#695d4a',
      text: '#4a3f30',
      textVariant: '#7a6a58'
    }
  }
  
  const currentTheme = computed(() => themeColors[settingsStore.theme])
  
  function applyTheme(themeName) {
    const colors = themeColors[themeName]
    const root = document.documentElement
    
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
  }
  
  return {
    currentTheme,
    themeColors,
    applyTheme
  }
}
