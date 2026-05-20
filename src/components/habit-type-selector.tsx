import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HabitType } from '@/hooks/use-habits';

interface HabitTypeSelectorProps {
  selected: HabitType;
  onSelect: (type: HabitType) => void;
}

export function HabitTypeSelector({ selected, onSelect }: HabitTypeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Habit Type</Text>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[
            styles.button,
            selected === 'daily' && styles.buttonActive,
          ]}
          onPress={() => onSelect('daily')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="checkbox-marked-circle"
            size={20}
            color={selected === 'daily' ? '#d4af37' : '#666'}
          />
          <Text
            style={[
              styles.buttonText,
              selected === 'daily' && styles.buttonTextActive,
            ]}
          >
            Daily
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            selected === 'volume' && styles.buttonActive,
          ]}
          onPress={() => onSelect('volume')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="plus-circle"
            size={20}
            color={selected === 'volume' ? '#d4af37' : '#666'}
          />
          <Text
            style={[
              styles.buttonText,
              selected === 'volume' && styles.buttonTextActive,
            ]}
          >
            Volume
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.helpText}>
        {selected === 'daily'
          ? 'Complete once per day'
          : 'Tap to increment a counter'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#0a0a0a',
  },
  buttonActive: {
    borderColor: '#d4af37',
    backgroundColor: '#d4af3722',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  buttonTextActive: {
    color: '#d4af37',
  },
  helpText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
