import { Stack } from "expo-router";

export default function Layout() {
    return(
        <Stack>
            <Stack.Screen name="(student)" options={{headerShown:false}}/>
            <Stack.Screen name="(teacher)" options={{headerShown:false}}/>
            <Stack.Screen name="(auth)" options={{headerShown:false}}/>
            <Stack.Screen name="index" options={{headerShown:false}}/>


        </Stack>
    )
}
