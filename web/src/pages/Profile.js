import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Import Firestore functions
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import './Profile.css'; // Import the CSS file

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [editable, setEditable] = useState(false);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const fetchUserData = async () => {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const data = userDoc.data();
        setUserData(data);
        setName(data.name);
        setPhoto(data.photo);
      };
      fetchUserData();
    }
  }, []);

  const handleUpdateProfile = async () => {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name,
        photo,
      });
      setEditable(false);
      setUserData({ ...userData, name, photo });
    }
  };

  return (
    <div className="profile-container">
      {userData && (
        <div>
          <h2>Profile</h2>
          <img src={photo} alt="Profile" />
          {editable ? (
            <div className="edit-mode">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
              <input
                type="text"
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                placeholder="Enter your photo URL"
              />
              <button onClick={handleUpdateProfile}>Save</button>
            </div>
          ) : (
            <div className="view-mode">
              <p><strong>Name:</strong> {userData.name}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <button onClick={() => setEditable(true)}>Edit</button>
            </div>
          )}
          <button className="back-home-button" onClick={() => navigate('/home')}>Back to Home</button>
        </div>
      )}
    </div>
  );
};

export default Profile;
