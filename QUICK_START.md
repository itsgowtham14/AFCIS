# 🚀 Quick Start Instructions

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js installed (v14+)
- ✅ MongoDB installed
- ✅ PowerShell (Windows)

---

## 🔥 Fast Setup (3 Steps)

### Step 1: Start MongoDB

Open PowerShell and run:
```powershell
mongod
```

Keep this terminal running.

---

### Step 2: Install Backend & Seed Database

Open a **NEW** PowerShell terminal:

```powershell
# Navigate to project
cd "C:\Users\Sasikumari\Desktop\Stack Hack\backend"

# Install dependencies
npm install

# Seed database with sample data
npm run seed

# Start backend server
npm run dev
```

You should see:
```
MongoDB Connected: localhost
Server running in development mode on port 5000
```

Keep this terminal running.

---

### Step 3: Install Frontend & Start

Open a **NEW** PowerShell terminal:

```powershell
# Navigate to project root
cd "C:\Users\Sasikumari\Desktop\Stack Hack"

# Install dependencies
npm install

# Start React app
npm start
```

Browser will auto-open at: `http://localhost:3000`

---

## 🔑 Login Credentials

Use these to test different roles:

| Role | Email | Password |
|------|-------|----------|
| **Student** | alice.johnson@student.edu | student123 |
| **Faculty** | john.smith@university.edu | faculty123 |
| **Dept Admin** | dept.cs@university.edu | dept123 |
| **System Admin** | admin@university.edu | admin123 |

---

## ✅ Verify Everything Works

### Test 1: Backend API
Visit: `http://localhost:5000/api/health`

Should see: `{"status":"OK","message":"Stack Hack API is running"}`

### Test 2: Frontend
Visit: `http://localhost:3000`

Should see: Login page

### Test 3: Login
1. Use any credential from table above
2. Should redirect to appropriate dashboard
3. Try navigating through the sidebar

---

## 🎯 Alternative: Use Quick Start Script

Instead of manual steps, run:

```powershell
cd "C:\Users\Sasikumari\Desktop\Stack Hack"
.\start.ps1
```

This will:
- Check if MongoDB is running
- Install all dependencies
- Seed database
- Start both backend and frontend
- Open in browser automatically

---

## 🐛 Troubleshooting

### Problem: MongoDB not found
**Fix:** Install MongoDB from https://www.mongodb.com/try/download/community

### Problem: Port 5000 already in use
**Fix:** Kill the process:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

### Problem: Port 3000 already in use
**Fix:** React will ask to use different port, type 'y'

### Problem: npm command not found
**Fix:** Install Node.js from https://nodejs.org

### Problem: Login fails
**Fix:** Ensure backend is running and database is seeded

---

## 📁 What Gets Installed

### Backend Dependencies
- express (Web framework)
- mongoose (MongoDB ODM)
- bcryptjs (Password hashing)
- jsonwebtoken (Authentication)
- cors (Cross-origin requests)
- dotenv (Environment config)

### Frontend Dependencies
- react (UI library)
- @mui/material (UI components)
- react-router-dom (Navigation)
- chart.js (Charts)
- xlsx (Excel handling)

---

## 🎓 Testing Features

### As Student
1. Login → alice.johnson@student.edu
2. Click "Active Feedback" in sidebar
3. See available feedback forms
4. Submit feedback

### As Faculty
1. Login → john.smith@university.edu
2. Click "Create Feedback"
3. Create a new form
4. View responses
5. See analytics

### As Department Admin
1. Login → dept.cs@university.edu
2. View department insights
3. See all courses
4. Manage faculty

### As System Admin
1. Login → admin@university.edu
2. Click "User Management"
3. Create/edit/delete users
4. Try "Bulk User Creation"
5. View system analytics

---

## 📊 Sample Data Included

After seeding, you'll have:
- ✅ 4 roles (Student, Faculty, Dept Admin, System Admin)
- ✅ 4 sample students
- ✅ 2 faculty members
- ✅ 2 courses (CS301, CS302)
- ✅ 2 course offerings
- ✅ Multiple sections (A, B)
- ✅ 1 active feedback form
- ✅ Faculty assignments

---

## 🔄 Reset Database

To start fresh:

```powershell
cd backend
npm run seed
```

This will:
1. Delete all existing data
2. Create fresh sample data
3. Display new credentials

---

## 📖 More Information

- **Complete Setup:** See README.md
- **API Documentation:** See backend/API_DOCUMENTATION.md
- **Implementation Details:** See IMPLEMENTATION_SUMMARY.md

---

## 🎉 You're All Set!

The application is now running:
- **Backend API:** http://localhost:5000
- **Frontend App:** http://localhost:3000
- **Database:** MongoDB on localhost:27017

Happy testing! 🚀
