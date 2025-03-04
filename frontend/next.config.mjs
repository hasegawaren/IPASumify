import nextTranslate from "next-translate-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = nextTranslate({
  reactStrictMode: true,
  i18n: {
    locales: ["en", "th"],  // รายการภาษาที่รองรับ
    defaultLocale: "en",    // กำหนดภาษาเริ่มต้น
  },
});

export default nextConfig;
