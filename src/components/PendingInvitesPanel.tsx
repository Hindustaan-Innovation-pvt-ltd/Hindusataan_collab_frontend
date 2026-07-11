import React, { useEffect, useState } from "react";
import { Check, X, Bell } from "lucide-react";
import { collaborationService } from "../services/collaborationService";
import type { Invite } from "../types";
import { toast } from "sonner";

export function PendingInvitesPanel() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadInvites();
    }
  }, [open]);

  const loadInvites = async () => {
    try {
      setLoading(true);
      const data = await collaborationService.getPendingInvites();
      setInvites(data);
    } catch (err) {
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await collaborationService.acceptInvite(id);
      toast.success("Invitation accepted!");
      setInvites(p => p.filter(i => i.id !== id));
      // Refresh to fetch the new board if on dashboard, or user can navigate manually
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept invite");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await collaborationService.rejectInvite(id);
      toast.success("Invitation rejected");
      setInvites(p => p.filter(i => i.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject invite");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors relative ${open ? "bg-amber-50 text-amber-500" : "text-muted-foreground hover:bg-muted"}`}
      >
        <Bell size={18} />
        {invites.length > 0 && !open && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {open && (
        <div className="absolute top-10 right-0 bg-card rounded-xl shadow-xl border border-border p-3 w-72 z-50">
          <h3 className="font-bold text-sm text-foreground mb-2 border-b border-border pb-2">Pending Invitations</h3>
          
          {loading ? (
            <div className="text-center py-4 text-xs text-gray-400">Loading...</div>
          ) : invites.length === 0 ? (
            <div className="text-center py-4 text-xs text-gray-400">No pending invitations</div>
          ) : (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {invites.map(inv => (
                <div key={inv.id} className="p-2 bg-background rounded-lg border border-border flex flex-col gap-2">
                  <div className="text-xs text-foreground">
                    <span className="font-semibold text-foreground">Someone</span> invited you to a board.
                  </div>
                  <div className="text-[10px] text-muted-foreground bg-card px-2 py-1 rounded border border-border inline-block">
                    Role: <span className="font-bold uppercase text-foreground">{inv.role}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleAccept(inv.id!)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1.5 rounded transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(inv.id!)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-foreground text-xs font-semibold py-1.5 rounded transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
