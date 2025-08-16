import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SettingsView from '../views/SettingsView.vue'
import PostView from '../views/PostView.vue' // <-- Importiamo la nuova vista

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue') },
  { path: '/create', name: 'CreatePost', component: () => import('../views/CreatePostView.vue') },
  { path: '/search', name: 'Search', component: () => import('../views/SearchView.vue') },
  { path: '/notifications', name: 'Notifications', component: () => import('../views/NotificationsView.vue') },
  { path: '/profile', name: 'Profile', component: () => import('../views/ProfileView.vue') },
  { path: '/settings', name: 'Settings', component: SettingsView },
  { 
    path: '/post/:postId', // <-- Il percorso rimane dinamico
    name: 'PostView',      // <-- Aggiorniamo il nome della rotta
    component: PostView,   // <-- Colleghiamo il componente corretto
    props: true
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router