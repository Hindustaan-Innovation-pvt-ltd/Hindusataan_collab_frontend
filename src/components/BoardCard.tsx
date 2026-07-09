import React from 'react';
import { useNavigate } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card'; // Assuming shadcn UI or similar is used, I will just use basic html if this fails. Let's use basic html for now to be safe.
import type { BoardMeta } from '../types';

interface BoardCardProps {
  board: BoardMeta;
  onDelete: (id: string) => void;
}

export function BoardCard({ board, onDelete }: BoardCardProps) {
  const navigate = useNavigate();

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold truncate">{board.name || 'Untitled Board'}</h3>
        <p className="text-sm text-gray-500 mt-1">
          Created: {new Date(board.created_at).toLocaleDateString()}
        </p>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => navigate(`/board/${board.id}`)}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 flex-1"
        >
          Open
        </button>
        <button
          onClick={() => onDelete(board.id)}
          className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-sm hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
