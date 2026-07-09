import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  ChevronDown, Palette, Disc3, Music, Calendar,
  FileMusic, Play, Pause, SkipForward, SkipBack, Volume2,
  Link as LinkIcon, Lock, ChevronRight, MoreHorizontal, Info, Globe, Users, Check, X, LogOut, Trash2, Search, MessageSquare
} from "lucide-react";
import type { Board } from "../types";
import { useShareDialog } from "../hooks/useShareDialog";
import { PendingInvitesPanel } from "./PendingInvitesPanel";

interface TopBarProps {
  currentBoardId: string;
  boardName: string;
  saveState?: "idle" | "saving" | "saved" | "error";
  onChangeBoard?: (id: string) => void;
  onRenameBoard: (name: string) => void;
  onDeleteBoard?: () => void;
  boardBg: "white" | "black" | "green";
  onChangeBg: (bg: "white" | "black" | "green") => void;
  showToast?: (text: string, type?: 'success' | 'error' | 'info') => void;
  boards?: Board[];
  onlineUsers?: any[];
  role?: "owner" | "editor" | "viewer";
  chatOpen?: boolean;
  onToggleChat?: () => void;
  chatUnreadCount?: number;
}

export const TopBar = React.memo(function TopBar({
  boards = [], currentBoardId, boardName, saveState, onChangeBoard, onRenameBoard, onDeleteBoard,
  boardBg, onChangeBg,
  showToast,
  onlineUsers = [], role = "owner",
  chatOpen = false, onToggleChat = () => {}, chatUnreadCount = 0
}: TopBarProps) {
  const [seconds, setSeconds] = useState(3 * 60);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userName, setUserName] = useState("Guest");

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUserName("Guest");
        return;
      }
      const s = localStorage.getItem("figjam_session");
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed && parsed.name) {
          setUserName(parsed.name);
        }
      }
    } catch (e) {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("figjam_session");
    window.location.href = "/login";
  };
  const [running, setRunning] = useState(false);
  const [bgMenuOpen, setBgMenuOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [calDate, setCalDate] = useState(new Date());

  // Music Player State
  const [musicOpen, setMusicOpen] = useState(false);
  const [playlist, setPlaylist] = useState<File[]>([]);
  const [currentTrack, setCurrentTrack] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Share Dialog Hook
  const {
    shareOpen, setShareOpen, isInviting, inviteMessage, inviteError,
    copyStatus, inviteEmail, setInviteEmail, collaborators,
    classroomShared,
    showMeetInfo, setShowMeetInfo, isLoadingCollaborators,
    isInviteEnabled, handleCopyLink, handleInvite, handleRoleChange, handleClassroomShare
  } = useShareDialog(currentBoardId, boardName, showToast);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const visibilityRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"main" | "collaborators">("main");
  const [visibilityPopoverOpen, setVisibilityPopoverOpen] = useState(false);
  const [collaboratorToRemove, setCollaboratorToRemove] = useState<any | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (visibilityRef.current && !visibilityRef.current.contains(event.target as Node)) {
        setVisibilityPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSearchBoards = boards.filter(b => 
    (b.name || "Untitled Board").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectSearchedBoard = (board: Board) => {
    setSearchQuery(board.name || "Untitled Board");
    setIsSearchOpen(false);
    onChangeBoard?.(board.id);
  };

  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState("24:00:00");
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Delete Board Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmDeleteBoard = () => {
    setDeleteError(null);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDeleteBoard) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      // onDeleteBoard returns a Promise because it's async in App.tsx
      await onDeleteBoard();
      setDeleteConfirmOpen(false);
      setShareOpen(false);
      showToast?.("Board deleted successfully.", "success");
    } catch (e: any) {
      setDeleteError(e.response?.data?.message || e.message || "Failed to delete board.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setIsDeleting(false);
    setDeleteError(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && deleteConfirmOpen && !isDeleting) {
        handleCancelDelete();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deleteConfirmOpen, isDeleting]);

  // Open session countdown timer
  useEffect(() => {
    if (!sessionActive) return;
    let totalSeconds = 24 * 60 * 60; // 24 hours
    const interval = setInterval(() => {
      totalSeconds--;
      if (totalSeconds <= 0) {
        setSessionActive(false);
        clearInterval(interval);
      } else {
        const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
        const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
        const secs = String(totalSeconds % 60).padStart(2, "0");
        setSessionTime(`${hrs}:${mins}:${secs}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionActive]);



  const daysInMonth = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay();

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && playlist.length > 0) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack, playlist]);

  const handleNextTrack = () => {
    if (playlist.length > 0) setCurrentTrack(p => (p + 1) % playlist.length);
  };
  const handlePrevTrack = () => {
    if (playlist.length > 0) setCurrentTrack(p => (p - 1 + playlist.length) % playlist.length);
  };

  const currentAudioSrc = playlist.length > 0 && playlist[currentTrack] ? URL.createObjectURL(playlist[currentTrack]) : undefined;

  return (
    <div className="absolute top-4 left-4 right-4 z-50 flex items-start justify-between pointer-events-none">
      {/* LEFT: Board Selector & Name */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 shadow-lg border border-black/[0.06]">
          <Link to="/" className="text-sm font-semibold text-[#7B61FF] hover:underline flex items-center gap-1">
            ← Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm border border-black/[0.06]">
          <input
            type="text"
            value={boardName}
            disabled={role === "viewer"}
            onChange={(e) => onRenameBoard(e.target.value)}
            className="text-xs bg-transparent outline-none w-32 font-medium text-gray-600 placeholder-gray-400 disabled:opacity-50"
            placeholder="Name your board"
          />
          {onDeleteBoard && boards.length > 0 && (
            <button onClick={confirmDeleteBoard} className="p-1 hover:bg-gray-100 rounded text-red-500 transition-colors" title="Delete Board">
              <Trash2 size={16} />
            </button>
          )}
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <span className="text-[10px] font-medium text-gray-400 w-16">
            {saveState === "saving" && "Saving..."}
            {saveState === "saved" && "Saved"}
            {saveState === "error" && <span className="text-red-500">Error saving</span>}
          </span>
        </div>
      </div>

      {/* RIGHT: Top Bar tools */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1 bg-white rounded-2xl px-2 py-1.5 shadow-lg border border-black/[0.06]">
          {/* Avatar */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1 pl-1 pr-2 h-8 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#1abc9c] flex items-center justify-center text-white text-xs font-bold uppercase">
                {userName.charAt(0)}
              </div>
              <ChevronDown size={13} className="text-gray-400" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-black/[0.06] p-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-2 border-b border-black/[0.04]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Logged in as</p>
                  <p className="text-xs font-bold text-gray-700 truncate">{userName}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#FF4757] font-bold hover:bg-red-50 rounded-lg transition-colors mt-1"
                >
                  <LogOut size={12} />
                  Log Out
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200" />

          {/* Layout icon */}
          <button className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          <div className="w-px h-5 bg-gray-200" />

          {/* Background Color Popup */}
          <div className="relative">
            <button
              disabled={role === "viewer"}
              onClick={() => setBgMenuOpen(o => !o)}
              title="Board Background"
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all disabled:opacity-50 ${bgMenuOpen ? "bg-[#f2efff] text-[#7B61FF]" : "text-[#7B61FF] hover:bg-[#f2efff] hover:scale-105"}`}
            >
              <Palette size={18} />
            </button>
            {bgMenuOpen && (
              <div className="absolute top-10 right-0 bg-white rounded-xl shadow-xl border border-gray-100 p-2 flex gap-1.5 z-50">
                {(["white", "black", "green"] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => { onChangeBg(c); setBgMenuOpen(false); }}
                    className={`w-6 h-6 rounded-full border transition-all ${boardBg === c ? "border-[#3742FA] scale-125 shadow-sm" : "border-black/10 hover:scale-110"}`}
                    style={{ backgroundColor: c === "white" ? "#F5F5F5" : c === "black" ? "#1A1A1A" : "#1B4D3E" }}
                    title={`${c.charAt(0).toUpperCase() + c.slice(1)} board`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200" />

          {/* Timer */}
          <button
            onClick={() => setRunning(r => !r)}
            title={running ? "Pause timer" : "Start timer"}
            className="flex items-center gap-1.5 px-2 h-8 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Disc3 size={15} className="text-gray-500" />
            <span className="text-sm font-semibold font-mono text-gray-700 tabular-nums">
              {mm}:{ss}
            </span>
          </button>

          <div className="w-px h-5 bg-gray-200" />

          {/* Music */}
          <div className="relative">
            <button
              onClick={() => setMusicOpen(o => !o)}
              title="Music Player"
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${musicOpen || isPlaying ? "bg-indigo-50 text-indigo-500" : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-500"}`}
            >
              <Music size={15} />
            </button>
            {musicOpen && (
              <div className="absolute top-10 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-64 z-50 text-gray-800 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-gray-800">Local Music</h3>
                  <button onClick={() => fileInputRef.current?.click()} className="text-indigo-500 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors" title="Add Music Files">
                    <FileMusic size={16} />
                  </button>
                  <input type="file" accept="audio/*" multiple className="hidden" ref={fileInputRef} onChange={(e) => {
                    if (e.target.files) {
                      setPlaylist(Array.from(e.target.files));
                      setCurrentTrack(0);
                      setIsPlaying(true);
                    }
                  }} />
                </div>

                {playlist.length > 0 ? (
                  <>
                    <div className="text-xs font-semibold text-gray-600 truncate mb-1">
                      {playlist[currentTrack].name}
                    </div>
                    <div className="text-[10px] text-gray-400 mb-4">
                      Track {currentTrack + 1} of {playlist.length}
                    </div>

                    <div className="flex items-center justify-center gap-3 mb-4">
                      <button onClick={handlePrevTrack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700">
                        <SkipBack size={16} fill="currentColor" />
                      </button>
                      <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-md transition-transform active:scale-95">
                        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                      </button>
                      <button onClick={handleNextTrack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700">
                        <SkipForward size={16} fill="currentColor" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Volume2 size={14} className="text-gray-400" />
                      <input
                        type="range" min="0" max="1" step="0.01" value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Music size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs text-gray-500">No music loaded</p>
                    <button onClick={() => fileInputRef.current?.click()} className="mt-3 text-xs bg-indigo-50 text-indigo-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                      Choose Files
                    </button>
                  </div>
                )}

                {/* Hidden Audio Element */}
                <audio
                  ref={audioRef}
                  src={currentAudioSrc}
                  onEnded={handleNextTrack}
                  onError={() => setIsPlaying(false)}
                />
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200" />

          {/* Calendar */}
          <div className="relative">
            <button
              onClick={() => {
                setCalOpen(o => !o);
                setCalDate(new Date());
              }}
              title="Calendar"
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${calOpen ? "bg-red-50 text-[#FF4757]" : "text-[#FF4757] hover:bg-red-50"}`}
            >
              <Calendar size={16} />
            </button>
            {calOpen && (
              <div className="absolute top-10 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-64 z-50 text-gray-800">
                <div className="bg-[#FF4757] text-white flex justify-between items-center px-4 py-3">
                  <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))} className="hover:bg-[#ff6b77] rounded-full w-6 h-6 flex items-center justify-center transition-colors font-bold">&lt;</button>
                  <div className="font-semibold text-sm">
                    {calDate.toLocaleString("default", { month: "long" })} {calDate.getFullYear()}
                  </div>
                  <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))} className="hover:bg-[#ff6b77] rounded-full w-6 h-6 flex items-center justify-center transition-colors font-bold">&gt;</button>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-2 uppercase">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => <div key={d} className={i === 0 || i === 6 ? "text-[#FF4757]" : ""}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const isToday = i + 1 === new Date().getDate() && calDate.getMonth() === new Date().getMonth() && calDate.getFullYear() === new Date().getFullYear();
                      return (
                        <div key={i + 1} className={`flex items-center justify-center h-7 rounded-full transition-colors ${isToday ? "bg-[#FF4757] text-white shadow-sm font-bold" : "hover:bg-[#fff0f1] cursor-pointer text-gray-700"}`}>
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200" />

          {/* Chat Toggle */}
          <div className="relative">
            <button
              onClick={onToggleChat}
              title="Board Chat"
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${chatOpen ? "bg-[#f2efff] text-[#7B61FF]" : "text-gray-500 hover:bg-[#f2efff] hover:text-[#7B61FF]"}`}
            >
              <MessageSquare size={16} />
              {chatUnreadCount > 0 && !chatOpen && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-white">
                  {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Board Search */}
        <div ref={searchContainerRef} className="relative">
          <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl px-2.5 h-9 transition-all focus-within:ring-2 focus-within:ring-[#7B61FF] focus-within:border-transparent w-48 shadow-sm">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full bg-transparent border-none outline-none text-xs text-gray-700 px-2 placeholder-gray-400"
            />
          </div>
          
          {/* Dropdown */}
          {isSearchOpen && searchQuery.trim() !== "" && (
            <div className="absolute top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-1">
              {filteredSearchBoards.length > 0 ? (
                filteredSearchBoards.map(board => (
                  <button
                    key={board.id}
                    onClick={() => handleSelectSearchedBoard(board)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex flex-col"
                  >
                    <span className="font-medium truncate">{board.name || "Untitled Board"}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-xs text-center text-gray-400">
                  No boards found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Online Presence Avatars */}
        {onlineUsers.length > 0 && (
          <div className="flex items-center ml-2 relative" title={`${onlineUsers.length} online`}>
            {onlineUsers.map((u, i) => (
              <div 
                key={u.user_id || i}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-md -ml-2 first:ml-0"
                style={{ backgroundColor: u.color || "#7B61FF", zIndex: 10 - i }}
                title={u.name}
              >
                {u.name ? u.name.charAt(0).toUpperCase() : "U"}
              </div>
            ))}
            <div className="ml-2 text-xs font-bold text-gray-500">
              {onlineUsers.length} Online
            </div>
          </div>
        )}

        {/* Notifications */}
        <PendingInvitesPanel />

        {/* Share button */}
        <button
          onClick={() => setShareOpen(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#7B61FF] hover:bg-[#6B4FF0] text-white text-sm font-semibold shadow-md transition-colors"
        >
          Share
        </button>
      </div>

      {/* Share Dialog Overlay */}
      {shareOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[100] flex justify-center p-4 transition-all duration-300 pointer-events-auto overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col gap-3 max-w-[500px] w-full h-auto animate-in fade-in zoom-in duration-300 relative my-auto">

            {view === "main" ? (
              <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 p-6 flex flex-col text-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-gray-900 text-lg">Share this board</h2>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleCopyLink}
                      disabled={!currentBoardId}
                      className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                        !currentBoardId ? "text-gray-400 cursor-not-allowed" : "text-[#7B61FF] hover:text-[#6B4FF0]"
                      }`}
                    >
                      {copyStatus === "Copied!" ? (
                        <>
                          <Check size={15} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <LinkIcon size={15} />
                          <span>Copy link</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShareOpen(false)}
                      className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Who has access */}
                <div className="flex flex-col">
                  <h3 className="text-gray-500 font-semibold text-xs mb-3 tracking-wide">Who has access</h3>

                  {/* Lock Row */}
                  <div ref={visibilityRef} className="relative">
                    <div
                      onClick={() => setVisibilityPopoverOpen(o => !o)}
                      className="flex items-center justify-between py-3 px-1.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-gray-100 transition-colors">
                          <Lock size={15} />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-semibold text-gray-800">Private Board</div>
                          <div className="text-xs text-gray-400">
                            Only invited collaborators can view and edit this board.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                          <Lock size={10} className="text-gray-400" />
                          <span>Private</span>
                        </div>
                        <ChevronRight size={15} className={`text-gray-400 transition-transform duration-200 ${visibilityPopoverOpen ? "rotate-90" : "group-hover:translate-x-0.5"}`} />
                      </div>
                    </div>
                    {visibilityPopoverOpen && (
                      <div className="mt-1 w-full bg-white rounded-xl shadow-sm border border-gray-100 p-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Board Visibility</div>
                        
                        <button className="w-full text-left flex items-start gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100 hover:bg-indigo-50 transition-colors cursor-default">
                          <Lock size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                          <div>
                            <div className="text-sm font-semibold text-indigo-900">Private</div>
                            <div className="text-xs text-indigo-700/80 mt-0.5">Only invited collaborators can view and edit this board.</div>
                          </div>
                          <Check size={16} className="text-indigo-600 ml-auto mt-1" />
                        </button>
                        
                        <button disabled className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed mt-1">
                          <Globe size={16} className="text-gray-500 mt-0.5 shrink-0" />
                          <div>
                            <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">Public <span className="text-[9px] bg-gray-200 px-1.5 py-0.5 rounded uppercase font-bold text-gray-500">Coming Soon</span></div>
                            <div className="text-xs text-gray-500 mt-0.5">Anyone on the internet can view.</div>
                          </div>
                        </button>
                        
                        <button disabled className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed mt-1">
                          <Users size={16} className="text-gray-500 mt-0.5 shrink-0" />
                          <div>
                            <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">Organization <span className="text-[9px] bg-gray-200 px-1.5 py-0.5 rounded uppercase font-bold text-gray-500">Coming Soon</span></div>
                            <div className="text-xs text-gray-500 mt-0.5">Anyone in your org can access.</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Collaborators Row */}
                  <div 
                    onClick={() => setView("collaborators")}
                    className="flex items-center justify-between py-3 px-1.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group mt-1"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-gray-100 transition-colors">
                        <Users size={15} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-gray-800">Collaborators</div>
                        <div className="text-xs text-gray-400">Manage members and permissions.</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <div className="flex mr-2">
                          {collaborators.slice(0, 2).map((c: any, i: number) => {
                            const initial = (c.email || c.user_id || "U").charAt(0).toUpperCase();
                            return (
                              <div key={i} className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700 -ml-1.5 first:ml-0 z-[2] relative shadow-sm">
                                {initial}
                              </div>
                            );
                          })}
                          {collaborators.length > 2 && (
                            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600 -ml-1.5 z-[1] relative shadow-sm">
                              +{collaborators.length - 2}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                          {collaborators.length === 0 ? "Owner only" : collaborators.length === 1 ? "1 Member" : `${collaborators.length} Members`}
                        </span>
                      </div>
                      <ChevronRight size={15} className={`text-gray-400 transition-transform group-hover:translate-x-0.5`} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 p-6 flex flex-col text-gray-800 animate-in slide-in-from-right-4 duration-200">
                {/* Header for Panel */}
                <div className="flex items-center gap-3 mb-5">
                  <button onClick={() => setView("main")} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                    <ChevronDown className="rotate-90" size={16} />
                  </button>
                  <h2 className="font-bold text-gray-900 text-lg flex-1">Collaborators</h2>
                  <button onClick={() => setShareOpen(false)} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {/* Email Input Invite */}
                <div className="flex flex-col gap-2 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Add comma separated emails to invite"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                        className="w-full h-10 px-3.5 rounded-xl border border-gray-200 focus:border-[#7B61FF] focus:ring-1 focus:ring-[#7B61FF] outline-none text-sm text-gray-800 placeholder-gray-400 transition-all"
                        disabled={isInviting}
                      />
                    </div>
                    <button
                      onClick={handleInvite}
                      disabled={!isInviteEnabled || isInviting}
                      className={`h-10 px-5 rounded-xl text-sm font-bold transition-all ${isInviteEnabled && !isInviting
                          ? "bg-[#7B61FF] text-white hover:bg-[#6B4FF0] active:scale-95 cursor-pointer"
                          : "bg-[#E6E6E6] text-[#B3B3B3] cursor-not-allowed"
                        }`}
                    >
                      {isInviting ? "Inviting..." : "Invite"}
                    </button>
                  </div>
                  {inviteMessage && (
                    <div className="text-xs font-semibold text-green-600 pl-1">{inviteMessage}</div>
                  )}
                  {inviteError && (
                    <div className="text-xs font-semibold text-red-500 pl-1">{inviteError}</div>
                  )}
                </div>

                {/* Dynamic Collaborators List */}
                <div className="flex flex-col mt-2">
                  {isLoadingCollaborators ? (
                    <div className="py-8 flex justify-center items-center">
                      <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                    </div>
                  ) : collaborators.length === 0 ? (
                    <div className="py-8 text-center text-sm font-semibold text-gray-400">No collaborators yet.</div>
                  ) : (
                    <>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Members</div>
                      {collaborators.map((user: any) => {
                        const isOwner = user.role === "owner";
                        const email = user.email || user.user_id || "unknown@example.com";
                        const name = email.split('@')[0];
                        const initial = name.charAt(0).toUpperCase();

                        return (
                          <div key={user.id || email} className={`flex items-center justify-between py-2.5 px-1.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors`}>
                            <div className="flex items-center gap-3.5">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                                isOwner 
                                  ? "bg-gradient-to-tr from-purple-500 to-pink-500 text-white" 
                                  : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                              }`}>
                                {initial}
                              </div>
                              <div className="text-left max-w-[200px] truncate">
                                <div className="text-sm font-semibold text-gray-800 truncate" title={email}>
                                  {name}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate" title={email}>
                                  {email}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isOwner ? (
                                <span className="text-xs font-medium text-gray-400 pr-1 px-2 py-1 rounded bg-gray-50 border border-gray-100">Owner</span>
                              ) : (
                                <select
                                  value={user.role}
                                  onChange={(e) => {
                                    if (e.target.value === "remove") {
                                      setCollaboratorToRemove(user);
                                    } else {
                                      handleRoleChange(user, e.target.value);
                                    }
                                  }}
                                  disabled={isOwner}
                                  className="bg-transparent border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 outline-none cursor-pointer pr-1 transition-colors shadow-sm"
                                >
                                  <option value="editor">Editor</option>
                                  <option value="viewer">Viewer</option>
                                  <option value="remove">Remove</option>
                                </select>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            )}

            {collaboratorToRemove && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-[120] rounded-[24px] flex items-center justify-center p-6 animate-in fade-in duration-200">
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-5 max-w-[300px] w-full text-center">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trash2 size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Collaborator?</h3>
                  <p className="text-sm text-gray-500 mb-5">
                    Are you sure you want to remove <strong>{collaboratorToRemove.email || collaboratorToRemove.user_id}</strong> from this board? They will lose access immediately.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCollaboratorToRemove(null)}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleRoleChange(collaboratorToRemove, 'remove');
                        setCollaboratorToRemove(null);
                      }}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Card 2: Classroom, Meet, Session */}
            <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 p-6 flex flex-col text-gray-800">

              {/* Classroom */}
              <div
                onClick={handleClassroomShare}
                className="flex items-center justify-between py-2.5 px-1.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                    <div className="w-5 h-4 bg-green-600 rounded-sm border border-yellow-400 flex items-center justify-center text-[8px] font-bold text-white leading-none">
                      🏫
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {classroomShared ? "Shared successfully!" : "Share to Google Classroom"}
                  </span>
                </div>
                <ChevronRight size={15} className={`text-gray-400 group-hover:translate-x-0.5 transition-transform ${classroomShared ? "text-green-500" : ""}`} />
              </div>

              {/* Meet */}
              <div className="relative">
                <div
                  onMouseEnter={() => setShowMeetInfo(true)}
                  onMouseLeave={() => setShowMeetInfo(false)}
                  className="flex items-center justify-between py-2.5 px-1.5 rounded-xl opacity-60 cursor-not-allowed transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                      <Globe size={16} />
                    </div>
                    <span className="text-sm font-semibold text-gray-400">Cast to a Google Meet device</span>
                  </div>
                  <div className="flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600">
                    <Info size={15} />
                  </div>
                </div>
                {showMeetInfo && (
                  <div className="absolute right-0 bottom-10 bg-gray-900 text-white text-xs rounded-lg p-2.5 w-60 shadow-xl z-[110] leading-normal font-normal">
                    Cast this board directly to a Google Meet device. No active devices found on your local network.
                  </div>
                )}
              </div>

              {/* Open Session */}
              <div className="flex items-center justify-between py-3 px-1.5 border-t border-b border-gray-100 my-2">
                <div className="flex items-center gap-3.5 flex-1 pr-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                    <Users size={16} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">Start open session</span>
                      {sessionActive && (
                        <span className="text-[10px] bg-green-50 text-green-600 font-bold px-1.5 py-0.5 rounded animate-pulse">
                          Active ({sessionTime})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                      Anyone can edit—no account required. Sessions end automatically after 24 hours.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSessionActive(!sessionActive)}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all border shrink-0 ${sessionActive
                    ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 cursor-pointer"
                    : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50 cursor-pointer"
                    }`}
                >
                  {sessionActive ? "Stop" : "Start"}
                </button>
              </div>

              {/* More Options */}
              <div>
                <div
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="flex items-center justify-between py-2.5 px-1.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-100">
                      <MoreHorizontal size={15} />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">More</span>
                  </div>
                  <ChevronRight size={15} className={`text-gray-400 group-hover:translate-x-0.5 transition-transform ${showMoreOptions ? "rotate-90" : ""}`} />
                </div>
                
                {showMoreOptions && (
                  <div className="mt-2 p-1 bg-gray-50/50 rounded-xl animate-in slide-in-from-top-2 duration-150 flex flex-col gap-1 relative">
                    
                    {/* Export Group */}
                    <div className="mb-1">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1.5">📄 Export</div>
                      
                      {/* Export Board Submenu Trigger */}
                      <div className="flex flex-col">
                        <button 
                          onClick={() => setShowExportMenu(!showExportMenu)}
                          className="w-full text-left px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white hover:shadow-sm rounded-lg transition-all flex items-center justify-between group"
                        >
                          <span>Export Board</span>
                          <ChevronRight size={14} className={`text-gray-400 transition-transform duration-200 ${showExportMenu ? "rotate-90" : "group-hover:translate-x-0.5"}`} />
                        </button>
                        
                        {showExportMenu && (
                          <div className="mt-1 w-full bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                            <button disabled className="w-full text-left px-2 py-2 text-xs font-semibold text-gray-400 hover:bg-gray-50 rounded-lg flex items-center justify-between cursor-not-allowed">
                              <span>Export as PNG</span>
                              <span className="text-[9px] bg-gray-100 px-1 py-0.5 rounded uppercase font-bold text-gray-400">Soon</span>
                            </button>
                            <button disabled className="w-full text-left px-2 py-2 text-xs font-semibold text-gray-400 hover:bg-gray-50 rounded-lg flex items-center justify-between cursor-not-allowed">
                              <span>Export as PDF</span>
                              <span className="text-[9px] bg-gray-100 px-1 py-0.5 rounded uppercase font-bold text-gray-400">Soon</span>
                            </button>
                            <button 
                              onClick={() => {
                                const board = boards.find(b => b.id === currentBoardId);
                                if (!board) return;
                                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(board.els));
                                const a = document.createElement('a');
                                a.href = dataStr;
                                a.download = `${board.name || 'board'}_data.json`;
                                a.click();
                                setShowExportMenu(false);
                                if (showToast) showToast("Board exported successfully!", "success");
                              }}
                              className="w-full text-left px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 rounded-lg transition-colors"
                            >
                              Export as JSON
                            </button>
                            <button 
                              onClick={() => {
                                if (showToast) showToast("Mermaid export requires generating a flowchart first. (Coming Soon)", "info");
                                setShowExportMenu(false);
                              }}
                              className="w-full text-left px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 rounded-lg transition-colors"
                            >
                              Export as Mermaid
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-gray-200/50 mx-2" />

                    {/* Board Group */}
                    <div className="mt-1">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1.5">⚙ Board</div>
                      <button 
                        onClick={() => {
                          const newName = window.prompt("Rename Board", boardName);
                          if (newName !== null && newName.trim() !== "") {
                            onRenameBoard(newName);
                          }
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                      >
                        Rename Board
                      </button>
                      <button 
                        onClick={() => {}}
                        className="w-full text-left px-2 py-1.5 text-xs font-semibold text-gray-400 hover:bg-gray-50 rounded-lg flex items-center justify-between cursor-not-allowed"
                        disabled
                      >
                        <span>Duplicate Board</span>
                        <span className="text-[9px] bg-gray-100 px-1 py-0.5 rounded uppercase font-bold text-gray-400">Soon</span>
                      </button>
                      <button 
                        onClick={confirmDeleteBoard}
                        disabled={!onDeleteBoard}
                        className={`w-full text-left px-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${onDeleteBoard ? "text-red-600 hover:bg-red-50 hover:shadow-sm cursor-pointer" : "text-gray-300 cursor-not-allowed"}`}
                      >
                        Delete Board
                      </button>
                    </div>
                    
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={handleCancelDelete} 
          />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <Trash2 size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Delete Board</h2>
              </div>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                Are you sure you want to permanently delete this board?
              </p>
              <p className="text-sm font-semibold text-gray-800 mt-2">
                This action cannot be undone.
              </p>
              
              {deleteError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs font-medium text-red-600">
                  {deleteError}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                autoFocus
                className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-70 flex items-center gap-2 shadow-sm shadow-red-600/20"
              >
                {isDeleting ? "Deleting..." : "Delete Board"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default TopBar;
