import { useNavigate } from 'react-router';
import type { Board } from '../types';

interface BoardCardProps {
  board: Board;
  onDelete: (id: string) => void;
}

export function BoardCard({ board, onDelete }: BoardCardProps) {
  const navigate = useNavigate();

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-card flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold truncate">{board.name || 'Untitled Board'}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Last updated: {new Date(board.updatedAt).toLocaleDateString()}
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
