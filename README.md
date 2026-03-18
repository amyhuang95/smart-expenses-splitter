# Smart Expenses Splitter

## Project Objective

**SplitEasy** is a full-stack web application designed to simplify shared expense tracking among roommates, friends, and travel groups.

The application is composed of two main features:
1. Track single expenses shared among multiple people: the expense title, who paid for it, who to split with, and whether the expenses are settled or still working in progress.
2. Track multiple expenses among a group of people related to one event.

* Screenshot
* Deployment Link

## Technology Stack

### Frontend

* React
* React Hooks (`useState`, `useEffect`, `useContext`)
* `react-router` for routing frontend pages
* `react-dom` 
* Fetch API
* `react-bootstrap`
* CSS Modules / Component CSS
* PropTypes
* Development tools: vite

### Backend

* Node.js
* Express (use middleware for authenticated content)
* MongoDB Atlas
* `bcrypt` and `express-session` for user authentication
* Development tools: nodemon

## Repository Structure

The repository is organized into separate frontend, backend, and design workspaces.

```
smart-expenses-splitter/
├── AGENTS.md
├── README.md
├── design/
│   ├── DESIGN.md
│   └── mockups/
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── components/
│       ├── context/
│       ├── layouts/
│       ├── pages/
│       ├── services/
│       ├── styles/
│       ├── App.jsx
│       └── index.jsx
└── backend/
    ├── .env.example
    ├── eslint.config.js
    ├── package.json
    ├── package-lock.json
    ├── server.js
    ├── config/
    │   └── index.js
    ├── db/
    │   ├── connection.js
    │   ├── groupExpensesCollection.js
    │   ├── groupsCollection.js
    │   ├── seed.js
    │   └── usersCollection.js
    ├── middleware/
    │   ├── auth.js
    │   └── requestLogger.js
    ├── routes/
    │   ├── expenses.js
    │   ├── groups.js
    │   └── users.js
    └── utils/
```

## API Notes

* Group dashboard and settlement workflows use `/api/groups`
* Group expense-specific endpoints are nested under `/api/groups/:groupId/expenses`

## Build and Run

### Prerequisites

* Node.js 18+ and npm
* A MongoDB Atlas connection string

### Environment Setup

1. Create `backend/.env` and include variables defined in [backend/.env.example](backend/.env.example).

### Install Dependencies

Run these commands from the project root:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Run in Development

1. Start the backend server:

```bash
cd backend
npm run dev
```

2. In a second terminal, start the frontend dev server:

```bash
cd frontend
npm run dev
```

3. Open the frontend at `http://localhost:5173`.

The Vite dev server proxies `/api` requests to `http://localhost:3000`, so the backend should be running before you use the app locally.

### Build the App

Build the frontend bundle with:

```bash
cd frontend
npm run build
```

This outputs the production frontend files to `frontend/dist`.

### Run the Built App

After building the frontend, start the backend server:

```bash
cd backend
npm start
```

The backend serves the built frontend from `frontend/dist`, so the full app will be available at `http://localhost:3000`.

---
_This project was developed as part of the course CS 5610 Web Development taught by Professor John Alexis Guerra Gomez at Northeastern University (Oakland)._
* Authors: Panta Huang, Amy Huang
* Class Link: https://johnguerra.co/classes/webDevelopment_online_spring_2026/
