import { Href } from 'expo-router';

type RouterLike = {
  back: () => void;
  replace: (href: Href) => void;
  canGoBack?: () => boolean;
};

export function goBackOrFallback(router: RouterLike, fallbackHref: Href) {
  const canGoBack = router.canGoBack?.() ?? false;

  console.log('goBackOrFallback', {
    canGoBack,
    fallbackHref,
  });

  if (canGoBack) {
    router.back();
    return;
  }

  router.replace(fallbackHref);
}
