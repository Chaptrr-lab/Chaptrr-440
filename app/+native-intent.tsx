export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }) {
  const normalizedPath = typeof path === 'string' ? path.trim() : '';
  const cleanedPath = normalizedPath.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+/g, '/');

  console.log('[redirectSystemPath] resolving path', {
    path,
    initial,
    cleanedPath,
  });

  if (!cleanedPath || cleanedPath === '/') {
    return '/';
  }

  return cleanedPath;
}
