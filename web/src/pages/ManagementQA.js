import React, { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, getDoc, onSnapshot, collection, deleteDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebaseConfig'; // Import Firestore db from firebaseConfig.js
import '../css/ManagementQA.css';

const ManagementQA = () => {
  const [questionNo, setQuestionNo] = useState(1);  // เริ่มข้อที่ 1 อัตโนมัติ
  const [questionText, setQuestionText] = useState('');
  const [isQuestionVisible, setIsQuestionVisible] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [closedQuestions, setClosedQuestions] = useState([]);  // รายการคำถามที่ปิดแล้ว

  const { cid, cno } = useParams();  // ใช้ useParams เพื่อดึง cid และ cno จาก URL
  const navigate = useNavigate();

  // ฟังการเปลี่ยนแปลงคำตอบจาก Firestore
  useEffect(() => {
    if (!cid || !cno) {
      console.error("Missing cid or cno in URL params");
      return;
    }

    const answersRef = collection(db, `classroom/${cid}/checkin/${cno}/answers/${questionNo}/students`);
    const unsubscribe = onSnapshot(answersRef, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setAnswers(data);
    });

    // ทำการยกเลิกการฟังข้อมูลเมื่อคอมโพเนนต์ unmount
    return () => unsubscribe();
  }, [cid, cno, questionNo]);

  // ฟังการเปลี่ยนแปลงคำถามที่ปิดแล้วจาก Firestore
  useEffect(() => {
    if (!cid || !cno) {
      console.error("Missing cid or cno in URL params");
      return;
    }

    const closedQuestionsRef = collection(db, `classroom/${cid}/checkin/${cno}/closedQuestions`);
    const unsubscribe = onSnapshot(closedQuestionsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setClosedQuestions(data);
    });

    // ทำการยกเลิกการฟังข้อมูลเมื่อคอมโพเนนต์ unmount
    return () => unsubscribe();
  }, [cid, cno]);

  // ฟังการเปลี่ยนแปลงสถานะ question_show จาก Firestore
  useEffect(() => {
    if (!cid || !cno) {
      console.error("Missing cid or cno in URL params");
      return;
    }

    const questionShowRef = doc(db, `classroom/${cid}/checkin/${cno}`);
    const unsubscribe = onSnapshot(questionShowRef, (doc) => {
      const data = doc.data();
      setIsQuestionVisible(data?.question_show === true);
    });

    // ทำการยกเลิกการฟังข้อมูลเมื่อคอมโพเนนต์ unmount
    return () => unsubscribe();
  }, [cid, cno]);

  // ฟังก์ชันเพื่อเริ่มหรือปิดคำถาม
  const handleStartQuestion = async () => {
    const questionRef = doc(db, `classroom/${cid}/checkin/${cno}`);
    await updateDoc(questionRef, {
      question_no: questionNo,
      question_text: questionText,
      question_show: true
    });
    setIsQuestionVisible(true);
  };

  const handleEndQuestion = async () => {
    // เมื่อปิดคำถามแล้ว ย้ายคำถามไปที่ด้านล่างพร้อมกับคำตอบ
    setClosedQuestions((prev) => [...prev, { questionNo, questionText, answers }]);

    // อัปเดตข้อมูลคำถามที่ปิดใน Firestore
    const closedQuestionRef = doc(db, `classroom/${cid}/checkin/${cno}/closedQuestions/${questionNo}`);
    await setDoc(closedQuestionRef, {
      question_no: questionNo,
      question_text: questionText,
      answers: answers
    });

    // ปิดคำถามและเพิ่มหมายเลขคำถามใหม่
    const questionRef = doc(db, `classroom/${cid}/checkin/${cno}`);
    await updateDoc(questionRef, {
      question_show: false
    });

    setIsQuestionVisible(false);
    setQuestionNo(prev => prev + 1); // เพิ่มหมายเลขคำถาม
    setQuestionText(''); // เคลียร์ข้อความคำถาม
    setAnswers([]); // เคลียร์คำตอบ
  };

  const handleDeleteQuestion = async (questionNo) => {
    // ลบคำถามจาก Firestore
    const closedQuestionRef = doc(db, `classroom/${cid}/checkin/${cno}/closedQuestions/${questionNo}`);
    await deleteDoc(closedQuestionRef);

    // อัปเดตรายการคำถามที่ปิดแล้วใน state
    setClosedQuestions((prev) => prev.filter(q => q.questionNo !== questionNo));
  };

  const handleQuestionNoChange = (e) => {
    setQuestionNo(e.target.value);
  };

  const handleQuestionTextChange = (e) => {
    setQuestionText(e.target.value);
  };

  return (
    <div className="managementqa-container">
      <h1>Create Question</h1>
      <div>
        <input
          type="number"
          value={questionNo}
          onChange={handleQuestionNoChange}
          placeholder="Question No"
          disabled={isQuestionVisible}  // ไม่ให้แก้ไขหมายเลขคำถามขณะมีคำถาม
        />
        <input
          type="text"
          value={questionText}
          onChange={handleQuestionTextChange}
          placeholder="Question Text"
        />
        <button onClick={handleStartQuestion}>เริ่มถาม</button>
        <button onClick={handleEndQuestion}>ปิดคำถาม</button>
      </div>

      {/* แสดงสถานะว่าเป็นคำถามที่กำลังแสดงอยู่หรือไม่ */}
      <div>
        {isQuestionVisible ? (
          <p>กำลังโชว์คำถาม: {questionText}</p>
        ) : (
          <p>คำถามไม่ได้แสดงอยู่ในขณะนี้</p>
        )}
      </div>

      {/* รายการคำถามที่ปิดแล้ว */}
      <div>
        <h4>คำถามที่ปิดแล้ว:</h4>
        <ul className="closed-questions-list">
          {closedQuestions.map((closedQuestion, index) => (
            <li key={index}>
              <strong>{`ข้อที่ ${closedQuestion.questionNo}: ${closedQuestion.questionText}`}</strong>
              <ul>
                {closedQuestion.answers.map((answer, answerIndex) => (
                  <li key={answerIndex}>
                    <strong>{answer.text}</strong>
                    <ul>
                      {Object.keys(answer.students || {}).map((studentId) => (
                        <li key={studentId}>
                          {answer.students[studentId].text} ({answer.students[studentId].time})
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <button onClick={() => handleDeleteQuestion(closedQuestion.questionNo)}>ลบคำถาม</button>
            </li>
          ))}
        </ul>
      </div>

      {/* ปุ่มกลับไปหน้า Home */}
      <button className="back-home-button" onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
};

export default ManagementQA;