"use client";

import { trackEvent } from "@/lib/analytics";
import Hls from "hls.js";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SharedVideoContext, type SharedVideoState } from "./shared-video-context";

interface SharedVideoPlayerProps {
  playbackUrl: string | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onMutedFallback?: () => void;
  children: ReactNode;
}

export default function SharedVideoPlayer({
  playbackUrl,
  isMuted,
  onToggleMute,
  onMutedFallback,
  children,
}: SharedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const audioUnlockedRef = useRef(false);
  const userWantsUnmutedRef = useRef(!isMuted);
  const [isPlaying, setIsPlaying] = useState(false);

  const isGoogleDrive = !!playbackUrl?.includes("drive.google.com");

  // Source initialization — runs whenever playbackUrl changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl || isGoogleDrive) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHLS = playbackUrl.includes(".m3u8");
    if (isHLS && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else {
      video.src = playbackUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playbackUrl, isGoogleDrive]);

  // Autoplay on source change — try unmuted, fall back to muted if blocked
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl || isGoogleDrive) return;

    let cancelled = false;
    const attemptPlay = async () => {
      if (cancelled) return;
      try {
        await video.play();
      } catch {
        if (cancelled) return;
        // Unmuted autoplay blocked — fall back to muted and retry so the
        // video at least plays; user can tap unmute to enable audio.
        if (!video.muted) {
          video.muted = true;
          onMutedFallback?.();
          try {
            await video.play();
          } catch {
            // Even muted autoplay blocked — overlay tap will start it.
          }
        }
      }
    };

    if (video.readyState >= 2) {
      attemptPlay();
    } else {
      const onReady = () => attemptPlay();
      video.addEventListener("canplay", onReady, { once: true });
      // Nudge the browser to actually fetch enough data to fire canplay
      // (iOS often won't fire it with preload="metadata" alone).
      video.load();
      return () => {
        cancelled = true;
        video.removeEventListener("canplay", onReady);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [playbackUrl, isGoogleDrive, onMutedFallback]);

  // Track when the user explicitly wants audio so we can restore unmuted
  // playback on the first interaction after a muted-fallback.
  useEffect(() => {
    if (!isMuted) userWantsUnmutedRef.current = true;
  }, [isMuted]);

  // Sync mute prop to video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  // iOS PWA audio unlock — primes AudioContext so first user gesture
  // can flip muted → unmuted without further restrictions.
  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;

    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof window.AudioContext })
          .webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        if (ctx.state === "suspended") ctx.resume();
      }
    } catch {
      // AudioContext not available
    }
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    unlockAudio();
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [unlockAudio]);

  const toggleMute = useCallback(() => {
    unlockAudio();
    onToggleMute();
  }, [unlockAudio, onToggleMute]);

  const contextValue = useMemo<SharedVideoState>(
    () => ({ isPlaying, isMuted, togglePlay, toggleMute }),
    [isPlaying, isMuted, togglePlay, toggleMute]
  );

  return (
    <SharedVideoContext.Provider value={contextValue}>
      <div className="absolute inset-0 z-0 bg-black" data-testid="shared-video-layer">
        {playbackUrl && isGoogleDrive ? (
          <iframe
            src={playbackUrl}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="DellClips Video"
          />
        ) : (
          <video
            ref={videoRef}
            data-testid="video-element"
            className="w-full h-full object-cover"
            playsInline
            webkit-playsinline=""
            muted={isMuted}
            loop
            preload="auto"
            onPlay={() => {
              setIsPlaying(true);
              trackEvent("video_view");
            }}
            onPause={() => setIsPlaying(false)}
          />
        )}
      </div>
      {children}
    </SharedVideoContext.Provider>
  );
}

// Re-export so consumers can import from one path
export type { SharedVideoState } from "./shared-video-context";
