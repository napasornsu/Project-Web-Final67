import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, setDoc, updateDoc, collection, onSnapshot, getDocs } from "firebase/firestore";
import '../css/ManagementQA.css';

const ManagementQA = () => {
  const [questionNo, setQuestionNo] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [isQuestionVisible, setIsQuestionVisible] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [checkins, setCheckins] = useState([]); // List of check-ins
  const [showQuizModal, setShowQuizModal] = useState(false); // Modal state
  const [selectedCno, setSelectedCno] = useState(null); // Selected check-in for modal
  const [quizList, setQuizList] = useState([]); // List of qno for selected cno
  const [selectedQno, setSelectedQno] = useState(null); // Selected qno in modal
  const [studentAnswers, setStudentAnswers] = useState([]); // Answers for selected qno
  const { cid, cno } = useParams();
  const navigate = useNavigate();

  // Fetch all check-ins for the classroom
  useEffect(() => {
    if (!cid) return;

    const fetchCheckins = async () => {
      const checkinRef = collection(db, `classroom/${cid}/checkin`);
      const checkinSnapshot = await getDocs(checkinRef);
      const checkinList = checkinSnapshot.docs.map(doc => doc.id).sort((a, b) => parseInt(a) - parseInt(b));
      setCheckins(checkinList);
    };

    fetchCheckins();
  }, [cid]);

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
        } else if (!isQuestionVisible) {
          setQuestionNo('');
          setQuestionText('');
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

  // Fetch quiz list (qno) for selected check-in when modal opens
  const handleViewQuizzes = async (cno) => {
    setSelectedCno(cno);
    try {
      const quizRef = collection(db, `classroom/${cid}/checkin/${cno}/answers`);
      const quizSnapshot = await getDocs(quizRef);
      const quizNos = quizSnapshot.docs.map(doc => doc.id).sort((a, b) => parseInt(a) - parseInt(b));
      setQuizList(quizNos);
      setSelectedQno(quizNos.length > 0 ? quizNos[0] : null); // Default to first qno
      setShowQuizModal(true);
    } catch (error) {
      console.error('Error fetching quiz list:', error);
      alert('Failed to fetch quiz list.');
    }
  };

  // Fetch student answers for selected qno
  useEffect(() => {
    if (!cid || !selectedCno || !selectedQno) {
      setStudentAnswers([]);
      return;
    }

    const answersRef = collection(db, `classroom/${cid}/checkin/${selectedCno}/answers/${selectedQno}/students`);
    const unsubscribe = onSnapshot(answersRef, (snapshot) => {
      const answersData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        answersData.push({
          stdid: data.stdid || doc.id, // Fallback to doc ID if stdid not present
          name: data.name || 'Unknown',
          text: data.text || 'No answer'
        });
      });
      setStudentAnswers(answersData);
    }, (error) => {
      console.error('Error fetching student answers:', error);
    });

    return () => unsubscribe();
  }, [cid, selectedCno, selectedQno]);

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

      {/* Check-in List Table */}
      <h3>รายการ Check-in</h3>
      <div className="checkin-table-container">
        
        <table className="checkin-table">
          <thead>
            <tr>
              <th>Check-in Number</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {checkins.map((checkin) => (
              <tr key={checkin}>
                <td>{checkin}</td>
                <td>
                  <button onClick={() => handleViewQuizzes(checkin)}>ดูคำตอบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quiz Modal */}
      <div className={`modal ${showQuizModal ? 'show' : ''}`}>
        <div className="modal-content">
          <h2>คำถามและคำตอบของ Check-in {selectedCno}</h2>
          <div className="modal-body">
            <div className="quiz-list">
              <h3>รายการคำถาม</h3>
              <ul>
                {quizList.map((qno) => (
                  <li
                    key={qno}
                    onClick={() => setSelectedQno(qno)}
                    className={selectedQno === qno ? 'selected' : ''}
                  >
                    ข้อที่ {qno}
                  </li>
                ))}
              </ul>
            </div>
            <div className="student-answers">
              <h3>คำตอบสำหรับข้อที่ {selectedQno}</h3>
              {selectedQno && (
                <table className="answers-table">
                  <thead>
                    <tr>
                      <th>รหัสนักเรียน</th>
                      
                      <th>คำตอบ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentAnswers.map((answer, index) => (
                      <tr key={index}>
                        <td>{answer.stdid}</td>
                        
                        <td>{answer.text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <button className="close-modal" onClick={() => setShowQuizModal(false)}>ปิด</button>
        </div>
      </div>

      {/* Back to Home button */}
      <button className="back-home-button" onClick={() => navigate('/classroom-management')}>back</button>
    </div>
  );
};

export default ManagementQA;