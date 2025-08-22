
import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue';
import { DragGesture } from '@use-gesture/vanilla';

interface UseBottomSheetOptions {
  sheetRef: Ref<HTMLElement | null>;
  onClose: () => void;
}

export function useBottomSheet({ sheetRef, onClose }: UseBottomSheetOptions) {
  const y = ref(0);
  const isDragging = ref(false);
  const sheetHeight = ref(0);

  const style = computed(() => ({
    transform: `translateY(${y.value}px)`,
    transition: isDragging.value ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
    touchAction: 'pan-y',
  }));

  let gesture: DragGesture | undefined;

  onMounted(() => {
    if (sheetRef.value) {
      sheetHeight.value = sheetRef.value.clientHeight;
      gesture = new DragGesture(
        sheetRef.value,
        (state) => {
          isDragging.value = state.active;
          let newY = state.movement[1];

          // Only allow dragging down
          if (newY < 0) {
            // Apply resistance when dragging up
            newY = Math.tanh(-newY / sheetHeight.value) * -50;
          }
          y.value = newY;

          if (!state.active) {
            const [, vy] = state.velocity;
            const down = vy > 0.5; // Velocity threshold to close
            const farEnough = state.movement[1] > sheetHeight.value / 2; // Position threshold to close

            if (down || farEnough) {
              onClose();
            } else {
              // Snap back to original position
              y.value = 0;
            }
          }
        },
        {
          axis: 'y',
          eventOptions: { passive: false },
        }
      );
    }
  });

  onUnmounted(() => {
    gesture?.destroy();
  });

  return { style };
}
