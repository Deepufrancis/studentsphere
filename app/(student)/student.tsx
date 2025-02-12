import { Text, View, StyleSheet,Button} from 'react-native';
import { useRouter } from 'expo-router';
export default function menuScreen() {

  const router=useRouter();
  return (
    <View style={styles.container}>
      
      <View>
              <Text>list of courses available</Text>
            </View>
    </View>
  );
 
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
  },
});
