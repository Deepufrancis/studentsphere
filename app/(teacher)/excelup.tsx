import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import XLSX from "xlsx";

const ExcelDebugScreen = () => {
  const [fileUri, setFileUri] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [sheetData, setSheetData] = useState([]);

  const pickExcelFile = async () => {
    try {
      // Using a more specific mime type for Excel files might help
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: [
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/octet-stream", // Fallback for some devices
        ],
      });

      console.log("Picker Result:", result);

      // The API returns cancelled as "cancel" not "cancelled"
      if (result.canceled === true) {
        console.log("User cancelled file picking");
        Alert.alert("Cancelled", "You cancelled file picking.");
        return;
      }
      
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        Alert.alert("File picked", file.name);
        setFileUri(file.uri);
        setFileName(file.name);
        setSheetData([]);
      } else if (result.type === "success") {
        // Handle older version of DocumentPicker API
        Alert.alert("File picked", result.name);
        setFileUri(result.uri);
        setFileName(result.name);
        setSheetData([]);
      } else {
        console.log("Unknown result format:", result);
        Alert.alert("Error", "Couldn't process the selected file.");
      }
    } catch (error) {
      console.error("Error during file picking:", error);
      Alert.alert("Error", error.message);
    }
  };

  const extractData = async () => {
    if (!fileUri) {
      Alert.alert("No file selected", "Please pick a file first.");
      return;
    }

    try {
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const workbook = XLSX.read(base64, { type: "base64" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      console.log("Extracted data:", data);
      Alert.alert("Extraction Success", `Rows: ${data.length}`);
      setSheetData(data);
    } catch (err) {
      console.error("Extraction error:", err);
      Alert.alert("Error extracting file", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Excel Upload & Extract (Debug)</Text>

      <TouchableOpacity style={styles.button} onPress={pickExcelFile}>
        <Text style={styles.buttonText}>Pick Excel File</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={extractData}>
        <Text style={styles.buttonText}>Extract Data</Text>
      </TouchableOpacity>

      {fileName && <Text style={styles.fileName}>Selected: {fileName}</Text>}

      <ScrollView horizontal style={styles.scrollView}>
        <View>
          {sheetData.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((cell, j) => (
                <Text key={j} style={[styles.cell, i === 0 && styles.header]}>
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default ExcelDebugScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 40, backgroundColor: "#fff" },
  heading: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  button: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: { color: "#fff", textAlign: "center", fontSize: 16 },
  fileName: { marginTop: 10, fontStyle: "italic", textAlign: "center" },
  scrollView: { marginTop: 20 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eee" },
  cell: {
    padding: 8,
    minWidth: 100,
    borderRightWidth: 1,
    borderColor: "#eee",
    fontSize: 14,
  },
  header: {
    fontWeight: "bold",
    backgroundColor: "#f1f1f1",
  },
});
