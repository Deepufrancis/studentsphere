import { Text, View, StyleSheet,Button} from 'react-native';
import { useRouter } from 'expo-router';
export default function menuScreen() {

  const router=useRouter();
  return (
    <View style={styles.container}>
      
      <View>
              <Button title="Logout" onPress={handleLogout}/>
              <Text>hiiiii</Text>
            </View>
    </View>
  );
  function handleLogout() {
    router.replace('/');
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
  },
});
