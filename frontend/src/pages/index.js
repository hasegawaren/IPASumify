import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [response, setResponse] = useState("");

  const fetchMessage = async () => {
    try {
      const res = await axios.get("http://localhost:8000/"); // แก้ไข URL เป็น localhost
      setResponse(res.data.message); // บันทึกข้อความที่ได้จาก Backend
    } catch (err) {
      console.error("Error fetching data:", err);
      setResponse("Failed to fetch data from Backend");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Frontend-Backend Connection</h1>
      <button
        onClick={fetchMessage}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Fetch Message
      </button>
      {response && (
        <div className="mt-4 p-4 bg-white shadow rounded">
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
