import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import ClassroomManagement from "./pages/ClassroomManagement";
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
    <Router basename="/Project-Web-Final67">
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
        </Routes>
      </div>
    </Router>
  );
};

export default App;