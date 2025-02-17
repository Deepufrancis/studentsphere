import React from "react";
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Button } from "react-native";


const TeacherDashboard: React.FC = () => {
    const router = useRouter();
    return (
        <View style={styles.container}>
            <Text style={styles.header}>
                Student Dashboard
            </Text>
            <TouchableOpacity style={styles.card} onPress={() => router.push("/s_course")}>
                <Text>Register Courses</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card} onPress={() => router.push("/courses")}>
                <Text>Assignments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card} onPress={() => router.push("/menu")}>
                <Text>Profile</Text>
            </TouchableOpacity>

        </View>
    );
};
export default TeacherDashboard;


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#F5F5F5",
    },
    header: {
        textAlign: "center",
        fontSize: 26,
        fontWeight: "bold",
        color: "#222",
        marginVertical: 15,
        letterSpacing: 1, 
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 15,
        padding: 20,
        marginVertical: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E0E0E0", 
    },
    cardText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    }
});
