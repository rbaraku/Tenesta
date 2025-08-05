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
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  fetchProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  setSelectedProperty,
  clearError,
} from '../../store/slices/propertySlice';
import { Colors, Spacing, Typography } from '../../constants';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import { Property } from '../../types';
import { runQuickAPITest } from '../../utils/apiIntegrationTest';

interface PropertyFormData {
  name: string;
  address: string;
  type: 'apartment' | 'house' | 'condo' | 'commercial';
  units_count: number;
}

interface PropertiesScreenProps {
  navigation: any;
}

const PropertiesScreen: React.FC<PropertiesScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { properties, isLoading, error } = useSelector((state: RootState) => state.property);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'units_count'>('name');
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    address: '',
    type: 'apartment',
    units_count: 1,
  });

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = useCallback(async () => {
    try {
      console.log('🔥 Loading properties from Edge Function...');
      await dispatch(fetchProperties() as any);
      console.log('✅ Properties loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load properties:', error);
      Alert.alert('Error', 'Failed to load properties. Please check if you are logged in and the backend is running.');
    }
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProperties();
    setRefreshing(false);
  }, [loadProperties]);

  const handleCreateProperty = async () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const propertyData = {
        ...formData,
        landlord_id: user?.id || '',
      };
      
      await dispatch(createProperty(propertyData) as any);
      
      setModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Property created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create property');
    }
  };

  const handleUpdateProperty = async () => {
    if (!editingProperty || !formData.name.trim() || !formData.address.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await dispatch(updateProperty({
        id: editingProperty.id,
        updates: formData,
      }) as any);
      
      setModalVisible(false);
      setEditingProperty(null);
      resetForm();
      Alert.alert('Success', 'Property updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update property');
    }
  };

  const handleDeleteProperty = (property: Property) => {
    Alert.alert(
      'Delete Property',
      `Are you sure you want to delete "${property.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteProperty(property.id) as any);
              Alert.alert('Success', 'Property deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete property');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      type: 'apartment',
      units_count: 1,
    });
  };

  const testAPIConnection = async () => {
    Alert.alert(
      'API Test',
      'Running API integration test...\nCheck console for detailed results.',
      [{ text: 'OK' }]
    );
    
    try {
      const success = await runQuickAPITest();
      Alert.alert(
        'Test Results',
        success 
          ? '✅ API integration test passed!\nBackend connection is working.' 
          : '❌ API integration test failed.\nCheck console for details.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Test Error', `Failed to run API test: ${error}`);
    }
  };

  const openCreateModal = () => {
    setEditingProperty(null);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      address: property.address,
      type: property.type,
      units_count: property.units_count,
    });
    setModalVisible(true);
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'apartment': return '🏢';
      case 'house': return '🏠';
      case 'condo': return '🏙️';
      case 'commercial': return '🏬';
      default: return '🏠';
    }
  };

  const getPropertyTypeColor = (type: string) => {
    switch (type) {
      case 'apartment': return Colors.primary;
      case 'house': return Colors.success;
      case 'condo': return Colors.info;
      case 'commercial': return Colors.secondary;
      default: return Colors.primary;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredAndSortedProperties = properties
    .filter(property => 
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'units_count':
          return b.units_count - a.units_count;
        default:
          return 0;
      }
    });

  const renderPropertyCard = ({ item: property }: { item: Property }) => (
    <Card key={property.id} style={styles.propertyCard}>
      <View style={styles.propertyHeader}>
        <View style={styles.propertyInfo}>
          <View style={styles.propertyTitleRow}>
            <Text style={styles.propertyIcon}>
              {getPropertyTypeIcon(property.type)}
            </Text>
            <Text style={styles.propertyName}>{property.name}</Text>
          </View>
          <Text style={styles.propertyAddress}>{property.address}</Text>
        </View>
        <View style={styles.propertyType}>
          <Text style={[
            styles.typeTag,
            { backgroundColor: getPropertyTypeColor(property.type) }
          ]}>
            {property.type.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.propertyStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{property.units_count}</Text>
          <Text style={styles.statLabel}>Units</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>85%</Text>
          <Text style={styles.statLabel}>Occupied</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>$12.5K</Text>
          <Text style={styles.statLabel}>Monthly Income</Text>
        </View>
      </View>

      <Text style={styles.propertyDate}>
        Added {formatDate(property.created_at)}
      </Text>

      <View style={styles.propertyActions}>
        <Button
          title="View Details"
          onPress={() => {
            dispatch(setSelectedProperty(property));
            // TODO: Navigate to property details screen
            console.log('Navigate to property details:', property.id);
          }}
          variant="outline"
          size="small"
          style={styles.actionButton}
        />
        <Button
          title="Edit"
          onPress={() => openEditModal(property)}
          variant="secondary"
          size="small"
          style={styles.actionButton}
        />
        <Button
          title="Delete"
          onPress={() => handleDeleteProperty(property)}
          variant="outline"
          size="small"
          style={[styles.actionButton, { borderColor: Colors.error }]}
        />
      </View>
    </Card>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search properties..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textLight}
        />
      </View>
      
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Sort by:</Text>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
          onPress={() => setSortBy('name')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
            Name
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'created_at' && styles.sortButtonActive]}
          onPress={() => setSortBy('created_at')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'created_at' && styles.sortButtonTextActive]}>
            Date
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'units_count' && styles.sortButtonActive]}
          onPress={() => setSortBy('units_count')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'units_count' && styles.sortButtonTextActive]}>
            Units
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="+ Add Property"
          onPress={openCreateModal}
          variant="primary"
          style={styles.addButton}
        />
        <Button
          title="🧪 Test API"
          onPress={testAPIConnection}
          variant="outline"
          style={styles.testButton}
        />
      </View>
    </View>
  );

  const renderPropertyForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Property Name *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.name}
          onChangeText={(value) => setFormData({ ...formData, name: value })}
          placeholder="Enter property name"
          placeholderTextColor={Colors.textLight}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Address *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.address}
          onChangeText={(value) => setFormData({ ...formData, address: value })}
          placeholder="Enter property address"
          placeholderTextColor={Colors.textLight}
          multiline
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Property Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['apartment', 'house', 'condo', 'commercial'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeSelector,
                formData.type === type && styles.typeSelectorActive
              ]}
              onPress={() => setFormData({ ...formData, type })}
            >
              <Text style={styles.typeSelectorIcon}>
                {getPropertyTypeIcon(type)}
              </Text>
              <Text style={[
                styles.typeSelectorText,
                formData.type === type && styles.typeSelectorTextActive
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Number of Units</Text>
        <View style={styles.numberInputContainer}>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setFormData({ 
              ...formData, 
              units_count: Math.max(1, formData.units_count - 1) 
            })}
          >
            <Text style={styles.numberButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.numberValue}>{formData.units_count}</Text>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setFormData({ 
              ...formData, 
              units_count: formData.units_count + 1 
            })}
          >
            <Text style={styles.numberButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading && properties.length === 0) {
    return <LoadingState message="Loading properties..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredAndSortedProperties}
        renderItem={renderPropertyCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <Card style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🏠</Text>
            <Text style={styles.emptyStateTitle}>No Properties Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No properties match your search' : 'Add your first property to get started'}
            </Text>
            {!searchQuery && (
              <Button
                title="Add Property"
                onPress={openCreateModal}
                variant="primary"
                style={styles.emptyActionButton}
              />
            )}
          </Card>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
      />

      {/* Property Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingProperty ? 'Edit Property' : 'Add New Property'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setEditingProperty(null);
                resetForm();
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {renderPropertyForm()}
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={() => {
                setModalVisible(false);
                setEditingProperty(null);
                resetForm();
              }}
              variant="outline"
              style={styles.modalActionButton}
            />
            <Button
              title={editingProperty ? 'Update Property' : 'Create Property'}
              onPress={editingProperty ? handleUpdateProperty : handleCreateProperty}
              variant="primary"
              style={styles.modalActionButton}
            />
          </View>
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
  listContainer: {
    padding: Spacing.md,
  },
  headerContainer: {
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    marginBottom: Spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  filterLabel: {
    ...Typography.caption,
    color: Colors.textLight,
    marginRight: Spacing.sm,
  },
  sortButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.xs,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortButtonText: {
    ...Typography.caption,
    color: Colors.text,
  },
  sortButtonTextActive: {
    color: Colors.white,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  addButton: {
    flex: 1,
  },
  testButton: {
    flex: 1,
  },
  propertyCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  propertyIcon: {
    fontSize: 24,
    marginRight: Spacing.xs,
  },
  propertyName: {
    ...Typography.h3,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  propertyAddress: {
    ...Typography.body,
    color: Colors.textLight,
  },
  propertyType: {
    alignItems: 'flex-end',
  },
  typeTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    ...Typography.caption,
    color: Colors.white,
    fontWeight: 'bold',
  },
  propertyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h3,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  propertyDate: {
    ...Typography.caption,
    color: Colors.textLight,
    marginBottom: Spacing.sm,
  },
  propertyActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyStateTitle: {
    ...Typography.h2,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyActionButton: {
    minWidth: 150,
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
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeSelector: {
    alignItems: 'center',
    padding: Spacing.md,
    marginRight: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 80,
  },
  typeSelectorActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeSelectorIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  typeSelectorText: {
    ...Typography.caption,
    color: Colors.text,
  },
  typeSelectorTextActive: {
    color: Colors.white,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberButtonText: {
    ...Typography.h3,
    color: Colors.white,
    fontWeight: 'bold',
  },
  numberValue: {
    ...Typography.h2,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: Spacing.lg,
    minWidth: 40,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalActionButton: {
    flex: 1,
  },
});

export default PropertiesScreen;