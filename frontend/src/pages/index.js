import Navbar from "@/components/Navbar";
import styles from "@/styles/styles.module.css";
import useTranslation from "next-translate/useTranslation";

export default function Home() {
  const { t } = useTranslation("common");

  return (
    <div className={styles.container}>
      <Navbar />

      {/* Content Section */}
      <div className="flex flex-col md:flex-row items-center justify-center max-w-6xl mx-auto px-6 py-40 pt-46 sticky-content">
        {/* Left Content */}
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-5xl font-bold text-black leading-tight">
            {t("homePage.title", { brand: "Sumify" })}
          </h1>
          <p className={styles.formContainer}>
            {t("homePage.description")}
          </p>
        </div>

        {/* Right Content */}
        <div className="md:w-1/2 flex flex-col items-center space-y-4">
          {/* Top Images */}
          <div className="flex space-x-4">
            <img
              src="/images/ai-summarizer-3.svg"
              alt={t("homePage.example1")}
              className="w-56 h-56 rounded-xl object-cover shadow-md bg-gray-300"
            />
            <img
              src="/images/aisummarypdf.png"
              alt={t("homePage.example2")}
              className="w-56 h-56 rounded-xl object-cover shadow-md bg-gray-300"
            />
          </div>

          {/* Bottom Image */}
          <img
            src="/images/aisummary.png"
            alt={t("homePage.example3")}
            className="w-96 h-62 rounded-xl object-cover shadow-md bg-gray-300"
          />
        </div>
      </div>

      {/* Feature Section */}
      <div className="text-center mt-10">
        <h2 className="text-4xl font-semibold">{t("homePage.contentTitle")}</h2>
        <p className="text-gray-600">{t("homePage.contentSubtitle")}</p>
        <ul className="mt-4 space-y-2">
          <li>✅ {t("homePage.contentFeature1")}</li>
          <li>✅ {t("homePage.contentFeature2")}</li>
          <li>✅ {t("homePage.contentFeature3")}</li>
        </ul>
      </div>

      {/* Upload Section */}
      <div className="mt-10">
        <label className="block text-lg">{t("homePage.uploadLabel")}</label>
        <input type="file" className="border p-2 rounded" />

        <label className="block text-lg mt-4">{t("homePage.pasteLinkLabel")}</label>
        <input type="text" className="border p-2 rounded w-full" />

        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded">
          {t("homePage.submitButton")}
        </button>
      </div>
    </div>
  );
}
