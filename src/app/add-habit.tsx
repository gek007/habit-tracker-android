import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHabitsContext } from '@/context/habits-context';
import { HabitTypeSelector } from '@/components/habit-type-selector';
import { HabitType } from '@/hooks/use-habits';
import { resolveHabitIcon } from '@/utils/habit-icon';

const ICON_CHOICES = [
  'run',
  'water',
  'meditation',
  'book',
  'dumbbell',
  'heart',
  'bed',
  'apple',
  'coffee',
  'weather-night',
  'weather-sunny',
  'star',
];

const COLOR_CHOICES = [
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#f97316',
  '#d4af37',
];

export default function AddHabitScreen() {
  const router = useRouter();
  const { addHabit } = useHabitsContext();
  const [name, setName] = useState('');
  const [type, setType] = useState<HabitType>('daily');
  const [goal, setGoal] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('run');
  const [selectedColor, setSelectedColor] = useState('#22c55e');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter a habit name');
      return;
    }
    if (type === 'volume' && !goal.trim()) {
      alert('Please enter a goal for volume habits');
      return;
    }
    try {
      setIsLoading(true);
      const goalNum = type === 'volume' ? parseInt(goal, 10) : 1;
      await addHabit(name, type, goalNum, selectedIcon, selectedColor);
      router.back();
    } catch (error) {
      console.error('Failed to create habit:', error);
      alert('Failed to create habit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header — title only, no scrolling */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="close" size={24} color="#aaa" />
          </TouchableOpacity>
          <Text style={styles.title}>New Habit</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Scrollable form content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.section}>
            <Text style={styles.label}>Habit Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Morning Run"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
              editable={!isLoading}
              returnKeyType="done"
            />
          </View>

          <View style={styles.section}>
            <HabitTypeSelector selected={type} onSelect={setType} />
          </View>

          {type === 'volume' && (
            <View style={styles.section}>
              <Text style={styles.label}>Daily Goal</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 8"
                placeholderTextColor="#666"
                value={goal}
                onChangeText={setGoal}
                keyboardType="number-pad"
                editable={!isLoading}
                returnKeyType="done"
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Icon</Text>
            <View style={styles.iconGrid}>
              {ICON_CHOICES.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconButton,
                    selectedIcon === icon && styles.iconButtonActive,
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                  disabled={isLoading}
                >
                  <MaterialCommunityIcons
                    name={resolveHabitIcon(icon)}
                    size={28}
                    color={selectedIcon === icon ? '#d4af37' : selectedColor}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Color</Text>
            <View style={styles.colorGrid}>
              {COLOR_CHOICES.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorButtonActive,
                  ]}
                  onPress={() => setSelectedColor(color)}
                  disabled={isLoading}
                >
                  {selectedColor === color && (
                    <MaterialCommunityIcons name="check" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.preview}>
            <View
              style={[
                styles.previewIcon,
                { backgroundColor: `${selectedColor}22` },
              ]}
            >
              <MaterialCommunityIcons
                name={resolveHabitIcon(selectedIcon)}
                size={32}
                color={selectedColor}
              />
            </View>
            <View style={styles.previewText}>
              <Text style={styles.previewName}>{name || 'Habit name'}</Text>
              <Text style={styles.previewType}>
                {type === 'daily' ? 'Daily habit' : `Daily goal: ${goal || '0'}`}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Sticky footer — always visible */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createButton, isLoading && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#0a0a0a" />
            ) : (
              <Text style={styles.createButtonText}>Create Habit</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconButton: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  iconButtonActive: {
    borderColor: '#d4af37',
    backgroundColor: '#d4af3722',
  },
  colorGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  colorButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: '#fff',
  },
  preview: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d4af3722',
  },
  previewIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  previewText: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  previewType: {
    fontSize: 13,
    color: '#aaa',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: '#0a0a0a',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaa',
  },
  createButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#d4af37',
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a0a0a',
  },
});
