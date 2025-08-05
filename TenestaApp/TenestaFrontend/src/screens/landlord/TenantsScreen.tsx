import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../../store';
import {
  fetchTenants,
  setSearchQuery,
  setFilterBy,
  setSortBy,
  selectTenant,
  clearError,
  updateTenantNotes,
  sendTenantMessage,
  Tenant,
} from '../../store/slices/tenantSlice';
import { Colors, Spacing, Typography } from '../../constants';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';

type TenantsScreenProps = {
  navigation: StackNavigationProp<any>;
};

const TenantsScreen: React.FC<TenantsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    filteredTenants,
    selectedTenant,
    isLoading,
    error,
    searchQuery,
    filterBy,
    sortBy,
    sortOrder,
  } = useSelector((state: RootState) => state.tenant);

  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchTenants());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchTenants());
    setRefreshing(false);
  }, [dispatch]);

  const handleTenantPress = (tenant: Tenant) => {
    dispatch(selectTenant(tenant));
    setShowTenantModal(true);
  };

  const handleCallTenant = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('No Phone Number', 'No phone number available for this tenant.');
    }
  };

  const handleEmailTenant = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleAddNotes = (tenant: Tenant) => {
    dispatch(selectTenant(tenant));
    setNotes(tenant.notes || '');
    setShowNotesModal(true);
  };

  const handleSaveNotes = async () => {
    if (selectedTenant) {
      await dispatch(updateTenantNotes({ tenantId: selectedTenant.id, notes }));
      setShowNotesModal(false);
      setNotes('');
    }
  };

  const handleSendMessage = (tenant: Tenant) => {
    dispatch(selectTenant(tenant));
    setMessage('');
    setShowMessageModal(true);
  };

  const handleSendMessageSubmit = async () => {
    if (selectedTenant && message.trim()) {
      await dispatch(sendTenantMessage({ tenantId: selectedTenant.id, message: message.trim() }));
      setShowMessageModal(false);
      setMessage('');
      Alert.alert('Success', 'Message sent successfully!');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return Colors.success;
      case 'pending': return Colors.warning;
      case 'former': return Colors.textLight;
      default: return Colors.textLight;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return Colors.success;
      case 'pending': return Colors.warning;
      case 'overdue': return Colors.error;
      default: return Colors.textLight;
    }
  };

  const renderTenantCard = (tenant: Tenant) => (
    <TouchableOpacity
      key={tenant.id}
      onPress={() => handleTenantPress(tenant)}
      style={styles.tenantCardTouchable}
    >
      <Card style={styles.tenantCard}>
        <View style={styles.tenantHeader}>
          <View style={styles.tenantInfo}>
            <Text style={styles.tenantName}>{tenant.name}</Text>
            <Text style={styles.tenantEmail}>{tenant.email}</Text>
            <Text style={styles.tenantUnit}>{tenant.unit}</Text>
          </View>
          <View style={styles.tenantStatus}>
            <Text style={[styles.statusTag, { backgroundColor: getStatusColor(tenant.status) }]}>
              {tenant.status.toUpperCase()}
            </Text>
            <Text style={[styles.paymentStatus, { color: getPaymentStatusColor(tenant.paymentStatus) }]}>
              {tenant.paymentStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.tenantDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Rent Amount</Text>
            <Text style={styles.detailValue}>${tenant.rentAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Lease Ends</Text>
            <Text style={styles.detailValue}>
              {new Date(tenant.leaseEndDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Days Until End</Text>
            <Text style={[
              styles.detailValue,
              { color: tenant.daysUntilLeaseEnd < 30 ? Colors.warning : Colors.text }
            ]}>
              {tenant.daysUntilLeaseEnd > 0 ? tenant.daysUntilLeaseEnd : 'Expired'}
            </Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleCallTenant(tenant.phone)}
          >
            <Text style={styles.quickActionIcon}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleEmailTenant(tenant.email)}
          >
            <Text style={styles.quickActionIcon}>✉️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleSendMessage(tenant)}
          >
            <Text style={styles.quickActionIcon}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleAddNotes(tenant)}
          >
            <Text style={styles.quickActionIcon}>📝</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderFilterButtons = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
      {[
        { key: 'all', label: 'All', count: filteredTenants.length },
        { key: 'active', label: 'Active', count: filteredTenants.filter(t => t.status === 'active').length },
        { key: 'pending', label: 'Ending Soon', count: filteredTenants.filter(t => t.status === 'pending').length },
        { key: 'former', label: 'Former', count: filteredTenants.filter(t => t.status === 'former').length },
        { key: 'overdue', label: 'Overdue', count: filteredTenants.filter(t => t.paymentStatus === 'overdue').length },
      ].map(filter => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            filterBy === filter.key && styles.filterButtonActive
          ]}
          onPress={() => dispatch(setFilterBy(filter.key as any))}
        >
          <Text style={[
            styles.filterButtonText,
            filterBy === filter.key && styles.filterButtonTextActive
          ]}>
            {filter.label} ({filter.count})
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderSortButtons = () => (
    <View style={styles.sortContainer}>
      <Text style={styles.sortLabel}>Sort by:</Text>
      {[
        { key: 'name', label: 'Name' },
        { key: 'unit', label: 'Unit' },
        { key: 'leaseEnd', label: 'Lease End' },
        { key: 'paymentStatus', label: 'Payment' },
      ].map(sort => (
        <TouchableOpacity
          key={sort.key}
          style={[
            styles.sortButton,
            sortBy === sort.key && styles.sortButtonActive
          ]}
          onPress={() => dispatch(setSortBy({ sortBy: sort.key as any }))}
        >
          <Text style={[
            styles.sortButtonText,
            sortBy === sort.key && styles.sortButtonTextActive
          ]}>
            {sort.label}
            {sortBy === sort.key && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading && filteredTenants.length === 0) {
    return <LoadingState message="Loading tenants..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>👥 Tenant Management</Text>
        <Text style={styles.subtitle}>
          {filteredTenants.length} tenant{filteredTenants.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tenants, units, or properties..."
          placeholderTextColor={Colors.textLight}
          value={searchQuery}
          onChangeText={(text) => dispatch(setSearchQuery(text))}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Filters */}
      {renderFilterButtons()}

      {/* Sort Options */}
      {renderSortButtons()}

      {/* Tenants List */}
      <ScrollView
        style={styles.tenantsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredTenants.length === 0 ? (
          <Card style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>👥</Text>
            <Text style={styles.emptyStateTitle}>No Tenants Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || filterBy !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'Your tenants will appear here once they are added to properties.'}
            </Text>
          </Card>
        ) : (
          filteredTenants.map(renderTenantCard)
        )}
      </ScrollView>

      {/* Tenant Detail Modal */}
      <Modal
        visible={showTenantModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTenantModal(false)}
      >
        <View style={styles.modalContainer}>
          {selectedTenant && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedTenant.name}</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowTenantModal(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <Card style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Contact Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailRowLabel}>Email:</Text>
                    <Text style={styles.detailRowValue}>{selectedTenant.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailRowLabel}>Phone:</Text>
                    <Text style={styles.detailRowValue}>
                      {selectedTenant.phone || 'Not provided'}
                    </Text>
                  </View>
                </Card>

                <Card style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Lease Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailRowLabel}>Property:</Text>
                    <Text style={styles.detailRowValue}>{selectedTenant.property}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailRowLabel}>Unit:</Text>
                    <Text style={styles.detailRowValue}>{selectedTenant.unit}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailRowLabel}>Rent Amount:</Text>
                    <Text style={styles.detailRowValue}>${selectedTenant.rentAmount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailRowLabel}>Lease End Date:</Text>
                    <Text style={styles.detailRowValue}>
                      {new Date(selectedTenant.leaseEndDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailRowLabel}>Days Until End:</Text>
                    <Text style={[
                      styles.detailRowValue,
                      { color: selectedTenant.daysUntilLeaseEnd < 30 ? Colors.warning : Colors.text }
                    ]}>
                      {selectedTenant.daysUntilLeaseEnd > 0 
                        ? `${selectedTenant.daysUntilLeaseEnd} days` 
                        : 'Expired'}
                    </Text>
                  </View>
                </Card>

                <Card style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Payment Status</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailRowLabel}>Current Status:</Text>
                    <Text style={[
                      styles.detailRowValue,
                      { color: getPaymentStatusColor(selectedTenant.paymentStatus) }
                    ]}>
                      {selectedTenant.paymentStatus.toUpperCase()}
                    </Text>
                  </View>
                  {selectedTenant.lastPaymentDate && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailRowLabel}>Last Payment:</Text>
                      <Text style={styles.detailRowValue}>
                        {new Date(selectedTenant.lastPaymentDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </Card>

                {selectedTenant.notes && (
                  <Card style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>Notes</Text>
                    <Text style={styles.notesText}>{selectedTenant.notes}</Text>
                  </Card>
                )}

                <View style={styles.actionButtons}>
                  <Button
                    title="Call Tenant"
                    variant="primary"
                    onPress={() => handleCallTenant(selectedTenant.phone)}
                    style={styles.actionButton}
                  />
                  <Button
                    title="Send Email"
                    variant="secondary"
                    onPress={() => handleEmailTenant(selectedTenant.email)}
                    style={styles.actionButton}
                  />
                  <Button
                    title="Send Message"
                    variant="outline"
                    onPress={() => handleSendMessage(selectedTenant)}
                    style={styles.actionButton}
                  />
                  <Button
                    title="Add Notes"
                    variant="outline"
                    onPress={() => handleAddNotes(selectedTenant)}
                    style={styles.actionButton}
                  />
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Notes</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowNotesModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about this tenant..."
              placeholderTextColor={Colors.textLight}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowNotesModal(false)}
                style={styles.modalButton}
              />
              <Button
                title="Save Notes"
                variant="primary"
                onPress={handleSaveNotes}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Message Modal */}
      <Modal
        visible={showMessageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Message</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowMessageModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.messageLabel}>
              Sending to: {selectedTenant?.name}
            </Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message..."
              placeholderTextColor={Colors.textLight}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowMessageModal(false)}
                style={styles.modalButton}
              />
              <Button
                title="Send Message"
                variant="primary"
                onPress={handleSendMessageSubmit}
                style={styles.modalButton}
                disabled={!message.trim()}
              />
            </View>
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
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textLight,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
  },
  searchIcon: {
    paddingRight: Spacing.md,
    fontSize: 20,
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    ...Typography.caption,
    color: Colors.text,
  },
  filterButtonTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sortLabel: {
    ...Typography.caption,
    color: Colors.textLight,
    marginRight: Spacing.sm,
  },
  sortButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
  },
  sortButtonText: {
    ...Typography.caption,
    color: Colors.text,
  },
  sortButtonTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  tenantsList: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  tenantCardTouchable: {
    marginBottom: Spacing.md,
  },
  tenantCard: {
    padding: Spacing.md,
  },
  tenantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  tenantEmail: {
    ...Typography.body,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  tenantUnit: {
    ...Typography.body,
    color: Colors.text,
  },
  tenantStatus: {
    alignItems: 'flex-end',
  },
  statusTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    ...Typography.caption,
    color: Colors.white,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  paymentStatus: {
    ...Typography.caption,
    fontWeight: 'bold',
  },
  tenantDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  detailValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.sm,
  },
  quickActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionIcon: {
    fontSize: 20,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
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
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    ...Typography.body,
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  detailCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  detailCardTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailRowLabel: {
    ...Typography.body,
    color: Colors.textLight,
  },
  detailRowValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: 'bold',
  },
  notesText: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 24,
  },
  actionButtons: {
    marginTop: Spacing.lg,
  },
  actionButton: {
    marginBottom: Spacing.md,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    minHeight: 120,
  },
  messageLabel: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  messageInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    minHeight: 120,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});

export default TenantsScreen;