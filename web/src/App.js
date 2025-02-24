import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import ClassroomManagement from "./pages/ClassroomManagement";
import ManagementQA from "./pages/ManagementQA";
import Checkin from "./pages/Checkin"; // Import Checkin component
import StudentList from "./pages/StudentList"; // Import StudentList component
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe(); // Cleanup on component unmount
  }, []);

  return (
    <div className="App">
      <Routes>
        {/* Route for root path */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Route for Login page */}
        <Route path="/login" element={<Login setUser={setUser} />} />

        {/* Protected Route for Home page */}
        <Route
          path="/home"
          element={user ? <Home user={user} /> : <Navigate to="/login" />}
        />

        {/* Protected Route for Profile page */}
        <Route
          path="/profile"
          element={user ? <Profile user={user} /> : <Navigate to="/login" />}
        />

        {/* Protected Route for Classroom Management */}
        <Route
          path="/classroom-management"
          element={
            user ? <ClassroomManagement /> : <Navigate to="/login" />
          }
        />
        {/* Protected Route for Management Q&A*/}
        <Route
          path="/ManagementQA"
          element={user ? <ManagementQA /> : <Navigate to="/login" />
          }
        />
        {/* Route for Checkin page */}
        <Route
          path="/checkin/:classroomId"
          element={user ? <Checkin /> : <Navigate to="/login" />}
        />

        {/* Route for Student List page */}
        <Route
          path="/student-list/:classroomId"
          element={user ? <StudentList /> : <Navigate to="/login" />}
        />
      </Routes>
    </div>
  );
};

export default App;