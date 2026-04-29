const express = require('express');
const router = express.Router();
const {
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
  .post(createTask);

router.route('/project/:projectId')
  .get(getTasksByProject);

router.route('/:taskId')
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
