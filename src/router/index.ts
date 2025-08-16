// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SettingsView from '../views/SettingsView.vue'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue') },
  { path: '/create', name: 'CreatePost', component: () => import('../views/CreatePostView.vue') },
  { path: '/search', name: 'Search', component: () => import('../views/SearchView.vue') },
  { path: '/notifications', name: 'Notifications', component: () => import('../views/NotificationsView.vue') },
  { path: '/profile', name: 'Profile', component: () => import('../views/ProfileView.vue') },
  { path: '/settings', name: 'Settings', component: SettingsView }, // Nuova rotta per le impostazioni
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router