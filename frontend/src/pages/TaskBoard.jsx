import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Plus, MoreHorizontal, Trash2, Calendar, Edit2, X } from 'lucide-react';

const TaskBoard = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', assigneeId: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [tasksRes, projectRes] = await Promise.all([
        api.get(`/api/tasks/project/${id}`),
        api.get(`/api/projects/${id}`)
      ]);
      setTasks(tasksRes.data);
      setProject(projectRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/api/tasks', { ...newTask, projectId: id });
      setTasks([data, ...tasks]);
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', assigneeId: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { data } = await api.put(`/api/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? data : t));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center">Loading board...</div>;

  const isAdmin = project?.members?.find(m => m.userId === user?.id)?.role === 'ADMIN' || project?.ownerId === user?.id;

  const columns = [
    { title: 'To Do', status: 'TODO', color: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
    { title: 'In Progress', status: 'IN_PROGRESS', color: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
    { title: 'Done', status: 'DONE', color: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' }
  ];

  return (
    <div className="h-full flex flex-col max-w-full overflow-hidden">
      <div className="flex items-center text-sm text-gray-500 gap-2 mb-2 shrink-0">
        <Link to={`/projects/${id}`} className="hover:text-indigo-600 flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to {project?.name}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {columns.map(col => (
          <div key={col.status} className="flex flex-col min-w-[320px] max-w-[320px] bg-gray-50/50 rounded-xl border border-gray-200">
            <div className={`p-4 border-b-2 ${col.color} bg-white rounded-t-xl flex justify-between items-center`}>
              <h3 className={`font-bold ${col.text}`}>{col.title}</h3>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-semibold">
                {tasks.filter(t => t.status === col.status).length}
              </span>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {tasks.filter(t => t.status === col.status).map(task => (
                <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-300 transition-colors group cursor-pointer relative">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                      task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                      task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {task.priority}
                    </span>
                    
                    {isAdmin && (
                      <button 
                        onClick={() => handleDelete(task.id)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-4 text-xs font-medium text-gray-500">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-white" title={task.assignee?.name || 'Unassigned'}>
                        {task.assignee?.name ? task.assignee.name.charAt(0).toUpperCase() : '?'}
                      </div>
                    </div>
                  </div>

                  {/* Status Changer overlay */}
                  <div className="absolute inset-x-0 bottom-0 top-0 bg-white/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-2 p-4 border border-indigo-100 z-10 pointer-events-none group-hover:pointer-events-auto">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Move to:</p>
                    <div className="flex flex-col gap-2 w-full">
                      {columns.filter(c => c.status !== task.status).map(c => (
                        <button
                          key={c.status}
                          onClick={() => handleStatusChange(task.id, c.status)}
                          className={`w-full py-1.5 text-xs font-medium rounded-md border ${
                            c.status === 'TODO' ? 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100' :
                            c.status === 'IN_PROGRESS' ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100' :
                            'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {c.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Create New Task</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Title <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="E.g., Update Landing Page"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="Task details..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={newTask.assigneeId}
                      onChange={(e) => setNewTask({...newTask, assigneeId: e.target.value})}
                    >
                      <option value="">Unassigned</option>
                      {project?.members?.map(m => (
                        <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm disabled:bg-indigo-400 transition-colors"
                >
                  {saving ? 'Saving...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
