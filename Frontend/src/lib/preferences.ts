export interface UserPreferences {
  aiSuggestions: boolean;
  citationVerbosity: boolean;
  attendanceAlerts: boolean;
}

const PREFS_KEY = "college_os_preferences";

const DEFAULT_PREFS: UserPreferences = {
  aiSuggestions: true,
  citationVerbosity: true,
  attendanceAlerts: true,
};

export function getPreferences(): UserPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    return {
      aiSuggestions: typeof parsed.aiSuggestions === "boolean" ? parsed.aiSuggestions : true,
      citationVerbosity: typeof parsed.citationVerbosity === "boolean" ? parsed.citationVerbosity : true,
      attendanceAlerts: typeof parsed.attendanceAlerts === "boolean" ? parsed.attendanceAlerts : true,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent("college_os_prefs_updated", { detail: prefs }));
  } catch {
    // ignore storage errors
  }
}
