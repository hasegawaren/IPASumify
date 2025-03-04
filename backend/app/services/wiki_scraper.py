import wikipediaapi
import re
from urllib.parse import unquote

def get_wikipedia_summary_from_url(url: str):
    """ ดึงข้อมูลจาก Wikipedia โดยใช้ URL """
    user_agent = "IPASummary/1.0 (your-email@example.com)"

    if "wikipedia.org/wiki/" not in url:
        return {"error": "URL ไม่ใช่หน้า Wikipedia ที่ถูกต้อง"}
    
    lang_match = re.search(r'(\w{2,3})\.wikipedia\.org', url)
    if not lang_match:
        return {"error": "ไม่สามารถระบุภาษาจาก URL ได้"}
    lang = lang_match.group(1)

    wiki = wikipediaapi.Wikipedia(user_agent=user_agent, language=lang)

    # แยกชื่อหัวข้อจาก URL
    try:
        topic_part = url.split("/wiki/")[-1]
        if not topic_part:
            return {"error": "ไม่พบชื่อหัวข้อใน URL"}
        
        # ถอดรหัส URL-encoded
        topic = unquote(topic_part)
        if not topic:
            return {"error": "ชื่อหัวข้อว่างเปล่าหลังถอดรหัส"}

        print(f"Extracted topic: {topic}, Language: {lang}")

    except Exception as e:
        return {"error": f"ไม่สามารถแยกชื่อหัวข้อจาก URL ได้: {str(e)}"}

    # ดึงข้อมูลจาก Wikipedia โดยใช้ชื่อหัวข้อ
    page = wiki.page(topic)

    if not page.exists():
        return {"error": f"ไม่พบหน้า '{topic}' ใน Wikipedia"}

    return {
        "title": page.title,
        "content": page.text[:36000],
        "url": page.fullurl
    }