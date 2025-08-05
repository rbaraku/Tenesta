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

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
  badge?: {
    count: number;
    color?: string;
  };
  disabled?: boolean;
}

interface QuickActionButtonsProps {
  actions?: QuickAction[];
  onPayRent?: () => void;
  onViewDocuments?: () => void;
  onContactLandlord?: () => void;
  onViewPaymentHistory?: () => void;
  onMaintenanceRequest?: () => void;
  onViewMessages?: () => void;
  unreadMessageCount?: number;
  pendingMaintenanceCount?: number;
  style?: ViewStyle;
}

const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({
  actions,
  onPayRent,
  onViewDocuments,
  onContactLandlord,
  onViewPaymentHistory,
  onMaintenanceRequest,
  onViewMessages,
  unreadMessageCount = 0,
  pendingMaintenanceCount = 0,
  style,
}) => {
  // Default actions if none provided
  const defaultActions: QuickAction[] = [
    {
      id: 'pay_rent',
      title: 'Pay Rent',
      subtitle: 'Make payment',
      icon: '💳',
      onPress: onPayRent || (() => {}),
      disabled: !onPayRent,
    },
    {
      id: 'documents',
      title: 'Documents',
      subtitle: 'View lease & receipts',
      icon: '📄',
      onPress: onViewDocuments || (() => {}),
      disabled: !onViewDocuments,
    },
    {
      id: 'messages',
      title: 'Messages',
      subtitle: 'Chat with landlord',
      icon: '💬',
      onPress: onViewMessages || (() => {}),
      badge: unreadMessageCount > 0 ? {
        count: unreadMessageCount,
        color: Colors.error,
      } : undefined,
      disabled: !onViewMessages,
    },
    {
      id: 'maintenance',
      title: 'Maintenance',
      subtitle: 'Report issues',
      icon: '🔧',
      onPress: onMaintenanceRequest || (() => {}),
      badge: pendingMaintenanceCount > 0 ? {
        count: pendingMaintenanceCount,
        color: Colors.warning,
      } : undefined,
      disabled: !onMaintenanceRequest,
    },
    {
      id: 'payment_history',
      title: 'Payment History',
      subtitle: 'View past payments',
      icon: '📊',
      onPress: onViewPaymentHistory || (() => {}),
      disabled: !onViewPaymentHistory,
    },
    {
      id: 'contact',
      title: 'Contact Landlord',
      subtitle: 'Call or email',
      icon: '📞',
      onPress: onContactLandlord || (() => {}),
      disabled: !onContactLandlord,
    },
  ];

  const actionsToRender = actions || defaultActions;

  const renderActionButton = (action: QuickAction, index: number) => {
    return (
      <TouchableOpacity
        key={action.id}
        style={[
          styles.actionButton,
          action.disabled && styles.disabledButton,
        ]}
        onPress={action.onPress}
        disabled={action.disabled}
        accessibilityRole="button"
        accessibilityLabel={`${action.title}, ${action.subtitle}`}
        accessibilityHint={action.disabled ? 'This action is not available' : 'Tap to perform action'}
        accessibilityState={{ disabled: action.disabled }}
      >
        <View style={styles.actionContent}>
          <View style={styles.iconContainer}>
            <Text style={[styles.actionIcon, action.disabled && styles.disabledIcon]}>
              {action.icon}
            </Text>
            {action.badge && action.badge.count > 0 && (
              <View style={[styles.badge, { backgroundColor: action.badge.color || Colors.error }]}>
                <Text style={styles.badgeText}>
                  {action.badge.count > 99 ? '99+' : action.badge.count.toString()}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.actionTitle, action.disabled && styles.disabledText]}>
            {action.title}
          </Text>
          <Text style={[styles.actionSubtitle, action.disabled && styles.disabledText]}>
            {action.subtitle}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {actionsToRender.map((action, index) => renderActionButton(action, index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    minWidth: 140,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: Colors.surfaceDark,
  },
  actionContent: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 32,
  },
  disabledIcon: {
    opacity: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  badgeText: {
    color: Colors.textOnPrimary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  disabledText: {
    color: Colors.textLight,
  },
});

export default QuickActionButtons;