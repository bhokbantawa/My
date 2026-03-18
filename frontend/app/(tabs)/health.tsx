import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const COMMON_CONCERNS = [
  { nepali: 'टाउको दुखाइ', english: 'Headache', icon: 'sad-outline' },
  { nepali: 'पेट दुखाइ', english: 'Stomach ache', icon: 'medical-outline' },
  { nepali: 'रुघा खोकी', english: 'Cold & Cough', icon: 'snow-outline' },
  { nepali: 'ज्वरो', english: 'Fever', icon: 'thermometer-outline' },
  { nepali: 'थकान', english: 'Fatigue', icon: 'battery-dead-outline' },
  { nepali: 'निद्रा समस्या', english: 'Sleep issues', icon: 'moon-outline' },
];

export default function HealthScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const sendHealthQuery = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/health/chat`, {
        message: text,
        session_id: sessionId,
        language: 'nepali',
        context: 'health',
      });

      const assistantMessage: Message = {
        id: Date.now().toString() + '_ai',
        role: 'assistant',
        content: response.data.response,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSessionId(response.data.session_id);
    } catch (error) {
      console.error('Health chat error:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        role: 'assistant',
        content: 'माफ गर्नुहोस्, केही समस्या भयो। कृपया फेरि प्रयास गर्नुहोस्।\n\nSorry, there was an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.role === 'user' ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      {item.role === 'assistant' && (
        <View style={styles.avatarContainer}>
          <Ionicons name="heart" size={16} color="#EC4899" />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          item.role === 'user' ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text style={[
          styles.messageText,
          item.role === 'user' ? styles.userText : styles.assistantText,
        ]}>
          {item.content}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="heart" size={24} color="#EC4899" />
          </View>
          <View>
            <Text style={styles.headerTitle}>स्वास्थ्य सल्लाह</Text>
            <Text style={styles.headerSubtitle}>Health Advice</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages or Welcome */}
        {messages.length === 0 ? (
          <ScrollView style={styles.welcomeContainer} contentContainerStyle={styles.welcomeContent}>
            {/* Disclaimer */}
            <View style={styles.disclaimerCard}>
              <Ionicons name="information-circle" size={24} color="#F59E0B" />
              <Text style={styles.disclaimerText}>
                यो सामान्य स्वास्थ्य जानकारी मात्र हो। गम्भीर समस्यामा चिकित्सकको सल्लाह लिनुहोस्।
              </Text>
              <Text style={styles.disclaimerTextEn}>
                This is general health information only. Consult a doctor for serious issues.
              </Text>
            </View>

            <Text style={styles.welcomeTitle}>
              तपाईंलाई कस्तो समस्या छ?
            </Text>
            <Text style={styles.welcomeSubtitle}>
              What health concern do you have?
            </Text>

            <Text style={styles.sectionTitle}>सामान्य समस्याहरू / Common Concerns</Text>
            <View style={styles.concernsGrid}>
              {COMMON_CONCERNS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.concernChip}
                  onPress={() => sendHealthQuery(`मलाई ${item.nepali} भएको छ। के गर्नु पर्छ?`)}
                >
                  <Ionicons name={item.icon as any} size={24} color="#EC4899" />
                  <Text style={styles.concernTextNepali}>{item.nepali}</Text>
                  <Text style={styles.concernTextEnglish}>{item.english}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.tipContainer}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
              <Text style={styles.tipText}>
                घरेलु उपचार र कहिले डाक्टरकहाँ जाने सल्लाह पाउनुहोस्
              </Text>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#EC4899" />
            <Text style={styles.loadingText}>सल्लाह खोज्दैछु... / Finding advice...</Text>
          </View>
        )}

        {/* Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="आफ्नो समस्या बताउनुहोस्..."
            placeholderTextColor="#6B7280"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => sendHealthQuery(inputText)}
            disabled={isLoading || !inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: '#EC4899' + '20',
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
  chatContainer: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeContent: {
    padding: 20,
  },
  disclaimerCard: {
    backgroundColor: '#F59E0B' + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F59E0B' + '30',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#F59E0B',
    marginTop: 8,
    lineHeight: 20,
  },
  disclaimerTextEn: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 18,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 16,
  },
  concernsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  concernChip: {
    backgroundColor: '#1A1A24',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D2D3D',
    width: '47%',
    alignItems: 'center',
  },
  concernTextNepali: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  concernTextEnglish: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981' + '15',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#10B981',
    lineHeight: 20,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EC4899' + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#EC4899',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#1A1A24',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#E5E7EB',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#9CA3AF',
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A24',
    borderTopWidth: 1,
    borderTopColor: '#2D2D3D',
  },
  input: {
    flex: 1,
    backgroundColor: '#2D2D3D',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
