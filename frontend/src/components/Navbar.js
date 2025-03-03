import { useRouter } from "next/router";
import styles from "@/styles/Navbar.module.css";
import Link from "next/link";

export default function Navbar() {
  const router = useRouter(); // ใช้เพื่อตรวจสอบเส้นทางปัจจุบัน

  return (
    <nav className={styles.navbar}>
      {/* โลโก้ Sumify */}
      <h1 className={styles.logo}>📄 Sumify</h1>

      {/* เมนูกลาง */}
      <div className={styles.menu}>
        <Link
          href="/"
          className={`${styles.menuItem} ${
            router.pathname === "/" ? styles.active : ""
          }`}
        >
          Home
        </Link>
        <Link
          href="/summarize"
          className={`${styles.menuItem} ${
            router.pathname === "/summarize" ? styles.active : ""
          }`}
        >
          Summarize
        </Link>
      </div>

      {/* ปุ่ม Try Now */}
      <button className={styles.tryNow}>Try Now</button>
    </nav>
  );
}
