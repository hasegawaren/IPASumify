import styles from "@/styles/Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <h1 className={styles.logo}>📄 Sumify</h1>
      <button className={styles.languageSwitch}>🌐 English</button>
    </nav>
  );
}
