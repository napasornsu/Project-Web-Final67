import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Alert, TouchableOpacity, Modal, TextInput } from 'react-native';
import { db, auth } from '../../src/config/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinCno, setCheckinCno] = useState('');
  const [checkinCode, setCheckinCode] = useState('');
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizCno, setQuizCno] = useState('');
  const [quizQno, setQuizQno] = useState('');
  const [prevQuizQno, setPrevQuizQno] = useState<string | null>(null);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [checkedInCid, setCheckedInCid] = useState<string | null>(null);
  const [checkedInCno, setCheckedInCno] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
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

    const loadCheckinStatus = async () => {
      try {
        const cid = await AsyncStorage.getItem('checkedInCid');
        const cno = await AsyncStorage.getItem('checkedInCno');
        setCheckedInCid(cid);
        setCheckedInCno(cno);
      } catch (error) {
        console.error('Error loading check-in status:', error);
      }
    };

    fetchClassroom();
    loadCheckinStatus();
  }, [classId]);

  useEffect(() => {
    if (!classroom || !auth.currentUser || !checkedInCid || !checkedInCno || checkedInCid !== classId) return;

    const checkinRef = doc(db, `classroom/${checkedInCid}/checkin`, checkedInCno);
    const unsubscribe = onSnapshot(checkinRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const currentQno = data.question_no || '1';

        if (data.question_show === true) {
          const studentRef = doc(db, `classroom/${checkedInCid}/students`, auth.currentUser.uid);
          const studentSnap = await getDoc(studentRef);
          if (!studentSnap.exists()) return;
          const studentData = studentSnap.data();

          const answerRef = doc(db, `classroom/${checkedInCid}/checkin/${checkedInCno}/answers/${currentQno}/students`, studentData.stdid);
          const answerSnap = await getDoc(answerRef);
          const hasAnswered = answerSnap.exists() && !!answerSnap.data().text;

          if ((!hasAnswered && !justSubmitted) || (prevQuizQno !== null && currentQno !== prevQuizQno)) {
            setQuizCno(checkedInCno);
            setQuizQno(currentQno);
            setShowQuizModal(true);
          } else {
            setShowQuizModal(false);
          }

          setPrevQuizQno(currentQno);
          if (justSubmitted) setJustSubmitted(false);
        } else {
          setShowQuizModal(false);
          setPrevQuizQno(null);
          setJustSubmitted(false);
        }
      }
    }, (error) => {
      console.error('Error listening to check-in:', error);
    });

    return () => unsubscribe();
  }, [classroom, checkedInCid, checkedInCno, classId, prevQuizQno, justSubmitted]);

  const handleBackPress = () => {
    router.push('/');
  };

  const handleLeaveClassroom = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'No user logged in.');
      return;
    }

    try {
      const userClassroomRef = doc(db, `users/${auth.currentUser.uid}/classroom`, classId as string);
      const userClassroomSnap = await getDoc(userClassroomRef);

      if (!userClassroomSnap.exists()) {
        Alert.alert('Error', 'You are not enrolled in this classroom.');
        console.log('Classroom not found in user data:', classId);
        return;
      }

      await deleteDoc(userClassroomRef);
      const studentRef = doc(db, `classroom/${classId}/students`, auth.currentUser.uid);
      await deleteDoc(studentRef);

      Alert.alert('Success', `You have left ${classroom.info.name}.`);
      router.push('/');
    } catch (error) {
      console.error('Error leaving classroom:', error);
      Alert.alert('Error', 'Failed to leave classroom.');
    }
  };

  const handleCheckinPress = () => {
    setShowCheckinModal(true);
    setCheckinError(null);
  };

  const handleCheckinSubmit = async () => {
    if (!auth.currentUser) {
      setCheckinError('No user logged in.');
      return;
    }

    if (!checkinCno.trim() || !checkinCode.trim()) {
      setCheckinError('Please enter both check-in number and code.');
      return;
    }

    try {
      const checkinRef = doc(db, `classroom/${classId}/checkin`, checkinCno);
      const checkinSnap = await getDoc(checkinRef);

      if (!checkinSnap.exists()) {
        setCheckinError('Check-in session not found.');
        return;
      }

      const checkinData = checkinSnap.data();
      if (checkinData.code !== checkinCode || checkinData.status !== 1) {
        setCheckinError('Invalid check-in code or session is not active.');
        return;
      }

      const studentRef = doc(db, `classroom/${classId}/students`, auth.currentUser.uid);
      const studentSnap = await getDoc(studentRef);

      if (!studentSnap.exists()) {
        setCheckinError('Student data not found for this classroom.');
        return;
      }

      const studentData = studentSnap.data();
      const checkinStudentRef = doc(db, `classroom/${classId}/checkin/${checkinCno}/students`, auth.currentUser.uid);
      await setDoc(checkinStudentRef, {
        stdid: studentData.stdid || 'Unknown',
        name: studentData.name || 'Unknown',
        date: new Date().toISOString(),
      });

      // Update scores collection
      const scoreRef = doc(db, `classroom/${classId}/checkin/${checkinCno}/scores`, studentData.stdid);
      const checkinDate = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }); // Format: "10/02/2025 13:00"
      await setDoc(scoreRef, {
        date: checkinDate,
        name: studentData.name || 'Unknown',
        uid: auth.currentUser.uid,
        remark: studentData.remark || '', // Copy from students or default to empty
        score: 1, // Default score for attending
        status: 1, // 1: มาเรียน (attended)
      }, { merge: true }); // Use merge to avoid overwriting teacher edits

      await AsyncStorage.setItem('checkedInCno', checkinCno);
      await AsyncStorage.setItem('checkedInCid', classId as string);
      setCheckedInCid(classId as string);
      setCheckedInCno(checkinCno);

      setShowCheckinModal(false);
      setCheckinCno('');
      setCheckinCode('');
      setCheckinError(null);
      Alert.alert('Success', 'Check-in successful!');
    } catch (error) {
      console.error('Error during check-in:', error);
      setCheckinError('Failed to check in. Please try again.');
    }
  };

  const handleQuizSubmit = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'No user logged in.');
      return;
    }

    if (!quizAnswer.trim()) {
      Alert.alert('Error', 'Please enter an answer.');
      return;
    }

    try {
      const studentRef = doc(db, `classroom/${classId}/students`, auth.currentUser.uid);
      const studentSnap = await getDoc(studentRef);
      if (!studentSnap.exists()) {
        Alert.alert('Error', 'Student data not found.');
        return;
      }

      const studentData = studentSnap.data();
      const answerRef = doc(db, `classroom/${classId}/checkin/${quizCno}/answers/${quizQno}/students`, studentData.stdid);
      await setDoc(answerRef, {
        text: quizAnswer,
        time: new Date().toISOString(),
      });

      Alert.alert('Success', 'Answer submitted!');
      setShowQuizModal(false);
      setQuizAnswer('');
      setJustSubmitted(true);
    } catch (error) {
      console.error('Error submitting quiz answer:', error);
      Alert.alert('Error', 'Failed to submit answer.');
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
        <TouchableOpacity style={styles.checkinButton} onPress={handleCheckinPress}>
          <Text style={styles.buttonText}>Check-in</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveClassroom}>
          <Text style={styles.buttonText}>Leave Classroom</Text>
        </TouchableOpacity>
      </View>

      {/* Check-in Modal */}
      <Modal visible={showCheckinModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Check-in to Class</Text>
            <TextInput
              style={styles.input}
              placeholder="Check-in Number (cno)"
              value={checkinCno}
              onChangeText={setCheckinCno}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Check-in Code"
              value={checkinCode}
              onChangeText={setCheckinCode}
            />
            {checkinError && <Text style={styles.errorText}>{checkinError}</Text>}
            <TouchableOpacity style={styles.submitButton} onPress={handleCheckinSubmit}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelModalButton} onPress={() => setShowCheckinModal(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Quiz Answer Modal */}
      <Modal visible={showQuizModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Answer Quiz</Text>
            <TextInput
              style={styles.input}
              placeholder="Your Answer"
              value={quizAnswer}
              onChangeText={setQuizAnswer}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleQuizSubmit}>
              <Text style={styles.buttonText}>Submit Answer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelModalButton} onPress={() => setShowQuizModal(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    flexWrap: 'wrap',
  },
  backButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    maxWidth: 150,
    alignItems: 'center',
    marginBottom: 10,
  },
  leaveButton: {
    backgroundColor: '#FF4D4D',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    maxWidth: 150,
    alignItems: 'center',
    marginBottom: 10,
  },
  checkinButton: {
    backgroundColor: '#28A745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    maxWidth: 150,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#28A745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
  },
  cancelModalButton: {
    backgroundColor: '#FF4D4D',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
});

export default ClassScreen;