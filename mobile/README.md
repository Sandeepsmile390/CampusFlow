# CampusFlow Mobile Application (React Native / Expo) 👋

This is the mobile application interface for the **CampusFlow ERP** ecosystem. It is built using React Native, Expo SDK 56, and Expo Router, connecting to the **same backend REST APIs** as the main web dashboard.

---

## 🎨 Mobile Features & Design

1. **Unified Brand Aesthetics**: Leverages the exact same color palette, HSL card outlines, and typography scale (Inter) as the desktop web client.
2. **API-First Architecture Integration**:
   - **Authentication**: Integrates with the backend Bearer token check. Works seamlessly using a dynamically editable endpoint URL.
   - **QR Attendance Check-In**: Students can paste the active rotation token (retrieved from the teacher QR generator) to submit a signed attendance check-in.
   - **Global Notice Feed**: Reads announcements in real-time, displays category tags (Exams, Placement, Holiday, General), and allows teachers to publish/delete notices.
   - **Course Timetables & Finance**: Renders fee invoice balances in Rupees (₹) and daily lecture timetables fetched dynamically from the database.

---

## 🚀 Getting Started

### 1. Install Dependencies
Navigate to the mobile directory and install required packages:
```bash
cd mobile
npm install
```

### 2. Configure Backend Endpoint
By default, the app is configured to connect to:
- **Android Emulator**: `http://10.0.2.2:5001/api/v1`
- **iOS Simulator / Web**: `http://localhost:5001/api/v1`

You can customize this endpoint directly in the input box on the mobile login screen if your server is running on a specific local IP.

### 3. Start the Project
To run the mobile interface locally, run one of the following commands:

- **Run in Web Browser**:
  ```bash
  npm run web
  ```
- **Run in Android Emulator**:
  ```bash
  npm run android
  ```
- **Run in iOS Simulator**:
  ```bash
  npm run ios
  ```

---

## 🔑 Quick Login Simulator
You can type in or tap the pre-filled credentials on the login screen to instantly authenticate:
- **Student**: `student.john@university.edu` / `password123`
- **Teacher**: `teacher.dbms@university.edu` / `password123`
