import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import '../css/StudentList.css';

const StudentList = () => {
  const { classroomId } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsRef = collection(db, `classroom/${classroomId}/students`);
        const studentsSnapshot = await getDocs(studentsRef);
        const studentsData = [];
        studentsSnapshot.forEach(doc => {
          studentsData.push({ id: doc.id, ...doc.data() });
        });
        setStudents(studentsData);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [classroomId]);

  const handleDeleteStudent = async (sid) => {
    const confirmation = window.confirm("Are you sure you want to delete this student?");
    if (confirmation) {
      try {
        const studentRef = doc(db, `classroom/${classroomId}/students`, sid);
        await deleteDoc(studentRef);
        setStudents(students.filter(student => student.id !== sid));
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Failed to delete student. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (sid, currentStatus) => {
    const newStatus = currentStatus === 0 ? 1 : 0;
    const studentRef = doc(db, `classroom/${classroomId}/students`, sid);

    try {
      await updateDoc(studentRef, { status: newStatus });
      setStudents(students.map(student => 
        student.id === sid ? { ...student, status: newStatus } : student
      ));
    } catch (error) {
      console.error('Error toggling student status:', error);
      alert('Failed to update student status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="student-list-container">
        <div className="students-list">
          <h3>Loading students...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="student-list-container">
      <div className="students-list">
        <h3>Student List</h3>
        {students.length === 0 ? (
          <div className="empty-state">
            <p>No students registered in this classroom yet.</p>
          </div>
        ) : (
          <table className="student-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id}>
                  <td>{index + 1}</td>
                  <td>{student.stdid}</td>
                  <td>{student.name}</td>
                  <td>
                    <span className={`status-badge ${student.status === 0 ? 'status-not-verified' : 'status-verified'}`}>
                      {student.status === 0 ? 'Not Verified' : 'Verified'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className={`action-button ${student.status === 0 ? 'verify-button' : 'unverify-button'}`}
                        onClick={() => handleToggleStatus(student.id, student.status)}
                      >
                        {student.status === 0 ? 'Verify' : 'Unverify'}
                      </button>
                      <button 
                        className="action-button delete-button"
                        onClick={() => handleDeleteStudent(student.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <button className="back-button" onClick={() => navigate(-1)}>
        Back
      </button>
    </div>
  );
};

export default StudentList;