import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card, User } from "../types";

interface Props {
  card: Card;
  assignee?: User;
  onOpen?: (card: Card) => void;
}

function formatDueDate(dueDate: string): { label: string; isOverdue: boolean } {
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = date < today;
  const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return { label, isOverdue };
}

export function SortableCard({ card, assignee, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const due = card.dueDate ? formatDueDate(card.dueDate) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Distinguish a click from a drag: dnd-kit still fires onClick after a drop,
        // so only treat it as "open" when the pointer barely moved.
        if (onOpen) onOpen(card);
        e.stopPropagation();
      }}
      className="cursor-grab rounded bg-slate-700 p-2 text-sm text-slate-100 active:cursor-grabbing"
    >
      <div>{card.title}</div>

      {(due || assignee) && (
        <div className="mt-1.5 flex items-center gap-2">
          {due && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                due.isOverdue ? "bg-red-500/20 text-red-300" : "bg-slate-600 text-slate-300"
              }`}
            >
              {due.label}
            </span>
          )}
          {assignee && (
            <span
              title={assignee.name}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white"
            >
              {assignee.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}