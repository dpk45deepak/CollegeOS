import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPreferences, savePreferences } from "../lib/preferences";

const storageMock: Record<string, string> = {};
const fakeLocalStorage = {
  getItem: (key: string) => storageMock[key] ?? null,
  setItem: (key: string, val: string) => {
    storageMock[key] = val;
  },
  removeItem: (key: string) => {
    delete storageMock[key];
  },
  clear: () => {
    Object.keys(storageMock).forEach((k) => delete storageMock[k]);
  },
};

const dispatchMock = vi.fn();
if (typeof global.window === "undefined") {
  (global as unknown as Record<string, unknown>).window = global;
}
(global.window as unknown as Record<string, unknown>).dispatchEvent = dispatchMock;
(global as unknown as Record<string, unknown>).localStorage = fakeLocalStorage;
if (typeof global.CustomEvent === "undefined") {
  (global as unknown as Record<string, unknown>).CustomEvent = class<T = unknown> {
    type: string;
    detail?: T;
    constructor(type: string, init?: { detail?: T }) {
      this.type = type;
      this.detail = init?.detail;
    }
  };
}

describe("User Preferences Helper", () => {
  beforeEach(() => {
    fakeLocalStorage.clear();
    dispatchMock.mockClear();
  });

  it("returns safe defaults when localStorage is empty or corrupted", () => {
    expect(getPreferences()).toEqual({
      aiSuggestions: true,
      citationVerbosity: true,
      attendanceAlerts: true,
    });

    fakeLocalStorage.setItem("college_os_preferences", "{not-valid-json");
    expect(getPreferences()).toEqual({
      aiSuggestions: true,
      citationVerbosity: true,
      attendanceAlerts: true,
    });
  });

  it("persists preferences to localStorage and dispatches sync event", () => {
    const updated = {
      aiSuggestions: false,
      citationVerbosity: false,
      attendanceAlerts: true,
    };
    savePreferences(updated);

    expect(getPreferences()).toEqual(updated);
    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect((dispatchMock.mock.calls[0][0] as CustomEvent).type).toBe("college_os_prefs_updated");
    expect((dispatchMock.mock.calls[0][0] as CustomEvent).detail).toEqual(updated);
  });
});
