import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  ChevronDown, Palette, Disc3, Music, Calendar,
  FileMusic, Play, Pause, SkipForward, SkipBack, Volume2,
  Lock, Folder, ChevronRight, MoreHorizontal, Info, Globe, Users, Check, X, LogOut, MessageSquare
} from "lucide-react";
import type { Board } from "../types";
import { ShareBoardModal } from "./ShareBoardModal";
import { PendingInvitesPanel } from "./PendingInvitesPanel";

interface TopBarProps {
  currentBoardId: string;
  boardName: string;
  onRenameBoard: (name: string) => void;
  boardBg: "white" | "black" | "green";
  onChangeBg: (bg: "white" | "black" | "green") => void;
  onlineUsers?: any[];
  role?: "owner" | "editor" | "viewer";
  chatOpen?: boolean;
  onToggleChat?: () => void;
  chatUnreadCount?: number;
}

function TopBar({
  currentBoardId, boardName, onRenameBoard,
  boardBg, onChangeBg,
  onlineUsers = [],
  role = "owner",
  chatOpen = false,
  onToggleChat = () => {},
  chatUnreadCount = 0
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

  // Share Dialog State
  const [shareOpen, setShareOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("Copy link");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitedUsers, setInvitedUsers] = useState<{ email: string; role: "edit" | "view" }[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState("24:00:00");
  const [linkAccess, setLinkAccess] = useState<"invited" | "anyone">("invited");
  const [classroomShared, setClassroomShared] = useState(false);
  const [showMeetInfo, setShowMeetInfo] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

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

  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };
  const emails = inviteEmail.split(",").map(e => e.trim()).filter(Boolean);
  const isInviteEnabled = emails.length > 0 && emails.every(isValidEmail);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyStatus("Copied!");
    setTimeout(() => setCopyStatus("Copy link"), 2000);
  };

  const handleInvite = () => {
    if (!isInviteEnabled) return;
    const newUsers = emails.map(email => ({ email, role: "edit" as const }));
    setInvitedUsers(prev => {
      const existingEmails = prev.map(u => u.email);
      const filteredNew = newUsers.filter(nu => !existingEmails.includes(nu.email));
      return [...prev, ...filteredNew];
    });
    setInviteEmail("");
  };

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
        <ShareBoardModal boardId={currentBoardId} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}

export default TopBar;
