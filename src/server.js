const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');

async function startServer() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`API listening on port ${config.port}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
