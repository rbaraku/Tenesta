import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Card from '../common/Card';
import Button from '../common/Button';
import { Colors } from '../../constants';
import { MaintenanceSummary } from '../../types';

interface MaintenanceOverviewCardProps {
  maintenanceData?: MaintenanceSummary;
  isLoading?: boolean;
  onViewRequests?: () => void;
  onViewUrgent?: () => void;
  style?: ViewStyle;
}

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const MaintenanceOverviewCard: React.FC<MaintenanceOverviewCardProps> = ({
  maintenanceData,
  isLoading = false,
  onViewRequests,
  onViewUrgent,
  style,
}) => {
  if (isLoading) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading maintenance data...</Text>
        </View>
      </Card>
    );
  }

  if (!maintenanceData) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.cardTitle}>Maintenance Overview</Text>
          <Text style={styles.emptyText}>No maintenance data available</Text>
        </View>
      </Card>
    );
  }

  const getUrgencyLevel = () => {
    if (maintenanceData.urgentRequests > 0) return 'urgent';
    if (maintenanceData.pendingRequests > 5) return 'high';
    if (maintenanceData.pendingRequests > 0) return 'medium';
    return 'low';
  };

  const getStatusColor = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case 'urgent':
        return Colors.error;
      case 'high':
        return Colors.warning;
      case 'medium':
        return Colors.info;
      default:
        return Colors.success;
    }
  };

  const getStatusText = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case 'urgent':
        return 'Urgent Attention Needed';
      case 'high':
        return 'High Activity';
      case 'medium':
        return 'Normal Activity';
      default:
        return 'All Clear';
    }
  };

  const urgencyLevel = getUrgencyLevel();
  const completionRate = maintenanceData.totalRequests > 0 
    ? ((maintenanceData.totalRequests - maintenanceData.pendingRequests - maintenanceData.inProgressRequests) / maintenanceData.totalRequests) * 100
    : 0;

  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.cardTitle}>Maintenance Overview</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getStatusColor(urgencyLevel) }
        ]}>
          <Text style={styles.statusText}>
            {getStatusText(urgencyLevel)}
          </Text>
        </View>
      </View>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{maintenanceData.totalRequests}</Text>
          <Text style={styles.statLabel}>Total Requests</Text>
          <Text style={styles.statSubtext}>This Month</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.pendingValue]}>
            {maintenanceData.pendingRequests}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.statSubtext}>Need Assignment</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, maintenanceData.urgentRequests > 0 ? styles.urgentValue : styles.normalValue]}>
            {maintenanceData.urgentRequests}
          </Text>
          <Text style={styles.statLabel}>Urgent</Text>
          <Text style={styles.statSubtext}>High Priority</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Performance Metrics */}
      <View style={styles.metricsSection}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>In Progress</Text>
          <Text style={styles.metricValue}>
            {maintenanceData.inProgressRequests} requests
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Avg Resolution Time</Text>
          <Text style={styles.metricValue}>
            {maintenanceData.averageResolutionTime} days
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Completion Rate</Text>
          <Text style={[styles.metricValue, completionRate >= 90 ? styles.goodRate : styles.poorRate]}>
            {Math.round(completionRate)}%
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <Button
          title="View All Requests"
          onPress={onViewRequests}
          variant="secondary"
          size="small" 
          style={[styles.actionButton, { flex: 1, marginRight: 8 }]}
        />
        
        {maintenanceData.urgentRequests > 0 && (
          <Button
            title={`Urgent (${maintenanceData.urgentRequests})`}
            onPress={onViewUrgent}
            variant="primary"
            size="small"
            style={[styles.actionButton, { flex: 1, marginLeft: 8 }]}
          />
        )}
      </View>

      {/* Urgent Alert */}
      {maintenanceData.urgentRequests > 0 && (
        <View style={styles.urgentAlert}>
          <View style={styles.alertIcon}>
            <Text style={styles.alertIconText}>🚨</Text>
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>
              {maintenanceData.urgentRequests} urgent request{maintenanceData.urgentRequests !== 1 ? 's' : ''} need immediate attention
            </Text>
            <Text style={styles.alertSubtitle}>
              Review and assign contractors quickly
            </Text>
          </View>
        </View>
      )}

      {/* High Activity Warning */}
      {maintenanceData.monthlyRequestCount > 20 && (
        <View style={styles.activityWarning}>
          <View style={styles.alertIcon}>
            <Text style={styles.alertIconText}>📈</Text>
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>
              High maintenance activity this month
            </Text>
            <Text style={styles.alertSubtitle}>
              {maintenanceData.monthlyRequestCount} requests - consider preventive maintenance
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: isTablet ? 24 : 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: '600',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: Colors.textOnPrimary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  statValue: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  pendingValue: {
    color: Colors.warning,
  },
  urgentValue: {
    color: Colors.error,
  },
  normalValue: {
    color: Colors.success,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  metricsSection: {
    marginBottom: 20,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  goodRate: {
    color: Colors.success,
  },
  poorRate: {
    color: Colors.error,
  },
  actionSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  actionButton: {
    // Flex and margin set inline
  },
  urgentAlert: {
    flexDirection: 'row',
    backgroundColor: Colors.error + '15',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    marginBottom: 8,
  },
  activityWarning: {
    flexDirection: 'row',
    backgroundColor: Colors.warning + '15',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  alertIcon: {
    marginRight: 12,
    justifyContent: 'center',
  },
  alertIconText: {
    fontSize: 20,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default MaintenanceOverviewCard;