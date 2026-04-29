const prisma = require('../config/prisma');

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:projectId
exports.getTasksByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Check if user is member of project
    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId,
        },
      },
    });

    if (!member) {
      res.status(403);
      throw new Error('Not authorized to view tasks in this project');
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a task
// @route   POST /api/tasks
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, projectId, assigneeId } = req.body;

    // Must be admin of project to create tasks? Or any member? Requirements say "Admin Permissions: Create/update/delete tasks".
    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId,
        },
      },
    });

    if (!member || member.role !== 'ADMIN') {
      res.status(403);
      throw new Error('Not authorized to create tasks');
    }

    if (assigneeId) {
      // Check if assignee is member
      const assigneeMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: assigneeId,
            projectId,
          },
        },
      });

      if (!assigneeMember) {
        res.status(400);
        throw new Error('Assignee is not a member of this project');
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: req.user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:taskId
exports.updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId: task.projectId,
        },
      },
    });

    if (!member) {
      res.status(403);
      throw new Error('Not authorized to update this task');
    }

    // Role-based logic: Admin can update anything. Member can only update status if assigned.
    let updateData = {};

    if (member.role === 'ADMIN') {
      updateData = {
        title: title || task.title,
        description: description !== undefined ? description : task.description,
        status: status || task.status,
        priority: priority || task.priority,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
        assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId,
      };
    } else {
      if (task.assigneeId !== req.user.id) {
        res.status(403);
        throw new Error('Members can only update tasks assigned to them');
      }
      
      // Members can only update status (or maybe description). Let's restrict to status according to requirements.
      if (title || priority || assigneeId || dueDate) {
        res.status(403);
        throw new Error('Members can only update task status');
      }
      if (status) updateData.status = status;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:taskId
exports.deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId: task.projectId,
        },
      },
    });

    if (!member || member.role !== 'ADMIN') {
      res.status(403);
      throw new Error('Only admins can delete tasks');
    }

    await prisma.task.delete({ where: { id: taskId } });

    res.status(200).json({ id: taskId });
  } catch (error) {
    next(error);
  }
};
