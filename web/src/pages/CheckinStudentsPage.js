import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const CheckinStudentsPage = () => {
  const { classroomId, checkinId } = useParams();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchCheckinStudents();
  }, []);

  const fetchCheckinStudents = async () => {
    try {
      const studentsCollection = collection(db, `classroom/${classroomId}/checkin/${checkinId}/students`);
      const studentsSnapshot = await getDocs(studentsCollection);
      const studentsList = studentsSnapshot.docs.map(doc => doc.data());
      setStudents(studentsList);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  return (
    <div>
      <h1>Student Check-in List</h1>
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Check-in Time</th>
          </tr>
        </thead>
        <tbody>
          {students.length > 0 ? (
            students.map((student, index) => (
              <tr key={index}>
                <td>{student.stdid}</td>
                <td>{student.name}</td>
                <td>{student.date}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No students have checked in yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CheckinStudentsPage;
