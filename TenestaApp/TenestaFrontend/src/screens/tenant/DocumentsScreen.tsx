import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../../store';
import { apiService } from '../../services/api';
import { Colors, Spacing, Typography } from '../../constants';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';

type DocumentsScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface Document {
  id: string;
  title: string;
  type: 'lease' | 'receipt' | 'notice' | 'maintenance' | 'insurance' | 'other';
  dateAdded: string;
  size: string;
  fileUrl?: string;
  description?: string;
  isImportant: boolean;
  landlordNote?: string;
}

const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      title: 'Lease Agreement',
      type: 'lease',
      dateAdded: '2024-01-15',
      size: '2.4 MB',
      fileUrl: 'https://example.com/lease.pdf',
      description: 'Original lease agreement for 123 Main St, Apt 4A',
      isImportant: true,
      landlordNote: 'Please keep this document safe for your records.',
    },
    {
      id: '2',
      title: 'January Rent Receipt',
      type: 'receipt',
      dateAdded: '2024-01-01',
      size: '156 KB',
      fileUrl: 'https://example.com/receipt_jan.pdf',
      description: 'Payment receipt for January 2024 rent',
      isImportant: false,
    },
    {
      id: '3',
      title: 'Building Rules & Regulations',
      type: 'notice',
      dateAdded: '2024-01-15',
      size: '1.2 MB',
      fileUrl: 'https://example.com/building_rules.pdf',
      description: 'Updated building policies effective February 2024',
      isImportant: true,
      landlordNote: 'Please review the updated quiet hours policy.',
    },
    {
      id: '4',
      title: 'Maintenance Request Receipt',
      type: 'maintenance',
      dateAdded: '2024-02-10',
      size: '89 KB',
      description: 'Confirmation for kitchen faucet repair request',
      isImportant: false,
    },
    {
      id: '5',
      title: 'Renters Insurance Policy',
      type: 'insurance',
      dateAdded: '2024-01-20',
      size: '3.1 MB',
      fileUrl: 'https://example.com/insurance.pdf',
      description: 'Renters insurance policy - expires Dec 2024',
      isImportant: true,
    },
  ]);

  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(documents);
  const [selectedFilter, setSelectedFilter] = useState<'all' | Document['type']>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [selectedFilter, documents]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getLeaseDocuments();
      if (response.data) {
        // Process and set real documents from API
        console.log('Documents loaded:', response.data);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  }, []);

  const applyFilter = () => {
    if (selectedFilter === 'all') {
      setFilteredDocuments(documents);
    } else {
      setFilteredDocuments(documents.filter(doc => doc.type === selectedFilter));
    }
  };

  const handleDocumentPress = async (document: Document) => {
    if (document.fileUrl) {
      try {
        const supported = await Linking.canOpenURL(document.fileUrl);
        if (supported) {
          await Linking.openURL(document.fileUrl);
        } else {
          Alert.alert('Cannot Open', 'Unable to open this document type.');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open document.');
      }
    } else {
      Alert.alert('Document Unavailable', 'This document is not available for viewing yet.');
    }
  };

  const handleDownloadDocument = (document: Document) => {
    if (document.fileUrl) {
      Alert.alert(
        'Download Document',
        `Download ${document.title}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Download', 
            onPress: () => {
              // In a real app, this would trigger a download
              Alert.alert('Download Started', 'Document download has started.');
            }
          },
        ]
      );
    } else {
      Alert.alert('Download Unavailable', 'This document cannot be downloaded at this time.');
    }
  };

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'lease': return '📄';
      case 'receipt': return '🧾';
      case 'notice': return '📢';
      case 'maintenance': return '🔧';
      case 'insurance': return '🛡️';
      case 'other': return '📎';
      default: return '📄';
    }
  };

  const getDocumentTypeColor = (type: Document['type']) => {
    switch (type) {
      case 'lease': return Colors.primary;
      case 'receipt': return Colors.success;
      case 'notice': return Colors.warning;
      case 'maintenance': return Colors.warning;
      case 'insurance': return Colors.primary;
      case 'other': return Colors.textLight;
      default: return Colors.textLight;
    }
  };

  const formatDocumentType = (type: Document['type']) => {
    switch (type) {
      case 'lease': return 'Lease';
      case 'receipt': return 'Receipt';
      case 'notice': return 'Notice';
      case 'maintenance': return 'Maintenance';
      case 'insurance': return 'Insurance';
      case 'other': return 'Other';
      default: return 'Document';
    }
  };

  const renderFilterButtons = () => {
    const filters: Array<{ key: 'all' | Document['type']; label: string; count: number }> = [
      { key: 'all', label: 'All', count: documents.length },
      { key: 'lease', label: 'Lease', count: documents.filter(d => d.type === 'lease').length },
      { key: 'receipt', label: 'Receipts', count: documents.filter(d => d.type === 'receipt').length },
      { key: 'notice', label: 'Notices', count: documents.filter(d => d.type === 'notice').length },
      { key: 'maintenance', label: 'Maintenance', count: documents.filter(d => d.type === 'maintenance').length },
      { key: 'insurance', label: 'Insurance', count: documents.filter(d => d.type === 'insurance').length },
    ];

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === filter.key && styles.filterButtonTextActive
            ]}>
              {filter.label} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderDocument = (document: Document) => (
    <TouchableOpacity
      key={document.id}
      onPress={() => handleDocumentPress(document)}
      style={styles.documentTouchable}
    >
      <Card style={[
        styles.documentCard,
        document.isImportant && styles.importantDocument
      ]}>
        <View style={styles.documentHeader}>
          <View style={styles.documentInfo}>
            <View style={styles.documentTitleRow}>
              <Text style={styles.documentIcon}>
                {getDocumentIcon(document.type)}
              </Text>
              <Text style={styles.documentTitle}>{document.title}</Text>
              {document.isImportant && (
                <Text style={styles.importantIcon}>⭐</Text>
              )}
            </View>
            <Text style={styles.documentDescription}>
              {document.description || 'No description available'}
            </Text>
          </View>
          <View style={styles.documentMeta}>
            <Text style={[
              styles.documentType,
              { color: getDocumentTypeColor(document.type) }
            ]}>
              {formatDocumentType(document.type)}
            </Text>
            <Text style={styles.documentSize}>{document.size}</Text>
          </View>
        </View>

        <View style={styles.documentFooter}>
          <Text style={styles.documentDate}>
            Added: {new Date(document.dateAdded).toLocaleDateString()}
          </Text>
          {document.landlordNote && (
            <Text style={styles.landlordNote}>
              Note: {document.landlordNote}
            </Text>
          )}
        </View>

        <View style={styles.documentActions}>
          <Button
            title="View"
            variant="primary"
            size="small"
            onPress={() => handleDocumentPress(document)}
            style={styles.actionButton}
          />
          <Button
            title="Download"
            variant="outline"
            size="small"
            onPress={() => handleDownloadDocument(document)}
            style={styles.actionButton}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (isLoading && documents.length === 0) {
    return <LoadingState message="Loading documents..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📄 Documents</Text>
        <Text style={styles.subtitle}>
          {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
          {documents.filter(d => d.isImportant).length > 0 && 
            ` • ${documents.filter(d => d.isImportant).length} important`
          }
        </Text>
      </View>

      {/* Filters */}
      {renderFilterButtons()}

      {/* Documents List */}
      <ScrollView
        style={styles.documentsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Important Documents First */}
        {filteredDocuments.filter(d => d.isImportant).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⭐ Important Documents</Text>
            {filteredDocuments.filter(d => d.isImportant).map(renderDocument)}
          </View>
        )}

        {/* Other Documents */}
        {filteredDocuments.filter(d => !d.isImportant).length > 0 && (
          <View style={styles.section}>
            {filteredDocuments.filter(d => d.isImportant).length > 0 && (
              <Text style={styles.sectionTitle}>Other Documents</Text>
            )}
            {filteredDocuments.filter(d => !d.isImportant).map(renderDocument)}
          </View>
        )}

        {filteredDocuments.length === 0 && (
          <Card style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📄</Text>
            <Text style={styles.emptyStateTitle}>No Documents Found</Text>
            <Text style={styles.emptyStateText}>
              {selectedFilter === 'all' 
                ? 'Your documents will appear here when your landlord shares them with you.'
                : `No ${formatDocumentType(selectedFilter as Document['type']).toLowerCase()} documents found.`
              }
            </Text>
          </Card>
        )}

        {/* Quick Info Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>📋 Document Tips</Text>
          <Text style={styles.infoText}>
            • Important documents are marked with a star ⭐
            {'\n'}• Tap any document to view it
            {'\n'}• Use the download button to save documents locally
            {'\n'}• Keep receipts for tax purposes
            {'\n'}• Review lease documents carefully
          </Text>
        </Card>
      </ScrollView>
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
    ...Typography.caption,
    color: Colors.textLight,
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.background,
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
  documentsList: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  documentTouchable: {
    marginBottom: Spacing.md,
  },
  documentCard: {
    padding: Spacing.lg,
  },
  importantDocument: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  documentInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  documentIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  documentTitle: {
    ...Typography.h3,
    color: Colors.text,
    flex: 1,
  },
  importantIcon: {
    fontSize: 16,
    marginLeft: Spacing.xs,
  },
  documentDescription: {
    ...Typography.body,
    color: Colors.textLight,
    lineHeight: 20,
  },
  documentMeta: {
    alignItems: 'flex-end',
  },
  documentType: {
    ...Typography.caption,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  documentSize: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  documentFooter: {
    marginBottom: Spacing.md,
  },
  documentDate: {
    ...Typography.caption,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  landlordNote: {
    ...Typography.caption,
    color: Colors.primary,
    fontStyle: 'italic',
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: 4,
  },
  documentActions: {
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
  infoCard: {
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  infoTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  infoText: {
    ...Typography.body,
    color: Colors.textLight,
    lineHeight: 22,
  },
});

export default DocumentsScreen;