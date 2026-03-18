import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AppLogo from '@/components/AppLogo';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>एपको बारेमा</Text>
        <Text style={styles.headerSubtitle}>About App</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Logo and App Info */}
        <View style={styles.logoSection}>
          <AppLogo size={120} />
          <Text style={styles.appName}>Sahayak</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        {/* Description Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={24} color="#4F46E5" />
            <Text style={styles.cardTitle}>विवरण / Description</Text>
          </View>
          <Text style={styles.descriptionText}>
            सहायक तपाईंको दैनिक जीवनको लागि नेपाली AI सहायक हो। यसले तपाईंलाई विभिन्न कार्यहरूमा मद्दत गर्छ।
          </Text>
          <Text style={styles.descriptionTextEn}>
            Sahayak is your Nepali AI Assistant for daily life. It helps you with various tasks like chatting, cooking recipes, health advice, reminders, and more.
          </Text>
        </View>

        {/* Features Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles" size={24} color="#10B981" />
            <Text style={styles.cardTitle}>विशेषताहरू / Features</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#4F46E5" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>AI च्याट / AI Chat</Text>
              <Text style={styles.featureDesc}>नेपाली र अंग्रेजीमा कुराकानी</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="mic" size={20} color="#EC4899" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>भ्वाइस इनपुट / Voice Input</Text>
              <Text style={styles.featureDesc}>बोलेर टाइप गर्नुहोस्</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="restaurant" size={20} color="#F59E0B" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>खाना पकाउने / Cooking Helper</Text>
              <Text style={styles.featureDesc}>नेपाली रेसिपीहरू</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="calendar" size={20} color="#10B981" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>नेपाली पात्रो / Nepali Calendar</Text>
              <Text style={styles.featureDesc}>तिथि र पर्वहरू</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="heart" size={20} color="#EF4444" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>स्वास्थ्य सल्लाह / Health Advice</Text>
              <Text style={styles.featureDesc}>घरेलु उपचार र सल्लाह</Text>
            </View>
          </View>
        </View>

        {/* Developer Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="code-slash" size={24} color="#8B5CF6" />
            <Text style={styles.cardTitle}>विकासकर्ता / Developer</Text>
          </View>
          <View style={styles.developerInfo}>
            <View style={styles.developerIcon}>
              <Ionicons name="person" size={32} color="#8B5CF6" />
            </View>
            <View>
              <Text style={styles.developerName}>Sagar Rai</Text>
              <Text style={styles.developerRole}>App Developer</Text>
            </View>
          </View>
        </View>

        {/* Copyright */}
        <Text style={styles.copyright}>
          © 2024 Sahayak. All rights reserved.
        </Text>

        <View style={{ height: 40 }} />
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
  backButton: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4F46E5',
    marginTop: 16,
    letterSpacing: 1,
  },
  appVersion: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  descriptionText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 12,
  },
  descriptionTextEn: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 22,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D3D',
    gap: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featureDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  developerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  developerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8B5CF6' + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  developerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  developerRole: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  copyright: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});
