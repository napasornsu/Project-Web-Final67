import React from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebaseConfig";

const Login = ({ setUser }) => {
  const provider = new GoogleAuthProvider();

  const handleLogin = async () => {
    const result = await signInWithPopup(auth, provider);
    setUser(result.user);
  };

  return (
    <div className="login-container">
      <h1>Teacher Web App</h1>
      <button onClick={handleLogin}>Login with Google</button>
    </div>
  );
};

export default Login;
