<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ isLogin ? '登录您的账户' : '注册新账户' }}
        </h2>
      </div>
      
      <div class="text-center">
        <button 
          @click="isLogin = !isLogin"
          class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          {{ isLogin ? '没有账户？立即注册' : '已有账户？立即登录' }}
        </button>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="email" class="sr-only">邮箱地址</label>
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="邮箱地址"
            />
          </div>
          <div>
            <label for="password" class="sr-only">密码</label>
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="密码"
              minlength="6"
            />
          </div>
        </div>

        <div v-if="isLogin" class="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            v-model="form.rememberMe"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label for="remember-me" class="ml-2 block text-sm text-gray-900">
            记住我
          </label>
        </div>

        <div>
          <button
            type="submit"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            :disabled="loading"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg
                class="h-5 w-5 text-indigo-500 group-hover:text-indigo-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
            {{ loading ? '处理中...' : isLogin ? '登录' : '注册' }}
          </button>
        </div>
      </form>

      <div v-if="error" class="text-red-500 text-sm mt-2 text-center">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()
const isLogin = ref(true)
const loading = ref(false)
const error = ref('')

const form = ref({
  email: '',
  password: '',
  rememberMe: false
})

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = ''
    
    if (isLogin.value) {
      // 登录逻辑
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.value.email,
        password: form.value.password
      })
      
      if (authError) throw authError
      
      router.push('/home')
    } else {
      // 注册逻辑
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.value.email,
        password: form.value.password,
      })
      
      if (signUpError) throw signUpError
      
      alert('注册成功！请检查您的邮箱以确认账户')
      isLogin.value = true
    }
  } catch (err) {
    error.value = err.message || (isLogin.value ? '登录失败' : '注册失败')
  } finally {
    loading.value = false
  }
}
</script>