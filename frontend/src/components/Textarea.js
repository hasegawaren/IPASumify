import styles from "@/styles/Textarea.module.css";

export function Textarea({ rows = 4, placeholder, value, onChange }) {
  return (
    <textarea
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={styles.textarea}
    ></textarea>
  );
}
