import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AppLogo from '@/components/AppLogo';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface DailyTip {
  category: string;
  tip_nepali: string;
  tip_english: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState<'nepali' | 'english'>('nepali');
  const [dailyTip, setDailyTip] = useState<DailyTip | null>(null);

  useEffect(() => {
    fetchDailyTip();
  }, []);

  const fetchDailyTip = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tips/daily`);
      setDailyTip(response.data);
    } catch (error) {
      console.error('Fetch tip error:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health': return 'heart-outline';
      case 'cooking': return 'restaurant-outline';
      case 'money': return 'wallet-outline';
      default: return 'bulb-outline';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'health': return '#EC4899';
      case 'cooking': return '#F59E0B';
      case 'money': return '#10B981';
      default: return '#3B82F6';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="settings" size={24} color="#6B7280" />
          </View>
          <View>
            <Text style={styles.headerTitle}>सेटिङ्ग</Text>
            <Text style={styles.headerSubtitle}>Settings</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Daily Tip Card */}
        {dailyTip && (
          <View style={[styles.tipCard, { borderColor: getCategoryColor(dailyTip.category) + '40' }]}>
            <View style={styles.tipHeader}>
              <Ionicons
                name={getCategoryIcon(dailyTip.category) as any}
                size={20}
                color={getCategoryColor(dailyTip.category)}
              />
              <Text style={[styles.tipCategory, { color: getCategoryColor(dailyTip.category) }]}>
                आजको टिप / Tip of the Day
              </Text>
            </View>
            <Text style={styles.tipTextNepali}>{dailyTip.tip_nepali}</Text>
            <Text style={styles.tipTextEnglish}>{dailyTip.tip_english}</Text>
            <TouchableOpacity style={styles.refreshTip} onPress={fetchDailyTip}>
              <Ionicons name="refresh" size={16} color="#6B7280" />
              <Text style={styles.refreshText}>नयाँ टिप / New Tip</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>सामान्य / General</Text>

          {/* Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#3B82F6' + '20' }]}>
                <Ionicons name="notifications-outline" size={20} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.settingLabel}>सूचनाहरू</Text>
                <Text style={styles.settingSubLabel}>Notifications</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#3D3D4D', true: '#4F46E5' }}
              thumbColor={notifications ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          {/* Language */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setLanguage(language === 'nepali' ? 'english' : 'nepali')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#10B981' + '20' }]}>
                <Ionicons name="language-outline" size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.settingLabel}>भाषा</Text>
                <Text style={styles.settingSubLabel}>Language</Text>
              </View>
            </View>
            <View style={styles.languageBadge}>
              <Text style={styles.languageText}>
                {language === 'nepali' ? 'नेपाली' : 'English'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>बारेमा / About</Text>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/about')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#8B5CF6' + '20' }]}>
                <Ionicons name="information-circle-outline" size={20} color="#8B5CF6" />
              </View>
              <View>
                <Text style={styles.settingLabel}>एपको बारेमा</Text>
                <Text style={styles.settingSubLabel}>About App</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/help')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#EC4899' + '20' }]}>
                <Ionicons name="help-circle-outline" size={20} color="#EC4899" />
              </View>
              <View>
                <Text style={styles.settingLabel}>मद्दत</Text>
                <Text style={styles.settingSubLabel}>Help & Support</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/rate')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#F59E0B' + '20' }]}>
                <Ionicons name="star-outline" size={20} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.settingLabel}>एपलाई रेट गर्नुहोस्</Text>
                <Text style={styles.settingSubLabel}>Rate the App</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <AppLogo size={80} />
          <Text style={styles.appName}>Sahayak</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>Your Daily Nepali AI Helper</Text>
          <View style={styles.divider} />
          <Text style={styles.developerText}>Developed by</Text>
          <Text style={styles.developerName}>Sagar Rai</Text>
          <View style={styles.madeInNepalBadge}>
            <Text style={styles.madeInNepalText}>Made in Nepal 🇳🇵</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    backgroundColor: '#1A1A24',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D3D',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#6B7280' + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 140,
  },
  tipCard: {
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipCategory: {
    fontSize: 13,
    fontWeight: '600',
  },
  tipTextNepali: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 8,
  },
  tipTextEnglish: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  refreshTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2D2D3D',
  },
  refreshText: {
    fontSize: 13,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  settingSubLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  languageBadge: {
    backgroundColor: '#2D2D3D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  languageText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 1,
    marginTop: 16,
  },
  appVersion: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
  },
  appTagline: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 8,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: '#2D2D3D',
    marginVertical: 20,
  },
  developerText: {
    fontSize: 12,
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  developerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  madeInNepalBadge: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1A1A24',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D2D3D',
  },
  madeInNepalText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
