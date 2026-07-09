import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { boardService } from '../services/boardService';
import { BoardCard } from '../components/BoardCard';
import type { BoardMeta } from '../types';

export default function DashboardPage() {
  const [boards, setBoards] = useState<BoardMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const data = await boardService.getBoards();
      setBoards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    try {
      const name = prompt('Enter board name:', 'Untitled Board');
      if (name === null) return;
      const boardId = await boardService.createBoard(name);
      navigate(`/board/${boardId}`);
    } catch (err) {
      alert('Failed to create board');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this board?')) return;
    try {
      await boardService.deleteBoard(id);
      fetchBoards();
    } catch (err) {
      alert('Failed to delete board');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Boards</h1>
          <button
            onClick={handleCreateBoard}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            + New Board
          </button>
        </div>

        {error && <div className="text-red-600 mb-4">{error}</div>}

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading boards...</div>
        ) : boards.length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-white rounded-lg border">
            No boards found. Create one to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {boards.map(board => (
              <BoardCard key={board.id} board={board} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
