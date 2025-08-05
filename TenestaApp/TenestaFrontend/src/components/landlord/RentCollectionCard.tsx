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
import { RentCollectionData } from '../../types';

interface RentCollectionCardProps {
  collectionData?: RentCollectionData;
  isLoading?: boolean;
  onViewPayments?: () => void;
  onSendReminders?: () => void;
  style?: ViewStyle;
}

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const RentCollectionCard: React.FC<RentCollectionCardProps> = ({
  collectionData,
  isLoading = false,
  onViewPayments,
  onSendReminders,
  style,
}) => {
  if (isLoading) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading rent collection data...</Text>
        </View>
      </Card>
    );
  }

  if (!collectionData) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.cardTitle}>Rent Collection</Text>
          <Text style={styles.emptyText}>No rent data available</Text>
        </View>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${Math.round(value)}%`;
  };

  const getCollectionRateColor = (rate: number) => {
    if (rate >= 95) return Colors.success;
    if (rate >= 80) return Colors.warning;
    return Colors.error;
  };

  const collectionRate = collectionData.totalExpected > 0 
    ? (collectionData.totalCollected / collectionData.totalExpected) * 100 
    : 0;

  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.cardTitle}>Rent Collection</Text>
        <View style={[
          styles.rateBadge, 
          { backgroundColor: getCollectionRateColor(collectionRate) }
        ]}>
          <Text style={styles.rateText}>
            {formatPercent(collectionRate)} Collected
          </Text>
        </View>
      </View>

      {/* Collection Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Expected This Month</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(collectionData.totalExpected)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Collected</Text>
          <Text style={[styles.summaryValue, styles.collectedValue]}>
            {formatCurrency(collectionData.totalCollected)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Remaining</Text>
          <Text style={[styles.summaryValue, styles.remainingValue]}>
            {formatCurrency(collectionData.totalPending + collectionData.totalOverdue)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Status Breakdown */}
      <View style={styles.statusGrid}>
        <View style={styles.statusItem}>
          <Text style={[styles.statusValue, styles.pendingValue]}>
            {collectionData.pendingCount}
          </Text>
          <Text style={styles.statusLabel}>Pending</Text>
          <Text style={styles.statusAmount}>
            {formatCurrency(collectionData.totalPending)}
          </Text>
        </View>
        
        <View style={styles.statusDivider} />
        
        <View style={styles.statusItem}>
          <Text style={[styles.statusValue, styles.overdueValue]}>
            {collectionData.overdueCount}
          </Text>
          <Text style={styles.statusLabel}>Overdue</Text>
          <Text style={styles.statusAmount}>
            {formatCurrency(collectionData.totalOverdue)}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <Button
          title="View All Payments"
          onPress={onViewPayments}
          variant="secondary"
          size="small"
          style={[styles.actionButton, { flex: 1, marginRight: 8 }]}
        />
        
        {collectionData.overdueCount > 0 && (
          <Button
            title={`Send Reminders (${collectionData.overdueCount})`}
            onPress={onSendReminders}
            variant="primary"
            size="small"
            style={[styles.actionButton, { flex: 1, marginLeft: 8 }]}
          />
        )}
      </View>

      {/* Overdue Alert */}
      {collectionData.totalOverdue > 0 && (
        <View style={styles.overdueAlert}>
          <View style={styles.alertIcon}>
            <Text style={styles.alertIconText}>⚠️</Text>
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>
              {formatCurrency(collectionData.totalOverdue)} overdue from {collectionData.overdueCount} tenant{collectionData.overdueCount !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.alertSubtitle}>
              Consider sending payment reminders
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
  rateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rateText: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  summarySection: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  collectedValue: {
    color: Colors.success,
  },
  remainingValue: {
    color: Colors.warning,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  statusValue: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pendingValue: {
    color: Colors.warning,
  },
  overdueValue: {
    color: Colors.error,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  statusAmount: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  actionSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  actionButton: {
    // Flex and margin set inline
  },
  overdueAlert: {
    flexDirection: 'row',
    backgroundColor: Colors.error + '15',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
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

export default RentCollectionCard;