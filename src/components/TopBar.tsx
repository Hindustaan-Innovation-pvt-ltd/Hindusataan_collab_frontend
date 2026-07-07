import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown, Palette, Disc3, Music, Calendar,
  FileMusic, Play, Pause, SkipForward, SkipBack, Volume2,
  Link, Lock, Folder, ChevronRight, MoreHorizontal, Info, Globe, Users, Check, X, LogOut
} from "lucide-react";
import type { Board } from "../types";

interface TopBarProps {
  boards: Board[];
  currentBoardId: string;
  boardName: string;
  onChangeBoard: (id: string) => void;
  onNewBoard: () => void;
  onRenameBoard: (name: string) => void;
  boardBg: "white" | "black" | "green";
  onChangeBg: (bg: "white" | "black" | "green") => void;
  simPeers: boolean;
  onToggleSimPeers: () => void;
}

function TopBar({
  boards, currentBoardId, boardName, onChangeBoard, onNewBoard, onRenameBoard,
  boardBg, onChangeBg,
  simPeers, onToggleSimPeers
}: TopBarProps) {
  const [seconds, setSeconds] = useState(3 * 60);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userName, setUserName] = useState("Guest");

  useEffect(() => {
    try {
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
          <select
            value={currentBoardId}
            onChange={(e) => {
              if (e.target.value === "new") onNewBoard();
              else onChangeBoard(e.target.value);
            }}
            className="text-sm font-semibold text-gray-800 bg-transparent outline-none cursor-pointer"
          >
            {boards.map(b => (
              <option key={b.id} value={b.id}>{b.name || "Untitled Board"}</option>
            ))}
            <option disabled>──────────</option>
            <option value="new">+ New Board</option>
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm border border-black/[0.06]">
          <input
            type="text"
            value={boardName}
            onChange={(e) => onRenameBoard(e.target.value)}
            className="text-xs bg-transparent outline-none w-32 font-medium text-gray-600 placeholder-gray-400"
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
              onClick={() => setBgMenuOpen(o => !o)}
              title="Board Background"
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${bgMenuOpen ? "bg-[#f2efff] text-[#7B61FF]" : "text-[#7B61FF] hover:bg-[#f2efff] hover:scale-105"}`}
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
        </div>

        {/* Simulate Multiplayer button */}
        <button
          onClick={onToggleSimPeers}
          className={`flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-bold shadow-md transition-all ${simPeers ? "bg-[#3742FA] text-white hover:bg-[#2c35c9]" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
            }`}
        >
          {simPeers ? "Stop Cursors" : "Simulate Cursors"}
        </button>

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
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300 pointer-events-auto">
          <div className="flex flex-col gap-3 max-w-[500px] w-full animate-in fade-in zoom-in duration-200">

            {/* Card 1: Share this board */}
            <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 p-6 flex flex-col text-gray-800">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900 text-lg">Share this board</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#7B61FF] hover:text-[#6B4FF0] transition-colors"
                  >
                    {copyStatus === "Copied!" ? (
                      <>
                        <Check size={15} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Link size={15} />
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

              {/* Email Input Invite */}
              <div className="flex items-center gap-2.5 mb-6">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Add comma separated emails to invite"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 focus:border-[#7B61FF] focus:ring-1 focus:ring-[#7B61FF] outline-none text-sm text-gray-800 placeholder-gray-400 transition-all"
                  />
                </div>
                <button
                  onClick={handleInvite}
                  disabled={!isInviteEnabled}
                  className={`h-10 px-5 rounded-xl text-sm font-bold transition-all ${isInviteEnabled
                      ? "bg-[#7B61FF] text-white hover:bg-[#6B4FF0] active:scale-95 cursor-pointer"
                      : "bg-[#E6E6E6] text-[#B3B3B3] cursor-not-allowed"
                    }`}
                >
                  Invite
                </button>
              </div>

              {/* Who has access */}
              <div className="flex flex-col">
                <h3 className="text-gray-500 font-semibold text-xs mb-3 tracking-wide">Who has access</h3>

                {/* Lock Row */}
                <div
                  onClick={() => setLinkAccess(p => p === "invited" ? "anyone" : "invited")}
                  className="flex items-center justify-between py-2.5 px-1.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-gray-100">
                      <Lock size={15} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-800">Only invited people</div>
                      <div className="text-xs text-gray-400">
                        {linkAccess === "invited" ? "Private board" : "Anyone with access can join"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {linkAccess === "invited" && (
                      <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Active</span>
                    )}
                    <ChevronRight size={15} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* Team Project Row */}
                <div className="flex items-center justify-between py-2.5 px-1.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-gray-100">
                      <Folder size={15} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-800">Anyone in Team project</div>
                      <div className="text-xs text-gray-400">Can view all project boards</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">1 person</span>
                    <ChevronRight size={15} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* Owner Row */}
                <div className="flex items-center justify-between py-3 px-1.5 mt-1 border-t border-gray-50">
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      A
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-800">aries02 <span className="text-gray-400 font-normal">(you)</span></div>
                      <div className="text-xs text-gray-400">owner@figjam.clone</div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-400 pr-1">owner</span>
                </div>

                {/* Invited Users Rows */}
                {invitedUsers.map((user) => (
                  <div key={user.email} className="flex items-center justify-between py-2.5 px-1.5 border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left max-w-[200px] truncate">
                        <div className="text-sm font-semibold text-gray-800 truncate" title={user.email}>
                          {user.email.split('@')[0]}
                        </div>
                        <div className="text-xs text-gray-400 truncate" title={user.email}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "remove") {
                            setInvitedUsers(prev => prev.filter(u => u.email !== user.email));
                          } else {
                            setInvitedUsers(prev => prev.map(u => u.email === user.email ? { ...u, role: val as "edit" | "view" } : u));
                          }
                        }}
                        className="bg-transparent border-none text-xs font-medium text-gray-500 hover:text-gray-800 outline-none cursor-pointer pr-1"
                      >
                        <option value="edit">can edit</option>
                        <option value="view">can view</option>
                        <option value="remove">remove</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Classroom, Meet, Session */}
            <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 p-6 flex flex-col text-gray-800">

              {/* Classroom */}
              <div
                onClick={() => {
                  setClassroomShared(true);
                  setTimeout(() => setClassroomShared(false), 3000);
                }}
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
                  <div className="grid grid-cols-2 gap-2 mt-2 p-2 bg-gray-50 rounded-xl animate-in slide-in-from-top-2 duration-150">
                    <button
                      onClick={() => {
                        alert("Exporting project package... Saved to Downloads.");
                        setShowMoreOptions(false);
                      }}
                      className="text-left px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-white hover:text-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-100"
                    >
                      📥 Export CSV
                    </button>
                    <button
                      onClick={() => {
                        alert("Embedding iframe link copied to clipboard!");
                        navigator.clipboard.writeText(`<iframe src="${window.location.href}" width="800" height="600"></iframe>`);
                        setShowMoreOptions(false);
                      }}
                      className="text-left px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-white hover:text-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-100"
                    >
                      🔗 Embed board iframe
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TopBar;
