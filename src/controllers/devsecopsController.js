const mongoose = require('mongoose');
const config = require('../config');
const { getActionsOverview } = require('../services/githubService');

function mongoStatus() {
  const states = {
    0: 'disconnected',
    1: 'healthy',
    2: 'connecting',
    3: 'disconnecting'
  };

  return states[mongoose.connection.readyState] || 'unknown';
}

async function getOverview(req, res) {
  let github;

  try {
    github = await getActionsOverview({ force: req.query.refresh === 'true' });
  } catch (error) {
    github = {
      repository: config.githubRepository,
      repositoryUrl: `https://github.com/${config.githubRepository}`,
      error: error.message,
      latestRun: null,
      recentRuns: [],
      stages: [],
      security: {
        gate: 'unknown',
        scanStatus: 'unknown',
        sbomStatus: 'unknown',
        critical: null,
        high: null,
        statement: 'GitHub Actions data is temporarily unavailable.'
      },
      deployments: {
        staging: 'unknown',
        smokeTest: 'unknown',
        production: 'unknown'
      },
      image: `ghcr.io/${config.githubRepository}:latest`
    };
  }

  return res.status(200).json({
    product: {
      name: 'SecureShip Lite',
      purpose: 'Secure software delivery control center'
    },
    service: {
      name: 'devsecops-task-api',
      status: 'healthy',
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
      environment: config.nodeEnv
    },
    database: {
      name: 'MongoDB',
      status: mongoStatus()
    },
    github,
    generatedAt: new Date().toISOString()
  });
}

module.exports = {
  getOverview
};
