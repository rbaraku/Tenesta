import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchTenantDashboard } from '../../store/slices/userSlice';
import { fetchPayments } from '../../store/slices/paymentSlice';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Colors } from '../../constants';

const TenantDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { dashboardData, isLoading } = useSelector((state: RootState) => state.user);
  const { payments } = useSelector((state: RootState) => state.payment);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        dispatch(fetchTenantDashboard()),
        dispatch(fetchPayments()),
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  };

  const onRefresh = () => {
    loadDashboardData();
  };

  // Calculate rent status
  const currentRent = payments?.find(p => p.type === 'rent' && p.status === 'pending');
  const nextPaymentDue = currentRent?.due_date ? new Date(currentRent.due_date) : null;
  const isRentOverdue = nextPaymentDue && nextPaymentDue < new Date();

  const handlePayRent = () => {
    // TODO: Navigate to payment screen
    Alert.alert('Pay Rent', 'Payment feature coming soon');
  };

  const handleViewDocuments = () => {
    // TODO: Navigate to documents screen
    Alert.alert('Documents', 'Document viewer coming soon');
  };

  const handleMaintenanceRequest = () => {
    // TODO: Navigate to maintenance screen
    Alert.alert('Maintenance', 'Maintenance request feature coming soon');
  };

  const handleMessages = () => {
    // TODO: Navigate to messages screen
    Alert.alert('Messages', 'Messaging feature coming soon');
  };

  if (!dashboardData?.user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{dashboardData.user.full_name}</Text>
        </View>

        {/* Rent Status Card */}
        <Card style={styles.rentCard}>
          <View style={styles.rentHeader}>
            <Text style={styles.cardTitle}>Rent Status</Text>
            {isRentOverdue && (
              <View style={styles.overdueTag}>
                <Text style={styles.overdueText}>OVERDUE</Text>
              </View>
            )}
          </View>
          
          <View style={styles.rentAmount}>
            <Text style={styles.amountLabel}>Current Balance</Text>
            <Text style={[
              styles.amountValue,
              isRentOverdue && styles.overdueAmount
            ]}>
              ${currentRent?.amount || 0}
            </Text>
          </View>

          {nextPaymentDue && (
            <Text style={styles.dueDate}>
              Due: {nextPaymentDue.toLocaleDateString()}
            </Text>
          )}

          <Button
            title="Pay Rent"
            onPress={handlePayRent}
            style={styles.payButton}
            variant={isRentOverdue ? 'primary' : 'secondary'}
          />
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <Card style={styles.actionCard} onPress={handleViewDocuments}>
              <Text style={styles.actionIcon}>📄</Text>
              <Text style={styles.actionTitle}>Lease Documents</Text>
              <Text style={styles.actionSubtitle}>View & download</Text>
            </Card>

            <Card style={styles.actionCard} onPress={handleMaintenanceRequest}>
              <Text style={styles.actionIcon}>🔧</Text>
              <Text style={styles.actionTitle}>Maintenance</Text>
              <Text style={styles.actionSubtitle}>Report issues</Text>
            </Card>

            <Card style={styles.actionCard} onPress={handleMessages}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionTitle}>Messages</Text>
              <Text style={styles.actionSubtitle}>Chat with landlord</Text>
            </Card>

            <Card style={styles.actionCard}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionTitle}>Payment History</Text>
              <Text style={styles.actionSubtitle}>View past payments</Text>
            </Card>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          <Card style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text>💳</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Rent payment processed</Text>
                <Text style={styles.activityDate}>2 days ago</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text>📄</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Lease agreement updated</Text>
                <Text style={styles.activityDate}>1 week ago</Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 4,
  },
  rentCard: {
    margin: 16,
    marginTop: 0,
  },
  rentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  overdueTag: {
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  overdueText: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  rentAmount: {
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  overdueAmount: {
    color: Colors.error,
  },
  dueDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  payButton: {
    marginTop: 8,
  },
  quickActions: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    alignItems: 'center',
    padding: 20,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  recentActivity: {
    padding: 16,
  },
  activityCard: {
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default TenantDashboard;