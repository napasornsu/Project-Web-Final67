import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, doc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import '../css/CheckinStudentsPage.css'; // Import CSS

const CheckinStudentsPage = () => {
  const { classroomId, checkinId } = useParams();
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const studentsCollection = collection(db, `classroom/${classroomId}/checkin/${checkinId}/students`);
      const studentsSnapshot = await getDocs(studentsCollection);
      const studentsList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentsList);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      const studentDocRef = doc(db, `classroom/${classroomId}/checkin/${checkinId}/students/${studentId}`);
      await deleteDoc(studentDocRef);
      fetchStudents();
    } catch (error) {
      console.error('Error removing student:', error);
    }
  };

  return (
    <div className="checkin-students-container">
      <h1 className="checkin-students-title">Check-in Students</h1>
      <table className="checkin-students-table">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.stdid}</td>
              <td>{student.name}</td>
              <td className="checkin-students-buttons">
                <Link to={`/classroom-management/${classroomId}/students/${student.id}`}>
                </Link>
                <button className="btn-remove" onClick={() => handleRemoveStudent(student.id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Back to Home button */}
      <button className="back-home-button" onClick={() => navigate(`/classroom-management/${classroomId}/Checkin`)}>back</button>
    </div>
  );
};

export default CheckinStudentsPage;
