const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const taskRoutes = require('./routes/tasks');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '100kb' }));

// Serve the browser UI from /public. Visiting http://localhost:3000 now opens the app.
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'devsecops-task-api',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/tasks', taskRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
