import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Trash2, CheckCircle2, Circle, Clock, Tag, Calendar, 
  Search, SlidersHorizontal, Upload, Paperclip, AlertTriangle 
} from 'lucide-react';

export default function Tasks({ API_URL, token }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('General');
  const [dueDate, setDueDate] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Errors/Loading
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Categories list
  const categoriesList = ['General', 'Work', 'Personal', 'Security', 'Networking', 'Bugs'];

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tasks.');
      }
      setTasks(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Task Title is required.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          status: 'To Do',
          priority,
          due_date: dueDate,
          category
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task.');
      }

      setTasks([data, ...tasks]);
      setSuccess('Task successfully added!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setCategory('General');
      setDueDate('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, currentStatus) => {
    const nextStatusMap = {
      'To Do': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'To Do'
    };
    
    const newStatus = nextStatusMap[currentStatus];
    const taskToUpdate = tasks.find(t => t.id === id);

    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...taskToUpdate,
          status: newStatus
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status.');
      }

      setTasks(tasks.map(t => t.id === id ? data : t));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete task.');
      }

      setTasks(tasks.filter(t => t.id !== id));
      setSuccess('Task deleted successfully.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileUpload = async (taskId, file) => {
    if (!file) return;
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('attachment', file);

    try {
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'File upload failed.');
      }

      setTasks(tasks.map(t => t.id === taskId ? { ...t, attachment: data.attachment } : t));
      setSuccess('Attachment successfully uploaded!');
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter Tasks locally for instant responsiveness
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
    const matchesCategory = filterCategory === 'All' || task.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || task.status === filterStatus;

    return matchesSearch && matchesPriority && matchesCategory && matchesStatus;
  });

  return (
    <div className="dashboard-grid">
      
      {/* Task Creation Form Panel */}
      <div className="task-form-panel">
        <h3 className="panel-title">
          <PlusCircle size={20} />
          Create Security Task
        </h3>

        {error && (
          <div className="alert error" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert success" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleCreateTask}>
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">Title</label>
            <input
              id="task-title"
              type="text"
              className="form-input select"
              placeholder="e.g. Set up WAF firewall rules"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              className="form-input select"
              placeholder="Provide security implementation details..."
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-priority">Priority</label>
            <select
              id="task-priority"
              className="form-input select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={loading}
            >
              <option value="High">🔴 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-category">Category</label>
            <select
              id="task-category"
              className="form-input select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            >
              {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="task-date">Due Date</label>
            <input
              id="task-date"
              type="date"
              className="form-input select"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            Add New Task
          </button>
        </form>
      </div>

      {/* Task Filters & Card List */}
      <div>
        
        {/* Search, filters line */}
        <div className="tasks-header">
          <div className="search-filter-row">
            <div className="search-input-wrapper">
              <Search size={18} className="input-icon" style={{ left: '0.85rem' }} />
              <input
                type="text"
                className="search-input"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="select-filter"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="High">🔴 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>

            <select
              className="select-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Status Tabs filtering */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.75rem' }}>
          {['All', 'To Do', 'In Progress', 'Completed'].map(status => (
            <button
              key={status}
              className="btn-secondary"
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                border: filterStatus === status ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                color: filterStatus === status ? 'var(--primary)' : 'var(--text-secondary)',
                background: filterStatus === status ? 'rgba(56, 189, 248, 0.05)' : 'none'
              }}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Task Cards Grid */}
        <div className="tasks-list-grid">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">No Tasks Found</p>
              <p className="empty-state-text">Create a security task or adjust your search filters to get started.</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div className="task-card" key={task.id}>
                
                <div>
                  <div className="task-card-header">
                    <h4 className={`task-card-title ${task.status === 'Completed' ? 'completed' : ''}`}>
                      {task.title}
                    </h4>
                    <span 
                      className={`task-priority-dot ${
                        task.priority === 'High' ? 'priority-high-bg' :
                        task.priority === 'Medium' ? 'priority-medium-bg' : 'priority-low-bg'
                      }`}
                      title={`${task.priority} Priority`}
                    />
                  </div>

                  <p className="task-card-body">{task.description}</p>
                  
                  {/* Meta badges */}
                  <div className="task-card-meta">
                    <span className="meta-badge category">
                      <Tag size={12} />
                      {task.category}
                    </span>
                    {task.due_date && (
                      <span className="meta-badge due">
                        <Calendar size={12} />
                        {task.due_date}
                      </span>
                    )}
                    <span className={`meta-badge status ${task.status.toLowerCase().replace(' ', '')}`}>
                      {task.status === 'Completed' && <CheckCircle2 size={12} />}
                      {task.status === 'In Progress' && <Clock size={12} />}
                      {task.status === 'To Do' && <Circle size={12} />}
                      {task.status}
                    </span>
                  </div>

                  {/* Attachment links */}
                  {task.attachment ? (
                    <div className="attachment-link-container">
                      <a 
                        href={`${API_URL}/${task.attachment}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="attachment-link"
                      >
                        <Paperclip size={14} />
                        <span>View Attachment</span>
                      </a>
                    </div>
                  ) : (
                    /* Simple Upload Trigger */
                    <div className="upload-in-card">
                      <label htmlFor={`upload-${task.id}`}>
                        <Upload size={14} />
                        <span>Attach File (Images/PDFs)</span>
                        <input
                          id={`upload-${task.id}`}
                          type="file"
                          onChange={(e) => handleFileUpload(task.id, e.target.files[0])}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Task actions */}
                <div className="task-card-actions">
                  <button 
                    className="btn-icon"
                    title={`Change Status (Current: ${task.status})`}
                    onClick={() => handleUpdateStatus(task.id, task.status)}
                  >
                    {task.status === 'Completed' ? (
                      <Circle size={18} style={{ color: 'var(--text-muted)' }} />
                    ) : task.status === 'In Progress' ? (
                      <CheckCircle2 size={18} style={{ color: 'var(--priority-low)' }} />
                    ) : (
                      <Clock size={18} style={{ color: 'var(--status-inprogress)' }} />
                    )}
                  </button>

                  <button 
                    className="btn-icon" 
                    title="Delete Security Task"
                    style={{ color: 'rgba(244, 63, 94, 0.6)' }}
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
