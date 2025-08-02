import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

// Custom Card Component
const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

// Profile Info Row
const ProfileRow = ({ label, value }) => (
  <View style={styles.profileRow}>
    <Text style={styles.profileLabel}>{label}</Text>
    <Text style={styles.profileValue}>{value}</Text>
  </View>
);

// Menu Item Component
const MenuItem = ({ title, onPress, style, textColor }) => (
  <TouchableOpacity style={[styles.menuItem, style]} onPress={onPress}>
    <Text style={[styles.menuText, { color: textColor || '#374151' }]}>
      {title}
    </Text>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const { userProfile, signOut, isTenant, isLandlord } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        },
      ]
    );
  };

  const getRoleDisplayText = () => {
    if (isTenant) return 'Tenant';
    if (isLandlord) return 'Landlord';
    return userProfile?.role || 'User';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User Info Card */}
        <Card style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userProfile?.profile?.firstName?.charAt(0) || 'U'}
                {userProfile?.profile?.lastName?.charAt(0) || ''}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {userProfile?.profile?.firstName} {userProfile?.profile?.lastName}
              </Text>
              <Text style={styles.userEmail}>{userProfile?.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{getRoleDisplayText()}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Account Information */}
        <Card>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <ProfileRow 
            label="Email" 
            value={userProfile?.email || 'Not provided'} 
          />
          <ProfileRow 
            label="Role" 
            value={getRoleDisplayText()} 
          />
          <ProfileRow 
            label="Member Since" 
            value={userProfile?.created_at ? 
              new Date(userProfile.created_at).toLocaleDateString() : 
              'Unknown'
            } 
          />
        </Card>

        {/* Settings */}
        <Card>
          <Text style={styles.sectionTitle}>Settings</Text>
          <MenuItem
            title="Edit Profile"
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon')}
          />
          <MenuItem
            title="Notifications"
            onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon')}
          />
          <MenuItem
            title="Privacy Settings"
            onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon')}
          />
        </Card>

        {/* Support */}
        <Card>
          <Text style={styles.sectionTitle}>Support</Text>
          <MenuItem
            title="Help Center"
            onPress={() => Alert.alert('Help', 'Contact support at support@tenesta.com')}
          />
          <MenuItem
            title="Terms of Service"
            onPress={() => Alert.alert('Terms', 'Terms of service will be displayed here')}
          />
          <MenuItem
            title="Privacy Policy"
            onPress={() => Alert.alert('Privacy', 'Privacy policy will be displayed here')}
          />
        </Card>

        {/* Sign Out */}
        <Card style={styles.signOutCard}>
          <MenuItem
            title="Sign Out"
            onPress={handleSignOut}
            textColor="#DC2626"
          />
        </Card>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Tenesta v1.0.0</Text>
        </View>
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
    marginBottom: 24,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#800020',
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
  userCard: {
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#800020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#800020',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#800020',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  signOutCard: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
