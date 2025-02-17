import { Text, View, StyleSheet,TouchableOpacity} from 'react-native';
import { useRouter } from 'expo-router';
export default function menuScreen() {

  const router=useRouter();
  return (
    <View style={styles.container}>
      
      <View>
              <TouchableOpacity style={styles.logButton} onPress={handleLogout}>
              <Text style={styles.text}>logout</Text>
              </TouchableOpacity>
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
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'black',
    fontSize:40,
  },
  logButton:{
    backgroundColor:'rgb(183, 173, 173)',
    borderRadius:20,
    elevation:20,
  }
});
