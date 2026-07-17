# 🎥 IMON WhatsApp Video Downloader Bot

A lightweight and permanent WhatsApp bot to download videos from TikTok and other platforms using **Baileys** and **Pairing Code** login.

---

## 🚀 Features
* **Pairing Code Login:** Direct login using phone number (No QR scanning needed).
* **Auto Reconnect:** Permanently fixed session, stays online even after socket close.
* **Multi-Platform:** Supports TikTok (videos & images) and other platforms.
* **User Analytics:** Tracks unique active users automatically.

---

## 🛠️ Installation & Setup

1. **Upload Files:** Upload `index.js` and `package.json` to your hosting panel (e.g., KataBump).
2. **Configure Number:** Open `index.js` and edit line 26 with your WhatsApp number:
   ```javascript
   const MY_PHONE_NUMBER = '88017XXXXXXXX'; // Your WhatsApp Number with Country Code
