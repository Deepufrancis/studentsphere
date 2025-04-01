import { View, Text, StyleSheet } from 'react-native';

const Settings = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Settings</Text>
      <Text style={styles.subtitle}>Manage your account preferences and configurations here.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    color: '#666',
  },
});

export default Settings;
