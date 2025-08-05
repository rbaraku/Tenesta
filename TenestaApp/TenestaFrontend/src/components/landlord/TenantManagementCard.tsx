import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  ScrollView,
  Dimensions,
} from 'react-native';
import Card from '../common/Card';
import Button from '../common/Button';
import { Colors } from '../../constants';
import { TenantSummary } from '../../types';

interface TenantManagementCardProps {
  tenants?: TenantSummary[];
  isLoading?: boolean;
  onViewAllTenants?: () => void;
  onViewTenant?: (tenantId: string) => void;
  onSendMessage?: (tenantId: string) => void;
  style?: ViewStyle;
}

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const TenantManagementCard: React.FC<TenantManagementCardProps> = ({
  tenants = [],
  isLoading = false,
  onViewAllTenants,
  onViewTenant,
  onSendMessage,
  style,
}) => {
  if (isLoading) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tenant data...</Text>
        </View>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentStatusColor = (status: 'current' | 'pending' | 'overdue') => {
    switch (status) {
      case 'current':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'overdue':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getPaymentStatusText = (status: 'current' | 'pending' | 'overdue') => {
    switch (status) {
      case 'current':
        return 'Current';
      case 'pending':
        return 'Pending';
      case 'overdue':
        return 'Overdue';
      default:
        return 'Unknown';
    }
  };

  const getLeaseExpiryWarning = (daysUntilEnd: number) => {
    if (daysUntilEnd <= 30) return 'urgent';
    if (daysUntilEnd <= 90) return 'warning';
    return 'normal';
  };

  const displayTenants = tenants.slice(0, isTablet ? 4 : 3);
  const overdueTenants = tenants.filter(t => t.paymentStatus === 'overdue').length;
  const leasesExpiringSoon = tenants.filter(t => t.daysUntilLeaseEnd <= 90).length;

  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.cardTitle}>Tenant Management</Text>
        <Button
          title="View All"
          onPress={onViewAllTenants}
          variant="text"
          size="small"
        />
      </View>

      {tenants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tenants yet</Text>
          <Text style={styles.emptySubtext}>Add properties to start managing tenants</Text>
        </View>
      ) : (
        <>
          {/* Summary Stats */}
          <View style={styles.summarySection}>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{tenants.length}</Text>
                <Text style={styles.summaryLabel}>Total Tenants</Text>
              </View>
              
              {overdueTenants > 0 && (
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, styles.overdueValue]}>
                    {overdueTenants}
                  </Text>
                  <Text style={styles.summaryLabel}>Overdue</Text>
                </View>
              )}
              
              {leasesExpiringSoon > 0 && (
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, styles.warningValue]}>
                    {leasesExpiringSoon}
                  </Text>
                  <Text style={styles.summaryLabel}>Leases Expiring</Text>
                </View>
              )}
            </View>
          </View>

          {displayTenants.length > 0 && (
            <>
              <View style={styles.divider} />
              
              {/* Recent Tenants List */}
              <View style={styles.tenantsList}>
                <Text style={styles.sectionTitle}>Recent Tenants</Text>
                
                <ScrollView 
                  style={styles.tenantsScrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {displayTenants.map((tenant) => (
                    <View key={tenant.id} style={styles.tenantItem}>
                      <View style={styles.tenantInfo}>
                        <View style={styles.tenantHeader}>
                          <Text style={styles.tenantName}>{tenant.name}</Text>
                          <View style={[
                            styles.paymentStatusBadge,
                            { backgroundColor: getPaymentStatusColor(tenant.paymentStatus) }
                          ]}>
                            <Text style={styles.paymentStatusText}>
                              {getPaymentStatusText(tenant.paymentStatus)}
                            </Text>
                          </View>
                        </View>
                        
                        <Text style={styles.tenantProperty}>
                          {tenant.property} - {tenant.unit}
                        </Text>
                        
                        <View style={styles.tenantDetails}>
                          <Text style={styles.tenantRent}>
                            {formatCurrency(tenant.rentAmount)}/month
                          </Text>
                          
                          {tenant.daysUntilLeaseEnd <= 90 && (
                            <Text style={[
                              styles.leaseExpiry,
                              getLeaseExpiryWarning(tenant.daysUntilLeaseEnd) === 'urgent' && styles.urgentText,
                              getLeaseExpiryWarning(tenant.daysUntilLeaseEnd) === 'warning' && styles.warningText,
                            ]}>
                              Lease expires in {tenant.daysUntilLeaseEnd} days
                            </Text>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.tenantActions}>
                        <Button
                          title="View"
                          onPress={() => onViewTenant?.(tenant.id)}
                          variant="text"
                          size="small"
                          style={styles.actionButton}
                        />
                        
                        <Button
                          title="Message"
                          onPress={() => onSendMessage?.(tenant.id)}
                          variant="text"
                          size="small"
                          style={styles.actionButton}
                        />
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
              
              {tenants.length > displayTenants.length && (
                <View style={styles.moreTenantsSection}>
                  <Text style={styles.moreTenantsText}>
                    +{tenants.length - displayTenants.length} more tenant{tenants.length - displayTenants.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </>
          )}
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: isTablet ? 24 : 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: '600',
    color: Colors.text,
  },
  summarySection: {
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  overdueValue: {
    color: Colors.error,
  },
  warningValue: {
    color: Colors.warning,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  tenantsList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  tenantsScrollView: {
    maxHeight: isTablet ? 240 : 180,
  },
  tenantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tenantInfo: {
    flex: 1,
    marginRight: 12,
  },
  tenantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  paymentStatusText: {
    color: Colors.textOnPrimary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tenantProperty: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  tenantDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tenantRent: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  leaseExpiry: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  urgentText: {
    color: Colors.error,
    fontWeight: '600',
  },
  warningText: {
    color: Colors.warning,
    fontWeight: '600',
  },
  tenantActions: {
    alignItems: 'flex-end',
  },
  actionButton: {
    marginBottom: 4,
    minWidth: 60,
  },
  moreTenantsSection: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
  },
  moreTenantsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default TenantManagementCard;