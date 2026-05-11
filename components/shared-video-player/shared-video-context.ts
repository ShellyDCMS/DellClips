"use client";

import { createContext, useContext } from "react";

export interface SharedVideoState {
  isPlaying: boolean;
  isMuted: boolean;
  togglePlay: () => void;
  toggleMute: () => void;
}

const noop = () => {};

export const SharedVideoContext = createContext<SharedVideoState>({
  isPlaying: false,
  isMuted: true,
  togglePlay: noop,
  toggleMute: noop,
});

export const useSharedVideo = () => useContext(SharedVideoContext);
