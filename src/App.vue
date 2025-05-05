<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { supabase } from './supabase'
import { useRouter } from 'vue-router'

const router = useRouter()

// 监听认证状态变化
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    router.push('/home')
  } else if (event === 'SIGNED_OUT') {
    router.push('/')
  }
})
</script>

<style>
/* 确保Tailwind样式正常工作 */
@import './assets/main.css';

#app {
  min-height: 100vh;
  background-color: #f0f9ff;
}
</style>