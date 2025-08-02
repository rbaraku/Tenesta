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
import { ApiService } from '../../services/api';

const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

const PropertyCard = ({ property, onPress }) => (
  <TouchableOpacity style={styles.propertyCard} onPress={onPress}>
    <View style={styles.propertyHeader}>
      <Text style={styles.propertyAddress}>{property.address}</Text>
      <View style={[
        styles.statusBadge,
        property.status === 'occupied' ? styles.occupiedBadge : styles.availableBadge
      ]}>
        <Text style={[
          styles.statusText,
          property.status === 'occupied' ? styles.occupiedText : styles.availableText
        ]}>
          {property.status}
        </Text>
      </View>
    </View>
    <Text style={styles.propertyLocation}>
      {property.city}, {property.state} {property.zip_code}
    </Text>
    <View style={styles.propertyFooter}>
      <Text style={styles.rentAmount}>
        ${property.rent_amount?.toLocaleString()}/month
      </Text>
      <Text style={styles.propertyType}>
        {property.property_details?.bedrooms || 1} bed • {property.property_details?.bathrooms || 1} bath
      </Text>
    </View>
  </TouchableOpacity>
);

export default function PropertiesScreen({ route, navigation }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const { action, filter } = route?.params || {};

  useEffect(() => {
    loadProperties();
    if (action === 'add') {
      handleAddProperty();
    }
  }, []);

  const loadProperties = async () => {
    try {
      const { data, error } = await ApiService.listProperties();
      
      if (error) {
        // Mock properties data
        const mockProperties = [
          {
            id: '1',
            address: '123 Main Street',
            city: 'New York',
            state: 'NY',
            zip_code: '10001',
            rent_amount: 2500,
            status: 'occupied',
            property_details: { bedrooms: 2, bathrooms: 1 }
          },
          {
            id: '2',
            address: '456 Oak Avenue',
            city: 'Brooklyn',
            state: 'NY',
            zip_code: '11201',
            rent_amount: 2200,
            status: 'available',
            property_details: { bedrooms: 1, bathrooms: 1 }
          },
          {
            id: '3',
            address: '789 Pine Road',
            city: 'Queens',
            state: 'NY',
            zip_code: '11354',
            rent_amount: 2800,
            status: 'occupied',
            property_details: { bedrooms: 3, bathrooms: 2 }
          }
        ];

        let filteredProperties = mockProperties;
        if (filter === 'rent_due') {
          filteredProperties = mockProperties.filter(p => p.status === 'occupied');
        }

        setProperties(filteredProperties);
      } else {
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = () => {
    Alert.alert(
      'Add Property',
      'Property management form will be available soon',
      [{ text: 'OK' }]
    );
  };

  const handlePropertyPress = (property) => {
    Alert.alert(
      property.address,
      `Status: ${property.status}\nRent: $${property.rent_amount?.toLocaleString()}/month\n\nWould you like to manage this property?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Manage', onPress: () => Alert.alert('Coming Soon', 'Property management will be available soon') }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#800020" />
        <Text style={styles.loadingText}>Loading properties...</Text>
      </View>
    );
  }

  const occupiedProperties = properties.filter(p => p.status === 'occupied');
  const availableProperties = properties.filter(p => p.status === 'available');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Properties</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddProperty}
          >
            <Text style={styles.addButtonText}>+ Add Property</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Portfolio Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{properties.length}</Text>
              <Text style={styles.summaryLabel}>Total Properties</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.occupiedValue]}>
                {occupiedProperties.length}
              </Text>
              <Text style={styles.summaryLabel}>Occupied</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.availableValue]}>
                {availableProperties.length}
              </Text>
              <Text style={styles.summaryLabel}>Available</Text>
            </View>
          </View>
        </Card>

        {/* Occupied Properties */}
        {occupiedProperties.length > 0 && (
          <Card>
            <Text style={styles.cardTitle}>Occupied Properties</Text>
            {occupiedProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onPress={() => handlePropertyPress(property)}
              />
            ))}
          </Card>
        )}

        {/* Available Properties */}
        {availableProperties.length > 0 && (
          <Card>
            <Text style={styles.cardTitle}>Available Properties</Text>
            {availableProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onPress={() => handlePropertyPress(property)}
              />
            ))}
          </Card>
        )}

        {properties.length === 0 && (
          <Card style={styles.lastCard}>
            <Text style={styles.emptyTitle}>No Properties Yet</Text>
            <Text style={styles.emptyText}>
              Start building your portfolio by adding your first property
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddProperty}
            >
              <Text style={styles.emptyButtonText}>Add Your First Property</Text>
            </TouchableOpacity>
          </Card>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#800020',
  },
  addButton: {
    backgroundColor: '#800020',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  occupiedValue: {
    color: '#059669',
  },
  availableValue: {
    color: '#2563EB',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  propertyCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyAddress: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  occupiedBadge: {
    backgroundColor: '#D1FAE5',
  },
  availableBadge: {
    backgroundColor: '#DBEAFE',
  },
  statusText: {
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
  propertyLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#800020',
  },
  propertyType: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#800020',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
