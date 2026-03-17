# Smart Expenses Splitter

## Project Overview

**SplitEasy** is a full-stack web application designed to simplify shared expense tracking among roommates, friends, and travel groups.

The application is composed of two main features:
1. Track single expenses shared among multiple people: the expense title, who paid for it, who to split with, and whether the expenses are settled or still working in progress.
2. Track multiple expenses among a group of people related to one event.

The README must include:

* Author
* Class Link
* Project Objective
* Screenshot
* Build Instructions
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
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       ├── styles/
│       ├── App.js
│       └── index.js
└── backend/
    ├── package.json
    ├── server.js
    ├── config/
    ├── db/
    ├── middleware/
    └── routes/
```