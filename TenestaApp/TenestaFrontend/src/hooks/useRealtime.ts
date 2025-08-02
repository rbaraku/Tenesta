import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { realtimeService } from '../services/realtime';
import { updatePaymentStatus } from '../store/slices/paymentSlice';
import { Message, Payment } from '../types';

export const useRealtimeMessages = (onNewMessage?: (message: Message) => void) => {
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!user?.id) return;

    const subscription = realtimeService.subscribeToMessages(
      user.id,
      (message: Message) => {
        console.log('New message received:', message);
        onNewMessage?.(message);
      }
    );

    return () => {
      realtimeService.unsubscribe(subscription);
    };
  }, [user?.id, onNewMessage]);
};

export const useRealtimePayments = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!user?.id) return;

    const subscription = realtimeService.subscribeToPayments(
      user.id,
      (payment: Payment) => {
        console.log('Payment update received:', payment);
        dispatch(updatePaymentStatus({ 
          id: payment.id, 
          status: payment.status 
        }));
      }
    );

    return () => {
      realtimeService.unsubscribe(subscription);
    };
  }, [user?.id, dispatch]);
};

export const useRealtimePresence = (onPresenceChange?: (users: any[]) => void) => {
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!user?.id) return;

    const subscription = realtimeService.subscribeToPresence(
      user.id,
      (users) => {
        console.log('Presence update:', users);
        onPresenceChange?.(users);
      }
    );

    return () => {
      realtimeService.unsubscribe(subscription);
    };
  }, [user?.id, onPresenceChange]);
};

export const useRealtimeNotifications = (onNewNotification?: (notification: any) => void) => {
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!user?.id) return;

    const subscription = realtimeService.subscribeToNotifications(
      user.id,
      (notification) => {
        console.log('New notification:', notification);
        onNewNotification?.(notification);
        
        // Show system notification if app is in background
        // TODO: Implement push notifications
      }
    );

    return () => {
      realtimeService.unsubscribe(subscription);
    };
  }, [user?.id, onNewNotification]);
};

export const useRealtimePropertyUpdates = (onPropertyUpdate?: (property: any) => void) => {
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!user?.id || user.role !== 'landlord') return;

    const subscription = realtimeService.subscribeToPropertyUpdates(
      user.id,
      (property) => {
        console.log('Property update:', property);
        onPropertyUpdate?.(property);
      }
    );

    return () => {
      realtimeService.unsubscribe(subscription);
    };
  }, [user?.id, user?.role, onPropertyUpdate]);
};

export const useRealtimeTenancyUpdates = (onTenancyUpdate?: (tenancy: any) => void) => {
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!user?.id) return;

    const subscription = realtimeService.subscribeToTenancyUpdates(
      user.id,
      user.role as 'tenant' | 'landlord',
      (tenancy) => {
        console.log('Tenancy update:', tenancy);
        onTenancyUpdate?.(tenancy);
      }
    );

    return () => {
      realtimeService.unsubscribe(subscription);
    };
  }, [user?.id, user?.role, onTenancyUpdate]);
};

// Helper hook to clean up all subscriptions
export const useRealtimeCleanup = () => {
  useEffect(() => {
    return () => {
      realtimeService.unsubscribeAll();
    };
  }, []);
};

// Combined hook for common realtime features
export const useRealtimeFeatures = (callbacks?: {
  onNewMessage?: (message: Message) => void;
  onPaymentUpdate?: (payment: Payment) => void;
  onNewNotification?: (notification: any) => void;
  onPropertyUpdate?: (property: any) => void;
  onTenancyUpdate?: (tenancy: any) => void;
}) => {
  useRealtimeMessages(callbacks?.onNewMessage);
  useRealtimePayments();
  useRealtimeNotifications(callbacks?.onNewNotification);
  useRealtimePropertyUpdates(callbacks?.onPropertyUpdate);
  useRealtimeTenancyUpdates(callbacks?.onTenancyUpdate);
  useRealtimeCleanup();
};