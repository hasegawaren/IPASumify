import Image from "next/image";
import Navbar from "@/components/Navbar";
import styles from "@/styles/styles.module.css";
import useTranslation from "next-translate/useTranslation";

export default function Home() {
  const { t } = useTranslation("common");

  return (
    <div className={styles.container}>
      <Navbar />
      <div className="w-full flex flex-col md:flex-row items-center justify-center max-w-6xl mx-auto px-6 py-40 pt-46 sticky-content font-sans">
        <div className="md:w-1/2 space-y-6 ">
          <h1 className="text-5xl font-bold text-black leading-tight flex items-center">
            {t("homePage.title")}

          </h1>
          <img
            src="/images/logo-home.png"
            alt="Sumify Logo"
            className="w-200 h-20 ml-200"
          />
          <p className={styles.formContainer}>
            {t("homePage.description")}
          </p>
        </div>

        <div className="md:w-1/2 flex flex-col items-center space-y-4">
          <div className="flex-col md:flex-row md:space-x-4 mt-4 md:flex ">
            <Image
              src="/images/ai-summarizer-3.svg"
              alt={t("homePage.example1")}
              width={224}
              height={224}
              className="rounded-xl object-cover shadow-md bg-gray-300 mb-4"
            />
            <Image
              src="/images/aisummarypdf.png"
              alt={t("homePage.example2")}
              width={224}
              height={224}
              className="rounded-xl object-cover shadow-md bg-gray-300"
            />
          </div>
          <Image
            src="/images/aisummary.png"
            alt={t("homePage.example3")}
            width={384}
            height={248}
            className="rounded-xl object-cover shadow-md bg-gray-300"
          />
        </div>
      </div>
    </div>
  );
}
