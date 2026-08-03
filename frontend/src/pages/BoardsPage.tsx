import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useBoardStore } from "../store/boardStore";
import { useAuthStore } from "../store/authStore";

export function BoardsPage() {
  const boards = useBoardStore((state) => state.boards);
  const fetchBoards = useBoardStore((state) => state.fetchBoards);
  const createBoard = useBoardStore((state) => state.createBoard);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [newBoardName, setNewBoardName] = useState("");

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    await createBoard(newBoardName.trim());
    setNewBoardName("");
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Your boards</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user?.name}</span>
            <button
              onClick={() => logout()}
              className="text-sm text-slate-400 hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>

        <form onSubmit={handleCreate} className="mb-6 flex gap-2">
          <input
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="New board name"
            className="flex-1 rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
          >
            Create board
          </button>
        </form>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {boards.map((board) => (
            <Link
              key={board.id}
              to={`/boards/${board.id}`}
              className="rounded-lg bg-slate-800 p-5 shadow hover:bg-slate-700"
            >
              <h2 className="font-semibold text-white">{board.name}</h2>
            </Link>
          ))}
        </div>

        {boards.length === 0 && (
          <p className="text-slate-500">No boards yet — create your first one above.</p>
        )}
      </div>
    </div>
  );
}