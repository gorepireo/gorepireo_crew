import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Notification } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Bell, CheckCheck, Clock } from 'lucide-react';

export const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAll = async () => {
    try {
      await api.markAllNotificationsRead();
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <LoadingSpinner message="Loading notifications..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications & Alerts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time notifications for assignments, attendance, corrections, and alerts
          </p>
        </div>

        <button
          onClick={handleMarkAll}
          className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
        >
          <CheckCheck className="w-4 h-4 text-blue-600" />
          Mark All Read
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No active notifications at this time.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.notificationId}
              className={`p-4 transition-colors flex items-start gap-3.5 ${
                !n.read ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  !n.read ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Bell className="w-4 h-4" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  <span className="text-3xs text-slate-400 font-mono">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-2xs text-slate-600">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
