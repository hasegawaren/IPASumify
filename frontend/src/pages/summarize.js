import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import Navbar from "@/components/Navbar";
import styles from "@/styles/Home.module.css";

export default function summarize() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
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
    if (!text && !file) {
      alert("กรุณาใส่ข้อความหรืออัปโหลดไฟล์ PDF");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (text) {
        response = await axios.post("http://localhost:8000/api/summarize", { text });
      } else if (file) {
        const formData = new FormData();
        formData.append("file", file);
        response = await axios.post("http://localhost:8000/api/summarize-pdf", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
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
      <div className={styles.card}>
        <h1 className={styles.title}>Sumify</h1>
        <p className={styles.description}>เครื่องมือสรุปเนื้อหาด้วย AI</p>

        <Textarea
          rows="4"
          placeholder="พิมพ์ข้อความที่ต้องการสรุป..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <p className={styles.orText}>หรือ</p>

        <Input type="file" onChange={(e) => setFile(e.target.files[0])} />

        <Button>{loading ? <Loader2 className="animate-spin mr-2" size={20} /> : "สรุป"}
        </Button>
      </div>
    </div>
  );
}