import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AXM } from '@/theme/axm';

interface ScreenBgProps {
  children: React.ReactNode;
  scrollable?: boolean;
}

export function ScreenBg({ children, scrollable = true }: ScreenBgProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.bg}>
        {scrollable ? (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {children}
            <View style={styles.bottomPad} />
          </ScrollView>
        ) : (
          <View style={styles.fill}>{children}</View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AXM.bg,
  },
  bg: {
    flex: 1,
    backgroundColor: AXM.bg,
  },
  scroll: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  bottomPad: {
    height: 20,
  },
});
