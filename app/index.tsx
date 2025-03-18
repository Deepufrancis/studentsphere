import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import { useFonts, Poppins_700Bold, Poppins_500Medium } from "@expo-google-fonts/poppins";

const { width } = Dimensions.get("window");

export default function Index() {
    const router = useRouter();
    const [fontsLoaded] = useFonts({
        Poppins_700Bold,
        Poppins_500Medium,
    });

    if (!fontsLoaded) return null;

    return (
        <LinearGradient colors={["rgb(139, 132, 132)", "#FFFFFF"]} style={styles.container}>

            <View style={styles.topSection}>
                <Text style={styles.title}>PU{"\n"}Student Sphere</Text>
            </View>

            <View style={styles.bottomSection}>
                <TouchableOpacity onPress={() => router.push("/StudentLogin")} style={styles.buttonWrapper}>
                    <LinearGradient colors={["#007BFF", "#0056D2"]} style={styles.button}>
                        <FontAwesome name="user" size={22} color="white" style={styles.icon} />
                        <Text style={styles.buttonText}>Login as Student</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push("/TeacherLogin")} style={styles.buttonWrapper}>
                    <LinearGradient colors={["#007BFF", "#0056D2"]} style={styles.button}>
                        <FontAwesome name="graduation-cap" size={22} color="white" style={styles.icon} />
                        <Text style={styles.buttonText}>Login as Teacher</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push("/SignUpPage")} style={styles.buttonWrapper}>
                    <LinearGradient colors={["#444", "#222"]} style={styles.button}>
                        <FontAwesome name="user-plus" size={22} color="white" style={styles.icon} />
                        <Text style={styles.buttonText}>Sign Up</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topSection: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "flex-start",
        paddingLeft: 30,
        paddingTop: 50,
    },
    title: {
        fontSize: 38,
        fontWeight: "bold",
        color: "#333",
        fontFamily: "Poppins_700Bold",
    },
    bottomSection: {
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 40,
        width: "100%",
    },
    buttonWrapper: {
        width: "100%",
        alignItems: "center",
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: width * 0.9,
        padding: 16,
        borderRadius: 25,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    icon: {
        marginRight: 10,
    },
    buttonText: {
        color: "#FFF",
        fontSize: 18,
        fontFamily: "Poppins_500Medium",
        letterSpacing: 1,
    },
});
