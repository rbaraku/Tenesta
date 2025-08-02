import { supabase } from './supabase';
import { Message, Payment, User } from '../types';

export class RealtimeService {
  private subscriptions: any[] = [];

  // Subscribe to real-time messages
  subscribeToMessages(userId: string, onMessage: (message: Message) => void) {
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          onMessage(payload.new as Message);
        }
      )
      .subscribe();

    this.subscriptions.push(subscription);
    return subscription;
  }

  // Subscribe to payment updates
  subscribeToPayments(userId: string, onPaymentUpdate: (payment: Payment) => void) {
    const subscription = supabase
      .channel('payments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
        },
        (payload) => {
          // Filter payments relevant to the user (either tenant or landlord)
          onPaymentUpdate(payload.new as Payment);
        }
      )
      .subscribe();

    this.subscriptions.push(subscription);
    return subscription;
  }

  // Subscribe to user presence (online/offline status)
  subscribeToPresence(userId: string, onPresenceChange: (users: User[]) => void) {
    const subscription = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = subscription.presenceState();
        const users = Object.keys(state).map(key => state[key][0]);
        onPresenceChange(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await subscription.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    this.subscriptions.push(subscription);
    return subscription;
  }

  // Subscribe to notifications
  subscribeToNotifications(userId: string, onNotification: (notification: any) => void) {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNotification(payload.new);
        }
      )
      .subscribe();

    this.subscriptions.push(subscription);
    return subscription;
  }

  // Subscribe to property updates (for landlords)
  subscribeToPropertyUpdates(landlordId: string, onPropertyUpdate: (property: any) => void) {
    const subscription = supabase
      .channel('properties')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties',
          filter: `landlord_id=eq.${landlordId}`,
        },
        (payload) => {
          onPropertyUpdate(payload.new);
        }
      )
      .subscribe();

    this.subscriptions.push(subscription);
    return subscription;
  }

  // Subscribe to tenancy updates
  subscribeToTenancyUpdates(userId: string, userRole: 'tenant' | 'landlord', onTenancyUpdate: (tenancy: any) => void) {
    const filter = userRole === 'tenant' 
      ? `tenant_id=eq.${userId}` 
      : `landlord_id=eq.${userId}`;

    const subscription = supabase
      .channel('tenancies')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenancies',
          filter,
        },
        (payload) => {
          onTenancyUpdate(payload.new);
        }
      )
      .subscribe();

    this.subscriptions.push(subscription);
    return subscription;
  }

  // Unsubscribe from a specific subscription
  unsubscribe(subscription: any) {
    const index = this.subscriptions.indexOf(subscription);
    if (index > -1) {
      subscription.unsubscribe();
      this.subscriptions.splice(index, 1);
    }
  }

  // Unsubscribe from all subscriptions
  unsubscribeAll() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions = [];
  }

  // Send a message
  async sendMessage(recipientId: string, content: string, type: 'text' | 'image' | 'document' = 'text') {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        recipient_id: recipientId,
        content,
        type,
        read: false,
      })
      .select()
      .single();

    return { data, error };
  }

  // Mark messages as read
  async markMessagesAsRead(messageIds: string[]) {
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true })
      .in('id', messageIds);

    return { data, error };
  }

  // Send typing indicator
  async sendTypingIndicator(channelId: string, isTyping: boolean) {
    const channel = supabase.channel(channelId);
    
    if (isTyping) {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { typing: true }
      });
    } else {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { typing: false }
      });
    }
  }
}

export const realtimeService = new RealtimeService();