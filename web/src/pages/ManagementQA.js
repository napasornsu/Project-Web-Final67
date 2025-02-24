import React, { useState, useEffect } from 'react';
import { getDatabase, ref, set, update, push, onValue } from 'firebase/database';
import { useNavigate, useParams } from 'react-router-dom';
import './ManagementQA.css';

const ManagementQA = () => {
  const [questionNo, setQuestionNo] = useState(1);
  const [questionText, setQuestionText] = useState('');
  const [isQuestionVisible, setIsQuestionVisible] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [closedQuestions, setClosedQuestions] = useState([]);

  const { cid, cno } = useParams();
  const db = getDatabase();
  const navigate = useNavigate();

  useEffect(() => {
    if (!cid || !cno) {
      console.error("Missing cid or cno in URL params");
      return;
    }

    const answersRef = ref(db, `/classroom/${cid}/checkin/${cno}/answers/${questionNo}`);
    const handleSnapshot = (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAnswers(Object.values(data));
      }
    };

    const unsubscribe = onValue(answersRef, handleSnapshot);
    return () => unsubscribe();
  }, [cid, cno, questionNo, db]);

  useEffect(() => {
    const questionRef = ref(db, `/classroom/${cid}/checkin/${cno}`);
    if (isQuestionVisible) {
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

  const handleAnswerSubmit = (answerText) => {
    const studentId = "student1";
    const answerRef = ref(db, `/classroom/${cid}/checkin/${cno}/answers/${questionNo}/students/${studentId}`);
    set(answerRef, {
      text: answerText,
      time: new Date().toISOString()
    });
  };

  return (
    <div className="qa-container">
      <h1 className="qa-title">สร้างคำถาม</h1>
      <div className="qa-input-section">
        <input
          type="number"
          value={questionNo}
          onChange={(e) => setQuestionNo(e.target.value)}
          placeholder="หมายเลขคำถาม"
          disabled={isQuestionVisible}
          className="qa-input"
        />
        <input
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="คำถาม"
          className="qa-input"
        />
        <button onClick={() => setIsQuestionVisible(true)} className="qa-button qa-button-primary">เริ่มถาม</button>
        <button onClick={() => setIsQuestionVisible(false)} className="qa-button qa-button-secondary">ปิดคำถาม</button>
      </div>

      <div className="qa-status">
        {isQuestionVisible ? (
          <p className="qa-active">กำลังโชว์คำถาม: {questionText}</p>
        ) : (
          <p className="qa-inactive">คำถามไม่ได้แสดงอยู่ในขณะนี้</p>
        )}
      </div>

      {isQuestionVisible && (
        <div className="qa-answer-section">
          <h3 className="qa-subtitle">ตอบคำถาม</h3>
          <input
            type="text"
            placeholder="ตอบคำถาม"
            className="qa-input"
          />
          <button className="qa-button qa-button-submit">ส่งคำตอบ</button>
          <ul className="qa-answer-list">
            {answers.map((answer, index) => (
              <li key={index} className="qa-answer-item">
                <strong>{answer.text}</strong> ({answer.time})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="qa-closed-section">
        <h4 className="qa-subtitle">คำถามที่ปิดแล้ว:</h4>
        <ul className="qa-closed-list">
          {closedQuestions.map((closedQuestion, index) => (
            <li key={index} className="qa-closed-item">
              <strong>ข้อที่ {closedQuestion.questionNo}: {closedQuestion.questionText}</strong>
            </li>
          ))}
        </ul>
      </div>

      <button className="qa-button qa-button-back" onClick={() => navigate('/')}>กลับหน้าหลัก</button>
    </div>
  );
};

export default ManagementQA;
