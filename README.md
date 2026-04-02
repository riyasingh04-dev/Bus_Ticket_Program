# 🚌 Bus Ticket Booking System

A premium, full-stack bus ticket booking application featuring a **FastAPI** backend and a **React (Vite)** frontend. This system supports multiple user roles (Users, Agents, and Admins) with specialized dashboards for each.

---

## 🌟 Key Features

### 👤 User Features
- **Search & Filter**: Find buses based on source, destination, and date.
- **Seat Selection**: Interactive 2D/3D seat layout with real-time status updates.
- **Booking Flow**: Seamless passenger details entry and payment simulation.
- **My Bookings**: Manage and view your past and upcoming travel history.

### 🏢 Agent Features
- **Fleet Management**: Add, update, and manage bus vehicles.
- **Schedule Management**: Create and monitor bus routes, timings, and pricing.
- **Seat Management Dashboard**: Real-time monitoring of bus occupancy with live polling and status visualization.

### 🛡️ Admin Features
- **Agent Oversight**: Create and manage agent accounts.
- **Master Data**: Control city lists, route stops (stoppages), and global system settings.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/)
- **Database**: MySQL / SQLite (configured via environment variables)
- **Serialization**: Pydantic V2
- **Authentication**: JWT (JSON Web Tokens) with Python-JOSE

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Routing**: React Router 7
- **Styling**: Vanilla CSS with a focus on modern, glassmorphic aesthetics.
- **Icons**: [Lucide React](https://lucide.dev/)
- **API Client**: Axios

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- MySQL Server (optional, can use SQLite)

### 1. Backend Setup
```bash
# Navigate to Backend root
cd Backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure Environment Variables
# Create a .env file in the root directory (parent of Backend)
echo "DATABASE_URL=mysql+pymysql://user:password@localhost/bus_ticket_db" > ../.env

# Start the server
uvicorn app.main:app --reload
```

### 2. Frontend Setup
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## 📁 Project Structure

```text
├── Backend
│   ├── app
│   │   ├── core        # Security, Auth, & Config
│   │   ├── db          # Database session and base models
│   │   └── modules     # Feature-specific logic (Auth, User, Bus, Booking, etc.)
│   └── main.py         # Entry point
├── frontend
│   ├── src
│   │   ├── components  # Reusable UI components
│   │   ├── pages       # Main page views (Admin, Agent, User)
│   │   ├── layouts     # Shared layouts (Navbar, Sidebar)
│   │   └── routes      # Application routing
│   └── index.css       # Global design tokens and styles
└── .env                # Global configuration
```

---

## 📝 Configuration
The system uses a single `.env` file in the root directory for critical settings:

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | SQLAlchemy-compatible database connection string |

---

## ⚖️ License
This project is for demonstration and educational purposes.
