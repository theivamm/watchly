import { useState, useEffect, useCallback } from "react";
import {
  type Theme,
  type AccentColor,
  getStoredTheme,
  getStoredAccent,
  setStoredTheme,
  setStoredAccent,
  applyTheme,
  applyAccent,
} from "@/lib/theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [accent, setAccent] = useState<AccentColor>(getStoredAccent);

  const changeTheme = useCallback((t: Theme) => {
    setTheme(t);
    setStoredTheme(t);
  }, []);

  const changeAccent = useCallback((a: AccentColor) => {
    setAccent(a);
    setStoredAccent(a);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  return { theme, accent, changeTheme, changeAccent };
}
