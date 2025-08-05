import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Card from '../common/Card';
import { Colors } from '../../constants';
import { EnhancedProperty, EnhancedUnit, Tenancy } from '../../types';

interface PropertyInfoCardProps {
  property?: EnhancedProperty;
  unit?: EnhancedUnit;
  tenancy?: Tenancy;
  isLoading?: boolean;
  style?: ViewStyle;
  onViewDetails?: () => void;
}

const PropertyInfoCard: React.FC<PropertyInfoCardProps> = ({
  property,
  unit,
  tenancy,
  isLoading = false,
  style,
  onViewDetails,
}) => {
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  if (isLoading) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading property information...</Text>
        </View>
      </Card>
    );
  }

  if (!property || !tenancy) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.noDataContainer}>
          <Text style={styles.cardTitle}>Property Information</Text>
          <Text style={styles.noDataText}>No property information available</Text>
        </View>
      </Card>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'expired':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const amenities = property.amenities || [];
  const displayedAmenities = showAllAmenities ? amenities : amenities.slice(0, 3);

  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.cardTitle}>Your Property</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tenancy.status) }]}>
          <Text style={styles.statusText}>{tenancy.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Property Details */}
      <View style={styles.propertySection}>
        <Text style={styles.propertyName}>{property.name}</Text>
        <Text style={styles.propertyAddress}>{property.address}</Text>
        {unit && (
          <Text style={styles.unitInfo}>
            Unit {unit.unit_number} • {unit.bedrooms} bed, {unit.bathrooms} bath
            {unit.square_feet && ` • ${unit.square_feet} sq ft`}
          </Text>
        )}
      </View>

      {/* Lease Information */}
      <View style={styles.leaseSection}>
        <Text style={styles.sectionTitle}>Lease Details</Text>
        <View style={styles.leaseRow}>
          <Text style={styles.leaseLabel}>Rent Amount</Text>
          <Text style={styles.leaseValue}>{formatCurrency(tenancy.rent_amount)}</Text>
        </View>
        <View style={styles.leaseRow}>
          <Text style={styles.leaseLabel}>Lease Period</Text>
          <Text style={styles.leaseValue}>
            {formatDate(tenancy.start_date)} - {formatDate(tenancy.end_date)}
          </Text>
        </View>
        {unit?.lease_terms?.rent_due_date && (
          <View style={styles.leaseRow}>
            <Text style={styles.leaseLabel}>Rent Due</Text>
            <Text style={styles.leaseValue}>
              {unit.lease_terms.rent_due_date}
              {unit.lease_terms.rent_due_date === 1 ? 'st' : 
               unit.lease_terms.rent_due_date === 2 ? 'nd' :
               unit.lease_terms.rent_due_date === 3 ? 'rd' : 'th'} of each month
            </Text>
          </View>
        )}
        {tenancy.security_deposit > 0 && (
          <View style={styles.leaseRow}>
            <Text style={styles.leaseLabel}>Security Deposit</Text>
            <Text style={styles.leaseValue}>{formatCurrency(tenancy.security_deposit)}</Text>
          </View>
        )}
      </View>

      {/* Amenities */}
      {amenities.length > 0 && (
        <View style={styles.amenitiesSection}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesContainer}>
            {displayedAmenities.map((amenity, index) => (
              <View key={index} style={styles.amenityTag}>
                <Text style={styles.amenityText}>{amenity.name}</Text>
              </View>
            ))}
            {amenities.length > 3 && !showAllAmenities && (
              <TouchableOpacity
                style={styles.showMoreTag}
                onPress={() => setShowAllAmenities(true)}
                accessibilityRole="button"
                accessibilityLabel={`Show ${amenities.length - 3} more amenities`}
              >
                <Text style={styles.showMoreText}>+{amenities.length - 3} more</Text>
              </TouchableOpacity>
            )}
            {showAllAmenities && amenities.length > 3 && (
              <TouchableOpacity
                style={styles.showMoreTag}
                onPress={() => setShowAllAmenities(false)}
                accessibilityRole="button"
                accessibilityLabel="Show fewer amenities"
              >
                <Text style={styles.showMoreText}>Show less</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Emergency Contact */}
      {property.emergency_contact && (
        <View style={styles.emergencySection}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <Text style={styles.emergencyName}>{property.emergency_contact.name}</Text>
          <Text style={styles.emergencyPhone}>{property.emergency_contact.phone}</Text>
          {property.emergency_contact.email && (
            <Text style={styles.emergencyEmail}>{property.emergency_contact.email}</Text>
          )}
        </View>
      )}

      {/* View Details Button */}
      {onViewDetails && (
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={onViewDetails}
          accessibilityRole="button"
          accessibilityLabel="View full property details"
        >
          <Text style={styles.viewDetailsText}>View Full Details</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  noDataContainer: {
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  propertySection: {
    marginBottom: 24,
  },
  propertyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  unitInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  leaseSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  leaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leaseLabel: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  leaseValue: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'right',
    flex: 1,
  },
  amenitiesSection: {
    marginBottom: 24,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  amenityText: {
    fontSize: 14,
    color: Colors.text,
  },
  showMoreTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  showMoreText: {
    fontSize: 14,
    color: Colors.textOnPrimary,
    fontWeight: '500',
  },
  emergencySection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  emergencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  emergencyPhone: {
    fontSize: 16,
    color: Colors.primary,
    marginBottom: 2,
  },
  emergencyEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  viewDetailsButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
  },
  viewDetailsText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
});

export default PropertyInfoCard;