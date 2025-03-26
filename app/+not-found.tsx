import { View, StyleSheet, Text } from 'react-native';
import { Link, Stack } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>404</Text>
          <Text style={styles.subtitle}>Page Not Found</Text>
          <Link href="/" style={styles.button}>
            Return to Home
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    color: '#8E8E93',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#0A84FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
