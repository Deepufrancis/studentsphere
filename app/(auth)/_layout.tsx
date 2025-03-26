import { Stack } from "expo-router";

export default function Layout() {
    return(
        <Stack>
            <Stack.Screen name="StudentLogin" options={{headerShown:false}}/>
            <Stack.Screen name="SignUpPage" options={{headerShown:false}}/>
            <Stack.Screen name="TeacherLogin" options={{headerShown:false}}/>
            <Stack.Screen name="login" options={{headerShown:false}}/>
        </Stack>
    )
}
