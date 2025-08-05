import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../../store';
import { fetchPayments } from '../../store/slices/paymentSlice';
import { apiService } from '../../services/api';
import { Colors, Spacing, Typography } from '../../constants';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import { Payment } from '../../types';

type PaymentsScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account' | 'digital_wallet';
  last4: string;
  brand?: string;
  isDefault: boolean;
}

const PaymentsScreen: React.FC<PaymentsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { payments, isLoading, error } = useSelector((state: RootState) => state.payment);
  const { user } = useSelector((state: RootState) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'credit_card',
      last4: '4242',
      brand: 'Visa',
      isDefault: true,
    },
    {
      id: '2',
      type: 'bank_account',
      last4: '6789',
      isDefault: false,
    },
  ]);

  useEffect(() => {
    dispatch(fetchPayments());
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchPayments());
    setRefreshing(false);
  }, [dispatch]);

  const handlePayNow = async (payment: Payment) => {
    try {
      Alert.alert(
        'Confirm Payment',
        `Pay $${payment.amount} for ${payment.type}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Pay Now', 
            onPress: async () => {
              // Simulate payment processing
              Alert.alert(
                'Processing Payment',
                'Your payment is being processed...',
                [{ text: 'OK' }]
              );
              
              // In a real app, this would integrate with Stripe
              const result = await apiService.processPayment({
                tenancy_id: payment.id,
                amount: payment.amount,
                payment_method: 'stripe',
              });
              
              if (result.error) {
                Alert.alert('Payment Failed', result.error);
              } else {
                Alert.alert('Payment Successful', 'Your payment has been processed successfully.');
                dispatch(fetchPayments()); // Refresh payments
              }
            }
          },
        ]
      );
    } catch (error) {
      Alert.alert('Payment Error', 'Unable to process payment. Please try again.');
    }
  };

  const handleSetupAutoPay = () => {
    Alert.alert(
      'Auto-Pay Setup',
      'Set up automatic payments to never miss a due date.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Set Up Auto-Pay', onPress: () => {
          Alert.alert('Feature Coming Soon', 'Auto-pay setup will be available soon.');
        }},
      ]
    );
  };

  const handleAddPaymentMethod = () => {
    Alert.alert('Add Payment Method', 'Payment method management coming soon.');
  };

  const handleSchedulePayment = (payment: Payment) => {
    Alert.alert(
      'Schedule Payment',
      'Schedule this payment for a future date.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Schedule', onPress: () => {
          Alert.alert('Feature Coming Soon', 'Payment scheduling will be available soon.');
        }},
      ]
    );
  };

  const getPaymentStatusInfo = (payment: Payment) => {
    const dueDate = new Date(payment.due_date);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    switch (payment.status) {
      case 'completed':
        return {
          color: Colors.success,
          text: 'PAID',
          description: payment.paid_date ? `Paid on ${new Date(payment.paid_date).toLocaleDateString()}` : 'Payment completed',
        };
      case 'pending':
        if (daysUntilDue < 0) {
          return {
            color: Colors.error,
            text: 'OVERDUE',
            description: `${Math.abs(daysUntilDue)} days overdue`,
          };
        } else if (daysUntilDue === 0) {
          return {
            color: Colors.warning,
            text: 'DUE TODAY',
            description: 'Payment due today',
          };
        } else if (daysUntilDue <= 3) {
          return {
            color: Colors.warning,
            text: 'DUE SOON',
            description: `Due in ${daysUntilDue} days`,
          };
        } else {
          return {
            color: Colors.primary,
            text: 'UPCOMING',
            description: `Due in ${daysUntilDue} days`,
          };
        }
      default:
        return {
          color: Colors.textLight,
          text: 'UNKNOWN',
          description: 'Status unknown',
        };
    }
  };

  const renderPaymentCard = (payment: Payment) => {
    const statusInfo = getPaymentStatusInfo(payment);
    const dueDate = new Date(payment.due_date);

    return (
      <TouchableOpacity
        key={payment.id}
        onPress={() => {
          setSelectedPayment(payment);
          setShowPaymentModal(true);
        }}
        style={styles.paymentCardTouchable}
      >
        <Card style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentAmount}>${payment.amount}</Text>
              <Text style={styles.paymentType}>{payment.type.toUpperCase()}</Text>
            </View>
            <View style={styles.paymentStatus}>
              <Text style={[styles.statusTag, { backgroundColor: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>

          <View style={styles.paymentDetails}>
            <Text style={styles.paymentDueDate}>
              Due: {dueDate.toLocaleDateString()}
            </Text>
            <Text style={styles.paymentDescription}>
              {statusInfo.description}
            </Text>
          </View>

          {payment.status === 'pending' && (
            <View style={styles.paymentActions}>
              <Button
                title="Pay Now"
                variant="primary"
                size="small"
                onPress={() => handlePayNow(payment)}
                style={styles.actionButton}
              />
              <Button
                title="Schedule"
                variant="outline"
                size="small"
                onPress={() => handleSchedulePayment(payment)}
                style={styles.actionButton}
              />
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderPaymentMethods = () => (
    <Card style={styles.paymentMethodsCard}>
      <Text style={styles.cardTitle}>Payment Methods</Text>
      {paymentMethods.map(method => (
        <View key={method.id} style={styles.paymentMethodItem}>
          <View style={styles.methodInfo}>
            <Text style={styles.methodIcon}>
              {method.type === 'credit_card' ? '💳' : 
               method.type === 'bank_account' ? '🏦' : '📱'}
            </Text>
            <View style={styles.methodDetails}>
              <Text style={styles.methodType}>
                {method.type === 'credit_card' ? `${method.brand} ****${method.last4}` :
                 method.type === 'bank_account' ? `Bank Account ****${method.last4}` :
                 `Digital Wallet ****${method.last4}`}
              </Text>
              {method.isDefault && (
                <Text style={styles.defaultLabel}>Default</Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.methodAction}>
            <Text style={styles.methodActionText}>Edit</Text>
          </TouchableOpacity>
        </View>
      ))}
      <Button
        title="Add Payment Method"
        variant="outline"
        onPress={handleAddPaymentMethod}
        style={styles.addMethodButton}
      />
    </Card>
  );

  const renderAutoPaySection = () => (
    <Card style={styles.autoPayCard}>
      <Text style={styles.cardTitle}>Auto-Pay</Text>
      <Text style={styles.autoPayDescription}>
        Never miss a payment again. Set up automatic payments to be charged to your default payment method.
      </Text>
      <Button
        title="Set Up Auto-Pay"
        variant="primary"
        onPress={handleSetupAutoPay}
        style={styles.autoPayButton}
      />
    </Card>
  );

  const pendingPayments = payments?.filter(p => p.status === 'pending') || [];
  const completedPayments = payments?.filter(p => p.status === 'completed') || [];

  if (isLoading && (!payments || payments.length === 0)) {
    return <LoadingState message="Loading payments..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💳 Payments</Text>
        <Text style={styles.subtitle}>
          {pendingPayments.length} pending • {completedPayments.length} completed
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Pending Payments */}
        {pendingPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Payments</Text>
            {pendingPayments.map(renderPaymentCard)}
          </View>
        )}

        {/* Auto-Pay Section */}
        {renderAutoPaySection()}

        {/* Payment Methods */}
        {renderPaymentMethods()}

        {/* Payment History */}
        {completedPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {completedPayments.slice(0, 10).map(renderPaymentCard)}
            {completedPayments.length > 10 && (
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All History</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Payment Detail Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContainer}>
          {selectedPayment && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Payment Details</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <Card style={styles.detailCard}>
                  <Text style={styles.detailAmount}>${selectedPayment.amount}</Text>
                  <Text style={styles.detailType}>{selectedPayment.type.toUpperCase()}</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Due Date:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedPayment.due_date).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[
                      styles.detailValue,
                      { color: getPaymentStatusInfo(selectedPayment).color }
                    ]}>
                      {getPaymentStatusInfo(selectedPayment).text}
                    </Text>
                  </View>
                  
                  {selectedPayment.paid_date && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Paid Date:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedPayment.paid_date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </Card>

                {selectedPayment.status === 'pending' && (
                  <View style={styles.modalActions}>
                    <Button
                      title="Pay Now"
                      variant="primary"
                      onPress={() => {
                        setShowPaymentModal(false);
                        handlePayNow(selectedPayment);
                      }}
                      style={styles.modalActionButton}
                    />
                    <Button
                      title="Schedule Payment"
                      variant="outline"
                      onPress={() => {
                        setShowPaymentModal(false);
                        handleSchedulePayment(selectedPayment);
                      }}
                      style={styles.modalActionButton}
                    />
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  paymentCardTouchable: {
    marginBottom: Spacing.md,
  },
  paymentCard: {
    padding: Spacing.lg,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  paymentType: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  paymentStatus: {
    alignItems: 'flex-end',
  },
  statusTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    ...Typography.caption,
    color: Colors.white,
    fontWeight: 'bold',
  },
  paymentDetails: {
    marginBottom: Spacing.md,
  },
  paymentDueDate: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  paymentDescription: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  paymentMethodsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  methodDetails: {
    flex: 1,
  },
  methodType: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  defaultLabel: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  methodAction: {
    paddingHorizontal: Spacing.sm,
  },
  methodActionText: {
    ...Typography.caption,
    color: Colors.primary,
  },
  addMethodButton: {
    marginTop: Spacing.md,
  },
  autoPayCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  autoPayDescription: {
    ...Typography.body,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  autoPayButton: {
    width: '100%',
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  viewAllText: {
    ...Typography.body,
    color: Colors.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    ...Typography.body,
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  detailCard: {
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  detailAmount: {
    ...Typography.h1,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  detailType: {
    ...Typography.caption,
    color: Colors.textLight,
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    ...Typography.body,
    color: Colors.textLight,
  },
  detailValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: 'bold',
  },
  modalActions: {
    gap: Spacing.md,
  },
  modalActionButton: {
    width: '100%',
  },
});

export default PaymentsScreen;