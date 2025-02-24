import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom'; // import useNavigate
import '../css/ClassroomManagement.css';

const ClassroomManagement = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [newClassroom, setNewClassroom] = useState({
    name: '',
    code: '',
    room: '',
    photo: '',
  });
  const [editingClassroom, setEditingClassroom] = useState(null);
  
  const navigate = useNavigate(); // ใช้ useNavigate สำหรับนำทาง

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
          classroomsData.push({ id: doc.id, info: data.info });
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
      setNewClassroom({ name: '', code: '', room: '', photo: '' });
    }
  };
  
  const handleUpdateClassroom = async (id, updatedInfo) => {
    const user = auth.currentUser;
    if (user) {
      const classroomRef = doc(db, 'classroom', id);
      try {
        await updateDoc(classroomRef, { info: updatedInfo });
        setClassrooms(classrooms.map(classroom => classroom.id === id ? { id, info: updatedInfo } : classroom));
        setEditingClassroom(null);
      } catch (error) {
        console.error("Error updating classroom: ", error);
        alert("Failed to update classroom. Please try again.");
      }
    }
  };

  const handleDeleteClassroom = async (id) => {
    const user = auth.currentUser;
    if (user) {
      const confirmation = window.confirm("Are you sure you want to delete this classroom?");
      if (confirmation) {
        const classroomRef = doc(db, 'classroom', id);
        await deleteDoc(classroomRef);
        setClassrooms(classrooms.filter(classroom => classroom.id !== id));
      }
    }
  };

  return (
    <div className="classroom-container">
      <h2>Manage Your Classrooms</h2>

      <div className="create-classroom-section">
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
      <ul className="classroom-list">
        {classrooms.map((classroom, index) => (
          <li key={index}>
            <div>
              {editingClassroom === classroom.id ? (
                <div>
                  <input
                    type="text"
                    placeholder="Classroom Name"
                    value={classroom.info.name}
                    onChange={(e) => setClassrooms(classrooms.map(c => c.id === classroom.id ? { ...c, info: { ...c.info, name: e.target.value } } : c))}
                  />
                  <input
                    type="text"
                    placeholder="Classroom Code"
                    value={classroom.info.code}
                    onChange={(e) => setClassrooms(classrooms.map(c => c.id === classroom.id ? { ...c, info: { ...c.info, code: e.target.value } } : c))}
                  />
                  <input
                    type="text"
                    placeholder="Classroom Room"
                    value={classroom.info.room}
                    onChange={(e) => setClassrooms(classrooms.map(c => c.id === classroom.id ? { ...c, info: { ...c.info, room: e.target.value } } : c))}
                  />
                  <input
                    type="text"
                    placeholder="Classroom Photo URL"
                    value={classroom.info.photo}
                    onChange={(e) => setClassrooms(classrooms.map(c => c.id === classroom.id ? { ...c, info: { ...c.info, photo: e.target.value } } : c))}
                  />
                  <button onClick={() => handleUpdateClassroom(classroom.id, classroom.info)}>Save</button>
                  <button onClick={() => setEditingClassroom(null)}>Cancel</button>
                </div>
              ) : (
                <div>
                  <img src={classroom.info.photo} alt="Classroom" />
                  <h4>{classroom.info.name || 'No name available'}</h4>
                  <p>{classroom.info.code || 'No code available'}</p>
                  <p>{classroom.info.room || 'No room available'}</p>
                  <div className="qr-code">
                    <QRCodeCanvas value={`https://yourapp.com/classroom/${classroom.id}`} />
                  </div>
                  <button onClick={() => setEditingClassroom(classroom.id)}>Edit</button>
                  <button className="delete-button" onClick={() => handleDeleteClassroom(classroom.id)}>Delete</button>
                  {/* ปุ่มแสดงตารางรายชื่อนักเรียนที่ลงทะเบียน */}
                  <button className="student-list-button" onClick={() => navigate(`/student-list/${classroom.id}`)}>Show Student List</button>
                  {/* ปุ่มเพิ่มการเช็คชื่อ */}
                  <button className="checkin-button" onClick={() => navigate(`/Checkin/${classroom.id}`)}>Add Check-in</button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* ปุ่มกลับไปหน้า Home */}
      <button className="back-home-button" onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
};

export default ClassroomManagement;