const prisma = require('../config/prisma');

// @desc    Get all projects for logged in user
// @route   GET /api/projects
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new project
// @route   POST /api/projects
exports.createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Project name is required');
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        members: {
          create: {
            userId: req.user.id,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project details
// @route   GET /api/projects/:id
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' }
        },
      },
    });

    if (!project) {
      res.status(404);
      throw new Error('Project not found or you do not have access');
    }

    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
exports.updateProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Check if user is admin
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId: req.params.id,
        },
      },
    });

    if (!projectMember || projectMember.role !== 'ADMIN') {
      res.status(403);
      throw new Error('Not authorized to update this project');
    }

    const updatedProject = await prisma.project.update({
      where: { id: req.params.id },
      data: { name, description },
    });

    res.status(200).json(updatedProject);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
exports.deleteProject = async (req, res, next) => {
  try {
    // Only owner can delete project
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    if (project.ownerId !== req.user.id) {
      res.status(403);
      throw new Error('Only the project owner can delete this project');
    }

    await prisma.project.delete({
      where: { id: req.params.id },
    });

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
exports.addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    // Check if current user is admin
    const currentMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId: req.params.id,
        },
      },
    });

    if (!currentMember || currentMember.role !== 'ADMIN') {
      res.status(403);
      throw new Error('Not authorized to add members');
    }

    // Find user to add
    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) {
      res.status(404);
      throw new Error('User not found');
    }

    // Check if already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: userToAdd.id,
          projectId: req.params.id,
        },
      },
    });

    if (existingMember) {
      res.status(400);
      throw new Error('User is already a member');
    }

    const newMember = await prisma.projectMember.create({
      data: {
        userId: userToAdd.id,
        projectId: req.params.id,
        role: role || 'MEMBER',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json(newMember);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:memberId
exports.removeMember = async (req, res, next) => {
  try {
    // Check if current user is admin or is removing themselves
    const currentMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId: req.params.id,
        },
      },
    });

    if (!currentMember) {
      res.status(404);
      throw new Error('Project not found or you are not a member');
    }

    if (currentMember.role !== 'ADMIN' && req.user.id !== req.params.memberId) {
      res.status(403);
      throw new Error('Not authorized to remove members');
    }

    // Prevent removing the owner
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (project.ownerId === req.params.memberId) {
      res.status(400);
      throw new Error('Cannot remove the project owner');
    }

    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId: req.params.memberId,
          projectId: req.params.id,
        },
      },
    });

    res.status(200).json({ userId: req.params.memberId });
  } catch (error) {
    next(error);
  }
};
