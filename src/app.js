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

app.get('/', (req, res) => {
  res.status(200).json({
    name: 'DevSecOps Task API',
    endpoints: {
      health: 'GET /health',
      tasks: 'GET/POST /api/tasks',
      task: 'GET/PUT/DELETE /api/tasks/:id'
    }
  });
});

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
