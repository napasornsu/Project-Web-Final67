import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, setDoc } from 'firebase/firestore';
import '../css/Checkin.css'; // Import CSS

const Checkin = () => {
  const { classroomId } = useParams();
  const [students, setStudents] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [checkinCount, setCheckinCount] = useState(0);
  const [checkinId, setCheckinId] = useState('');
  const [code, setCode] = useState('');
  const [checkinDetails, setCheckinDetails] = useState(null);
    const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
    fetchCheckins();
  }, []);

  const fetchStudents = async () => {
    try {
      const studentsCollection = collection(db, `classroom/${classroomId}/students`);
      const studentsSnapshot = await getDocs(studentsCollection);
      const studentsList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), attendance: 0 }));
      setStudents(studentsList);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchCheckins = async () => {
    try {
      const checkinsCollection = collection(db, `classroom/${classroomId}/checkin`);
      const checkinsSnapshot = await getDocs(checkinsCollection);
      const checkinsList = await Promise.all(checkinsSnapshot.docs.map(async (doc) => {
        const studentsCollection = collection(db, `classroom/${classroomId}/checkin/${doc.id}/students`);
        const studentsSnapshot = await getDocs(studentsCollection);
        const attendeeCount = studentsSnapshot.size;
        return { id: doc.id, attendeeCount, ...doc.data() };
      }));
      setCheckins(checkinsList);
      setCheckinCount(checkinsList.length);
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    }
  };

  const handleCreateCheckin = async () => {
    try {
      if (!code) {
        throw new Error('Please enter a check-in code.');
      }
      const newCheckinNumber = checkinCount + 1;
      const checkinRef = doc(db, `classroom/${classroomId}/checkin`, newCheckinNumber.toString());
      await setDoc(checkinRef, {
        timestamp: new Date(),
        status: 0,
        code: code,
        date: new Date().toLocaleString(),
      });
      setCheckinId(newCheckinNumber.toString());
      setCheckinDetails({ code, status: 0, date: new Date().toLocaleString() });
      console.log('Check-in created with ID:', newCheckinNumber);
  
      // Use student.id (stdid) as document ID in scores collection
      for (const student of students) {
        const scoreRef = doc(db, `classroom/${classroomId}/checkin/${newCheckinNumber}/scores`, student.stdid);
        await setDoc(scoreRef, {
          id: student.stdid, // Still store student ID as a field
          name: student.name,
          status: 0,
        });
      }
  
      fetchCheckins();
    } catch (error) {
      console.error('Error creating check-in:', error);
    }
  };

  const handleStartCheckin = async (checkinId) => {
    try {
      const checkinDocRef = doc(db, `classroom/${classroomId}/checkin/${checkinId}`);
      await updateDoc(checkinDocRef, { status: 1 });
      fetchCheckins();
    } catch (error) {
      console.error('Error starting check-in:', error);
    }
  };

  const handleCloseCheckin = async (checkinId) => {
    try {
      const checkinDocRef = doc(db, `classroom/${classroomId}/checkin/${checkinId}`);
      await updateDoc(checkinDocRef, { status: 2 });
      fetchCheckins();
    } catch (error) {
      console.error('Error closing check-in:', error);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 0: return 'ยังไม่เริ่ม';
      case 1: return 'กำลังเช็คชื่อ';
      case 2: return 'เสร็จแล้ว';
      default: return '-';
    }
  };

  return (
    <div className="checkin-container">
      <h1 className="checkin-title">Check-in Page</h1>
      <div className="checkin-input-container">
        <label>Check-in Code: </label>
        <input 
          type="text" 
          value={code} 
          onChange={(e) => setCode(e.target.value)} 
          placeholder="Enter check-in code" 
        />
      </div>
      <button className="checkin-button" onClick={handleCreateCheckin}>Create Check-in</button>

      <h2 className="checkin-title">Check-in History</h2>
      <table className="checkin-table">
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>วัน-เวลา</th>
            <th>จำนวนคนเข้าเรียน</th>
            <th>สถานะ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
        {checkins
          .sort((a, b) => Number(b.id) - Number(a.id)) // Sort by id descending
          .map((checkin) => (
            <tr key={checkin.id}>
              <td>{checkin.id}</td>
              <td>{checkin.date}</td>
              <td>{checkin.attendeeCount}</td>
              <td>{getStatusLabel(checkin.status)}</td>
              <td>
                {(checkin.status === 0 || checkin.status === 2) && (
                  <button onClick={() => handleStartCheckin(checkin.id)}>Start</button>
                )}
                {checkin.status === 1 && (
                  <button onClick={() => handleCloseCheckin(checkin.id)}>Close</button>
                )}
                <Link to={`/classroom-management/${classroomId}/checkin/${checkin.id}/students`}>
                  <button className="btn-students">View Students</button>
                </Link>
                <Link to={`/classroom-management/${classroomId}/checkin/${checkin.id}/scores`}>
                  <button className="btn-scores">View Scores</button>
                </Link>
              </td>
            </tr>
          ))}
      </tbody>
      </table>
      <button className="fetch-button" onClick={fetchCheckins}>Refresh</button>
      <button className="back-button" onClick={() => navigate('/classroom-management')}>กลับ</button>
    </div>
  );
};

export default Checkin;