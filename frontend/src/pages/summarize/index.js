import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { FaPaperclip, FaLink, FaTimes, FaExternalLinkAlt } from "react-icons/fa"; // ✅ เพิ่ม FaExternalLinkAlt
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import styles from "@/styles/Summarize.module.css";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import useTranslation from "next-translate/useTranslation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

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
  const { t } = useTranslation("common");

  const [inputType, setInputType] = useState(null); // ✅ เพิ่มบรรทัดนี้

  const closePdfViewer = useCallback(() => {
    setFile(null);
    setIsPdfOpen(false);
  }, []);


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

  const handleFileChange = useCallback(async (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile && uploadedFile.type === "application/pdf") {
      setFile(uploadedFile);
      setIsPdfOpen(true);

      // ✅ สร้าง FormData เพื่อส่งไปสรุปทันที
      const formData = new FormData();
      formData.append("input_type", "pdf");
      formData.append("pdf_file", uploadedFile);
      if (sessionId) formData.append("session_id", sessionId);

      // ✅ เพิ่มข้อความในแชทว่าแนบไฟล์ PDF แล้วกำลังสรุป
      setChatMessages((prev) => [
        ...prev,
        { sender: "User", text: uploadedFile.name },
        { sender: "AI", text: "Processing..." },
      ]);
      setLoading(true);
      setInputType("pdf");

      try {
        const response = await axios.post("http://localhost:8000/api/summarize", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const { session_id, summary, toc } = response.data;
        setSessionId(session_id);
        setWikiTOC(toc || []);

        setChatMessages((prev) => [
          ...prev.slice(0, -1),
          { sender: "AI", text: summary || "ไม่สามารถสรุปเนื้อหา PDF ได้" },
        ]);
      } catch (error) {
        console.error("🔴 Error auto-summarizing PDF:", error);
        setChatMessages((prev) => [
          ...prev.slice(0, -1),
          { sender: "AI", text: "เกิดข้อผิดพลาดในการสรุป PDF" },
        ]);
      } finally {
        setLoading(false);
      }
    } else {
      setFile(null);
      setIsPdfOpen(false);
    }
  }, [sessionId]);


  const memoizedFileUrl = useMemo(() => fileUrl, [fileUrl]);

  const handleSummarizeSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() && !file && !pendingLink) return;
    setLoading(true);

    // แสดงข้อความฝั่งผู้ใช้
    const userMsg = chatInput || pendingLink || file?.name || "📎 PDF แนบ";

    setChatInput("");

    setChatMessages((prev) => [
      ...prev,
      { sender: "User", text: userMsg },
      { sender: "AI", text: "Processing..." },
    ]);

    const formData = new FormData();
    if (file) {
      formData.append("input_type", "pdf");
      formData.append("pdf_file", file);
      setInputType("pdf");
    } else if (pendingLink) {
      formData.append("input_type", "wiki");
      formData.append("wiki_url", pendingLink);
      setInputType("wiki");
    } else {
      formData.append("input_type", "text");
      formData.append("user_text", chatInput);
      setInputType("text");
    }

    if (sessionId) formData.append("session_id", sessionId);

    try {
      const response = await axios.post("http://localhost:8000/api/summarize", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("📌 API Response:", response.data);
      const { session_id, summary, toc, wiki_url } = response.data;

      setSessionId(session_id);
      setWikiLink(wiki_url);
      setWikiTOC(toc || []);
      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "AI", text: summary || "ไม่สามารถสรุปเนื้อหาได้" },
      ]);
    } catch (error) {
      console.error("🔴 Error in summarize:", error);
      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "AI", text: "เกิดข้อผิดพลาดในการสรุปเนื้อหา" },
      ]);
    } finally {
      setLoading(false);
      setPendingLink(null);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput("");

    setChatMessages((prev) => [
      ...prev,
      { sender: "User", text: userMessage },
      { sender: "AI", text: "Processing..." },
    ]);
    setLoading(true);

    try {
      if (sessionId) {
        const response = await axios.post(
          "http://localhost:8000/api/chat",
          {
            session_id: sessionId,
            question: userMessage,
            input_type: inputType, // ✅ เพิ่มตรงนี้
          },
          { headers: { "Content-Type": "application/json" } }
        );

        setChatMessages((prev) => [
          ...prev.slice(0, -1),
          { sender: "AI", text: response.data.answer || "ไม่พบคำตอบ" },
        ]);
      } else {
        const formData = new FormData();
        formData.append("input_type", "text");
        formData.append("user_text", userMessage);

        const response = await axios.post(
          "http://localhost:8000/api/summarize",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        setSessionId(response.data.session_id);
        setInputType("text"); // ✅ เพิ่มไว้ให้จำ inputType
        setChatMessages((prev) => [
          ...prev.slice(0, -1),
          { sender: "AI", text: response.data.summary || "ไม่พบคำตอบ" },
        ]);
      }
    } catch (error) {
      console.error("🔴 Error:", error);
      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "AI", text: "เกิดข้อผิดพลาดในการสรุปหรือถามต่อ" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ฟังก์ชันส่ง Wikipedia Link เพื่อพักไว้ด้านบน
  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!wikiLink.trim()) return;

    setPendingLink(wikiLink);
    setWikiLink("");
    setShowLinkInput(false);

    // 🔹 เพิ่มข้อความ "กำลังโหลด..."
    setChatMessages((prev) => [
      ...prev,
      { sender: "User", text: wikiLink },
      { sender: "AI", text: "Processing..." },
    ]);

    setLoading(true);

    const formData = new FormData();
    formData.append("input_type", "wiki");
    formData.append("wiki_url", wikiLink);

    try {
      const response = await axios.post("http://localhost:8000/api/summarize", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { session_id, summary } = response.data;
      setSessionId(session_id);

      // 🔹 แทนที่ข้อความ "กำลังโหลด..." ด้วยผลลัพธ์
      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "AI", text: summary || "ไม่สามารถสรุปเนื้อหาได้" },
      ]);
    } catch (error) {
      // 🔹 แทนที่ข้อความ "กำลังโหลด..." ด้วยข้อความ error
      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "AI", text: "เกิดข้อผิดพลาดในการสรุปจาก Wikipedia" },
      ]);
    } finally {
      setLoading(false); // ✅ ต้องปิด loading หลังทำงานเสร็จ
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

  const getWikiTitle = (url) => {
    try {
      const path = new URL(url).pathname;
      const title = path.split("/wiki/")[1]?.replace(/_/g, " ");
      return title || url;
    } catch (error) {
      return url;
    }
  };


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

            <div ref={chatContainerRef} className={styles.chatArea}>
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`${styles.message} ${msg.sender === "User" ? styles.messageUser : styles.messageAI
                    }`}
                >
                  <div
                    className={`${styles.messageBox} ${msg.sender === "User" ? styles.messageUserBox : styles.messageAIBox
                      }`}
                  >
                    {msg.text.startsWith("http") ? (
                      <a
                        href={msg.text}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.linkText}
                      >
                        {msg.text}
                      </a>
                    ) : msg.text.endsWith(".pdf") ? (
                      <span className={styles.fileText}>{msg.text}</span>
                    ) : msg.text.includes("กำลังโหลด") || msg.text.includes("Processing") ? (
                      <span className={styles.loadingBubble}>{msg.text}</span>
                    ) : (
                      <div className="markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={sessionId ? handleChatSubmit : handleSummarizeSubmit} className={styles.chatInputForm}>
              <div className="flex items-center gap-2">
                <FaPaperclip size={30} className="cursor-pointer" style={{ color: "#FF6347" }} onClick={() => document.getElementById("fileInput").click()} />
                <FaLink size={30} className="cursor-pointer" style={{ color: "#4A90E2" }} onClick={() => setShowLinkInput(true)} />
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={sessionId ? t("sumPage.chatbox2") : t("sumPage.chatbox1")}
                  className={styles.chatInput}
                />
              </div>

              <div className="flex justify-between items-center mt-2">
                <button type="submit" className={styles.submitButton}>
                  {sessionId ? t("sumPage.ask_button") : t("sumPage.sum_button")}
                </button>
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => {
                    setChatMessages([]);
                    setSessionId(null);
                    setFile(null);
                    setFileUrl(null);
                    setWikiLink("");
                    setPendingLink(null);
                    setWikiTOC([]);
                    setSelectedTopic(null);
                    setInputType(null);
                    setIsPdfOpen(false);
                    setChatInput("");
                  }}
                >
                ล้างแชท
                </button>
              </div>
            </form>


            {/* File input for PDF */}
            <input type="file" id="fileInput" accept="application/pdf" onChange={handleFileChange} className={styles.fileInput} style={{ display: "none" }} />

            {/* Link input modal */}
            {showLinkInput && (
              <div className={styles.linkModal}>
                <div className={styles.linkModalContent}>
                  <h3>{t("sumPage.dialog_title")}</h3>
                  <input
                    type="text"
                    value={wikiLink}
                    onChange={(e) => setWikiLink(e.target.value)}
                    placeholder={t("sumPage.dialog_input")}
                    className={styles.chatInput}
                  />
                  <div>
                    <button onClick={handleLinkSubmit} className={styles.submitButton}>
                      {t("sumPage.dialog_ok")}
                    </button>
                    <button onClick={() => setShowLinkInput(false)} className={styles.cancelButton}>
                      {t("sumPage.dialog_cancel")}
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