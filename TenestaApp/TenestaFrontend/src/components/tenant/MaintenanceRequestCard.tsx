import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { Colors } from '../../constants';
import { MaintenanceRequest } from '../../types';

interface MaintenanceRequestCardProps {
  recentRequests?: MaintenanceRequest[];
  isLoading?: boolean;
  onCreateRequest: (request: {
    title: string;
    description: string;
    category: string;
    priority: string;
  }) => Promise<void>;
  onViewAllRequests?: () => void;
  style?: ViewStyle;
}

const MaintenanceRequestCard: React.FC<MaintenanceRequestCardProps> = ({
  recentRequests = [],
  isLoading = false,
  onCreateRequest,
  onViewAllRequests,
  style,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
  });

  const categories = [
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'hvac', label: 'HVAC' },
    { value: 'appliance', label: 'Appliances' },
    { value: 'general', label: 'General' },
    { value: 'other', label: 'Other' },
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return Colors.info;
      case 'in_progress':
        return Colors.warning;
      case 'completed':
        return Colors.success;
      case 'cancelled':
        return Colors.textSecondary;
      default:
        return Colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return Colors.error;
      case 'high':
        return Colors.warning;
      case 'medium':
        return Colors.info;
      case 'low':
        return Colors.textSecondary;
      default:
        return Colors.textSecondary;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCreateRequest = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateRequest(formData);
      setFormData({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
      });
      setShowCreateModal(false);
      Alert.alert('Success', 'Maintenance request submitted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit maintenance request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelCreate = () => {
    setFormData({
      title: '',
      description: '',
      category: 'general',
      priority: 'medium',
    });
    setShowCreateModal(false);
  };

  if (isLoading) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading maintenance requests...</Text>
        </View>
      </Card>
    );
  }

  return (
    <>
      <Card style={[styles.container, style]}>
        <View style={styles.header}>
          <Text style={styles.cardTitle}>Maintenance</Text>
          <Button
            title="New Request"
            onPress={() => setShowCreateModal(true)}
            size="small"
            variant="outline"
            accessibilityLabel="Create new maintenance request"
          />
        </View>

        {recentRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔧</Text>
            <Text style={styles.emptyText}>No maintenance requests</Text>
            <Text style={styles.emptySubtext}>Tap "New Request" to report an issue</Text>
          </View>
        ) : (
          <View style={styles.requestsList}>
            {recentRequests.slice(0, 3).map((request) => (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestTitle} numberOfLines={1}>
                    {request.title}
                  </Text>
                  <View style={styles.requestBadges}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(request.priority) }]}>
                      <Text style={styles.badgeText}>{request.priority.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                      <Text style={styles.badgeText}>{request.status.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.requestCategory}>{request.category.toUpperCase()}</Text>
                <Text style={styles.requestDate}>
                  Created {formatDate(request.created_at)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {recentRequests.length > 3 && onViewAllRequests && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={onViewAllRequests}
            accessibilityRole="button"
            accessibilityLabel="View all maintenance requests"
          >
            <Text style={styles.viewAllText}>View All Requests ({recentRequests.length})</Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Create Request Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelCreate}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={handleCancelCreate}
              style={styles.cancelButton}
              accessibilityRole="button"
              accessibilityLabel="Cancel request creation"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Maintenance Request</Text>
            <View style={styles.spacer} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Input
              label="Title *"
              placeholder="Brief description of the issue"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              style={styles.input}
            />

            <Input
              label="Description *"
              placeholder="Detailed description of the problem"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
              style={styles.input}
            />

            {/* Category Selection */}
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.optionsContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.optionButton,
                    formData.category === category.value && styles.selectedOption,
                  ]}
                  onPress={() => setFormData({ ...formData, category: category.value })}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${category.label} category`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.category === category.value && styles.selectedOptionText,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Priority Selection */}
            <Text style={styles.sectionLabel}>Priority</Text>
            <View style={styles.optionsContainer}>
              {priorities.map((priority) => (
                <TouchableOpacity
                  key={priority.value}
                  style={[
                    styles.optionButton,
                    formData.priority === priority.value && styles.selectedOption,
                  ]}
                  onPress={() => setFormData({ ...formData, priority: priority.value })}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${priority.label} priority`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.priority === priority.value && styles.selectedOptionText,
                    ]}
                  >
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Submit Request"
              onPress={handleCreateRequest}
              loading={isSubmitting}
              disabled={!formData.title.trim() || !formData.description.trim()}
              fullWidth
            />
          </View>
        </View>
      </Modal>
    </>
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  requestsList: {
    gap: 16,
  },
  requestItem: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  requestBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    letterSpacing: 0.5,
  },
  requestCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 16,
  },
  viewAllText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  input: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  selectedOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: Colors.textOnPrimary,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

export default MaintenanceRequestCard;