import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import '../css/StudentList.css';

const StudentList = () => {
  const { classroomId, cno } = useParams();
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState([]);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
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

    fetchStudents();
    fetchScores();
  }, [classroomId, cno]);

  const handleDeleteStudent = async (sid) => {
    const studentRef = doc(db, `classroom/${classroomId}/checkin/${cno}/students/${sid}`);
    await deleteDoc(studentRef);
    setStudents(students.filter(student => student.id !== sid));
  };

  return (
    <div className="student-list-container">
      <button className="back-button" onClick={() => navigate(-1)}>Back</button> {/* Add Back button */}
      <div className="students-list">
        <h3>Students</h3>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Student ID</th>
              <th>Name</th>
              <th>Remark</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student.id}>
                <td>{index + 1}</td>
                <td>{student.stdid}</td>
                <td>{student.name}</td>
                <td>{student.remark}</td>
                <td>{student.date}</td>
                <td>
                  <button onClick={() => handleDeleteStudent(student.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="scores-list">
        <h3>Scores</h3>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Student ID</th>
              <th>Name</th>
              <th>Remark</th>
              <th>Date</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, index) => (
              <tr key={score.id}>
                <td>{index + 1}</td>
                <td>{score.stdid}</td>
                <td>{score.name}</td>
                <td>{score.remark}</td>
                <td>{score.date}</td>
                <td>{score.score}</td>
                <td>{score.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentList;