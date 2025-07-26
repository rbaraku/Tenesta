import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ApiService } from '../../services/api';

// Custom Card Component
const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

// Payment Item Component
const PaymentItem = ({ payment, onPayPress }) => (
  <View style={styles.paymentItem}>
    <View style={styles.paymentInfo}>
      <Text style={styles.paymentAmount}>
        ${payment.amount?.toLocaleString()}
      </Text>
      <Text style={styles.paymentType}>Monthly Rent</Text>
      <Text style={styles.paymentDue}>
        Due: {new Date(payment.due_date).toLocaleDateString()}
      </Text>
    </View>
    <View style={styles.paymentActions}>
      <View style={[
        styles.statusBadge,
        getStatusBadgeStyle(payment.status)
      ]}>
        <Text style={[
          styles.statusText,
          getStatusTextStyle(payment.status)
        ]}>
          {payment.status?.toUpperCase()}
        </Text>
      </View>
      {payment.status === 'pending' && (
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => onPayPress(payment)}
        >
          <Text style={styles.payButtonText}>Pay Now</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'paid': return styles.paidBadge;
    case 'pending': return styles.pendingBadge;
    case 'late': return styles.lateBadge;
    default: return styles.pendingBadge;
  }
};

const getStatusTextStyle = (status) => {
  switch (status) {
    case 'paid': return styles.paidText;
    case 'pending': return styles.pendingText;
    case 'late': return styles.lateText;
    default: return styles.pendingText;
  }
};

export default function PaymentScreen({ route, navigation }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { paymentId } = route?.params || {};

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      // Mock payment data since API might not be fully implemented
      const mockPayments = [
        {
          id: '1',
          amount: 2500,
          due_date: '2024-02-01',
          status: 'pending'
        },
        {
          id: '2',
          amount: 2500,
          due_date: '2024-01-01',
          status: 'paid',
          paid_date: '2023-12-28'
        },
        {
          id: '3',
          amount: 2500,
          due_date: '2023-12-01',
          status: 'paid',
          paid_date: '2023-11-29'
        }
      ];

      setPayments(mockPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
      Alert.alert('Error', 'Failed to load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePayment = async (payment) => {
    try {
      Alert.alert(
        'Make Payment',
        `Pay $${payment.amount?.toLocaleString()} for monthly rent?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pay Now',
            onPress: async () => {
              // In real app, this would integrate with Stripe
              Alert.alert(
                'Payment Successful',
                'Your payment has been processed successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Update payment status locally
                      setPayments(prev =>
                        prev.map(p =>
                          p.id === payment.id
                            ? { ...p, status: 'paid', paid_date: new Date().toISOString() }
                            : p
                        )
                      );
                    }
                  }
                ]
              );
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Payment Error', 'Failed to process payment');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#800020" />
        <Text style={styles.loadingText}>Loading payments...</Text>
      </View>
    );
  }

  const upcomingPayments = payments.filter(p => p.status === 'pending');
  const paidPayments = payments.filter(p => p.status === 'paid');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Payments</Text>
          <Text style={styles.subtitle}>Manage your rent payments</Text>
        </View>

        {/* Payment Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Payment Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {upcomingPayments.length}
              </Text>
              <Text style={styles.summaryLabel}>Due</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.paidValue]}>
                {paidPayments.length}
              </Text>
              <Text style={styles.summaryLabel}>Paid</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                $2,500
              </Text>
              <Text style={styles.summaryLabel}>Monthly Rent</Text>
            </View>
          </View>
        </Card>

        {/* Upcoming Payments */}
        {upcomingPayments.length > 0 && (
          <Card>
            <Text style={styles.cardTitle}>Upcoming Payments</Text>
            {upcomingPayments.map((payment) => (
              <PaymentItem
                key={payment.id}
                payment={payment}
                onPayPress={handlePayment}
              />
            ))}
          </Card>
        )}

        {/* Payment History */}
        <Card>
          <Text style={styles.cardTitle}>Payment History</Text>
          {paidPayments.length > 0 ? (
            paidPayments.map((payment) => (
              <PaymentItem
                key={payment.id}
                payment={payment}
                onPayPress={handlePayment}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No payment history yet</Text>
          )}
        </Card>

        {/* Payment Methods */}
        <Card style={styles.lastCard}>
          <Text style={styles.cardTitle}>Payment Methods</Text>
          <TouchableOpacity
            style={styles.addMethodButton}
            onPress={() => Alert.alert('Coming Soon', 'Payment method management will be available soon')}
          >
            <Text style={styles.addMethodText}>+ Add Payment Method</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#800020',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryCard: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#800020',
  },
  lastCard: {
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#800020',
    marginBottom: 4,
  },
  paidValue: {
    color: '#059669',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  paymentType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  paymentDue: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  paidBadge: {
    backgroundColor: '#D1FAE5',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  lateBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paidText: {
    color: '#065F46',
  },
  pendingText: {
    color: '#92400E',
  },
  lateText: {
    color: '#991B1B',
  },
  payButton: {
    backgroundColor: '#800020',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  addMethodButton: {
    borderWidth: 2,
    borderColor: '#800020',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#800020',
  },
});
