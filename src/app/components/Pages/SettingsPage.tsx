import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Palette, Bell, Shield, Save, X, Eye, EyeOff } from "lucide-react";
import { userService } from "../../../services/userService";
import { toast } from "sonner";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"appearance" | "notifications" | "security">("appearance");
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Security Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Preferences Form
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState({
    emailInvites: true,
    boardUpdates: true,
    collaboration: true
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await userService.getSettings();
      setProfile(data);
      setTheme(data.theme || "light");
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (e: any) {
      if (e.response?.status === 401) {
        navigate("/login");
      } else {
        toast.error("Failed to load settings");
        setError("Could not load your settings.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    setIsSavingPrefs(true);
    try {
      await userService.updateSettings({
        theme,
        notifications
      });
      toast.success("Settings saved successfully");
      // update local state cache so disabled button updates correctly
      setProfile({
        ...profile,
        theme,
        notifications
      });
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // Password Validation
  const getPasswordErrors = () => {
    const errors: string[] = [];
    if (newPassword.length > 0) {
      if (newPassword.length < 8) errors.push("Minimum 8 characters");
      if (newPassword.length > 64) errors.push("Maximum 64 characters");
      if (!/[A-Z]/.test(newPassword)) errors.push("One uppercase letter");
      if (!/[a-z]/.test(newPassword)) errors.push("One lowercase letter");
      if (!/\d/.test(newPassword)) errors.push("One number");
      if (!/[!@#$%^&*(),.?":{}|<>\-_]/.test(newPassword)) errors.push("One special character");
    }
    return errors;
  };

  const passwordErrors = getPasswordErrors();
  const isPasswordValid = newPassword.length > 0 && passwordErrors.length === 0;
  const isConfirmValid = confirmPassword.length > 0 && confirmPassword === newPassword;
  
  const canSavePassword = currentPassword.length > 0 && isPasswordValid && isConfirmValid && !isChangingPassword;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSavePassword) return;

    setIsChangingPassword(true);
    try {
      await userService.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.detail || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const hasChanges = profile ? (
    theme !== (profile.theme || "light") ||
    JSON.stringify(notifications) !== JSON.stringify(profile.notifications)
  ) : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
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
    <div className="min-h-screen bg-[#F5F7FB] font-sans text-gray-800">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/")}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Settings</h1>
          </div>
          
          {(activeTab === "appearance" || activeTab === "notifications") && (
            <button
              onClick={savePreferences}
              disabled={isSavingPrefs || !hasChanges}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-70 flex items-center gap-1.5"
            >
              <Save size={14} />
              {isSavingPrefs ? "Saving..." : "Save Preferences"}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          <button 
            onClick={() => setActiveTab("appearance")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'appearance' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Palette size={18} className={activeTab === 'appearance' ? 'text-indigo-600' : 'text-gray-400'} />
            Appearance
          </button>
          <button 
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Bell size={18} className={activeTab === 'notifications' ? 'text-indigo-600' : 'text-gray-400'} />
            Notifications
          </button>
          <button 
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Shield size={18} className={activeTab === 'security' ? 'text-indigo-600' : 'text-gray-400'} />
            Security
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden min-h-[400px]">
          
          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="p-8 animate-in fade-in duration-200">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Appearance</h2>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600 font-medium mb-2">Theme Preference</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                  {/* Light */}
                  <div 
                    onClick={() => setTheme("light")}
                    className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${theme === 'light' ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="w-full h-24 bg-gray-100 rounded-lg mb-3 border border-gray-200 flex flex-col p-2">
                      <div className="w-full h-4 bg-white rounded shadow-sm mb-2"></div>
                      <div className="w-1/2 h-full bg-white rounded shadow-sm"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">Light</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${theme === 'light' ? 'border-indigo-600' : 'border-gray-300'}`}>
                        {theme === 'light' && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                      </div>
                    </div>
                  </div>
                  
                  {/* Dark */}
                  <div 
                    onClick={() => setTheme("dark")}
                    className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${theme === 'dark' ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="w-full h-24 bg-gray-900 rounded-lg mb-3 border border-gray-800 flex flex-col p-2">
                      <div className="w-full h-4 bg-gray-800 rounded shadow-sm mb-2 border border-gray-700"></div>
                      <div className="w-1/2 h-full bg-gray-800 rounded shadow-sm border border-gray-700"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">Dark</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${theme === 'dark' ? 'border-indigo-600' : 'border-gray-300'}`}>
                        {theme === 'dark' && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                      </div>
                    </div>
                  </div>
                  
                  {/* System */}
                  <div 
                    onClick={() => setTheme("system")}
                    className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${theme === 'system' ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="w-full h-24 bg-gradient-to-br from-gray-100 to-gray-800 rounded-lg mb-3 border border-gray-300 flex items-center justify-center">
                      <span className="text-xs font-bold text-white bg-black/40 px-2 py-1 rounded">Auto</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">System</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${theme === 'system' ? 'border-indigo-600' : 'border-gray-300'}`}>
                        {theme === 'system' && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="p-8 animate-in fade-in duration-200">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Notifications</h2>
              
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Email Invitations</h4>
                    <p className="text-xs text-gray-500 mt-1">Receive emails when you are invited to a board.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.emailInvites}
                      onChange={(e) => setNotifications({...notifications, emailInvites: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Board Updates</h4>
                    <p className="text-xs text-gray-500 mt-1">Get notified when boards you own are updated.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.boardUpdates}
                      onChange={(e) => setNotifications({...notifications, boardUpdates: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Collaboration Activity</h4>
                    <p className="text-xs text-gray-500 mt-1">Updates about cursors, chats, and active sessions.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.collaboration}
                      onChange={(e) => setNotifications({...notifications, collaboration: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="p-8 animate-in fade-in duration-200">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Security Settings</h2>
              
              <div className="space-y-8 max-w-lg bg-white rounded-xl">
                {/* Change Password Form */}
                <form onSubmit={handlePasswordChange} className="space-y-5">
                  <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Change Password</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-medium transition-colors"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">New Password</label>
                    <div className="relative">
                      <input 
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white text-sm font-medium transition-colors ${
                          newPassword.length > 0 
                            ? (isPasswordValid ? 'border-green-300 focus:ring-green-500' : 'border-red-300 focus:ring-red-500')
                            : 'border-gray-200 focus:ring-indigo-500'
                        }`}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {newPassword.length > 0 && passwordErrors.length > 0 && (
                      <div className="text-[10px] text-red-500 mt-1 pl-1">
                        Must contain: {passwordErrors.join(', ')}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">Confirm New Password</label>
                    <div className="relative">
                      <input 
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white text-sm font-medium transition-colors ${
                          confirmPassword.length > 0
                            ? (isConfirmValid ? 'border-green-300 focus:ring-green-500' : 'border-red-300 focus:ring-red-500')
                            : 'border-gray-200 focus:ring-indigo-500'
                        }`}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && !isConfirmValid && (
                      <p className="text-[10px] text-red-500 mt-1 pl-1">Passwords do not match.</p>
                    )}
                  </div>
                  
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={!canSavePassword}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isChangingPassword ? "Saving..." : (
                        <>
                          <Save size={14} />
                          Save Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
