"use client";

import Hls from "hls.js";
import { useCallback, useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  playbackUrl: string;
  isActive: boolean;
  onPlay?: () => void;
  onPause?: () => void;
}

export default function VideoPlayer({
  playbackUrl,
  isActive,
  onPlay,
  onPause,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS support (iOS)
      video.src = playbackUrl;
    }
  }, [playbackUrl]);

  // Auto-play/pause based on active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {
        // Autoplay blocked — user needs to interact first
      });
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  // iOS PWA audio unlock
  // In standalone mode, we need to unlock audio on the FIRST user gesture.
  // This creates a silent audio context that "unlocks" the audio pipeline.
  const unlockAudio = useCallback(() => {
    if (audioUnlocked) return;

    const video = videoRef.current;
    if (!video) return;

    // Create and resume an AudioContext on user gesture
    // This unlocks the audio pipeline in iOS standalone mode
    try {
      const AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof window.AudioContext })
          .webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        // Create a short silent buffer and play it
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);

        // Resume the context (required for iOS)
        if (ctx.state === "suspended") {
          ctx.resume();
        }
      }
    } catch {
      // AudioContext not available — continue without it
    }

    // Also try to play the video unmuted briefly to unlock
    video.muted = false;
    video
      .play()
      .then(() => {
        // If we don't want it unmuted yet, re-mute
        if (isMuted) {
          video.muted = true;
        }
      })
      .catch(() => {
        // Play failed — re-mute
        video.muted = true;
      });

    setAudioUnlocked(true);
  }, [audioUnlocked, isMuted]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Unlock audio on first interaction (iOS PWA)
    unlockAudio();

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      onPlay?.();
    } else {
      video.pause();
      setIsPlaying(false);
      onPause?.();
    }
  }, [unlockAudio, onPlay, onPause]);

  const toggleMute = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const video = videoRef.current;
      if (!video) return;

      // Unlock audio on first interaction (iOS PWA)
      unlockAudio();

      const newMuted = !video.muted;
      video.muted = newMuted;
      setIsMuted(newMuted);

      // If unmuting, ensure the video is playing
      if (!newMuted && video.paused) {
        video.play().catch(() => {});
      }
    },
    [unlockAudio]
  );

  return (
    <div
      data-testid="video-player"
      className="relative w-full h-full bg-black cursor-pointer"
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        data-testid="video-element"
        className="w-full h-full object-contain"
        playsInline
        webkit-playsinline=""
        muted={isMuted}
        loop
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Play/Pause overlay */}
      {!isPlaying && isActive && (
        <div
          data-testid="play-overlay"
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg
              className="w-8 h-8 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Custom Mute button — positioned below the safe area */}
      <button
        data-testid="mute-button"
        onClick={toggleMute}
        onTouchStart={toggleMute}
        className="absolute right-4 w-12 h-12 bg-black/50 rounded-full
             flex items-center justify-center backdrop-blur-sm
             hover:bg-black/70 active:bg-black/80 transition-colors z-20
             touch-manipulation"
        style={{
          top: "calc(env(safe-area-inset-top, 16px) + 8px)",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
      >
        {/* Physical mute switch reminder */}
        {!isMuted && isActive && (
          <div
            data-testid="unmute-hint"
            className="absolute left-4 bg-black/50 rounded-full px-3 py-1.5
               backdrop-blur-sm z-20 animate-pulse"
            style={{
              top: "calc(env(safe-area-inset-top, 16px) + 8px)",
              animationDuration: "3s",
              animationIterationCount: "2",
            }}
          >
            <p className="text-white text-xs">
              🔊 No sound? Check your phone&apos;s silent switch
            </p>
          </div>
        )}
      </button>

      {/* Physical mute switch reminder — shown when unmute fails */}
      {!isMuted && isActive && (
        <div
          data-testid="unmute-hint"
          className="absolute top-4 left-4 bg-black/50 rounded-full px-3 py-1.5
                     backdrop-blur-sm z-20 animate-pulse"
          style={{ animationDuration: "3s", animationIterationCount: "2" }}
        >
          <p className="text-white text-xs">
            🔊 No sound? Check your phone&apos;s silent switch
          </p>
        </div>
      )}
    </div>
  );
}
