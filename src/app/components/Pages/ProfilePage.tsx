import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Camera, Edit2, Clock, LayoutDashboard, Shield, Save, X, Trash2, UploadCloud, Loader2, Dices } from "lucide-react";
import { userService, UserProfile } from "../../../services/userService";
import { toast } from "sonner";
import axios from "axios";
import ImageCropperModal from "../../../components/ImageCropperModal";
import AvatarPickerModal from "../../../components/AvatarPickerModal";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", bio: "" });
  const [isSaving, setIsSaving] = useState(false);
  const hasChanges = profile ? (formData.name !== profile.name || formData.bio !== (profile.bio || "")) : false;
  const [error, setError] = useState<string | null>(null);

  // Avatar states
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await userService.getProfile();
      setProfile(data);
      setFormData({ name: data.name, bio: data.bio || "" });

      // Update session storage for TopBar avatar
      const s = localStorage.getItem("HIXCanvas_session");
      if (s) {
        const parsed = JSON.parse(s);
        parsed.name = data.name;
        parsed.avatar = data.avatar;
        localStorage.setItem("HIXCanvas_session", JSON.stringify(parsed));
      }
    } catch (e: any) {
      console.error(e);
      if (e.response?.status === 401) {
        navigate("/login");
      } else {
        toast.error("Failed to load profile");
        setError("Could not load your profile information.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getFullAvatarUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const baseUrl = axios.defaults.baseURL || "http://127.0.0.1:8000";
    return `${baseUrl}${path}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    const trimmedBio = formData.bio.trim();

    if (!trimmedName) {
      toast.error("Name cannot be empty");
      return;
    }
    if (trimmedName.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    if (trimmedName.length > 100) {
      toast.error("Name must be less than 100 characters");
      return;
    }
    if (trimmedBio.length > 300) {
      toast.error("Bio must be less than 300 characters");
      return;
    }

    setIsSaving(true);
    try {
      await userService.updateProfile({ name: trimmedName, bio: trimmedBio });
      toast.success("Profile updated successfully");
      setIsEditing(false);
      fetchProfile();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large (max 5MB).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and WEBP files are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    
    // Validate corrupted image & min resolution
    const img = new Image();
    img.onload = () => {
      if (img.width < 100 || img.height < 100) {
        toast.error("Image is too small. Minimum resolution is 100x100 pixels.");
        URL.revokeObjectURL(url);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedImageUrl(url);
      setIsCropperOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    img.onerror = () => {
      toast.error("The selected image file appears to be corrupted.");
      URL.revokeObjectURL(url);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    img.src = url;
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!profile) return;
    setIsUploading(true);
    try {
      const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      const response = await userService.uploadAvatar(croppedFile);
      toast.success("Profile picture updated");
      const newAvatarUrl = response.avatar_url;

      setProfile({ ...profile, avatar: newAvatarUrl });

      // Update session storage
      const s = localStorage.getItem("HIXCanvas_session");
      if (s) {
        const parsed = JSON.parse(s);
        parsed.avatar = newAvatarUrl;
        localStorage.setItem("HIXCanvas_session", JSON.stringify(parsed));
        window.dispatchEvent(new Event("sessionUpdated"));
      }

      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl);
      }
      setSelectedImageUrl(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to upload profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile || !profile.avatar) return;
    setIsRemoving(true);
    try {
      await userService.deleteAvatar();
      toast.success("Profile picture removed");

      setProfile({ ...profile, avatar: "" });

      // Update session storage
      const s = localStorage.getItem("HIXCanvas_session");
      if (s) {
        const parsed = JSON.parse(s);
        parsed.avatar = "";
        localStorage.setItem("HIXCanvas_session", JSON.stringify(parsed));
        window.dispatchEvent(new Event("sessionUpdated"));
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to remove profile picture");
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center p-6">
        <div className="bg-card p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={24} />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Oops! Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => { setError(null); setIsLoading(true); fetchProfile(); }}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#F5F7FB] font-sans text-foreground pb-12">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold text-foreground tracking-tight">My Profile</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            <div className="px-6 pb-6 relative text-center">
              <div className="relative inline-block -mt-12 mb-4 group">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-card overflow-hidden flex items-center justify-center shadow-md relative">
                  {profile.avatar ? (
                    <img src={getFullAvatarUrl(profile.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#1abc9c] text-white flex items-center justify-center text-3xl font-bold uppercase">
                      {profile.name.charAt(0)}
                    </div>
                  )}

                  {isUploading && (
                    <div className="absolute inset-0 bg-card/70 flex items-center justify-center z-10">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                  )}

                  {!isUploading && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                      title="Upload Photo"
                    >
                      <Camera size={20} />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg, image/png, image/webp"
                  onChange={handleFileChange}
                />
              </div>

              {/* Avatar Controls */}
              {profile.avatar ? (
                <div className="flex justify-center gap-2 mb-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        disabled={isUploading || isRemoving}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground bg-background hover:bg-muted border border-border rounded-lg transition-colors shadow-sm disabled:opacity-50"
                      >
                        <Camera size={14} />
                        Change Photo
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-48 bg-card border-border">
                      <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer text-foreground hover:bg-muted">
                        <UploadCloud size={14} className="mr-2" />
                        Upload New Photo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsAvatarPickerOpen(true)} className="cursor-pointer text-foreground hover:bg-muted">
                        <Dices size={14} className="mr-2" />
                        Choose Avatar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <button 
                    onClick={handleRemoveAvatar}
                    disabled={isRemoving || isUploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isRemoving ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={14} />}
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex justify-center gap-2 mb-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground bg-background hover:bg-muted border border-border rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    <UploadCloud size={14} />
                    Upload Photo
                  </button>
                  <button 
                    onClick={() => setIsAvatarPickerOpen(true)}
                    disabled={isUploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground bg-background hover:bg-muted border border-border rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Dices size={14} />
                    Choose Avatar
                  </button>
                </div>
              )}

              <h2 className="text-xl font-bold text-foreground truncate">{profile.name}</h2>
              <p className="text-sm text-muted-foreground font-medium truncate mb-4">{profile.email}</p>

              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                  <Shield size={12} /> {profile.role}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-foreground text-xs font-medium">
                  <Clock size={12} /> Joined {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-2 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 size={14} />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Recent Boards */}
        <div className="lg:col-span-2 space-y-6">

          {/* Details / Edit Form */}
          <div className="bg-card rounded-2xl shadow-sm border border-border/60 p-6 md:p-8">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <UserIcon /> Personal Information
            </h3>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-5 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-card transition-colors text-sm font-medium"
                      placeholder="Your name"
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-3.5 py-2 bg-muted border border-border rounded-xl text-muted-foreground text-sm font-medium cursor-not-allowed"
                    />
                    <p className="text-[10px] text-gray-400">Email cannot be changed.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3.5 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-card transition-colors text-sm font-medium resize-none"
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={300}
                  ></textarea>
                  <div className="text-right text-[10px] text-gray-400">{formData.bio.length}/300</div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ name: profile.name, bio: profile.bio || "" });
                    }}
                    className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !hasChanges}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200 disabled:opacity-70"
                  >
                    {isSaving ? "Saving..." : (
                      <>
                        <Save size={14} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Full Name</p>
                    <p className="text-sm font-semibold text-foreground">{profile.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Email Address</p>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      {profile.email}
                      <span className="bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Verified</span>
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Bio</p>
                  <p className="text-sm text-foreground leading-relaxed bg-background p-4 rounded-xl border border-border min-h-[80px]">
                    {profile.bio ? profile.bio : <span className="text-gray-400 italic">No bio provided.</span>}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Boards */}
          <div className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <LayoutDashboard size={18} className="text-indigo-500" />
                Recent Boards
              </h3>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-full">
                Total: {profile.total_boards}
              </span>
            </div>

            <div className="p-2">
              {profile.recent_boards && profile.recent_boards.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {profile.recent_boards.map(board => (
                    <Link
                      to={`/board/${board.id}/${encodeURIComponent(board.name.replace(/\s+/g, "-"))}`}
                      key={board.id}
                      className="group flex flex-col p-4 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <LayoutDashboard size={14} />
                        </div>
                        <h4 className="text-sm font-bold text-foreground truncate group-hover:text-indigo-700 transition-colors">
                          {board.name}
                        </h4>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium mt-auto ml-11">
                        Updated {new Date(board.updatedAt || Date.now()).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                    <LayoutDashboard size={20} />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No boards yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Boards you open will appear here.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      
      {selectedImageUrl && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          onClose={() => {
            setIsCropperOpen(false);
            if (selectedImageUrl) URL.revokeObjectURL(selectedImageUrl);
            setSelectedImageUrl(null);
          }}
          imageSrc={selectedImageUrl}
          onCropComplete={handleCropComplete}
        />
      )}

      <AvatarPickerModal
        isOpen={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        onAvatarComplete={handleCropComplete}
        defaultName={profile.name}
      />
    </div>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}
