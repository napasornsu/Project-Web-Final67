import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import '../css/CheckinScores.css';

const CheckinScores = () => {
  const { classroomId, checkinId } = useParams();
  const [scores, setScores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchScores();
  }, [classroomId, checkinId]);

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
    setScores(scores.map(score => 
      score.id === id ? { ...score, [field]: value } : score
    ));
  };

  const handleUpdateScore = async (scoreId) => {
    try {
      const scoreToUpdate = scores.find(score => score.id === scoreId);
      const scoreDocRef = doc(db, `classroom/${classroomId}/checkin/${checkinId}/scores`, scoreId);
      await updateDoc(scoreDocRef, {
        score: scoreToUpdate.score || 0,
        remark: scoreToUpdate.remark || '',
        status: scoreToUpdate.status || '0'
      });
      alert(`Score for ${scoreToUpdate.name} updated successfully!`);
      fetchScores(); // Refresh data after update
    } catch (error) {
      console.error('Error updating score:', error);
      alert('Failed to update score.');
    }
  };

  const handleUpdateAllScores = async () => {
    try {
      for (const score of scores) {
        const scoreDocRef = doc(db, `classroom/${classroomId}/checkin/${checkinId}/scores`, score.id);
        await updateDoc(scoreDocRef, {
          score: score.score || 0,
          remark: score.remark || '',
          status: score.status || '0'
        });
      }
      alert('All scores updated successfully!');
      fetchScores(); // Refresh data after update
    } catch (error) {
      console.error('Error updating all scores:', error);
      alert('Failed to update all scores.');
    }
  };

  return (
    <div className="checkin-scores-container">
      <h1>Check-in Scores</h1>
      <table className="scores-table">
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>รหัส</th>
            <th>ชื่อ</th>
            <th>หมายเหตุ</th>
            <th>วันเวลา</th>
            <th>คะแนน</th>
            <th>สถานะ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => (
            <tr key={score.id}>
              <td>{index + 1}</td>
              <td>{score.id}</td> {/* Assuming id is stdid */}
              <td>{score.name}</td>
              <td>
                <input
                  type="text"
                  value={score.remark || ''}
                  onChange={(e) => handleScoreChange(score.id, 'remark', e.target.value)}
                />
              </td>
              <td>{score.date || '-'}</td>
              <td>
                <input
                  type="number"
                  value={score.score || ''}
                  onChange={(e) => handleScoreChange(score.id, 'score', e.target.value)}
                />
              </td>
              <td>
                <select
                  value={score.status || '0'}
                  onChange={(e) => handleScoreChange(score.id, 'status', e.target.value)}
                >
                  <option value="0">ไม่มา</option>
                  <option value="1">มาเรียน</option>
                  <option value="2">มาสาย</option>
                </select>
              </td>
              <td>
                <button onClick={() => handleUpdateScore(score.id)}>Update</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="button-group">
        <button className="update-all-button" onClick={handleUpdateAllScores}>Update All</button>
        <button className="back-button" onClick={() => navigate(`/classroom-management/${classroomId}/Checkin`)}>
          Back to Check-in
        </button>
      </div>
    </div>
  );
};

export default CheckinScores;