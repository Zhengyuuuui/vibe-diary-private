<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const mode = ref('login')
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

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
    </div>
  </div>
</template>
