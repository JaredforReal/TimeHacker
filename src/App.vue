<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
// 认证状态由 router 守卫和 Pinia store 管理
// 不再需要 Supabase 的 onAuthStateChange
</script>

<style>
/* 确保Tailwind样式正常工作 */
@import './assets/main.css';

#app {
  min-height: 100vh;
  background-color: #f0f9ff;
}
</style>