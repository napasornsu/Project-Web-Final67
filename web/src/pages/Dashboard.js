import React, { useEffect, useState } from 'react';
import firebase from 'firebase/app';
import 'firebase/auth';

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    firebase.auth().signOut();
  };

  if (!user) {
    return <h2>Please login</h2>;
  }

  return (
    <div>
      <h1>Welcome {user.displayName}</h1>
      <p>Email: {user.email}</p>
      <button onClick={handleLogout}>Logout</button>
      <button onClick={() => window.location.href = '/edit-profile'}>Edit Profile</button>
      <button onClick={() => window.location.href = '/add-course'}>Add Course</button>
    </div>
  );
};

export default Dashboard;
