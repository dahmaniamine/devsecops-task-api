const Task = require('../models/Task');

async function createTask(req, res) {
  const { title, description, completed } = req.body;

  const task = await Task.create({ title, description, completed });
  return res.status(201).json(task);
}

async function getTasks(req, res) {
  const tasks = await Task.find().sort({ createdAt: -1 });
  return res.status(200).json(tasks);
}

async function getTaskById(req, res) {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Task not found'
    });
  }

  return res.status(200).json(task);
}

async function updateTask(req, res) {
  const allowedFields = ['title', 'description', 'completed'];
  const update = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      update[field] = req.body[field];
    }
  }

  const task = await Task.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true
  });

  if (!task) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Task not found'
    });
  }

  return res.status(200).json(task);
}

async function deleteTask(req, res) {
  const task = await Task.findByIdAndDelete(req.params.id);

  if (!task) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Task not found'
    });
  }

  return res.status(204).send();
}

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
};
