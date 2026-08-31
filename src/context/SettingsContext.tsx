import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_THEME, LIGHT_THEME, ThemeType } from '../constants/colors';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface SettingsState {
  speedUnit: 'kmh' | 'mph';
  distanceUnit: 'km' | 'mi';
  speedAlertEnabled: boolean;
  speedLimitKmh: number;
  autoPauseEnabled: boolean;
  autoPauseSeconds: number;
  accuracyThresholdMeters: number;
  simulatedRideMode: boolean;
  orientation: 'auto' | 'portrait' | 'landscape';
  themeMode: ThemeMode;
}

const DEFAULT_SETTINGS: SettingsState = {
  speedUnit: 'kmh',
  distanceUnit: 'km',
  speedAlertEnabled: true,
  speedLimitKmh: 80,
  autoPauseEnabled: true,
  autoPauseSeconds: 5,
  accuracyThresholdMeters: 50,
  simulatedRideMode: false,
  orientation: 'auto',
  themeMode: 'dark',
};

interface SettingsContextType {
  settings: SettingsState;
  theme: ThemeType;
  updateSettings: (newSettings: Partial<SettingsState>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  theme: DARK_THEME,
  updateSettings: async () => {},
});

const SETTINGS_KEY = '@ridemeter_user_settings';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((stored) => {
      if (stored) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        } catch {}
      }
    });
  }, []);

  const updateSettings = async (newSettings: Partial<SettingsState>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  };

  // Determine active theme palette
  let theme: ThemeType = DARK_THEME;
  if (settings.themeMode === 'light') {
    theme = LIGHT_THEME;
  } else if (settings.themeMode === 'system') {
    theme = systemColorScheme === 'light' ? LIGHT_THEME : DARK_THEME;
  } else {
    theme = DARK_THEME;
  }

  return (
    <SettingsContext.Provider value={{ settings, theme, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
