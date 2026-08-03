export const WEBPHONE_BASE_PATH = '/webphone/mobile';

export function withWebphoneBasePath(path = '/') {
  const normalizedPath = String(path || '/').startsWith('/') ? String(path || '/') : `/${String(path || '/')}`;
  return normalizedPath === '/' ? WEBPHONE_BASE_PATH : `${WEBPHONE_BASE_PATH}${normalizedPath}`;
}

export const WEBPHONE_SERVICE_WORKER_PATH = withWebphoneBasePath('/sw.js');
