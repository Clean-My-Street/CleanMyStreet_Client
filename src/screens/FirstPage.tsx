import { router } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { JSX, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  loginWithEmail,
  registerWithEmail,
} from '../services/authService';

export function FirstPage(): JSX.Element {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { width } = useWindowDimensions();

  const horizontalPadding = Math.min(50, Math.max(20, width * 0.1));
  const subtitleFontSize = Math.min(40, Math.max(28, width * 0.105));

  async function handleAuthentication() {
    const cleanEmail = email.trim();

    // Validate required fields.
    if (!cleanEmail || !password) {
      Alert.alert('Missing information', 'Please enter your email and password.');
      return;
    }

    // Basic email validation.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    if (isCreatingAccount) {
      if (!fullName.trim()) {
        Alert.alert('Missing name', 'Please enter your full name.');
        return;
      }

      if (password.length < 6) {
        Alert.alert(
          'Password too short',
          'Your password must contain at least 6 characters.'
        );
        return;
      }

      if (!confirmPassword) {
        Alert.alert(
          'Missing confirmation',
          'Please enter your password again to confirm it.'
        );
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert(
          'Passwords do not match',
          'Please make sure both passwords are the same.'
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (isCreatingAccount) {
        await registerWithEmail(fullName, cleanEmail, password);

        Alert.alert(
          'Account created',
          'Your CleanMyStreet account has been created successfully.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/home'),
            },
          ]
        );
      } else {
        await loginWithEmail(cleanEmail, password);

        // Navigate only after Firebase confirms successful login.
        router.replace('/home');
      }
    } catch (error: any) {
      let message = 'Something went wrong. Please try again.';

      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'An account with this email already exists. Try logging in.';
          break;

        case 'auth/invalid-email':
          message = 'Please enter a valid email address.';
          break;

        case 'auth/weak-password':
          message = 'Your password is too weak. Use at least 6 characters.';
          break;

        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          message = 'Incorrect email or password.';
          break;

        case 'auth/too-many-requests':
          message = 'Too many attempts. Please wait a while and try again.';
          break;

        case 'auth/network-request-failed':
          message = 'Network error. Check your internet connection.';
          break;

        case 'auth/operation-not-allowed':
          message = 'Email/password sign-in is not enabled in Firebase.';
          break;
      }

      console.error('Authentication error:', error.code, error.message);

      Alert.alert(
        isCreatingAccount ? 'Registration failed' : 'Login failed',
        message
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Image
            source={require('../../assets/images/cleanmystreet.png')}
            style={styles.logo}
          />

          <Text
            style={[
              styles.textTitle,
              { fontSize: Math.min(30, Math.max(22, width * 0.075)) },
            ]}
          >
            CleanMyStreetZA
          </Text>
        </View>

        <View
          style={[
            styles.container2,
            { paddingHorizontal: horizontalPadding },
          ]}
        >
          <Text style={[styles.textSubtitle, { fontSize: subtitleFontSize }]}>
            Reshaping Communities,
          </Text>

          <Text style={[styles.textSubtitle, { fontSize: subtitleFontSize }]}>
            Restoring Value
          </Text>

          <Text style={styles.textContent}>
            Report Dumping Sites, Fund Cleanups and track progress
            in your community.
          </Text>
        </View>

        <View
          style={[
            styles.container3,
            { paddingHorizontal: horizontalPadding },
          ]}
        >
          <Text style={styles.textWelcome}>
            {isCreatingAccount ? 'Create Your Account' : 'Welcome Back'}
          </Text>

          <Text style={styles.formIntro}>
            {isCreatingAccount
              ? 'Join your community and help restore local spaces'
              : 'Log In or Create an Account'}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button1,
                !isCreatingAccount
                  ? styles.selectedButton
                  : styles.inactiveLoginButton,
              ]}
              disabled={isSubmitting}
              onPress={() => {
                setIsCreatingAccount(false);
                setIsPasswordVisible(false);
                setIsConfirmPasswordVisible(false);
              }}
            >
              <Text
                style={[
                  styles.buttonText1,
                  isCreatingAccount && styles.inactiveLoginText,
                ]}
              >
                Log In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button2,
                isCreatingAccount && styles.selectedCreateButton,
              ]}
              disabled={isSubmitting}
              onPress={() => {
                setIsCreatingAccount(true);
                setIsPasswordVisible(false);
                setIsConfirmPasswordVisible(false);
              }}
            >
              <Text
                style={[
                  styles.buttonText2,
                  isCreatingAccount && styles.activeButtonText,
                ]}
              >
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.containerInput}>
            {isCreatingAccount && (
              <>
                <Text style={styles.inputText}>Full Name:</Text>

                <TextInput
                  style={styles.inputStyles}
                  placeholder="Eric Ndlovu"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!isSubmitting}
                />
              </>
            )}

            <Text style={styles.inputText}>Email Address:</Text>

            <TextInput
              style={styles.inputStyles}
              placeholder="eric@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!isSubmitting}
            />

            <Text style={styles.inputText}>Password:</Text>

            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoComplete={isCreatingAccount ? 'new-password' : 'current-password'}
                editable={!isSubmitting}
              />
              <TouchableOpacity
                style={styles.passwordVisibilityButton}
                onPress={() => setIsPasswordVisible((visible) => !visible)}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                accessibilityHint="Toggles password visibility"
                accessibilityState={{ selected: isPasswordVisible, disabled: isSubmitting }}
              >
                <FontAwesomeIcon
                  icon={isPasswordVisible ? faEyeSlash : faEye}
                  size={18}
                  color="#68706A"
                />
              </TouchableOpacity>
            </View>

            {isCreatingAccount && (
              <>
                <Text style={styles.inputText}>Confirm Password:</Text>

                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!isConfirmPasswordVisible}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    style={styles.passwordVisibilityButton}
                    onPress={() => setIsConfirmPasswordVisible((visible) => !visible)}
                    disabled={isSubmitting}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isConfirmPasswordVisible
                        ? 'Hide confirm password'
                        : 'Show confirm password'
                    }
                    accessibilityHint="Toggles password visibility"
                    accessibilityState={{
                      selected: isConfirmPasswordVisible,
                      disabled: isSubmitting,
                    }}
                  >
                    <FontAwesomeIcon
                      icon={isConfirmPasswordVisible ? faEyeSlash : faEye}
                      size={18}
                      color="#68706A"
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[
                styles.button3,
                isSubmitting && styles.disabledButton,
              ]}
              onPress={handleAuthentication}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText1}>
                  {isCreatingAccount ? 'Create Account' : 'Log In'}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.orText}>OR</Text>

            <Text style={styles.googleNote}>
              Google sign-in is not connected yet.
            </Text>

            <Image
              source={require('../../assets/expo.icon/Assets/search.png')}
              style={styles.googleIcon}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  logo: {
    width: 50,
    height: 50,
  },
  textWelcome: {
    fontSize: 30,
    fontFamily: 'Red Hat Display',
    color: '#17201A',
    paddingTop: 20,
    paddingBottom: 10,
  },
  formIntro: {
    fontFamily: 'Red Hat Display',
    fontSize: 16,
    color: '#17201A',
  },
  container: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
    gap: 8,
  },
  container2: {
    backgroundColor: '#1F7A3F',
    width: '100%',
    paddingTop: 40,
    paddingBottom: 50,
    margin: 0,
  },
  container3: {
    width: '100%',
    paddingTop: 20,
    paddingBottom: 50,
    marginTop: -30,
    flexGrow: 1,
    zIndex: 10,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  containerInput: {
    width: '100%',
    marginTop: 20,
  },
  inputStyles: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    color: '#17201A',
    backgroundColor: '#FFFFFF',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    color: '#17201A',
    backgroundColor: 'transparent',
  },
  passwordVisibilityButton: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  inputText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 7,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
  },
  textTitle: {
    fontSize: 30,
    fontFamily: 'Red Hat Display',
    color: '#17201A',
  },
  textSubtitle: {
    color: '#FFFFFF',
    fontSize: 40,
    fontFamily: 'Red Hat Display',
    paddingTop: 0,
    marginTop: 0,
  },
  textContent: {
    width: '100%',
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Red Hat Display',
    paddingTop: 20,
    paddingBottom: 20,
    marginTop: 0,
  },
  button1: {
    flex: 1,
    backgroundColor: '#1F7A3F',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center',
  },
  selectedButton: {
    borderWidth: 1,
    borderColor: '#1F7A3F',
  },
  inactiveLoginButton: {
    backgroundColor: '#FFFFFF',
  },
  button2: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  selectedCreateButton: {
    backgroundColor: '#1F7A3F',
  },
  button3: {
    width: '100%',
    backgroundColor: '#1F7A3F',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    minHeight: 46,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText1: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inactiveLoginText: {
    color: '#1F7A3F',
  },
  buttonText2: {
    color: '#1F7A3F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
  submitContainer: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  orText: {
    marginTop: 10,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  googleNote: {
    color: '#68706A',
    fontSize: 12,
    marginBottom: 10,
  },
  googleIcon: {
    width: 30,
    height: 30,
  },
});