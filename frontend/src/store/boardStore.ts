import { create } from "zustand";
import { api } from "../api/client";
import type { Board, List, Card } from "../types";

interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  isLoading: boolean;

  fetchBoards: () => Promise<void>;
  createBoard: (name: string) => Promise<void>;
  fetchBoard: (boardId: string) => Promise<void>;

  createList: (boardId: string, title: string, position: number) => Promise<void>;
  createCard: (data: { listId: string; title: string; position: number }) => Promise<void>;

  moveCard: (cardId: string, toListId: string, newPosition: number) => Promise<void>;
  reorderList: (listId: string, newPosition: number) => Promise<void>;

  updateCardDetails: (
    cardId: string,
    data: {
      title?: string;
      description?: string | null;
      dueDate?: string | null;
      assigneeId?: string | null;
    },
  ) => Promise<void>;

  applyRemoteListCreated: (list: List) => void;
  applyRemoteListUpdated: (list: List) => void;
  applyRemoteListDeleted: (listId: string) => void;
  applyRemoteCardCreated: (card: Card) => void;
  applyRemoteCardUpdated: (card: Card) => void;
  applyRemoteCardDeleted: (cardId: string, listId: string) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  currentBoard: null,
  isLoading: false,

  fetchBoards: async () => {
    set({ isLoading: true });
    const res = await api.get("/api/boards");
    set({ boards: res.data.boards, isLoading: false });
  },

  createBoard: async (name) => {
    const res = await api.post("/api/boards", { name });
    set({ boards: [res.data.board, ...get().boards] });
  },

  fetchBoard: async (boardId) => {
    set({ isLoading: true });
    const res = await api.get(`/api/boards/${boardId}`);
    set({ currentBoard: res.data.board, isLoading: false });
  },

  createList: async (boardId, title, position) => {
    const res = await api.post(`/api/boards/${boardId}/lists`, { title, position });
    const board = get().currentBoard;
    if (!board) return;
    const newList: List = { ...res.data.list, cards: [] };
    set({ currentBoard: { ...board, lists: [...(board.lists || []), newList] } });
  },

  createCard: async (data) => {
    const res = await api.post("/api/cards", data);
    const board = get().currentBoard;
    if (!board) return;
    const newCard: Card = res.data.card;
    const lists = (board.lists || []).map((list) =>
      list.id === newCard.listId ? { ...list, cards: [...list.cards, newCard] } : list,
    );
    set({ currentBoard: { ...board, lists } });
  },

  moveCard: async (cardId, toListId, newPosition) => {
    const board = get().currentBoard;
    if (!board || !board.lists) return;

    const snapshot = board;

    let movedCard: Card | undefined;
    const listsWithoutCard = board.lists.map((list) => {
      const found = list.cards.find((c) => c.id === cardId);
      if (found) movedCard = found;
      return { ...list, cards: list.cards.filter((c) => c.id !== cardId) };
    });

    if (!movedCard) return;

    const updatedCard = { ...movedCard, listId: toListId, position: newPosition };
    const newLists = listsWithoutCard.map((list) =>
      list.id === toListId
        ? { ...list, cards: [...list.cards, updatedCard].sort((a, b) => a.position - b.position) }
        : list,
    );

    set({ currentBoard: { ...board, lists: newLists } });

    try {
      await api.patch(`/api/cards/${cardId}`, { listId: toListId, position: newPosition });
    } catch (err) {
      set({ currentBoard: snapshot });
      throw err;
    }
  },

  reorderList: async (listId, newPosition) => {
    const board = get().currentBoard;
    if (!board || !board.lists) return;

    const snapshot = board;
    const newLists = board.lists
      .map((list) => (list.id === listId ? { ...list, position: newPosition } : list))
      .sort((a, b) => a.position - b.position);

    set({ currentBoard: { ...board, lists: newLists } });

    try {
      await api.patch(`/api/boards/${board.id}/lists/${listId}`, { position: newPosition });
    } catch (err) {
      set({ currentBoard: snapshot });
      throw err;
    }
  },

  updateCardDetails: async (cardId, data) => {
    const board = get().currentBoard;
    if (!board || !board.lists) return;

    const snapshot = board;
    const lists = board.lists.map((list) => ({
      ...list,
      cards: list.cards.map((c) => (c.id === cardId ? { ...c, ...data } : c)),
    }));
    set({ currentBoard: { ...board, lists } });

    try {
      const res = await api.patch(`/api/cards/${cardId}`, data);
      const updatedCard: Card = res.data.card;
      const finalLists = get().currentBoard!.lists!.map((list) => ({
        ...list,
        cards: list.cards.map((c) => (c.id === cardId ? updatedCard : c)),
      }));
      set({ currentBoard: { ...get().currentBoard!, lists: finalLists } });
    } catch (err) {
      set({ currentBoard: snapshot });
      throw err;
    }
  },

  applyRemoteListCreated: (list) => {
    const board = get().currentBoard;
    if (!board || board.id !== list.boardId) return;
    if (board.lists?.some((l) => l.id === list.id)) return;
    set({
      currentBoard: {
        ...board,
        lists: [...(board.lists || []), { ...list, cards: list.cards || [] }].sort(
          (a, b) => a.position - b.position,
        ),
      },
    });
  },

  applyRemoteListUpdated: (list) => {
    const board = get().currentBoard;
    if (!board || !board.lists) return;
    const lists = board.lists
      .map((l) => (l.id === list.id ? { ...l, title: list.title, position: list.position } : l))
      .sort((a, b) => a.position - b.position);
    set({ currentBoard: { ...board, lists } });
  },

  applyRemoteListDeleted: (listId) => {
    const board = get().currentBoard;
    if (!board || !board.lists) return;
    set({ currentBoard: { ...board, lists: board.lists.filter((l) => l.id !== listId) } });
  },

  applyRemoteCardCreated: (card) => {
    const board = get().currentBoard;
    if (!board || !board.lists) return;
    const lists = board.lists.map((list) => {
      if (list.id !== card.listId) return list;
      if (list.cards.some((c) => c.id === card.id)) return list;
      return { ...list, cards: [...list.cards, card].sort((a, b) => a.position - b.position) };
    });
    set({ currentBoard: { ...board, lists } });
  },

  applyRemoteCardUpdated: (card) => {
    const board = get().currentBoard;
    if (!board || !board.lists) return;

    const listsWithoutCard = board.lists.map((list) => ({
      ...list,
      cards: list.cards.filter((c) => c.id !== card.id),
    }));

    const lists = listsWithoutCard.map((list) =>
      list.id === card.listId
        ? { ...list, cards: [...list.cards, card].sort((a, b) => a.position - b.position) }
        : list,
    );

    set({ currentBoard: { ...board, lists } });
  },

  applyRemoteCardDeleted: (cardId, listId) => {
    const board = get().currentBoard;
    if (!board || !board.lists) return;
    const lists = board.lists.map((list) =>
      list.id === listId ? { ...list, cards: list.cards.filter((c) => c.id !== cardId) } : list,
    );
    set({ currentBoard: { ...board, lists } });
  },
}));