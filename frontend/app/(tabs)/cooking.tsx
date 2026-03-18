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

const POPULAR_INGREDIENTS = [
  { name: 'आलु', english: 'Potato' },
  { name: 'प्याज', english: 'Onion' },
  { name: 'टमाटर', english: 'Tomato' },
  { name: 'चामल', english: 'Rice' },
  { name: 'दाल', english: 'Lentils' },
  { name: 'मासु', english: 'Meat' },
  { name: 'अण्डा', english: 'Egg' },
  { name: 'पिठो', english: 'Flour' },
];

export default function CookingScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients(prev =>
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const suggestRecipes = async () => {
    if (selectedIngredients.length === 0 && !inputText.trim()) {
      return;
    }

    const queryText = inputText.trim()
      ? inputText
      : `म यी सामग्रीहरू प्रयोग गरेर के पकाउन सक्छु: ${selectedIngredients.join(', ')}`;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/cooking/chat`, {
        message: queryText,
        session_id: sessionId,
        language: 'nepali',
        context: 'cooking',
      });

      const assistantMessage: Message = {
        id: Date.now().toString() + '_ai',
        role: 'assistant',
        content: response.data.response,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSessionId(response.data.session_id);
      setSelectedIngredients([]);
    } catch (error) {
      console.error('Cooking chat error:', error);
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
          <Ionicons name="restaurant" size={16} color="#F59E0B" />
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
            <Ionicons name="restaurant" size={24} color="#F59E0B" />
          </View>
          <View>
            <Text style={styles.headerTitle}>खाना पकाउने सहायक</Text>
            <Text style={styles.headerSubtitle}>Cooking Helper</Text>
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
            <Text style={styles.welcomeTitle}>
              के पकाउने हो आज?
            </Text>
            <Text style={styles.welcomeSubtitle}>
              What would you like to cook today?
            </Text>

            <Text style={styles.sectionTitle}>लोकप्रिय सामग्रीहरू / Popular Ingredients</Text>
            <View style={styles.ingredientsGrid}>
              {POPULAR_INGREDIENTS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.ingredientChip,
                    selectedIngredients.includes(item.english) && styles.ingredientChipSelected,
                  ]}
                  onPress={() => toggleIngredient(item.english)}
                >
                  <Text style={[
                    styles.ingredientText,
                    selectedIngredients.includes(item.english) && styles.ingredientTextSelected,
                  ]}>
                    {item.name}
                  </Text>
                  <Text style={styles.ingredientEnglish}>{item.english}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedIngredients.length > 0 && (
              <TouchableOpacity
                style={styles.suggestButton}
                onPress={suggestRecipes}
              >
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                <Text style={styles.suggestButtonText}>
                  रेसिपी सुझाव पाउनुहोस्
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.tipContainer}>
              <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
              <Text style={styles.tipText}>
                तपाईंसँग भएका सामग्रीहरू छान्नुहोस् वा सिधै लेख्नुहोस्
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
            <ActivityIndicator size="small" color="#F59E0B" />
            <Text style={styles.loadingText}>रेसिपी खोज्दैछु... / Finding recipes...</Text>
          </View>
        )}

        {/* Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="सामग्री वा प्रश्न लेख्नुहोस्..."
            placeholderTextColor="#6B7280"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={suggestRecipes}
            disabled={isLoading || (!inputText.trim() && selectedIngredients.length === 0)}
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
    backgroundColor: '#F59E0B' + '20',
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
  welcomeTitle: {
    fontSize: 24,
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
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  ingredientChip: {
    backgroundColor: '#1A1A24',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D2D3D',
  },
  ingredientChipSelected: {
    backgroundColor: '#F59E0B' + '20',
    borderColor: '#F59E0B',
  },
  ingredientText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ingredientTextSelected: {
    color: '#F59E0B',
  },
  ingredientEnglish: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  suggestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  suggestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A24',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#9CA3AF',
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
    backgroundColor: '#F59E0B' + '20',
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
    backgroundColor: '#F59E0B',
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
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
