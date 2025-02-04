import { Text, View, StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function Login() {
  const router = useRouter();

  return (
    <View>
      <Text></Text>w
      <Button
        title="student"
        onPress={() => {
          router.push('/student');
        }}
      />
    </View>
  );
}

