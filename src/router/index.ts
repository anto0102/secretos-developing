import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '../firebase/config';
import HomeView from '../views/HomeView.vue';
import SettingsView from '../views/SettingsView.vue';
import PostView from '../views/PostView.vue';

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue') },
  { path: '/create', name: 'CreatePost', component: () => import('../views/CreatePostView.vue') },
  { path: '/search', name: 'Search', component: () => import('../views/SearchView.vue') },
  { path: '/notifications', name: 'Notifications', component: () => import('../views/NotificationsView.vue') },
  { 
    path: '/profile/:userId', 
    name: 'Profile', 
    component: () => import('../views/ProfileView.vue'),
    props: true 
  },
  {
    path: '/profile',
    redirect: () => {
      if (!auth.currentUser) return { name: 'Login' };
      return { path: `/profile/${auth.currentUser.uid}` };
    }
  },
  { path: '/settings', name: 'Settings', component: SettingsView },
  { 
    path: '/post/:postId',
    name: 'PostView',
    component: PostView,
    props: true
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;