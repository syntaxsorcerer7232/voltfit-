
export interface LocalAudioTrack {
  id: string;
  name: string;
  url: string;
  blob?: Blob;
}

// Global instances so music doesn't stop when menu closes
export const localAudioPlayer = new Audio();
export let globalLocalAudioTracks: LocalAudioTrack[] = [];
export let globalLocalAudioIndex = 0;
export let isLocalMusicLoaded = false;

export const setGlobalLocalAudioTracks = (tracks: LocalAudioTrack[]) => {
  globalLocalAudioTracks = tracks;
};

export const setGlobalLocalAudioIndex = (index: number) => {
  globalLocalAudioIndex = index;
};

export const setLocalMusicLoaded = (loaded: boolean) => {
  isLocalMusicLoaded = loaded;
};

export function skipNextLocalTrack() {
  if (globalLocalAudioIndex < globalLocalAudioTracks.length - 1) {
    const newIndex = globalLocalAudioIndex + 1;
    globalLocalAudioIndex = newIndex;
    localAudioPlayer.src = globalLocalAudioTracks[newIndex].url;
    localAudioPlayer.play().catch(console.warn);
    window.dispatchEvent(new Event('local_tracks_updated'));
  }
}

export function skipPrevLocalTrack() {
  if (globalLocalAudioIndex > 0) {
    const newIndex = globalLocalAudioIndex - 1;
    globalLocalAudioIndex = newIndex;
    localAudioPlayer.src = globalLocalAudioTracks[newIndex].url;
    localAudioPlayer.play().catch(console.warn);
    window.dispatchEvent(new Event('local_tracks_updated'));
  }
}
