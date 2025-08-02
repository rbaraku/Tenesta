import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

const MessageItem = ({ message, onPress }) => (
  <TouchableOpacity style={styles.messageItem} onPress={onPress}>
    <View style={styles.messageInfo}>
      <Text style={styles.messageSubject}>{message.subject}</Text>
      <Text style={styles.messagePreview}>{message.content}</Text>
      <Text style={styles.messageDate}>
        {new Date(message.created_at).toLocaleDateString()}
      </Text>
    </View>
    <View style={[
      styles.messageBadge,
      message.read_at ? styles.readBadge : styles.unreadBadge
    ]} />
  </TouchableOpacity>
);

export default function MessagesScreen({ route }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const { newDispute } = route?.params || {};

  useEffect(() => {
    loadMessages();
    if (newDispute) {
      setShowCompose(true);
    }
  }, []);

  const loadMessages = async () => {
    try {
      // Mock messages data
      const mockMessages = [
        {
          id: '1',
          subject: 'Maintenance Request - Heating',
          content: 'The heating system in my apartment is not working properly...',
          created_at: '2024-01-15',
          read_at: null
        },
        {
          id: '2',
          subject: 'Lease Renewal Discussion',
          content: 'I would like to discuss renewing my lease for another year...',
          created_at: '2024-01-10',
          read_at: '2024-01-11'
        }
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    Alert.alert(
      'Send Message',
      'Your message has been sent to your landlord!',
      [
        {
          text: 'OK',
          onPress: () => {
            setNewMessage('');
            setShowCompose(false);
          }
        }
      ]
    );
  };

  const handleMessagePress = (message) => {
    Alert.alert(
      message.subject,
      message.content,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <TouchableOpacity
            style={styles.composeButton}
            onPress={() => setShowCompose(!showCompose)}
          >
            <Text style={styles.composeButtonText}>
              {showCompose ? 'Cancel' : '+ New Message'}
            </Text>
          </TouchableOpacity>
        </View>

        {showCompose && (
          <Card style={styles.composeCard}>
            <Text style={styles.cardTitle}>Send Message</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message to your landlord..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
            >
              <Text style={styles.sendButtonText}>Send Message</Text>
            </TouchableOpacity>
          </Card>
        )}

        <Card>
          <Text style={styles.cardTitle}>Recent Messages</Text>
          {messages.length > 0 ? (
            messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                onPress={() => handleMessagePress(message)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No messages yet</Text>
          )}
        </Card>

        <Card style={styles.lastCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCompose(true)}
          >
            <Text style={styles.actionButtonText}>Report Maintenance Issue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCompose(true)}
          >
            <Text style={styles.actionButtonText}>Ask Question</Text>
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
  composeButton: {
    backgroundColor: '#800020',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  composeButtonText: {
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
  composeCard: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#800020',
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
  messageInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#800020',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  messageInfo: {
    flex: 1,
  },
  messageSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  messageDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  messageBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  unreadBadge: {
    backgroundColor: '#800020',
  },
  readBadge: {
    backgroundColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionButton: {
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
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
