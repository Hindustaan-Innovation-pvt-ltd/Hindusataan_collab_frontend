import { useState, useEffect, useCallback } from 'react';
import { collaborationService } from '../services/collaborationService';

export function useShareDialog(currentBoardId: string, boardName: string, showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void) {
  const [shareOpen, setShareOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState("Copy link");
  const [inviteEmail, setInviteEmail] = useState("");
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [linkAccess, setLinkAccess] = useState<"invited" | "anyone">("invited");
  const [classroomShared, setClassroomShared] = useState(false);
  const [showMeetInfo, setShowMeetInfo] = useState(false);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false);
  const [isOpenSessionCreating, setIsOpenSessionCreating] = useState(false);
  const [isOpenSessionActive, setIsOpenSessionActive] = useState(false);
  const [openSessionExpiry, setOpenSessionExpiry] = useState<string | null>(null);

  const checkOpenSession = useCallback(async () => {
    if (!currentBoardId) return;
    try {
      const sessionData = await collaborationService.getOpenSession(currentBoardId);
      if (sessionData?.active) {
        setIsOpenSessionActive(true);
        setOpenSessionExpiry(sessionData.expires_at);
      } else {
        setIsOpenSessionActive(false);
        setOpenSessionExpiry(null);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentBoardId]);

  const fetchCollaborators = useCallback(async () => {
    if (shareOpen && currentBoardId) {
      setIsLoadingCollaborators(true);
      try {
        const data = await collaborationService.getCollaborators(currentBoardId);
        setCollaborators(data);
      } catch (err: any) {
        console.error("Failed to fetch collaborators", err);
        showToast?.(err.response?.data?.message || err.message || "Failed to fetch collaborators", "error");
      } finally {
        setIsLoadingCollaborators(false);
      }
    }
  }, [shareOpen, currentBoardId, showToast]);

  useEffect(() => {
    if (shareOpen) {
      fetchCollaborators();
      checkOpenSession();
    }
  }, [shareOpen, fetchCollaborators, checkOpenSession]);

  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  const emails = inviteEmail.split(",").map(e => e.trim()).filter(Boolean);
  const isInviteEnabled = emails.length > 0 && emails.every(isValidEmail);

  const handleCopyLink = async () => {
    if (!currentBoardId) return;
    
    const shareLink = collaborationService.generateBoardShareLink(currentBoardId, boardName);
    
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopyStatus("Copied!");
      showToast?.("Board link copied to clipboard!", "success");
      setTimeout(() => setCopyStatus("Copy link"), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      showToast?.("Unable to copy link", "error");
    }
  };

  const handleInvite = async () => {
    if (!isInviteEnabled || isInviting) return;
    
    setIsInviting(true);
    setInviteMessage(null);
    setInviteError(null);
    
    try {
      const results = await Promise.all(
        emails.map(email => collaborationService.inviteCollaborator(currentBoardId, email, "editor"))
      );

      await fetchCollaborators();
      
      setInviteEmail("");
      
      const anyEmailSent = results.some((res: any) => res?.email_sent || res?.data?.email_sent);
      if (anyEmailSent) {
        setInviteMessage("Invitation sent successfully. An email has also been sent.");
      } else {
        setInviteMessage("Invitation sent successfully.");
      }
      
      // Auto-dismiss success message after 2.5 seconds
      setTimeout(() => {
        setInviteMessage(null);
      }, 2500);
      
    } catch (error: any) {
      console.error("Invite error:", error);
      const errMsg = error.response?.data?.message || error.message || "Failed to send invitation.";
      setInviteError(errMsg);
      
      // Auto-dismiss error message after 5 seconds
      setTimeout(() => {
        setInviteError(null);
      }, 5000);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (user: any, newRole: string) => {
    if (newRole === "remove") {
      const confirmed = window.confirm(`Are you sure you want to remove ${user.email || user.user_id} from this board?`);
      if (!confirmed) {
        setCollaborators(prev => [...prev]);
        return;
      }
    }

    const originalRole = user.role;
    
    if (newRole === "remove") {
      setCollaborators(prev => prev.filter(c => c.user_id !== user.user_id));
    } else {
      setCollaborators(prev => prev.map(c => c.user_id === user.user_id ? { ...c, role: newRole } : c));
    }

    try {
      if (newRole === "remove") {
        await collaborationService.removeCollaborator(currentBoardId, user.user_id);
        showToast?.("Collaborator removed successfully");
      } else {
        await collaborationService.updateCollaboratorRole(currentBoardId, user.user_id, newRole);
        showToast?.("Role updated successfully");
      }
    } catch (err: any) {
      console.error("Failed to update role", err);
      showToast?.(err.response?.data?.message || err.message || "Failed to update role", "error");
      setCollaborators(prev => {
        if (newRole === "remove") {
          return [...prev, user];
        } else {
          return prev.map(c => c.user_id === user.user_id ? { ...c, role: originalRole } : c);
        }
      });
      fetchCollaborators();
    }
  };

  const handleClassroomShare = () => {
    if (!currentBoardId) return;

    const shareLink = collaborationService.generateBoardShareLink(currentBoardId, boardName);
    const googleClassroomUrl = `https://classroom.google.com/share?url=${encodeURIComponent(shareLink)}`;
    
    // Open the Google Classroom share popup
    window.open(googleClassroomUrl, "Share to Google Classroom", "width=600,height=400,scrollbars=yes");

    setClassroomShared(true);
    setTimeout(() => setClassroomShared(false), 3000);
  };

  const handleStartOpenSession = async () => {
    if (!currentBoardId) return;
    setIsOpenSessionCreating(true);
    try {
      const token = await collaborationService.createOpenSession(currentBoardId);
      const shareLink = collaborationService.generateBoardShareLink(currentBoardId, boardName) + `?session=${token}`;
      await navigator.clipboard.writeText(shareLink);
      showToast?.("Open session started! Link copied to clipboard.", "success");
      setIsOpenSessionActive(true);
      checkOpenSession();
    } catch (err: any) {
      console.error("Failed to start open session", err);
      showToast?.(err.response?.data?.message || err.message || "Failed to start open session", "error");
    } finally {
      setIsOpenSessionCreating(false);
    }
  };

  const handleStopOpenSession = async () => {
    if (!currentBoardId) return;
    setIsOpenSessionCreating(true);
    try {
      await collaborationService.stopOpenSession(currentBoardId);
      setIsOpenSessionActive(false);
      setOpenSessionExpiry(null);
      showToast?.("Open session stopped successfully.", "success");
    } catch (err: any) {
      console.error("Failed to stop open session", err);
      showToast?.(err.response?.data?.message || err.message || "Failed to stop open session", "error");
    } finally {
      setIsOpenSessionCreating(false);
    }
  };

  return {
    shareOpen,
    setShareOpen,
    isInviting,
    inviteMessage,
    inviteError,
    copyStatus,
    inviteEmail,
    setInviteEmail,
    collaborators,
    linkAccess,
    setLinkAccess,
    classroomShared,
    showMeetInfo,
    setShowMeetInfo,
    isLoadingCollaborators,
    isInviteEnabled,
    isOpenSessionCreating,
    isOpenSessionActive,
    openSessionExpiry,
    handleCopyLink,
    handleInvite,
    handleRoleChange,
    handleClassroomShare,
    handleStartOpenSession,
    handleStopOpenSession
  };
}
