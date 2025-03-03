import { useRouter } from "next/router";
import styles from "@/styles/Navbar.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        setExpanded(true);
    }, [router.pathname]);

    return (
        <nav className={styles.navbar}>
            {/* โลโก้ Sumify */}
            <div className={styles.logoContainer}>
                <img src="/icons/sumifylogo.png" alt="Sumify Logo" className={styles.logo} />
            </div>
            {/* เมนูแบบไอคอนวงกลม */}
            <div className={styles.menu}>
                <Link
                    href="/"
                    className={`${styles.menuItem} ${router.pathname === "/" ? `${styles.active} ${expanded ? styles.expand : ""}` : styles.inactive}`}
                >
                    <img src="/icons/Hut.png" alt="Home Icon" className={styles.menuIcon} />
                    {router.pathname === "/" && <span>Home</span>}
                    {/* เพิ่มชื่อเมนูในกรณีที่เมนูไม่ได้เลือก */}
                    {router.pathname !== "/" && <span>Home</span>}
                </Link>

                <Link
                    href="/summarize"
                    className={`${styles.menuItem} ${router.pathname === "/summarize" ? `${styles.activeInterior} ${expanded ? styles.expand : ""}` : styles.inactive}`}
                >
                    <img src="/icons/OpenBook.png" alt="Summarize Icon" className={styles.menuIcon} />
                    {router.pathname === "/summarize" && <span>Summarize</span>}
                    {/* เพิ่มชื่อเมนูในกรณีที่เมนูไม่ได้เลือก */}
                    {router.pathname !== "/summarize" && <span>Summarize</span>}
                </Link>

            </div>

            {/* ปุ่มเปลี่ยนภาษา */}
            <button className={styles.languageButton}>🌐 EN</button>
        </nav>
    );
}
