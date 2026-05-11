"use client";
import { trackEvent } from "@/lib/analytics";
import Hls from "hls.js";
import { useCallback, useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  playbackUrl: string;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onPlay?: () => void;
  onPause?: () => void;
}

export default function VideoPlayer({
  playbackUrl,
  isActive,
  isMuted, // ← From parent (global state)
  onToggleMute,
  onPlay,
  onPause,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Detect if this is a Google Drive URL
  const isGoogleDrive = playbackUrl.includes("drive.google.com");

  // Effect 1: Initialize video source
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isHLS = playbackUrl.includes(".m3u8");

    if (isHLS && Hls.isSupported()) {
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
    } else if (isHLS && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = playbackUrl;
    } else {
      video.src = playbackUrl;
    }
  }, [playbackUrl]);

  // ============================================
  // EFFECT 2: Auto-play/pause based on scroll position
  // ============================================
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isActive) {
      video.pause();
      video.currentTime = 0;
      return;
    }

    let cancelled = false;

    const attemptPlay = () => {
      if (cancelled) return;
      const playPromise = video.play();
      if (playPromise === undefined) return;
      playPromise.catch(() => {
        // Autoplay blocked (typically because video is unmuted and the
        // browser requires a fresh user gesture). The tap-to-play overlay
        // will be shown — do not silently mute, since that would override
        // the user's global unmute preference.
      });
    };

    if (video.readyState >= 2) {
      attemptPlay();
    } else {
      const onReady = () => attemptPlay();
      video.addEventListener("canplay", onReady, { once: true });
      // Nudge iOS to start loading the source if it was unloaded.
      try {
        video.load();
      } catch {
        // ignore
      }
      return () => {
        cancelled = true;
        video.removeEventListener("canplay", onReady);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [isActive]);

  // Sync mute state to video element when it changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  // iOS PWA audio unlock
  const unlockAudio = useCallback(() => {
    if (audioUnlocked) return;

    const video = videoRef.current;
    if (!video) return;

    try {
      const AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof window.AudioContext })
          .webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);

        if (ctx.state === "suspended") {
          ctx.resume();
        }
      }
    } catch {
      // AudioContext not available
    }

    video.muted = false;
    video
      .play()
      .then(() => {
        if (isMuted) {
          video.muted = true;
        }
      })
      .catch(() => {
        video.muted = true;
      });

    setAudioUnlocked(true);
  }, [audioUnlocked, isMuted]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

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

      unlockAudio();
      onToggleMute(); // ← Call parent instead of local state

      // If unmuting, ensure the video is playing
      if (isMuted && video.paused) {
        video.play().catch(() => {});
      }
    },
    [unlockAudio, onToggleMute, isMuted]
  );
  // Google Drive: Use iframe (can't use <video> element)
  if (isGoogleDrive) {
    return (
      <div data-testid="video-player" className="relative w-full h-full bg-black">
        {isActive ? (
          <iframe
            src={playbackUrl}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="DellClips Video"
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-gray-700"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="video-player"
      className="relative w-full h-full bg-black cursor-pointer"
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        data-testid="video-element"
        className="w-full h-full object-cover"
        playsInline
        webkit-playsinline=""
        muted={isMuted}
        loop
        preload="metadata"
        onPlay={() => {
          setIsPlaying(true);
          trackEvent("video_view");
        }}
        onPause={() => setIsPlaying(false)}
      />

      {/* Play/Pause overlay — shown when auto-play is blocked or user paused */}
      {!isPlaying && isActive && (
        <div
          data-testid="play-overlay"
          className="absolute inset-0 flex flex-col items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
        >
          <div
            className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center
                    backdrop-blur-sm mb-3"
          >
            <svg
              className="w-8 h-8 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="text-white/60 text-xs">Tap to play</p>
        </div>
      )}

      {/* Custom Mute button */}
      <button
        data-testid="mute-button"
        onClick={toggleMute}
        onTouchStart={toggleMute}
        className="absolute right-4 z-20 w-12 h-12 bg-black/50 rounded-full
             flex items-center justify-center backdrop-blur-sm
             hover:bg-black/70 active:bg-black/80 transition-colors
             touch-manipulation"
        style={{
          top: "max(16px, env(safe-area-inset-top, 16px))",
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

      {/* Physical mute switch reminder */}
      {!isMuted && isActive && (
        <div
          data-testid="unmute-hint"
          className="absolute left-4 bg-black/50 rounded-full px-3 py-1.5
                     backdrop-blur-sm z-20 animate-pulse whitespace-nowrap"
          style={{
            top: "max(16px, env(safe-area-inset-top, 16px))",
            animationDuration: "3s",
            animationIterationCount: "2",
          }}
        >
          <p className="text-white text-xs">
            🔊 No sound? Check your phone&apos;s silent switch
          </p>
        </div>
      )}
    </div>
  );
}
