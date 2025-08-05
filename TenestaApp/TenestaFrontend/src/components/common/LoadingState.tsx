import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  style?: ViewStyle;
  showMessage?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'large',
  style,
  showMessage = true,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator
        size={size}
        color={Colors.primary}
        style={styles.spinner}
      />
      {showMessage && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
};

// Skeleton loading component for content placeholders
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

// Card skeleton for loading card content
export const CardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardSkeleton}>
      <Skeleton width="60%" height={20} style={styles.skeletonMargin} />
      <Skeleton width="100%" height={16} style={styles.skeletonMargin} />
      <Skeleton width="80%" height={16} style={styles.skeletonMargin} />
      <View style={styles.skeletonRow}>
        <Skeleton width="45%" height={16} />
        <Skeleton width="30%" height={16} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 60,
  },
  spinner: {
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  skeleton: {
    backgroundColor: Colors.surfaceDark,
    opacity: 0.7,
  },
  cardSkeleton: {
    padding: 20,
  },
  skeletonMargin: {
    marginBottom: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});

export default LoadingState;