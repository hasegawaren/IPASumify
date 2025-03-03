import { useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";

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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">Sumify</h1>
          <p className="text-center text-gray-600 mb-6">เครื่องมือสรุปเนื้อหาด้วย AI</p>

          {/* Tab Bar */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === "text"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab("text")}
            >
              ใส่ข้อความ
            </button>
            <button
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === "pdf"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab("pdf")}
            >
              อัปโหลด PDF
            </button>
            <button
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === "wiki"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab("wiki")}
            >
              ลิงก์ Wikipedia
            </button>
          </div>

          {/* Input Area */}
          <div className="mb-6">
            {activeTab === "text" && (
              <textarea
                rows="6"
                placeholder="พิมพ์ข้อความที่ต้องการสรุป..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {activeTab === "pdf" && (
              <div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full p-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                {fileName && (
                  <div className="mt-2 text-sm text-gray-600">
                    ไฟล์ที่เลือก: {fileName}{" "}
                    <button
                      onClick={clearFile}
                      className="text-red-500 hover:underline ml-2"
                    >
                      ลบ
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "wiki" && (
              <input
                type="text"
                placeholder="วางลิงก์ Wikipedia (เช่น https://en.wikipedia.org/wiki/...)"
                value={wikiLink}
                onChange={(e) => setWikiLink(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Summarize Button */}
          <button
            onClick={handleSummarize}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            } transition-all flex items-center justify-center`}
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
                กำลังสรุป...
              </>
            ) : (
              "สรุป"
            )}
          </button>

          {/* Summary Output */}
          
            <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">ผลสรุป:</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
            </div>
          
        </div>
      </div>
    </div>
  );
}