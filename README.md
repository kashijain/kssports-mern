# 🏏 K.S. Sports — Full Stack E-Commerce Platform

K.S. Sports is a full-featured **sports e-commerce and inventory management platform** designed for real-world shop operations.
It allows seamless management of **online orders, offline sales, stock tracking, and reporting** — all in one system.

---

## 🚀 Live Demo

👉 https://kssports-jy5q.onrender.com

---

## ✨ Key Features

### 🛒 Product Management

* Add / Edit / Delete products
* Dynamic **Key Features & Specifications**
* Category-based product organization (Bats, Balls, Kits, etc.)
* Image upload & preview
* COD enable/disable per product

---

### 📊 Offline Sales System (Excel Integration)

* Upload **Excel/CSV sheet** → auto import sales
* Handles:

  * Date-wise entries
  * Quantity, cost, profit
  * Payment mode tracking
* Supports:

  * `Cash`, `Online`, `UPI`, `Pending`
* Smart validation with error reporting (row-wise issues)

---

### 🧾 Manual Offline Entry

* Add sales manually (like Excel)
* Auto calculation:

  * Total Sale
  * Total Cost
  * Profit
* Notes & mixed payment support (cash + online)

---

### 📈 Sales Report Dashboard

* Filter by:

  * Custom Date Range
  * Today / Week / Month
* Metrics:

  * Total Offline Sale
  * Total Online Sale
  * Combined Sale
  * Total Cost
  * Profit
  * Total Transactions
* Includes:

  * No-sale days
  * Holiday tracking

---

### 📦 Inventory Management

* Stock tracking from Excel upload
* Auto-update products
* Supports bulk stock import
* Real-world shop flow compatible

---

### 📑 Orders Management

* View all customer orders
* Mark order as **Delivered**
* Delete incorrect orders
* Track payment status (Pending / Paid)

---

### 🤖 AI Smart Product Generator (NEW)

* Auto-generate:

  * Description
  * Key Features
  * Specifications
* Based on product type:

  * Bat / Ball / Gloves / Accessories
* Manual override available (no UI change)

---

### 🎯 Smart Admin UX

* Clean dark UI (Tailwind CSS)
* Non-breaking updates (existing features preserved)
* Inline edit support
* Scroll-based editing improvements

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Zustand (State Management)

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas

### Tools

* Git & GitHub
* Render (Deployment)
* Postman (API Testing)

---

## 📂 Project Structure

```
kssports-mern/
│
├── frontend/        # React frontend
├── backend/         # Node + Express backend
├── README.md
```

---

## ⚙️ Installation (Local Setup)

### 1️⃣ Clone the repository

```
git clone https://github.com/kashijain/kssports-mern.git
cd kssports-mern
```

### 2️⃣ Backend setup

```
cd backend
npm install
npm run dev
```

### 3️⃣ Frontend setup

```
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create `.env` file in backend:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

## 📊 Excel Format (Supported)

### 📦 Stock Sheet

```
Product Name | Opening Stock | Total Sold | Current Stock | Cost Price | Sale Price | Stock Value | Category
```

### 💰 Offline Sales Sheet

```
Date | Product Name | Qty | Sale Price | Total Sale | Cost Price | Total Cost | Profit | Payment Mode | Notes
```

---

## ⚠️ Important Notes

* System does NOT break if stock mismatch occurs (real shop scenario)
* Duplicate product sales are counted correctly
* Supports real-world entries like:

  * "no sale"
  * "holiday"
  * "close"
* Flexible payment entries supported

---

## 👩‍💻 Author

**Kashish Jain**
B.Tech CSE | Full Stack Developer

📧 [jainkashish015@gmail.com](mailto:jainkashish015@gmail.com)

---

## ⭐ Future Enhancements

* Payment Gateway Integration (Razorpay)
* Customer authentication
* Advanced analytics (graphs)
* Mobile app (Flutter)

---

## 💡 Inspiration

Built to solve real-world problems of **local sports shop owners** by digitizing inventory and sales tracking.

---

⭐ If you like this project, give it a star!
