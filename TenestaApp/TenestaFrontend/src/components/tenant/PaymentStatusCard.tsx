import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Card from '../common/Card';
import Button from '../common/Button';
import { Colors } from '../../constants';
import { Payment } from '../../types';

interface PaymentStatusCardProps {
  paymentStatus?: Payment;
  isLoading?: boolean;
  onPayRent: () => void;
  style?: ViewStyle;
}

const PaymentStatusCard: React.FC<PaymentStatusCardProps> = ({
  paymentStatus,
  isLoading = false,
  onPayRent,
  style,
}) => {
  if (isLoading) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading payment status...</Text>
        </View>
      </Card>
    );
  }

  if (!paymentStatus) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.noPaymentContainer}>
          <Text style={styles.cardTitle}>Payment Status</Text>
          <Text style={styles.noPaymentText}>No pending payments</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>UP TO DATE</Text>
          </View>
        </View>
      </Card>
    );
  }

  const dueDate = new Date(paymentStatus.due_date);
  const isOverdue = dueDate < new Date();
  const isNearDue = !isOverdue && dueDate.getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days

  const getStatusColor = () => {
    if (isOverdue) return Colors.error;
    if (isNearDue) return Colors.warning;
    return Colors.success;
  };

  const getStatusText = () => {
    if (isOverdue) return 'OVERDUE';
    if (isNearDue) return 'DUE SOON';
    return 'UPCOMING';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
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

  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.cardTitle}>Payment Status</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>
          {paymentStatus.type === 'rent' ? 'Rent Due' : 'Amount Due'}
        </Text>
        <Text
          style={[
            styles.amountValue,
            isOverdue && styles.overdueAmount,
          ]}
        >
          {formatCurrency(paymentStatus.amount)}
        </Text>
      </View>

      <View style={styles.dateSection}>
        <Text style={styles.dateLabel}>Due Date</Text>
        <Text
          style={[
            styles.dateValue,
            isOverdue && styles.overdueText,
          ]}
        >
          {formatDate(dueDate)}
        </Text>
      </View>

      {paymentStatus.type && paymentStatus.type !== 'rent' && (
        <View style={styles.typeSection}>
          <Text style={styles.typeLabel}>Payment Type</Text>
          <Text style={styles.typeValue}>
            {paymentStatus.type.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      )}

      <Button
        title={isOverdue ? 'Pay Now - Overdue' : 'Pay Rent'}
        onPress={onPayRent}
        variant={isOverdue ? 'primary' : 'secondary'}
        style={styles.payButton}
        fullWidth
        accessibilityLabel={`Pay ${formatCurrency(paymentStatus.amount)} rent ${isOverdue ? 'overdue payment' : 'payment'}`}
        accessibilityHint="Opens payment screen to complete rent payment"
      />

      {isOverdue && (
        <Text style={styles.overdueWarning}>
          Late fees may apply. Please pay as soon as possible.
        </Text>
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
  noPaymentContainer: {
    alignItems: 'center',
  },
  noPaymentText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginVertical: 16,
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.success,
  },
  statusText: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  amountSection: {
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  overdueAmount: {
    color: Colors.error,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  overdueText: {
    color: Colors.error,
    fontWeight: '600',
  },
  typeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  typeValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  payButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  overdueWarning: {
    fontSize: 12,
    color: Colors.error,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

export default PaymentStatusCard;