import React, { useState, useEffect } from 'react';
import { getDatabase, ref, set, update, push, onValue } from 'firebase/database';
import { useNavigate, useParams } from 'react-router-dom';
import './ManagementQA.css';

const ManagementQA = () => {
  const [questionNo, setQuestionNo] = useState(1);  // เริ่มข้อที่ 1 อัตโนมัติ
  const [questionText, setQuestionText] = useState('');
  const [isQuestionVisible, setIsQuestionVisible] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [closedQuestions, setClosedQuestions] = useState([]);  // รายการคำถามที่ปิดแล้ว

  const { cid, cno } = useParams();  // ใช้ useParams เพื่อดึง cid และ cno จาก URL
  const db = getDatabase();
  const navigate = useNavigate();

  // ฟังการเปลี่ยนแปลงคำตอบจาก Firebase
  useEffect(() => {
    if (!cid || !cno) {
      console.error("Missing cid or cno in URL params");
      return;
    }

    const answersRef = ref(db, `/classroom/${cid}/checkin/${cno}/answers/${questionNo}`);
    const handleSnapshot = (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // อัปเดตคำตอบที่ดึงมาใหม่
        setAnswers(Object.values(data));
      }
    };

    // ฟังข้อมูลคำตอบจาก Firebase
    const unsubscribe = onValue(answersRef, handleSnapshot);

    // ทำการยกเลิกการฟังข้อมูลเมื่อคอมโพเนนต์ unmount
    return () => unsubscribe();
  }, [cid, cno, questionNo, db]);

  // ฟังก์ชันเพื่อเริ่มหรือปิดคำถาม
  useEffect(() => {
    const questionRef = ref(db, `/classroom/${cid}/checkin/${cno}`);
    if (isQuestionVisible) {
      // เก็บข้อมูลคำถามใน Firebase
      const newQuestionRef = push(ref(db, `/classroom/${cid}/checkin/${cno}/questions`));
      set(newQuestionRef, {
        question_no: questionNo,
        question_text: questionText,
        question_show: true
      });
    } else {
      update(questionRef, {
        question_show: false
      });
    }
  }, [isQuestionVisible, questionNo, questionText, cid, cno, db]);

  // ฟังก์ชันสำหรับการตอบคำถาม
  const handleAnswerSubmit = (answerText) => {
    const studentId = "student1"; // แทนที่ด้วย ID ของนักเรียนที่แท้จริง
    const answerRef = ref(db, `/classroom/${cid}/checkin/${cno}/answers/${questionNo}/students/${studentId}`);
    set(answerRef, {
      text: answerText,
      time: new Date().toISOString()
    });
  };

  const handleStartQuestion = () => {
    setIsQuestionVisible(true);
  };

  const handleEndQuestion = () => {
    // เมื่อปิดคำถามแล้ว ย้ายคำถามไปที่ด้านล่าง
    setClosedQuestions((prev) => [...prev, { questionNo, questionText }]);

    // ปิดคำถามและเพิ่มหมายเลขคำถามใหม่
    setIsQuestionVisible(false);
    setQuestionNo(prev => prev + 1); // เพิ่มหมายเลขคำถาม
    setQuestionText(''); // เคลียร์ข้อความคำถาม
  };

  const handleQuestionNoChange = (e) => {
    setQuestionNo(e.target.value);
  };

  const handleQuestionTextChange = (e) => {
    setQuestionText(e.target.value);
  };

  return (
    <div className="classroom-container">
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

      {/* สำหรับนักเรียน */}
      {isQuestionVisible && (
        <div>
          <h3>คำถาม: {questionText}</h3>
          <div>
            <input
              type="text"
              placeholder="ตอบคำถาม"
              value={answerText}  // ใช้ state สำหรับเก็บคำตอบที่ผู้ใช้กรอก
              onChange={(e) => setAnswerText(e.target.value)}  // อัปเดตคำตอบที่กรอก
            />
            <button onClick={() => handleAnswerSubmit(answerText)}>ส่งคำตอบ</button> {/* ปุ่มส่งคำตอบ */}
          </div>
          <ul>
            {answers.map((answer, index) => (
              <li key={index}>
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
        </div>
      )}


      {/* รายการคำถามที่ปิดแล้ว */}
      <div>
        <h4>คำถามที่ปิดแล้ว:</h4>
        <ul className="closed-questions-list">
          {closedQuestions.map((closedQuestion, index) => (
            <li key={index}>
              <strong>{`ข้อที่ ${closedQuestion.questionNo}: ${closedQuestion.questionText}`}</strong>
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
