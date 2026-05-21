import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, authError, clearAuthError } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) return;
    setIsSubmitting(true);
    clearAuthError();
    await signIn(email, password);
    setIsSubmitting(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0a0a0a' }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
    >
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#d4af37', marginBottom: 10 }}>
          Habit Tracker
        </Text>
        <Text style={{ fontSize: 16, color: '#999', marginBottom: 40 }}>
          Log in to your account
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isSubmitting}
          style={{
            backgroundColor: '#16213e',
            borderRadius: 8,
            padding: 15,
            color: '#fff',
            marginBottom: 15,
            borderWidth: 1,
            borderColor: '#333',
          }}
        />

        <View
          style={{
            backgroundColor: '#16213e',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#333',
            flexDirection: 'row',
            alignItems: 'center',
            paddingRight: 10,
            marginBottom: 20,
          }}
        >
          <TextInput
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!isSubmitting}
            style={{
              flex: 1,
              padding: 15,
              color: '#fff',
            }}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            disabled={isSubmitting}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye' : 'eye-off'}
              size={20}
              color="#d4af37"
            />
          </TouchableOpacity>
        </View>

        {authError && (
          <Text style={{ color: '#ff6b6b', marginBottom: 15, fontSize: 14 }}>
            {authError}
          </Text>
        )}

        <TouchableOpacity
          onPress={handleLogin}
          disabled={!email || !password || isSubmitting}
          style={{
            backgroundColor: '#d4af37',
            borderRadius: 8,
            padding: 15,
            alignItems: 'center',
            marginBottom: 20,
            opacity: !email || !password || isSubmitting ? 0.5 : 1,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#0a0a0a" />
          ) : (
            <Text style={{ color: '#0a0a0a', fontWeight: 'bold', fontSize: 16 }}>
              Log In
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#999', marginRight: 5 }}>Don't have an account?</Text>
          <TouchableOpacity
            onPress={() => router.push('./signup')}
            disabled={isSubmitting}
          >
            <Text style={{ color: '#d4af37', fontWeight: 'bold' }}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
