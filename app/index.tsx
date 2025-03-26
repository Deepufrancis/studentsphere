import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import { useFonts, Poppins_700Bold, Poppins_500Medium, Poppins_400Regular } from "@expo-google-fonts/poppins";

const { width } = Dimensions.get("window");

export default function Index() {
    const router = useRouter();
    const [fontsLoaded] = useFonts({
        Poppins_700Bold,
        Poppins_500Medium,
        Poppins_400Regular,
    });

    if (!fontsLoaded) return null;

    return (
        <LinearGradient colors={["#1a237e", "#534bae", "#ffffff"]} style={styles.container}>
            <View style={styles.contentContainer}>
                <View style={styles.topSection}>
                    <Text style={styles.title}>PU Student Sphere</Text>
                </View>

                <View style={styles.bottomSection}>
                    <TouchableOpacity onPress={() => router.push("/StudentLogin")} style={styles.buttonWrapper}>
                        <LinearGradient colors={["#1a237e", "#534bae"]} style={styles.button}>
                            <FontAwesome name="graduation-cap" size={22} color="white" style={styles.icon} />
                            <Text style={styles.buttonText}>Student Login</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push("/TeacherLogin")} style={styles.buttonWrapper}>
                        <LinearGradient colors={["#534bae", "#1a237e"]} style={styles.button}>
                            <FontAwesome name="briefcase" size={22} color="white" style={styles.icon} />
                            <Text style={styles.buttonText}>Teacher Login</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push("/SignUpPage")} style={styles.buttonWrapper}>
                        <LinearGradient colors={["#007AFF", "#0051A3"]} style={styles.button}>
                            <FontAwesome name="user-plus" size={22} color="white" style={styles.icon} />
                            <Text style={styles.buttonText}>Create Account</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push("/ForgotPassword")}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        margin: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    topSection: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "flex-start",
        padding: 30,
        paddingTop: 60,
    },
    title: {
        fontSize: 40,
        color: '#1a237e',
        fontFamily: "Poppins_700Bold",
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        fontFamily: "Poppins_400Regular",
        marginTop: 8,
    },
    bottomSection: {
        paddingBottom: 40,
        width: "100%",
        alignItems: "center",
    },
    buttonWrapper: {
        width: width * 0.85,
        marginBottom: 15,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        borderRadius: 16,
    },
    icon: {
        marginRight: 12,
    },
    buttonText: {
        color: "#FFF",
        fontSize: 18,
        fontFamily: "Poppins_600SemiBold",
        letterSpacing: 0.5,
    },
    forgotPasswordText: {
        color: "#1a237e",
        fontSize: 16,
        fontFamily: "Poppins_400Regular",
        marginTop: 10,
        textDecorationLine: "underline",
    },
});
