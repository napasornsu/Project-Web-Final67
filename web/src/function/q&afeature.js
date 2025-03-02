import { getDatabase, ref, update, set, push } from "firebase/database";

/**
 * ฟังก์ชันสร้างคำถามใน Realtime Database
 * @param {string} cid - รหัสห้องเรียน
 * @param {string} cno - รหัสการเช็คชื่อ (Check-in Number)
 * @param {number} questionNo - หมายเลขคำถาม
 * @param {string} questionText - ข้อความของคำถาม
 */
export const createQuestion = async (cid, cno, questionNo, questionText) => {
  try {
    const db = getDatabase();
    const questionRef = ref(db, `/classroom/${cid}/checkin/${cno}/question`);

    // อัปเดตคำถามใน Firebase
    await set(questionRef, {
      question_no: questionNo,
      question_text: questionText,
      question_show: true,
    });

    console.log(`✅ คำถามถูกสร้างสำเร็จ: ${questionText}`);
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการสร้างคำถาม:", error);
  }
};

/**
 * ฟังก์ชันส่งคำตอบของนักเรียน
 * @param {string} cid - รหัสห้องเรียน
 * @param {string} cno - รหัสการเช็คชื่อ (Check-in Number)
 * @param {number} questionNo - หมายเลขคำถาม
 * @param {string} uid - รหัสนักเรียนที่ตอบคำถาม
 * @param {string} answerText - คำตอบของนักเรียน
 */
export const submitAnswer = async (cid, cno, questionNo, uid, answerText) => {
  try {
    const db = getDatabase();
    const answerRef = ref(db, `/classroom/${cid}/checkin/${cno}/answers/${questionNo}/students/${uid}`);

    // บันทึกคำตอบของนักเรียน
    await set(answerRef, {
      text: answerText,
      time: new Date().toISOString(),
    });

    console.log(`✅ นักเรียน ${uid} ส่งคำตอบสำเร็จ: ${answerText}`);
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการส่งคำตอบ:", error);
  }
};

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


