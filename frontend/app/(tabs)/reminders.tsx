import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Reminder {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  category: string;
  completed: boolean;
}

const CATEGORIES = [
  { key: 'bill', label: 'बिल / Bill', icon: 'card-outline', color: '#EF4444' },
  { key: 'task', label: 'काम / Task', icon: 'checkbox-outline', color: '#3B82F6' },
  { key: 'event', label: 'कार्यक्रम / Event', icon: 'calendar-outline', color: '#8B5CF6' },
  { key: 'general', label: 'सामान्य / General', icon: 'flag-outline', color: '#10B981' },
];

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [category, setCategory] = useState('general');

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/reminders`);
      setReminders(response.data);
    } catch (error) {
      console.error('Load reminders error:', error);
    }
  };

  const scheduleNotification = async (reminder: Reminder) => {
    try {
      const trigger = new Date(reminder.due_date);
      if (trigger > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'सम्झना / Reminder',
            body: reminder.title,
            data: { reminderId: reminder.id },
          },
          trigger,
        });
      }
    } catch (error) {
      console.error('Notification error:', error);
    }
  };

  const createReminder = async () => {
    if (!title.trim()) {
      Alert.alert('त्रुटि / Error', 'कृपया शीर्षक लेख्नुहोस् / Please enter a title');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/reminders`, {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate.toISOString(),
        category,
      });

      setReminders(prev => [...prev, response.data]);
      await scheduleNotification(response.data);
      
      // Reset form
      setTitle('');
      setDescription('');
      setDueDate(new Date());
      setCategory('general');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Create reminder error:', error);
      Alert.alert('त्रुटि / Error', 'रिमाइन्डर बनाउन सकिएन / Could not create reminder');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleComplete = async (reminder: Reminder) => {
    try {
      await axios.patch(`${API_URL}/api/reminders/${reminder.id}/complete`);
      setReminders(prev =>
        prev.map(r =>
          r.id === reminder.id ? { ...r, completed: !r.completed } : r
        )
      );
    } catch (error) {
      console.error('Toggle complete error:', error);
    }
  };

  const deleteReminder = async (id: string) => {
    Alert.alert(
      'मेटाउनुहोस् / Delete',
      'के तपाईं यो रिमाइन्डर मेटाउन चाहनुहुन्छ? / Are you sure you want to delete this reminder?',
      [
        { text: 'रद्द गर्नुहोस् / Cancel', style: 'cancel' },
        {
          text: 'मेटाउनुहोस् / Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/reminders/${id}`);
              setReminders(prev => prev.filter(r => r.id !== id));
            } catch (error) {
              console.error('Delete reminder error:', error);
            }
          },
        },
      ]
    );
  };

  const getCategoryInfo = (key: string) => {
    return CATEGORIES.find(c => c.key === key) || CATEGORIES[3];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ne-NP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderReminder = ({ item }: { item: Reminder }) => {
    const catInfo = getCategoryInfo(item.category);
    const isOverdue = new Date(item.due_date) < new Date() && !item.completed;

    return (
      <TouchableOpacity
        style={[
          styles.reminderCard,
          item.completed && styles.reminderCompleted,
          isOverdue && styles.reminderOverdue,
        ]}
        onLongPress={() => deleteReminder(item.id)}
      >
        <TouchableOpacity
          style={[
            styles.checkbox,
            item.completed && styles.checkboxChecked,
          ]}
          onPress={() => toggleComplete(item)}
        >
          {item.completed && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <View style={styles.reminderContent}>
          <View style={styles.reminderHeader}>
            <Text
              style={[
                styles.reminderTitle,
                item.completed && styles.reminderTitleCompleted,
              ]}
            >
              {item.title}
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: catInfo.color + '20' }]}>
              <Ionicons name={catInfo.icon as any} size={12} color={catInfo.color} />
            </View>
          </View>

          {item.description && (
            <Text style={styles.reminderDescription}>{item.description}</Text>
          )}

          <View style={styles.reminderFooter}>
            <Ionicons
              name="time-outline"
              size={14}
              color={isOverdue ? '#EF4444' : '#6B7280'}
            />
            <Text
              style={[
                styles.reminderDate,
                isOverdue && styles.reminderDateOverdue,
              ]}
            >
              {formatDate(item.due_date)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const pendingReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="alarm" size={24} color="#8B5CF6" />
          </View>
          <View>
            <Text style={styles.headerTitle}>सम्झना</Text>
            <Text style={styles.headerSubtitle}>Reminders</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Reminders List */}
      <FlatList
        data={[...pendingReminders, ...completedReminders]}
        renderItem={renderReminder}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="alarm-outline" size={64} color="#4B5563" />
            <Text style={styles.emptyTitle}>कुनै सम्झना छैन</Text>
            <Text style={styles.emptySubtitle}>No reminders yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Text style={styles.emptyButtonText}>नयाँ थप्नुहोस् / Add New</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          pendingReminders.length > 0 ? (
            <Text style={styles.sectionTitle}>
              बाँकी ({pendingReminders.length})
            </Text>
          ) : null
        }
      />

      {/* Add Reminder Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>नयाँ सम्झना</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="शीर्षक / Title"
              placeholderTextColor="#6B7280"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="विवरण / Description (optional)"
              placeholderTextColor="#6B7280"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            {/* Category Selection */}
            <Text style={styles.modalLabel}>श्रेणी / Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryOption,
                    category === cat.key && { borderColor: cat.color, backgroundColor: cat.color + '10' },
                  ]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date & Time */}
            <Text style={styles.modalLabel}>मिति र समय / Date & Time</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
              <Text style={styles.dateButtonText}>
                {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>

            {(showDatePicker || showTimePicker) && (
              <DateTimePicker
                value={dueDate}
                mode={showDatePicker ? 'date' : 'time'}
                display="default"
                onChange={(event, date) => {
                  if (showDatePicker) {
                    setShowDatePicker(false);
                    if (date) {
                      setDueDate(date);
                      setShowTimePicker(true);
                    }
                  } else {
                    setShowTimePicker(false);
                    if (date) setDueDate(date);
                  }
                }}
                minimumDate={new Date()}
              />
            )}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={createReminder}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'सुरक्षित गर्दै...' : 'सुरक्षित गर्नुहोस् / Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#8B5CF6' + '20',
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  reminderCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2D2D3D',
  },
  reminderCompleted: {
    opacity: 0.6,
  },
  reminderOverdue: {
    borderColor: '#EF4444' + '50',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4B5563',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  reminderContent: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  reminderTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  categoryBadge: {
    padding: 4,
    borderRadius: 6,
  },
  reminderDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  reminderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reminderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  reminderDateOverdue: {
    color: '#EF4444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A24',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalInput: {
    backgroundColor: '#2D2D3D',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D2D3D',
    gap: 8,
  },
  categoryLabel: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D3D',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  dateButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
