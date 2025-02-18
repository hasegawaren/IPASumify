import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");

  const handleSummarize = async () => {
    try {
      const response = await axios.post("http://localhost:8000/api/summarize", { text });
      setSummary(response.data.summary);
    } catch (error) {
      console.error("Error fetching summary:", error);
      setSummary("เกิดข้อผิดพลาดในการสรุปข้อความ");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Thai2T5 Summarization</h1>
      <textarea 
        rows="5"
        cols="50"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="ใส่ข้อความที่ต้องการสรุป..."
      />
      <br />
      <button onClick={handleSummarize}>สรุปข้อความ</button>
      <h2>ผลลัพธ์:</h2>
      <p>{summary}</p>
    </div>
  );
}
