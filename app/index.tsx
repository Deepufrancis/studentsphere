import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ImageBackground } from "react-native";
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
        <ImageBackground
            source={require("./assets/background.png")}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.container}>
                <View style={styles.contentContainer}>
                    <View style={styles.topSection}>
                        <Text style={styles.title}>PU Student Sphere</Text>
                    </View>

                    <View style={styles.bottomSection}>
                        <TouchableOpacity onPress={() => router.push("/StudentLogin")} style={styles.buttonWrapper}>
                            <LinearGradient
                                colors={['#4A90E2', '#357ABD']}
                                style={styles.button}
                            >
                                <FontAwesome name="graduation-cap" size={24} color="white" style={styles.icon} />
                                <Text style={styles.buttonText}>Student Login</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push("/TeacherLogin")} style={styles.buttonWrapper}>
                            <LinearGradient
                                colors={['#50C878', '#2E8B57']}
                                style={styles.button}
                            >
                                <FontAwesome name="briefcase" size={24} color="white" style={styles.icon} />
                                <Text style={styles.buttonText}>Teacher Login</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push("/SignUpPage")} style={styles.buttonWrapper}>
                            <LinearGradient
                                colors={['#FF6B6B', '#EE5253']}
                                style={styles.button}
                            >
                                <FontAwesome name="user-plus" size={24} color="white" style={styles.icon} />
                                <Text style={styles.buttonText}>Create Account</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push("/ForgotPassword")}>
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 20,
    },
    topSection: {
        paddingTop: 70,
    },
    title: {
        fontSize: 48,
        color: '#ffffff',
        fontFamily: "Poppins_700Bold",
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    bottomSection: {
        width: "100%",
        alignItems: "center",
        gap: 16,
        marginBottom: 40,
    },
    buttonWrapper: {
        width: width * 0.85,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        borderRadius: 12,
    },
    icon: {
        marginRight: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    buttonText: {
        color: "#FFF",
        fontSize: 18,
        fontFamily: "Poppins_500Medium",
        letterSpacing: 0.8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    forgotPasswordText: {
        color: "#ffffff",
        fontSize: 16,
        fontFamily: "Poppins_400Regular",
        marginTop: 15,
        textDecorationLine: "underline",
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    }
});
