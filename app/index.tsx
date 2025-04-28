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
         <LinearGradient
              colors={['#f6f8ff', '#d8e2ff', '#b6cbff']}
              style={styles.background}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
            <View style={styles.container}>
                <View style={styles.contentContainer}>
                    <View style={styles.topSection}>
                        <Text style={styles.title}>PU Student{'\n'}Sphere</Text>
                    </View>

                    <View style={styles.bottomSection}>
                        <TouchableOpacity onPress={() => router.push("/StudentLogin")} style={styles.buttonWrapper}>
                            <LinearGradient
                                colors={['#4A90E2', '#357ABD']}
                                style={styles.button}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <FontAwesome name="graduation-cap" size={20} color="white" style={styles.icon} />
                                <Text style={styles.buttonText}>Student Login</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push("/TeacherLogin")} style={styles.buttonWrapper}>
                            <LinearGradient
                                colors={['#50C878', '#2E8B57']}
                                style={styles.button}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <FontAwesome name="briefcase" size={20} color="white" style={styles.icon} />
                                <Text style={styles.buttonText}>Teacher Login</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push("/SignUpPage")} style={styles.buttonWrapper}>
                            <LinearGradient
                                colors={['#FF6B6B', '#EE5253']}
                                style={styles.button}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <FontAwesome name="user-plus" size={20} color="white" style={styles.icon} />
                                <Text style={styles.buttonText}>Create Account</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push("/ForgotPassword")}>
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 24,
    },
    topSection: {
        paddingTop: 80,
    },
    title: {
        fontSize: 42,
        color: '#1a1a1a',
        fontFamily: "Poppins_700Bold",
        lineHeight: 52,
    },
    bottomSection: {
        width: "100%",
        alignItems: "center",
        gap: 12,
        marginBottom: 50,
    },
    buttonWrapper: {
        width: "100%",
        borderRadius: 16,
        overflow: 'hidden',
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderRadius: 16,
    },
    icon: {
        marginRight: 10,
    },
    buttonText: {
        color: "#FFF",
        fontSize: 16,
        fontFamily: "Poppins_500Medium",
    },
    forgotPasswordText: {
        color: "#1a1a1a",
        fontSize: 14,
        fontFamily: "Poppins_400Regular",
        marginTop: 20,
    }
});
