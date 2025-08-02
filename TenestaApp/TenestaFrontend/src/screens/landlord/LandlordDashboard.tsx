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
import { fetchLandlordDashboard } from '../../store/slices/userSlice';
import { fetchProperties } from '../../store/slices/propertySlice';
import { fetchPayments } from '../../store/slices/paymentSlice';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Colors } from '../../constants';

const LandlordDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { dashboardData, isLoading } = useSelector((state: RootState) => state.user);
  const { properties } = useSelector((state: RootState) => state.property);
  const { payments } = useSelector((state: RootState) => state.payment);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        dispatch(fetchLandlordDashboard()),
        dispatch(fetchProperties()),
        dispatch(fetchPayments()),
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  };

  const onRefresh = () => {
    loadDashboardData();
  };

  // Calculate analytics
  const totalProperties = properties?.length || 0;
  const totalUnits = properties?.reduce((sum, prop) => sum + prop.units_count, 0) || 0;
  const totalRentCollected = payments?.filter(p => p.status === 'completed' && p.type === 'rent')
    .reduce((sum, p) => sum + p.amount, 0) || 0;
  const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0;

  const handlePropertyManagement = () => {
    // TODO: Navigate to property management screen
    Alert.alert('Property Management', 'Feature coming soon');
  };

  const handleTenantManagement = () => {
    // TODO: Navigate to tenant management screen
    Alert.alert('Tenant Management', 'Feature coming soon');
  };

  const handleRentCollection = () => {
    // TODO: Navigate to rent collection screen
    Alert.alert('Rent Collection', 'Feature coming soon');
  };

  const handleAnalytics = () => {
    // TODO: Navigate to analytics screen
    Alert.alert('Analytics', 'Feature coming soon');
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
          <Text style={styles.welcomeText}>Good morning,</Text>
          <Text style={styles.nameText}>{dashboardData.user.full_name}</Text>
          <Text style={styles.subtitleText}>Landlord Dashboard</Text>
        </View>

        {/* Portfolio Overview */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Portfolio Overview</Text>
          
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{totalProperties}</Text>
              <Text style={styles.statLabel}>Properties</Text>
            </Card>

            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{totalUnits}</Text>
              <Text style={styles.statLabel}>Total Units</Text>
            </Card>

            <Card style={styles.statCard}>
              <Text style={styles.statValue}>${totalRentCollected.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Collected This Month</Text>
            </Card>

            <Card style={styles.statCard}>
              <Text style={[styles.statValue, pendingPayments > 0 && styles.warningText]}>
                {pendingPayments}
              </Text>
              <Text style={styles.statLabel}>Pending Payments</Text>
            </Card>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <Card style={styles.actionCard} onPress={handlePropertyManagement}>
              <Text style={styles.actionIcon}>🏢</Text>
              <Text style={styles.actionTitle}>Properties</Text>
              <Text style={styles.actionSubtitle}>Manage properties</Text>
            </Card>

            <Card style={styles.actionCard} onPress={handleTenantManagement}>
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionTitle}>Tenants</Text>
              <Text style={styles.actionSubtitle}>Manage tenants</Text>
            </Card>

            <Card style={styles.actionCard} onPress={handleRentCollection}>
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionTitle}>Rent Collection</Text>
              <Text style={styles.actionSubtitle}>Track payments</Text>
            </Card>

            <Card style={styles.actionCard} onPress={handleAnalytics}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionTitle}>Analytics</Text>
              <Text style={styles.actionSubtitle}>View reports</Text>
            </Card>

            <Card style={styles.actionCard} onPress={handleMessages}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionTitle}>Messages</Text>
              <Text style={styles.actionSubtitle}>Tenant communications</Text>
            </Card>

            <Card style={styles.actionCard}>
              <Text style={styles.actionIcon}>🔧</Text>
              <Text style={styles.actionTitle}>Maintenance</Text>
              <Text style={styles.actionSubtitle}>Track requests</Text>
            </Card>
          </View>
        </View>

        {/* Recent Properties */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Properties</Text>
            <Button
              title="View All"
              onPress={handlePropertyManagement}
              variant="text"
              size="small"
            />
          </View>

          {properties?.slice(0, 3).map((property) => (
            <Card key={property.id} style={styles.propertyCard}>
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyName}>{property.name}</Text>
                <Text style={styles.propertyAddress}>{property.address}</Text>
                <Text style={styles.propertyUnits}>
                  {property.units_count} {property.units_count === 1 ? 'unit' : 'units'}
                </Text>
              </View>
              <View style={styles.propertyActions}>
                <Text style={styles.propertyType}>{property.type}</Text>
              </View>
            </Card>
          ))}

          {(!properties || properties.length === 0) && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No properties yet</Text>
              <Button
                title="Add Your First Property"
                onPress={handlePropertyManagement}
                style={styles.addButton}
              />
            </Card>
          )}
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
                <Text style={styles.activityTitle}>Rent payment received</Text>
                <Text style={styles.activitySubtitle}>Unit 4B - $1,200</Text>
                <Text style={styles.activityDate}>2 hours ago</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text>🔧</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Maintenance request</Text>
                <Text style={styles.activitySubtitle}>Apt 2A - Leaky faucet</Text>
                <Text style={styles.activityDate}>1 day ago</Text>
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
  subtitleText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  overviewSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    padding: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  warningText: {
    color: Colors.warning,
  },
  quickActions: {
    padding: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '30%',
    alignItems: 'center',
    padding: 16,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  recentSection: {
    padding: 16,
  },
  propertyCard: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  propertyUnits: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  propertyActions: {
    alignItems: 'flex-end',
  },
  propertyType: {
    fontSize: 12,
    color: Colors.textLight,
    textTransform: 'capitalize',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  addButton: {
    marginTop: 8,
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
  activitySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 10,
    color: Colors.textLight,
  },
});

export default LandlordDashboard;