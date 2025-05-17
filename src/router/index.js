import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/LoginView.vue'
import Home from '../views/HomeView.vue'
import ProfileView from '../views/ProfileView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import { supabase } from '../supabase.js'

const routes = [
  {
    path: '/',
    redirect: '/home' // 修改默认重定向到 /home
  },
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/home',
    name: 'home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: ResetPasswordView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 添加路由守卫
router.beforeEach(async (to, from, next) => {
  try {
    // 获取当前会话
    const { data: { session } } = await supabase.auth.getSession()

    // 需要认证但未登录 (排除home页面)
    if (to.meta.requiresAuth && !session && to.name !== 'home') {
      next('/login')
    }
    // 已登录但访问登录页
    else if (to.name === 'login' && session) {
      next('/home')
    }
    // 其他情况正常放行
    else {
      next()
    }
  } catch (error) {
    console.error('Error during route guard:', error)
    next('/login')
  }
})

export default router