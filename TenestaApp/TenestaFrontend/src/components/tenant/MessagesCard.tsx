import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import Card from '../common/Card';
import Button from '../common/Button';
import { Colors } from '../../constants';
import { Message } from '../../types';

interface MessagesCardProps {
  unreadMessages?: Message[];
  isLoading?: boolean;
  onSendMessage?: (content: string) => Promise<void>;
  onViewAllMessages?: () => void;
  onMarkAsRead?: (messageId: string) => Promise<void>;
  landlordName?: string;
  style?: ViewStyle;
}

const MessagesCard: React.FC<MessagesCardProps> = ({
  unreadMessages = [],
  isLoading = false,
  onSendMessage,
  onViewAllMessages,
  onMarkAsRead,
  landlordName = 'Landlord',
  style,
}) => {
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const formatDate = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInMs = now.getTime() - messageDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !onSendMessage) {
      return;
    }

    setIsSending(true);
    try {
      await onSendMessage(messageText.trim());
      setMessageText('');
      setShowComposeModal(false);
      Alert.alert('Success', 'Message sent successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleMessagePress = async (message: Message) => {
    if (!message.read && onMarkAsRead) {
      try {
        await onMarkAsRead(message.id);
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }
  };

  const truncateMessage = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </Card>
    );
  }

  return (
    <>
      <Card style={[styles.container, style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.cardTitle}>Messages</Text>
            {unreadMessages.length > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{unreadMessages.length}</Text>
              </View>
            )}
          </View>
          {onSendMessage && (
            <Button
              title="New Message"
              onPress={() => setShowComposeModal(true)}
              size="small"
              variant="outline"
              accessibilityLabel="Compose new message"
            />
          )}
        </View>

        {unreadMessages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No new messages</Text>
            <Text style={styles.emptySubtext}>
              {onSendMessage
                ? 'Tap "New Message" to contact your landlord'
                : 'Check back later for updates'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.messagesList}>
            {unreadMessages.slice(0, 3).map((message) => (
              <TouchableOpacity
                key={message.id}
                style={styles.messageItem}
                onPress={() => handleMessagePress(message)}
                accessibilityRole="button"
                accessibilityLabel={`Message from ${landlordName}, ${formatDate(message.created_at)}`}
                accessibilityHint="Tap to view full message"
              >
                <View style={styles.messageHeader}>
                  <Text style={styles.senderName}>{landlordName}</Text>
                  <View style={styles.messageInfo}>
                    <Text style={styles.messageDate}>{formatDate(message.created_at)}</Text>
                    {!message.read && <View style={styles.unreadDot} />}
                  </View>
                </View>
                <Text style={styles.messagePreview} numberOfLines={2}>
                  {truncateMessage(message.content)}
                </Text>
                {message.type !== 'text' && (
                  <View style={styles.attachmentIndicator}>
                    <Text style={styles.attachmentText}>
                      {message.type === 'image' ? '📸 Image' : '📄 Document'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {(unreadMessages.length > 3 || onViewAllMessages) && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={onViewAllMessages}
            accessibilityRole="button"
            accessibilityLabel="View all messages"
          >
            <Text style={styles.viewAllText}>
              {unreadMessages.length > 3
                ? `View All Messages (${unreadMessages.length} unread)`
                : 'View All Messages'
              }
            </Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Compose Message Modal */}
      <Modal
        visible={showComposeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComposeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowComposeModal(false)}
              style={styles.cancelButton}
              accessibilityRole="button"
              accessibilityLabel="Cancel message composition"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Message {landlordName}</Text>
            <TouchableOpacity
              onPress={handleSendMessage}
              style={[styles.sendButton, (!messageText.trim() || isSending) && styles.disabledButton]}
              disabled={!messageText.trim() || isSending}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Text style={[styles.sendText, (!messageText.trim() || isSending) && styles.disabledText]}>
                {isSending ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.composeContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message..."
              placeholderTextColor={Colors.textLight}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              textAlignVertical="top"
              maxLength={1000}
              autoFocus
              accessibilityLabel="Message text input"
              accessibilityHint="Enter your message to send to landlord"
            />
            <View style={styles.inputFooter}>
              <Text style={styles.characterCount}>
                {messageText.length}/1000
              </Text>
            </View>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  unreadBadge: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: 'bold',
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
  messagesList: {
    gap: 12,
  },
  messageItem: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    marginLeft: 8,
  },
  messagePreview: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  attachmentIndicator: {
    marginTop: 8,
  },
  attachmentText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
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
  sendButton: {
    paddingVertical: 8,
  },
  sendText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: Colors.textSecondary,
  },
  composeContainer: {
    flex: 1,
    padding: 20,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    textAlignVertical: 'top',
    padding: 0,
  },
  inputFooter: {
    alignItems: 'flex-end',
    paddingTop: 12,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default MessagesCard;