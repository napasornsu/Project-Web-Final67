import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
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
  
  const navigate = useNavigate();

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
      const newClassroomRef = await addDoc(collection(db, 'classroom'), {
        owner: user.uid,
        info: {
          name: newClassroom.name,
          code: newClassroom.code,
          room: newClassroom.room,
          photo: newClassroom.photo || 'https://via.placeholder.com/300x200',
        },
      });
      const cid = newClassroomRef.id;

      await setDoc(doc(db, `users/${user.uid}/classroom/${cid}`), {
        status: 1
      });

      setClassrooms([...classrooms, { id: cid, info: newClassroom }]);
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

  const handleAddQuiz = async (cid) => {
    try {
      const checkinRef = collection(db, `classroom/${cid}/checkin`);
      const checkinSnapshot = await getDocs(checkinRef);
      
      const checkinIds = checkinSnapshot.docs.map(doc => parseInt(doc.id, 10)).filter(id => !isNaN(id));
      const latestCno = checkinIds.length > 0 ? Math.max(...checkinIds).toString() : null;
      
      if (latestCno) {
        navigate(`/classroom-management/${cid}/checkin/${latestCno}/ManagementQA`);
      } else {
        alert('No check-in sessions available. Please create a check-in first.');
      }
    } catch (error) {
      console.error('Error fetching latest cno:', error);
      alert('Failed to fetch check-in sessions. Please try again.');
    }
  };

  return (
    <div className="classroom-container">
      <h2 className="page-title">Manage Your Classrooms</h2>

      <div className="create-classroom-section">
        <h3>Create New Classroom</h3>
        <div className="input-group">
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
            placeholder="Room Number"
            value={newClassroom.room}
            onChange={(e) => setNewClassroom({ ...newClassroom, room: e.target.value })}
          />
          <input
            type="text"
            placeholder="Photo URL (optional)"
            value={newClassroom.photo}
            onChange={(e) => setNewClassroom({ ...newClassroom, photo: e.target.value })}
          />
        </div>
        <button className="create-button" onClick={handleCreateClassroom}>
          Create Classroom
        </button>
      </div>

      <ul className="classroom-list">
        {classrooms.map((classroom) => (
          <li key={classroom.id} className="classroom-card">
            {editingClassroom === classroom.id ? (
              <div className="edit-form">
                <h4 className="edit-form-title">Edit Classroom</h4>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Classroom Name"
                    value={classroom.info.name}
                    onChange={(e) => setClassrooms(classrooms.map(c => 
                      c.id === classroom.id ? { ...c, info: { ...c.info, name: e.target.value } } : c
                    ))}
                  />
                  <input
                    type="text"
                    placeholder="Classroom Code"
                    value={classroom.info.code}
                    onChange={(e) => setClassrooms(classrooms.map(c => 
                      c.id === classroom.id ? { ...c, info: { ...c.info, code: e.target.value } } : c
                    ))}
                  />
                  <input
                    type="text"
                    placeholder="Room Number"
                    value={classroom.info.room}
                    onChange={(e) => setClassrooms(classrooms.map(c => 
                      c.id === classroom.id ? { ...c, info: { ...c.info, room: e.target.value } } : c
                    ))}
                  />
                  <input
                    type="text"
                    placeholder="Photo URL"
                    value={classroom.info.photo}
                    onChange={(e) => setClassrooms(classrooms.map(c => 
                      c.id === classroom.id ? { ...c, info: { ...c.info, photo: e.target.value } } : c
                    ))}
                  />
                </div>
                <div className="button-group">
                  <button 
                    className="action-button save-button"
                    onClick={() => handleUpdateClassroom(classroom.id, classroom.info)}
                  >
                    Save Changes
                  </button>
                  <button 
                    className="action-button cancel-button"
                    onClick={() => setEditingClassroom(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <img 
                  src={classroom.info.photo || 'https://via.placeholder.com/300x200'} 
                  alt={classroom.info.name}
                  className="classroom-image"
                />
                <div className="classroom-info">
                  <h4 className="classroom-name">{classroom.info.name || 'Unnamed Classroom'}</h4>
                  <div className="classroom-details">
                    <p>Code: {classroom.info.code || 'No code'}</p>
                    <p>Room: {classroom.info.room || 'No room assigned'}</p>
                  </div>
                  <div className="qr-code">
                    <QRCodeCanvas value={classroom.id} size={128} />
                  </div>
                  <div className="button-group">
                    <button 
                      className="action-button edit-button"
                      onClick={() => setEditingClassroom(classroom.id)}
                    >
                      Edit
                    </button>
                    <button 
                      className="action-button delete-button"
                      onClick={() => handleDeleteClassroom(classroom.id)}
                    >
                      Delete
                    </button>
                    <button 
                      className="action-button student-list-button"
                      onClick={() => navigate(`/student-list/${classroom.id}`)}
                    >
                      Student List
                    </button>
                    <button 
                      className="action-button checkin-button"
                      onClick={() => navigate(`/classroom-management/${classroom.id}/Checkin`)}
                    >
                      Check-in
                    </button>
                    <button 
                      className="action-button quiz-button"
                      onClick={() => handleAddQuiz(classroom.id)}
                    >
                      Quiz
                    </button>
                  </div>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <button className="back-home-button" onClick={() => navigate('/')}>
        Back to Home
      </button>
    </div>
  );
};

export default ClassroomManagement;