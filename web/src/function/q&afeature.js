import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom'; // import useNavigate

/**
 * ฟังก์ชันสร้างคำถามในระบบเช็คชื่อ
 * @param {string} cid - รหัสห้องเรียน
 * @param {string} cno - รหัสการเช็คชื่อ (Check-in Number)
 * @param {string} questionNo - หมายเลขคำถาม
 * @param {string} questionText - ข้อความของคำถาม
 */
export const createQuestion = async (cid, cno, questionNo, questionText) => {
  try {
    // อ้างอิงไปที่เอกสารของการเช็คชื่อใน Firebase
    const questionRef = db
      .collection("classroom")
      .doc(cid)
      .collection("checkin")
      .doc(cno);

    // อัปเดตข้อมูลของคำถามในเอกสารนั้น
    await questionRef.update({
      question_no: questionNo,
      question_text: questionText,
      question_show: true, // กำหนดให้แสดงคำถาม
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
 * @param {string} questionNo - หมายเลขคำถาม
 * @param {string} uid - รหัสนักเรียนที่ตอบคำถาม
 * @param {string} answerText - คำตอบของนักเรียน
 */
export const submitAnswer = async (cid, cno, questionNo, uid, answerText) => {
  try {
    // อ้างอิงไปที่เอกสารคำตอบของคำถามนั้นใน Firebase
    const answerRef = db
      .collection("classroom")
      .doc(cid)
      .collection("checkin")
      .doc(cno)
      .collection("answers")
      .doc(questionNo);

    // อัปเดตหรือสร้างข้อมูลคำตอบของนักเรียน
    await answerRef.set(
      {
        [`students.${uid}.text`]: answerText,
        [`students.${uid}.time`]: new Date().toISOString(), // เวลาที่ส่งคำตอบ
      },
      { merge: true } // ใช้ merge เพื่อไม่ให้ข้อมูลเก่าหายไป
    );

    console.log(`✅ นักเรียน ${uid} ส่งคำตอบสำเร็จ: ${answerText}`);
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการส่งคำตอบ:", error);
  }
  {/* สำหรับนักเรียน */}
        {/* {isQuestionVisible && (
        <div>
          <h3>คำถาม: {questionText}</h3>
          <div>
            <input
              type="text"
              placeholder="ตอบคำถาม"
              onBlur={(e) => handleAnswerSubmit(e.target.value)}
            />
          </div>
          <ul>
            {answers.map((answer, index) => (
              <li key={index}>
                <strong>{answer.text}</strong>
                <ul>
                  {Object.keys(answer.students || {}).map((studentId) => (
                    <li key={studentId}>
                      {answer.students[studentId].text} (
                      {answer.students[studentId].time})
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )} */}
};
