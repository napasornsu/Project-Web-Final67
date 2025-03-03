import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, doc, getDocs, updateDoc, getDoc } from 'firebase/firestore';

const CheckinScores = () => {
  const { classroomId, checkinId } = useParams();
  const [students, setStudents] = useState([]); // New state for raw student list
  const [scores, setScores] = useState([]);    // State for UI-editable scores

  useEffect(() => {
    fetchStudentsAndScores();
  }, []);

  const fetchStudentsAndScores = async () => {
    try {
      // Fetch all students in the classroom
      const studentsCollection = collection(db, `classroom/${classroomId}/students`);
      const studentsSnapshot = await getDocs(studentsCollection);
      const allStudents = studentsSnapshot.docs.map(doc => ({
        stdid: doc.id,
        name: doc.data().name || 'Unknown',
        remark: doc.data().remark || '',
      }));
      setStudents(allStudents); // Store raw student list

      // Merge students with check-in and score data for UI
      const mergedScores = await Promise.all(
        allStudents.map(async (student) => {
          const checkinDocRef = doc(db, `classroom/${classroomId}/checkin/${checkinId}/students/${student.stdid}`);
          const checkinDocSnap = await getDoc(checkinDocRef);
          const scoreDocRef = doc(db, `classroom/${classroomId}/checkin/${checkinId}/scores/${student.stdid}`);
          const scoreDocSnap = await getDoc(scoreDocRef);
          const scoreData = scoreDocSnap.exists() ? scoreDocSnap.data() : {};

          if (checkinDocSnap.exists()) {
            return {
              ...student,
              score: scoreData.score !== undefined ? scoreData.score : 1,
              status: scoreData.status !== undefined ? scoreData.status : '1',
              remark: scoreData.remark || student.remark || '',
              date: scoreData.date || checkinDocSnap.data().date || new Date().toISOString(),
            };
          } else {
            return {
              ...student,
              score: scoreData.score !== undefined ? scoreData.score : 0,
              status: scoreData.status !== undefined ? scoreData.status : '0',
              remark: scoreData.remark || student.remark || '',
              date: scoreData.date || new Date().toISOString(),
            };
          }
        })
      );

      setScores(mergedScores); // Store UI-editable scores
    } catch (error) {
      console.error('Error fetching students and scores:', error);
    }
  };

  const handleScoreChange = (stdid, field, value) => {
    setScores(scores.map(score => (score.stdid === stdid ? { ...score, [field]: value } : score)));
  };

  // Helper function to format date as "DD/MM/YYYY HH:MM"
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const pad = (num) => String(num).padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1); // Months are 0-based
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleSaveScores = async () => {
    try {
      // Loop over students and save their scores using data from scores state
      for (const student of students) {
        const scoreData = scores.find(score => score.stdid === student.stdid) || {
          stdid: student.stdid,
          name: student.name,
          remark: student.remark || '',
          score: 0,
          status: '0',
          date: new Date().toISOString(),
        }; // Fallback if no matching score found
        const scoreDocRef = doc(db, `classroom/${classroomId}/checkin/${checkinId}/scores/${student.stdid}`);
        console.log(`Saving score for student with stdid: ${student.stdid}`);
        await updateDoc(scoreDocRef, {
          date: formatDate(scoreData.date), // Use date from UI or default
          name: scoreData.name,             // Copied from students
          uid: scoreData.stdid,             // UID matches stdid
          remark: scoreData.remark,         // From UI input, initially from students
          score: Number(scoreData.score),   // Ensure it's a number
          status: scoreData.status,         // "0", "1", or "2"
        }, { merge: true });
      }
      alert('Scores saved successfully!');
    } catch (error) {
      console.error('Error saving scores:', error);
      //alert('Failed to save scores. Please check your permissions or try again.');
    }
  };

  return (
    <div>
      <h1>Check-in Scores</h1>
      <table>
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>ชื่อ</th>
            <th>หมายเหตุ</th>
            <th>วันเวลา</th>
            <th>คะแนน</th>
            <th>สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => (
            <tr key={score.stdid}>
              <td>{index + 1}</td>
              <td>{score.name}</td>
              <td>
                <input
                  type="text"
                  value={score.remark}
                  onChange={(e) => handleScoreChange(score.stdid, 'remark', e.target.value)}
                />
              </td>
              <td>{formatDate(score.date)}</td>
              <td>
                <input
                  type="number"
                  value={score.score}
                  onChange={(e) => handleScoreChange(score.stdid, 'score', e.target.value)}
                />
              </td>
              <td>
                <select
                  value={score.status}
                  onChange={(e) => handleScoreChange(score.stdid, 'status', e.target.value)}
                >
                  <option value="0">ไม่มา</option>
                  <option value="1">มาเรียน</option>
                  <option value="2">มาสาย</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleSaveScores}>Save Scores</button>
    </div>
  );
};

export default CheckinScores;