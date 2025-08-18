import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '../firebase/config';
import NProgress from '../utils/loadingIndicator';
import HomeView from '../views/HomeView.vue';
import SettingsView from '../views/SettingsView.vue';
import PostView from '../views/PostView.vue';
import PostCommentsView from '../views/PostCommentsView.vue';

// Import delle nuove viste per le impostazioni
import ChangePasswordView from '../views/ChangePasswordView.vue';
import ChangeEmailView from '../views/ChangeEmailView.vue';
import DeleteAccountView from '../views/DeleteAccountView.vue';


const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue') },
  { path: '/create/:postId?', name: 'CreatePost', component: () => import('../views/CreatePostView.vue'), props: true },
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
      if (!auth.currentUser) {
        return { name: 'Login' };
      }
      return { path: `/profile/${auth.currentUser.uid}` };
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView
  },
  // Aggiunta delle nuove rotte per le impostazioni
  {
    path: '/settings/password',
    name: 'ChangePassword',
    component: ChangePasswordView,
  },
  {
    path: '/settings/email',
    name: 'ChangeEmail',
    component: ChangeEmailView,
  },
  {
    path: '/settings/delete-account',
    name: 'DeleteAccount',
    component: DeleteAccountView,
  },
  {
    path: '/post/:postId',
    name: 'PostView',
    component: PostView,
    props: true,
  },
  {
    path: '/post/:postId/comments',
    name: 'PostCommentsView',
    component: PostCommentsView,
    props: true
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Hook prima di ogni navigazione per avviare la barra
router.beforeEach((to, from, next) => {
  NProgress.start();
  next();
});

// Hook dopo ogni navigazione per terminare la barra
router.afterEach(() => {
  NProgress.done();
});

export default router;