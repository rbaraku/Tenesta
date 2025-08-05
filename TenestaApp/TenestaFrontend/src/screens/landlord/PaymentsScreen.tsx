import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchPayments } from '../../store/slices/paymentSlice';
import { Colors, Spacing, Typography } from '../../constants';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import { Payment, TenantSummary } from '../../types';

interface PaymentFilters {
  status: 'all' | 'pending' | 'completed' | 'overdue' | 'failed';
  dateRange: '7d' | '30d' | '90d' | 'all';
  property: string | 'all';
  searchQuery: string;
}

interface PaymentScreenProps {
  navigation: any;
}

const PaymentsScreen: React.FC<PaymentScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { payments, isLoading, error } = useSelector((state: RootState) => state.payment);
  const { rentCollection } = useSelector((state: RootState) => state.landlord);
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filters, setFilters] = useState<PaymentFilters>({
    status: 'all',
    dateRange: '30d',
    property: 'all',
    searchQuery: '',
  });

  useEffect(() => {
    loadPayments();
  }, [filters]);

  const loadPayments = useCallback(async () => {
    try {
      await dispatch(fetchPayments(filters) as any);
    } catch (error) {
      console.error('Failed to load payments:', error);
    }
  }, [dispatch, filters]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  }, [loadPayments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Colors.success;
      case 'pending': return Colors.warning;
      case 'overdue': return Colors.error;
      case 'failed': return Colors.error;
      default: return Colors.textLight;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'pending': return '⏳';
      case 'overdue': return '⚠️';
      case 'failed': return '❌';
      default: return '📄';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const markPaymentAsPaid = async (paymentId: string) => {
    Alert.alert(
      'Mark as Paid',
      'Are you sure you want to mark this payment as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              // TODO: Implement API call to mark payment as paid
              console.log('Marking payment as paid:', paymentId);
              await loadPayments();
            } catch (error) {
              Alert.alert('Error', 'Failed to update payment status');
            }
          },
        },
      ]
    );
  };

  const sendPaymentReminder = async (paymentId: string) => {
    try {
      // TODO: Implement API call to send reminder
      console.log('Sending payment reminder:', paymentId);
      Alert.alert('Success', 'Payment reminder sent successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to send payment reminder');
    }
  };

  const filteredPayments = payments?.filter(payment => {
    // Status filter
    if (filters.status !== 'all' && payment.status !== filters.status) {
      return false;
    }
    
    // Date range filter
    const paymentDate = new Date(payment.due_date);
    const today = new Date();
    const daysAgo = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      'all': 9999,
    }[filters.dateRange];
    
    const cutoffDate = new Date(today.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    if (paymentDate < cutoffDate) {
      return false;
    }

    // Search query filter (would need tenant/property data)
    if (filters.searchQuery && !payment.id.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  }) || [];

  const renderPaymentCard = (payment: Payment) => {
    const daysOverdue = getDaysOverdue(payment.due_date);
    const isOverdue = payment.status === 'pending' && daysOverdue > 0;

    return (
      <Card key={payment.id} style={styles.paymentCard}>
        <TouchableOpacity
          onPress={() => {
            setSelectedPayment(payment);
            setModalVisible(true);
          }}
        >
          <View style={styles.paymentHeader}>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentAmount}>
                {formatCurrency(payment.amount)}
              </Text>
              <Text style={styles.paymentType}>
                {payment.type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <View style={styles.paymentStatus}>
              <Text style={styles.statusIcon}>
                {getStatusIcon(isOverdue ? 'overdue' : payment.status)}
              </Text>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(isOverdue ? 'overdue' : payment.status) }
              ]}>
                {isOverdue ? 'OVERDUE' : payment.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.paymentDetails}>
            <Text style={styles.detailText}>
              Due: {formatDate(payment.due_date)}
            </Text>
            {payment.paid_date && (
              <Text style={styles.detailText}>
                Paid: {formatDate(payment.paid_date)}
              </Text>
            )}
            {isOverdue && (
              <Text style={[styles.detailText, { color: Colors.error }]}>
                {daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue
              </Text>
            )}
          </View>

          {payment.status === 'pending' && (
            <View style={styles.paymentActions}>
              <Button
                title="Mark Paid"
                onPress={() => markPaymentAsPaid(payment.id)}
                variant="primary"
                size="small"
                style={styles.actionButton}
              />
              <Button
                title="Send Reminder"
                onPress={() => sendPaymentReminder(payment.id)}
                variant="outline"
                size="small"
                style={styles.actionButton}
              />
            </View>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  const renderFilterBar = () => (
    <View style={styles.filterBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.filterChip, filters.status === 'all' && styles.filterChipActive]}
          onPress={() => setFilters({ ...filters, status: 'all' })}
        >
          <Text style={[styles.filterText, filters.status === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filters.status === 'pending' && styles.filterChipActive]}
          onPress={() => setFilters({ ...filters, status: 'pending' })}
        >
          <Text style={[styles.filterText, filters.status === 'pending' && styles.filterTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filters.status === 'completed' && styles.filterChipActive]}
          onPress={() => setFilters({ ...filters, status: 'completed' })}
        >
          <Text style={[styles.filterText, filters.status === 'completed' && styles.filterTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filters.status === 'overdue' && styles.filterChipActive]}
          onPress={() => setFilters({ ...filters, status: 'overdue' })}
        >
          <Text style={[styles.filterText, filters.status === 'overdue' && styles.filterTextActive]}>
            Overdue
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Expected</Text>
        <Text style={styles.summaryAmount}>
          {formatCurrency(rentCollection?.totalExpected || 0)}
        </Text>
      </Card>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Collected</Text>
        <Text style={[styles.summaryAmount, { color: Colors.success }]}>
          {formatCurrency(rentCollection?.totalCollected || 0)}
        </Text>
      </Card>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Pending</Text>
        <Text style={[styles.summaryAmount, { color: Colors.warning }]}>
          {formatCurrency(rentCollection?.totalPending || 0)}
        </Text>
      </Card>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Overdue</Text>
        <Text style={[styles.summaryAmount, { color: Colors.error }]}>
          {formatCurrency(rentCollection?.totalOverdue || 0)}
        </Text>
      </Card>
    </View>
  );

  if (isLoading && !refreshing) {
    return <LoadingState message="Loading payments..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderSummaryCards()}
        {renderFilterBar()}
        
        <View style={styles.paymentsSection}>
          <Text style={styles.sectionTitle}>
            Payment History ({filteredPayments.length})
          </Text>
          
          {filteredPayments.length === 0 ? (
            <Card style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No payments found for the selected filters
              </Text>
            </Card>
          ) : (
            filteredPayments.map(renderPaymentCard)
          )}
        </View>
      </ScrollView>

      {/* Payment Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment Details</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          {selectedPayment && (
            <ScrollView style={styles.modalContent}>
              <Card>
                <Text style={styles.modalPaymentAmount}>
                  {formatCurrency(selectedPayment.amount)}
                </Text>
                <Text style={styles.modalPaymentType}>
                  {selectedPayment.type.replace('_', ' ').toUpperCase()}
                </Text>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Status:</Text>
                  <Text style={[
                    styles.modalDetailValue,
                    { color: getStatusColor(selectedPayment.status) }
                  ]}>
                    {selectedPayment.status.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Due Date:</Text>
                  <Text style={styles.modalDetailValue}>
                    {formatDate(selectedPayment.due_date)}
                  </Text>
                </View>
                {selectedPayment.paid_date && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Paid Date:</Text>
                    <Text style={styles.modalDetailValue}>
                      {formatDate(selectedPayment.paid_date)}
                    </Text>
                  </View>
                )}
                {selectedPayment.payment_method && (
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Payment Method:</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedPayment.payment_method}
                    </Text>
                  </View>
                )}
              </Card>
            </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.md,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  summaryAmount: {
    ...Typography.h3,
    fontWeight: 'bold',
    color: Colors.text,
  },
  filterBar: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.inputBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.caption,
    color: Colors.text,
  },
  filterTextActive: {
    color: Colors.white,
  },
  paymentsSection: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
    color: Colors.text,
  },
  paymentCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    ...Typography.h2,
    fontWeight: 'bold',
    color: Colors.text,
  },
  paymentType: {
    ...Typography.caption,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  paymentStatus: {
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: 'bold',
  },
  paymentDetails: {
    marginBottom: Spacing.sm,
  },
  detailText: {
    ...Typography.body,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textLight,
    textAlign: 'center',
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h2,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  modalPaymentAmount: {
    ...Typography.h1,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  modalPaymentType: {
    ...Typography.body,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalDetailLabel: {
    ...Typography.body,
    color: Colors.textLight,
  },
  modalDetailValue: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.text,
  },
});

export default PaymentsScreen;