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

// Summary Metric Component
const SummaryMetric = ({ value, label, color = '#800020' }) => (
  <View style={styles.summaryItem}>
    <Text style={[styles.summaryValue, { color }]}>
      {value}
    </Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

// Property Item Component
const PropertyItem = ({ property }) => (
  <View style={styles.propertyItem}>
    <View style={styles.propertyInfo}>
      <Text style={styles.propertyAddress}>
        {property.address}
      </Text>
      <Text style={styles.propertyDetails}>
        {property.city}, {property.state} • ${property.rent_amount?.toLocaleString()}/mo
      </Text>
    </View>
    <View style={[
      styles.propertyStatusBadge,
      property.status === 'occupied' ? styles.occupiedBadge : styles.availableBadge
    ]}>
      <Text style={[
        styles.propertyStatusText,
        property.status === 'occupied' ? styles.occupiedText : styles.availableText
      ]}>
        {property.status}
      </Text>
    </View>
  </View>
);

export default function LandlordDashboard({ navigation }) {
  const { userProfile } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data, error } = await ApiService.getLandlordDashboard();
      
      if (error) {
        console.error('Error loading dashboard:', error);
        // Set mock data for demo
        setDashboardData({
          user_profile: userProfile,
          properties: [
            {
              id: '1',
              address: '123 Main St',
              city: 'New York',
              state: 'NY',
              rent_amount: 2500,
              status: 'occupied'
            },
            {
              id: '2',
              address: '456 Oak Ave',
              city: 'Brooklyn',
              state: 'NY',
              rent_amount: 2200,
              status: 'available'
            }
          ],
          portfolio_summary: {
            total_properties: 8,
            occupancy_rate: 87,
            total_monthly_rent: 18500,
            collected_this_month: 16200
          },
          rent_collection: {
            collected: 16200,
            pending: 2300,
            late: 0
          }
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
        <Text style={styles.loadingText}>Loading your portfolio...</Text>
      </View>
    );
  }

  const {
    properties,
    portfolio_summary,
    rent_collection,
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
            Welcome, {userProfile?.profile?.firstName || 'Landlord'}!
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

        {/* Portfolio Summary */}
        {portfolio_summary && (
          <Card style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Portfolio Overview</Text>
            <View style={styles.summaryGrid}>
              <SummaryMetric
                value={portfolio_summary.total_properties}
                label="Properties"
              />
              <SummaryMetric
                value={`${portfolio_summary.occupancy_rate}%`}
                label="Occupied"
                color="#059669"
              />
              <SummaryMetric
                value={`$${portfolio_summary.total_monthly_rent?.toLocaleString()}`}
                label="Monthly Rent"
              />
              <SummaryMetric
                value={`$${portfolio_summary.collected_this_month?.toLocaleString()}`}
                label="Collected"
                color="#059669"
              />
            </View>
          </Card>
        )}

        {/* Rent Collection Status */}
        {rent_collection && (
          <Card>
            <Text style={styles.cardTitle}>Rent Collection Status</Text>
            <View style={styles.collectionStatus}>
              <View style={styles.collectionItem}>
                <Text style={[styles.collectionValue, styles.collectedValue]}>
                  ${rent_collection.collected?.toLocaleString() || '0'}
                </Text>
                <Text style={styles.collectionLabel}>Collected</Text>
              </View>
              <View style={styles.collectionItem}>
                <Text style={[styles.collectionValue, styles.pendingValue]}>
                  ${rent_collection.pending?.toLocaleString() || '0'}
                </Text>
                <Text style={styles.collectionLabel}>Pending</Text>
              </View>
              <View style={styles.collectionItem}>
                <Text style={[styles.collectionValue, styles.lateValue]}>
                  ${rent_collection.late?.toLocaleString() || '0'}
                </Text>
                <Text style={styles.collectionLabel}>Late</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Recent Properties */}
        {properties && properties.length > 0 && (
          <Card>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent Properties</Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('Properties')}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {properties.slice(0, 3).map((property) => (
              <PropertyItem key={property.id} property={property} />
            ))}
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Properties', { action: 'add' })}
            >
              <Text style={styles.actionButtonText}>Add Property</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Tenants')}
            >
              <Text style={styles.actionButtonText}>Manage Tenants</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Properties', { filter: 'rent_due' })}
            >
              <Text style={styles.actionButtonText}>Rent Collection</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Reports')}
            >
              <Text style={styles.actionButtonText}>View Reports</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Recent Activity */}
        <Card style={styles.lastCard}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <Text style={styles.activityText}>
            Payment received from Unit 2A - $2,500
          </Text>
          <Text style={styles.activityDate}>
            2 hours ago
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
  summaryCard: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  collectionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  collectionItem: {
    flex: 1,
    alignItems: 'center',
  },
  collectionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  collectedValue: {
    color: '#059669',
  },
  pendingValue: {
    color: '#D97706',
  },
  lateValue: {
    color: '#DC2626',
  },
  collectionLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  viewAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#800020',
    borderRadius: 8,
  },
  viewAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  propertyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  propertyDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  propertyStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  occupiedBadge: {
    backgroundColor: '#D1FAE5',
  },
  availableBadge: {
    backgroundColor: '#DBEAFE',
  },
  propertyStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  occupiedText: {
    color: '#065F46',
  },
  availableText: {
    color: '#1E40AF',
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
