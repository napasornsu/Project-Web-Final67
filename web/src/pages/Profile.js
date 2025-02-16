import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Import Firestore functions

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [editable, setEditable] = useState(false);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');

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
    <div>
      {userData && (
        <div>
          <h2>Profile</h2>
          <img src={photo} alt="Profile" />
          {editable ? (
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="text"
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
              />
              <button onClick={handleUpdateProfile}>Save</button>
            </div>
          ) : (
            <div>
              <p>Name: {userData.name}</p>
              <p>Email: {userData.email}</p>
              <button onClick={() => setEditable(true)}>Edit</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;