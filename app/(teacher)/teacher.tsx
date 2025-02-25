import React from "react";
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const itemSize = width / 2 - 30;

const TeacherDashboard: React.FC = () => {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Teacher Dashboard</Text>
            <View style={styles.grid}>
                <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push("/courses")}> 
                    <Ionicons name="book-outline" size={32} color="#000" />
                    <Text style={styles.cardText}>Courses</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push("/assignments")}> 
                    <Ionicons name="clipboard-outline" size={32} color="#000" />
                    <Text style={styles.cardText}>Assignments</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push("/menu")}> 
                    <Ionicons name="person-circle-outline" size={32} color="#000" />
                    <Text style={styles.cardText}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push("/courseDetail")}> 
                    <Ionicons name="information-circle-outline" size={32} color="#000" />
                    <Text style={styles.cardText}>Details</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default TeacherDashboard;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#EAEAEA",
        alignItems: "center",
        justifyContent: "center",
    },
    header: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
        marginVertical: 15,
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        width: "100%",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 20,
        width: itemSize,
        height: itemSize,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        marginVertical: 10,
    },
    cardText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000",
        marginTop: 10,
        textTransform: "capitalize",
    },
});
