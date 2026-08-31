import React from 'react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import CYANIDE_THEME from '../../constants/colors';

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor={CYANIDE_THEME.card}
      indicatorColor={CYANIDE_THEME.cardHover}
      labelStyle={{
        selected: { color: CYANIDE_THEME.primary },
        default: { color: CYANIDE_THEME.textMuted },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Ride</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="speedometer"
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="speedometer" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="clock.fill"
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="time" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats">
        <NativeTabs.Trigger.Label>Stats</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="chart.bar.fill"
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="bar-chart" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="garage">
        <NativeTabs.Trigger.Label>Garage</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="wrench.and.screwdriver.fill"
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="construct" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="gearshape.fill"
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="settings" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
