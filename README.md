Delivery Management System
A simple real‑time delivery management web app built with React (frontend) and Node.js, Express, Socket.io, and MySQL (backend).

Features
User login for Admin and Delivery Boy roles.

Create new delivery orders with customer details, address, and status.

Live order status updates using Socket.io.

Separate views for Admin (create/manage orders) and Delivery Boy (view assigned orders and update status).

Tech Stack
Frontend: React, HTML, CSS, JavaScript

Backend: Node.js, Express, TypeScript, Socket.io

Database: MySQL (via XAMPP on local machine)

Deployment:

Frontend on Vercel

Backend runs locally on localhost:5000 (not deployed)

Live Demo
Frontend (Vercel):
https://delivery-management-sy-git-660744-dwaraksai4-gmailcoms-projects.vercel.app/

Note: The backend API and database run only on the developer’s local machine (Node.js + Express + MySQL on localhost:5000).
Because of this, some dynamic actions (like creating orders from the Vercel link) may not work unless the backend is running locally and the frontend is also accessed locally.

How to Run Locally
1. Clone the repository
bash
git clone https://github.com/SaiDwaraka123/delivery-management-system-new.git
cd delivery-management-system-new
2. Setup and run backend
Make sure MySQL (XAMPP) is running.

Create a database named delivery_db in phpMyAdmin (or MySQL client).

Go to backend folder and install dependencies:

bash
cd backend
npm install
Start the backend dev server:

bash
npm run dev
The backend will run on http://localhost:5000.

3. Setup and run frontend
In a new terminal window:

bash
cd ../frontend
npm install
npm start
Open the app in your browser:

text
http://localhost:3000
4. Default URLs in code
API and Socket.io are configured to use:
http://localhost:5000

Make sure backend is running before testing the frontend.

Project Structure
text
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
How It Works
Admin logs in and creates delivery orders.

Orders are stored in MySQL and broadcast to connected clients using Socket.io.

Delivery Boys see assigned orders and can update the status (e.g., Pending → In Progress → Delivered).

Status changes are pushed in real‑time to all connected clients.

