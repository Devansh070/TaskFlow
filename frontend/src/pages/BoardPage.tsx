import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useBoardStore } from "../store/boardStore";
import { useActivityStore } from "../store/activityStore";
import { getPositionBetween } from "../lib/position";
import { getSocket } from "../lib/socket";
import { clientId } from "../lib/clientId";
import { SortableList } from "../components/SortableList";
import { SortableCard } from "../components/SortableCard";
import { ActivityFeed } from "../components/ActivityFeed";
import { CardModal } from "../components/CardModal";
import type { Card, List, ActivityLogEntry } from "../types";

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const currentBoard = useBoardStore((state) => state.currentBoard);
  const fetchBoard = useBoardStore((state) => state.fetchBoard);
  const createList = useBoardStore((state) => state.createList);
  const createCard = useBoardStore((state) => state.createCard);
  const moveCard = useBoardStore((state) => state.moveCard);
  const reorderList = useBoardStore((state) => state.reorderList);

  const [newListTitle, setNewListTitle] = useState("");
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [openCard, setOpenCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Fetch the board's data on mount / when boardId changes.
  useEffect(() => {
    if (boardId) fetchBoard(boardId);
  }, [boardId, fetchBoard]);

  // Socket wiring: join the board's room, listen for remote changes, clean up on unmount.
  useEffect(() => {
    if (!boardId) return;

    const socket = getSocket();
    socket.connect();
    socket.emit("board:join", boardId);

    function handleListCreated(msg: { payload: List; originClientId?: string }) {
      if (msg.originClientId === clientId) return;
      useBoardStore.getState().applyRemoteListCreated(msg.payload);
    }
    function handleListUpdated(msg: { payload: List; originClientId?: string }) {
      if (msg.originClientId === clientId) return;
      useBoardStore.getState().applyRemoteListUpdated(msg.payload);
    }
    function handleListDeleted(msg: { payload: { id: string }; originClientId?: string }) {
      if (msg.originClientId === clientId) return;
      useBoardStore.getState().applyRemoteListDeleted(msg.payload.id);
    }
    function handleCardCreated(msg: { payload: Card; originClientId?: string }) {
      if (msg.originClientId === clientId) return;
      useBoardStore.getState().applyRemoteCardCreated(msg.payload);
    }
    function handleCardUpdated(msg: { payload: Card; originClientId?: string }) {
      if (msg.originClientId === clientId) return;
      useBoardStore.getState().applyRemoteCardUpdated(msg.payload);
    }
    function handleCardDeleted(msg: {
      payload: { id: string; listId: string };
      originClientId?: string;
    }) {
      if (msg.originClientId === clientId) return;
      useBoardStore.getState().applyRemoteCardDeleted(msg.payload.id, msg.payload.listId);
    }
    function handleActivityCreated(msg: { payload: ActivityLogEntry; originClientId?: string }) {
      if (msg.originClientId === clientId) return;
      useActivityStore.getState().prependEntry(msg.payload);
    }

    socket.on("list:created", handleListCreated);
    socket.on("list:updated", handleListUpdated);
    socket.on("list:deleted", handleListDeleted);
    socket.on("card:created", handleCardCreated);
    socket.on("card:updated", handleCardUpdated);
    socket.on("card:deleted", handleCardDeleted);
    socket.on("activity:created", handleActivityCreated);

    return () => {
      socket.emit("board:leave", boardId);
      socket.off("list:created", handleListCreated);
      socket.off("list:updated", handleListUpdated);
      socket.off("list:deleted", handleListDeleted);
      socket.off("card:created", handleCardCreated);
      socket.off("card:updated", handleCardUpdated);
      socket.off("card:deleted", handleCardDeleted);
      socket.off("activity:created", handleActivityCreated);
      socket.disconnect();
    };
  }, [boardId]);

  async function handleCreateList(e: FormEvent) {
    e.preventDefault();
    if (!boardId || !newListTitle.trim()) return;
    const lists = currentBoard?.lists || [];
    const lastPosition = lists.length ? lists[lists.length - 1].position : null;
    const position = getPositionBetween(lastPosition, null);
    await createList(boardId, newListTitle.trim(), position);
    setNewListTitle("");
  }

  function handleAddCard(listId: string, title: string) {
    const list = currentBoard?.lists?.find((l) => l.id === listId);
    const lastPosition = list?.cards.length ? list.cards[list.cards.length - 1].position : null;
    const position = getPositionBetween(lastPosition, null);
    createCard({ listId, title, position });
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.type === "card") setActiveCard(data.card);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over || !currentBoard?.lists) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Reordering lists themselves.
    if (activeData?.type === "list" && overData?.type === "list") {
      const lists = currentBoard.lists;
      const oldIndex = lists.findIndex((l) => l.id === active.id);
      const newIndex = lists.findIndex((l) => l.id === over.id);
      if (oldIndex === newIndex) return;

      const reordered = arrayMove(lists, oldIndex, newIndex);
      const targetIndex = reordered.findIndex((l) => l.id === active.id);
      const before = reordered[targetIndex - 1]?.position ?? null;
      const after = reordered[targetIndex + 1]?.position ?? null;
      const newPosition = getPositionBetween(before, after);

      await reorderList(active.id as string, newPosition);
      return;
    }

    // Moving a card, possibly between lists.
    if (activeData?.type === "card") {
      const cardId = active.id as string;
      const targetListId =
        overData?.type === "card" ? overData.card.listId : (over.id as string);

      const targetList = currentBoard.lists.find((l) => l.id === targetListId);
      if (!targetList) return;

      let before: number | null = null;
      let after: number | null = null;

      if (overData?.type === "card") {
        const overIndex = targetList.cards.findIndex((c) => c.id === over.id);
        const overCard = targetList.cards[overIndex];
        before = targetList.cards[overIndex - 1]?.position ?? null;
        after = overCard.position;
      } else {
        // Dropped directly on a list (empty space) — put it at the end.
        before = targetList.cards[targetList.cards.length - 1]?.position ?? null;
        after = null;
      }

      const newPosition = getPositionBetween(before, after);
      await moveCard(cardId, targetListId, newPosition);
    }
  }

  if (!currentBoard) {
    return <div className="min-h-screen bg-slate-900 p-8 text-slate-400">Loading board...</div>;
  }

  const lists = currentBoard.lists || [];
  const members = (currentBoard.members || []).map((m) => m.user);

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/boards" className="text-sm text-slate-400 hover:text-white">
          ← Boards
        </Link>
        <h1 className="text-2xl font-bold text-white">{currentBoard.name}</h1>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 pb-4">
              <SortableContext
                items={lists.map((l) => l.id)}
                strategy={horizontalListSortingStrategy}
              >
                {lists.map((list) => (
                  <SortableList
                    key={list.id}
                    list={list}
                    members={members}
                    onAddCard={handleAddCard}
                    onOpenCard={setOpenCard}
                  />
                ))}
              </SortableContext>

              <form onSubmit={handleCreateList} className="w-72 shrink-0">
                <input
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="Add another list"
                  className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </form>
            </div>

            <DragOverlay>
              {activeCard ? <SortableCard card={activeCard} /> : null}
            </DragOverlay>
          </DndContext>
        </div>

        {boardId && <ActivityFeed boardId={boardId} />}
      </div>

      {openCard && (
        <CardModal card={openCard} members={members} onClose={() => setOpenCard(null)} />
      )}
    </div>
  );
}