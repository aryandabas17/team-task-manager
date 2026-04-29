const prisma = require('../config/prisma');

// @desc    Get dashboard metrics
// @route   GET /api/dashboard
exports.getDashboardMetrics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all projects the user is part of
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      select: { id: true },
    });

    const projectIds = projects.map(p => p.id);

    if (projectIds.length === 0) {
      return res.status(200).json({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        tasksByStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
        tasksByPriority: { LOW: 0, MEDIUM: 0, HIGH: 0 },
        recentTasks: [],
      });
    }

    // Get all tasks for these projects
    const allTasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
      },
    });

    const now = new Date();

    let completedTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;
    const tasksByStatus = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    const tasksByPriority = { LOW: 0, MEDIUM: 0, HIGH: 0 };

    allTasks.forEach(task => {
      // Status
      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
      if (task.status === 'DONE') {
        completedTasks++;
      } else {
        pendingTasks++;
        // Overdue check
        if (task.dueDate && new Date(task.dueDate) < now) {
          overdueTasks++;
        }
      }

      // Priority
      tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
    });

    // Get recent tasks assigned to the user
    const recentTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    res.status(200).json({
      totalTasks: allTasks.length,
      completedTasks,
      pendingTasks,
      overdueTasks,
      tasksByStatus,
      tasksByPriority,
      recentTasks,
      projectsCount: projectIds.length,
    });
  } catch (error) {
    next(error);
  }
};
