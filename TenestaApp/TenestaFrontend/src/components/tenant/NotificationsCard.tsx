import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Card from '../common/Card';
import { Colors } from '../../constants';
import { Notification } from '../../types';

interface NotificationsCardProps {
  notifications?: Notification[];
  isLoading?: boolean;
  onNotificationPress?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => Promise<void>;
  onViewAllNotifications?: () => void;
  style?: ViewStyle;
}

const NotificationsCard: React.FC<NotificationsCardProps> = ({
  notifications = [],
  isLoading = false,
  onNotificationPress,
  onMarkAsRead,
  onViewAllNotifications,
  style,
}) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return '💳';
      case 'maintenance':
        return '🔧';
      case 'lease':
        return '📄';
      case 'message':
        return '💬';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment':
        return Colors.payment;
      case 'maintenance':
        return Colors.warning;
      case 'lease':
        return Colors.info;
      case 'message':
        return Colors.primary;
      case 'system':
        return Colors.textSecondary;
      default:
        return Colors.primary;
    }
  };

  const formatDate = (date: string) => {
    const notificationDate = new Date(date);
    const now = new Date();
    const diffInMs = now.getTime() - notificationDate.getTime();
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
      return notificationDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if unread
    if (notification.status === 'unread' && onMarkAsRead) {
      try {
        await onMarkAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Handle action URL
    if (notification.action_url) {
      try {
        const canOpen = await Linking.canOpenURL(notification.action_url);
        if (canOpen) {
          await Linking.openURL(notification.action_url);
        }
      } catch (error) {
        console.error('Failed to open notification URL:', error);
      }
    }

    // Call custom handler if provided
    if (onNotificationPress) {
      onNotificationPress(notification);
    }
  };

  const truncateMessage = (message: string, maxLength: number = 80) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const unreadNotifications = notifications.filter(n => n.status === 'unread');
  const displayNotifications = notifications.slice(0, 4);

  if (isLoading) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle}>Notifications</Text>
          {unreadNotifications.length > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{unreadNotifications.length}</Text>
            </View>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>No notifications</Text>
          <Text style={styles.emptySubtext}>You're all caught up!</Text>
        </View>
      ) : (
        <View style={styles.notificationsList}>
          {displayNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                notification.status === 'unread' && styles.unreadNotification,
              ]}
              onPress={() => handleNotificationPress(notification)}
              accessibilityRole="button"
              accessibilityLabel={`${notification.title}, ${formatDate(notification.created_at)}`}
              accessibilityHint={notification.action_url ? 'Tap to view details' : 'Notification'}
              accessibilityState={{ selected: notification.status === 'unread' }}
            >
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.notificationIcon}>
                      {getNotificationIcon(notification.type)}
                    </Text>
                    <View
                      style={[
                        styles.typeIndicator,
                        { backgroundColor: getNotificationColor(notification.type) },
                      ]}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.notificationTitle} numberOfLines={1}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                      {truncateMessage(notification.message)}
                    </Text>
                  </View>
                  <View style={styles.rightContainer}>
                    <Text style={styles.notificationDate}>
                      {formatDate(notification.created_at)}
                    </Text>
                    {notification.status === 'unread' && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {(notifications.length > 4 || onViewAllNotifications) && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={onViewAllNotifications}
          accessibilityRole="button"
          accessibilityLabel="View all notifications"
        >
          <Text style={styles.viewAllText}>
            {notifications.length > 4
              ? `View All Notifications (${notifications.length})`
              : 'View All Notifications'
            }
          </Text>
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
  notificationsList: {
    gap: 8,
  },
  notificationItem: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: Colors.border,
  },
  unreadNotification: {
    backgroundColor: Colors.overlayLight,
    borderLeftColor: Colors.primary,
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  notificationIcon: {
    fontSize: 20,
  },
  typeIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  notificationDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    marginTop: 4,
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
});

export default NotificationsCard;