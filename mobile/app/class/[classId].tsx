import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { db, auth } from '../../src/config/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface Classroom {
  id: string;
  info: {
    name: string;
    code: string;
    room: string;
    photo?: string;
  };
  owner: string;
}

const ClassScreen = () => {
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { classId } = useLocalSearchParams();

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        const classRef = doc(db, 'classroom', classId as string);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          setClassroom({ id: classSnap.id, ...classSnap.data() } as Classroom);
        } else {
          Alert.alert('Error', 'Classroom not found.');
          router.back();
        }
      } catch (error) {
        console.error('Error fetching classroom:', error);
        Alert.alert('Error', 'Failed to load classroom.');
      } finally {
        setLoading(false);
      }
    };

    fetchClassroom();
  }, [classId]);

  const handleBackPress = () => {
    router.push('/');
  };

  const handleLeaveClassroom = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'No user logged in.');
      return;
    }

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        Alert.alert('Error', 'User data not found.');
        return;
      }

      const userData = userSnap.data();
      const currentClassrooms = userData.classroom || {};

      // Check if the classroom is in the user's list
      const classroomCode = classroom?.info.code;
      if (!classroomCode || !currentClassrooms[classroomCode]) {
        Alert.alert('Error', 'You are not enrolled in this classroom.');
        return;
      }

      // Remove the classroom from the user's classroom map
      delete currentClassrooms[classroomCode];
      await updateDoc(userRef, { classroom: currentClassrooms });

      Alert.alert('Success', `You have left ${classroom.info.name}.`);
      router.push('/'); // Navigate back to HomeScreen
    } catch (error) {
      console.error('Error leaving classroom:', error);
      Alert.alert('Error', 'Failed to leave classroom.');
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!classroom) {
    return <Text>Classroom not found.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{classroom.info.name}</Text>
      <Text style={styles.detail}>Code: {classroom.info.code}</Text>
      <Text style={styles.detail}>Room: {classroom.info.room}</Text>
      {classroom.info.photo && (
        <Image source={{ uri: classroom.info.photo }} style={styles.photo} />
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveClassroom}>
          <Text style={styles.buttonText}>Leave Classroom</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detail: {
    fontSize: 16,
    marginBottom: 10,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  backButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    maxWidth: 150,
    alignItems: 'center',
  },
  leaveButton: {
    backgroundColor: '#FF4D4D',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    maxWidth: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ClassScreen;