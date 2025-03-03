import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, setDoc, updateDoc, collection, onSnapshot } from "firebase/firestore";
import '../css/ManagementQA.css';

const ManagementQA = () => {
  const [questionNo, setQuestionNo] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [isQuestionVisible, setIsQuestionVisible] = useState(false);
  const [answers, setAnswers] = useState([]);
  const { cid, cno } = useParams();
  const navigate = useNavigate();

  // Real-time listener for check-in document (question data)
  useEffect(() => {
    if (!cid || !cno) return;

    const checkinRef = doc(db, `classroom/${cid}/checkin/${cno}`);
    const unsubscribe = onSnapshot(checkinRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setIsQuestionVisible(data.question_show === true);
        if (data.question_show) {
          setQuestionNo(data.question_no || '');
          setQuestionText(data.question_text || '');
        } else {
          if (!isQuestionVisible) {
            setQuestionNo('');
            setQuestionText('');
          }
        }
      } else {
        setIsQuestionVisible(false);
        setQuestionNo('');
        setQuestionText('');
      }
    }, (error) => {
      console.error('Error fetching check-in data:', error);
    });

    return () => unsubscribe();
  }, [cid, cno]);

  // Real-time listener for answers based on question_no
  useEffect(() => {
    if (!cid || !cno || !questionNo || !isQuestionVisible) {
      setAnswers([]);
      return;
    }

    const answersRef = collection(db, `classroom/${cid}/checkin/${cno}/answers/${questionNo}/students`);
    const unsubscribe = onSnapshot(answersRef, (snapshot) => {
      const answersData = [];
      snapshot.forEach((doc) => {
        answersData.push({ id: doc.id, ...doc.data() });
      });
      setAnswers(answersData);
    }, (error) => {
      console.error('Error fetching answers:', error);
    });

    return () => unsubscribe();
  }, [cid, cno, questionNo, isQuestionVisible]);

  // Handle starting a question
  const handleStartQuestion = async () => {
    if (!questionNo.trim() || !questionText.trim()) {
      alert('กรุณากรอกข้อที่และข้อความคำถาม');
      return;
    }

    try {
      const checkinRef = doc(db, `classroom/${cid}/checkin/${cno}`);
      await setDoc(checkinRef, {
        question_no: questionNo,
        question_text: questionText,
        question_show: true,
      }, { merge: true });

      const answerRef = doc(db, `classroom/${cid}/checkin/${cno}/answers`, questionNo);
      await setDoc(answerRef, {
        text: questionText,
      }, { merge: true });

      setIsQuestionVisible(true);
    } catch (error) {
      console.error('Error starting question:', error);
      alert('เกิดข้อผิดพลาดในการเริ่มคำถาม');
    }
  };

  // Handle closing a question
  const handleEndQuestion = async () => {
    try {
      const checkinRef = doc(db, `classroom/${cid}/checkin/${cno}`);
      await updateDoc(checkinRef, {
        question_show: false,
      });
      setIsQuestionVisible(false);
      setQuestionNo('');
      setQuestionText('');
    } catch (error) {
      console.error('Error closing question:', error);
      alert('เกิดข้อผิดพลาดในการปิดคำถาม');
    }
  };

  const handleQuestionNoChange = (e) => {
    if (!isQuestionVisible) {
      setQuestionNo(e.target.value);
    }
  };

  const handleQuestionTextChange = (e) => {
    if (!isQuestionVisible) {
      setQuestionText(e.target.value);
    }
  };

  return (
    <div className="managementqa-container">
      <h1>ตั้งคำถาม</h1>
      <h2>ของ Check-in ที่ {cno}</h2>
      <div className="question-input-container">
        <input
          type="number"
          placeholder="ข้อที่"
          value={questionNo}
          onChange={handleQuestionNoChange}
          disabled={isQuestionVisible}
        />
        <input
          type="text"
          placeholder="ข้อความคำถาม"
          value={questionText}
          onChange={handleQuestionTextChange}
          disabled={isQuestionVisible}
        />
        <button onClick={handleStartQuestion} disabled={isQuestionVisible}>เริ่มถาม</button>
        <button onClick={handleEndQuestion}>ปิดคำถาม</button>
      </div>

      {/* Display current question status */}
      <div>
        {isQuestionVisible ? (
          <p>กำลังแสดงคำถาม: ข้อที่ {questionNo} - {questionText}</p>
        ) : (
          <p>ไม่มีคำถามที่แสดงอยู่ในขณะนี้</p>
        )}
      </div>

      {/* Real-time answers display */}
      {isQuestionVisible && (
        <div>
          <h3>คำตอบสำหรับข้อที่ {questionNo}</h3>
          <ul>
            {answers.map((answer, index) => (
              <li key={index}>
                {answer.text} (โดย: {answer.id})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Back to Home button */}
      <button className="back-home-button" onClick={() => navigate('/')}>กลับสู่หน้าแรก</button>
    </div>
  );
};

export default ManagementQA;