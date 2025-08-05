import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../../store';
import { apiService } from '../../services/api';
import { Colors, Spacing, Typography } from '../../constants';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';

type MessagesScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: 'tenant' | 'landlord';
  senderName: string;
  isRead: boolean;
  type: 'text' | 'maintenance' | 'payment' | 'lease' | 'general';
}

interface Conversation {
  id: string;
  landlordName: string;
  landlordId: string;
  propertyAddress: string;
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      landlordName: 'John Smith',
      landlordId: 'landlord_1',
      propertyAddress: '123 Main St, Apt 4A',
      unreadCount: 2,
      lastMessage: {
        id: '1',
        content: 'Thank you for reporting the maintenance issue. I\'ll have someone take a look at it tomorrow.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        sender: 'landlord',
        senderName: 'John Smith',
        isRead: false,
        type: 'maintenance',
      },
      messages: [
        {
          id: '1',
          content: 'Hi John, the kitchen faucet is leaking and needs repair.',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          sender: 'tenant',
          senderName: user?.full_name || 'Tenant',
          isRead: true,
          type: 'maintenance',
        },
        {
          id: '2',
          content: 'Thank you for reporting the maintenance issue. I\'ll have someone take a look at it tomorrow.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          sender: 'landlord',
          senderName: 'John Smith',
          isRead: false,
          type: 'maintenance',
        },
        {
          id: '3',
          content: 'Also, I wanted to remind you that rent is due in 3 days.',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          sender: 'landlord',
          senderName: 'John Smith',
          isRead: false,
          type: 'payment',
        },
      ],
    },
  ]);

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMessages();
      if (response.data) {
        // Process and set real messages from API
        console.log('Messages loaded:', response.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const messageContent = newMessage.trim();
      setNewMessage('');

      // Create new message object
      const newMsg: Message = {
        id: Date.now().toString(),
        content: messageContent,
        timestamp: new Date().toISOString(),
        sender: 'tenant',
        senderName: user?.full_name || 'Tenant',
        isRead: true,
        type: 'general',
      };

      // Update local state immediately for better UX
      setConversations(prev => prev.map(conv => {
        if (conv.id === selectedConversation.id) {
          return {
            ...conv,
            messages: [...conv.messages, newMsg],
            lastMessage: newMsg,
          };
        }
        return conv;
      }));

      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newMsg],
        lastMessage: newMsg,
      } : null);

      // Send to backend
      const response = await apiService.sendMessage(selectedConversation.landlordId, messageContent);
      if (response.error) {
        Alert.alert('Message Failed', 'Unable to send message. Please try again.');
        // Optionally remove the optimistically added message
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleMarkAsRead = async (conversationId: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          unreadCount: 0,
          messages: conv.messages.map(msg => ({ ...msg, isRead: true })),
        };
      }
      return conv;
    }));
  };

  const handleConversationPress = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    handleMarkAsRead(conversation.id);
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return '🔧';
      case 'payment': return '💰';
      case 'lease': return '📄';
      case 'general': return '💬';
      default: return '💬';
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return Colors.warning;
      case 'payment': return Colors.error;
      case 'lease': return Colors.primary;
      case 'general': return Colors.textLight;
      default: return Colors.textLight;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins < 1 ? 'Just now' : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderConversationList = () => (
    <ScrollView
      style={styles.conversationsList}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {conversations.map(conversation => (
        <TouchableOpacity
          key={conversation.id}
          style={styles.conversationItem}
          onPress={() => handleConversationPress(conversation)}
        >
          <Card style={[
            styles.conversationCard,
            conversation.unreadCount > 0 && styles.unreadConversation
          ]}>
            <View style={styles.conversationHeader}>
              <View style={styles.conversationInfo}>
                <Text style={styles.landlordName}>{conversation.landlordName}</Text>
                <Text style={styles.propertyAddress}>{conversation.propertyAddress}</Text>
              </View>
              <View style={styles.conversationMeta}>
                <Text style={styles.timestamp}>
                  {formatTimestamp(conversation.lastMessage.timestamp)}
                </Text>
                {conversation.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{conversation.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.lastMessageContainer}>
              <Text style={styles.messageTypeIcon}>
                {getMessageTypeIcon(conversation.lastMessage.type)}
              </Text>
              <Text
                style={[
                  styles.lastMessage,
                  conversation.unreadCount > 0 && styles.unreadMessage
                ]}
                numberOfLines={2}
              >
                {conversation.lastMessage.sender === 'tenant' ? 'You: ' : ''}
                {conversation.lastMessage.content}
              </Text>
            </View>
          </Card>
        </TouchableOpacity>
      ))}

      {conversations.length === 0 && (
        <Card style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>💬</Text>
          <Text style={styles.emptyStateTitle}>No Messages</Text>
          <Text style={styles.emptyStateText}>
            Your conversations with landlords will appear here.
          </Text>
        </Card>
      )}
    </ScrollView>
  );

  const renderConversationView = () => {
    if (!selectedConversation) return null;

    return (
      <KeyboardAvoidingView
        style={styles.conversationView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Conversation Header */}
        <View style={styles.conversationViewHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.conversationTitleContainer}>
            <Text style={styles.conversationTitle}>{selectedConversation.landlordName}</Text>
            <Text style={styles.conversationSubtitle}>{selectedConversation.propertyAddress}</Text>
          </View>
        </View>

        {/* Messages List */}
        <ScrollView style={styles.messagesList} showsVerticalScrollIndicator={false}>
          {selectedConversation.messages.map(message => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender === 'tenant' ? styles.sentMessage : styles.receivedMessage
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.sender === 'tenant' ? styles.sentBubble : styles.receivedBubble
                ]}
              >
                <View style={styles.messageHeader}>
                  <Text style={styles.messageTypeIcon}>
                    {getMessageTypeIcon(message.type)}
                  </Text>
                  <Text style={styles.messageTimestamp}>
                    {formatTimestamp(message.timestamp)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.messageText,
                    message.sender === 'tenant' ? styles.sentText : styles.receivedText
                  ]}
                >
                  {message.content}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Message Input */}
        <View style={styles.messageInputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message..."
            placeholderTextColor={Colors.textLight}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !newMessage.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  if (isLoading && conversations.length === 0) {
    return <LoadingState message="Loading messages..." />;
  }

  return (
    <View style={styles.container}>
      {!selectedConversation ? (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>💬 Messages</Text>
            <Text style={styles.subtitle}>
              {conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)} unread messages
            </Text>
          </View>
          {renderConversationList()}
        </>
      ) : (
        renderConversationView()
      )}
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
  conversationsList: {
    flex: 1,
    padding: Spacing.lg,
  },
  conversationItem: {
    marginBottom: Spacing.md,
  },
  conversationCard: {
    padding: Spacing.lg,
  },
  unreadConversation: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  conversationInfo: {
    flex: 1,
  },
  landlordName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  propertyAddress: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    ...Typography.caption,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  unreadCount: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageTypeIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  lastMessage: {
    ...Typography.body,
    color: Colors.textLight,
    flex: 1,
    lineHeight: 20,
  },
  unreadMessage: {
    color: Colors.text,
    fontWeight: '500',
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
  },
  conversationView: {
    flex: 1,
  },
  conversationViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.primary,
  },
  conversationTitleContainer: {
    flex: 1,
  },
  conversationTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  conversationSubtitle: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  messagesList: {
    flex: 1,
    padding: Spacing.lg,
  },
  messageContainer: {
    marginBottom: Spacing.md,
  },
  sentMessage: {
    alignItems: 'flex-end',
  },
  receivedMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: Spacing.md,
  },
  sentBubble: {
    backgroundColor: Colors.primary,
  },
  receivedBubble: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  messageTimestamp: {
    ...Typography.caption,
    color: Colors.textLight,
    marginLeft: Spacing.xs,
  },
  messageText: {
    ...Typography.body,
    lineHeight: 20,
  },
  sentText: {
    color: Colors.white,
  },
  receivedText: {
    color: Colors.text,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  messageInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    color: Colors.text,
    maxHeight: 100,
    marginRight: Spacing.sm,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textLight,
    opacity: 0.5,
  },
  sendButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: 'bold',
  },
});

export default MessagesScreen;