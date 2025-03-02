import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';

const CheckinScores = () => {
  const { classroomId, checkinId } = useParams();
  const [scores, setScores] = useState([]);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      const scoresCollection = collection(db, `classroom/${classroomId}/checkin/${checkinId}/scores`);
      const scoresSnapshot = await getDocs(scoresCollection);
      const scoresList = scoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setScores(scoresList);
    } catch (error) {
      console.error('Error fetching scores:', error);
    }
  };

  const handleScoreChange = (id, field, value) => {
    setScores(scores.map(score => score.id === id ? { ...score, [field]: value } : score));
  };

  const handleSaveScores = async () => {
    try {
      for (const score of scores) {
        const scoreDocRef = doc(db, `classroom/${classroomId}/checkin/${checkinId}/scores/${score.id}`);
        await updateDoc(scoreDocRef, {
          score: score.score,
          remark: score.remark,
          status: score.status
        });
      }
      alert('Scores saved successfully!');
    } catch (error) {
      console.error('Error saving scores:', error);
    }
  };

  return (
    <div>
      <h1>Check-in Scores</h1>
      <table>
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>รหัส</th>
            <th>ชื่อ</th>
            <th>หมายเหตุ</th>
            <th>วันเวลา</th>
            <th>คะแนน</th>
            <th>สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => (
            <tr key={score.id}>
              <td>{index + 1}</td>
              <td>{score.uid}</td>
              <td>{score.name}</td>
              <td>
                <input
                  type="text"
                  value={score.remark}
                  onChange={(e) => handleScoreChange(score.id, 'remark', e.target.value)}
                />
              </td>
              <td>{score.date}</td>
              <td>
                <input
                  type="number"
                  value={score.score}
                  onChange={(e) => handleScoreChange(score.id, 'score', e.target.value)}
                />
              </td>
              <td>
                <select
                  value={score.status}
                  onChange={(e) => handleScoreChange(score.id, 'status', e.target.value)}
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