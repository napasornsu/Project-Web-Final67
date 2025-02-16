import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

const Profile = ({ user, setUser }) => {
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <div>
      <h1>User Profile</h1>
      {user && (
        <div>
          <img src={user.photoURL} alt="Profile" width={100} />
          <h3>{user.displayName}</h3>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default Profile;
