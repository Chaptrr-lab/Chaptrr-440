import { Creator, Project, FeedPost, Block, Chapter, Character, Scene, TemplatePack } from '@/types';

// ---- Creators ----

export const mockCreators: Creator[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    followers: 12500,
  },
  {
    id: '2',
    name: 'Marcus Rivera',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    followers: 8900,
  },
  {
    id: '3',
    name: 'Luna Park',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    followers: 15200,
  },
  {
    id: '4',
    name: 'Alex Thompson',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    followers: 6700,
  },
  {
    id: '5',
    name: 'Maya Patel',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    followers: 9800,
  },
];

// ---- Template Packs ----

export const mockTemplatePacks: TemplatePack[] = [
  {
    id: 'pack-urban-night',
    name: 'Urban Night',
    description: 'Rain-slicked city streets, neon reflections, and the pulse of the night.',
    genre: ['urban', 'thriller', 'noir', 'romance'],
    locationHeader: {
      layers: [
        { imageUrl: '', speedMultiplier: 0.3, zIndex: 0 },
        { imageUrl: '', speedMultiplier: 0.6, zIndex: 1 },
      ],
      height: 180,
    },
    atmosphere: {
      type: 'rain-fall',
      density: 0.6,
      speed: 1.2,
      scrollSynced: false,
    },
    moodTint: {
      color: '#1a2a4a',
      opacity: 0.35,
      gradient: 'vignette',
    },
    suggestedBeats: [
      { type: 'shatter', defaultIntensity: 0.8 },
      { type: 'impact-burst', defaultIntensity: 0.7 },
    ],
    bubbleOverrides: {
      borderColor: '#3a7be0',
      shadowColor: '#1a3a6a',
    },
  },
  {
    id: 'pack-forest-calm',
    name: 'Forest Calm',
    description: 'Ancient canopy, drifting leaves, and the quiet of deep woods.',
    genre: ['fantasy', 'nature', 'cozy', 'adventure'],
    locationHeader: {
      layers: [
        { imageUrl: '', speedMultiplier: 0.3, zIndex: 0 },
        { imageUrl: '', speedMultiplier: 0.6, zIndex: 1 },
      ],
      height: 180,
    },
    atmosphere: {
      type: 'cherry-blossoms',
      density: 0.4,
      speed: 0.5,
      scrollSynced: true,
    },
    moodTint: {
      color: '#1a3a2a',
      opacity: 0.25,
      gradient: 'top-down',
    },
    suggestedBeats: [
      { type: 'bloom', defaultIntensity: 0.6 },
      { type: 'wind-sweep', defaultIntensity: 0.5 },
    ],
  },
  {
    id: 'pack-confrontation',
    name: 'Confrontation',
    description: 'Tension builds, blades cross, and the world holds its breath.',
    genre: ['action', 'fantasy', 'thriller', 'drama'],
    atmosphere: {
      type: 'ember-rise',
      density: 0.5,
      speed: 0.8,
      scrollSynced: false,
    },
    moodTint: {
      color: '#3a0a0a',
      opacity: 0.4,
      gradient: 'vignette',
    },
    suggestedBeats: [
      { type: 'blade-swipe', defaultIntensity: 0.9 },
      { type: 'shatter', defaultIntensity: 0.85 },
      { type: 'impact-burst', defaultIntensity: 0.8 },
    ],
    bubbleOverrides: {
      borderColor: '#cc2222',
      shadowColor: '#660000',
    },
  },
];

// ---- Helpers ----

let _blockCounter = 0;
const bid = () => `block-mock-${++_blockCounter}`;
const sid = (n: number) => `scene-mock-${n}-${Date.now()}`;

export const createBlocks = (
  content: {
    type: 'text' | 'image' | 'BG';
    content: string;
    textStyle?: Block['textStyle'];
  }[]
): Block[] =>
  content.map((item, index) => ({
    id: bid(),
    type: item.type,
    content: item.content,
    order: index,
    textStyle: item.textStyle,
    imageStyle: item.type === 'image' ? { alignment: 'center' as const, sizeMode: 'default' as const } : undefined,
  }));

export const createChapters = (
  projectId: string,
  chaptersData: {
    title: string;
    scenes: Omit<Scene, 'id'>[];
    readTime: number;
    live?: boolean;
  }[]
): Chapter[] =>
  chaptersData.map((chapterData, index) => {
    const scenes: Scene[] = chapterData.scenes.map((s, si) => ({
      ...s,
      id: `${projectId}-ch${index}-s${si}`,
    }));
    const allBlocks = scenes.flatMap((s) => s.blocks);
    return {
      id: `chapter-${projectId}-${index}`,
      title: chapterData.title,
      order: index,
      projectId,
      scenes,
      liveScenes: chapterData.live !== false ? scenes : undefined,
      live: chapterData.live !== false,
      editedSinceLive: false,
      readTime: chapterData.readTime,
      version: 1,
      createdAt: new Date(Date.now() - (30 - index) * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - (25 - index) * 24 * 60 * 60 * 1000).toISOString(),
      characterAppearances: allBlocks
        .filter((b) => b.textStyle?.characterId)
        .map((b) => b.textStyle!.characterId!)
        .filter((id, i, arr) => arr.indexOf(id) === i),
    };
  });

// ---- Mock Projects ----

export const mockProjects: Project[] = [
  // ---- Project 1: The Digital Nomad's Journey (DEMO chapter with full decoration) ----
  {
    id: '1',
    title: "The Digital Nomad's Journey",
    cover:
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=600&fit=crop',
    tags: ['Travel', 'Technology', 'Lifestyle'],
    description:
      'From corporate burnout to digital freedom — my journey across 15 countries.',
    shortDescription:
      'From corporate burnout to digital freedom — my journey across 15 countries.',
    creatorId: '1',
    creator: mockCreators[0],
    characters: [
      {
        id: 'char-1',
        name: 'Sarah',
        color: '#6366f1',
        description: 'Corporate worker turned digital nomad.',
        appearances: ['chapter-1-0', 'chapter-1-1'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'char-2',
        name: 'Leo',
        color: '#f59e0b',
        description: "Sarah's travel companion and tech advisor.",
        appearances: ['chapter-1-1'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    chapters: createChapters('1', [
      // Chapter 1 — The Decorated Demo Chapter
      {
        title: 'The Last Monday',
        readTime: 6,
        live: true,
        scenes: [
          // Scene 1 — Office (Urban Night pack)
          {
            order: 0,
            templatePackId: 'pack-urban-night',
            locationHeader: {
              name: 'Meridian Corp — 34th Floor',
              timeOfDay: 'night',
              height: 180,
              transition: 'fade',
            },
            atmosphere: {
              type: 'rain-fall',
              intensity: 0.5,
              scrollSynced: false,
            },
            moodTint: {
              color: '#1a2a4a',
              opacity: 0.3,
              gradient: 'vignette',
            },
            blocks: createBlocks([
              {
                type: 'text',
                content:
                  'The fluorescent lights had been flickering for three years. Sarah had stopped filing maintenance tickets.',
                textStyle: { bubbleType: 'plain', spacing: 'normal' },
              },
              {
                type: 'text',
                content: 'Tonight was different.',
                textStyle: { bubbleType: 'plain', spacing: 'loose', isBold: true },
              },
              {
                type: 'text',
                content: '"You look terrible," Leo said from the doorway.',
                textStyle: {
                  bubbleType: 'dialogue',
                  characterId: 'char-2',
                  alignment: 'left',
                  emotionAccessory: 'nervous',
                },
              },
              {
                type: 'text',
                content: '"I feel worse." She didn\'t look up from the spreadsheet.',
                textStyle: {
                  bubbleType: 'dialogue',
                  characterId: 'char-1',
                  alignment: 'right',
                  emotionAccessory: 'daze',
                },
              },
              {
                type: 'text',
                content:
                  'The email had been sitting in her drafts for six months. RESIGNATION LETTER.docx.',
                textStyle: { bubbleType: 'plain', spacing: 'normal' },
              },
              {
                type: 'text',
                content: 'She hit send.',
                textStyle: { bubbleType: 'plain', isBold: true },
                // beatEffect would be added here for a real scene
              },
            ]),
          },
          // Scene 2 — Rooftop (Confrontation mood shift)
          {
            order: 1,
            templatePackId: 'pack-confrontation',
            locationHeader: {
              name: 'Rooftop — 2:17 AM',
              timeOfDay: 'night',
              height: 120,
              transition: 'dissolve',
            },
            atmosphere: {
              type: 'fog-drift',
              intensity: 0.4,
              scrollSynced: true,
            },
            moodTint: {
              color: '#0a0a1a',
              opacity: 0.45,
              gradient: 'vignette',
            },
            blocks: createBlocks([
              {
                type: 'text',
                content: 'The city was a circuit board seen from above.',
                textStyle: { bubbleType: 'plain', spacing: 'loose' },
              },
              {
                type: 'text',
                content:
                  '"Where will you go first?" Leo handed her a coffee, steam rising in the cold air.',
                textStyle: {
                  bubbleType: 'dialogue',
                  characterId: 'char-2',
                  alignment: 'left',
                  emotionAccessory: 'think',
                },
              },
              {
                type: 'text',
                content: 'She looked at him. For the first time in years, she smiled.',
                textStyle: { bubbleType: 'plain', spacing: 'normal' },
              },
              {
                type: 'text',
                content: '"Everywhere."',
                textStyle: {
                  bubbleType: 'dialogue',
                  characterId: 'char-1',
                  alignment: 'right',
                  emotionAccessory: 'love',
                  isBold: true,
                },
              },
            ]),
          },
        ],
      },
      // Chapter 2 — simpler, published
      {
        title: 'First Flight',
        readTime: 4,
        live: true,
        scenes: [
          {
            order: 0,
            blocks: createBlocks([
              {
                type: 'text',
                content: 'She had never packed so light.',
                textStyle: { bubbleType: 'plain' },
              },
              {
                type: 'text',
                content: '"One bag. That\'s all you need," the travel blog had promised.',
                textStyle: { bubbleType: 'plain' },
              },
              {
                type: 'text',
                content: '"That blog lied," she muttered, standing at the gate with two.'  ,
                textStyle: {
                  bubbleType: 'dialogue',
                  characterId: 'char-1',
                  alignment: 'right',
                  emotionAccessory: 'embarrass',
                },
              },
            ]),
          },
        ],
      },
      // Chapter 3 — draft (not live)
      {
        title: 'Learning to Stay Still',
        readTime: 0,
        live: false,
        scenes: [
          {
            order: 0,
            blocks: createBlocks([
              {
                type: 'text',
                content: '[Draft in progress…]',
                textStyle: { bubbleType: 'plain' },
              },
            ]),
          },
        ],
      },
    ]),
    stats: { likes: 2341, views: 18920, opens: 9200 },
    bookmarked: false,
    subscribed: false,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ---- Project 2: Midnight in Tokyo ----
  {
    id: '2',
    title: 'Midnight in Tokyo',
    cover:
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=600&fit=crop',
    tags: ['Romance', 'Urban', 'Mystery'],
    description:
      'A photographer discovers more than images in the lantern-lit alleys of Tokyo.',
    shortDescription:
      'A photographer discovers more than images in the lantern-lit alleys of Tokyo.',
    creatorId: '2',
    creator: mockCreators[1],
    characters: [
      {
        id: 'char-3',
        name: 'Hana',
        color: '#ec4899',
        description: 'A documentary photographer, looking for the real Tokyo.',
        appearances: ['chapter-2-0'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'char-4',
        name: 'Kenji',
        color: '#14b8a6',
        description: 'A night-shift baker who knows every hidden street.',
        appearances: ['chapter-2-0'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    chapters: createChapters('2', [
      {
        title: 'The Blue Hour',
        readTime: 5,
        live: true,
        scenes: [
          {
            order: 0,
            templatePackId: 'pack-urban-night',
            locationHeader: { name: 'Shinjuku Alley — 2 AM', timeOfDay: 'night', height: 180 },
            atmosphere: { type: 'rain-fall', intensity: 0.3, scrollSynced: false },
            blocks: createBlocks([
              {
                type: 'text',
                content: 'The alley smelled of rain and grilled skewers.',
                textStyle: { bubbleType: 'plain', spacing: 'normal' },
              },
              {
                type: 'text',
                content:
                  '"You are lost," the man said. Not a question.',
                textStyle: {
                  bubbleType: 'dialogue',
                  characterId: 'char-4',
                  alignment: 'left',
                  emotionAccessory: 'surprise',
                },
              },
              {
                type: 'text',
                content: '"I\'m exactly where I need to be."',
                textStyle: {
                  bubbleType: 'dialogue',
                  characterId: 'char-3',
                  alignment: 'right',
                },
              },
            ]),
          },
        ],
      },
      {
        title: 'Flour and Dark',
        readTime: 6,
        live: true,
        scenes: [
          {
            order: 0,
            blocks: createBlocks([
              {
                type: 'text',
                content:
                  'The bakery was underground, lit by a single amber bulb.',
                textStyle: { bubbleType: 'plain' },
              },
              {
                type: 'text',
                content: '"You came back," Kenji said, not looking up from the dough.',
                textStyle: {
                  bubbleType: 'dialogue',
                  characterId: 'char-4',
                  alignment: 'left',
                  emotionAccessory: 'embarrass',
                },
              },
            ]),
          },
        ],
      },
    ]),
    stats: { likes: 1876, views: 14300, opens: 7100 },
    bookmarked: true,
    subscribed: false,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ---- Project 3: The Iron Crown ----
  {
    id: '3',
    title: 'The Iron Crown',
    cover:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=600&fit=crop',
    tags: ['Fantasy', 'Action', 'Political'],
    description:
      'A kingdom fractures as two heirs discover the crown was never meant for either of them.',
    shortDescription:
      'A kingdom fractures as two heirs discover the crown was never meant for either of them.',
    creatorId: '3',
    creator: mockCreators[2],
    characters: [
      {
        id: 'char-5',
        name: 'Kael',
        color: '#ef4444',
        description: 'The reluctant heir, trained for war but born for words.',
        appearances: ['chapter-3-0'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'char-6',
        name: 'Sera',
        color: '#a78bfa',
        description: 'The hidden heir, raised in the shadows of the court.',
        appearances: ['chapter-3-0'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    chapters: createChapters('3', [
      {
        title: 'The Coronation That Wasn\'t',
        readTime: 7,
        live: true,
        scenes: [
          {
            order: 0,
            templatePackId: 'pack-confrontation',
            locationHeader: { name: 'The Throne Room', timeOfDay: 'dusk', height: 180 },
            atmosphere: { type: 'ember-rise', intensity: 0.6, scrollSynced: false },
            moodTint: { color: '#3a0a0a', opacity: 0.3, gradient: 'vignette' },
            blocks: createBlocks([
              {
                type: 'text',
                content:
                  'The crown hovered in the High Priest\'s hands like a question no one wanted answered.',
                textStyle: { bubbleType: 'plain', spacing: 'loose' },
              },
              {
                type: 'text',
                content:
                  '"Put it down," she said from the gallery. Every head turned.',
                textStyle: {
                  bubbleType: 'dialogue',
                  characterId: 'char-6',
                  alignment: 'right',
                  emotionAccessory: 'anger',
                },
              },
              {
                type: 'text',
                content: '"Who are you?" Kael\'s voice filled the hall.',
                textStyle: {
                  bubbleType: 'dialogue',
                  characterId: 'char-5',
                  alignment: 'left',
                  emotionAccessory: 'fright',
                },
              },
              {
                type: 'text',
                content: '"The rightful heir. Unlike you."',
                textStyle: {
                  bubbleType: 'shout',
                  characterId: 'char-6',
                  alignment: 'right',
                  isBold: true,
                },
              },
            ]),
          },
        ],
      },
    ]),
    stats: { likes: 3102, views: 22500, opens: 11800 },
    bookmarked: false,
    subscribed: true,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ---- Project 4: Coding at 3 AM ----
  {
    id: '4',
    title: 'Coding at 3 AM',
    cover:
      'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=600&fit=crop',
    tags: ['Tech', 'Comedy', 'Startup'],
    description: 'The completely unhinged story of building a startup on no sleep and too much coffee.',
    shortDescription: 'Building a startup on no sleep and too much coffee.',
    creatorId: '4',
    creator: mockCreators[3],
    characters: [
      {
        id: 'char-7',
        name: 'Dev',
        color: '#10b981',
        description: 'Full-stack developer, coffee addict, disaster engineer.',
        appearances: ['chapter-4-0'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    chapters: createChapters('4', [
      {
        title: 'npm install chaos',
        readTime: 4,
        live: true,
        scenes: [
          {
            order: 0,
            blocks: createBlocks([
              {
                type: 'text',
                content: 'The terminal had 47 unread errors.',
                textStyle: { bubbleType: 'plain' },
              },
              {
                type: 'text',
                content: '"It was working five minutes ago," Dev said to no one.',
                textStyle: {
                  bubbleType: 'dialogue',
                  characterId: 'char-7',
                  alignment: 'right',
                  emotionAccessory: 'daze',
                },
              },
              {
                type: 'text',
                content:
                  'It had not been working five minutes ago. Or five hours ago. Or last Tuesday.',
                textStyle: { bubbleType: 'plain' },
              },
            ]),
          },
        ],
      },
    ]),
    stats: { likes: 987, views: 7400, opens: 3600 },
    bookmarked: false,
    subscribed: false,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ---- Project 5: Healing Through Art ----
  {
    id: '5',
    title: 'Healing Through Art',
    cover:
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=600&fit=crop',
    tags: ['Self-Help', 'Art', 'Mental Health'],
    description:
      'How painting, sculpture, and terrible stick figures helped me survive the hardest year of my life.',
    shortDescription:
      'How terrible stick figures helped me survive the hardest year of my life.',
    creatorId: '5',
    creator: mockCreators[4],
    characters: [
      {
        id: 'char-8',
        name: 'Maya (Narrator)',
        color: '#f97316',
        description: 'Artist and writer processing grief through creativity.',
        appearances: ['chapter-5-0'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    chapters: createChapters('5', [
      {
        title: 'The Blank Canvas',
        readTime: 5,
        live: true,
        scenes: [
          {
            order: 0,
            templatePackId: 'pack-forest-calm',
            locationHeader: { name: 'Studio — Afternoon', timeOfDay: 'day', height: 180 },
            atmosphere: { type: 'dust-motes', intensity: 0.3, scrollSynced: true },
            blocks: createBlocks([
              {
                type: 'text',
                content:
                  'The canvas had been blank for six weeks. Maya had stopped feeling guilty about it.',
                textStyle: { bubbleType: 'plain', spacing: 'loose' },
              },
              {
                type: 'text',
                content:
                  '"You don\'t have to make something beautiful," her therapist had said. "You just have to make something."',
                textStyle: {
                  bubbleType: 'thinking',
                  characterId: 'char-8',
                  alignment: 'center',
                  emotionAccessory: 'sad',
                  isItalic: true,
                },
              },
              {
                type: 'text',
                content: 'She picked up the brush.',
                textStyle: { bubbleType: 'plain', isBold: true },
              },
            ]),
          },
        ],
      },
    ]),
    stats: { likes: 1543, views: 11200, opens: 5500 },
    bookmarked: true,
    subscribed: false,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ---- Feed Posts ----

export const generateFeedPosts = (): FeedPost[] =>
  mockProjects.map((project, index) => ({
    id: `feed-${project.id}`,
    project,
    hookLine: [
      'From corporate burnout to freedom — one email changed everything.',
      'Lost in Tokyo at 2 AM. Found something unexpected.',
      'Two heirs. One crown. Neither willing to bleed for it.',
      '47 unread errors. Coffee #8. Shipping in 3 hours.',
      'Six weeks of blank canvas. One decision to pick up the brush.',
    ][index] || project.description,
    score: [0.92, 0.87, 0.95, 0.74, 0.81][index] || 0.7,
  }));
