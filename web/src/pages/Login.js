import { useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig';  
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from "firebase/firestore"; 
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'; 
import './Login.css'; // Import the CSS file

// ฟังก์ชันบันทึกข้อมูลผู้ใช้
const saveUserData = async () => {
  const user = auth.currentUser;  
  if (user) {
    const userRef = doc(db, 'users', user.uid); 
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        name: user.displayName,   
        email: user.email,        
        photo: user.photoURL,     
        classroom: {},            
      });
    }
  }
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false); 
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        saveUserData();  
        navigate('/home');  
      }
    });

    return () => unsubscribe(); 
  }, [navigate]);

  const handleEmailPasswordLogin = async () => {
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
        await saveUserData(); 
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('The email address is already in use by another account.');
          break;
        case 'auth/invalid-email':
          setError('The email address is not valid.');
          break;
        case 'auth/operation-not-allowed':
          setError('Email/password accounts are not enabled.');
          break;
        case 'auth/weak-password':
          setError('The password is too weak. It must be at least 6 characters long.');
          break;
        case 'auth/user-disabled':
          setError('The user account has been disabled by an administrator.');
          break;
        case 'auth/user-not-found':
          setError('There is no user record corresponding to this identifier. The user may have been deleted.');
          break;
        case 'auth/wrong-password':
          setError('The password is invalid or the user does not have a password.');
          break;
        default:
          setError('Login/Signup failed. Please check your email and password.');
          break;
      }
      console.error("Error: ", error);
    }
  };

  return (
    <div className="login-container">
      {/* Login with Google */}
      <button className="google-login-btn" onClick={async () => {
        try {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
          await saveUserData(); 
        } catch (error) {
          console.error("Login error: ", error);
        }
      }}>
        Login with Google
      </button>

      {/* Login or Signup with Email and Password */}
      <div className="email-password-container">
        <input
          className="input-field"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input-field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="submit-btn" onClick={handleEmailPasswordLogin}>
          {isSignup ? "Sign Up" : "Login"}
        </button>
      </div>

      {/* Display error message */}
      {error && <p className="error-message">{error}</p>}

      {/* Toggle between Login and Signup */}
      <div className="toggle-link">
        <span onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
        </span>
      </div>
    </div>
  );
};

export default Login;
