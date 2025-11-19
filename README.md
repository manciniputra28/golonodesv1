# Golonodes (Node.js + Express + SQLite)

---

## 🚀 Features

- 🔒 **Security-Enhanced** server using Helmet
- ⚡ **High-speed caching** using NodeCache (5-minute TTL)
- 🖼️ **Automatic image optimization** (resize & compression using Sharp)
- 📁 **Asset handling** for images, documents, and general files
- 🗄️ **Local database** using SQLite (auto-creates file & directory)
- 📡 **Modular REST API** with clean routing structure
- 📦 **Zero configuration setup** — runs instantly after install
- 🧱 **Enterprise-like project structure**

---

## 📦 Requirements

Make sure you have:

- **Node.js v18+**
- **npm or yarn**
- *(Optional)* SQLite Browser (if you want to inspect the DB)

---

## 🔧 Installation

Clone the repository:

```bash
git clone https://github.com/manciniputra28/golonodesv1.git
cd golonodesv1
```

Install all dependencies:

```bash
npm install
```

**▶️ Running the Server**

Start the backend:

```bash
node src/server.js
```

If everything is correct, you should see:

```bash
SQLite database loaded at: database/data.db
Server running on port 3000
```