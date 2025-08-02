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

const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

const DocumentItem = ({ document, onPress }) => (
  <TouchableOpacity style={styles.documentItem} onPress={onPress}>
    <View style={styles.documentIcon}>
      <Text style={styles.documentIconText}>📄</Text>
    </View>
    <View style={styles.documentInfo}>
      <Text style={styles.documentName}>{document.file_name}</Text>
      <Text style={styles.documentType}>{document.document_type}</Text>
      <Text style={styles.documentDate}>
        {new Date(document.created_at).toLocaleDateString()}
      </Text>
    </View>
    <Text style={styles.documentArrow}>›</Text>
  </TouchableOpacity>
);

export default function DocumentsScreen({ route }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { filter } = route?.params || {};

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      // Mock documents data
      const mockDocuments = [
        {
          id: '1',
          file_name: 'Lease Agreement 2024.pdf',
          document_type: 'lease',
          created_at: '2024-01-01'
        },
        {
          id: '2',
          file_name: 'January Payment Receipt.pdf',
          document_type: 'receipt',
          created_at: '2024-01-15'
        },
        {
          id: '3',
          file_name: 'Move-in Inspection.pdf',
          document_type: 'other',
          created_at: '2024-01-01'
        }
      ];

      let filteredDocs = mockDocuments;
      if (filter) {
        filteredDocs = mockDocuments.filter(doc => doc.document_type === filter);
      }

      setDocuments(filteredDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentPress = (document) => {
    Alert.alert(
      'Open Document',
      `Would you like to open ${document.file_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', onPress: () => Alert.alert('Coming Soon', 'Document viewer will be available soon') }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#800020" />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Documents</Text>
          <Text style={styles.subtitle}>Access your lease and rental documents</Text>
        </View>

        <Card>
          <Text style={styles.cardTitle}>Your Documents</Text>
          {documents.length > 0 ? (
            documents.map((document) => (
              <DocumentItem
                key={document.id}
                document={document}
                onPress={() => handleDocumentPress(document)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No documents available</Text>
          )}
        </Card>

        <Card style={styles.lastCard}>
          <Text style={styles.cardTitle}>Upload Document</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => Alert.alert('Coming Soon', 'Document upload will be available soon')}
          >
            <Text style={styles.uploadButtonText}>+ Upload New Document</Text>
          </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#800020',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
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
  lastCard: {
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  documentIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentIconText: {
    fontSize: 20,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  documentType: {
    fontSize: 14,
    color: '#800020',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  documentArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#800020',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#800020',
  },
});
