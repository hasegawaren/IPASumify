import { useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import styles from "@/styles/Summarize.module.css";

export default function Summarize() {
  const [activeTab, setActiveTab] = useState("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [wikiLink, setWikiLink] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle file selection
  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setFileName(uploadedFile.name);
    }
  };

  // Clear uploaded file
  const clearFile = () => {
    setFile(null);
    setFileName("");
  };

  // Summarization request
  const handleSummarize = async () => {
    if (!text && !file && !wikiLink) {
      alert("กรุณาใส่ข้อมูลสำหรับการสรุป");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (activeTab === "text" && text) {
        response = await axios.post("http://localhost:8000/api/summarize", { text });
      } else if (activeTab === "pdf" && file) {
        const formData = new FormData();
        formData.append("file", file);
        response = await axios.post("http://localhost:8000/api/summarize-pdf", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else if (activeTab === "wiki" && wikiLink) {
        response = await axios.post("http://localhost:8000/api/summarize-wiki", { url: wikiLink });
      }
      setSummary(response?.data?.summary || "ไม่พบข้อมูลสรุป");
    } catch (error) {
      console.error("Error fetching summary:", error);
      setSummary("เกิดข้อผิดพลาดในการสรุปข้อความ");
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.mainContent}>
        <div className={styles.formContainer}>
          {/* Tab Bar */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              className={`${styles.tabButton} ${activeTab === "text" ? "active" : ""}`}
              onClick={() => setActiveTab("text")}
            >
              Text Summary
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === "pdf" ? "active" : ""}`}
              onClick={() => setActiveTab("pdf")}
            >

              PDF Summary
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === "wiki" ? "active" : ""}`}
              onClick={() => setActiveTab("wiki")}
            >

            Wikipedia Link
            </button>
          </div>

          {/* Input Area */}
          <div className="mb-6">
            {activeTab === "text" && (
              <textarea
                rows="6"
                placeholder="Enter the text you want to summarize..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={styles.textareaInput}
              />
            )}

            {activeTab === "pdf" && (
              <div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                />
                {fileName && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected files: {fileName}{" "}
                    <button
                      onClick={clearFile}
                      className="text-red-500 hover:underline ml-2"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "wiki" && (
              <input
                type="text"
                placeholder="Paste a Wikipedia link (e.g. https://en.wikipedia.org/wiki/...)"
                value={wikiLink}
                onChange={(e) => setWikiLink(e.target.value)}
                className={styles.textInput}
              />
            )}
          </div>

          {/* Summarize Button */}
          <button
            onClick={handleSummarize}
            disabled={loading}
            className={styles.summarizeButton}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin mr-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 11-16 0z"
                  />
                </svg>
                Summarizing...
              </>
            ) : (
              "Summarize"
            )}
          </button>

          {/* Summary Output */}
          <div className={styles.summaryOutput}>
            <h2>Conclusion:</h2>
            <p>{summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
