import React from 'react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSettings } from '../../context/SettingsContext';

export default function TabLayout() {
  const { theme } = useSettings();

  return (
    <NativeTabs
      backgroundColor={theme.card}
      indicatorColor={theme.cardHover}
      labelStyle={{
        selected: { color: theme.primary },
        default: { color: theme.textMuted },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Ride</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="speedometer"
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="speedometer" />}
          selectedColor={theme.primary}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="clock.fill"
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="time" />}
          selectedColor={theme.primary}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats">
        <NativeTabs.Trigger.Label>Stats</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="chart.bar.fill"
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="bar-chart" />}
          selectedColor={theme.primary}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="garage">
        <NativeTabs.Trigger.Label>Garage</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="wrench.and.screwdriver.fill"
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="construct" />}
          selectedColor={theme.primary}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="gearshape.fill"
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="settings" />}
          selectedColor={theme.primary}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
