import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Card from '../common/Card';
import { Colors } from '../../constants';
import { Payment } from '../../types';

interface PaymentHistoryCardProps {
  recentPayments?: Payment[];
  isLoading?: boolean;
  onViewFullHistory?: () => void;
  onPaymentPress?: (payment: Payment) => void;
  style?: ViewStyle;
}

const PaymentHistoryCard: React.FC<PaymentHistoryCardProps> = ({
  recentPayments = [],
  isLoading = false,
  onViewFullHistory,
  onPaymentPress,
  style,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'failed':
        return Colors.error;
      case 'refunded':
        return Colors.info;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'failed':
        return '❌';
      case 'refunded':
        return '↩️';
      default:
        return '💳';
    }
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'rent':
        return '🏠';
      case 'security_deposit':
        return '🛡️';
      case 'late_fee':
        return '⚠️';
      case 'utility':
        return '⚡';
      default:
        return '💳';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPaymentType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handlePaymentPress = (payment: Payment) => {
    if (onPaymentPress) {
      onPaymentPress(payment);
    }
  };

  if (isLoading) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading payment history...</Text>
        </View>
      </Card>
    );
  }

  const displayPayments = recentPayments.slice(0, 5);

  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.cardTitle}>Payment History</Text>
        {onViewFullHistory && (
          <TouchableOpacity
            onPress={onViewFullHistory}
            style={styles.viewAllButton}
            accessibilityRole="button"
            accessibilityLabel="View full payment history"
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {recentPayments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>No payment history</Text>
          <Text style={styles.emptySubtext}>Your payment records will appear here</Text>
        </View>
      ) : (
        <ScrollView style={styles.paymentsList} showsVerticalScrollIndicator={false}>
          {displayPayments.map((payment) => (
            <TouchableOpacity
              key={payment.id}
              style={styles.paymentItem}
              onPress={() => handlePaymentPress(payment)}
              disabled={!onPaymentPress}
              accessibilityRole="button"
              accessibilityLabel={`${formatPaymentType(payment.type)} payment of ${formatCurrency(payment.amount)}, ${payment.status}, ${formatDate(payment.paid_date || payment.due_date)}`}
              accessibilityHint={onPaymentPress ? 'Tap to view payment details' : 'Payment information'}
            >
              <View style={styles.paymentContent}>
                <View style={styles.paymentLeft}>
                  <View style={styles.paymentIcons}>
                    <Text style={styles.typeIcon}>
                      {getPaymentTypeIcon(payment.type)}
                    </Text>
                    <Text style={styles.statusIcon}>
                      {getStatusIcon(payment.status)}
                    </Text>
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentType}>
                      {formatPaymentType(payment.type)}
                    </Text>
                    <Text style={styles.paymentDate}>
                      {payment.paid_date 
                        ? `Paid ${formatDate(payment.paid_date)}`
                        : `Due ${formatDate(payment.due_date)}`
                      }
                    </Text>
                    {payment.payment_method && (
                      <Text style={styles.paymentMethod}>
                        via {payment.payment_method}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>
                    {formatCurrency(payment.amount)}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                    <Text style={styles.statusText}>
                      {payment.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {recentPayments.length > 5 && (
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            Showing {displayPayments.length} of {recentPayments.length} payments
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  paymentsList: {
    maxHeight: 300,
  },
  paymentItem: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  paymentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcons: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 12,
    minWidth: 32,
  },
  typeIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  statusIcon: {
    fontSize: 14,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  paymentMethod: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: Colors.textOnPrimary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  footerInfo: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default PaymentHistoryCard;