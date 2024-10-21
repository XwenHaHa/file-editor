import { tryOnMounted, tryOnUnmounted, useDebounceFn } from "@vueuse/core";

function useWindowSizeFn(fn, options = {}) {
  const { wait = 150, immediate } = options;
  let handler = () => {
    fn();
  };
  const handleSize = useDebounceFn(handler, wait);
  handler = handleSize;

  const start = () => {
    if (immediate) {
      handler();
    }
    window.addEventListener("resize", handler);
  };

  const stop = () => {
    window.removeEventListener("resize", handler);
  };

  tryOnMounted(() => {
    start();
  });

  tryOnUnmounted(() => {
    stop();
  });
  return { start, stop };
}

export { useWindowSizeFn };
