<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const mode = ref('login')
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

// 🆕 公告相关状态
const showAnnouncement = ref(false)
const announcementKey = 'vibe-diary-announcement-shown'

onMounted(() => {
  // 检查是否已经看过公告
  const hasSeenAnnouncement = localStorage.getItem(announcementKey)
  if (!hasSeenAnnouncement) {
    showAnnouncement.value = true
  }
})

// 🆕 关闭公告
function closeAnnouncement() {
  showAnnouncement.value = false
  localStorage.setItem(announcementKey, 'true')
}

async function handleSubmit() {
  error.value = ''
  
  if (!username.value.trim()) {
    error.value = '请输入用户名'
    return
  }
  
  if (!password.value) {
    error.value = '请输入密码'
    return
  }
  
  if (mode.value === 'register' && password.value.length < 6) {
    error.value = '密码至少6个字符'
    return
  }
  
  loading.value = true
  try {
    if (mode.value === 'login') {
      await authStore.login(username.value.trim(), password.value)
    } else {
      await authStore.register(username.value.trim(), password.value)
    }
    router.push('/')
  } catch (e) {
    error.value = e.message || (mode.value === 'login' ? '登录失败' : '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <!-- 🆕 公告模态框 -->
    <div
      v-if="showAnnouncement"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      @click.self="closeAnnouncement"
    >
      <div class="bg-surface-80 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-lg relative animate-fade-in my-8 max-h-[90vh] flex flex-col">
        <!-- 关闭按钮 -->
        <button
          @click="closeAnnouncement"
          class="absolute top-4 right-4 p-2 rounded-full bg-surface-container-high hover:bg-surface-container transition-colors z-10"
        >
          <span class="material-symbols-outlined text-on-surface-variant text-xl">close</span>
        </button>

        <!-- 🆕 可滚动内容区域 -->
        <div class="overflow-y-auto px-8 md:px-12 pt-8 md:pt-12 pb-4 flex-1">
        
        <!-- 公告图标和标题 -->
        <div class="flex items-center gap-3 mb-6">
          <span class="material-symbols-outlined text-primary text-3xl">campaign</span>
          <div>
            <h2 class="font-headline text-2xl text-on-surface">项目公告</h2>
            <p class="font-label text-xs text-on-surface-variant">Announcement</p>
          </div>
        </div>
        
        <!-- 项目介绍 -->
        <div class="mb-8">
          <h3 class="font-headline text-lg text-on-surface mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">auto_stories</span>
            关于 Vibe Diary
          </h3>

          <p class="font-body text-sm text-on-surface-variant leading-relaxed mb-4">
            <strong class="text-on-surface">Vibe Diary</strong> 是一款专注于记录生活的数字日记本。
          </p>

          <p class="font-body text-sm text-on-surface-variant leading-relaxed mb-4">
            它并不是传统意义上的备忘录，也不是默认读取你所有内容的 AI 工具。我更希望它像一本真正属于自己的日记——安静、私密，可以随时翻开，也可以多年以后再次阅读。
          </p>

          <p class="font-body text-sm text-on-surface-variant leading-relaxed mb-4">
            整个项目从今年 3 月开始开发。最初只是用 Trae 想尝试复刻 Paper App 那种利索的翻页体验。当时自己实现了很多方案，但始终达不到理想效果，后来才决定采用 StPageFlip，把更多精力放回产品体验本身。
          </p>

          <p class="font-body text-sm text-on-surface-variant leading-relaxed mb-4">
            项目使用 Vue 3 开发，最开始只是一个动画 Demo，用来验证翻页效果和灵感卡片等交互设计。后来因为学业和接项目，这个作品暂停了一段时间。直到最近看到 Trae 创作者大赛，我决定重新把它捡起来，希望把它真正打磨成一个值得长期维护的作品。
          </p>

          <div class="p-4 bg-surface-container rounded-lg mb-4">
            <h4 class="font-label text-xs text-on-surface mb-3 flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">person</span>
              如果你愿意体验
            </h4>
            <p class="font-body text-sm text-on-surface-variant leading-relaxed mb-3">
              可以使用测试账号：<br>
              账号：<strong class="text-primary">111</strong><br>
              密码：<strong class="text-primary">123456</strong>
            </p>
            <p class="font-body text-sm text-on-surface-variant leading-relaxed mb-3">
              里面保留了一本公共日记。<br>
              如果愿意的话，你可以留下今天的心情、一个故事，或者任何想说的话。也欢迎给我留下一些建议。
            </p>
            <p class="font-body text-xs text-on-surface-variant italic">
              唯一的小请求是：请不要修改其他人已经写下的内容。让它像一本会不断传递下去的公共日记。
            </p>
          </div>

          <p class="font-body text-sm text-on-surface-variant leading-relaxed mb-4">
            <strong class="text-on-surface">最后</strong><br>
            Vibe Diary 还有很多地方没有做好。如果你发现 Bug、想到新的功能，或者只是想聊聊产品设计，我都非常欢迎。
          </p>

          <p class="font-body text-sm text-on-surface-variant leading-relaxed mb-4">
            如果你也喜欢开发，或者以后想一起完成 iOS 版本，也欢迎联系我。如果你觉得这个作品不错，也欢迎在 Trae 社区或我的抖音支持一下。每一次反馈，都会让它变得更好。
          </p>

          <p class="font-body text-xs text-on-surface-variant italic border-t border-outline-variant/20 pt-4 mt-4">
            愿每一次记录，都成为未来某一天温柔的回忆。<br>
            —— 小 Y
          </p>
        </div>
        
        <!-- 联系方式 -->
        <div class="mb-6 p-4 bg-surface-container rounded-lg">
          <h3 class="font-headline text-lg text-on-surface mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">contact_mail</span>
            联系方式
          </h3>

          <!-- 邮箱 -->
          <div class="flex items-center gap-3 mb-3">
            <span class="material-symbols-outlined text-on-surface-variant">mail</span>
            <div>
              <p class="font-label text-xs text-on-surface-variant mb-1">邮箱 Email</p>
              <p class="font-body text-sm text-on-surface">
                <a href="mailto:zysgm123@gmail.com" class="hover:text-primary transition-colors underline">
                  zysgm123@gmail.com
                </a>
              </p>
            </div>
          </div>

          <!-- 微信 -->
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-on-surface-variant">chat</span>
            <div>
              <p class="font-label text-xs text-on-surface-variant mb-1">微信 WeChat</p>
              <p class="font-body text-sm text-on-surface">Lachervic</p>
            </div>
          </div>
        </div>

        <!-- 感谢文字 -->
        <div class="text-center mb-4">
          <p class="font-body text-sm text-on-surface-variant italic">
            感谢您的使用,如有问题或建议,欢迎联系开发者。
          </p>
        </div>

        </div>

        <!-- 🆕 固定在底部的确认按钮区域 -->
        <div class="px-8 md:px-12 pb-8 md:pb-12 border-t border-outline-variant/20 pt-4 bg-surface-80 rounded-b-2xl">
          <button
            @click="closeAnnouncement"
            class="w-full py-3 px-4 bg-primary text-on-primary rounded-md font-label text-sm font-semibold shadow-md active:opacity-70 transition-all"
          >
            我知道了
          </button>

          <p class="font-label text-xs text-on-surface-variant mt-3 text-center">
            点击后将不再显示此公告
          </p>
        </div>
      </div>
    </div>
    
    <!-- 原登录卡片 -->
    <div class="bg-surface-80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-headline text-on-surface tracking-tighter">氛围日记</h1>
        <p class="text-sm text-on-surface-variant mt-2 font-label">Digital Sanctuary</p>
      </div>
      
      <div class="flex mb-8 border-b border-outline">
        <button
          @click="mode = 'login'"
          :class="[
            'flex-1 pb-3 font-label text-sm transition-all',
            mode === 'login' 
              ? 'border-b-2 border-primary text-primary font-semibold' 
              : 'text-on-surface-variant hover:text-on-surface'
          ]"
        >
          登录
        </button>
        <button
          @click="mode = 'register'"
          :class="[
            'flex-1 pb-3 font-label text-sm transition-all',
            mode === 'register' 
              ? 'border-b-2 border-primary text-primary font-semibold' 
              : 'text-on-surface-variant hover:text-on-surface'
          ]"
        >
          注册
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="font-label text-xs text-on-surface-variant mb-1 block">用户名</label>
          <input
            v-model="username"
            type="text"
            placeholder="请输入用户名"
            class="w-full px-4 py-3 rounded-lg border border-outline-variant/30 bg-surface-container-low focus:outline-none focus:border-primary font-body text-sm"
          />
        </div>
        
        <div>
          <label class="font-label text-xs text-on-surface-variant mb-1 block">密码</label>
          <input
            v-model="password"
            type="password"
            :placeholder="mode === 'register' ? '至少6位密码' : '请输入密码'"
            class="w-full px-4 py-3 rounded-lg border border-outline-variant/30 bg-surface-container-low focus:outline-none focus:border-primary font-body text-sm"
          />
        </div>
        
        <p v-if="error" class="text-red-500 text-sm text-center mt-2 font-label">{{ error }}</p>
        
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 px-4 bg-primary text-on-primary rounded-md font-label text-sm font-semibold shadow-md active:opacity-70 transition-all disabled:opacity-40 mt-6"
        >
          <span v-if="loading" class="flex items-center justify-center">
            <span class="material-symbols-outlined animate-spin text-lg mr-2">refresh</span>
            处理中...
          </span>
          <span v-else>{{ mode === 'login' ? '登录' : '注册' }}</span>
        </button>
      </form>
      
      <p v-if="mode === 'login'" class="text-center text-xs text-on-surface-variant mt-6 font-label">
        默认账户：用户名 <span class="text-on-surface">111</span>，密码 <span class="text-on-surface">123456</span>
      </p>
      
      <!-- 🆕 查看公告按钮 -->
      <button 
        @click="showAnnouncement = true"
        class="w-full mt-4 py-2 px-4 bg-surface-container-high hover:bg-surface-container text-on-surface-variant hover:text-on-surface rounded-md font-label text-xs transition-all flex items-center justify-center gap-2"
      >
        <span class="material-symbols-outlined text-sm">campaign</span>
        查看项目公告
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 公告模态框动画 */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
