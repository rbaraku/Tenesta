import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showHeader?: boolean;
}

interface DashboardSectionProps {
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
  spacing?: 'none' | 'small' | 'medium' | 'large';
}

interface DashboardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2;
  spacing?: number;
  style?: ViewStyle;
}

interface DashboardCardWrapperProps {
  children: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
  span?: 'full' | 'half';
  style?: ViewStyle;
}

const { width: screenWidth } = Dimensions.get('window');

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  isLoading = false,
  onRefresh,
  refreshing = false,
  style,
  contentContainerStyle,
  showHeader = true,
}) => {
  return (
    <SafeAreaView style={[styles.container, style]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {showHeader && (title || subtitle) && (
          <View 
            style={styles.header}
            accessibilityRole="header"
          >
            {title && (
              <Text 
                style={styles.title}
                accessibilityRole="text"
                accessibilityLabel={title}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text 
                style={styles.subtitle}
                accessibilityRole="text"
                accessibilityLabel={subtitle}
              >
                {subtitle}
              </Text>
            )}
          </View>
        )}
        
        {isLoading ? (
          <View 
            style={styles.loadingContainer}
            accessibilityLabel="Loading dashboard content"
            accessibilityHint="Please wait while we load your dashboard information"
          >
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : (
          <View accessibilityRole="main">
            {children}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const DashboardSection: React.FC<DashboardSectionProps> = ({
  children,
  title,
  style,
  spacing = 'medium',
}) => {
  const getSpacingValue = () => {
    switch (spacing) {
      case 'none':
        return 0;
      case 'small':
        return 8;
      case 'medium':
        return 16;
      case 'large':
        return 24;
      default:
        return 16;
    }
  };

  return (
    <View 
      style={[styles.section, { marginBottom: getSpacingValue() }, style]}
      accessibilityRole="region"
      accessibilityLabel={title}
    >
      {title && (
        <Text 
          style={styles.sectionTitle}
          accessibilityRole="header"
          accessibilityLevel={2}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  );
};

const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  columns = 1,
  spacing = 16,
  style,
}) => {
  const childrenArray = React.Children.toArray(children);
  const rows: React.ReactNode[][] = [];
  
  // Group children into rows based on columns
  for (let i = 0; i < childrenArray.length; i += columns) {
    rows.push(childrenArray.slice(i, i + columns));
  }

  return (
    <View style={[styles.grid, style]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.gridRow, { marginBottom: spacing }]}>
          {row.map((child, childIndex) => (
            <View
              key={childIndex}
              style={[
                styles.gridItem,
                {
                  width: columns === 1 ? '100%' : `${(100 - (spacing * (columns - 1))) / columns}%`,
                  marginRight: childIndex < row.length - 1 ? spacing : 0,
                },
              ]}
            >
              {child}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const DashboardCardWrapper: React.FC<DashboardCardWrapperProps> = ({
  children,
  priority = 'medium',
  span = 'full',
  style,
}) => {
  const getPriorityStyle = () => {
    switch (priority) {
      case 'high':
        return styles.highPriority;
      case 'low':
        return styles.lowPriority;
      default:
        return {};
    }
  };

  const getSpanStyle = () => {
    if (span === 'half' && screenWidth > 600) {
      return { width: '48%' };
    }
    return { width: '100%' };
  };

  return (
    <View
      style={[
        styles.cardWrapper,
        getPriorityStyle(),
        getSpanStyle(),
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Responsive breakpoints
const isTablet = screenWidth >= 768;
const isLargeScreen = screenWidth >= 1024;

// Helper function to get responsive spacing
const getResponsiveSpacing = (base: number): number => {
  if (isLargeScreen) return base * 1.5;
  if (isTablet) return base * 1.25;
  return base;
};

// Helper function to get responsive columns
const getResponsiveColumns = (defaultColumns: number): number => {
  if (isLargeScreen) return Math.min(defaultColumns * 2, 3);
  if (isTablet) return Math.min(defaultColumns + 1, 2);
  return defaultColumns;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: getResponsiveSpacing(20),
  },
  header: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(16),
    paddingBottom: getResponsiveSpacing(24),
  },
  title: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: isTablet ? 18 : 16,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: getResponsiveSpacing(20),
  },
  sectionTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: getResponsiveSpacing(16),
  },
  grid: {
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    // Dynamic width set in component
  },
  cardWrapper: {
    marginBottom: getResponsiveSpacing(16),
  },
  highPriority: {
    // Could add special styling for high priority cards
    elevation: 3,
    shadowOpacity: 0.15,
  },
  lowPriority: {
    opacity: 0.95,
  },
});

// Export all components
export default DashboardLayout;
export { DashboardSection, DashboardGrid, DashboardCardWrapper, getResponsiveColumns, getResponsiveSpacing };