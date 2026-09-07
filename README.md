# Rotary Club of Erode Central - Member Management Web App

A modern, responsive Member Management & Public Profile Submission portal for **Rotary Club of Erode Central** built with React, Tailwind CSS, and Firebase v9 (Firestore & Firebase Storage).

## Features
- **Admin Member Management:** Full member directory, search by name/phone/vertical, status filtering, profile view & edit modals, deletion.
- **Bulk Excel Upload:** Uploads `.xlsx` / `.xls` spreadsheets with flexible headers (`MEMBERS NAME`, `PHONE NUMER`, `MEMBERS ADDERS`), smart phone number sanitization, and duplicate detection.
- **Public Member Form:** Multi-step member verification via 10-digit mobile number or directory search, profile photo upload with client-side image compression, business address & vertical selection.
- **Firebase Integration:** Modular Firestore database & Firebase Storage for fast profile photo management.

## Tech Stack
- React 18
- Tailwind CSS
- Firebase v9 Modular SDK (Firestore & Storage)
- Vite
- XLSX
- Lucide React Icons

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```
