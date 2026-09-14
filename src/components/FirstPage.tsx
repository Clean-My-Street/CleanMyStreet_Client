import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { router } from 'expo-router';
import { JSX, useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';

export function FirstPage(): JSX.Element {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/logo.png')} style={styles.logoImage} />
          <Text style={styles.textTitle}>CleanMyStreetZA</Text>
        </View>
      </View>

      <View style={styles.greenBanner}>
        <Text style={styles.bannerTitle}>Reshaping communities,</Text>
        <Text style={styles.bannerTitle}>Restoring Value</Text>
        <Text style={styles.bannerSubtitle}>
          Report dumping sites, fund cleanups, and track progress in your community.
        </Text>
      </View>

      <View style={styles.formCard}>
        <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.welcomeText}>{isCreatingAccount ? 'Create an account' : 'Welcome back'}</Text>
          <Text style={styles.formIntro}>Log in or create an account</Text>

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, !isCreatingAccount ? styles.toggleActive : styles.toggleInactive]}
              onPress={() => setIsCreatingAccount(false)}
            >
              <Text style={[styles.toggleText, !isCreatingAccount ? styles.toggleTextActive : styles.toggleTextInactive]}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, isCreatingAccount ? styles.toggleActive : styles.toggleInactive]}
              onPress={() => setIsCreatingAccount(true)}
            >
              <Text style={[styles.toggleText, isCreatingAccount ? styles.toggleTextActive : styles.toggleTextInactive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {isCreatingAccount && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput style={styles.inputField} placeholder="Eric Ndlovu" placeholderTextColor="#B0B0B0" />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email or Phone Number</Text>
            <TextInput style={styles.inputField} placeholder="you@example.com" placeholderTextColor="#B0B0B0" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput style={styles.inputField} placeholder="••••••••" secureTextEntry placeholderTextColor="#B0B0B0" />
          </View>

          {isCreatingAccount && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput style={styles.inputField} placeholder="••••••••" secureTextEntry placeholderTextColor="#B0B0B0" />
            </View>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.primaryButtonText}>{isCreatingAccount ? 'Sign Up' : 'Log In'}</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <Text style={styles.dividerText}>or continue with</Text>
          </View>

          <TouchableOpacity style={styles.googleButton}>
            <Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'}} style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 46,
    height: 46,
    marginRight: 10,
    resizeMode: 'contain',
  },
  textTitle: {
    fontSize: 18,
    color: '#1a202c',
    fontWeight: '600',
  },
  greenBanner: {
    backgroundColor: '#276749',
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 60,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '400',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#E2E8F0',
    fontSize: 14,
    marginTop: 15,
    lineHeight: 20,
    paddingRight: 20,
  },
  formCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  formScroll: {
    paddingBottom: 40,
  },
  welcomeText: {
    fontSize: 22,
    color: '#1a202c',
    fontWeight: '500',
  },
  formIntro: {
    fontSize: 14,
    color: '#4A5568',
    marginTop: 4,
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F7FAFC',
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: '#38A169',
  },
  toggleInactive: {
    backgroundColor: 'transparent',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
  },
  toggleTextInactive: {
    color: '#4A5568',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#2D3748',
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1A202C',
  },
  primaryButton: {
    backgroundColor: '#38A169',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerText: {
    color: '#A0AEC0',
    fontSize: 12,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#2D3748',
    fontSize: 14,
    fontWeight: '500',
  }
});