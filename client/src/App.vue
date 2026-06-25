<template>
  <div :style="globalStyle">
    <router-view />
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'

const settingsStore = useSettingsStore()
const authStore = useAuthStore()

const globalStyle = computed(() => ({
  '--font-size-base': `${settingsStore.fontSize}px`,
  '--line-height-base': settingsStore.lineHeightMap[settingsStore.lineHeight]
}))

watch(() => settingsStore.theme, (newTheme) => {
  applyTheme(newTheme)
})

watch(() => settingsStore.fontSize, (newSize) => {
  document.documentElement.style.setProperty('--font-size-base', `${newSize}px`)
})

watch(() => settingsStore.lineHeight, (newHeight) => {
  document.documentElement.style.setProperty('--line-height-base', settingsStore.lineHeightMap[newHeight])
})

function applyTheme(theme) {
  const html = document.documentElement
  html.classList.remove('theme-light', 'theme-dark', 'theme-sepia')
  html.classList.add(`theme-${theme}`)
  html.setAttribute('data-theme', theme)
}

onMounted(async () => {
  settingsStore.restoreFromLocal()
  applyTheme(settingsStore.theme)
  
  if (authStore.isLoggedIn) {
    try {
      await authStore.checkAuth()
      await authStore.loadProfile()
      await settingsStore.loadSettings()
      applyTheme(settingsStore.theme)
    } catch (error) {
      console.log('Failed to load user data from server, using local cache')
    }
  }
})
</script>

<style>
:root {
  --font-size-base: 16px;
  --line-height-base: 1.6;
  --bg-primary: #FAF9F6;
  --bg-surface: #FFFFFF;
  --color-primary: #695d4a;
  --text-primary: #3d3830;
  --text-variant: #5c605c;
  /* 导出专用变量 */
  --export-gradient-start: #f5f0eb;
  --export-gradient-mid: #e8ddd4;
  --export-gradient-end: #d5ccc3;
  --export-paper-bg: #fffbf5;
  --export-grid-color: rgba(105, 93, 74, 0.06);
  --export-spine-color: rgba(105, 93, 74, 0.15);
  --export-text-color: #1c1b1f;
  --export-text-muted: rgba(28, 27, 31, 0.4);
  --export-text-faint: rgba(28, 27, 31, 0.3);
  --export-border-color: rgba(105, 93, 74, 0.15);
  --export-meta-color: rgba(105, 93, 74, 0.35);
  --export-shadow-color: rgba(0, 0, 0, 0.12);
  --paper-grid-color: rgba(105, 93, 74, 0.05);
  --surface-container: #edeeea;
  --surface-container-low: #f4f4f0;
  --surface-container-high: #e6e9e4;
  --surface-container-highest: #e0e4de;
  --outline: #777c77;
  --outline-variant: #afb3ae;
  --on-secondary-container: #515250;
  --primary-fixed: #f2e0c8;
  --on-secondary-fixed: #3e403e;
  --on-primary-container: #5c503e;
  --tertiary-fixed-dim: #e4e9bc;
  --error: #9e422c;
  --inverse-primary: #fdebd3;
  --tertiary-fixed: #f2f7ca;
  --error-dim: #5c1202;
  --secondary-dim: #525351;
  --on-secondary: #faf9f6;
  --error-container: #fe8b70;
  --on-primary: #fff6ee;
  --tertiary-dim: #515634;
  --on-tertiary: #f8fdcf;
  --surface-dim: #d6dbd5;
  --on-primary-fixed: #493e2d;
  --primary-fixed-dim: #e3d2bb;
  --secondary: #5e5f5d;
  --primary-container: #f2e0c8;
  --on-tertiary-fixed: #474c2b;
  --surface-tint: #695d4a;
  --on-primary-fixed-variant: #665a47;
  --surface-bright: #faf9f6;
  --secondary-fixed: #e3e2e0;
  --on-tertiary-fixed-variant: #646945;
  --on-error-container: #742410;
  --surface-container-lowest: #ffffff;
  --on-secondary-fixed-variant: #5b5c5a;
  --primary-dim: #5d513f;
  --inverse-on-surface: #9d9d9a;
  --on-background: #2f3430;
  --on-error: #fff7f6;
  --secondary-fixed-dim: #d5d4d2;
  --on-tertiary-container: #5a5f3c;
  --surface-variant: #e0e4de;
  --secondary-container: #e3e2e0;
  --tertiary: #5d623f;
  --inverse-surface: #0d0f0d;
  --tertiary-container: #f2f7ca;
}

.theme-light {
  --bg-primary: #FAF9F6;
  --bg-surface: #FFFFFF;
  --bg-primary-85: rgba(250, 249, 246, 0.85);
  --bg-surface-90: rgba(255, 255, 255, 0.90);
  --bg-surface-80: rgba(255, 255, 255, 0.80);
  --bg-surface-60: rgba(255, 255, 255, 0.60);
  --color-primary: #695d4a;
  --text-primary: #3d3830;
  --text-variant: #5c605c;
  /* 导出专用 — 极简素白 */
  --export-gradient-start: #f5f0eb;
  --export-gradient-mid: #e8ddd4;
  --export-gradient-end: #d5ccc3;
  --export-paper-bg: #fffbf5;
  --export-grid-color: rgba(105, 93, 74, 0.06);
  --export-spine-color: rgba(105, 93, 74, 0.15);
  --export-text-color: #1c1b1f;
  --export-text-muted: rgba(28, 27, 31, 0.4);
  --export-text-faint: rgba(28, 27, 31, 0.3);
  --export-border-color: rgba(105, 93, 74, 0.15);
  --export-meta-color: rgba(105, 93, 74, 0.35);
  --export-shadow-color: rgba(0, 0, 0, 0.12);
  --paper-grid-color: rgba(105, 93, 74, 0.05);
  --surface-container: #edeeea;
  --surface-container-low: #f4f4f0;
  --surface-container-high: #e6e9e4;
  --surface-container-highest: #e0e4de;
  --outline: #777c77;
  --outline-variant: #afb3ae;
  --on-secondary-container: #515250;
  --primary-fixed: #f2e0c8;
  --on-secondary-fixed: #3e403e;
  --on-primary-container: #5c503e;
  --tertiary-fixed-dim: #e4e9bc;
  --error: #9e422c;
  --inverse-primary: #fdebd3;
  --tertiary-fixed: #f2f7ca;
  --error-dim: #5c1202;
  --secondary-dim: #525351;
  --on-secondary: #faf9f6;
  --error-container: #fe8b70;
  --on-primary: #fff6ee;
  --tertiary-dim: #515634;
  --on-tertiary: #f8fdcf;
  --surface-dim: #d6dbd5;
  --on-primary-fixed: #493e2d;
  --primary-fixed-dim: #e3d2bb;
  --secondary: #5e5f5d;
  --primary-container: #f2e0c8;
  --on-tertiary-fixed: #474c2b;
  --surface-tint: #695d4a;
  --on-primary-fixed-variant: #665a47;
  --surface-bright: #faf9f6;
  --secondary-fixed: #e3e2e0;
  --on-tertiary-fixed-variant: #646945;
  --on-error-container: #742410;
  --surface-container-lowest: #ffffff;
  --on-secondary-fixed-variant: #5b5c5a;
  --primary-dim: #5d513f;
  --inverse-on-surface: #9d9d9a;
  --on-background: #2f3430;
  --on-error: #fff7f6;
  --secondary-fixed-dim: #d5d4d2;
  --on-tertiary-container: #5a5f3c;
  --surface-variant: #e0e4de;
  --secondary-container: #e3e2e0;
  --tertiary: #5d623f;
  --inverse-surface: #0d0f0d;
  --tertiary-container: #f2f7ca;
}

.theme-dark {
  --bg-primary: #1a1a1a;
  --bg-surface: #2d2d2d;
  --bg-primary-85: rgba(26, 26, 26, 0.85);
  --bg-surface-90: rgba(45, 45, 45, 0.90);
  --bg-surface-80: rgba(45, 45, 45, 0.80);
  --bg-surface-60: rgba(45, 45, 45, 0.60);
  --color-primary: #a09080;
  --text-primary: #e8e4df;
  --text-variant: #b0a8a0;
  /* 导出专用 — 午夜书房 */
  --export-gradient-start: #1a1a1a;
  --export-gradient-mid: #252020;
  --export-gradient-end: #2a2520;
  --export-paper-bg: #2d2a26;
  --export-grid-color: rgba(160, 144, 128, 0.08);
  --export-spine-color: rgba(160, 144, 128, 0.12);
  --export-text-color: #e8e4df;
  --export-text-muted: rgba(232, 228, 223, 0.5);
  --export-text-faint: rgba(232, 228, 223, 0.35);
  --export-border-color: rgba(160, 144, 128, 0.15);
  --export-meta-color: rgba(160, 144, 128, 0.4);
  --export-shadow-color: rgba(0, 0, 0, 0.4);
  --paper-grid-color: rgba(160, 144, 128, 0.06);
  --surface-container: #252525;
  --surface-container-low: #222222;
  --surface-container-high: #2a2a2a;
  --surface-container-highest: #303030;
  --outline: #606060;
  --outline-variant: #404040;
  --on-secondary-container: #b0b0b0;
  --primary-fixed: #3a3020;
  --on-secondary-fixed: #c0c0c0;
  --on-primary-container: #d0c0b0;
  --tertiary-fixed-dim: #4a5030;
  --error: #c05030;
  --inverse-primary: #695d4a;
  --tertiary-fixed: #3a4020;
  --error-dim: #802010;
  --secondary-dim: #a0a0a0;
  --on-secondary: #1a1a1a;
  --error-container: #802010;
  --on-primary: #1a1a1a;
  --tertiary-dim: #707050;
  --on-tertiary: #1a1a1a;
  --surface-dim: #151515;
  --on-primary-fixed: #d0c0b0;
  --primary-fixed-dim: #2a2010;
  --secondary: #a0a0a0;
  --primary-container: #3a3020;
  --on-tertiary-fixed: #c0c0a0;
  --surface-tint: #a09080;
  --on-primary-fixed-variant: #b0a090;
  --surface-bright: #2d2d2d;
  --secondary-fixed: #3a3a3a;
  --on-tertiary-fixed-variant: #a0a080;
  --on-error-container: #c05030;
  --surface-container-lowest: #0a0a0a;
  --on-secondary-fixed-variant: #b0b0b0;
  --primary-dim: #807060;
  --inverse-on-surface: #2d2d2d;
  --on-background: #e8e4df;
  --on-error: #1a1a1a;
  --secondary-fixed-dim: #2a2a2a;
  --on-tertiary-container: #c0c0a0;
  --surface-variant: #303030;
  --secondary-container: #3a3a3a;
  --tertiary: #a0a080;
  --inverse-surface: #e8e4df;
  --tertiary-container: #3a4020;
}

.theme-sepia {
  --bg-primary: #f2e0c8;
  --bg-surface: #faf3e8;
  --bg-primary-85: rgba(242, 224, 200, 0.85);
  --bg-surface-90: rgba(250, 243, 232, 0.90);
  --bg-surface-80: rgba(250, 243, 232, 0.80);
  --bg-surface-60: rgba(250, 243, 232, 0.60);
  --color-primary: #695d4a;
  --text-primary: #4a3f30;
  --text-variant: #7a6a58;
  /* 导出专用 — 羊皮故卷 */
  --export-gradient-start: #e8d4b8;
  --export-gradient-mid: #d8c4a8;
  --export-gradient-end: #c8b498;
  --export-paper-bg: #f5ead8;
  --export-grid-color: rgba(105, 93, 74, 0.08);
  --export-spine-color: rgba(105, 93, 74, 0.18);
  --export-text-color: #4a3f30;
  --export-text-muted: rgba(74, 63, 48, 0.5);
  --export-text-faint: rgba(74, 63, 48, 0.35);
  --export-border-color: rgba(105, 93, 74, 0.2);
  --export-meta-color: rgba(105, 93, 74, 0.4);
  --export-shadow-color: rgba(80, 60, 30, 0.15);
  --paper-grid-color: rgba(105, 93, 74, 0.06);
  --surface-container: #e8dcc8;
  --surface-container-low: #f0e6d4;
  --surface-container-high: #e0d4bc;
  --surface-container-highest: #d8c8b0;
  --outline: #8a7a68;
  --outline-variant: #a89880;
  --on-secondary-container: #5a4a38;
  --primary-fixed: #e8d8c0;
  --on-secondary-fixed: #4a3a28;
  --on-primary-container: #5a4a38;
  --tertiary-fixed-dim: #d0c8a0;
  --error: #a04020;
  --inverse-primary: #f0e0c8;
  --tertiary-fixed: #e0d8b0;
  --error-dim: #602010;
  --secondary-dim: #6a5a48;
  --on-secondary: #f2e0c8;
  --error-container: #e08060;
  --on-primary: #f2e0c8;
  --tertiary-dim: #605040;
  --on-tertiary: #f0e8d0;
  --surface-dim: #d8c8b0;
  --on-primary-fixed: #4a3a28;
  --primary-fixed-dim: #d0c0a8;
  --secondary: #7a6a58;
  --primary-container: #e8d8c0;
  --on-tertiary-fixed: #403820;
  --surface-tint: #695d4a;
  --on-primary-fixed-variant: #6a5a48;
  --surface-bright: #faf3e8;
  --secondary-fixed: #d8c8b0;
  --on-tertiary-fixed-variant: #605840;
  --on-error-container: #602010;
  --surface-container-lowest: #ffffff;
  --on-secondary-fixed-variant: #6a5a48;
  --primary-dim: #5a4a38;
  --inverse-on-surface: #d8c8b0;
  --on-background: #4a3f30;
  --on-error: #faf3e8;
  --secondary-fixed-dim: #c8b8a0;
  --on-tertiary-container: #605840;
  --surface-variant: #e0d4bc;
  --secondary-container: #d8c8b0;
  --tertiary: #605840;
  --inverse-surface: #3a3020;
  --tertiary-container: #e0d8b0;
}

html {
  font-size: var(--font-size-base);
}

body {
  line-height: var(--line-height-base);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.bg-background-85 {
  background-color: var(--bg-primary-85);
}

.bg-surface-90 {
  background-color: var(--bg-surface-90);
}

.bg-surface-80 {
  background-color: var(--bg-surface-80);
}

.bg-surface-60 {
  background-color: var(--bg-surface-60);
}
</style>
