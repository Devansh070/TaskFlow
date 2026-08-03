export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Board {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  lists?: List[];
  members?: { user: User }[];
}

export interface List {
  id: string;
  boardId: string;
  title: string;
  position: number;
  cards: Card[];
}

export interface Card {
  id: string;
  listId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  assigneeId?: string | null;
  position: number;
}

export interface ActivityLogEntry {
  id: string;
  boardId: string;
  userId: string;
  action: string;
  targetType: "BOARD" | "LIST" | "CARD";
  targetId: string;
  createdAt: string;
  user: { id: string; name: string };
}