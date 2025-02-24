import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { QRCodeCanvas } from 'qrcode.react'; // Import QRCodeCanvas
import '../css/Checkin.css';

const Checkin = () => {
  const { classroomId, cno } = useParams();
  const [checkinData, setCheckinData] = useState(null);
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState([]);
  const [status, setStatus] = useState(0);
  const [code, setCode] = useState('');
  const [classroomName, setClassroomName] = useState(''); // Add state for classroom name
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClassroomName = async () => {
      const classroomRef = doc(db, `classroom/${classroomId}`);
      const classroomDoc = await getDoc(classroomRef);
      if (classroomDoc.exists()) {
        setClassroomName(classroomDoc.data().info.name);
      }
    };

    const fetchCheckinData = async () => {
      const checkinRef = doc(db, `classroom/${classroomId}/checkin/${cno}`);
      const checkinDoc = await getDoc(checkinRef);
      if (checkinDoc.exists()) {
        const data = checkinDoc.data();
        setCheckinData(data);
        setStatus(data.status);
        setCode(data.code);
      }
    };

    const fetchStudents = async () => {
      const studentsRef = collection(db, `classroom/${classroomId}/checkin/${cno}/students`);
      const studentsSnapshot = await getDocs(studentsRef);
      const studentsData = [];
      studentsSnapshot.forEach(doc => {
        studentsData.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentsData);
    };

    const fetchScores = async () => {
      const scoresRef = collection(db, `classroom/${classroomId}/checkin/${cno}/scores`);
      const scoresSnapshot = await getDocs(scoresRef);
      const scoresData = [];
      scoresSnapshot.forEach(doc => {
        scoresData.push({ id: doc.id, ...doc.data() });
      });
      setScores(scoresData);
    };

    fetchClassroomName();
    fetchCheckinData();
    fetchStudents();
    fetchScores();
  }, [classroomId, cno]);

  const handleStartCheckin = async () => {
    const checkinRef = doc(db, `classroom/${classroomId}/checkin/${cno}`);
    await updateDoc(checkinRef, { status: 1 });
    setStatus(1);
  };

  const handleEndCheckin = async () => {
    const checkinRef = doc(db, `classroom/${classroomId}/checkin/${cno}`);
    await updateDoc(checkinRef, { status: 2 });
    setStatus(2);
  };

  const handleSaveCheckin = async () => {
    const checkinRef = doc(db, `classroom/${classroomId}/checkin/${cno}`);
    await updateDoc(checkinRef, { status: 2 });
    const studentsRef = collection(db, `classroom/${classroomId}/checkin/${cno}/students`);
    const studentsSnapshot = await getDocs(studentsRef);
    studentsSnapshot.forEach(async (doc) => {
      const studentData = doc.data();
      const scoreRef = doc(db, `classroom/${classroomId}/checkin/${cno}/scores/${studentData.stdid}`);
      await setDoc(scoreRef, {
        date: studentData.date,
        name: studentData.name,
        uid: studentData.stdid,
        remark: studentData.remark,
        score: 1,
        status: 1
      });
    });
    setStatus(2);
  };

  const handleDeleteStudent = async (sid) => {
    const studentRef = doc(db, `classroom/${classroomId}/checkin/${cno}/students/${sid}`);
    await deleteDoc(studentRef);
    setStudents(students.filter(student => student.id !== sid));
  };

  return (
    <div className="checkin-container">
      <h2>Check-in for Classroom {classroomName}</h2> {/* Display classroom name */}
      <div className="checkin-header">
        <button onClick={() => navigate('/classroom-management')}>Back</button>
        <button onClick={handleStartCheckin}>Start Check-in</button>
        <button onClick={handleEndCheckin}>End Check-in</button>
        <button onClick={handleSaveCheckin}>Save Check-in</button>
        <button onClick={() => alert(`Check-in Code: ${code}`)}>Show Check-in Code</button>
        {/* ปุ่มไปทำคำถาม */}
        <button className="back-home-button" onClick={() => navigate('/ManagementQA')}>Make Q&A</button>
        <QRCodeCanvas value={`https://yourapp.com/checkin/${classroomId}/${cno}`} />
      </div>
      
    </div>
  );
};

export default Checkin;