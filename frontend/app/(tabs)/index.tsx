import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import axios from 'axios';
import AppLogo from '@/components/AppLogo';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickFeature {
  id: string;
  icon: string;
  label: string;
  labelNepali: string;
  color: string;
  route: string;
}

const QUICK_FEATURES: QuickFeature[] = [
  { id: 'cooking', icon: 'restaurant', label: 'Cooking', labelNepali: 'खाना', color: '#F59E0B', route: 'cooking' },
  { id: 'health', icon: 'heart', label: 'Health', labelNepali: 'स्वास्थ्य', color: '#EF4444', route: 'health' },
  { id: 'calendar', icon: 'calendar', label: 'Calendar', labelNepali: 'पात्रो', color: '#10B981', route: 'calendar' },
  { id: 'location', icon: 'location', label: 'Location', labelNepali: 'स्थान', color: '#3B82F6', route: 'location' },
  { id: 'calculator', icon: 'calculator', label: 'Calculator', labelNepali: 'क्याल्कुलेटर', color: '#8B5CF6', route: 'calculator' },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [showHome, setShowHome] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const speakText = async (text: string) => {
    // Stop any ongoing speech
    await Speech.stop();
    
    // Detect if text contains Nepali (Devanagari script)
    const hasNepali = /[\u0900-\u097F]/.test(text);
    
    setIsSpeaking(true);
    
    Speech.speak(text, {
      language: hasNepali ? 'ne-NP' : 'en-US',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const stopSpeaking = async () => {
    await Speech.stop();
    setIsSpeaking(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    setShowHome(false);
    animateButton();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        message: text,
        session_id: sessionId,
        language: 'auto',
        context: 'general',
      });

      const assistantMessage: Message = {
        id: response.data.message_id || Date.now().toString() + '_ai',
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSessionId(response.data.session_id);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        role: 'assistant',
        content: 'माफ गर्नुहोस्, केही समस्या भयो। कृपया फेरि प्रयास गर्नुहोस्।\n\nSorry, there was an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('माइक्रोफोन अनुमति आवश्यक छ / Microphone permission is required');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      alert('रेकर्डिङ सुरु गर्न सकिएन / Could not start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setIsLoading(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const response = await axios.post(`${API_URL}/api/transcribe/base64`, {
          audio: base64Audio,
        });

        if (response.data.text) {
          await sendMessage(response.data.text);
        }
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert('ट्रान्सक्रिप्सन असफल भयो / Transcription failed');
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <Animated.View
      style={[
        styles.messageContainer,
        item.role === 'user' ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      {item.role === 'assistant' && (
        <View style={styles.avatarContainer}>
          <Ionicons name="sparkles" size={16} color="#4F46E5" />
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
        
        {/* Speak button for assistant messages */}
        {item.role === 'assistant' && (
          <TouchableOpacity
            style={styles.speakButton}
            onPress={() => isSpeaking ? stopSpeaking() : speakText(item.content)}
          >
            <Ionicons 
              name={isSpeaking ? 'stop-circle' : 'volume-high'} 
              size={18} 
              color={isSpeaking ? '#EF4444' : '#6B7280'} 
            />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  const renderHomeScreen = () => (
    <View style={styles.homeContainer}>
      {/* Logo and Branding */}
      <View style={styles.brandingSection}>
        <AppLogo size={100} />
        <Text style={styles.appTitle}>Sahayak</Text>
        <Text style={styles.appTagline}>Your Daily Nepali AI Helper</Text>
        <Text style={styles.appTaglineNepali}>तपाईंको दैनिक नेपाली AI सहायक</Text>
      </View>

      {/* Welcome Card */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>नमस्ते! 🙏</Text>
        <Text style={styles.welcomeText}>
          म सहायक हुँ। तपाईंलाई कसरी मद्दत गर्न सक्छु?
        </Text>
        <Text style={styles.welcomeTextEn}>
          I am Sahayak. How can I help you today?
        </Text>
      </View>

      {/* Quick Features */}
      <Text style={styles.featuresTitle}>छिटो पहुँच / Quick Access</Text>
      <View style={styles.featuresGrid}>
        {QUICK_FEATURES.map((feature) => (
          <Pressable
            key={feature.id}
            style={({ pressed }) => [
              styles.featureCard,
              pressed && styles.featureCardPressed,
            ]}
            onPress={() => {
              // Navigate to the feature tab
            }}
          >
            <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
              <Ionicons name={feature.icon as any} size={28} color={feature.color} />
            </View>
            <Text style={styles.featureLabelNepali}>{feature.labelNepali}</Text>
            <Text style={styles.featureLabel}>{feature.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Made in Nepal Badge */}
      <View style={styles.madeInNepalBadge}>
        <Text style={styles.madeInNepalText}>Made in Nepal 🇳🇵</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <AppLogo size={44} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Sahayak</Text>
            <Text style={styles.headerSubtitle}>Your Daily Nepali AI Helper</Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity 
            style={styles.newChatButton}
            onPress={() => {
              setMessages([]);
              setShowHome(true);
              setSessionId(null);
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color="#4F46E5" />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {showHome && messages.length === 0 ? (
          renderHomeScreen()
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
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>सोच्दैछु... / Thinking...</Text>
          </View>
        )}

        {/* Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="यहाँ टाइप गर्नुहोस् / Type here..."
            placeholderTextColor="#6B7280"
            multiline
            maxLength={1000}
          />
          
          {inputText.trim() ? (
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => sendMessage(inputText)}
                disabled={isLoading}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity
              style={[
                styles.voiceButton,
                isRecording && styles.voiceButtonActive,
              ]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
              disabled={isLoading}
            >
              <Ionicons
                name={isRecording ? 'mic' : 'mic-outline'}
                size={24}
                color={isRecording ? '#EF4444' : '#FFFFFF'}
              />
            </TouchableOpacity>
          )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D3D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  newChatButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
  },
  homeContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  brandingSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4F46E5',
    marginTop: 12,
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 6,
  },
  appTaglineNepali: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  welcomeCard: {
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#4F46E5' + '30',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#E5E7EB',
    lineHeight: 24,
  },
  welcomeTextEn: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
    marginTop: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '31%',
    backgroundColor: '#1A1A24',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D3D',
  },
  featureCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureLabelNepali: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  featureLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  madeInNepalBadge: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  madeInNepalText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
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
    backgroundColor: '#4F46E5' + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#1A1A24',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 23,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#E5E7EB',
  },
  speakButton: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2D2D3D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: '#9CA3AF',
    fontSize: 14,
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#DC2626',
  },
});
