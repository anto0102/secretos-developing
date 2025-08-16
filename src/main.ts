import { createApp } from 'vue'
import App from './App.vue'
// Modifichiamo leggermente l'import per essere più espliciti
import router from './router/index.ts' 

const app = createApp(App)

app.use(router)
app.mount('#app')