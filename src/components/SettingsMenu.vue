<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { X, Settings, Lock, Mail, User2, Trash2 } from 'lucide-vue-next';

const emit = defineEmits(['close']);
const router = useRouter();

const navigateTo = (routeName: string) => {
  router.push({ name: routeName });
  emit('close');
};

// --- INIZIO LOGICA ANIMAZIONE JAVASCRIPT ---
const onEnter = (el: Element, done: () => void) => {
  const overlay = el as HTMLElement;
  const container = el.querySelector('.settings-menu-container') as HTMLElement;
  
  const animation = overlay.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 300,
    easing: 'ease',
  });
  
  container.animate(
    [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }],
    {
      duration: 400,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }
  );

  animation.onfinish = done;
};

const onLeave = (el: Element, done: () => void) => {
  const overlay = el as HTMLElement;
  const container = el.querySelector('.settings-menu-container') as HTMLElement;

  const animation = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: 300,
    easing: 'ease',
  });
  
  container.animate(
    [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }],
    {
      duration: 400,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }
  );

  animation.onfinish = done;
};
// --- FINE LOGICA ANIMAZIONE JAVASCRIPT ---

const modalRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const startY = ref(0);
const currentTranslateY = ref(0);
const onTouchStart = (event: TouchEvent) => { /* ... codice invariato ... */ };
const onTouchMove = (event: TouchEvent) => { /* ... codice invariato ... */ };
const onTouchEnd = () => { /* ... codice invariato ... */ };
onMounted(() => { /* ... codice invariato ... */ });
onUnmounted(() => { /* ... codice invariato ... */ });
</script>

<template>
  <transition
    name="modal"
    :css="false"
    @enter="onEnter"
    @leave="onLeave"
  >
    <div class="modal-overlay" @click.self="$emit('close')">
      <div
        ref="modalRef"
        class="settings-menu-container"
        @touchstart.passive="onTouchStart"
      >
        <div class="drag-handle"></div>
        <button @click="$emit('close')" class="close-btn">
          <X :size="24" />
        </button>
        <h2 class="menu-title">Opzioni</h2>
        <nav class="settings-nav">
          <button class="nav-item" @click="navigateTo('Settings')">
            <Settings :size="20" />
            <span>Preferenze</span>
          </button>
          <button class="nav-item">
            <Lock :size="20" />
            <span>Password</span>
          </button>
          <button class="nav-item">
            <Mail :size="20" />
            <span>Email</span>
          </button>
          <button class="nav-item">
            <User2 :size="20" />
            <span>Età e sesso</span>
          </button>
          <button class="nav-item delete-item">
            <Trash2 :size="20" />
            <span>Elimina account</span>
          </button>
        </nav>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Stili del layout (invariati), rimosse solo le classi di animazione */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.7); display: flex;
  justify-content: center; align-items: flex-end; z-index: 1000; backdrop-filter: blur(5px);
}
.settings-menu-container {
  width: 100%; max-width: 500px; background-color: #1a1a1a;
  border-radius: 20px 20px 0 0; padding: 1.5rem;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4); position: relative;
}
.drag-handle {
  width: 50px; height: 6px; background-color: #333;
  border-radius: 3px; margin: 0 auto 1.5rem;
}
.close-btn {
  position: absolute; top: 1rem; right: 1rem; background: none;
  border: none; color: #a0a0a0; cursor: pointer; padding: 0.5rem;
}
.close-btn:hover { color: #fff; background-color: #2a2a2a; border-radius: 50%; }
.menu-title {
  text-align: center; font-size: 1.5rem; font-weight: bold; margin-bottom: 2rem;
}
.settings-nav { display: flex; flex-direction: column; gap: 0.5rem; }
.nav-item {
  display: flex; align-items: center; gap: 1rem; background: none; border: none;
  color: #e0e0e0; padding: 1rem; border-radius: 12px; text-align: left;
  cursor: pointer; font-size: 1.1rem; font-weight: bold; transition: background-color 0.2s ease;
}
.nav-item:hover { background-color: #2a2a2a; }
.nav-item span { flex-grow: 1; }
.delete-item { color: #ef4444; }

@media (min-width: 768px) {
  .modal-overlay { align-items: center; }
  .settings-menu-container { border-radius: 12px; transform: translateY(0) !important; }
}
</style>