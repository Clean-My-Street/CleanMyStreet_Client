import { router } from 'expo-router';
import { JSX, useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function FirstPage(): JSX.Element {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <Image source={require('../../assets/images/cleanmystreet.png')} style={styles.logo} />
        <Text style={styles.textTitle}>CleanMyStreetZA</Text>
      </View>

      <View style={styles.container2}>
        <Text style={styles.textSubtitle}>Reshaping Communities,</Text>
        <Text style={styles.textSubtitle}>Restoring Value</Text>
        <Text style={styles.textContent}>Report Dumping Sites, Fund Cleanups and track progress
          in your community.</Text>
      </View>
      <View style={styles.container3}>
        <Text style={styles.textWelcome}>{isCreatingAccount ? 'Create Your Account' : 'Welcome Back'}</Text>
        <Text style={styles.formIntro}>
          {isCreatingAccount ? 'Join your community and help restore local spaces' : 'Log In or Create an Account'}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button1, !isCreatingAccount ? styles.selectedButton : styles.inactiveLoginButton]}
            onPress={() => setIsCreatingAccount(false)}
          >
            <Text style={[styles.buttonText1, isCreatingAccount && styles.inactiveLoginText]}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button2, isCreatingAccount && styles.selectedCreateButton]}
            onPress={() => setIsCreatingAccount(true)}
          >
            <Text style={[styles.buttonText2, isCreatingAccount && styles.activeButtonText]}>Create Account</Text>
          </TouchableOpacity>
        </View>

        <View style={ styles.containerInput}>
          {isCreatingAccount && (
            <>
              <Text style={styles.inputText}>Full Name:</Text>
              <TextInput style={styles.inputStyles} placeholder="Eric Ndlovu" />
            </>
          )}

          <Text style={styles.inputText}>Email or Phone Number:</Text>
          <TextInput style={styles.inputStyles} placeholder="eric@example.com / 083 000 0000" />

          <Text style={styles.inputText}>Password:</Text>
          <TextInput style={styles.inputStyles} placeholder="•••••••••••••" secureTextEntry />

          {isCreatingAccount && (
            <>
              <Text style={styles.inputText}>Confirm Password:</Text>
              <TextInput style={styles.inputStyles} placeholder="Repeat your password" secureTextEntry />
            </>
          )}
        </View>

        <View style={{width: '100%', marginTop: 20, alignItems: 'center'}}>
          <TouchableOpacity style={styles.button3} onPress={() => router.push('/home')}>
            <Text style={styles.buttonText1}>{isCreatingAccount ? 'Create Account' : 'Log In'}</Text>
          </TouchableOpacity>
        <Text style={{marginTop: 10, marginBottom: 10, fontWeight: 'bold'}}>OR</Text>
        <Image source={require('../../assets/expo.icon/Assets/search.png')} style={{width: 30, height: 30}} />
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 30,
    fontWeight: 'bold',
    paddingTop: 5,
    paddingBottom: 5,
    paddingRight: 50,
    paddingLeft: 10,
  },
  container2: {

    backgroundColor: '#1F7A3F',
    width: '100%',
    paddingTop: 40,
    paddingBottom: 50,
    paddingRight: 50,
    paddingLeft: 50,
    margin: 0,
  },
  container3: {
    width: '100%',
    paddingTop: 20,
    paddingBottom: 50,
    paddingRight: 50,
    paddingLeft: 50,
    marginTop: -30,
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
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
  },
  inputText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 7,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%'
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
    width: '90%',
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Red Hat Display',
    paddingTop: 20,
    paddingBottom: 20,
    marginTop: 0,
  },
  button1: {
    width: '50%',
    backgroundColor: '#1F7A3F',
    color: '#FFFFFF',
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
    width: '50%',
    backgroundColor: '#f7f7f7',
    color: '#1F7A3F',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  selectedCreateButton: {
    backgroundColor: '#1F7A3F',
  },
  button3: {
    width: '50%',
    backgroundColor: '#1F7A3F',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
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
});