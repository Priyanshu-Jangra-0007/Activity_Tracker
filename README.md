📊 Activity Tracker Web Application

A modern, frontend-driven Activity Tracker that uses Google Sheets as a backend.
It allows users to track daily activities month-wise, automatically calculate counts, and visualize progress using a dynamic line chart.

🚀 Project Overview

The Activity Tracker helps users build consistency by:

Tracking daily activities using checkboxes
Automatically calculating completed days (COUNT)
Persisting data across sessions
Visualizing monthly progress with a line chart
Using Google Sheets as a lightweight backend database

The application is fast, serverless, and free to host.

🧩 Tech Stack

Frontend
HTML5 – Structure
CSS3 (Glassmorphism UI) – Styling & layout
JavaScript (Vanilla JS) – Logic & state handling
Chart.js – Line chart visualization

Backend
Google Sheets
Google Apps Script (Web App API)

🗂️ Project Structure

Activity_Tracker/
index.html — Main UI
style.css — Glassmorphism theme
script.js — Core logic
README.md — Documentation

⚙️ How It Works
1. Google Sheets (Data Source)

Each month is stored in a Google Sheet using the following structure:

MONTH NAME
ACTIVITY | 1 | 2 | 3 | ... | 31 | COUNT | STREAK

Checkboxes represent daily completion.

2. Google Apps Script (Backend API)

Deployed as a Web App.

Supports:
GET — Fetch month data as JSON
POST — Update checkbox values

Example usage:
GET ?month=JANUARY
POST { month, row, col, value }

3. Frontend Data Flow

On page load, the app fetches data from Apps Script.
Data is rendered dynamically into a table.
The progress chart updates automatically.

4. Activity Table Rendering

For each activity:
A table row is created
Daily checkboxes are inserted
Checkbox state priority:

localStorage

Google Sheets (fallback)

5. Checkbox Interaction Logic

When a checkbox is toggled:
State is saved instantly to localStorage
State is synced to Google Sheets
Table and chart re-render automatically

This ensures fast UI response and data consistency.

6. Automatic Count Calculation

COUNT is not stored.
It is calculated dynamically by counting checked days.
Always accurate with no manual updates required.

7. Progress Line Chart

X-axis — Day (1–31)
Y-axis — Completion percentage
Smooth animated transitions using Chart.js

💾 Data Persistence Strategy

localStorage — Instant UI updates, offline-safe
Google Sheets — Permanent cloud storage

Local data always syncs back to Google Sheets.

🎨 UI Highlights

Glassmorphism design
Sticky activity column
Sticky header row
Dark, eye-friendly theme
Responsive scrolling layout

✅ Features

Month-wise activity tracking
Checkbox-based daily input
Automatic count calculation
Line chart progress visualization
Persistent data storage
No traditional backend server
Lightweight and fast

🔐 Deployment Notes

Google Apps Script must be deployed as a Web App with access set to Anyone.

Frontend can be hosted for free on:
GitHub Pages
Netlify
Vercel
Local static server

📈 Future Enhancements

Weekly summaries
Per-activity charts
Google authentication
CSV / Excel export
Mobile-first layout
PWA (offline support)

🧠 Design Philosophy

Compute everything on the frontend.
Store only raw truth in the backend.

This makes the system reliable, scalable, easy to debug, and cost-free to host.

🏁 Conclusion

The Activity Tracker is a production-quality frontend project demonstrating real-world API integration, state management, UI/UX design, data visualization, and serverless cloud architecture.
