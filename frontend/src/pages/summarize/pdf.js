import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
const mockData = {
    summary: "เอกสารนี้เป็นรายงานเกี่ยวกับการเปลี่ยนแปลงสภาพภูมิอากาศในประเทศไทย ปี 2567 โดยสรุปว่า อุณหภูมิเฉลี่ยสูงขึ้น 1.5°C จาก 10 ปีที่แล้ว ปริมาณน้ำฝนลดลง 20% ในภาคเหนือ และระดับน้ำทะเลสูงขึ้น 5 ซม.  вдольชายฝั่งอันดามัน มีการแนะนำให้รัฐบาลลงทุนในพลังงานหมุนเวียนและระบบจัดการน้ำ",
    chatMessages: [
      {
        sender: "AI",
        text: "เอกสารนี้เป็นรายงานเกี่ยวกับการเปลี่ยนแปลงสภาพภูมิอากาศในประเทศไทย ปี 2567 โดยสรุปว่า อุณหภูมิเฉลี่ยสูงขึ้น 1.5°C จาก 10 ปีที่แล้ว ปริมาณน้ำฝนลดลง 20% ในภาคเหนือ และระดับน้ำทะเลสูงขึ้น 5 ซม.  вдольชายฝั่งอันดามัน มีการแนะนำให้รัฐบาลลงทุนในพลังงานหมุนเวียนและระบบจัดการน้ำ",
      },
      { sender: "User", text: "แล้วภาคไหนได้รับผลกระทบมากที่สุด?" },
      {
        sender: "AI",
        text: "จากข้อมูลในเอกสาร ภาคเหนือได้รับผลกระทบมากที่สุดในแง่ของปริมาณน้ำฝนที่ลดลง 20% ซึ่งส่งผลต่อการเกษตรและแหล่งน้ำในพื้นที่",
      },
      { sender: "User", text: "รัฐบาลมีแผนยังไงบ้าง?" },
      {
        sender: "AI",
        text: "รัฐบาลถูกแนะนำให้ลงทุนในพลังงานหมุนเวียน เช่น พลังงานแสงอาทิตย์และลม รวมถึงพัฒนาระบบจัดการน้ำ เช่น อ่างเก็บน้ำและการชลประทาน เพื่อรับมือกับการเปลี่ยนแปลงนี้",
      },
    ],
  };

export default function Pdf() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [summary, setSummary] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null); // สำหรับเลื่อนไปข้อความล่าสุด

  useEffect(() => {
    if (file) {
      summarizePdf();
    }
  }, [file]);
  useEffect(() => {
    // จำลองการโหลดไฟล์ PDF และสรุป

    setChatMessages(mockData.chatMessages);
  }, []);

  useEffect(() => {
    // เลื่อนไปข้อความล่าสุดเมื่อมีข้อความใหม่
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const summarizePdf = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post("http://localhost:8000/api/summarize-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const summaryText = response?.data?.summary || "ไม่พบข้อมูลสรุป";
      setSummary(summaryText);
      setChatMessages([{ sender: "AI", text: summaryText }]);
    } catch (error) {
      console.error("Error summarizing PDF:", error);
      const errorText = "เกิดข้อผิดพลาดในการสรุป";
      setSummary(errorText);
      setChatMessages([{ sender: "AI", text: errorText }]);
    }
    setLoading(false);
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { sender: "User", text: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");

    try {
      const response = await axios.post("http://localhost:8000/api/chat", {
        message: chatInput,
        context: summary,
      });
      setChatMessages((prev) => [
        ...prev,
        { sender: "AI", text: response?.data?.reply || "ไม่สามารถตอบได้" },
      ]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        { sender: "AI", text: "เกิดข้อผิดพลาดในการตอบคำถาม" },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <div className="flex-grow p-6 pt-[96px]">
        <div className="flex gap-6 h-[calc(100vh-128px)]">
          {/* ฝั่งซ้าย: PDF Viewer */}
          <div className="w-1/2 bg-white rounded-lg shadow-lg p-4 overflow-y-auto">
            {file ? (
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<p className="text-center text-gray-500">กำลังโหลด PDF...</p>}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    scale={1.5}
                    className="mb-4"
                  />
                ))}
              </Document>
            ) : (
              <p className="text-center text-gray-500">
                กรุณาอัปโหลด PDF จากหน้าหลักก่อน
              </p>
            )}
          </div>

          {/* ฝั่งขวา: Chat Interface */}
          <div className="w-1/2 bg-white rounded-lg shadow-lg flex flex-col">
            {/* หัวข้อแชท */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">แชทสรุป</h2>
            </div>

            {/* พื้นที่แชท */}
            <div
              ref={chatContainerRef}
              className="flex-1 p-4 overflow-y-auto bg-gray-50"
            >
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">กำลังสรุป...</p>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.sender === "User" ? "justify-end" : "justify-start"
                    } mb-3`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.sender === "User"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ช่องพิมพ์ข้อความ */}
            <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-200 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="ถามคำถามเกี่ยวกับสรุป..."
                className="flex-1 p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all"
              >
                ส่ง
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}