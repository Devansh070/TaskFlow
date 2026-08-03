import { type FormEvent, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableCard } from "./SortableCard";
import type { List, Card, User } from "../types";

interface Props {
  list: List;
  members: User[];
  onAddCard: (listId: string, title: string) => void;
  onOpenCard: (card: Card) => void;
}

export function SortableList({ list, members, onAddCard, onOpenCard }: Props) {
  const [newCardTitle, setNewCardTitle] = useState("");

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: list.id,
    data: { type: "list", list },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: list.id,
    data: { type: "list", list },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    onAddCard(list.id, newCardTitle.trim());
    setNewCardTitle("");
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-72 shrink-0 rounded-lg bg-slate-800 p-3"
    >
      <h2
        {...attributes}
        {...listeners}
        className="mb-3 cursor-grab font-semibold text-white active:cursor-grabbing"
      >
        {list.title}
      </h2>

      <div ref={setDroppableRef} className="mb-3 min-h-[8px] space-y-2">
        <SortableContext
          items={list.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {list.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              assignee={members.find((m) => m.id === card.assigneeId)}
              onOpen={onOpenCard}
            />
          ))}
        </SortableContext>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-1">
        <input
          value={newCardTitle}
          onChange={(e) => setNewCardTitle(e.target.value)}
          placeholder="Add card"
          className="flex-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-white outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-500"
        >
          +
        </button>
      </form>
    </div>
  );
}