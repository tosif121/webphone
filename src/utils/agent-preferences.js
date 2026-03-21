const COLOR_THEME_VALUES = ['default', 'blue', 'green', 'amber', 'rose', 'purple', 'orange', 'teal'];

export const DEFAULT_AGENT_UI_PREFERENCES = {
  leadViewMode: 'list',
  defaultMainTab: 'callInfo',
  themeMode: 'light',
  colorTheme: 'default',
};

export function normalizeAgentUiPreferences(rawPreferences = {}) {
  const source = rawPreferences && typeof rawPreferences === 'object' ? rawPreferences : {};
  const leadViewMode = ['list', 'smart'].includes(String(source.leadViewMode || '').trim().toLowerCase())
    ? String(source.leadViewMode).trim().toLowerCase()
    : DEFAULT_AGENT_UI_PREFERENCES.leadViewMode;
  const defaultMainTab = ['callInfo', 'allLeads'].includes(String(source.defaultMainTab || '').trim())
    ? String(source.defaultMainTab).trim()
    : DEFAULT_AGENT_UI_PREFERENCES.defaultMainTab;
  const themeMode = ['light', 'dark', 'system'].includes(String(source.themeMode || '').trim().toLowerCase())
    ? String(source.themeMode).trim().toLowerCase()
    : DEFAULT_AGENT_UI_PREFERENCES.themeMode;
  const colorTheme = COLOR_THEME_VALUES.includes(String(source.colorTheme || '').trim())
    ? String(source.colorTheme).trim()
    : DEFAULT_AGENT_UI_PREFERENCES.colorTheme;

  return {
    leadViewMode,
    defaultMainTab,
    themeMode,
    colorTheme,
  };
}

export function getStoredTokenPayload() {
  if (typeof window === 'undefined') return null;

  try {
    const rawToken = localStorage.getItem('token');
    return rawToken ? JSON.parse(rawToken) : null;
  } catch (error) {
    console.warn('Failed to parse stored token payload:', error);
    return null;
  }
}

export function patchStoredTokenPreferences(preferences) {
  if (typeof window === 'undefined') return;

  try {
    const tokenPayload = getStoredTokenPayload();
    if (!tokenPayload?.userData) return;
    tokenPayload.userData.uiPreferences = normalizeAgentUiPreferences(preferences);
    localStorage.setItem('token', JSON.stringify(tokenPayload));
  } catch (error) {
    console.warn('Failed to patch token preferences:', error);
  }
}

export function getStoredAgentUiPreferences() {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_AGENT_UI_PREFERENCES };
  }

  try {
    const rawLocalPreferences = localStorage.getItem('agent-ui-preferences');
    const parsedLocalPreferences = rawLocalPreferences ? JSON.parse(rawLocalPreferences) : null;
    const tokenPreferences = getStoredTokenPayload()?.userData?.uiPreferences || {};
    return normalizeAgentUiPreferences({
      ...DEFAULT_AGENT_UI_PREFERENCES,
      ...tokenPreferences,
      ...(parsedLocalPreferences || {}),
    });
  } catch (error) {
    console.warn('Failed to restore agent UI preferences:', error);
    return { ...DEFAULT_AGENT_UI_PREFERENCES };
  }
}

export function applyAgentUiPreferencesToDom(preferences) {
  if (typeof window === 'undefined') return;

  const normalized = normalizeAgentUiPreferences(preferences);
  localStorage.setItem('agent-ui-preferences', JSON.stringify(normalized));

  if (normalized.themeMode) {
    localStorage.setItem('theme', normalized.themeMode);
  }

  if (normalized.colorTheme) {
    localStorage.setItem('color-theme', normalized.colorTheme);
    const html = document.documentElement;
    html.setAttribute('data-color-theme', normalized.colorTheme);
    COLOR_THEME_VALUES.forEach((themeValue) => html.classList.remove(themeValue));
    if (normalized.colorTheme !== 'default') {
      html.classList.add(normalized.colorTheme);
    }
  }

  patchStoredTokenPreferences(normalized);
  window.dispatchEvent(
    new CustomEvent('agent-profile-updated', {
      detail: normalized,
    }),
  );
}
