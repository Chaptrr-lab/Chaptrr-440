import { Creator, Project, FeedPost, Block, Chapter, Character } from '@/types';

export const mockCreators: Creator[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    followers: 12500
  },
  {
    id: '2',
    name: 'Marcus Rivera',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    followers: 8900
  },
  {
    id: '3',
    name: 'Luna Park',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    followers: 15200
  },
  {
    id: '4',
    name: 'Alex Thompson',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    followers: 6700
  },
  {
    id: '5',
    name: 'Maya Patel',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    followers: 9800
  }
];

const createBlocks = (content: {type: 'text' | 'image' | 'BG', content: string, textStyle?: any, imageUrl?: string, bracket?: 'open' | 'close'}[]): Block[] => {
  return content.map((item, index) => ({
    id: `block-${Date.now()}-${index}`,
    type: item.type,
    content: item.content,
    order: index,
    spacing: 0,
    textStyle: item.textStyle,
    imageStyle: item.type === 'image' ? {} : undefined,
    backgroundStyle: item.type === 'BG' ? { imageUrl: item.imageUrl, bracket: item.bracket } : undefined
  }));
};

const createChapters = (projectId: string, chaptersData: {title: string, content: {type: 'text' | 'image' | 'BG', content: string, textStyle?: any, imageUrl?: string, bracket?: 'open' | 'close'}[], readTime: number}[]): Chapter[] => {
  return chaptersData.map((chapter, index) => {
    const blocks = createBlocks(chapter.content);
    const characterAppearances = blocks
      .filter(block => block.textStyle?.characterId)
      .map(block => block.textStyle!.characterId!)
      .filter((id, idx, arr) => arr.indexOf(id) === idx); // unique character IDs
    
    return {
      id: `chapter-${projectId}-${index}`,
      title: chapter.title,
      order: index,
      projectId,
      blocks,
      readTime: chapter.readTime,
      status: 'published' as const,
      version: 1,
      createdAt: new Date(Date.now() - (30 - index) * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - (25 - index) * 24 * 60 * 60 * 1000).toISOString(),
      characterAppearances
    };
  });
};

export const mockProjects: Project[] = [
  // Existing projects will be here
  {
    id: '1',
    title: "The Digital Nomad's Journey",
    cover: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=600&fit=crop',
    tags: ['Travel', 'Technology', 'Lifestyle'],
    description: 'Follow my transformation from corporate worker to digital nomad, exploring remote work across 15 countries.',
    shortDescription: 'From corporate burnout to digital freedom - my journey across 15 countries.',
    longDescription: [
      { type: 'text', content: 'The Complete Story', font: 'FontA', color: '#6366f1' },
      { type: 'text', content: 'After years of climbing the corporate ladder, I realized I was climbing the wrong wall. This is the story of how I broke free from the 9-to-5 grind and built a location-independent lifestyle that gave me both financial freedom and personal fulfillment.', font: 'FontB', color: '#ffffff' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop', alt: 'Digital nomad workspace' },
      { type: 'text', content: 'What You\'ll Discover:', font: 'FontA', color: '#6366f1' },
      { type: 'text', content: '• How to transition from employee to freelancer\n• Building multiple income streams\n• The best tools and apps for remote work\n• Navigating visas and legal requirements\n• Finding community while traveling solo', font: 'FontC', color: '#cccccc' }
    ],
    creatorId: '1',
    creator: mockCreators[0],
    characters: [
      { 
        id: 'char-1', 
        name: 'Sarah (Narrator)', 
        color: '#6366f1',
        description: 'A corporate worker turned digital nomad, documenting her journey of transformation and self-discovery.',
        relationships: [{
          characterId: 'char-2',
          relationshipType: 'mentor' as const,
          description: "Sarah's inner voice guides her through difficult decisions and self-reflection."
        }],
        appearances: ['chapter-1-0', 'chapter-1-2'],
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      },
      { 
        id: 'char-2', 
        name: 'Inner Voice', 
        color: '#ec4899',
        description: "Sarah's internal dialogue and conscience, representing her doubts, fears, and ultimate wisdom.",
        relationships: [{
          characterId: 'char-1',
          relationshipType: 'mentor' as const,
          description: 'The inner voice that challenges and supports Sarah throughout her journey.'
        }],
        appearances: ['chapter-1-0', 'chapter-1-1', 'chapter-1-2'],
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }
    ],
    chapters: createChapters('1', [
      {
        title: 'The Breaking Point',
        readTime: 3,
        content: [
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=600&h=400&fit=crop', bracket: 'open' },
          { type: 'text', content: "It was 2 AM on a Tuesday when I realized I couldn't do this anymore. The fluorescent lights of the office building cast an eerie glow on my desk, littered with empty coffee cups and crumpled papers.", textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'image', content: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=600&h=400&fit=crop' },
          { type: 'text', content: "I can't keep doing this...", textStyle: { bubbleType: 'thinking', characterId: 'char-2', alignment: 'right' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=600&h=400&fit=crop', bracket: 'close' },
          { type: 'text', content: "I had been working 80-hour weeks for months, climbing the corporate ladder that seemed to stretch endlessly upward. But that night, staring at my reflection in the black computer screen, I saw someone I didn't recognize.", textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'The next morning, I started planning my escape.', textStyle: { bubbleType: 'plain', alignment: 'center', isBold: true } }
        ]
      },
      {
        title: 'First Steps to Freedom',
        readTime: 4,
        content: [
          { type: 'text', content: 'The plan was simple in theory: save money, learn remote skills, and find location-independent work. In practice, it was terrifying.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'image', content: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop' },
          { type: 'text', content: 'What if I fail? What if I run out of money?', textStyle: { bubbleType: 'thinking', characterId: 'char-2', alignment: 'left' } },
          { type: 'text', content: 'I spent evenings and weekends learning web development, building a portfolio, and networking with other remote workers online. The community was incredibly supportive.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'Six months later, I landed my first remote contract. It paid half of what I was making, but it was freedom.', textStyle: { bubbleType: 'plain', alignment: 'center', isBold: true } }
        ]
      },
      {
        title: 'Bali Beginnings',
        readTime: 5,
        content: [
          { type: 'text', content: 'Canggu, Bali became my first base. The co-working spaces were buzzing with entrepreneurs, developers, and creators from around the world.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'image', content: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=600&h=400&fit=crop' },
          { type: 'text', content: 'I actually did it!', textStyle: { bubbleType: 'shout', characterId: 'char-2', alignment: 'right' } },
          { type: 'text', content: 'I learned more about business, life, and myself in those three months than I had in years of corporate work. The sunsets from my villa were just a bonus.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'But Bali was just the beginning...', textStyle: { bubbleType: 'plain', alignment: 'center', isBold: true } }
        ]
      }
    ]),
    stats: { likes: 1247, views: 8934, opens: 2156 },
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    title: 'Midnight in Tokyo',
    cover: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=600&fit=crop',
    tags: ['Photography', 'Japan', 'Street Art'],
    description: "A visual journey through Tokyo's neon-lit streets, capturing the soul of a city that never sleeps.",
    creatorId: '2',
    creator: mockCreators[1],
    characters: [
      {
        id: 'char-tokyo-1',
        name: 'The City',
        color: '#ff6b6b',
        description: 'Tokyo itself as a character - the neon lights, the energy, the stories hidden in every corner.',
        relationships: [],
        appearances: ['chapter-2-0', 'chapter-2-1'],
        createdAt: '2024-01-18T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z'
      }
    ],
    chapters: createChapters('2', [
      {
        title: 'Shibuya Crossing',
        readTime: 2,
        content: [
          { type: 'text', content: "The world's busiest pedestrian crossing becomes a symphony of movement at midnight. Thousands of people cross in perfect chaos." },
          { type: 'image', content: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&h=400&fit=crop' },
          { type: 'text', content: "Each person has a story, a destination, a purpose. In this moment, they're all part of something bigger." }
        ]
      },
      {
        title: 'Neon Dreams',
        readTime: 3,
        content: [
          { type: 'text', content: 'The neon signs of Shinjuku create an otherworldly atmosphere. Pink, blue, and green lights reflect off wet pavement after the evening rain.' },
          { type: 'image', content: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=600&h=400&fit=crop' },
          { type: 'text', content: 'This is where cyberpunk was born, in the intersection of technology and humanity, tradition and innovation.' }
        ]
      }
    ]),
    stats: { likes: 892, views: 5621, opens: 1834 },
    createdAt: '2024-01-20'
  },
  {
    id: '3',
    title: 'The Art of Minimalism',
    cover: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=600&fit=crop',
    tags: ['Lifestyle', 'Design', 'Philosophy'],
    description: 'How I transformed my life by owning less and experiencing more. A guide to intentional living.',
    creatorId: '3',
    creator: mockCreators[2],
    characters: [
      {
        id: 'char-luna-1',
        name: 'Luna',
        color: '#4ecdc4',
        description: 'A minimalist lifestyle advocate sharing her journey of intentional living and conscious consumption.',
        relationships: [],
        appearances: ['chapter-3-0'],
        createdAt: '2024-01-23T00:00:00Z',
        updatedAt: '2024-01-25T00:00:00Z'
      }
    ],
    chapters: createChapters('3', [
      {
        title: 'The 100-Item Challenge',
        readTime: 4,
        content: [
          { type: 'text', content: 'I decided to own only 100 items. Everything I owned had to fit in two suitcases. The process was liberating and terrifying.' },
          { type: 'image', content: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop' },
          { type: 'text', content: 'Each item had to earn its place. Did it bring joy? Did it serve a purpose? If not, it had to go.' },
          { type: 'text', content: "The hardest part wasn't letting go of things—it was letting go of the person I thought I needed to be." }
        ]
      }
    ]),
    stats: { likes: 2156, views: 12847, opens: 3921 },
    createdAt: '2024-01-25'
  },
  {
    id: '4',
    title: 'Coding at 3 AM',
    cover: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=600&fit=crop',
    tags: ['Programming', 'Startup', 'Technology'],
    description: 'The story of building a startup from my bedroom, one sleepless night at a time.',
    creatorId: '4',
    creator: mockCreators[3],
    characters: [
      {
        id: 'char-alex-1',
        name: 'Alex',
        color: '#45b7d1',
        description: 'A passionate developer and entrepreneur building his first startup from his bedroom.',
        relationships: [],
        appearances: ['chapter-4-0'],
        createdAt: '2024-01-30T00:00:00Z',
        updatedAt: '2024-02-01T00:00:00Z'
      }
    ],
    chapters: createChapters('4', [
      {
        title: 'The Idea',
        readTime: 3,
        content: [
          { type: 'text', content: "It started with a simple frustration: why was it so hard to find good local restaurants that weren't on every tourist list?" },
          { type: 'image', content: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop' },
          { type: 'text', content: 'I spent the next six months building an app that would change how people discover local gems. Or so I thought.' }
        ]
      }
    ]),
    stats: { likes: 743, views: 4521, opens: 1287 },
    createdAt: '2024-02-01'
  },
  {
    id: '5',
    title: 'Healing Through Art',
    cover: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=600&fit=crop',
    tags: ['Art', 'Mental Health', 'Creativity'],
    description: 'How painting saved my life during the darkest period of my mental health journey.',
    creatorId: '5',
    creator: mockCreators[4],
    characters: [
      {
        id: 'char-maya-1',
        name: 'Maya',
        color: '#96ceb4',
        description: 'An artist using creativity as a tool for healing and self-expression during her mental health journey.',
        relationships: [],
        appearances: ['chapter-5-0'],
        createdAt: '2024-02-03T00:00:00Z',
        updatedAt: '2024-02-05T00:00:00Z'
      }
    ],
    chapters: createChapters('5', [
      {
        title: 'The Dark Period',
        readTime: 5,
        content: [
          { type: 'text', content: "Depression hit me like a wave I never saw coming. One day I was fine, the next I couldn't get out of bed." },
          { type: 'image', content: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop' },
          { type: 'text', content: 'Traditional therapy helped, but it was picking up a paintbrush that truly began my healing journey.' }
        ]
      }
    ]),
    stats: { likes: 1834, views: 9876, opens: 2743 },
    createdAt: '2024-02-05'
  }
];

export const generateFeedPosts = (projects: Project[]): FeedPost[] => {
  const hookLines = [
    'This changed everything I thought I knew about...',
    'What happened next will surprise you',
    'The moment that defined my entire journey',
    'I never expected this to happen',
    'This is what nobody tells you about...',
    'The truth behind the Instagram photos',
    'Why I quit everything to pursue this',
    'The mistake that became my biggest breakthrough'
  ];

  const novelProject: Project = {
    id: '6',
    title: 'Echoes of the Forgotten Realm',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=600&fit=crop',
    tags: ['Fantasy', 'Adventure', 'Magic', 'Epic'],
    description: 'In a world where memories can be stolen and magic flows through ancient ruins, a young scholar discovers she holds the key to restoring a forgotten civilization. An epic fantasy novel spanning kingdoms, mysteries, and the power of remembrance.',
    shortDescription: 'A scholar uncovers the secrets of a lost civilization and the magic that could save—or destroy—her world.',
    longDescription: [
      { type: 'text', content: 'An Epic Fantasy Adventure', font: 'FontA', color: '#8b5cf6' },
      { type: 'text', content: 'When Elara discovers an ancient tome in the depths of the Royal Archives, she unknowingly sets in motion events that will shake the foundations of her world. The book speaks of the Forgotten Realm—a legendary civilization that vanished overnight, leaving behind only whispers and ruins scattered across the land.', font: 'FontB', color: '#ffffff' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=400&fit=crop', alt: 'Ancient magical ruins' },
      { type: 'text', content: 'What Awaits You:', font: 'FontA', color: '#8b5cf6' },
      { type: 'text', content: '• A richly detailed fantasy world with deep lore\n• Complex characters with intertwining destinies\n• Ancient magic systems and forgotten technologies\n• Political intrigue across multiple kingdoms\n• Epic battles and intimate character moments\n• Mysteries that span millennia', font: 'FontC', color: '#cccccc' }
    ],
    creatorId: '1',
    creator: mockCreators[0],
    characters: [
      { 
        id: 'char-elara', 
        name: 'Elara', 
        color: '#8b5cf6',
        description: 'A brilliant young scholar from the Royal Archives, curious and determined. Her discovery of the ancient tome sets her on a path that will change everything.',
        relationships: [
          {
            characterId: 'char-kael',
            relationshipType: 'friend' as const,
            description: 'Kael becomes her protector and closest companion on the journey.'
          },
          {
            characterId: 'char-narrator',
            relationshipType: 'mentor' as const,
            description: 'The narrative voice that guides readers through the story.'
          }
        ],
        appearances: ['chapter-6-0', 'chapter-6-1', 'chapter-6-2'],
        createdAt: '2024-02-10T00:00:00Z',
        updatedAt: '2024-02-15T00:00:00Z'
      },
      { 
        id: 'char-kael', 
        name: 'Kael', 
        color: '#ef4444',
        description: 'A mysterious warrior with a haunted past. He carries secrets about the Forgotten Realm that even he doesn\'t fully understand.',
        relationships: [
          {
            characterId: 'char-elara',
            relationshipType: 'friend' as const,
            description: 'Sworn to protect Elara, though his reasons remain unclear.'
          }
        ],
        appearances: ['chapter-6-0', 'chapter-6-1', 'chapter-6-2'],
        createdAt: '2024-02-10T00:00:00Z',
        updatedAt: '2024-02-15T00:00:00Z'
      },
      { 
        id: 'char-narrator', 
        name: 'Narrator', 
        color: '#94a3b8',
        description: 'The omniscient voice that weaves the tale, providing context and atmosphere.',
        relationships: [],
        appearances: ['chapter-6-0', 'chapter-6-1', 'chapter-6-2'],
        createdAt: '2024-02-10T00:00:00Z',
        updatedAt: '2024-02-15T00:00:00Z'
      },
      { 
        id: 'char-ancient-voice', 
        name: 'Ancient Voice', 
        color: '#fbbf24',
        description: 'A mysterious presence from the past, speaking through the ancient tome and ruins.',
        relationships: [],
        appearances: ['chapter-6-0', 'chapter-6-1'],
        createdAt: '2024-02-10T00:00:00Z',
        updatedAt: '2024-02-15T00:00:00Z'
      }
    ],
    chapters: createChapters('6', [
      {
        title: 'The Discovery',
        readTime: 12,
        content: [
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop', bracket: 'open' },
          { type: 'text', content: 'The Royal Archives stretched endlessly into shadow, row upon row of ancient tomes reaching toward vaulted ceilings lost in darkness. Dust motes danced in the thin shafts of light that pierced through narrow windows, creating an almost ethereal atmosphere.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'Elara moved through the stacks with practiced ease, her fingers trailing along leather spines worn smooth by centuries. She had spent five years in these halls, cataloging, preserving, learning. But today felt different.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop', bracket: 'close' },
          { type: 'text', content: 'There\'s something here... I can feel it.', textStyle: { bubbleType: 'thinking', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'In the deepest section of the archives, where few scholars dared to venture, she found it. A book that shouldn\'t exist. Its cover was neither leather nor cloth, but something that seemed to shift between states—solid yet fluid, ancient yet somehow new.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop', bracket: 'open' },
          { type: 'text', content: 'The moment her fingers touched the cover, the world exploded into light and sound. Visions cascaded through her mind—towering cities of crystal and stone, people wielding magic like breathing, a civilization so advanced it seemed like pure fantasy.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'What is this?!', textStyle: { bubbleType: 'shout', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'And then, as suddenly as it began, the visions stopped. Elara found herself on her knees, the book clutched to her chest, her heart racing. The pages had opened to reveal text in a language she had never seen, yet somehow... she could read it.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop', bracket: 'close' },
          { type: 'text', content: '"To the one who remembers: The Forgotten Realm awaits. Seek the Ruins of Aethermoor. There, the first key lies hidden."', textStyle: { bubbleType: 'dialogue', characterId: 'char-ancient-voice', alignment: 'center' } },
          { type: 'text', content: 'The words seemed to glow on the page, pulsing with an inner light. Elara\'s scholarly mind raced. The Forgotten Realm was legend, myth, a bedtime story told to children. It couldn\'t be real.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'But what if it is? What if everything we thought we knew about history is wrong?', textStyle: { bubbleType: 'thinking', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'She didn\'t hear the footsteps approaching until it was too late. A shadow fell across the page, and Elara looked up to see a figure standing at the end of the aisle. Tall, cloaked, with eyes that seemed to pierce through the darkness.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'You found it.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'Who are you? How did you get in here?', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'The stranger stepped forward, and in the dim light, Elara could see his face—sharp features, a scar running down his left cheek, and those eyes... they held the weight of centuries.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'My name is Kael. And I\'ve been waiting a very long time for someone to find that book.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'Waiting? What do you mean?', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'Kael\'s expression was grave as he spoke, his voice low and urgent.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'That book is the Chronicle of Echoes. It\'s not just a record of the Forgotten Realm—it\'s a key. And now that you\'ve touched it, you\'re bound to it. The realm will call to you, and you must answer.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'This is insane. The Forgotten Realm is a myth!', textStyle: { bubbleType: 'shout', characterId: 'char-elara', alignment: 'right' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop', bracket: 'open' },
          { type: 'text', content: 'Kael raised his hand, and suddenly the air around them shimmered. Symbols appeared, floating in the space between them—the same symbols from the book. They glowed with an otherworldly light, casting strange shadows on the ancient shelves.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'Does this look like a myth to you?', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'Elara stared in wonder and fear. Magic. Real magic. Not the parlor tricks of street performers or the theoretical discussions in academic papers. This was the genuine article, raw and powerful.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop', bracket: 'close' },
          { type: 'text', content: 'How... how is this possible?', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'The Forgotten Realm didn\'t just vanish. It was hidden, sealed away by those who feared its power. But the seals are weakening. If we don\'t act, if we don\'t find the keys and restore the balance, everything—our world, the hidden realm, all of it—will collapse.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'The weight of his words settled over Elara like a heavy cloak. She looked down at the book in her hands, at the glowing text that seemed to pulse in rhythm with her heartbeat.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'Why me? I\'m just a scholar. I catalog books, I don\'t... I don\'t save worlds.', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'Kael\'s expression softened slightly, and for a moment, Elara saw something like sympathy in his eyes.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'The Chronicle chooses its bearer. It always has. You have something the realm recognizes—a connection to the past, perhaps, or a strength you don\'t yet know you possess. Either way, the choice has been made.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'And if I refuse?', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'Then the realm will find another way to call you. And it won\'t be gentle.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'Elara closed her eyes, her mind racing through possibilities, consequences, fears. When she opened them again, her decision was made. She had spent her life seeking knowledge, uncovering truths hidden in dusty pages. How could she turn away from the greatest mystery of all?', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'Alright. I\'ll do it. But I have conditions.', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'Name them.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'You tell me everything. No secrets, no half-truths. If I\'m risking my life for this, I deserve to know what I\'m getting into.', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'Kael hesitated, then nodded slowly.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'Agreed. Though some truths... some truths you\'ll have to discover for yourself. The realm has its own way of teaching.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'Then let\'s begin. Where do we start?', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop', bracket: 'open' },
          { type: 'text', content: 'Kael moved to the window, gazing out at the city beyond. The sun was setting, painting the sky in shades of amber and crimson.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'The Ruins of Aethermoor lie three days\' journey to the north, beyond the Whispering Forest. We leave at dawn.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'Dawn? That\'s... that\'s less than twelve hours!', textStyle: { bubbleType: 'shout', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'The realm doesn\'t wait for anyone to be ready. Neither can we.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'As Elara looked down at the Chronicle in her hands, she felt the weight of destiny settling upon her shoulders. Her life as a simple scholar was over. Whatever lay ahead—danger, discovery, or doom—she would face it.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'The Forgotten Realm was calling. And Elara would answer.', textStyle: { bubbleType: 'plain', alignment: 'center', isBold: true } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop', bracket: 'close' }
        ]
      },
      {
        title: 'The Whispering Forest',
        readTime: 15,
        content: [
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=600&fit=crop', bracket: 'open' },
          { type: 'text', content: 'The forest earned its name honestly. From the moment they passed beneath the ancient trees, Elara heard them—whispers in a language that was almost familiar, voices that seemed to come from everywhere and nowhere at once.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'Do you hear that?', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'The trees remember. They\'ve stood here since before the Forgotten Realm fell. They witnessed everything.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'Kael moved through the forest with the confidence of someone who had walked this path before. His hand never strayed far from the sword at his hip, his eyes constantly scanning the shadows between the trees.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=600&fit=crop', bracket: 'close' },
          { type: 'text', content: 'You\'ve been here before.', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'It wasn\'t a question, and Kael didn\'t treat it as one.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'Many times. I\'ve been searching for the Chronicle for... a long time.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'How long?', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'Kael was silent for a long moment, and when he finally spoke, his voice was heavy with the weight of years.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'Two hundred and thirty-seven years.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'Elara stopped walking, staring at him in disbelief.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'That\'s impossible. You\'d be...', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'Dead? Yes, I should be. But the realm has a way of preserving those it needs. I was there, Elara. I was there when it fell.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&h=600&fit=crop', bracket: 'open' },
          { type: 'text', content: 'The revelation hung in the air between them. Elara\'s mind raced with questions, but before she could voice any of them, the whispers around them suddenly intensified. The temperature dropped, and frost began to form on the leaves.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'Something\'s wrong.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'Shadows moved between the trees, taking form and substance. They were humanoid but wrong—too tall, too thin, with eyes that glowed like dying embers.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'What are those?!', textStyle: { bubbleType: 'shout', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'Shade Walkers. Remnants of those who died when the realm fell. They\'re drawn to the Chronicle\'s power. Stay behind me!', textStyle: { bubbleType: 'shout', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'Kael\'s sword sang as it left its sheath, the blade glowing with the same ethereal light as the symbols he had shown her in the archives. The Shade Walkers circled them, their movements fluid and predatory.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&h=600&fit=crop', bracket: 'close' },
          { type: 'text', content: 'The first one lunged, and Kael met it with a strike that seemed to cut through reality itself. The creature dissolved into mist with an unearthly shriek. But there were more—so many more.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'Elara! The Chronicle! Use it!', textStyle: { bubbleType: 'shout', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'I don\'t know how!', textStyle: { bubbleType: 'shout', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'Trust it! Trust yourself!', textStyle: { bubbleType: 'shout', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'With trembling hands, Elara opened the Chronicle. The pages flipped on their own, stopping at a passage that blazed with golden light. Words she didn\'t know she knew spilled from her lips, ancient and powerful.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop', bracket: 'open' },
          { type: 'text', content: 'Light erupted from the book, a wave of pure energy that swept through the forest. The Shade Walkers screamed as it touched them, their forms dissolving like smoke in a strong wind. In moments, they were gone.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'The silence that followed was deafening. Elara stood there, the Chronicle still glowing in her hands, her whole body shaking with adrenaline and something else—power, raw and intoxicating.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop', bracket: 'close' },
          { type: 'text', content: 'What... what did I just do?', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'Kael sheathed his sword, looking at her with something like respect—and perhaps a hint of concern.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'You wielded the realm\'s power. The Chronicle recognized you as its true bearer. That\'s... that\'s never happened so quickly before.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'Is that good or bad?', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'I don\'t know. But it means you\'re more connected to the Forgotten Realm than I thought. We need to reach Aethermoor quickly. There\'s much you need to learn, and not much time to learn it.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'They continued through the forest, but everything had changed. Elara could feel it now—the pulse of magic in the air, the whispers of the trees making sense in ways they hadn\'t before. The Chronicle had awakened something in her, something that had perhaps always been there, waiting.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'As night fell and they made camp, Elara stared into the fire, her mind full of questions and possibilities. Tomorrow they would reach the ruins. Tomorrow, she would take her first real step into the Forgotten Realm.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'And nothing would ever be the same again.', textStyle: { bubbleType: 'plain', alignment: 'center', isBold: true } }
        ]
      },
      {
        title: 'Ruins of Aethermoor',
        readTime: 18,
        content: [
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop', bracket: 'open' },
          { type: 'text', content: 'The ruins rose from the earth like the bones of a fallen giant. Massive pillars of crystal and stone reached toward the sky, their surfaces covered in the same glowing symbols that filled the Chronicle. Even in their broken state, they spoke of a grandeur that took Elara\'s breath away.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'This was a city?', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'One of twelve. Aethermoor was the seat of learning, where the greatest minds of the realm gathered to push the boundaries of magic and knowledge. It was... beautiful.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'The pain in his voice was palpable. Elara realized that for Kael, these weren\'t just ruins—they were memories, a home lost to time.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop', bracket: 'close' },
          { type: 'text', content: 'You lived here.', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'I was a guardian. My duty was to protect the realm\'s secrets, to ensure that knowledge was used wisely. I failed.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'Before Elara could respond, the Chronicle in her pack began to pulse with light. The symbols on the ruins answered, glowing brighter and brighter until the entire structure blazed like a second sun.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'It\'s reacting to the Chronicle! The first key must be close!', textStyle: { bubbleType: 'shout', characterId: 'char-kael', alignment: 'left' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop', bracket: 'open' },
          { type: 'text', content: 'They ran toward the heart of the ruins, following the pull of the Chronicle. The ground beneath their feet began to shift, ancient mechanisms awakening after centuries of slumber. Stairs appeared where there had been only rubble, pathways opening through the debris.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'The ruins were alive, responding to the Chronicle\'s presence, guiding them deeper into its heart. They descended into chambers that had been sealed since the fall, walls covered in murals depicting the glory of the Forgotten Realm.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop', bracket: 'close' },
          { type: 'text', content: 'Finally, they reached a vast chamber. At its center stood a pedestal, and upon it, a crystal that seemed to contain a fragment of starlight. The first key.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'The Key of Memory. It holds the knowledge of what was lost. Take it, Elara. It\'s yours by right.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'Elara approached the pedestal slowly, reverently. As her fingers closed around the crystal, the world exploded into vision once more. But this time, she was ready.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop', bracket: 'open' },
          { type: 'text', content: 'She saw the Forgotten Realm in its prime—cities of impossible beauty, magic woven into the very fabric of reality, people living in harmony with powers that modern scholars could only dream of. She saw the fall—a darkness that came from within, ambition and fear corrupting what should have been paradise.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'And she saw the future—multiple paths, multiple possibilities. In some, the realm was restored, balance returned. In others, the darkness consumed everything. The choice, she realized, would be hers to make.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'BG', content: '', imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop', bracket: 'close' },
          { type: 'text', content: 'When the visions faded, Elara found herself on her knees again, the crystal clutched in one hand, the Chronicle in the other. Kael was beside her, his hand on her shoulder, steadying her.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'I saw it. All of it. The realm, the fall, the... the possibilities.', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'The Key of Memory shows the truth. All of it, without filter or mercy. What did you see?', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'Elara looked up at him, and in her eyes, Kael saw a determination that hadn\'t been there before.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'I saw that we can win. But I also saw the cost. Kael... there are eleven more keys, aren\'t there?', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'Yes. One for each of the great cities. Each one will test you in different ways. Memory was just the beginning.', textStyle: { bubbleType: 'dialogue', characterId: 'char-kael', alignment: 'left' } },
          { type: 'text', content: 'Then we\'d better get started. The realm is calling, and I intend to answer.', textStyle: { bubbleType: 'dialogue', characterId: 'char-elara', alignment: 'right' } },
          { type: 'text', content: 'As they emerged from the ruins, the sun was setting, painting the sky in shades of purple and gold. Elara held the Key of Memory up to the light, watching it sparkle and shine. One key down, eleven to go.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'The journey had only just begun, but Elara felt ready. The Forgotten Realm had chosen her, and she would not let it down. Whatever trials lay ahead, whatever sacrifices would be required, she would face them.', textStyle: { bubbleType: 'plain', alignment: 'center' } },
          { type: 'text', content: 'Because some things were worth fighting for. Some memories were worth preserving. And some realms... some realms were worth saving.', textStyle: { bubbleType: 'plain', alignment: 'center', isBold: true } }
        ]
      }
    ]),
    stats: { likes: 3847, views: 18923, opens: 5621 },
    createdAt: '2024-02-15'
  };
  
  const allProjects = [...projects, novelProject];
  
  if (!mockProjects.find(p => p.id === novelProject.id)) {
    mockProjects.push(novelProject);
  }
  
  return allProjects.map((project, index) => {
    const score = 0.5 * (project.stats.likes / Math.max(project.stats.views, 1)) + 
                  0.3 * (project.stats.opens / Math.max(project.stats.views, 1)) + 
                  0.2 * (1 / (Date.now() - new Date(project.createdAt).getTime()));

    return {
      id: `feed-${project.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      project,
      hookLine: hookLines[index % hookLines.length],
      score
    };
  }).sort((a, b) => b.score - a.score);
};