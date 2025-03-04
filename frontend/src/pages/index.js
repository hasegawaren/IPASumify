import Navbar from "@/components/Navbar";
import styles from "@/styles/styles.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <Navbar />
  
      {/* Content Section */}
      <div className="flex flex-col md:flex-row items-center justify-center max-w-6xl mx-auto px-6 py-40 pt-46 sticky-content">
        {/* Left Content */}
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-5xl font-bold text-black leading-tight">
          Summarize PDF, Wiki link and Text with{" "}
            <span className="italic">Sumify</span>
          </h1>
          <p className={styles.formContainer}>
          An AI-powered summarization tool that supports both Thai and English. Simply paste a Wikipedia URL or upload a PDF file, and the system will generate a concise, easy-to-understand summary—saving you time and effort in reading!
          </p>
        </div>

        {/* Right Content */}
        <div className="md:w-1/2 flex flex-col items-center space-y-4">
          {/* Top Images */}
          <div className="flex space-x-4">
            <img
              src="/images/ai-summarizer-3.svg"
              alt="Example 1"
              className="w-56 h-56 rounded-xl object-cover shadow-md bg-gray-300"
            />
            <img
              src="/images/aisummarypdf.png"
              alt="Example 2"
              className="w-56 h-56 rounded-xl object-cover shadow-md bg-gray-300"
            />
          </div>
  
          {/* Bottom Image */}
          <img
            src="/images/aisummary.png"
            alt="Example 3"
            className="w-96 h-62 rounded-xl object-cover shadow-md bg-gray-300"
          />
        </div>
      </div>
    </div>
  );
}
