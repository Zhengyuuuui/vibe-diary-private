/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 基础背景与表面
        'background': 'var(--bg-primary)',
        'surface': 'var(--bg-surface)',
        'surface-90': 'var(--bg-surface-90)',
        'surface-80': 'var(--bg-surface-80)',
        'surface-60': 'var(--bg-surface-60)',
        
        // 核心品牌色
        'primary': 'var(--color-primary)',
        'primary-dim': 'var(--primary-dim)',
        'primary-container': 'var(--primary-container)',
        'primary-fixed': 'var(--primary-fixed)',
        'primary-fixed-dim': 'var(--primary-fixed-dim)',
        
        // 文字与内容色 (重要：确保你的 HTML 使用了这些类名)
        'on-surface': 'var(--text-primary)',
        'on-surface-variant': 'var(--text-variant)',
        'on-primary': 'var(--on-primary)',
        'on-primary-container': 'var(--on-primary-container)',
        'on-primary-fixed': 'var(--on-primary-fixed)',
        'on-primary-fixed-variant': 'var(--on-primary-fixed-variant)',
        
        // 容器层级 (已修复重复项)
        'surface-container': 'var(--surface-container)',
        'surface-container-low': 'var(--surface-container-low)',
        'surface-container-high': 'var(--surface-container-high)',
        'surface-container-highest': 'var(--surface-container-highest)',
        'surface-container-lowest': 'var(--surface-container-lowest)',
        'surface-variant': 'var(--surface-variant)',
        'surface-dim': 'var(--surface-dim)',
        'surface-bright': 'var(--surface-bright)',
        'surface-tint': 'var(--surface-tint)',

        // 辅助色系 (Secondary & Tertiary)
        'secondary': 'var(--secondary)',
        'secondary-dim': 'var(--secondary-dim)',
        'secondary-container': 'var(--secondary-container)',
        'secondary-fixed': 'var(--secondary-fixed)',
        'secondary-fixed-dim': 'var(--secondary-fixed-dim)',
        'on-secondary': 'var(--on-secondary)',
        'on-secondary-container': 'var(--on-secondary-container)',
        'on-secondary-fixed': 'var(--on-secondary-fixed)',
        'on-secondary-fixed-variant': 'var(--on-secondary-fixed-variant)',
        
        'tertiary': 'var(--tertiary)',
        'tertiary-dim': 'var(--tertiary-dim)',
        'tertiary-container': 'var(--tertiary-container)',
        'tertiary-fixed': 'var(--tertiary-fixed)',
        'tertiary-fixed-dim': 'var(--tertiary-fixed-dim)',
        'on-tertiary': 'var(--on-tertiary)',
        'on-tertiary-container': 'var(--on-tertiary-container)',
        'on-tertiary-fixed': 'var(--on-tertiary-fixed)',
        'on-tertiary-fixed-variant': 'var(--on-tertiary-fixed-variant)',

        // 边框与轮廓
        'outline': 'var(--outline)',
        'outline-variant': 'var(--outline-variant)',
        
        // 错误反馈
        'error': 'var(--error)',
        'error-dim': 'var(--error-dim)',
        'error-container': 'var(--error-container)',
        'on-error': 'var(--on-error)',
        'on-error-container': 'var(--on-error-container)',
        
        // 反向色值
        'inverse-primary': 'var(--inverse-primary)',
        'inverse-surface': 'var(--inverse-surface)',
        'inverse-on-surface': 'var(--inverse-on-surface)',
        'on-background': 'var(--on-background)',
      },
      borderRadius: {
        'DEFAULT': '0.125rem',
        'lg': '0.25rem',
        'xl': '0.5rem',
        'full': '0.75rem'
      },
      fontFamily: {
        'headline': ['Noto Serif SC', 'serif'],
        'body': ['Newsreader', 'serif'],
        'label': ['Manrope', 'sans-serif']
      }
    },
  },
  plugins: [],
}