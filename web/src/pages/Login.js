import { useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig';  // นำเข้า firebaseConfig
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from "firebase/firestore"; // Import Firestore functions
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'; // Import Firebase auth functions

// ฟังก์ชันบันทึกข้อมูลผู้ใช้
const saveUserData = async () => {
  const user = auth.currentUser;  // รับข้อมูลผู้ใช้จาก Firebase Authentication
  if (user) {
    const userRef = doc(db, 'users', user.uid); // ใช้ UID ของผู้ใช้เป็น document ID
    await setDoc(userRef, {
      name: user.displayName,   // ชื่อผู้ใช้
      email: user.email,        // อีเมลผู้ใช้
      photo: user.photoURL,     // รูปโปรไฟล์
      classroom: {},            // สามารถเพิ่มข้อมูลห้องเรียนที่ผู้ใช้เข้าร่วมในภายหลัง
    });
  }
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false); // เพิ่มสถานะการเลือกสมัครสมาชิก
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        saveUserData();  // บันทึกข้อมูลผู้ใช้เมื่อผู้ใช้ลงชื่อเข้าใช้
        navigate('/home');  // หากผู้ใช้ล็อกอินสำเร็จไปหน้า home
      }
    });

    return () => unsubscribe(); // Cleanup on component unmount
  }, [navigate]);

  const handleEmailPasswordLogin = async () => {
    try {
      if (isSignup) {
        // หากเป็นการสมัครสมาชิก
        await createUserWithEmailAndPassword(auth, email, password);
        await saveUserData(); // บันทึกข้อมูลผู้ใช้หลังจากสมัครสมาชิกสำเร็จ
      } else {
        // หากเป็นการล็อกอิน
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
    <div>
      {/* Login with Google */}
      <button onClick={async () => {
        try {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
          await saveUserData(); // บันทึกข้อมูลผู้ใช้หลังจากล็อกอินด้วย Google สำเร็จ
        } catch (error) {
          console.error("Login error: ", error);
        }
      }}>
        Login with Google
      </button>

      {/* Login or Signup with Email and Password */}
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleEmailPasswordLogin}>
          {isSignup ? "Sign Up" : "Login"}
        </button>
      </div>

      {/* Display error message */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Toggle between Login and Signup */}
      <div>
        <span onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
        </span>
      </div>
    </div>
  );
};

export default Login;