import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export function SkeletonLine({ width = '100%', height = 14, borderRadius = 7, style }) {
  const shimmer = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.75, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: '#cbd5e1' }, { opacity: shimmer }, style]}
    />
  );
}

export function SkeletonCard({ accentColor = '#e2e8f0', style }) {
  return (
    <View style={[styles.card, { borderLeftColor: accentColor }, style]}>
      <View style={styles.headerRow}>
        <SkeletonLine width="55%" height={15} />
        <SkeletonLine width="18%" height={24} borderRadius={6} />
      </View>
      <View style={{ marginTop: 14 }}>
        <SkeletonLine width="100%" height={12} style={{ marginBottom: 7 }} />
        <SkeletonLine width="65%" height={12} />
      </View>
      <View style={{ marginTop: 14 }}>
        <SkeletonLine width="100%" height={36} borderRadius={10} />
      </View>
    </View>
  );
}

export function SkeletonRow({ style }) {
  return (
    <View style={[styles.row, style]}>
      <SkeletonLine width={32} height={32} borderRadius={16} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <SkeletonLine width="60%" height={14} style={{ marginBottom: 6 }} />
        <SkeletonLine width="40%" height={11} />
      </View>
      <SkeletonLine width={50} height={20} borderRadius={5} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
