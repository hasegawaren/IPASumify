import wikipediaapi

def get_wikipedia_summary(topic: str, lang: str = "en"):
    """ ดึงข้อมูลจาก Wikipedia ตามหัวข้อที่ระบุ """
    # เพิ่ม user_agent ที่เหมาะสม
    user_agent = "IPASummary/1.0 (your-email@example.com)"
    wiki = wikipediaapi.Wikipedia(user_agent=user_agent, language=lang)
    page = wiki.page(topic)

    if not page.exists():
        return {"error": f"ไม่พบหัวข้อ '{topic}' ใน Wikipedia"}

    return {
        "title": page.title,
        "summary": page.summary[:2000],  # จำกัดข้อความไม่เกิน 2000 ตัวอักษร
        "url": page.fullurl
    }