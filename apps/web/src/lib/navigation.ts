
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface NavigationOptions {
  replace?: boolean;
  scroll?: boolean;
  focus?: boolean;
}

export function navigateTo(
  router: AppRouterInstance,
  path: string,
  options: NavigationOptions = {}
) {
  const { replace = false, scroll = true, focus = true } = options;

  if (replace) {
    router.replace(path, { scroll });
  } else {
    router.push(path, { scroll });
  }

  if (focus && typeof document !== 'undefined') {
    // Focus management after navigation
    requestAnimationFrame(() => {
      const mainContent = document.querySelector('main');
      if (mainContent instanceof HTMLElement) {
        mainContent.focus({ preventScroll: true });
      }
    });
  }
}
