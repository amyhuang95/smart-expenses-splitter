const express = require('express');
const path = require('path');
const { connectToDb } = require('./db/connection');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/expenses', require('./routes/expenses'));

// Serve React in production
app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
});

connectToDb()
  .then(() => app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`)))
  .catch((err) => { console.error('DB connection failed:', err); process.exit(1); });
