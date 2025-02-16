import { useEffect } from 'react';
import { auth, db } from '../firebaseConfig';  // นำเข้า firebaseConfig
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from "firebase/firestore"; // Import Firestore functions
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; // Import Firebase auth functions

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

  return (
    <div>
      <button onClick={async () => {
        try {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
        } catch (error) {
          console.error("Login error: ", error);
        }
      }}>
        Login with Google
      </button>
    </div>
  );
};

export default Login;