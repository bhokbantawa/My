import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HelpScreen() {
  const router = useRouter();

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@sahayak.com');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>मद्दत र सहयोग</Text>
        <Text style={styles.headerSubtitle}>Help & Support</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Welcome Message */}
        <View style={styles.welcomeCard}>
          <Ionicons name="help-buoy" size={48} color="#4F46E5" />
          <Text style={styles.welcomeTitle}>कसरी मद्दत गर्न सकिन्छ?</Text>
          <Text style={styles.welcomeSubtitle}>How can we help you?</Text>
        </View>

        {/* Help Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>प्रयोग गाइड / User Guide</Text>

          {/* Chat Help */}
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <View style={[styles.helpIcon, { backgroundColor: '#4F46E5' + '20' }]}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#4F46E5" />
              </View>
              <Text style={styles.helpTitle}>च्याट कसरी प्रयोग गर्ने</Text>
            </View>
            <Text style={styles.helpSubtitle}>How to use Chat</Text>
            <View style={styles.helpSteps}>
              <Text style={styles.helpStep}>१. च्याट ट्याबमा जानुहोस्</Text>
              <Text style={styles.helpStep}>२. आफ्नो प्रश्न टाइप गर्नुहोस्</Text>
              <Text style={styles.helpStep}>३. पठाउनुहोस् बटन थिच्नुहोस्</Text>
              <Text style={styles.helpStepEn}>Go to Chat tab → Type your question → Press send</Text>
            </View>
          </View>

          {/* Voice Help */}
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <View style={[styles.helpIcon, { backgroundColor: '#EC4899' + '20' }]}>
                <Ionicons name="mic" size={24} color="#EC4899" />
              </View>
              <Text style={styles.helpTitle}>भ्वाइस इनपुट कसरी प्रयोग गर्ने</Text>
            </View>
            <Text style={styles.helpSubtitle}>How to use Voice Input</Text>
            <View style={styles.helpSteps}>
              <Text style={styles.helpStep}>१. माइक्रोफोन बटन थिच्नुहोस् र होल्ड गर्नुहोस्</Text>
              <Text style={styles.helpStep}>२. नेपाली वा अंग्रेजीमा बोल्नुहोस्</Text>
              <Text style={styles.helpStep}>३. बटन छोड्नुहोस्</Text>
              <Text style={styles.helpStepEn}>Press and hold mic → Speak → Release button</Text>
            </View>
          </View>

          {/* Cooking Help */}
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <View style={[styles.helpIcon, { backgroundColor: '#F59E0B' + '20' }]}>
                <Ionicons name="restaurant" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.helpTitle}>खाना पकाउने सहायक</Text>
            </View>
            <Text style={styles.helpSubtitle}>How to use Cooking Helper</Text>
            <View style={styles.helpSteps}>
              <Text style={styles.helpStep}>१. Cooking ट्याबमा जानुहोस्</Text>
              <Text style={styles.helpStep}>२. तपाईंसँग भएका सामग्री छान्नुहोस्</Text>
              <Text style={styles.helpStep}>३. रेसिपी सुझाव पाउनुहोस्</Text>
              <Text style={styles.helpStepEn}>Select ingredients → Get recipe suggestions</Text>
            </View>
          </View>

          {/* Health Help */}
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <View style={[styles.helpIcon, { backgroundColor: '#EF4444' + '20' }]}>
                <Ionicons name="heart" size={24} color="#EF4444" />
              </View>
              <Text style={styles.helpTitle}>स्वास्थ्य सल्लाह</Text>
            </View>
            <Text style={styles.helpSubtitle}>How to use Health Advice</Text>
            <View style={styles.helpSteps}>
              <Text style={styles.helpStep}>१. Health ट्याबमा जानुहोस्</Text>
              <Text style={styles.helpStep}>२. आफ्नो समस्या छान्नुहोस् वा लेख्नुहोस्</Text>
              <Text style={styles.helpStep}>३. घरेलु उपचार र सल्लाह पाउनुहोस्</Text>
              <Text style={styles.helpStepEn}>Describe symptoms → Get home remedies & advice</Text>
            </View>
          </View>

          {/* Reminders Help */}
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <View style={[styles.helpIcon, { backgroundColor: '#8B5CF6' + '20' }]}>
                <Ionicons name="alarm" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.helpTitle}>सम्झना / Reminders</Text>
            </View>
            <Text style={styles.helpSubtitle}>How to use Reminders</Text>
            <View style={styles.helpSteps}>
              <Text style={styles.helpStep}>१. Remind ट्याबमा जानुहोस्</Text>
              <Text style={styles.helpStep}>२. + बटन थिचेर नयाँ सम्झना थप्नुहोस्</Text>
              <Text style={styles.helpStep}>३. शीर्षक, मिति र समय राख्नुहोस्</Text>
              <Text style={styles.helpStepEn}>Add title, date & time → Save reminder</Text>
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>सम्पर्क / Contact</Text>
          
          <TouchableOpacity style={styles.contactCard} onPress={handleEmailPress}>
            <View style={[styles.helpIcon, { backgroundColor: '#10B981' + '20' }]}>
              <Ionicons name="mail" size={24} color="#10B981" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>इमेल / Email</Text>
              <Text style={styles.contactValue}>support@sahayak.com</Text>
            </View>
            <Ionicons name="open-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* FAQ Note */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={20} color="#6B7280" />
          <Text style={styles.noteText}>
            थप प्रश्नहरूको लागि च्याटमा सोध्नुहोस् वा इमेल गर्नुहोस्।
            For more questions, ask in chat or email us.
          </Text>
        </View>

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
  welcomeCard: {
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  helpCard: {
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  helpIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  helpSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 56,
    marginBottom: 12,
  },
  helpSteps: {
    backgroundColor: '#0A0A0F',
    borderRadius: 8,
    padding: 12,
  },
  helpStep: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  helpStepEn: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  contactCard: {
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 2,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 20,
  },
});
