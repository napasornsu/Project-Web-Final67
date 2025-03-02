import { db } from "./firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

const handleCreateCheckin = async (classroomId) => {
  try {
    const checkinData = {
      status: 'active',
      startTime: new Date(),
      participants: [],
    };

    const docRef = await addDoc(collection(db, `classroom/${classroomId}/checkin`), checkinData);

    console.log("Check-in created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating check-in:", error);
  }
};

export default handleCreateCheckin;
