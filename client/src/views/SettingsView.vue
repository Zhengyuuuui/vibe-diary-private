<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { getProfile, updateProfile, uploadAvatar } from '@/api'

const router = useRouter()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

const profile = ref({
  penName: '',
  bio: '',
  avatar: ''
})

const isSaving = ref(false)
const avatarFile = ref(null)
const avatarInput = ref(null)
const isLoading = ref(true)
const isLoggedIn = ref(false)

const themes = [
  { id: 'light', name: '极简素白', subtitle: 'Light Sanctuary' },
  { id: 'dark', name: '午夜书房', subtitle: 'Midnight Study' },
  { id: 'sepia', name: '羊皮故卷', subtitle: 'Aged Parchment' }
]

const previewThemeClass = computed(() => `theme-${settingsStore.theme}`)

onMounted(async () => {
  isLoggedIn.value = authStore.isLoggedIn
  if (isLoggedIn.value) {
    await loadProfile()
    await loadSettings()
    await settingsStore.loadAISettings() // 新增：加载 AI 设置
  }
  isLoading.value = false
})

async function loadProfile() {
  try {
    const data = await getProfile()
    profile.value.penName = data.pen_name || ''
    profile.value.bio = data.bio || ''
    profile.value.avatar = data.avatar || ''
  } catch (error) {
    console.error('加载资料失败:', error)
  }
}

async function loadSettings() {
  try {
    await settingsStore.loadSettings()
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

function handleAvatarChange(event) {
  const file = event.target.files[0]
  if (file) {
    avatarFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      profile.value.avatar = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

async function uploadAvatarFile() {
  if (!avatarFile.value) return null
  
  const formData = new FormData()
  formData.append('avatar', avatarFile.value)
  
  try {
    const data = await uploadAvatar(formData)
    profile.value.avatar = data.avatar_url
    avatarFile.value = null
    return data.avatar_url
  } catch (error) {
    console.error('上传头像失败:', error)
    throw error
  }
}

async function saveSettings() {
  isSaving.value = true
  
  try {
    if (avatarFile.value) {
      await uploadAvatarFile()
    }
    
    await updateProfile({
      pen_name: profile.value.penName,
      bio: profile.value.bio
    })
    
    await settingsStore.saveSettings({
      font_size: settingsStore.fontSize,
      line_height: settingsStore.lineHeight,
      theme: settingsStore.theme
    })
    
    alert('保存成功！')
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败: ' + error.message)
  } finally {
    isSaving.value = false
  }
}

function resetDefaults() {
  profile.value.penName = ''
  profile.value.bio = ''
  settingsStore.fontSize = 16
  settingsStore.theme = 'light'
  settingsStore.lineHeight = 'medium'
  settingsStore.applySettings()
}

function goBack() {
  router.push('/')
}

function triggerAvatarUpload() {
  avatarInput.value?.click()
}

function goToLogin() {
  router.push('/login')
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function updateFontSize(value) {
  settingsStore.fontSize = parseInt(value)
  settingsStore.applySettings()
}

function updateLineHeight(value) {
  settingsStore.lineHeight = value
  settingsStore.applySettings()
}

function updateTheme(value) {
  settingsStore.theme = value
  settingsStore.applySettings()
}

// 新增：AI 设置相关函数
async function toggleAIEnabled() {
  await settingsStore.toggleAIEnabled()
}

async function toggleAIReflection() {
  await settingsStore.toggleAIReflection()
}

async function toggleAIWeeklyReview() {
  await settingsStore.toggleAIWeeklyReview()
}

async function toggleAIEmotionTrend() {
  await settingsStore.toggleAIEmotionTrend()
}
</script>

<template>
  <div class="min-h-screen bg-background text-on-surface">
    <header class="bg-background opacity-95 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4">
      <div class="flex items-center gap-4">
        <button @click="goBack" class="material-symbols-outlined text-primary hover:scale-110 transition-transform cursor-pointer">
          arrow_back
        </button>
        <h1 class="text-xl font-bold text-primary font-headline tracking-tight">氛围日记</h1>
      </div>
      <div class="flex items-center gap-6">
        <div class="hidden md:flex gap-8 items-center">
          <a href="/" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-xs uppercase tracking-widest">首页</a>
          <a href="/reflection" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-xs uppercase tracking-widest">回望</a>
          <a href="/favorites" class="text-primary/60 hover:text-primary transition-colors duration-300 font-label text-xs uppercase tracking-widest">灵感</a>
          <a href="#" class="text-primary font-bold font-label text-xs uppercase tracking-widest">设置</a>
        </div>
        <div class="flex gap-4">
          <span class="material-symbols-outlined text-primary cursor-pointer hover:scale-110 transition-transform">filter_list</span>
          <button @click="handleLogout" class="material-symbols-outlined text-primary cursor-pointer hover:scale-110 transition-transform" title="退出登录">logout</button>
        </div>
      </div>
    </header>

    <div v-if="!isLoading && !isLoggedIn" class="max-w-3xl mx-auto px-6 py-24 text-center">
      <div class="mb-8">
        <span class="material-symbols-outlined text-6xl text-primary/30">lock</span>
      </div>
      <h2 class="font-headline text-2xl text-primary mb-4">请先登录</h2>
      <p class="font-body text-on-surface-variant mb-8">登录后即可管理您的个人设置和偏好</p>
      <button
        @click="goToLogin"
        class="bg-primary text-on-primary font-label text-sm uppercase tracking-[0.2em] px-10 py-3 rounded-md shadow-lg shadow-primary/20 hover:scale-95 transition-transform"
      >
        前往登录
      </button>
    </div>

    <main v-if="isLoggedIn" class="max-w-3xl mx-auto px-6 py-12 pb-32">
      <div class="mb-16">
        <h2 class="font-headline text-4xl font-bold tracking-tight text-primary mb-2">设置</h2>
        <p class="font-body italic text-on-surface-variant">静谧的空间，只为留存心底最柔软的氛围。</p>
      </div>

      <section class="mb-16">
        <h3 class="font-label text-[10px] uppercase tracking-[0.2em] text-outline mb-8">个人资料 • Profile</h3>
        <div class="bg-surface-container-low rounded-xl p-8 flex flex-col md:flex-row items-center gap-8">
          <div class="relative group">
            <img
              :src="profile.avatar || '/default-avatar.png'"
              alt="User Profile"
              class="w-32 h-32 rounded-full object-cover shadow-sm transition-all duration-500 bg-surface-container"
            />
            <div 
              class="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              @click="triggerAvatarUpload"
            >
              <span class="material-symbols-outlined text-on-primary">photo_camera</span>
            </div>
            <input
              ref="avatarInput"
              type="file"
              accept="image/jpeg,image/png,image/gif"
              class="hidden"
              @change="handleAvatarChange"
            />
          </div>
          <div class="flex-1 w-full space-y-6">
            <div class="ghost-border py-2">
              <label class="block font-label text-[10px] uppercase text-outline mb-1">笔名 / Pen Name</label>
              <input
                v-model="profile.penName"
                maxlength="20"
                class="w-full bg-transparent border-none p-0 focus:ring-0 font-body text-xl text-on-surface"
                type="text"
              />
            </div>
            <div class="ghost-border py-2">
              <label class="block font-label text-[10px] uppercase text-outline mb-1">个性签名 / Bio</label>
              <input
                v-model="profile.bio"
                maxlength="200"
                class="w-full bg-transparent border-none p-0 focus:ring-0 font-body text-lg italic text-on-surface-variant"
                type="text"
                placeholder="这个家伙很神秘什么都没留下"
              />
            </div>
          </div>
        </div>
      </section>

      <section class="mb-16">
        <h3 class="font-label text-[10px] uppercase tracking-[0.2em] text-outline mb-8">排版与意境 • Typography</h3>
        <div class="space-y-12">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 class="font-headline text-lg text-primary">文字大小</h4>
              <p class="font-body text-sm text-on-surface-variant">调整阅读时的字体磅值，寻找最舒适的视觉距离。</p>
            </div>
            <div class="flex items-center gap-4 bg-surface-container-high p-2 px-4 rounded-full">
              <span class="text-xs text-on-surface-variant">12</span>
              <input
                :value="settingsStore.fontSize"
                @input="updateFontSize($event.target.value)"
                class="accent-primary w-32 md:w-48 cursor-pointer"
                type="range"
                min="12"
                max="24"
              />
              <span class="text-sm text-on-surface-variant">24</span>
              <span class="ml-2 text-sm font-medium text-primary w-8">{{ settingsStore.fontSize }}</span>
            </div>
          </div>

          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 class="font-headline text-lg text-primary">行间距</h4>
              <p class="font-body text-sm text-on-surface-variant">赋予文字流动的空间，营造诗性的留白。</p>
            </div>
            <div class="flex gap-2">
              <button
                @click="updateLineHeight('compact')"
                :class="[
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                  settingsStore.lineHeight === 'compact'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-highest border border-primary/20 text-primary'
                ]"
              >
                <span class="material-symbols-outlined">format_line_spacing</span>
              </button>
              <button
                @click="updateLineHeight('medium')"
                :class="[
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                  settingsStore.lineHeight === 'medium'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-highest border border-primary/20 text-primary'
                ]"
              >
                <span class="material-symbols-outlined">segment</span>
              </button>
              <button
                @click="updateLineHeight('relaxed')"
                :class="[
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                  settingsStore.lineHeight === 'relaxed'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-highest border border-primary/20 text-primary'
                ]"
              >
                <span class="material-symbols-outlined">format_align_justify</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="mb-16">
        <h3 class="font-label text-[10px] uppercase tracking-[0.2em] text-outline mb-8">界面格调 • Appearance</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="theme in themes"
            :key="theme.id"
            @click="updateTheme(theme.id)"
            class="group cursor-pointer"
          >
            <div
              :class="[
                'h-40 rounded-xl mb-4 border-4 flex flex-col p-4 space-y-2 overflow-hidden transition-all group-hover:scale-[1.02]',
                theme.id === 'light' ? 'bg-surface-container-lowest border-outline-variant shadow-sm' : '',
                theme.id === 'dark' ? 'bg-inverse-surface border-outline' : '',
                theme.id === 'sepia' ? 'bg-primary-fixed border-outline-variant' : '',
                settingsStore.theme === theme.id ? 'ring-2 ring-primary ring-offset-2' : ''
              ]"
            >
              <div
                :class="[
                  'w-2/3 h-2 rounded',
                  theme.id === 'light' ? 'bg-surface-container-high' : '',
                  theme.id === 'dark' ? 'bg-surface-container' : '',
                  theme.id === 'sepia' ? 'bg-surface-container-high' : ''
                ]"
              ></div>
              <div
                :class="[
                  'w-full h-2 rounded',
                  theme.id === 'light' ? 'bg-surface-container-low' : '',
                  theme.id === 'dark' ? 'bg-surface-container' : '',
                  theme.id === 'sepia' ? 'bg-surface-container' : ''
                ]"
              ></div>
              <div
                :class="[
                  'w-full h-2 rounded',
                  theme.id === 'light' ? 'bg-surface-container-low' : '',
                  theme.id === 'dark' ? 'bg-surface-container' : '',
                  theme.id === 'sepia' ? 'bg-surface-container' : ''
                ]"
              ></div>
              <div class="mt-4 flex gap-2">
                <div
                  :class="[
                    'w-8 h-8 rounded-full',
                    theme.id === 'light' ? 'bg-outline' : '',
                    theme.id === 'dark' ? 'bg-outline-variant' : '',
                    theme.id === 'sepia' ? 'bg-primary' : ''
                  ]"
                ></div>
              </div>
            </div>
            <p
              :class="[
                'font-headline text-center transition-colors',
                settingsStore.theme === theme.id ? 'text-primary font-semibold' : 'text-on-surface-variant'
              ]"
            >
              {{ theme.name }}
            </p>
            <p class="font-label text-[10px] text-center text-outline uppercase mt-1">{{ theme.subtitle }}</p>
          </div>
        </div>
      </section>

      <!-- 新增：隐私与 AI 设置区域 -->
      <section class="mb-16">
        <h3 class="font-label text-[10px] uppercase tracking-[0.2em] text-outline mb-8">
          隐私与 AI • Privacy & AI
        </h3>

        <div class="bg-surface-container-low rounded-xl p-8 space-y-6">
          <!-- AI 总开关 -->
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-headline text-lg text-primary">AI 功能总开关</h4>
              <p class="font-body text-sm text-on-surface-variant">
                默认关闭,开启后可使用 AI 辅助功能
              </p>
            </div>
            <button
              @click="toggleAIEnabled"
              :class="[
                'w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer',
                settingsStore.aiSettings.ai_enabled
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-highest border border-primary/20 text-primary'
              ]"
            >
              <span class="material-symbols-outlined">
                {{ settingsStore.aiSettings.ai_enabled ? 'check' : 'close' }}
              </span>
            </button>
          </div>

          <!-- AI Reflection 开关 -->
          <div v-if="settingsStore.aiSettings.ai_enabled" class="flex items-center justify-between">
            <div>
              <h4 class="font-headline text-lg text-primary">AI Reflection</h4>
              <p class="font-body text-sm text-on-surface-variant">
                分析最近 7 天的日记内容
              </p>
            </div>
            <button
              @click="toggleAIReflection"
              :class="[
                'w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer',
                settingsStore.aiSettings.ai_reflection_enabled
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-highest border border-primary/20 text-primary'
              ]"
            >
              <span class="material-symbols-outlined">
                {{ settingsStore.aiSettings.ai_reflection_enabled ? 'check' : 'close' }}
              </span>
            </button>
          </div>

          <!-- AI Weekly Review 开关 -->
          <div v-if="settingsStore.aiSettings.ai_enabled" class="flex items-center justify-between">
            <div>
              <h4 class="font-headline text-lg text-primary">AI Weekly Review</h4>
              <p class="font-body text-sm text-on-surface-variant">
                生成每周生活回顾
              </p>
            </div>
            <button
              @click="toggleAIWeeklyReview"
              :class="[
                'w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer',
                settingsStore.aiSettings.ai_weekly_review_enabled
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-highest border border-primary/20 text-primary'
              ]"
            >
              <span class="material-symbols-outlined">
                {{ settingsStore.aiSettings.ai_weekly_review_enabled ? 'check' : 'close' }}
              </span>
            </button>
          </div>

          <!-- AI 情绪趋势开关 -->
          <div v-if="settingsStore.aiSettings.ai_enabled" class="flex items-center justify-between">
            <div>
              <h4 class="font-headline text-lg text-primary">情绪趋势分析</h4>
              <p class="font-body text-sm text-on-surface-variant">
                观察长期状态变化
              </p>
            </div>
            <button
              @click="toggleAIEmotionTrend"
              :class="[
                'w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer',
                settingsStore.aiSettings.ai_emotion_trend_enabled
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-highest border border-primary/20 text-primary'
              ]"
            >
              <span class="material-symbols-outlined">
                {{ settingsStore.aiSettings.ai_emotion_trend_enabled ? 'check' : 'close' }}
              </span>
            </button>
          </div>

          <!-- 隐私说明 -->
          <div class="mt-8 p-4 bg-surface-container rounded-lg">
            <p class="font-body text-xs text-on-surface-variant leading-relaxed">
              <strong class="text-primary">隐私承诺：</strong>
              Vibe Diary 默认不会分析任何日记内容。
              只有您主动开启后,才会将您选择的内容发送给 AI。
              您可以随时关闭 AI 功能,关闭后产品依然完整可用。
            </p>
          </div>
        </div>
      </section>

      <div class="flex justify-end gap-6 pt-12">
        <button
          @click="resetDefaults"
          class="font-label text-sm uppercase tracking-widest text-outline hover:text-primary transition-colors"
        >
          重置默认
        </button>
        <button
          @click="saveSettings"
          :disabled="isSaving"
          class="bg-primary text-on-primary font-label text-sm uppercase tracking-[0.2em] px-10 py-3 rounded-md shadow-lg shadow-primary/20 hover:scale-95 transition-transform disabled:opacity-50"
        >
          {{ isSaving ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </main>

    <nav class="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 flex justify-around items-center py-3 px-4 bg-surface-90 backdrop-blur-lg rounded-full shadow-[0_20_40px_rgba(105,93,74,0.06)]">
      <a href="/" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
        <span class="material-symbols-outlined">auto_stories</span>
        <span class="font-label text-[10px] uppercase tracking-widest">首页</span>
      </a>
      <a href="/reflection" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
        <span class="material-symbols-outlined">inventory_2</span>
        <span class="font-label text-[10px] uppercase tracking-widest">回望</span>
      </a>
      <a href="/favorites" class="flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all">
        <span class="material-symbols-outlined">star</span>
        <span class="font-label text-[10px] uppercase tracking-widest">灵感</span>
      </a>
      <a href="#" class="flex flex-col items-center justify-center text-primary scale-110 active:scale-90 duration-200">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">settings</span>
        <span class="font-label text-[10px] uppercase tracking-widest">设置</span>
      </a>
    </nav>
  </div>
</template>

<style scoped>
.ghost-border {
  border-bottom: 1px solid var(--outline-variant);
  opacity: 0.5;
}

.ghost-border:focus-within {
  border-bottom: 1px solid var(--color-primary);
  opacity: 1;
}
</style>
