import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc } from "firebase/firestore"; // Import Firestore functions

const ClassroomManagement = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [newClassroom, setNewClassroom] = useState({
    name: '',
    code: '',
    room: '',
    photo: '',
  });

  useEffect(() => {
    const fetchClassrooms = async () => {
      const user = auth.currentUser;
      if (user) {
        const classroomRef = collection(db, 'classroom');
        const q = query(classroomRef, where('owner', '==', user.uid));
        const snapshot = await getDocs(q);
        const classroomsData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Fetched classroom:', data); // Log fetched data
          classroomsData.push({ id: doc.id, info: data });
        });
        setClassrooms(classroomsData);
      }
    };
    fetchClassrooms();
  }, []);

  const handleCreateClassroom = async () => {
    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(db, 'classroom'), {
        owner: user.uid,
        info: {
          name: newClassroom.name,
          code: newClassroom.code,
          room: newClassroom.room,
          photo: newClassroom.photo,
        },
      });
      setClassrooms([...classrooms, { id: Date.now().toString(), info: newClassroom }]);
    }
  };

  return (
    <div>
      <h2>Manage Your Classrooms</h2>
      <div>
        <h3>Create New Classroom</h3>
        <input
          type="text"
          placeholder="Classroom Name"
          value={newClassroom.name}
          onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Classroom Code"
          value={newClassroom.code}
          onChange={(e) => setNewClassroom({ ...newClassroom, code: e.target.value })}
        />
        <input
          type="text"
          placeholder="Classroom Room"
          value={newClassroom.room}
          onChange={(e) => setNewClassroom({ ...newClassroom, room: e.target.value })}
        />
        <input
          type="text"
          placeholder="Classroom Photo URL"
          value={newClassroom.photo}
          onChange={(e) => setNewClassroom({ ...newClassroom, photo: e.target.value })}
        />
        <button onClick={handleCreateClassroom}>Create Classroom</button>
      </div>

      <h3>Your Classrooms</h3>
      <ul>
        {classrooms.map((classroom, index) => (
          <li key={index}>
            {classroom.info ? (
              <span>{classroom.info.name || 'No name available'}</span>
            ) : (
              <span>No info available</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClassroomManagement;