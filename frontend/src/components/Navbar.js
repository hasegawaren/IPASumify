import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import setLanguage from "next-translate/setLanguage";
import styles from "@/styles/Navbar.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Globe } from "lucide-react";

export default function Navbar() {
    const router = useRouter();
    const { t, lang } = useTranslation("common");
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        setExpanded(true);
    }, [router.pathname]);

    // ฟังก์ชันเปลี่ยนภาษา
    const toggleLanguage = async () => {
        const newLang = lang === "en" ? "th" : "en";
        await setLanguage(newLang);
    };

    return (
        <nav className={styles.navbar}>
            {/* โลโก้ Sumify */}
            <div className={styles.logoContainer}>
                <img src="/icons/sumifylogo.png" alt="Sumify Logo" className={styles.logo} />
            </div>

            {/* เมนูแบบไอคอนวงกลม */}
            <div className={styles.menu}>
                <Link href="/" className={`${styles.menuItem} ${router.pathname === "/" ? `${styles.active} ${expanded ? styles.expand : ""}` : styles.inactive}`}>
                    <img src="/icons/Hut.png" alt="Home Icon" className={styles.menuIcon} />
                    <span>{t("navbar.home")}</span>
                </Link>

                <Link href="/summarize" className={`${styles.menuItem} ${router.pathname === "/summarize" ? `${styles.activeInterior} ${expanded ? styles.expand : ""}` : styles.inactive}`}>
                    <img src="/icons/OpenBook.png" alt="Summarize Icon" className={styles.menuIcon} />
                    <span>{t("navbar.summarize")}</span>
                </Link>
            </div>

            {/* ปุ่มเปลี่ยนภาษา */}

            <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-black to-gray-800 text-white font-semibold text-lg shadow-md hover:scale-105 hover:bg-blue-500 transition-all duration-300"
            >
                <Globe size={20} className="text-yellow-400" />
                {t("navbar.language")}
            </button>
        </nav>
    );
}
