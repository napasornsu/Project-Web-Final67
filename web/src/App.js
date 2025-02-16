import React, { useState, useEffect } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react"; // Update this line

const App = () => {
  const [user, setUser] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const provider = new GoogleAuthProvider();

  const handleLogin = async () => {
    const result = await signInWithPopup(auth, provider);
    setUser(result.user);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  useEffect(() => {
    if (user) {
      fetchClassrooms();
    }
  }, [user]);

  const fetchClassrooms = async () => {
    const querySnapshot = await getDocs(collection(db, "classroom"));
    setClassrooms(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const handleAddClass = async () => {
    const newClass = {
      id: Date.now().toString(),
      name: "New Class",
      room: "101",
      image: "https://via.placeholder.com/150",
    };
    await setDoc(doc(db, "classroom", newClass.id), newClass);
    fetchClassrooms();
  };

  const handleUpdateClass = async (id, newName) => {
    await updateDoc(doc(db, "classroom", id), { name: newName });
    fetchClassrooms();
  };

  const handleDeleteClass = async (id) => {
    await deleteDoc(doc(db, "classroom", id));
    fetchClassrooms();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-5">
      {user ? (
        <div className="w-full max-w-3xl bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-4">
              <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full" />
              <div>
                <h1 className="text-xl font-semibold">{user.displayName}</h1>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <button className="bg-red-500 text-white px-4 py-2 rounded-lg" onClick={handleLogout}>Logout</button>
          </div>

          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg mb-4" onClick={handleAddClass}>+ เพิ่มวิชา</button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classrooms.map((cls) => (
              <div key={cls.id} className="p-4 border rounded-lg shadow-md bg-gray-50">
                <h3 className="text-lg font-semibold">{cls.name}</h3>
                <img src={cls.image} alt={cls.name} className="w-full h-32 object-cover mt-2 rounded-md" />
                <div className="flex justify-between mt-3">
                  <QRCodeCanvas value={cls.id} className="w-16 h-16" /> {/* Update this line */}
                  <div className="space-x-2">
                    <button className="bg-yellow-400 px-3 py-1 rounded-lg" onClick={() => handleUpdateClass(cls.id, prompt("New Name:"))}>แก้ไข</button>
                    <button className="bg-red-500 text-white px-3 py-1 rounded-lg" onClick={() => handleDeleteClass(cls.id)}>ลบ</button>
                  </div>
                </div>
                <button className="mt-3 w-full bg-green-500 text-white py-2 rounded-lg">เข้าสู่ห้องเรียน</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button className="bg-blue-500 text-white px-6 py-3 rounded-lg" onClick={handleLogin}>Login with Google</button>
      )}
    </div>
  );
};

export default App;