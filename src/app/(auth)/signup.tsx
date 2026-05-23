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

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { signUp, authError, clearAuthError } = useAuth();

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      return;
    }

    setIsSubmitting(true);
    clearAuthError();
    await signUp(email, password);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0a0a0a' }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        <View style={{ paddingHorizontal: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#d4af37', marginBottom: 20 }}>
            Verify Your Email
          </Text>
          <Text style={{ fontSize: 16, color: '#999', marginBottom: 20, textAlign: 'center' }}>
            We&apos;ve sent a confirmation link to:
          </Text>
          <Text style={{ fontSize: 16, color: '#d4af37', marginBottom: 30, fontWeight: '600' }}>
            {email}
          </Text>
          <Text style={{ fontSize: 14, color: '#999', marginBottom: 30, textAlign: 'center' }}>
            Click the link in your email to activate your account, then log in.
          </Text>

          <TouchableOpacity
            onPress={() => router.push('./login')}
            style={{
              backgroundColor: '#d4af37',
              borderRadius: 8,
              padding: 15,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Text style={{ color: '#0a0a0a', fontWeight: 'bold', fontSize: 16 }}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const passwordsMatch = password === confirmPassword;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0a0a0a' }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
    >
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#d4af37', marginBottom: 10 }}>
          Create Account
        </Text>
        <Text style={{ fontSize: 16, color: '#999', marginBottom: 40 }}>
          Join and start building habits
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
            marginBottom: 15,
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

        <View
          style={{
            backgroundColor: '#16213e',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: passwordsMatch ? '#333' : '#ff6b6b',
            flexDirection: 'row',
            alignItems: 'center',
            paddingRight: 10,
            marginBottom: 20,
          }}
        >
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            editable={!isSubmitting}
            style={{
              flex: 1,
              padding: 15,
              color: '#fff',
            }}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isSubmitting}
          >
            <MaterialCommunityIcons
              name={showConfirmPassword ? 'eye' : 'eye-off'}
              size={20}
              color="#d4af37"
            />
          </TouchableOpacity>
        </View>

        {!passwordsMatch && confirmPassword !== '' && (
          <Text style={{ color: '#ff6b6b', marginBottom: 15, fontSize: 14 }}>
            Passwords do not match
          </Text>
        )}

        {authError && (
          <Text style={{ color: '#ff6b6b', marginBottom: 15, fontSize: 14 }}>
            {authError}
          </Text>
        )}

        <TouchableOpacity
          onPress={handleSignup}
          disabled={!email || !password || !confirmPassword || !passwordsMatch || isSubmitting}
          style={{
            backgroundColor: '#d4af37',
            borderRadius: 8,
            padding: 15,
            alignItems: 'center',
            marginBottom: 20,
            opacity:
              !email || !password || !confirmPassword || !passwordsMatch || isSubmitting
                ? 0.5
                : 1,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#0a0a0a" />
          ) : (
            <Text style={{ color: '#0a0a0a', fontWeight: 'bold', fontSize: 16 }}>
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#999', marginRight: 5 }}>Already have an account?</Text>
          <TouchableOpacity
            onPress={() => router.push('./login')}
            disabled={isSubmitting}
          >
            <Text style={{ color: '#d4af37', fontWeight: 'bold' }}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
