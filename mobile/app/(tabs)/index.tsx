import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../src/config/firebaseConfig';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

import { Camera, CameraType, useCameraPermissions , CameraView} from 'expo-camera';
import jsQR from "jsqr";

import * as FileSystem from "expo-file-system";
import { ImageManipulator } from "expo-image-manipulator";

interface Classroom {
  id: string;
  code: string;
  name: string;
  room: string;
  photo?: string;
}

const HomeScreen = () => {
  const { user } = useAuth();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const router = useRouter();


  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');
      setHasMediaPermission(mediaStatus.status === 'granted');
      if (user) {
        fetchUserClassrooms();
      }
    })();
  }, [user]);

  const fetchUserClassrooms = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const classroomMap = userData.classroom || {};
        const classroomPromises = Object.entries(classroomMap).map(async ([code, classId]) => {
          const classRef = doc(db, 'classroom', classId as string);
          const classSnap = await getDoc(classRef);
          if (classSnap.exists()) {
            return { id: classId as string, code, ...classSnap.data().info } as Classroom;
          }
          return null;
        });
        const classroomList = (await Promise.all(classroomPromises)).filter(Boolean) as Classroom[];
        setClassrooms(classroomList);
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      Alert.alert('Error', 'Failed to load classrooms.');
    }
  };

  const joinClassroom = async (classroomCode: string) => {
    try {
      const q = query(collection(db, 'classroom'), where('info.code', '==', classroomCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Error', 'No classroom found with this code.');
        return;
      }

      const classroomDoc = querySnapshot.docs[0];
      const classroomId = classroomDoc.id;
      const classroomData = classroomDoc.data();

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const currentClassrooms = userSnap.exists() ? userSnap.data().classroom || {} : {};

      if (currentClassrooms[classroomCode]) {
        Alert.alert('Info', 'You are already in this classroom.');
        return;
      }

      currentClassrooms[classroomCode] = classroomId;
      await setDoc(userRef, { classroom: currentClassrooms }, { merge: true });

      setClassrooms([...classrooms, { id: classroomId, code: classroomCode, ...classroomData.info } as Classroom]);
      Alert.alert('Success', `Joined classroom: ${classroomData.info.name}`);
    } catch (error) {
      console.error('Error joining classroom:', error);
      Alert.alert('Error', 'Failed to join classroom.');
    }
  };

  const decodeQRCodeFromImage = async (uri) => {
    try {
      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);
  
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
  
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        ctx.drawImage(imageBitmap, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
  
        return qrCode ? qrCode.data : null;
      } else {
        try {
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          const img = await ImageManipulator.manipulateAsync(uri, [], { base64: true });
      
          const imageData = new Uint8ClampedArray(atob(img.base64).split("").map((c) => c.charCodeAt(0)));
          
          const qrCode = jsQR(imageData, img.width, img.height);
          
          if (qrCode) {
            console.log("QR Code Data:", qrCode.data);
            return qrCode.data;
          } else {
            console.log("No QR code found");
            return null;
          }
        } catch (error) {
          console.error("Error decoding QR code:", error);
          return null;
        }
      }
    } catch (error) {
      console.error("Error decoding QR code:", error);
      return null;
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanning(false);
    console.log('Scanned QR Code:', { type, data });
    await joinClassroom(data);
  };

  const handleUploadQRCode = async () => {
    if (!hasMediaPermission) {
      Alert.alert('Error', 'Media library permission is required to upload QR codes.');
      console.log("EERRR")
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images', // Correct string literal for SDK 51
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    
    if (result.canceled) {
      return;
    }
    
    const { uri } = result.assets[0];
    
    try {
      const data = await decodeQRCodeFromImage(uri)
      console.log(data)
      const classroomCode = data;
      await joinClassroom(classroomCode);
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert('Error', 'Failed to process QR code image.');
    }
  };

  const handleClassPress = (classroomId: string) => {
    router.push(`/class/${classroomId}`);
  };

  const renderClassroomItem = ({ item }: { item: Classroom }) => (
    <TouchableOpacity style={styles.classroomItem} onPress={() => handleClassPress(item.id)}>
      <Text style={styles.classroomName}>{item.name}</Text>
      <Text style={styles.classroomCode}>{item.code}</Text>
    </TouchableOpacity>
  );

  if (!user) return <Text>Please log in to view your classrooms.</Text>;
  if (hasCameraPermission === null || hasMediaPermission === null) return <Text>Requesting permissions...</Text>;
  if (hasCameraPermission === false && hasMediaPermission === false) return <Text>No access to camera or media library. Please grant permissions.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Classrooms</Text>
      {!scanning ? (
        <View style={styles.buttonContainer}>
          {hasCameraPermission && (
            <TouchableOpacity style={styles.scanButton} onPress={() => setScanning(true)}>
              <Text style={styles.scanButtonText}>Scan QR Code</Text>
            </TouchableOpacity>
          )}
          {hasMediaPermission && (
            <TouchableOpacity style={styles.uploadButton} onPress={handleUploadQRCode}>
              <Text style={styles.uploadButtonText}>Upload QR Code</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.scannerContainer}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={handleBarCodeScanned}
            />
          <TouchableOpacity style={styles.cancelButton} onPress={() => setScanning(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      {classrooms.length > 0 ? (
        <FlatList
          data={classrooms}
          renderItem={renderClassroomItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      ) : (
        <Text style={styles.noClassrooms}>No classrooms yet. Scan QR code to join</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  scanButton: { backgroundColor: '#007BFF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 5, flex: 1, marginRight: 10, alignItems: 'center' },
  scanButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  uploadButton: { backgroundColor: '#28A745', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 5, flex: 1, alignItems: 'center' },
  uploadButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  scannerContainer: { height: 300, marginBottom: 20, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  cancelButton: { position: 'absolute', bottom: 10, left: '50%', transform: [{ translateX: -50 }], backgroundColor: '#FF4D4D', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  cancelButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  list: { flex: 1 },
  classroomItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  classroomName: { fontSize: 18, fontWeight: 'bold' },
  classroomCode: { fontSize: 14, color: '#666' },
  noClassrooms: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 20 },
});

export default HomeScreen;