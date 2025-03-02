import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, Modal, TextInput } from 'react-native';
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
  const [showStudentInput, setShowStudentInput] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [currentClassroomId, setCurrentClassroomId] = useState<string | null>(null);
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
      const userClassroomColl = collection(db, `users/${user.uid}/classroom`);
      const userClassroomSnapshot = await getDocs(userClassroomColl);
      const enrolledClassroomIds = userClassroomSnapshot.docs.map(doc => doc.id);
  
      const classroomPromises = enrolledClassroomIds.map(async (classId) => {
        const studentRef = doc(db, `classroom/${classId}/students`, user.uid);
        const studentSnap = await getDoc(studentRef);
  
        if (studentSnap.exists() && studentSnap.data().status === 1) {
          const classRef = doc(db, 'classroom', classId);
          const classSnap = await getDoc(classRef);
          if (classSnap.exists()) {
            return { id: classId, ...classSnap.data().info } as Classroom;
          }
        }
        return null;
      });
  
      const classroomList = (await Promise.all(classroomPromises)).filter(Boolean) as Classroom[];
      setClassrooms(classroomList);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      Alert.alert('Error', 'Failed to load classrooms.');
    }
  };

  const joinClassroom = async (classroomId: string, stdId: string, stdName: string) => {
    try {
      const classRef = doc(db, 'classroom', classroomId);
      const classSnap = await getDoc(classRef);

      if (!classSnap.exists()) {
        Alert.alert('Error', 'Classroom not found.');
        return;
      }

      const classroomData = classSnap.data();
      const userClassroomRef = doc(db, `users/${user.uid}/classroom`, classroomId);
      const userClassroomSnap = await getDoc(userClassroomRef);

      if (userClassroomSnap.exists()) {
        Alert.alert('Info', 'You are already in this classroom.');
        return;
      }

      // Add user to classroom with status 2 (student, pending approval)
      await setDoc(userClassroomRef, { status: 2 });

      // Add student details to classroom/students subcollection
      const studentRef = doc(db, `classroom/${classroomId}/students`, user.uid);
      await setDoc(studentRef, {
        stdid: stdId,
        name: stdName,
        status: 0,
      });

      setClassrooms([...classrooms, { id: classroomId, ...classroomData.info } as Classroom]);
      Alert.alert('Success', `Joined classroom: ${classroomData.info.name}. Awaiting approval.`);
    } catch (error) {
      console.error('Error joining classroom:', error);
      Alert.alert('Error', 'Failed to join classroom.');
    }
  };

  const decodeQRCodeFromImage = async (uri: string) => {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        ctx?.drawImage(imageBitmap, 0, 0);
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData?.data, imageData?.width, imageData?.height);
        return qrCode ? qrCode.data : null;
      } else {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const img = await ImageManipulator.manipulateAsync(uri, [], { base64: true });
        const imageData = new Uint8ClampedArray(
          atob(img.base64!).split('').map((c) => c.charCodeAt(0))
        );
        const qrCode = jsQR(imageData, img.width, img.height);
        return qrCode ? qrCode.data : null;
      }
    } catch (error) {
      console.error('Error decoding QR code:', error);
      return null;
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanning(false);
    console.log('Scanned QR Code:', { type, data });
    setCurrentClassroomId(data);
    setShowStudentInput(true);
  };

  const handleUploadQRCode = async () => {
    if (!hasMediaPermission) {
      Alert.alert('Error', 'Media library permission is required to upload QR codes.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

    const { uri } = result.assets[0];
    const data = await decodeQRCodeFromImage(uri);
    if (data) {
      console.log('Decoded QR Code from Upload:', data);
      setCurrentClassroomId(data);
      setShowStudentInput(true);
    } else {
      Alert.alert('Error', 'No QR code found in the image.');
    }
  };

  const handleSubmitStudentInfo = async () => {
    if (!studentId.trim() || !studentName.trim()) {
      Alert.alert('Error', 'Please enter both student ID and name.');
      return;
    }
    if (currentClassroomId) {
      await joinClassroom(currentClassroomId, studentId, studentName);
      setShowStudentInput(false);
      setStudentId('');
      setStudentName('');
      setCurrentClassroomId(null);
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

      {/* Student Input Modal */}
      <Modal visible={showStudentInput} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Your Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Student ID"
              value={studentId}
              onChangeText={setStudentId}
            />
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={studentName}
              onChangeText={setStudentName}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitStudentInfo}>
              <Text style={styles.buttonText}>Join Classroom</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setShowStudentInput(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
  submitButton: { backgroundColor: '#28A745', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 5, marginBottom: 10 },
  cancelModalButton: { backgroundColor: '#FF4D4D', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default HomeScreen;