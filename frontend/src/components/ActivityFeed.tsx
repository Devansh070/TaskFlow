import { useEffect } from "react";
import { useActivityStore } from "../store/activityStore";

export function ActivityFeed({ boardId }: { boardId: string }) {
  const entries = useActivityStore((state) => state.entries);
  const fetchActivity = useActivityStore((state) => state.fetchActivity);
  const clear = useActivityStore((state) => state.clear);

  useEffect(() => {
    fetchActivity(boardId);
    return () => clear();
  }, [boardId, fetchActivity, clear]);

  return (
    <div className="w-64 shrink-0 rounded-lg bg-slate-800 p-3">
      <h2 className="mb-3 font-semibold text-white">Activity</h2>
      <div className="max-h-[70vh] space-y-2 overflow-y-auto">
        {entries.map((entry) => (
          <div key={entry.id} className="text-xs text-slate-400">
            <span className="text-slate-200">{entry.action}</span>
            <div className="mt-0.5 text-slate-500">
              {new Date(entry.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-xs text-slate-500">No activity yet.</p>
        )}
      </div>
    </div>
  );
}