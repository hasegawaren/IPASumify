import styles from "@/styles/Input.module.css";

export function Input({ type = "text", placeholder, value, onChange }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={styles.input}
    />
  );
}
