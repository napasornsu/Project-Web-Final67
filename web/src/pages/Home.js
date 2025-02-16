import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from "firebase/firestore"; // Import Firestore functions

const Home = () => {
  const [userData, setUserData] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const fetchUserData = async () => {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        setUserData(userDoc.data());

        // const classroomData = [];
        // const classroomSnapshot = await getDocs(collection(db, 'classroom'));
        // classroomSnapshot.forEach((doc) => {
        //   classroomData.push({ cid: doc.id, info: doc.data() });
        // });
        // setClassrooms(classroomData);
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
    <div>
      {userData && (
        <div>
          <h2>Welcome, {userData.name}</h2>
          <img src={userData.photo} alt="Profile" />
          {/* <h3>Your Classrooms</h3>
          <ul>
            {classrooms.map((classroom) => (
              <li key={classroom.cid}>
                {classroom.info?.name} - {classroom.info?.code}
              </li>
            ))}
          </ul> */}

          {/* ปุ่มนำทางไปยังหน้า Profile */}
          <button onClick={() => navigate('/profile')}>Go to Profile</button>

          {/* ปุ่มนำทางไปยังหน้า Classroom Management */}
          <button onClick={() => navigate('/classroom-management')}>Manage Classrooms</button>

          {/* ปุ่ม Logout */}
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default Home;