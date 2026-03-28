export interface Creator {
  id: string;
  name: string;
  avatar: string;
  followers: number;
}

export interface Character {
  id: string;
  name: string;
  color: string; // hex color for dialogue bubbles
  description: string; // detailed character description
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
  imageUrl: string; // base64 or file:// or http URL
  capInsets: {
    top: number;
    left: number;
    bottom: number;
    right: number;
  };
  tintable: boolean; // whether the bubble can be tinted with character colors
  createdAt: string;
  updatedAt: string;
}

export interface Block {
  id: string;
  type: 'text' | 'image' | 'BG';
  content: string;
  order: number;
  spacing?: number; // 0-10 for vertical spacing between blocks in reader
  // Text block specific properties
  textStyle?: {
    bubbleType?: 'plain' | 'dialogue' | 'thinking' | 'shout' | 'loud' | 'loud-convex' | 'machine' | 'bloom' | 'custom';
    customBubbleId?: string; // references CustomBubble.id when bubbleType is 'custom'
    characterId?: string; // references Character.id for dialogue bubbles
    alignment?: 'left' | 'center' | 'right';
    isBold?: boolean;
    isItalic?: boolean; // new formatting option
  };
  // Image block specific properties
  imageStyle?: {
    alignment?: 'left' | 'center' | 'right';
    sizeMode?: 'default' | 'original' | 'full';
    roundedCorners?: boolean; // whether corners are rounded
    meta?: {
      naturalW?: number;
      naturalH?: number;
    };
  };
  // BG block specific properties
  bgStyle?: {
    mode: 'OPEN' | 'CLOSE' | 'BRIDGE';
    bracket?: 'OPEN' | 'CLOSE';
    imageUrl?: string;
    transition?: 'fade' | 'hard';
    fadeEdge?: boolean;
  };
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  projectId: string;
  blocks: Block[];
  readTime: number; // in minutes
  status: 'draft' | 'published';
  version: number;
  createdAt: string;
  updatedAt: string;
  characterAppearances: string[]; // auto-calculated character IDs
  spacing?: number; // 0-10 for vertical spacing between blocks in reader
  globalSpacing?: number; // global spacing applied to all blocks
  afterNote?: string; // optional text note at the end of chapter for readers
}

export interface RichBlock {
  type: 'text' | 'image';
  content?: string;
  url?: string;
  alt?: string;
  font?: 'FontA' | 'FontB' | 'FontC';
  color?: string; // hex color
}

export interface BroadcastIntro {
  images: string[];
  longDesc?: string;
  swipe: 'right' | 'down';
}

export interface BroadcastData {
  coverUrl?: string;
  shortDesc?: string;
  tags?: string[];
  queue: string[]; // ordered list of chapter IDs added via "To Broadcast"
  intro?: BroadcastIntro;
  pricing?: 'free_first3_latest5_paid' | 'latest5_paid' | 'all_free' | 'custom';
}

export interface OnAirSnapshot {
  coverUrl?: string;
  shortDesc?: string;
  tags?: string[];
  chapters: string[]; // ordered list of published chapter IDs
  intro?: BroadcastIntro;
  pricing?: 'free_first3_latest5_paid' | 'latest5_paid' | 'all_free' | 'custom';
  publishedAt: string;
}

export interface Project {
  id: string;
  title: string;
  cover: string;
  tags: string[];
  description: string;
  shortDescription?: string; // new field for teaser
  longDescription?: RichBlock[]; // new field for rich content
  creatorId: string;
  creator: Creator;
  chapters: Chapter[];
  characters: Character[]; // story characters with assigned colors
  customBubbles?: CustomBubble[]; // custom bubble templates for this project
  stats: {
    likes: number;
    views: number;
    opens: number;
  };
  broadcast?: BroadcastData;
  onAirSnapshot?: OnAirSnapshot;
  bookmarked?: boolean;
  subscribed?: boolean;
  createdAt: string;
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
  totalUSD: number; // conversion rate: 100 coins = $1
  transactions: CoinTransaction[];
  monthlyEarnings: {
    month: string;
    coins: number;
    usd: number;
  }[];
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
  balance: number; // in coins
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