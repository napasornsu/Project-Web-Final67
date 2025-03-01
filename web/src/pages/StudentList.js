import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import '../css/StudentList.css';

const StudentList = () => {
  const { classroomId } = useParams();
  const [students, setStudents] = useState([]);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchStudents = async () => {
      const studentsRef = collection(db, `classroom/${classroomId}/students`);
      const studentsSnapshot = await getDocs(studentsRef);
      const studentsData = [];
      studentsSnapshot.forEach(doc => {
        studentsData.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentsData);
    };

    fetchStudents();
  }, [classroomId]);

  const handleDeleteStudent = async (sid) => {
    const studentRef = doc(db, `classroom/${classroomId}/students/${sid}`);
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
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student.id}>
                <td>{index + 1}</td>
                <td>{student.stdid}</td>
                <td>{student.name}</td>
                <td>{student.status === 0 ? 'Not Verified' : 'Verified'}</td>
                <td>
                  <button onClick={() => handleDeleteStudent(student.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentList;