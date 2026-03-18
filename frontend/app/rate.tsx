import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function RateScreen() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleRating = (value: number) => {
    setRating(value);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert(
        'रेटिङ छान्नुहोस्',
        'कृपया स्टार रेटिङ छान्नुहोस्।\n\nPlease select a star rating.',
        [{ text: 'ठीक छ / OK' }]
      );
      return;
    }

    setSubmitted(true);
    
    // Show thank you message
    setTimeout(() => {
      Alert.alert(
        'धन्यवाद!',
        `तपाईंले ${rating} स्टार दिनुभयो। तपाईंको प्रतिक्रिया हाम्रो लागि महत्त्वपूर्ण छ!\n\nThank you for rating us ${rating} stars! Your feedback matters to us.`,
        [{ text: 'ठीक छ / OK', onPress: () => router.back() }]
      );
    }, 500);
  };

  const getRatingText = () => {
    switch (rating) {
      case 1: return { nepali: 'खराब', english: 'Poor' };
      case 2: return { nepali: 'ठीकै', english: 'Fair' };
      case 3: return { nepali: 'राम्रो', english: 'Good' };
      case 4: return { nepali: 'धेरै राम्रो', english: 'Very Good' };
      case 5: return { nepali: 'उत्कृष्ट', english: 'Excellent' };
      default: return { nepali: '', english: '' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>एप रेट गर्नुहोस्</Text>
        <Text style={styles.headerSubtitle}>Rate App</Text>
      </View>

      <View style={styles.content}>
        {/* Thank You Message */}
        <View style={styles.thankYouCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="heart" size={48} color="#EF4444" />
          </View>
          <Text style={styles.thankYouTitle}>सहायक प्रयोग गर्नुभएकोमा धन्यवाद!</Text>
          <Text style={styles.thankYouSubtitle}>Thank you for using Sahayak!</Text>
          <Text style={styles.thankYouDesc}>
            तपाईंको प्रतिक्रियाले हामीलाई अझ राम्रो बनाउन मद्दत गर्छ।
          </Text>
          <Text style={styles.thankYouDescEn}>
            Your feedback helps us improve the app.
          </Text>
        </View>

        {/* Rating Section */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>कृपया रेट गर्नुहोस्</Text>
          <Text style={styles.ratingSubtitle}>Please rate your experience</Text>

          {/* Stars */}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={48}
                  color={star <= rating ? '#F59E0B' : '#4B5563'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Rating Text */}
          {rating > 0 && (
            <View style={styles.ratingTextContainer}>
              <Text style={styles.ratingTextNepali}>{getRatingText().nepali}</Text>
              <Text style={styles.ratingTextEnglish}>{getRatingText().english}</Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              rating === 0 && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitted}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>रेटिङ पठाउनुहोस् / Submit Rating</Text>
          </TouchableOpacity>
        </View>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
          <Text style={styles.noteText}>
            तपाईंको रेटिङ गोप्य रहनेछ। / Your rating is anonymous.
          </Text>
        </View>
      </View>
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
    padding: 20,
  },
  thankYouCard: {
    backgroundColor: '#1A1A24',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444' + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  thankYouTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  thankYouSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  thankYouDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  thankYouDescEn: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
    textAlign: 'center',
  },
  ratingCard: {
    backgroundColor: '#1A1A24',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ratingSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingTextContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingTextNepali: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F59E0B',
  },
  ratingTextEnglish: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
  },
  submitButtonDisabled: {
    backgroundColor: '#4B5563',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  noteText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
