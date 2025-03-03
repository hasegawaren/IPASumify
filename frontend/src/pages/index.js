import Navbar from "@/components/Navbar";
import "@/styles/styles.module.css";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-100 to-gray-200 relative">
      <Navbar />
  
      {/* Content Section */}
      <div className="flex flex-col md:flex-row items-center justify-center max-w-6xl mx-auto px-6 py-20 pt-32 sticky-content">
        {/* Left Content */}
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-5xl font-bold text-black leading-tight">
            No prompt engineering needed, just{" "}
            <span className="italic">ask</span>
          </h1>
          <p className="text-gray-600 text-lg">
            Be as simple or as specific. Talk in your own way to generate, edit, and move 
            through your explorations fluently.
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
  
          {/* Input Section */}
          <div className="flex items-center bg-white px-4 py-3 rounded-full shadow-md w-80">
            <input
              type="text"
              placeholder="Summarize PDF and Link Website"
              className="w-full bg-transparent outline-none text-black"
            />
            <button className="bg-black text-white rounded-full p-2 ml-2">
              ⬆
            </button>
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
