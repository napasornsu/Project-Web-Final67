import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import '../css/Home.css'; // Import the CSS file

const Home = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const fetchUserData = async () => {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        setUserData(userDoc.data());
      };
      fetchUserData();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // ฟังก์ชัน Logout
  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase sign out
      navigate('/login'); // ไปยังหน้า Login หลังออกจากระบบ
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="home-container">
      {userData && (
        <div className="home-card">
          <img 
            src={userData.photo} 
            alt="Profile" 
            className="profile-image"
          />
          <h2 className="welcome-text">Welcome, {userData.name}</h2>
          <div className="button-container">
            <button 
              className="home-button profile-button"
              onClick={() => navigate('/profile')}
            >
              My Profile
            </button>
            <button 
              className="home-button classroom-button"
              onClick={() => navigate('/classroom-management')}
            >
              Manage Classrooms
            </button>
            <button 
              className="home-button logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
