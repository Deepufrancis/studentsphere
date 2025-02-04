import { Text, View, StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function Login() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Login As:</Text>
      <Button
        title="TEACHER"
        onPress={() => {
          router.push('/teacher');
        }}
      />
      <Button
        title="student"
        onPress={() => {
          router.push('/student');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
});
