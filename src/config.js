require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/devsecops_tasks',
  nodeEnv: process.env.NODE_ENV || 'development',
  githubRepository: process.env.GITHUB_REPOSITORY || 'dahmaniamine/devsecops-task-api',
  githubToken: process.env.GITHUB_TOKEN || ''
};
