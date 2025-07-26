import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { ApiService } from '../../services/api';

// Custom Card Component
const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

// Status Badge Component
const StatusBadge = ({ status, text }) => (
  <View style={[
    styles.statusBadge,
    status === 'current' ? styles.currentBadge : styles.lateBadge
  ]}>
    <Text style={[
      styles.statusText,
      status === 'current' ? styles.currentText : styles.lateText
    ]}>
      {text}
    </Text>
  </View>
);

// Quick Action Button
const QuickActionButton = ({ title, onPress, style }) => (
  <TouchableOpacity
    style={[styles.actionButton, style]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.actionButtonText}>{title}</Text>
  </TouchableOpacity>
);

export default function TenantDashboard({ navigation }) {
  const { userProfile } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data, error } = await ApiService.getTenantDashboard();
      
      if (error) {
        console.error('Error loading dashboard:', error);
        // Set some mock data for demo purposes
        setDashboardData({
          user_profile: userProfile,
          current_tenancy: {
            property: {
              address: '123 Main Street',
              city: 'New York',
              state: 'NY',
              zip_code: '10001'
            },
            rent_amount: 2500,
            lease_end: '2024-12-31'
          },
          payment_status: {
            status: 'current',
            next_due_date: '2024-02-01',
            outstanding_balance: 0
          },
          upcoming_payments: [
            {
              id: '1',
              amount: 2500,
              due_date: '2024-02-01'
            }
          ]
        });
      } else {
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#800020" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  const {
    user_profile,
    current_tenancy,
    payment_status,
    upcoming_payments,
    recent_documents,
  } = dashboardData || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Welcome back, {userProfile?.profile?.firstName || 'Tenant'}!
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Current Property Info */}
        {current_tenancy && (
          <Card style={styles.tenancyCard}>
            <Text style={styles.cardTitle}>Current Property</Text>
            <Text style={styles.propertyAddress}>
              {current_tenancy.property?.address}
            </Text>
            <Text style={styles.propertyDetails}>
              {current_tenancy.property?.city}, {current_tenancy.property?.state} {current_tenancy.property?.zip_code}
            </Text>
            <View style={styles.rentInfo}>
              <Text style={styles.rentAmount}>
                ${current_tenancy.rent_amount?.toLocaleString()}/month
              </Text>
              <Text style={styles.leaseEnd}>
                Lease ends: {new Date(current_tenancy.lease_end).toLocaleDateString()}
              </Text>
            </View>
          </Card>
        )}

        {/* Payment Status */}
        {payment_status && (
          <Card style={styles.paymentCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Payment Status</Text>
              <StatusBadge 
                status={payment_status.status}
                text={payment_status.status === 'current' ? 'Current' : 'Action Needed'}
              />
            </View>
            
            {payment_status.next_due_date && (
              <Text style={styles.dueDate}>
                Next payment due: {new Date(payment_status.next_due_date).toLocaleDateString()}
              </Text>
            )}
            
            {payment_status.outstanding_balance > 0 && (
              <Text style={styles.balance}>
                Outstanding balance: ${payment_status.outstanding_balance?.toLocaleString()}
              </Text>
            )}
          </Card>
        )}

        {/* Upcoming Payments */}
        {upcoming_payments && upcoming_payments.length > 0 && (
          <Card>
            <Text style={styles.cardTitle}>Upcoming Payments</Text>
            {upcoming_payments.slice(0, 3).map((payment) => (
              <View key={payment.id} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentAmount}>
                    ${payment.amount?.toLocaleString()}
                  </Text>
                  <Text style={styles.paymentDue}>
                    Due: {new Date(payment.due_date).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={() => navigation.navigate('Payments', { paymentId: payment.id })}
                >
                  <Text style={styles.payButtonText}>Pay Now</Text>
                </TouchableOpacity>
              </View>
            ))}
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <QuickActionButton
              title="View Documents"
              onPress={() => navigation.navigate('Documents')}
              style={styles.actionButton1}
            />
            <QuickActionButton
              title="Send Message"
              onPress={() => navigation.navigate('Messages')}
              style={styles.actionButton2}
            />
            <QuickActionButton
              title="Report Issue"
              onPress={() => navigation.navigate('Messages', { newDispute: true })}
              style={styles.actionButton3}
            />
            <QuickActionButton
              title="View Lease"
              onPress={() => navigation.navigate('Documents', { filter: 'lease' })}
              style={styles.actionButton4}
            />
          </View>
        </Card>

        {/* Recent Activity */}
        <Card style={styles.lastCard}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <Text style={styles.activityText}>
            Payment received - January rent
          </Text>
          <Text style={styles.activityDate}>
            2 days ago
          </Text>
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
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#800020',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
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
  tenancyCard: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#800020',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  propertyAddress: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  propertyDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  rentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800020',
  },
  leaseEnd: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  currentBadge: {
    backgroundColor: '#D1FAE5',
  },
  lateBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  currentText: {
    color: '#065F46',
  },
  lateText: {
    color: '#991B1B',
  },
  dueDate: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  balance: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentDue: {
    fontSize: 14,
    color: '#6B7280',
  },
  payButton: {
    backgroundColor: '#800020',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  activityText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 14,
    color: '#6B7280',
  },
});
