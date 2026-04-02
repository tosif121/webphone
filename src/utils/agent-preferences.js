const COLOR_THEME_VALUES = ['default', 'blue', 'green', 'amber', 'rose', 'purple', 'orange', 'teal'];

export const DEFAULT_AGENT_UI_PREFERENCES = {
  leadViewMode: 'list',
  defaultMainTab: 'callInfo',
  defaultWorkspaceTab: 'callInfo',
  dialerDockMode: 'right',
  dialerLayoutMode: 'overlay',
  themeMode: 'light',
  colorTheme: 'default',
};

export function normalizeAgentUiPreferences(rawPreferences = {}) {
  const source = rawPreferences && typeof rawPreferences === 'object' ? rawPreferences : {};
  const leadViewMode = ['list', 'smart'].includes(
    String(source.leadViewMode || '')
      .trim()
      .toLowerCase(),
  )
    ? String(source.leadViewMode).trim().toLowerCase()
    : DEFAULT_AGENT_UI_PREFERENCES.leadViewMode;
  const resolvedDefaultTab = String(source.defaultWorkspaceTab || source.defaultMainTab || '').trim();
  const defaultWorkspaceTab = ['callInfo', 'leads'].includes(resolvedDefaultTab)
    ? resolvedDefaultTab
    : resolvedDefaultTab === 'allLeads'
      ? 'leads'
      : DEFAULT_AGENT_UI_PREFERENCES.defaultWorkspaceTab;
  const dialerDockMode = ['left', 'right', 'floating'].includes(String(source.dialerDockMode || '').trim())
    ? String(source.dialerDockMode).trim()
    : DEFAULT_AGENT_UI_PREFERENCES.dialerDockMode;
  const dialerLayoutMode = ['overlay', 'docked'].includes(String(source.dialerLayoutMode || '').trim())
    ? String(source.dialerLayoutMode).trim()
    : DEFAULT_AGENT_UI_PREFERENCES.dialerLayoutMode;
  const themeMode = ['light', 'dark', 'system'].includes(
    String(source.themeMode || '')
      .trim()
      .toLowerCase(),
  )
    ? String(source.themeMode).trim().toLowerCase()
    : DEFAULT_AGENT_UI_PREFERENCES.themeMode;
  const colorTheme = COLOR_THEME_VALUES.includes(String(source.colorTheme || '').trim())
    ? String(source.colorTheme).trim()
    : DEFAULT_AGENT_UI_PREFERENCES.colorTheme;

  return {
    leadViewMode,
    defaultMainTab: defaultWorkspaceTab,
    defaultWorkspaceTab,
    dialerDockMode,
    dialerLayoutMode,
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

    const finalPreferences = normalizeAgentUiPreferences({
      ...DEFAULT_AGENT_UI_PREFERENCES,
      ...tokenPreferences,
      ...(parsedLocalPreferences || {}),
    });

    return finalPreferences;
  } catch (error) {
    console.warn('Failed to restore agent UI preferences:', error);
    return { ...DEFAULT_AGENT_UI_PREFERENCES };
  }
}

export function applyAgentUiPreferencesToDom(preferences) {
  if (typeof window === 'undefined') return;

  const normalized = normalizeAgentUiPreferences(preferences);
  /* console.log('[Preferences] Applying and saving preferences:', normalized); */
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
