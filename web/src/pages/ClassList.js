import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";

const ClassList = () => {
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    fetchClassrooms();
  }, []);

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
    <div>
      <h1>Class List</h1>
      <button onClick={handleAddClass}>Add Class</button>
      <div>
        {classrooms.map((cls) => (
          <div key={cls.id}>
            <h3>{cls.name}</h3>
            <img src={cls.image} alt={cls.name} width={100} />
            <QRCodeCanvas value={cls.id} />
            <button onClick={() => handleUpdateClass(cls.id, prompt("New Name:"))}>Edit</button>
            <button onClick={() => handleDeleteClass(cls.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassList;
