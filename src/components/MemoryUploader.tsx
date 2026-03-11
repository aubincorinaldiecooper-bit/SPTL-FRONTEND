"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud,
  Mic,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  X,
  CheckIcon,
  Download,
  Send,
  RotateCcw,
  Camera,
  Search,
  ChevronLeft,
  UserPlus,
  Check,
  X as XIcon,
  Pencil,
  Trash2,
  Share,
  Flag,
  MoreHorizontal
} from 'lucide-react';

interface Memory {
  id: string;
  photo: string;
  caption: string;
  audioURL: string | null;
  spzUrl: string | null;
  username: string;
  profilePhoto: string | null;
}

interface FeedMemoryResponse {
  id?: string | number;
  photo?: string;
  photo_url?: string;
  caption?: string;
  voice_note_url?: string | null;
  audio_url?: string | null;
  spz_url?: string | null;
  username?: string;
  user?: {
    username?: string;
    profile_photo_url?: string | null;
  };
  profile_photo?: string | null;
  profile_photo_url?: string | null;
}

interface User {
  id: string;
  username: string;
  profilePhoto: string | null;
  isFriend: boolean;
  requestSent: boolean;
  bio?: string;
}

interface Notification {
  id: string;
  type: 'shared' | 'tagged' | 'friend_request';
  username: string;
  message: string;
  time: string;
  fromUserId?: string;
}

// Icon Components
const Rotate3DIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M16.466 7.5C15.643 4.237 13.952 2 12 2 9.239 2 7 6.477 7 12s2.239 10 5 10c.342 0 .677-.069 1-.2"/>
    <path d="m15.194 13.707 3.814 1.86-1.86 3.814"/>
    <path d="M19 15.57c-1.804.885-4.274 1.43-7 1.43-5.523 0-10-2.239-10-5s4.477-5 10-5c4.838 0 8.873 1.718 9.8 4"/>
  </svg>
);

const FriendsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="10" cy="7" r="4"/>
    <path d="M10.3 15H7a4 4 0 0 0-4 4v2"/>
    <circle cx="17" cy="17" r="3"/>
    <path d="m21 21-1.9-1.9"/>
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const BellDotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M10.268 21a2 2 0 0 0 3.464 0"/>
    <path d="M11.68 2.009A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673c-.824-.85-1.678-1.731-2.21-3.348"/>
    <circle cx="18" cy="5" r="3"/>
  </svg>
);

// Toast Component
const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-foreground text-background px-4 py-2 rounded-full shadow-lg text-sm font-medium">
      {message}
    </div>
  );
};

const MemoryUploader: React.FC = () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [_currentTime, setCurrentTime] = useState(0);
  const [_duration, setDuration] = useState(0);
  const [caption, setCaption] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [fullViewMedia, setFullViewMedia] = useState<{ photoUrl: string; spzUrl: string | null } | null>(null);
  const [currentView, setCurrentView] = useState<'feed' | 'profile' | 'search' | 'notifications' | 'upload' | 'userProfile' | 'editProfile'>('feed');
  const [profileTab, setProfileTab] = useState<'saved' | 'shared' | 'archive'>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [myProfilePhoto, setMyProfilePhoto] = useState<string | null>(null);
  const [myBio, setMyBio] = useState('Living life one memory at a time ✨');
  const [myUsername, setMyUsername] = useState('user_name');
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [showPostMenu, setShowPostMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [playingMemoryId, setPlayingMemoryId] = useState<string | null>(null);
  const [reportedPosts, setReportedPosts] = useState<Set<string>>(new Set());
  
  const [users, setUsers] = useState<User[]>([
    { id: '1', username: 'sarah_travels', profilePhoto: null, isFriend: false, requestSent: false, bio: 'Travel enthusiast 🌍' },
    { id: '2', username: 'photo_mike', profilePhoto: null, isFriend: true, requestSent: false, bio: 'Capturing moments 📸' },
    { id: '3', username: 'alex_runner', profilePhoto: null, isFriend: false, requestSent: false, bio: 'Running through life 🏃' },
  ]);

  const [memories, setMemories] = useState<Memory[]>([]);

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', type: 'shared', username: 'alex_runner', message: 'just added to "shared album"', time: '2m ago' },
    { id: '2', type: 'tagged', username: 'sarah_travels', message: 'tagged you in a photo', time: '1h ago' },
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const feedAudioRef = useRef<HTMLAudioElement | null>(null);

  const showToast = (message: string) => {
    setToast(message);
  };

  const mapMemoryFromApi = (item: FeedMemoryResponse): Memory => ({
    id: String(item.id ?? Date.now()),
    photo: item.photo_url ?? item.photo ?? '',
    caption: item.caption ?? '',
    audioURL: item.voice_note_url ?? item.audio_url ?? null,
    spzUrl: item.spz_url ?? null,
    username: item.username ?? item.user?.username ?? 'unknown_user',
    profilePhoto: item.profile_photo_url ?? item.profile_photo ?? item.user?.profile_photo_url ?? null,
  });

  const loadFeed = async () => {
    try {
      setIsLoadingFeed(true);
      const response = await fetch(`${API_BASE_URL}/api/feed`);
      if (!response.ok) throw new Error(`Failed to load feed: ${response.status}`);
      const data = await response.json();
      const feedItems = Array.isArray(data) ? data : data?.results ?? data?.items ?? [];
      setMemories(feedItems.map((item: FeedMemoryResponse) => mapMemoryFromApi(item)).filter((memory: Memory) => memory.photo));
    } catch (error) {
      console.error(error);
      showToast('Could not load feed');
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    void loadFeed();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMyProfilePhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };


  const toggleFeedAudio = (memoryId: string, audioUrl: string) => {
    if (playingMemoryId === memoryId) {
      feedAudioRef.current?.pause();
      feedAudioRef.current = null;
      setPlayingMemoryId(null);
      return;
    }

    feedAudioRef.current?.pause();
    const nextAudio = new Audio(audioUrl);
    feedAudioRef.current = nextAudio;
    setPlayingMemoryId(memoryId);
    nextAudio.play().catch((error) => {
      console.error('Failed to play voice note', error);
      setPlayingMemoryId(null);
    });
    nextAudio.onended = () => setPlayingMemoryId(null);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handlePublish = async () => {
    if (!photoFile || !caption.trim()) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', photoFile);
      formData.append('caption', caption.trim());
      if (audioBlob) {
        formData.append('voice_note', audioBlob, 'voice-note.webm');
      }

      const uploadResponse = await fetch(`${API_BASE_URL}/api/spatial-photos`, {
        method: 'POST',
        body: formData,
      });
      if (!uploadResponse.ok) throw new Error(`Upload failed: ${uploadResponse.status}`);

      const uploadData = await uploadResponse.json();
      const jobId = uploadData?.job_id;
      if (!jobId) throw new Error('Missing job ID from upload response');

      let donePayload: Record<string, unknown> | null = null;
      while (!donePayload) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // eslint-disable-next-line no-await-in-loop
        const statusResponse = await fetch(`${API_BASE_URL}/api/spatial-photos/${jobId}/status`);
        if (!statusResponse.ok) throw new Error(`Status poll failed: ${statusResponse.status}`);
        // eslint-disable-next-line no-await-in-loop
        const statusData = await statusResponse.json();

        if (statusData?.status === 'done') {
          donePayload = statusData;
        } else if (statusData?.status === 'failed') {
          throw new Error('Spatial photo processing failed');
        }
      }

      const createdRaw = (donePayload.spatial_photo as FeedMemoryResponse | undefined) ?? (donePayload.item as FeedMemoryResponse | undefined);
      if (createdRaw) {
        const createdMemory = mapMemoryFromApi(createdRaw);
        setMemories((prev) => [createdMemory, ...prev.filter((memory) => memory.id !== createdMemory.id)]);
      } else {
        await loadFeed();
      }

      setCurrentView('feed');
      setPhoto(null);
      setPhotoFile(null);
      setCaption('');
      setAudioURL(null);
      setAudioBlob(null);
      setCurrentStep(0);
      setShowPreview(false);
      showToast('Memory uploaded');
    } catch (error) {
      console.error(error);
      showToast('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleShowPreview = () => {
    setShowPreview(true);
  };

  const handleBackToEdit = () => {
    setShowPreview(false);
  };

  const handleReRecord = () => {
    setAudioURL(null);
    setAudioBlob(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleDownload = () => {
    console.log('Downloading memory...');
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleShowPreview();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToUpload = () => {
    setCurrentView('upload');
    setPhoto(null);
    setPhotoFile(null);
    setCaption('');
    setAudioURL(null);
    setCurrentStep(0);
    setShowPreview(false);
  };

  const openFullView = (photoUrl: string, spzUrl: string | null) => {
    setFullViewMedia({ photoUrl, spzUrl });
  };

  const closeFullView = () => {
    setFullViewMedia(null);
  };

  const viewUserProfile = (username: string) => {
    const user = users.find(u => u.username === username);
    if (user) {
      setSelectedUser(user);
      setCurrentView('userProfile');
    }
  };

  const sendFriendRequest = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, requestSent: true } : u
    ));
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, requestSent: true } : null);
    }
  };

  const acceptFriendRequest = (fromUserId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === fromUserId ? { ...u, isFriend: true, requestSent: false } : u
    ));
    setNotifications(prev => prev.filter(n => n.fromUserId !== fromUserId));
  };

  const declineFriendRequest = (fromUserId: string) => {
    setNotifications(prev => prev.filter(n => n.fromUserId !== fromUserId));
  };

  const deletePost = (postId: string) => {
    setMemories(prev => prev.filter(m => m.id !== postId));
    setShowPostMenu(null);
  };

  const startEditCaption = (postId: string, currentCaption: string) => {
    setEditingPost(postId);
    setEditCaption(currentCaption);
    setShowPostMenu(null);
  };

  const saveEditCaption = (postId: string) => {
    setMemories(prev => prev.map(m => 
      m.id === postId ? { ...m, caption: editCaption } : m
    ));
    setEditingPost(null);
    setEditCaption('');
  };

  const sharePost = () => {
    showToast('Link copied');
    setShowPostMenu(null);
  };

  const reportPost = (postId: string) => {
    setReportedPosts(prev => new Set(prev).add(postId));
    setShowPostMenu(null);
  };

  const steps = [
    { id: 1, label: "Photo", field: "photo" },
    { id: 2, label: "Audio", field: "audio" },
    { id: 3, label: "Caption", field: "caption" },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const canProceed = () => {
    if (currentStep === 0) return photo !== null;
    if (currentStep === 1) return true;
    if (currentStep === 2) return caption.trim() !== '';
    return false;
  };

  // Warm gradient backgrounds for profile photos
  const warmGradients = [
    'from-orange-400 via-pink-500 to-rose-500',
    'from-amber-400 via-orange-500 to-red-500',
    'from-yellow-400 via-orange-400 to-pink-500',
    'from-rose-400 via-orange-400 to-amber-400',
  ];

  const getUserGradient = (username: string) => {
    const index = username.charCodeAt(0) % warmGradients.length;
    return warmGradients[index];
  };

  // Feed Card Component
  const FeedCard: React.FC<{ memory: Memory; isMyPost: boolean }> = ({ memory, isMyPost }) => {
    if (reportedPosts.has(memory.id)) return null;

    return (
      <div className="relative w-full max-w-md aspect-[4/5] rounded-3xl shadow-lg overflow-hidden bg-white">
        <img 
          src={memory.photo} 
          alt={memory.caption}
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
        
        {/* Top section */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between">
          <button
            onClick={() => viewUserProfile(memory.username)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold text-sm border-2 border-white/30 overflow-hidden", getUserGradient(memory.username))}>
              {memory.profilePhoto ? (
                <img src={memory.profilePhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                memory.username[0].toUpperCase()
              )}
            </div>
            <span className="text-white font-medium text-sm drop-shadow-md">{memory.username}</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => openFullView(memory.photo, memory.spzUrl)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <Rotate3DIcon className="w-5 h-5" />
            </button>
            
            {/* Post Menu */}
            <div className="relative">
              <button
                onClick={() => setShowPostMenu(showPostMenu === memory.id ? null : memory.id)}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              
              {showPostMenu === memory.id && (
                <div className="absolute top-full right-0 mt-2 bg-background rounded-xl shadow-lg border border-border overflow-hidden min-w-[140px] z-50">
                  {isMyPost ? (
                    <>
                      <button
                        onClick={() => startEditCaption(memory.id, memory.caption)}
                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted transition-colors text-left"
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="text-sm">Edit caption</span>
                      </button>
                      <button
                        onClick={() => sharePost()}
                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted transition-colors text-left"
                      >
                        <Share className="w-4 h-4" />
                        <span className="text-sm">Share</span>
                      </button>
                      <button
                        onClick={() => deletePost(memory.id)}
                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-red-500 transition-colors text-left"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Delete</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => sharePost()}
                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted transition-colors text-left"
                      >
                        <Share className="w-4 h-4" />
                        <span className="text-sm">Share</span>
                      </button>
                      <button
                        onClick={() => reportPost(memory.id)}
                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-red-500 transition-colors text-left"
                      >
                        <Flag className="w-4 h-4" />
                        <span className="text-sm">Report</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {editingPost === memory.id ? (
            <div className="bg-black/60 backdrop-blur-sm rounded-xl p-3">
              <input
                type="text"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className="w-full bg-transparent text-white text-sm outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setEditingPost(null)}
                  className="text-white/70 text-xs px-2 py-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveEditCaption(memory.id)}
                  className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-end justify-between gap-3">
              <h4 className="text-white font-semibold text-lg leading-tight line-clamp-2 drop-shadow-md flex-1">
                {memory.caption}
              </h4>

              {memory.audioURL && (
                <button
                  onClick={() => toggleFeedAudio(memory.id, memory.audioURL!)}
                  className="flex items-center justify-center w-12 h-12 bg-black/60 hover:bg-black/70 backdrop-blur-sm rounded-full shrink-0"
                >
                  {playingMemoryId === memory.id ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Header Component
  const Header = () => (
    <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
        <button 
          onClick={() => setCurrentView('profile')}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors overflow-hidden",
            currentView === 'profile' ? "ring-2 ring-primary" : "bg-muted hover:bg-muted/80"
          )}
        >
          {myProfilePhoto ? (
            <img src={myProfilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-5 h-5" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentView('notifications')}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors relative",
              currentView === 'notifications' ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            )}
          >
            <BellDotIcon className="w-5 h-5" />
            {notifications.some(n => n.type === 'friend_request') && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          <button 
            onClick={() => setCurrentView('search')}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              currentView === 'search' ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            )}
          >
            <FriendsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  // Other User Profile View
  const UserProfileView = () => {
    if (!selectedUser) return null;
    
    const userMemories = memories.filter(m => m.username === selectedUser.username && !reportedPosts.has(m.id));
    
    return (
      <div className="w-full h-screen bg-background overflow-hidden flex flex-col">
        <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="flex items-center gap-3 max-w-6xl mx-auto">
            <button 
              onClick={() => setCurrentView('feed')}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">{selectedUser.username}</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-md mx-auto">
            <div className={cn("h-48 bg-gradient-to-br flex items-end justify-center pb-0", getUserGradient(selectedUser.username))}>
              <div className="relative">
                <div className={cn("w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-2xl font-bold border-4 border-background overflow-hidden", getUserGradient(selectedUser.username))}>
                  {selectedUser.profilePhoto ? (
                    <img src={selectedUser.profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedUser.username[0].toUpperCase()
                  )}
                </div>
              </div>
            </div>

            <div className="text-center pt-4 pb-6">
              <h2 className="text-xl font-bold">{selectedUser.username}</h2>
              <p className="text-muted-foreground text-sm">@{selectedUser.username}</p>
              {selectedUser.bio && (
                <p className="text-sm text-muted-foreground mt-2 px-4">{selectedUser.bio}</p>
              )}
            </div>

            <div className="px-4 pb-6">
              {!selectedUser.isFriend && !selectedUser.requestSent && (
                <Button 
                  onClick={() => sendFriendRequest(selectedUser.id)}
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Request
                </Button>
              )}
              {!selectedUser.isFriend && selectedUser.requestSent && (
                <Button variant="outline" className="w-full" disabled>
                  <Check className="w-4 h-4 mr-2" />
                  Requested
                </Button>
              )}
              {selectedUser.isFriend && (
                <Button variant="outline" className="w-full" disabled>
                  <Check className="w-4 h-4 mr-2" />
                  Friends
                </Button>
              )}
            </div>

            {/* User's Posts - Same feed style */}
            <div className="px-4 pb-24 space-y-6">
              {userMemories.map((memory) => (
                <FeedCard key={memory.id} memory={memory} isMyPost={false} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Edit Profile View
  const EditProfileView = () => (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button 
            onClick={() => setCurrentView('profile')}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">Edit Profile</h2>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profile Photo */}
        <div className="flex flex-col items-center">
          <div 
            onClick={() => profilePhotoInputRef.current?.click()}
            className={cn("w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-2xl font-bold cursor-pointer overflow-hidden relative group", getUserGradient(myUsername))}
          >
            {myProfilePhoto ? (
              <img src={myProfilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              myUsername[0].toUpperCase()
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <input
            ref={profilePhotoInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePhotoUpload}
            className="hidden"
          />
          <p className="text-sm text-muted-foreground mt-2">Tap to change photo</p>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Username</label>
          <Input
            value={myUsername}
            onChange={(e) => setMyUsername(e.target.value)}
            placeholder="Enter username"
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Bio</label>
          <Textarea
            value={myBio}
            onChange={(e) => setMyBio(e.target.value)}
            placeholder="Tell us about yourself"
            className="min-h-[100px]"
          />
        </div>

        <Button 
          onClick={() => setCurrentView('profile')}
          className="w-full"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );

  // My Profile View
  const ProfileView = () => (
    <div className="w-full h-screen bg-background overflow-hidden flex flex-col">
      <div className="relative flex-shrink-0">
        <button 
          onClick={() => setCurrentView('feed')}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className={cn("h-48 bg-gradient-to-br flex items-end justify-center pb-0", getUserGradient(myUsername))}>
          <div className="relative">
            <div className={cn("w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-2xl font-bold border-4 border-background overflow-hidden", getUserGradient(myUsername))}>
              {myProfilePhoto ? (
                <img src={myProfilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                myUsername[0].toUpperCase()
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pt-4 pb-4 flex-shrink-0">
        <h2 className="text-xl font-bold">{myUsername}</h2>
        <p className="text-muted-foreground text-sm">@{myUsername}</p>
        <p className="text-sm text-muted-foreground mt-2 px-4">{myBio}</p>
        
        {/* Edit Profile Button */}
        <button
          onClick={() => setCurrentView('editProfile')}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
        >
          <Pencil className="w-4 h-4" />
          Edit Profile
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-1 px-4 pb-4 flex-shrink-0">
        {(['saved', 'shared', 'archive'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setProfileTab(tab)}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium capitalize transition-all",
              profileTab === tab 
                ? "bg-foreground text-background" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* My Posts - Same feed style */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="max-w-md mx-auto space-y-6">
          {memories
            .filter(m => m.username === myUsername && !reportedPosts.has(m.id))
            .map((memory) => (
              <FeedCard key={memory.id} memory={memory} isMyPost={true} />
            ))}
        </div>
      </div>
    </div>
  );

  // Search View
  const SearchView = () => (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <button 
            onClick={() => setCurrentView('feed')}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search users or albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 pb-24 max-w-md mx-auto">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Users</h3>
        <div className="space-y-2">
          {users.filter(u => 
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery === ''
          ).map((user) => (
            <button 
              key={user.id} 
              onClick={() => viewUserProfile(user.username)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className={cn("w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold", getUserGradient(user.username))}>
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  user.username[0].toUpperCase()
                )}
              </div>
              <div className="text-left flex-1">
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-muted-foreground">
                  {user.isFriend ? 'Friend' : user.requestSent ? 'Requested' : 'Tap to view'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Notifications View
  const NotificationsView = () => (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <button 
            onClick={() => setCurrentView('feed')}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
      </div>

      <div className="px-4 py-4 pb-24 max-w-md mx-auto">
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className="flex items-center gap-3 p-4 rounded-xl bg-muted/50"
            >
              <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold text-sm", getUserGradient(notif.username))}>
                {notif.username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{notif.username}</span>{' '}
                  {notif.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
              </div>
              {notif.type === 'friend_request' && notif.fromUserId && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => acceptFriendRequest(notif.fromUserId!)}
                    className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => declineFriendRequest(notif.fromUserId!)}
                    className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
              {notif.type !== 'friend_request' && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Full View Modal
  if (fullViewMedia) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <button
          onClick={closeFullView}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        {fullViewMedia.spzUrl ? (
          <iframe
            src={fullViewMedia.spzUrl}
            title="3D Spatial Viewer"
            className="w-full h-full border-0"
          />
        ) : (
          <img 
            src={fullViewMedia.photoUrl} 
            alt="Full view" 
            className="w-full h-full object-contain"
          />
        )}
      </div>
    );
  }

  // Toast
  if (toast) {
    return (
      <>
        <Toast message={toast} onClose={() => setToast(null)} />
        {/* Render the underlying view */}
      </>
    );
  }

  // User Profile View
  if (currentView === 'userProfile' && selectedUser) {
    return <UserProfileView />;
  }

  // Edit Profile View
  if (currentView === 'editProfile') {
    return <EditProfileView />;
  }

  // Profile View
  if (currentView === 'profile') {
    return <ProfileView />;
  }

  // Search View
  if (currentView === 'search') {
    return <SearchView />;
  }

  // Notifications View
  if (currentView === 'notifications') {
    return <NotificationsView />;
  }

  // Feed View
  if (currentView === 'feed') {
    return (
      <div className="w-full h-screen bg-background overflow-hidden flex flex-col">
        <Header />

        <div className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
          {isLoadingFeed && (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading feed...</div>
          )}
          {memories.filter(m => !reportedPosts.has(m.id)).map((memory) => (
            <div 
              key={memory.id}
              className="h-[calc(100vh-73px)] w-full snap-start relative flex items-center justify-center p-4"
            >
              <FeedCard memory={memory} isMyPost={memory.username === myUsername} />
            </div>
          ))}
        </div>

        <button
          onClick={goToUpload}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-14 h-14 rounded-full bg-foreground text-background shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        >
          <Camera className="w-6 h-6" />
        </button>
      </div>
    );
  }

  // Upload Flow with Header
  return (
    <div className="w-full h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <AnimatePresence mode="wait">
          {!showPreview ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              <div className="mb-10 flex items-center justify-center gap-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <button
                      onClick={() => index < currentStep && setCurrentStep(index)}
                      disabled={index > currentStep}
                      className={cn(
                        "group relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-700 ease-out",
                        "disabled:cursor-not-allowed",
                        index < currentStep && "bg-foreground/10 text-foreground/60",
                        index === currentStep && "bg-foreground text-background shadow-[0_0_20px_-5px_rgba(0,0,0,0.3)]",
                        index > currentStep && "bg-muted/50 text-muted-foreground/40",
                      )}
                    >
                      {index < currentStep ? (
                        <CheckIcon className="h-4 w-4 animate-in zoom-in duration-500" strokeWidth={2.5} />
                      ) : (
                        <span className="text-sm font-medium tabular-nums">{step.id}</span>
                      )}
                      {index === currentStep && (
                        <div className="absolute inset-0 rounded-full bg-foreground/20 blur-md animate-pulse" />
                      )}
                    </button>
                    {index < steps.length - 1 && (
                      <div className="relative h-[1.5px] w-12">
                        <div className="absolute inset-0 bg-[rgba(207,207,207,0.4)]" />
                        <div
                          className="absolute inset-0 bg-foreground/30 transition-all duration-700 ease-out origin-left"
                          style={{
                            transform: `scaleX(${index < currentStep ? 1 : 0})`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mb-8 overflow-hidden rounded-full bg-muted/30 h-[2px]">
                <div
                  className="h-full bg-gradient-to-r from-foreground/60 to-foreground transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="space-y-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-lg font-medium tracking-tight">
                        {currentStep === 0 && "Upload Photo"}
                        {currentStep === 1 && "Record Voice Note (Optional)"}
                        {currentStep === 2 && "Add Caption"}
                      </h3>
                      <span className="text-xs font-medium text-muted-foreground/60 tabular-nums">
                        {currentStep + 1}/{steps.length}
                      </span>
                    </div>

                    <div className="relative group">
                      {currentStep === 0 && (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors duration-200 cursor-pointer",
                            photo
                              ? "border-primary bg-primary/10"
                              : "border-muted-foreground/30 hover:border-primary/50"
                          )}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                          <AnimatePresence mode="wait">
                            {photo ? (
                              <motion.div
                                key="uploaded-photo"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative w-full"
                              >
                                <img
                                  src={photo}
                                  alt="Uploaded"
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 rounded-full w-8 h-8 shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPhoto(null);
                                    setPhotoFile(null);
                                    if (fileInputRef.current) {
                                      fileInputRef.current.value = '';
                                    }
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="upload-placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                              >
                                <UploadCloud className="w-10 h-10 text-muted-foreground mb-4" />
                                <p className="font-semibold text-foreground">Choose a photo or drag & drop it here.</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  JPEG, PNG formats, up to 10 MB.
                                </p>
                                <Button variant="outline" size="sm" className="mt-4 pointer-events-none">
                                  Browse Photo
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {currentStep === 1 && (
                        <div className="rounded-lg border p-8 bg-gradient-to-br from-muted/30 to-muted/10 backdrop-blur min-h-[200px] flex items-center justify-center">
                          <AnimatePresence mode="wait">
                            {!audioURL ? (
                              <motion.div
                                key="recording"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex p-3 border items-center justify-center rounded-full cursor-pointer shadow-lg"
                                layout
                                transition={{
                                  layout: {
                                    duration: 0.4,
                                  },
                                }}
                                onClick={isRecording ? stopRecording : startRecording}
                              >
                                <div className="h-6 w-6 items-center justify-center flex">
                                  {isRecording ? (
                                    <motion.div
                                      className="w-4 h-4 bg-primary rounded-sm"
                                      animate={{
                                        rotate: [0, 180, 360],
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Number.POSITIVE_INFINITY,
                                        ease: "easeInOut",
                                      }}
                                    />
                                  ) : (
                                    <Mic />
                                  )}
                                </div>
                                <AnimatePresence mode="wait">
                                  {isRecording && (
                                    <motion.div
                                      initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                                      animate={{ opacity: 1, width: "auto", marginLeft: 8 }}
                                      exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                                      transition={{
                                        duration: 0.4,
                                      }}
                                      className="overflow-hidden flex gap-2 items-center justify-center"
                                    >
                                      <div className="flex gap-0.5 items-center justify-center">
                                        {[...Array(12)].map((_, i) => (
                                          <motion.div
                                            key={i}
                                            className="w-0.5 bg-primary rounded-full"
                                            initial={{ height: 2 }}
                                            animate={{
                                              height: isRecording
                                                ? [2, 3 + Math.random() * 10, 3 + Math.random() * 5, 2]
                                                : 2,
                                            }}
                                            transition={{
                                              duration: isRecording ? 1 : 0.3,
                                              repeat: isRecording ? Infinity : 0,
                                              delay: isRecording ? i * 0.05 : 0,
                                              ease: "easeInOut",
                                            }}
                                          />
                                        ))}
                                      </div>
                                      <div className="text-xs text-muted-foreground w-10 text-center tabular-nums">
                                        {formatTime(recordingTime)}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="playback"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex flex-col items-center gap-4"
                              >
                                <Button
                                  onClick={togglePlayPause}
                                  variant="outline"
                                  size="icon"
                                  className="rounded-full w-16 h-16"
                                >
                                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                </Button>
                                <button
                                  onClick={handleReRecord}
                                  className="flex flex-col items-center gap-1 group"
                                >
                                  <RotateCcw className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                    Re-record
                                  </span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <audio
                            ref={audioRef}
                            src={audioURL || undefined}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onEnded={handleEnded}
                          />
                        </div>
                      )}

                      {currentStep === 2 && (
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Write a caption for your memory..."
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            autoFocus
                            className="min-h-[120px] resize-none text-base transition-all duration-500 border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur"
                          />
                          <div className="text-xs text-muted-foreground text-right tabular-nums">
                            {caption.length} / 500 characters
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="space-y-3">
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="w-full h-12 group relative transition-all duration-300 hover:shadow-lg hover:shadow-foreground/5"
                  >
                    <span className="flex items-center justify-center gap-2 font-medium">
                      {currentStep === steps.length - 1 ? "Preview" : "Continue"}
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5 duration-300"
                        strokeWidth={2}
                      />
                    </span>
                  </Button>

                  {currentStep > 0 && (
                    <button
                      onClick={handlePrevious}
                      className="w-full text-center text-sm text-muted-foreground/60 hover:text-foreground/80 transition-all duration-300"
                    >
                      Go back
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              <div className="flex items-center gap-3 mb-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full w-10 h-10 bg-muted hover:bg-muted/80" 
                  onClick={handleBackToEdit}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h3 className="text-lg font-semibold">Preview</h3>
              </div>

              <div className="relative aspect-[4/5] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.2)] overflow-hidden bg-white max-w-[380px] mx-auto">
                {photo && (
                  <img 
                    src={photo} 
                    alt="Memory Preview" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                
                <div className="absolute top-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold text-sm border-2 border-white/30 overflow-hidden">
                      {myProfilePhoto ? (
                        <img src={myProfilePhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        myUsername[0].toUpperCase()
                      )}
                    </div>
                    <span className="text-white font-medium text-sm drop-shadow-md">{myUsername}</span>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-end justify-between gap-3">
                    {caption && (
                      <h4 className="text-white font-semibold text-lg leading-tight line-clamp-2 drop-shadow-md flex-1">
                        {caption}
                      </h4>
                    )}

                    {audioURL && (
                      <button
                        onClick={togglePlayPause}
                        className="flex items-center justify-center w-12 h-12 bg-black/60 hover:bg-black/70 backdrop-blur-sm rounded-full shrink-0"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        )}
                      </button>
                    )}
                    <audio
                      ref={audioRef}
                      src={audioURL || undefined}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={handleEnded}
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4 mt-4 border-t border-white/20">
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-white/30 hover:text-white h-11"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={handlePublish}
                      disabled={isUploading}
                      className="flex-1 h-11"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MemoryUploader;
