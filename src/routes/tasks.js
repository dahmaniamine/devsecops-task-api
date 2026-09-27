const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

const router = express.Router();

router.route('/').get(asyncHandler(getTasks)).post(asyncHandler(createTask));
router
  .route('/:id')
  .get(asyncHandler(getTaskById))
  .put(asyncHandler(updateTask))
  .delete(asyncHandler(deleteTask));

module.exports = router;
