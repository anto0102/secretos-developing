import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // <-- IMPORTA IL ROUTER

const app = createApp(App)

app.use(router) // <-- USA IL ROUTER
app.mount('#app')