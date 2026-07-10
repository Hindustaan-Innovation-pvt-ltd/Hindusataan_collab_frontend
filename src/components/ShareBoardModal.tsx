import { useState, useEffect } from "react";
import { Link as LinkIcon, X, Check, Lock, ChevronRight } from "lucide-react";
import { collaborationService } from '../services/collaborationService';
import type { Collaborator } from '../types';
import { toast } from 'sonner';

interface ShareBoardModalProps {
  boardId: string;
  onClose: () => void;
}

export function ShareBoardModal({ boardId, onClose }: ShareBoardModalProps) {
  const [copyStatus, setCopyStatus] = useState("Copy link");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitedUsers, setInvitedUsers] = useState<Collaborator[]>([]);
  const [linkAccess, setLinkAccess] = useState<"invited" | "anyone">("invited");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCollaborators();
  }, [boardId]);

  const fetchCollaborators = async () => {
    try {
      const data = await collaborationService.getCollaborators(boardId);
      setInvitedUsers(data);
    } catch (err) {
      console.error("Failed to fetch collaborators:", err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyStatus("Copied!");
    setTimeout(() => setCopyStatus("Copy link"), 2000);
  };

  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  const emails = inviteEmail.split(",").map(e => e.trim()).filter(Boolean);
  const isInviteEnabled = emails.length > 0 && emails.every(isValidEmail);

  const handleInvite = async () => {
    if (!isInviteEnabled) return;
    setLoading(true);
    try {
      for (const email of emails) {
        await collaborationService.inviteCollaborator(boardId, email, "editor");
      }
      setInviteEmail("");
      toast.success("Invitations sent successfully!");
      fetchCollaborators();
    } catch (err: any) {
      console.error("Invite failed:", err);
      toast.error(err.message || "Failed to send some invitations.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      if (newRole === "remove") {
        await collaborationService.removeCollaborator(boardId, userId);
        toast.success("Collaborator removed");
      } else {
        await collaborationService.updateCollaboratorRole(boardId, userId, newRole);
        toast.success("Role updated");
      }
      fetchCollaborators();
    } catch (err) {
      console.error("Role update failed:", err);
      toast.error("Failed to update role");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300 pointer-events-auto">
      <div className="flex flex-col gap-3 max-w-[500px] w-full animate-in fade-in zoom-in duration-200">
        <div className="bg-card rounded-[24px] shadow-2xl border border-border p-6 flex flex-col text-foreground">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-foreground text-lg">Share this board</h2>
            <div className="flex items-center gap-4">
              <button onClick={handleCopyLink} className="flex items-center gap-1.5 text-sm font-semibold text-[#7B61FF] hover:text-[#6B4FF0] transition-colors">
                {copyStatus === "Copied!" ? <><Check size={15} /><span>Copied!</span></> : <><LinkIcon size={15} /><span>Copy link</span></>}
              </button>
              <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-gray-400 hover:text-muted-foreground transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Email Input Invite */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Add comma separated emails to invite"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                className="w-full h-10 px-3.5 rounded-xl border border-border focus:border-[#7B61FF] focus:ring-1 focus:ring-[#7B61FF] outline-none text-sm text-foreground placeholder-gray-400 transition-all"
              />
            </div>
            <button
              onClick={handleInvite}
              disabled={!isInviteEnabled || loading}
              className={`h-10 px-5 rounded-xl text-sm font-bold transition-all ${(isInviteEnabled && !loading) ? "bg-[#7B61FF] text-white hover:bg-[#6B4FF0] active:scale-95 cursor-pointer" : "bg-[#E6E6E6] text-[#B3B3B3] cursor-not-allowed"}`}
            >
              {loading ? "Inviting..." : "Invite"}
            </button>
          </div>

          {/* Who has access */}
          <div className="flex flex-col">
            <h3 className="text-muted-foreground font-semibold text-xs mb-3 tracking-wide">Who has access</h3>
            
            <div onClick={() => setLinkAccess(p => p === "invited" ? "anyone" : "invited")} className="flex items-center justify-between py-2.5 px-1.5 rounded-xl hover:bg-background cursor-pointer transition-colors group">
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground group-hover:bg-muted">
                  <Lock size={15} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground">Only invited people</div>
                  <div className="text-xs text-gray-400">{linkAccess === "invited" ? "Private board" : "Anyone with access can join"}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {linkAccess === "invited" && <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Active</span>}
                <ChevronRight size={15} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Invited Users Rows */}
            {invitedUsers.map((user) => (
              <div key={user.user_id} className="flex items-center justify-between py-2.5 px-1.5 border-t border-gray-50 hover:bg-background/50 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold">
                    U
                  </div>
                  <div className="text-left max-w-[200px] truncate">
                    <div className="text-sm font-semibold text-foreground truncate">
                      User {user.user_id.slice(-4)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                    disabled={user.role === "owner"}
                    className="bg-transparent border-none text-xs font-medium text-muted-foreground hover:text-foreground outline-none cursor-pointer pr-1"
                  >
                    <option value="owner">owner</option>
                    <option value="editor">can edit</option>
                    <option value="viewer">can view</option>
                    {user.role !== "owner" && <option value="remove">remove</option>}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
