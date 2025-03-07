import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { FaPaperclip, FaLink, FaTimes } from "react-icons/fa"; 
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import styles from "@/styles/Summarize.module.css";

export default function Summarize() {
  const [file, setFile] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [wikiLink, setWikiLink] = useState("");
  const chatContainerRef = useRef(null);
  const [isPdfOpen, setIsPdfOpen] = useState(false); // Track if PDF is open

  // Handle chat submit
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { sender: "User", text: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    
    setLoading(true);

    const formData = new FormData();

    if (file) {
      formData.append("input_type", "pdf");
      formData.append("pdf_file", file);
    } else if (wikiLink) {
      formData.append("input_type", "wiki");
      formData.append("wiki_url", wikiLink);
    } else {
      formData.append("input_type", "text");
      formData.append("user_text", chatInput);
    }

    try {
      const response = await axios.post("http://localhost:8000/api/debug-summarize", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setChatMessages((prev) => [
        ...prev,
        { sender: "AI", text: response.data.final_text || "Unable to respond." },
      ]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        { sender: "AI", text: "An error occurred while answering." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle file change
  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile && uploadedFile.type === "application/pdf") {
      setFile(uploadedFile);
      setIsPdfOpen(true);
    } else {
      setFile(null);
    }
  };

  // Close PDF viewer
  const closePdfViewer = () => {
    setFile(null);
    setIsPdfOpen(false); // Close PDF and reset state
  };

  // Handle link submission
  const handleLinkSubmit = (e) => {
    e.preventDefault();
    if (!wikiLink.trim()) return;

    const userMessage = { sender: "User", text: wikiLink };
    setChatMessages((prev) => [...prev, userMessage]);
    setWikiLink("");
    setShowLinkInput(false);  // Hide the link input after submission
  };

  useEffect(() => {
    // Simulating loading a PDF file and its summary
    setChatMessages([
      { sender: "AI", text: "This document is a report about the climate change in Thailand in 2024..." },
      { sender: "User", text: "Which region is most affected?" },
      { sender: "AI", text: "The northern region is the most affected..." },
    ]);
  }, []);

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
              {loading ? (
                <div className={styles.loadingText}>
                  <p className="text-gray-500">Summarizing...</p>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div key={index} className={`${styles.message} ${msg.sender === "User" ? styles.messageUser : styles.messageAI}`}>
                    <div className={`${styles.messageBox} ${msg.sender === "User" ? styles.messageUserBox : styles.messageAIBox}`}>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleChatSubmit} className={styles.chatInputForm}>
              <div className="flex items-center gap-2">
                <FaPaperclip size={30} className="cursor-pointer" style={{ color: '#FF6347' }}  onClick={() => document.getElementById('fileInput').click()} />
                <FaLink size={30} className="cursor-pointer"  style={{ color: '#4A90E2' }}  onClick={() => setShowLinkInput(true)} />
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question about the summary..."
                  className={styles.chatInput}
                />
              </div>
              <button type="submit" className={styles.submitButton}>
                Send
              </button>
            </form>

            {/* File input for PDF */}
            <input
              type="file"
              id="fileInput"
              accept="application/pdf"
              onChange={handleFileChange}
              className={styles.fileInput}
              style={{ display: "none" }}
            />

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
                    <button onClick={handleLinkSubmit} className={styles.submitButton}>Submit Link</button>
                    <button onClick={() => setShowLinkInput(false)} className={styles.cancelButton}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PDF Viewer (only visible if file is uploaded) */}
          {file && (
            <div className={styles.pdfViewer}>
              <FaTimes className="cursor-pointer" size={20} onClick={closePdfViewer} />
              <Worker workerUrl={`https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js`}>
                <Viewer
                  fileUrl={URL.createObjectURL(file)}
                  onLoadError={(error) => {
                    console.error("Error loading PDF:", error);
                    setPdfError(true);
                  }}
                />
              </Worker>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
