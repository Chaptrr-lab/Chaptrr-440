// ================================================================================
// CHAPTRR TYPES v4.0
// ================================================================================

export interface Creator {
  id: string;
  name: string;
  avatar: string;
  followers: number;
  bio?: string;
}

export interface Character {
  id: string;
  name: string;
  color: string; // hex color for dialogue bubbles
  description: string;
  relationships?: {
    characterId: string;
    relationshipType: 'friend' | 'enemy' | 'family' | 'romantic' | 'mentor' | 'rival';
    description: string;
  }[];
  appearances: string[]; // array of chapter IDs where character appears
  createdAt: string;
  updatedAt: string;
}

export interface CustomBubble {
  id: string;
  projectId: string;
  name: string;
  imageUrl: string;
  capInsets: { top: number; left: number; bottom: number; right: number };
  tintable: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Beat Effect (anchored to a block, fires when block hits center-screen) ----

export interface BeatEffect {
  type:
    | 'blade-swipe'
    | 'impact-burst'
    | 'rain-fall'
    | 'heartbeat'
    | 'shatter'
    | 'cross-slash'
    | 'shockwave'
    | 'tremor'
    | 'wind-sweep'
    | 'ember-rise'
    | 'mist-rise'
    | 'spiral-descent'
    | 'pressure-lines'
    | 'bloom'
    | 'fade-sweep'
    | string; // extensible for community beats
  trigger: 'center-enter';
  intensity: number; // 0–1
  duration: 'instant' | 'sustain' | 'linger';
}

// ---- Inline text color ----

export interface ColorPair {
  light: string;
  dark: string;
}

export interface ColorRange {
  start: number; // character index
  end: number;
  colorPair: ColorPair;
}

// ---- Block ----

export interface Block {
  id: string;
  type: 'text' | 'image' | 'BG';
  content: string;
  order: number;
  spacing?: number;
  textStyle?: {
    bubbleType?:
      | 'plain'
      | 'dialogue'
      | 'thinking'
      | 'shout'
      | 'loud'
      | 'loud-convex'
      | 'machine'
      | 'bloom'
      | 'custom';
    customBubbleId?: string;
    characterId?: string;
    alignment?: 'left' | 'center' | 'right';
    emotionAccessory?:
      | 'nervous'
      | 'embarrass'
      | 'daze'
      | 'fright'
      | 'sad'
      | 'shout'
      | 'whisper'
      | 'love'
      | 'anger'
      | 'surprise'
      | 'think'
      | 'sarcasm'
      | 'cold';
    isBold?: boolean;
    isItalic?: boolean;
    isStrikethrough?: boolean;
    spacing?: 'tight' | 'normal' | 'loose';
    colorRanges?: ColorRange[];
  };
  imageStyle?: {
    alignment?: 'left' | 'center' | 'right';
    sizeMode?: 'default' | 'original' | 'full';
    roundedCorners?: boolean;
    meta?: { naturalW?: number; naturalH?: number };
  };
  bgStyle?: {
    mode: 'OPEN' | 'CLOSE' | 'BRIDGE';
    bracket?: 'OPEN' | 'CLOSE';
    imageUrl?: string;
    transition?: 'fade' | 'hard';
    fadeEdge?: boolean;
  };
  beatEffect?: BeatEffect;
  entranceAnimation?: 'fade-up' | 'pop' | 'slide-left' | 'none';
}

// ---- Scene visual context ----

export interface ParallaxLayer {
  imageUrl: string;
  speedMultiplier: number; // 0.3 = slow/far, 0.9 = fast/near
  zIndex: number;
}

export interface LocationHeader {
  imageUrl?: string;
  parallaxLayers?: ParallaxLayer[];
  height: number; // px — 180 first appearance, 120 return
  transition?: 'fade' | 'slide' | 'dissolve';
  name?: string;
  timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night';
}

export interface Atmosphere {
  type:
    | 'rain-fall'
    | 'heavy-rain'
    | 'snow-fall'
    | 'heavy-snow'
    | 'ember-rise'
    | 'cherry-blossoms'
    | 'fog-drift'
    | 'dust-motes'
    | 'light-rays'
    | 'dark-vignette'
    | 'mist-ground'
    | string;
  intensity: number; // 0–1
  scrollSynced: boolean;
  particleSvg?: string;
  density?: number;
  speed?: number;
}

export interface MoodTint {
  color: string;
  opacity: number;
  gradient?: 'vignette' | 'top-down' | 'uniform';
}

export interface Scene {
  id: string;
  order: number;
  templatePackId?: string;
  locationHeader?: LocationHeader;
  atmosphere?: Atmosphere;
  moodTint?: MoodTint;
  blocks: Block[];
  overrides?: Record<string, unknown>;
}

// ---- Template Pack ----

export interface TemplatePack {
  id: string;
  name: string;
  description: string;
  previewImageUrl?: string;
  genre: string[];
  locationHeader?: {
    layers: {
      imageUrl: string;
      speedMultiplier: number;
      zIndex: number;
    }[];
    height: number;
  };
  atmosphere?: {
    type: string;
    particleSvg?: string;
    density: number;
    speed: number;
    scrollSynced: boolean;
  };
  moodTint?: {
    color: string;
    opacity: number;
    gradient: 'vignette' | 'top-down' | 'uniform';
  };
  suggestedBeats?: {
    type: string;
    svgTemplate?: string;
    defaultIntensity: number;
  }[];
  bubbleOverrides?: {
    borderColor?: string;
    backgroundColor?: string;
    shadowColor?: string;
  };
}

// ---- Reader account settings ----

export interface ReaderAccountSettings {
  fontOverride?: string;
  textSizeMultiplier: number; // 0.8–1.5
  theme: 'light' | 'dark' | 'system';
}

// ---- Chapter ----

export interface Chapter {
  id: string;
  title: string;
  order: number;
  projectId: string;
  /** What the writer always edits. */
  scenes: Scene[];
  /** What readers see. Copied from scenes on Go Live / Push Update. */
  liveScenes?: Scene[];
  /** Whether this chapter is visible to readers. */
  live: boolean;
  /** If set, chapter auto-goes-live at this date/time. */
  scheduled?: {
    date: string; // ISO date
    time: string; // HH:MM
    timezone: string;
  };
  /** ISO timestamp of when it first went live. */
  liveAt?: string;
  /** True if scenes have changed since the last Go Live / Push Update. */
  editedSinceLive: boolean;
  readTime: number; // minutes
  version: number;
  createdAt: string;
  updatedAt: string;
  characterAppearances: string[];
  globalSpacing?: number;
  afterNote?: string;
}

// ---- Project ----

export interface StorySettings {
  fontFamily?: string;
  fontSize?: 'small' | 'medium' | 'large';
  spacingScale?: {
    tight: number;  // px
    normal: number;
    loose: number;
  };
}

export interface Project {
  id: string;
  title: string;
  cover: string;
  tags: string[];
  description: string;
  shortDescription?: string;
  longDescription?: RichBlock[];
  creatorId: string;
  creator: Creator;
  chapters: Chapter[];
  characters: Character[];
  customBubbles?: CustomBubble[];
  stats: { likes: number; views: number; opens: number };
  storySettings?: StorySettings;
  broadcast?: BroadcastData;
  onAirSnapshot?: OnAirSnapshot;
  bookmarked?: boolean;
  subscribed?: boolean;
  createdAt: string;
}

// ---- Broadcast (legacy, kept for studio/onair screens) ----

export interface BroadcastIntro {
  images: string[];
  longDesc?: string;
  swipe: 'right' | 'down';
}

export interface BroadcastData {
  coverUrl?: string;
  shortDesc?: string;
  tags?: string[];
  queue: string[];
  intro?: BroadcastIntro;
  pricing?: 'free_first3_latest5_paid' | 'latest5_paid' | 'all_free' | 'custom';
}

export interface OnAirSnapshot {
  coverUrl?: string;
  shortDesc?: string;
  tags?: string[];
  chapters: string[];
  intro?: BroadcastIntro;
  pricing?: 'free_first3_latest5_paid' | 'latest5_paid' | 'all_free' | 'custom';
  publishedAt: string;
}

// ---- Misc / legacy ----

export interface RichBlock {
  type: 'text' | 'image';
  content?: string;
  url?: string;
  alt?: string;
  font?: 'FontA' | 'FontB' | 'FontC';
  color?: string;
}

export interface CoinTransaction {
  id: string;
  type: 'earned' | 'withdrawn' | 'spent';
  amount: number;
  source: 'chapter_read' | 'story_like' | 'subscription' | 'withdrawal' | 'purchase';
  projectId?: string;
  chapterId?: string;
  description: string;
  timestamp: string;
}

export interface EarningsData {
  totalCoins: number;
  totalUSD: number;
  transactions: CoinTransaction[];
  monthlyEarnings: { month: string; coins: number; usd: number }[];
  projectEarnings: {
    projectId: string;
    projectTitle: string;
    totalCoins: number;
    totalUSD: number;
    chapterBreakdown: {
      chapterId: string;
      chapterTitle: string;
      coins: number;
      reads: number;
    }[];
  }[];
}

export interface AnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalReads: number;
  totalSubscribers: number;
  monthlyStats: {
    month: string;
    views: number;
    likes: number;
    reads: number;
    newSubscribers: number;
  }[];
  topChapters: {
    chapterId: string;
    chapterTitle: string;
    projectTitle: string;
    views: number;
    likes: number;
    reads: number;
  }[];
  topProjects: {
    projectId: string;
    projectTitle: string;
    views: number;
    likes: number;
    reads: number;
  }[];
}

export interface WalletData {
  address?: string;
  connected: boolean;
  balance: number;
  pendingWithdrawals: {
    id: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    requestedAt: string;
    completedAt?: string;
  }[];
}

export interface FeedPost {
  id: string;
  project: Project;
  hookLine: string;
  score: number;
}
