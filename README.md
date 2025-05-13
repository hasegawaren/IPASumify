# Sumify: AI-Powered Content Summarization

A full-stack web app that summarizes content from PDFs, Wikipedia, or plain text, with support for **interactive Q&A** in both Thai and English.  
Built with modern web technologies and powered by the DeepSeek API for multi-language summarization and intelligent follow-up.

---

## UI Overview

### Landing Page
![Landing](https://github.com/user-attachments/assets/c42d6b39-0984-4a0b-bddf-445b8afb6068)
![Landing 2](https://github.com/user-attachments/assets/e97617b8-ed7f-4cc6-9d6f-1185b6314e38)

---

### Upload PDF and Summarize
![PDF Upload](https://github.com/user-attachments/assets/7fb06f18-a4cc-48ec-b8ba-2b01df1e4688)
![PDF Result](https://github.com/user-attachments/assets/95938dec-9be9-46e2-84a5-7e2f8b82ec3a)

---

### Summarize Wikipedia Articles via URL
![Wiki Input](https://github.com/user-attachments/assets/22b52ed7-4cbf-49e6-acc9-8216d0bbca57)
![Wiki Result](https://github.com/user-attachments/assets/6411226b-597e-41b0-bc2b-3af36b6f3b5f)

---

### Interactive Q&A (Thai/English)
![Q&A Thai](https://github.com/user-attachments/assets/e233fb1d-4fd1-456d-8dfd-89bc8172a21f)
![Q&A Eng](https://github.com/user-attachments/assets/a8c40875-f59b-4f4c-809b-75665e7fb5ac)

---

## Features

-  Upload PDF and receive structured summaries with outline topics
-  Summarize articles from **Wikipedia URLs**
-  Ask follow-up questions with **AI-powered Q&A**
-  Supports both **Thai** and **English**
-  Fully responsive UI, optimized for both desktop and mobile

---

##  Tech Stack

| Layer        | Technology                         |
|--------------|-------------------------------------|
| **Frontend** | Next.js, Tailwind CSS              |
| **Backend**  | FastAPI (Python), DeepSeek API     |
| **Deploy**   | Vercel (Frontend), Railway (API)   |

---

##  Getting Started

```bash
git clone https://github.com/hasegawaren/IPASumify
cd IPASumify
npm install
npm run dev
