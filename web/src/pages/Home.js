import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import './Home.css'; // Import the CSS file

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
        <div>
          <h2>Welcome, {userData.name}</h2>
          <img src={userData.photo} alt="Profile" />
          <div className="button-container">
            {/* ปุ่มนำทางไปยังหน้า Profile */}
            <button onClick={() => navigate('/profile')}>Go to Profile</button>

            {/* ปุ่มนำทางไปยังหน้า Classroom Management */}
            <button onClick={() => navigate('/classroom-management')}>Manage Classrooms</button>

            {/* ปุ่ม Logout */}
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
