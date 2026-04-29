# Team Task Manager - Full-Stack Web Application

A full-stack collaborative Team Task Management Web Application. Users can create projects, invite team members, manage task boards (Kanban style), and view analytics through an interactive dashboard. 

## Features

### Authentication Module
- User Signup & Login
- JWT Token Storage & Automatic Interceptors
- Logout Functionality
- Protected Routes (Auth Guard)

### Dashboard Module
- Total Tasks Count
- Completed / In Progress / Overdue Statistics
- Recent Tasks Section
- Tasks By Status Analytics (Interactive Charts)

### Project Management Module
- Create & View All Projects
- Open Detailed Project View
- Add/Remove Members (via Email)
- View All Team Members

### Task Management Module & Kanban
- Create / Edit / Delete Tasks
- Assign Tasks to Specific Users
- Set Task Priority (Low, Medium, High)
- Set Due Dates
- Kanban Board: To Do, In Progress, Done
- Move Tasks Between Statuses (Drag/Click to switch)
- Priority Labels & Assignments

### Role-Based Access Module
- **Admin**: Full Project Access, Manage Members, Create/Delete Tasks, Assign Work.
- **Member**: View Project Information, Update Assigned Task Status.

### UI & UX Components
- Navbar & Sidebar Navigation
- Dynamic Dashboard & Project Cards
- Task Cards with Status Overlays
- Modal Forms & Loading Spinners
- Mobile Responsive Layout (Tailwind CSS)

## Final Frontend Flow
1. **Login / Signup** → 2. **Dashboard** → 3. **Projects** → 4. **Open Project** → 5. **Create / Assign Tasks** → 6. **Update Task Status** → 7. **Track Progress**

## Tech Stack
- **Frontend**: React.js, Vite, Tailwind CSS v4, React Router DOM, Axios, Recharts
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: PostgreSQL / SQLite (for local dev)
- **Deployment**: Railway (Backend), Vercel (Frontend)


## Installation Steps (Local Development)

### 1. Requirements
- Node.js (v18+)
- PostgreSQL installed locally OR a cloud database URL (e.g. Neon, Supabase)

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder based on the `.env.example`:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://username:password@localhost:5432/team_task_manager?schema=public"
   JWT_SECRET="your-super-secret-jwt-key"
   NODE_ENV="development"
   ```
4. Push the Prisma schema to your database to create the required tables:
   ```bash
   npx prisma db push
   # OR: npx prisma migrate dev
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` folder:
   ```env
   VITE_API_URL="http://localhost:5000"
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
5. Open your browser to `http://localhost:3000` (or the port Vite provides) to view the app!

---

## Deployment Steps

This application is designed to be deployed to **Railway** (Backend & DB) and **Vercel** (Frontend).

### 1. Deploying the Database (Railway)
1. Log in to [Railway](https://railway.app/).
2. Create a **New Project** -> **Provision PostgreSQL**.
3. Once provisioned, click on the PostgreSQL service -> **Variables** and copy your `DATABASE_URL`.

### 2. Deploying the Backend (Railway)
1. In the same Railway project, click **New** -> **GitHub Repo** and select this repository.
2. Railway will ask you to set up the Root Directory. Set the **Root Directory** to `/backend`.
3. Go to the new Backend Service -> **Variables** and add:
   - `DATABASE_URL` = (The URL you copied from the Postgres service)
   - `JWT_SECRET` = (A secure random string)
   - `NODE_ENV` = `production`
4. Railway should automatically use `package.json` to start the app. Ensure your `package.json` has `start: node src/index.js` and a post-build or start-up script to run `prisma generate` and `prisma migrate deploy`.
5. Once deployed, copy your Backend Domain (e.g., `https://team-task-manager-api.up.railway.app`).

### 3. Deploying the Frontend (Vercel)
1. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Select this Github repository.
3. In the project settings, set the **Root Directory** to `frontend`.
4. Vercel will automatically detect Vite. 
5. In **Environment Variables**, add:
   - `VITE_API_URL` = (Your Railway Backend Domain)
6. Click **Deploy**. The `vercel.json` file handles all React Router fallback rewrites!

## API Endpoints Summary

### Auth
- `POST /api/auth/signup` - Register a user
- `POST /api/auth/login` - Authenticate & get JWT
- `GET /api/auth/me` - Get current user profile (Protected)

### Projects
- `GET /api/projects` - Get all projects for logged-in user (Protected)
- `POST /api/projects` - Create a project (Protected)
- `GET /api/projects/:id` - Get specific project details (Protected)
- `POST /api/projects/:id/members` - Invite member by email (Protected, Admin Only)
- `DELETE /api/projects/:id/members/:memberId` - Remove member (Protected, Admin Only)

### Tasks
- `GET /api/tasks/project/:projectId` - Get tasks for a project (Protected)
- `POST /api/tasks` - Create task (Protected)
- `PUT /api/tasks/:taskId` - Update task status/details (Protected)
- `DELETE /api/tasks/:taskId` - Delete task (Protected, Admin Only)

### Dashboard
- `GET /api/dashboard` - Get user-wide statistics (Protected)
