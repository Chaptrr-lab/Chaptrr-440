import { Href } from 'expo-router';
import { Platform } from 'react-native';

type RouterLike = {
  back: () => void;
  replace: (href: Href) => void;
  canGoBack?: () => boolean;
};

export function goBackOrFallback(router: RouterLike, fallbackHref: Href) {
  const canUseBrowserHistory = Platform.OS === 'web' && typeof window !== 'undefined' && window.history.length > 1;
  const canGoBack = Platform.OS === 'web' ? canUseBrowserHistory : (router.canGoBack?.() ?? false);

  console.log('goBackOrFallback', {
    canGoBack,
    fallbackHref,
    platform: Platform.OS,
  });

  if (canGoBack) {
    router.back();
    return;
  }

  router.replace(fallbackHref);
}
