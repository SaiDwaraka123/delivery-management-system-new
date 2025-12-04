# Delivery Management System

A simple real‑time delivery management web app built with React (frontend) and Node.js, Express, Socket.io, and MySQL (backend).

## Project Overview

This project allows an Admin to create and manage delivery orders and a Delivery Boy to view assigned orders and update their status in real time. It demonstrates a basic full‑stack application with authentication, order management, and live updates using WebSockets.

## Tech Stack Used

- **Frontend:** React, HTML, CSS, JavaScript
- **Backend:** Node.js, Express, TypeScript, Socket.io
- **Database:** MySQL (via XAMPP on local machine)
- **Deployment:**
  - Frontend on Vercel
  - Backend runs locally on `localhost:5000` (not deployed)

## Live Link

- **Frontend (Vercel):**  
  https://delivery-management-sy-git-660744-dwaraksai4-gmailcoms-projects.vercel.app/

> Note: The backend API and database run only on the developer’s local machine (Node.js + Express + MySQL on `localhost:5000`). Because of this, dynamic actions from the Vercel link require the backend to be running locally.

## Short Video Link

- **Google Drive Video:**  
  https://drive.google.com/file/d/1AMFywVj_yjMryBmfxH-X6yoewZ0Va4KU/view?usp=sharing

The video shows the full lifecycle of an order:
- Admin login
- Creating a new order
- Viewing orders in the table
- Updating order status from the Delivery Boy side
- Real‑time status updates

## Setup Instructions

### 1. Clone the repository

git clone https://github.com/SaiDwaraka123/delivery-management-system-new.git
cd delivery-management-system-new

text

### 2. Backend Setup

1. Start MySQL in XAMPP.
2. Create a database named `delivery_db` in phpMyAdmin (or MySQL client).
3. Update database credentials in `backend/src/db.ts` or `.env` if needed.
4. Install backend dependencies:

cd backend
npm install

text

5. Run the backend in development mode:

npm run dev

text

The backend will run on `http://localhost:5000`.

### 3. Frontend Setup

1. In a new terminal:

cd ../frontend
npm install
npm start

text

2. Open the app in your browser:

http://localhost:3000

text

### 4. How to Run Backend & Frontend Together

- Ensure:
  - MySQL is running
  - Backend dev server is running on `http://localhost:5000`
  - Frontend dev server is running on `http://localhost:3000`
- The frontend is configured to call the backend and Socket.io on `http://localhost:5000`.

## Project Structure

delivery-management-system-new/
backend/
src/
server.ts
db.ts
models/
Order.ts
User.ts
package.json
tsconfig.json

frontend/
public/
index.html
src/
App.js
AuthScreen.js
auth.js
index.js
App.css
index.css
package.json

text

## How It Works

- Admin logs in and creates delivery orders.
- Orders are stored in MySQL and broadcast to connected clients using Socket.io.
- Delivery Boys see assigned orders and can update the status (e.g., Pending → In Progress → Delivered).
- Status changes are pushed in real‑time to all connected clients.

