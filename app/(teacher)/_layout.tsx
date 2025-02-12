import { Tabs } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';


export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffd33d',
        headerStyle: {
            backgroundColor: '#25292e',
          },
          headerShadowVisible: false,
          headerTintColor: '#fff',
          tabBarStyle: {
          backgroundColor: '#25292e',
          },
      }}
    >
      <Tabs.Screen
        name="teacher"
        options={{
          title: 'courses',
          tabBarIcon: ({ color, focused }) => (
          <FontAwesome5 name="book" color={color} size={24} />
          ),
        }}
      />
    <Tabs.Screen
      name="menu"
      options={{
        title: 'options',
        tabBarIcon: ({ color, focused }) => (
          <MaterialCommunityIcons name="menu" size={24} color={color} /> 
        ),
      }}
    />

    </Tabs>
  );
}
