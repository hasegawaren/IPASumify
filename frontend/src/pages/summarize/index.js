import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { FaPaperclip, FaLink, FaTimes, FaExternalLinkAlt } from "react-icons/fa"; // ✅ เพิ่ม FaExternalLinkAlt
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import styles from "@/styles/Summarize.module.css";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

export default function Summarize() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [wikiLink, setWikiLink] = useState("");
  const [pendingLink, setPendingLink] = useState(null);
  const chatContainerRef = useRef(null);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [wikiTOC, setWikiTOC] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isTOCVisible, setIsTOCVisible] = useState(false);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFileUrl(null);
    }
  }, [file]);

  useEffect(() => {
    console.log("📌 Updated TOC in UI:", wikiTOC);
  }, [wikiTOC]);

  // ✅ ดึง TOC หลังจากที่มี sessionId แล้ว
  useEffect(() => {
    if (!sessionId || !pendingLink) return; // ✅ ต้องมี sessionId และ wiki_url

    const fetchTOC = async () => {
      const formData = new FormData();
      formData.append("input_type", "wiki");
      formData.append("session_id", sessionId);
      formData.append("wiki_url", pendingLink); // ✅ ใช้ค่า wiki_url ที่ถูกต้อง

      try {
        const response = await axios.post("http://localhost:8000/api/summarize", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        console.log("📌 Fetched TOC:", response.data.toc);
        setWikiTOC(response.data.toc || []);
      } catch (error) {
        console.error("🔴 Error fetching TOC:", error);
      }
    };

    fetchTOC();
  }, [sessionId, pendingLink]);

  // ✅ ใช้ useCallback ป้องกันการสร้างฟังก์ชันใหม่ทุกครั้ง
  const handleFileChange = useCallback((event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile && uploadedFile.type === "application/pdf") {
      setFile(uploadedFile);
      setIsPdfOpen(true);
    } else {
      setFile(null);
      setIsPdfOpen(false);
    }
  }, []);

  const closePdfViewer = useCallback(() => {
    setFile(null);
    setIsPdfOpen(false);
  }, []);

  const memoizedFileUrl = useMemo(() => fileUrl, [fileUrl]);

  const handleSummarizeSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() && !file && !pendingLink) return;
    setLoading(true);

    const formData = new FormData();
    if (file) {
      formData.append("input_type", "pdf");
      formData.append("pdf_file", file);
    } else if (pendingLink) {
      formData.append("input_type", "wiki");
      formData.append("wiki_url", pendingLink);
    } else {
      formData.append("input_type", "text");
      formData.append("user_text", chatInput);
    }

    if (sessionId) formData.append("session_id", sessionId);

    try {
      const response = await axios.post("http://localhost:8000/api/summarize", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("📌 API Response:", response.data);
      const { session_id, summary, toc } = response.data;
      setSessionId(session_id);

      if (toc) {
        console.log("🟢 Setting TOC:", toc);
        setWikiTOC(toc);
      }

      setChatMessages((prev) => [...prev, { sender: "AI", text: summary || "Unable to summarize." }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, { sender: "AI", text: "An error occurred while summarizing." }]);
    } finally {
      setLoading(false);
      setPendingLink(null);
    }
  };

  const handleSubTopicClick = async (topic) => {
    console.log("🟢 Clicked topic:", topic);
    if (!sessionId) return;
  
    setSelectedTopic(topic);
    setLoading(true);
  
    const userMessage = { sender: "User", text: `ขอข้อมูลเพิ่มเติมเกี่ยวกับ "${topic}"` };
    setChatMessages((prev) => [...prev, userMessage]);
  
    try {
      const response = await axios.post("http://localhost:8000/api/chat", { 
        session_id: sessionId, 
        topic: topic, 
    }, 
        { headers: { "Content-Type": "application/json" } }
      );
  
      const { answer } = response.data;
      setChatMessages((prev) => [
        ...prev,
        { sender: "AI", text: answer || "ไม่มีข้อมูลเพิ่มเติมของหัวข้อนี้" },
      ]);
    } catch (error) {
      console.error("Error fetching topic details:", error);
      setChatMessages((prev) => [
        ...prev,
        { sender: "AI", text: "เกิดข้อผิดพลาดในการดึงข้อมูลของหัวข้อย่อย" },
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  // ✅ ฟังก์ชันสำหรับแชทถาม-ตอบต่อจากข้อมูลที่สรุป
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !sessionId) return;

    const userMessage = { sender: "User", text: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/chat",
        { session_id: sessionId, question: chatInput },
        { headers: { "Content-Type": "application/json" } }
      );

      const { answer } = response.data;
      setChatMessages((prev) => [...prev, { sender: "AI", text: answer || "Unable to respond." }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, { sender: "AI", text: "An error occurred while answering." }]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ฟังก์ชันดึงชื่อเรื่องจาก URL
  const getWikiTitle = (url) => {
    try {
      const path = new URL(url).pathname;
      const title = path.split("/wiki/")[1]?.replace(/_/g, " ");
      return title || url;
    } catch (error) {
      return url;
    }
  };

  // ✅ ฟังก์ชันส่ง Wikipedia Link เพื่อพักไว้ด้านบน
  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!wikiLink.trim()) return;

    setPendingLink(wikiLink); // เก็บลิงก์ที่รอการสรุป
    setWikiLink(""); // ล้างช่องอินพุต
    setShowLinkInput(false); // ปิด modal
    setLoading(true); // แสดงสถานะ loading

    const formData = new FormData();
    formData.append("input_type", "wiki");
    formData.append("wiki_url", wikiLink);

    try {
      const response = await axios.post("http://localhost:8000/api/summarize", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { session_id, summary } = response.data;
      setSessionId(session_id);
      setChatMessages((prev) => [...prev, { sender: "AI", text: summary || "Unable to summarize." }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, { sender: "AI", text: "An error occurred while summarizing." }]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ฟังก์ชันยกเลิกการเพิ่มลิงก์
  const handleCancelLink = () => {
    setPendingLink(null);
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);


  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.content}>
        <div className={isPdfOpen ? styles.splitLayout : styles.centerLayout}>
          {/* Sumify Chat Card */}
          <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
              <h2>Sumify Chat</h2>
            </div>

            {pendingLink && (
              <div className={styles.pendingLinkContainer}>
                <span className={styles.pendingLinkText}>
                  Wikipedia: {getWikiTitle(pendingLink)}
                  <a href={pendingLink} target="_blank" rel="noopener noreferrer" className={styles.openLinkIcon}>
                    <FaExternalLinkAlt />
                  </a>
                </span>
                <FaTimes className={styles.cancelLinkIcon} onClick={handleCancelLink} />
              </div>
            )}

            {Array.isArray(wikiTOC) && wikiTOC.length > 0 && (
              <div className={styles.tocContainer}>
                {/* ✅ ปุ่มกดพับ-ขยาย TOC */}
                <div
                  className={styles.tocHeader}
                  onClick={() => setIsTOCVisible(!isTOCVisible)}
                >
                  📖 หัวข้อย่อย:
                  {isTOCVisible ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                {/* ✅ แสดง TOC เมื่อกดเปิด */}
                {isTOCVisible && (
                  <div className={styles.tocList}>
                    {wikiTOC.map((topic, index) => (
                      <span
                        key={`topic-${index}`} // ✅ ให้ key มีความเป็นเอกลักษณ์มากขึ้น
                        className={styles.tocItem}
                        onClick={() => handleSubTopicClick(topic)}
                        title={topic} // ✅ แสดง Tooltip เมื่อ Hover
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div ref={chatContainerRef} className={styles.chatArea}>
              {loading ? (
                <div className={styles.loadingText}>
                  <p className="text-gray-500">Processing...</p>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div key={index} className={`${styles.message} ${msg.sender === "User" ? styles.messageUser : styles.messageAI}`}>
                    <div className={`${styles.messageBox} ${msg.sender === "User" ? styles.messageUserBox : styles.messageAIBox}`}>
                      {/* ✅ ถ้าเป็นลิงก์หรือชื่อไฟล์ แสดงในรูปแบบที่แตกต่าง */}
                      {msg.text.startsWith("http") ? (
                        <a href={msg.text} target="_blank" rel="noopener noreferrer" className={styles.linkText}>
                          {msg.text}
                        </a>
                      ) : msg.text.endsWith(".pdf") ? (
                        <span className={styles.fileText}>{msg.text}</span>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={sessionId ? handleChatSubmit : handleSummarizeSubmit} className={styles.chatInputForm}>
              <div className="flex items-center gap-2">
                <FaPaperclip size={30} className="cursor-pointer" style={{ color: "#FF6347" }} onClick={() => document.getElementById("fileInput").click()} />
                <FaLink size={30} className="cursor-pointer" style={{ color: "#4A90E2" }} onClick={() => setShowLinkInput(true)} />
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={sessionId ? "Ask a question about the summary..." : "Enter text, upload a PDF, or provide a Wikipedia link..."}
                  className={styles.chatInput}
                />
              </div>
              <button type="submit" className={styles.submitButton}>
                {sessionId ? "Ask" : "Summarize"}
              </button>
            </form>

            {/* File input for PDF */}
            <input type="file" id="fileInput" accept="application/pdf" onChange={handleFileChange} className={styles.fileInput} style={{ display: "none" }} />

            {/* Link input modal */}
            {showLinkInput && (
              <div className={styles.linkModal}>
                <div className={styles.linkModalContent}>
                  <h3>Enter the Wikipedia Link:</h3>
                  <input
                    type="text"
                    value={wikiLink}
                    onChange={(e) => setWikiLink(e.target.value)}
                    placeholder="Enter URL"
                    className={styles.chatInput}
                  />
                  <div>
                    <button onClick={handleLinkSubmit} className={styles.submitButton}>
                      Submit Link
                    </button>
                    <button onClick={() => setShowLinkInput(false)} className={styles.cancelButton}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PDF Viewer */}
          {memoizedFileUrl && (
            <div className={styles.pdfViewer}>
              <FaTimes className="cursor-pointer" size={20} onClick={closePdfViewer} />
              <Worker workerUrl={`https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js`}>
                <Viewer fileUrl={memoizedFileUrl} />
              </Worker>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}