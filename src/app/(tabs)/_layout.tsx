import { Tabs } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBell, faHome, faUser, faPlus, faNewspaper } from '@fortawesome/free-solid-svg-icons';
import { View, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 70,
          borderTopWidth: 1,
          borderTopColor: '#E8E8E8',
          backgroundColor: '#FFFFFF',
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <FontAwesomeIcon icon={faHome} size={24} color={focused ? "#124A2A" : "#68706A"} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <FontAwesomeIcon icon={faNewspaper} size={24} color={focused ? "#124A2A" : "#68706A"} />
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          tabBarIcon: ({ color }) => (
            <View style={styles.addButton}>
              <FontAwesomeIcon icon={faPlus} size={20} color="#17201A" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <FontAwesomeIcon icon={faBell} size={24} color={focused ? "#124A2A" : "#68706A"} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <FontAwesomeIcon icon={faUser} size={24} color={focused ? "#124A2A" : "#68706A"} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#68706A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
    backgroundColor: '#fff',
  },
});
