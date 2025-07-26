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

const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

const TenantCard = ({ tenant, onPress }) => (
  <TouchableOpacity style={styles.tenantCard} onPress={onPress}>
    <View style={styles.tenantHeader}>
      <View style={styles.tenantAvatar}>
        <Text style={styles.tenantInitials}>
          {tenant.firstName?.charAt(0)}{tenant.lastName?.charAt(0)}
        </Text>
      </View>
      <View style={styles.tenantInfo}>
        <Text style={styles.tenantName}>
          {tenant.firstName} {tenant.lastName}
        </Text>
        <Text style={styles.tenantProperty}>{tenant.property}</Text>
        <Text style={styles.tenantEmail}>{tenant.email}</Text>
      </View>
      <View style={[
        styles.paymentStatus,
        tenant.paymentStatus === 'current' ? styles.currentStatus : styles.lateStatus
      ]}>
        <Text style={[
          styles.statusText,
          tenant.paymentStatus === 'current' ? styles.currentText : styles.lateText
        ]}>
          {tenant.paymentStatus}
        </Text>
      </View>
    </View>
    <View style={styles.tenantFooter}>
      <Text style={styles.leaseInfo}>
        Lease: {tenant.leaseStart} - {tenant.leaseEnd}
      </Text>
      <Text style={styles.rentAmount}>
        ${tenant.rentAmount?.toLocaleString()}/month
      </Text>
    </View>
  </TouchableOpacity>
);

export default function TenantsScreen({ navigation }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      // Mock tenants data
      const mockTenants = [
        {
          id: '1',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@email.com',
          property: '123 Main Street, Unit 2A',
          rentAmount: 2500,
          paymentStatus: 'current',
          leaseStart: '2024-01-01',
          leaseEnd: '2024-12-31'
        },
        {
          id: '2',
          firstName: 'Michael',
          lastName: 'Chen',
          email: 'michael.chen@email.com',
          property: '789 Pine Road, Unit 1B',
          rentAmount: 2800,
          paymentStatus: 'current',
          leaseStart: '2023-06-01',
          leaseEnd: '2024-05-31'
        },
        {
          id: '3',
          firstName: 'Emma',
          lastName: 'Davis',
          email: 'emma.davis@email.com',
          property: '456 Oak Avenue, Unit 3C',
          rentAmount: 2200,
          paymentStatus: 'late',
          leaseStart: '2023-09-01',
          leaseEnd: '2024-08-31'
        }
      ];

      setTenants(mockTenants);
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTenantPress = (tenant) => {
    Alert.alert(
      `${tenant.firstName} ${tenant.lastName}`,
      `Property: ${tenant.property}\nRent: $${tenant.rentAmount?.toLocaleString()}/month\nStatus: ${tenant.paymentStatus}\n\nWhat would you like to do?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Message', onPress: () => Alert.alert('Coming Soon', 'Messaging will be available soon') },
        { text: 'View Details', onPress: () => Alert.alert('Coming Soon', 'Tenant details will be available soon') }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#800020" />
        <Text style={styles.loadingText}>Loading tenants...</Text>
      </View>
    );
  }

  const currentTenants = tenants.filter(t => t.paymentStatus === 'current');
  const lateTenants = tenants.filter(t => t.paymentStatus === 'late');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Tenants</Text>
          <Text style={styles.subtitle}>Manage your tenant relationships</Text>
        </View>

        {/* Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Tenant Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{tenants.length}</Text>
              <Text style={styles.summaryLabel}>Total Tenants</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.currentValue]}>
                {currentTenants.length}
              </Text>
              <Text style={styles.summaryLabel}>Current</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.lateValue]}>
                {lateTenants.length}
              </Text>
              <Text style={styles.summaryLabel}>Late Payment</Text>
            </View>
          </View>
        </Card>

        {/* Late Payment Tenants */}
        {lateTenants.length > 0 && (
          <Card style={styles.alertCard}>
            <Text style={styles.alertTitle}>⚠️ Attention Required</Text>
            {lateTenants.map((tenant) => (
              <TenantCard
                key={tenant.id}
                tenant={tenant}
                onPress={() => handleTenantPress(tenant)}
              />
            ))}
          </Card>
        )}

        {/* All Tenants */}
        <Card>
          <Text style={styles.cardTitle}>All Tenants</Text>
          {tenants.length > 0 ? (
            tenants.map((tenant) => (
              <TenantCard
                key={tenant.id}
                tenant={tenant}
                onPress={() => handleTenantPress(tenant)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No tenants yet</Text>
          )}
        </Card>

        {/* Quick Actions */}
        <Card style={styles.lastCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Bulk messaging will be available soon')}
          >
            <Text style={styles.actionButtonText}>Send Message to All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Rent reminder feature will be available soon')}
          >
            <Text style={styles.actionButtonText}>Send Rent Reminders</Text>
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
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertCard: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
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
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
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
  currentValue: {
    color: '#059669',
  },
  lateValue: {
    color: '#DC2626',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  tenantCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tenantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tenantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#800020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tenantInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  tenantProperty: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  tenantEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentStatus: {
    backgroundColor: '#D1FAE5',
  },
  lateStatus: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  currentText: {
    color: '#065F46',
  },
  lateText: {
    color: '#991B1B',
  },
  tenantFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaseInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  rentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#800020',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionButton: {
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
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
