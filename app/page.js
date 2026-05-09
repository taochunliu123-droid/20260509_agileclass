'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Utility functions
const generateId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const isWorkdayStale = (movedToSprintAt) => {
  if (!movedToSprintAt) return false;
  const now = new Date();
  const moved = new Date(movedToSprintAt);
  const diffMs = now - moved;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  // Simple approximation: 3 calendar days ≈ ~2.1 workdays (3 * 5/7)
  return diffDays > 3;
};

const initialTasks = [
  {
    id: generateId(),
    title: '用戶登入功能',
    assignee: '張小明',
    type: 'Feature',
    status: 'Backlog',
    createdAt: new Date().toISOString(),
    movedToSprintAt: null,
    completedAt: null,
  },
  {
    id: generateId(),
    title: '修復購物車計算錯誤',
    assignee: '李小華',
    type: 'Bug',
    status: 'Sprint',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    movedToSprintAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: null,
  },
  {
    id: generateId(),
    title: '支付閘道安全性漏洞',
    assignee: '王大力',
    type: 'Hotfix',
    status: 'Sprint',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    movedToSprintAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: null,
  },
  {
    id: generateId(),
    title: '優化資料庫查詢效能',
    assignee: '陳美美',
    type: 'Feature',
    status: 'Done',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    movedToSprintAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// SortableTask Component
function SortableTask({ task, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeColors = {
    Feature: 'bg-blue-500',
    Bug: 'bg-red-500',
    Hotfix: 'bg-orange-500',
  };

  const isStale = task.status === 'Sprint' && isWorkdayStale(task.movedToSprintAt);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing border-2 ${
        isStale ? 'border-amber-400' : 'border-transparent'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`${typeColors[task.type]} text-white text-xs px-2 py-1 rounded-full font-medium`}>
          {task.type}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          ×
        </button>
      </div>
      <h3 className="font-semibold text-gray-800 mb-2 leading-tight">{task.title}</h3>
      <div className="flex items-center text-sm text-gray-600">
        <span className="mr-1">👤</span>
        <span>{task.assignee}</span>
      </div>
      {task.status !== 'Backlog' && (
        <div className="mt-2 text-xs text-gray-500">
          {task.status === 'Sprint' && task.movedToSprintAt && (
            <div>📅 {new Date(task.movedToSprintAt).toLocaleDateString('zh-TW')}</div>
          )}
          {task.status === 'Done' && task.completedAt && (
            <div>✅ {new Date(task.completedAt).toLocaleDateString('zh-TW')}</div>
          )}
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(task);
        }}
        className="mt-3 text-xs text-blue-600 hover:text-blue-800 transition-colors"
      >
        編輯
      </button>
    </div>
  );
}

// TaskCard Component (for DragOverlay)
function TaskCard({ task }) {
  const typeColors = {
    Feature: 'bg-blue-500',
    Bug: 'bg-red-500',
    Hotfix: 'bg-orange-500',
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-lg border-2 border-gray-300 w-72">
      <div className="flex items-start justify-between mb-2">
        <span className={`${typeColors[task.type]} text-white text-xs px-2 py-1 rounded-full font-medium`}>
          {task.type}
        </span>
      </div>
      <h3 className="font-semibold text-gray-800 mb-2">{task.title}</h3>
      <div className="flex items-center text-sm text-gray-600">
        <span className="mr-1">👤</span>
        <span>{task.assignee}</span>
      </div>
    </div>
  );
}

// Main App Component
export default function ProductDevBoard() {
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    assignee: '',
    type: 'Feature',
  });
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load tasks from LocalStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('productDevTasks');
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
      } catch (e) {
        setTasks(initialTasks);
      }
    } else {
      setTasks(initialTasks);
    }
  }, []);

  // Save tasks to LocalStorage whenever they change
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('productDevTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overContainer = over.id;

    if (activeTask && ['Backlog', 'Sprint', 'Done'].includes(overContainer)) {
      const newStatus = overContainer;
      const now = new Date().toISOString();

      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.id === activeTask.id) {
            const updates = { status: newStatus };

            if (newStatus === 'Sprint' && task.status !== 'Sprint') {
              updates.movedToSprintAt = now;
            } else if (newStatus === 'Done' && task.status !== 'Done') {
              updates.completedAt = now;
            } else if (newStatus === 'Backlog') {
              updates.movedToSprintAt = null;
              updates.completedAt = null;
            }

            return { ...task, ...updates };
          }
          return task;
        })
      );
    }
  };

  const handleAddTask = () => {
    if (!formData.title.trim() || !formData.assignee.trim()) {
      alert('請填寫任務標題和負責人');
      return;
    }

    if (editingTask) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingTask.id
            ? { ...task, title: formData.title, assignee: formData.assignee, type: formData.type }
            : task
        )
      );
    } else {
      const newTask = {
        id: generateId(),
        title: formData.title,
        assignee: formData.assignee,
        type: formData.type,
        status: 'Backlog',
        createdAt: new Date().toISOString(),
        movedToSprintAt: null,
        completedAt: null,
      };
      setTasks((prev) => [...prev, newTask]);
    }

    setFormData({ title: '', assignee: '', type: 'Feature' });
    setShowModal(false);
    setEditingTask(null);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      assignee: task.assignee,
      type: task.type,
    });
    setShowModal(true);
  };

  const handleDeleteTask = (id) => {
    if (confirm('確定要刪除此任務嗎？')) {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          setTasks(imported);
          alert('匯入成功！');
        } else {
          alert('檔案格式錯誤');
        }
      } catch (error) {
        alert('匯入失敗：' + error.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = () => {
    if (confirm('確定要清空所有任務嗎？此操作無法復原。')) {
      setTasks([]);
      localStorage.removeItem('productDevTasks');
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || task.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTasksByStatus = (status) => filteredTasks.filter((task) => task.status === status);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <style jsx global>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in {
          animation: slideInUp 0.3s ease-out;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
            🎯 Product Dev Board
          </h1>
          
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={() => {
                setEditingTask(null);
                setFormData({ title: '', assignee: '', type: 'Feature' });
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + 新增任務
            </button>

            <input
              type="text"
              placeholder="🔍 搜尋任務..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">📊 全部類型</option>
              <option value="Feature">Feature</option>
              <option value="Bug">Bug</option>
              <option value="Hotfix">Hotfix</option>
            </select>

            <button
              onClick={handleExport}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              💾 匯出
            </button>

            <label className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer">
              📥 匯入
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button
              onClick={handleClearAll}
              className="border border-red-300 hover:bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              🗑️ 清空
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Backlog', 'Sprint', 'Done'].map((status) => (
              <div key={status} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 min-h-[500px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">{status}</h2>
                  <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full font-medium">
                    {getTasksByStatus(status).length}
                  </span>
                </div>

                <SortableContext items={getTasksByStatus(status).map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div
                    id={status}
                    className="space-y-3 min-h-[400px] border-2 border-dashed border-gray-200 rounded-xl p-3"
                  >
                    {getTasksByStatus(status).map((task) => (
                      <SortableTask key={task.id} task={task} onEdit={handleEditTask} onDelete={handleDeleteTask} />
                    ))}
                  </div>
                </SortableContext>
              </div>
            ))}
          </div>

          <DragOverlay>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>
        </DndContext>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-slide-in">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              {editingTask ? '編輯任務' : '新增任務'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">任務標題</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：實作用戶登入功能"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">負責人</label>
                <input
                  type="text"
                  value={formData.assignee}
                  onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：張小明"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">任務類型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Feature">Feature</option>
                  <option value="Bug">Bug</option>
                  <option value="Hotfix">Hotfix</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddTask}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {editingTask ? '更新' : '新增'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTask(null);
                  setFormData({ title: '', assignee: '', type: 'Feature' });
                }}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
