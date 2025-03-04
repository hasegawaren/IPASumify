import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import setLanguage from "next-translate/setLanguage";
import styles from "@/styles/Navbar.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";

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
            <button className={styles.languageButton} onClick={toggleLanguage}>
                {t("navbar.language")}
            </button>
        </nav>
    );
}
