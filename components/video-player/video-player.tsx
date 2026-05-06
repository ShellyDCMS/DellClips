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

      {/* Custom Mute button — uses both onClick AND onTouchStart for iOS PWA */}
      <button
        data-testid="mute-button"
        onClick={toggleMute}
        onTouchStart={toggleMute}
        className="absolute top-4 right-4 w-12 h-12 bg-black/50 rounded-full
                   flex items-center justify-center backdrop-blur-sm
                   hover:bg-black/70 active:bg-black/80 transition-colors z-20
                   touch-manipulation"
        style={{
          // Ensure the button is above any native video controls
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
      >
        {isMuted ? (
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
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
