import styles from "@/styles/Home.module.css";
import { useRouter } from "next/router";

export default function HeroSection() {
  const router = useRouter();

  return (
    <section className={styles.hero}>
      <h1>สรุปเนื้อหาอย่างง่ายด้วย AI</h1>
      <p>เครื่องมือที่ช่วยให้คุณสรุปข้อมูลจากไฟล์ PDF และข้อความได้อย่างรวดเร็ว</p>
      <button className={styles.button} onClick={() => router.push("/summarize")}>
        เริ่มต้นใช้งาน
      </button>
    </section>
  );
}
