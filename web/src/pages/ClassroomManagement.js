import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc } from "firebase/firestore"; // Import Firestore functions

const ClassroomManagement = () => {
  const [classrooms, setClassrooms] = useState([]); // State for storing classrooms
  const [newClassroom, setNewClassroom] = useState({
    name: '',
    code: '',
    room: '',
    photo: '',
  });

  useEffect(() => {
    // Fetch classrooms from Firestore when component mounts
    const fetchClassrooms = async () => {
      const user = auth.currentUser; // Get current user from Firebase Auth
      if (user) {
        const classroomRef = collection(db, 'classroom'); // Reference to 'classroom' collection
        const q = query(classroomRef, where('owner', '==', user.uid)); // Query to get classrooms where the current user is the owner
        const snapshot = await getDocs(q); // Get documents from Firestore
        const classroomsData = [];
        snapshot.forEach((doc) => {
          const data = doc.data(); // Get document data
          console.log('Fetched classroom:', data); // Log fetched data for debugging
          classroomsData.push({ id: doc.id, info: data.info }); // Store classroom data in state
        });
        setClassrooms(classroomsData); // Update classrooms state with fetched data
      }
    };
    fetchClassrooms();
  }, []); // Empty dependency array means this runs once when the component mounts

  // Handle creating a new classroom
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

      {/* Form to create a new classroom */}
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

      {/* List of classrooms */}
      <h3>Your Classrooms</h3>
      <ul>
        {classrooms.length > 0 ? (
          classrooms.map((classroom) => (
            <li key={classroom.id}>
              {classroom.info && classroom.info.name ? (
                <span>{classroom.info.name}</span> // Display the name of the classroom
              ) : (
                <span>Classroom name is not available</span>
              )}
            </li>
          ))
        ) : (
          <li>No classrooms available</li>
        )}
      </ul>
    </div>
  );
};

export default ClassroomManagement;
