import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Card from '../common/Card';
import { Colors } from '../../constants';
import { LandlordPortfolioData } from '../../types';

interface PropertyPortfolioCardProps {
  portfolioData?: LandlordPortfolioData;
  isLoading?: boolean;
  onViewProperties?: () => void;
  style?: ViewStyle;
}

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const PropertyPortfolioCard: React.FC<PropertyPortfolioCardProps> = ({
  portfolioData,
  isLoading = false,
  onViewProperties,
  style,
}) => {
  if (isLoading) {
    return (
      <Card style={[styles.container, style]} onPress={onViewProperties}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading portfolio...</Text>
        </View>
      </Card>
    );
  }

  if (!portfolioData) {
    return (
      <Card style={[styles.container, style]} onPress={onViewProperties}>
        <View style={styles.emptyContainer}>
          <Text style={styles.cardTitle}>Property Portfolio</Text>
          <Text style={styles.emptyText}>No properties yet</Text>
          <Text style={styles.emptySubtext}>Add your first property to get started</Text>
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

  const formatPercent = (value: number) => {
    return `${Math.round(value)}%`;
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 95) return Colors.success;
    if (rate >= 80) return Colors.warning;
    return Colors.error;
  };

  return (
    <Card style={[styles.container, style]} onPress={onViewProperties}>
      <View style={styles.header}>
        <Text style={styles.cardTitle}>Property Portfolio</Text>
        <View style={[
          styles.occupancyBadge, 
          { backgroundColor: getOccupancyColor(portfolioData.occupancyRate) }
        ]}>
          <Text style={styles.occupancyText}>
            {formatPercent(portfolioData.occupancyRate)} Occupied
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{portfolioData.totalProperties}</Text>
          <Text style={styles.statLabel}>Properties</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{portfolioData.totalUnits}</Text>
          <Text style={styles.statLabel}>Total Units</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{portfolioData.occupiedUnits}</Text>
          <Text style={styles.statLabel}>Occupied</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[
            styles.statValue, 
            portfolioData.vacantUnits > 0 && styles.warningValue
          ]}>
            {portfolioData.vacantUnits}
          </Text>
          <Text style={styles.statLabel}>Vacant</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.financialSection}>
        <View style={styles.financialRow}>
          <Text style={styles.financialLabel}>Monthly Rent Income</Text>
          <Text style={styles.financialValue}>
            {formatCurrency(portfolioData.totalMonthlyRent)}
          </Text>
        </View>
        
        <View style={styles.financialRow}>
          <Text style={styles.financialLabel}>Average per Unit</Text>
          <Text style={styles.financialSubValue}>
            {formatCurrency(portfolioData.averageRentPerUnit)}
          </Text>
        </View>
      </View>

      {portfolioData.maintenanceUnits > 0 && (
        <View style={styles.maintenanceAlert}>
          <View style={styles.alertIcon}>
            <Text style={styles.alertIconText}>⚠️</Text>
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>
              {portfolioData.maintenanceUnits} unit{portfolioData.maintenanceUnits !== 1 ? 's' : ''} need maintenance
            </Text>
            <Text style={styles.alertSubtitle}>Requires attention</Text>
          </View>
        </View>
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
    marginTop: 12,
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
  occupancyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  occupancyText: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  warningValue: {
    color: Colors.warning,
  },
  statLabel: {
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
  financialSection: {
    marginBottom: 16,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  financialLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  financialValue: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  financialSubValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  maintenanceAlert: {
    flexDirection: 'row',
    backgroundColor: Colors.warning + '15',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    marginTop: 8,
  },
  alertIcon: {
    marginRight: 12,
    justifyContent: 'center',
  },
  alertIconText: {
    fontSize: 20,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default PropertyPortfolioCard;