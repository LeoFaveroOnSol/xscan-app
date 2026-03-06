'use client';

import { useEffect, useState, useCallback } from 'react';

const API = '/api/mc';

interface Task {
  id: number;
  title: string;
  desc?: string;
  status: string;
  agent?: string;
  tags?: string[];
  created: number;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  emoji: string;
  status: string;
  type: string;
  color: string;
  services?: any[];
}

interface SystemStats {
  loadAvg: number;
  memTotal: number;
  memUsed: number;
  memPercent: number;
  uptime: number;
}

const STATUS_COLS = ['inbox', 'assigned', 'in_progress', 'review', 'done'] as const;
const STATUS_LABELS: Record<string, string> = {
  inbox: '📥 Inbox',
  assigned: '📋 Assigned',
  in_progress: '🔨 In Progress',
  review: '🔍 Review',
  done: '✅ Done',
};

const STATUS_COLORS: Record<string, string> = {
  inbox: '#666',
  assigned: '#FF9800',
  in_progress: '#5865F2',
  review: '#E91E63',
  done: '#00d68f',
};

export default function MissionControlPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [system, setSystem] = useState<SystemStats | null>(null);
  const [error, setError] = useState('');
  const [dragId, setDragId] = useState<number | null>(null);
  const [showDone, setShowDone] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API}?path=/api/status`);
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      setTasks(data.tasks || []);
      setAgents((data.agents || []).filter((a: Agent) => a.type !== 'SVC'));
      setSystem(data.system);
      setError('');
    } catch {
      setError('Cannot connect to Mission Control API');
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 15000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      await fetch(`${API}?path=/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch {}
  };

  const formatUptime = (s: number) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    return d > 0 ? `${d}d ${h}h` : `${h}h`;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-2xl mb-2">🎛️</p>
          <p className="text-red-400 font-medium">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Make sure Mission Control is running on the VPS (port 3091)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🎛️ Mission Control
          </h1>
          <p className="text-sm text-gray-500 mt-1">Agent orchestrator & task management</p>
        </div>
        {system && (
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold">{system.loadAvg.toFixed(2)}</div>
              <div className="text-xs text-gray-500">CPU Load</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{system.memPercent}%</div>
              <div className="text-xs text-gray-500">Memory</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{formatUptime(system.uptime)}</div>
              <div className="text-xs text-gray-500">Uptime</div>
            </div>
          </div>
        )}
      </div>

      {/* Agents */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {agents.map((a) => (
          <div
            key={a.id}
            className="rounded-lg p-3 border border-white/10"
            style={{ background: `${a.color}15` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{a.emoji}</span>
              <span className="font-semibold text-sm">{a.name}</span>
              <span
                className="w-2 h-2 rounded-full ml-auto"
                style={{
                  background: a.status === 'online' ? '#00d68f' : a.status === 'working' ? '#5865F2' : '#666',
                }}
              />
            </div>
            <div className="text-xs text-gray-400">{a.role}</div>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-lg font-bold">Tasks</h2>
        <button
          onClick={() => setShowDone(!showDone)}
          className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
        >
          {showDone ? 'Hide Done' : `Show Done (${tasks.filter(t => t.status === 'done').length})`}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {STATUS_COLS.filter(col => col !== 'done' || showDone).map((col) => {
          const colTasks = tasks.filter((t) => t.status === col);
          return (
            <div
              key={col}
              className="rounded-xl border border-white/10 p-3 min-h-[200px]"
              style={{ background: 'rgba(255,255,255,0.02)' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId !== null) {
                  updateTaskStatus(dragId, col);
                  setDragId(null);
                }
              }}
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: STATUS_COLORS[col] }}
                />
                <span className="text-sm font-semibold">{STATUS_LABELS[col]}</span>
                <span className="text-xs text-gray-500 ml-auto">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragId(task.id)}
                    className="rounded-lg p-3 border border-white/10 cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <div className="font-medium text-sm mb-1">{task.title}</div>
                    {task.desc && (
                      <div className="text-xs text-gray-400 mb-2 line-clamp-2">{task.desc}</div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.agent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                          {task.agent}
                        </span>
                      )}
                      {task.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
