"use client";

import { trackEvent } from "@/lib/analytics";
import Hls from "hls.js";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SharedVideoContext, type SharedVideoState } from "./shared-video-context";

interface SharedVideoPlayerProps {
  playbackUrl: string | null;
  isMuted: boolean;
  onToggleMute: () => void;
  children: ReactNode;
}

export default function SharedVideoPlayer({
  playbackUrl,
  isMuted,
  onToggleMute,
  children,
}: SharedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const isGoogleDrive = !!playbackUrl?.includes("drive.google.com");

  // Swap source + autoplay whenever playbackUrl changes. We always call
  // play() with whatever .muted state the element currently has. iOS keeps
  // the unmuted-playback credential on a persistent <video> element after
  // the user has unmuted it via a gesture, so subsequent src swaps continue
  // to autoplay with audio without needing a new gesture per video.
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

    video.play().catch(() => {
      // Autoplay blocked — only realistic when the user hasn't yet tapped
      // unmute and the element somehow lost its muted credential. Overlay
      // tap will start it.
    });

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playbackUrl, isGoogleDrive]);

  // Sync mute prop to the element. Toggling .muted = false here only
  // succeeds (i.e. iOS permits subsequent audio playback) because the
  // caller invokes this via a user tap on the mute button.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    if (!isMuted && video.paused) {
      video.play().catch(() => {});
    }
  }, [isMuted]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    onToggleMute();
  }, [onToggleMute]);

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
            muted
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
