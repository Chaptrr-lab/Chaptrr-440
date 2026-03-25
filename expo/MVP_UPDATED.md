# 📱 Updated MVP: Multimedia Scroll-Down App with Advanced Create → Profile Flow

## 🎯 Core Purpose

A mobile-first platform where users can:
1. **Discover** multimedia stories and projects in a TikTok-like vertical feed
2. **Consume** content in a scroll-down reader with **interactive dialogue bubbles**
3. **Create projects** with a streamlined flow: Project → Profile → Characters/Chapters management
4. **Manage content** through dedicated Character and Chapter management systems

👉 **The MVP proves:**
- People want to read stories in a swipe-feed → scroll-down format
- Creators prefer **separated project creation and content management** workflows
- **Character-driven storytelling** with advanced bubble systems enhances engagement
- **Professional content management tools** attract serious creators

---

## 🧩 Updated MVP Features

### 1. Explore Feed (TikTok-style) ✅ *Unchanged*
- Full-screen vertical cards (cover, title, tags, creator)
- Swipe/scroll one card per screen
- 3 tabs: For You (ranked), Trending, New
- Buttons: Like, Open (to read)

### 2. **Project Page (Reader Entry Point)** ✅ *Simplified*
- **Project Overview:** Cover + title + description + creator info
- **CTA: "Start Reading"** - Direct entry to Reader
- **Creator Actions:** Only visible to project owner
  - "Manage Project" button → redirects to Profile management

### 3. **Reader (Enhanced with Bubble System)** 🆕
- Scroll-down chapters with text + image blocks
- **4 Text Block Types:**
  - **Plain text** - Standard narrative text
  - **Dialogue bubbles** - Character speech with assigned colors
  - **Thinking bubbles** - Internal thoughts (italic, translucent)
  - **Scream bubbles** - Loud/emphasized speech with **spiky/concave shape**
- **Character Integration:**
  - Each story defines characters with **creator-chosen custom colors**
  - Dialogue bubbles automatically adopt **both bubble color AND text color** from character
  - **Character names appear above bubbles** for clear speaker identification
- **Positioning System:**
  - Left, Center, Right alignment for all text blocks
  - Bubbles **lean toward their alignment side** (visual directional cues)
- **Text Formatting:**
  - **Bold toggle** for emphasis across all bubble types
  - Different visual treatments per bubble type
- "Next Chapter" button at bottom
- Track dwell time per chapter

### 4. **Create Flow (Streamlined Project Creation)** 🆕
- **Step 1: Project Creation Only**
  - Title, cover image, tags, description
  - **No chapters created at this step**
  - Creates empty project shell
  - Redirects to Profile → Your Stories

### 5. **Profile → Your Stories (Content Management Hub)** 🆕
- **Project List:** All user-created projects
- **Project Selection:** Tap project → opens management interface
- **Two Main Management Sections:**

#### **Characters Section** 🆕
- **Character List:** All project characters with color preview
- **Add New Character:** Name + custom color picker
- **Edit Character:** Tap to open Character Detail Page
- **Character Detail Page:**
  - **Basic Info:** Name, color (global updates), description/bio
  - **Relationships:** Link to other characters with relationship types
  - **Appearance Tracking:** Auto-generated list of chapters where character appears
  - **Quick Navigation:** Jump to specific chapters from character page

#### **Chapters Section** 🆕
- **Chapter List:** All chapters with title, order, status
- **Chapter Management:** Create, edit, reorder, delete chapters
- **Chapter Editor:** Tap chapter → opens advanced editor

### 6. **Chapter Editor (Advanced Content Creation)** 🆕
- **Block Types:**
  - **Image Block:** Standard image insertion
  - **Text Block:** Plain narrative text
  - **Dialogue Bubble Block:** Speech, thinking, scream (spiky/concave shape)
- **Bubble System:**
  - **Character Assignment:** Select from project characters
  - **Auto-Styling:** Bubble + text adopt character's color
  - **Character Name:** Displays above bubble
  - **Bubble Leaning:** Left/right alignment creates directional lean
- **Text Formatting:**
  - **Alignment:** Left, center, right positioning
  - **Style Options:** Regular, bold, italic
- **Right-Side Panel (Collapsible):**
  - **Arrow Expand:** Toggle formatting options
  - **Bubble Type Selector:** Plain, speech, thought, scream
  - **Character Dropdown:** Color-coded character selection
  - **Alignment Controls:** Left, center, right with preview
  - **Format Toggles:** Bold, italic options
- **Background System:**
  - **Seamless Backgrounds:** Set repeating background images
  - **Span Control:** Choose start block → end block range
  - **Background Settings:** Opacity, blend modes, positioning

---

## 📊 Updated Data Model

### Core Entities ✅ *Mostly Unchanged*
- **Creators:** name, avatar, followers
- **Projects:** title, cover, tags, description, creator_id, **characters[]**
- **Posts (for feed):** cover, hook line, stats
- **Chapters:** title, order, project_id
- **Events:** impressions, likes, opens, read_time

### **Enhanced: Character Entity** 🆕
```typescript
Character {
  id: string
  name: string
  color: string  // hex color for dialogue bubbles
  description: string  // detailed character description
  relationships?: {
    characterId: string
    relationshipType: 'friend' | 'enemy' | 'family' | 'romantic' | 'mentor' | 'rival'
    description: string
  }[]
  appearances: string[]  // array of chapter IDs where character appears
  createdAt: string
  updatedAt: string
}
```

### **Enhanced: Block Entity** 🆕
```typescript
Block {
  id: string
  type: 'text' | 'image'
  content: string
  order: number
  // Text block specific properties
  textStyle?: {
    bubbleType?: 'plain' | 'dialogue' | 'thinking' | 'scream'
    characterId?: string  // references Character.id
    alignment?: 'left' | 'center' | 'right'
    isBold?: boolean
    isItalic?: boolean  // new formatting option
  }
  // Background system
  background?: {
    imageUrl: string
    startBlockId: string  // where background starts
    endBlockId: string    // where background ends
    opacity: number       // 0-1
    blendMode: 'normal' | 'multiply' | 'overlay'
    positioning: 'cover' | 'contain' | 'repeat'
  }
}
```

### **Enhanced: Chapter Entity** 🆕
```typescript
Chapter {
  id: string
  title: string
  order: number
  projectId: string
  blocks: Block[]
  readTime: number  // in minutes
  status: 'draft' | 'published'
  version: number
  createdAt: string
  updatedAt: string
  characterAppearances: string[]  // auto-calculated character IDs
}
```

---

## ⚡ MVP Analytics ✅ *Unchanged*

Track impressions, likes, opens, dwell time with simple scoring:

```
score = 0.5*(likes/views) + 0.3*(opens/impressions) + 0.2*recency
```

---

## 📦 Updated MVP Content Requirement

- **10–20 seed projects** (to populate feed)
- Each project: **2–3 chapters**
- Each chapter: **5–10 panels** (mix of text blocks and images)
- **Character Integration:**
  - At least **3 projects with defined characters**
  - Showcase different bubble types and alignments
  - Demonstrate character color consistency
- At least **5 different "creators"** (real or placeholders)

### **Sample Content Structure:**
```
Project: "The Digital Nomad's Journey"
Characters:
  - Sarah (Narrator) - Custom Blue (#4f46e5) [creator-chosen]
  - Inner Voice - Custom Pink (#e11d48) [creator-chosen]

Chapter 1: "The Breaking Point"
  - Plain text (center): "It was 2 AM on a Tuesday..."
  - Thinking bubble (right, Inner Voice): "I can't keep doing this..." 
    [Pink bubble + pink text, character name above]
  - Plain text (center): "I had been working 80-hour weeks..."
  - Scream bubble (left, Sarah): "I QUIT!" 
    [Blue spiky bubble + blue text, character name above]
  - Bold plain text (center): "The next morning, I started planning my escape."
```

---

## 🕒 Updated MVP Timeline

- **Weeks 1–2:** Wireframes + **Create → Profile flow design** + **bubble system mockups** + sample content
- **Weeks 3–4:** Build core app (Feed, Basic Project Page, Reader)
- **Weeks 5–6:** **Streamlined Create Flow** (project-only creation) + Profile integration
- **Weeks 7–8:** **Profile → Your Stories** management interface + project selection
- **Weeks 9–10:** **Characters Section** with detail pages + relationship mapping
- **Weeks 11–12:** **Chapters Section** with CRUD operations + chapter editor foundation
- **Weeks 13–14:** **Advanced Chapter Editor** with collapsible right-side panel + bubble system
- **Week 15:** **Background system** + seamless image spanning across blocks
- **Week 16:** **Reader integration** with all bubble types + character colors + backgrounds
- **Week 17:** Add analytics + character appearance tracking + usage statistics
- **Week 18:** Closed test with creators (**focus on separated creation workflow**)
- **Week 19:** Public MVP launch

---

## ✅ Updated MVP Summary

**"A TikTok-style feed of covers that open into scroll-down multimedia stories with an advanced dialogue bubble system, featuring a streamlined Create → Profile workflow where users first create project shells (title, cover, description) then manage content through dedicated Profile sections: Characters (with custom colors, relationships, and appearance tracking) and Chapters (with advanced editor featuring collapsible right-side panel for bubble styling, character assignment, alignment controls, and formatting options), seamless background image system spanning multiple blocks, character-based dual color coding (bubble + text), multiple bubble types including spiky scream bubbles with directional leaning, professional chapter management with full CRUD operations, and comprehensive character detail pages with relationship mapping - seeded with ~20 sample projects showcasing the separated creation workflow, and a basic popularity-based recommendation system."**

---

## 🎨 Key System Benefits

### **Content Creation Benefits:**
1. **Separated Workflow:** Create project first, then manage content separately for better organization
2. **Professional Character Management:** Dedicated character section with relationships and tracking
3. **Advanced Chapter Editor:** Collapsible right-side panel provides clean, focused editing experience
4. **Visual Consistency:** Background system and character color-coding maintain visual coherence
5. **Iterative Improvement:** Full CRUD operations enable content refinement after initial creation
6. **Character Depth:** Detailed character profiles with relationships create richer storytelling

### **Reader Experience Benefits:**
6. **Enhanced Readability:** Different bubble types create clear visual hierarchy
7. **Character Recognition:** **Dual color-coding** (bubble + text) helps readers instantly track speakers
8. **Emotional Context:** Thinking vs. dialogue vs. **spiky screaming** conveys precise tone
9. **Immersive Backgrounds:** Seamless background images create cinematic reading experience
10. **Mobile Optimization:** All systems designed for vertical scroll format

### **Creator Management Benefits:**
11. **Separated Creation Flow:** Project creation separate from content management reduces cognitive load
12. **Profile-Based Management:** All projects accessible through Profile → Your Stories
13. **Character-First Approach:** Define characters before writing dialogue for consistency
14. **Relationship Mapping:** Visual character connections enhance story planning
15. **Content Organization:** Chapter reordering and status tracking streamline workflow
16. **Real-time Preview:** Live formatting preview reduces editing iterations

---

## 🚀 Post-MVP Enhancements (Future)

### **Advanced Content Creation:**
- **Collaborative Editing:** Multiple creators working on same project with real-time sync
- **Template System:** Pre-built chapter templates and character archetypes
- **Advanced Backgrounds:** Video backgrounds, parallax effects, animated elements
- **Content Scheduling:** Publish chapters on schedule, series management
- **Import/Export:** Bulk content import from other platforms, backup systems

### **Enhanced Character System:**
- **Character Avatars:** Visual character representations alongside bubbles
- **Character Voice Profiles:** Text-to-speech with unique character voices
- **Relationship Visualization:** Interactive character relationship graphs
- **Character Development Tracking:** Story arc progression and character growth metrics
- **Character Templates:** Pre-built character types with relationship suggestions

### **Advanced Reader Features:**
- **Bubble Animations:** Subtle entrance effects and typing animations
- **Advanced Bubble Shapes:** More scream bubble variations (jagged, explosive, etc.)
- **Interactive Bubbles:** Tap to reveal hidden thoughts or character backstory
- **Bubble Themes:** Different visual styles (comic, modern, vintage)
- **Reading Modes:** Night mode, dyslexia-friendly fonts, accessibility options

### **Platform Enhancements:**
- **Multi-language Support:** Bubble system works across languages with RTL support
- **Advanced Analytics:** Character popularity, bubble type effectiveness, reader engagement heatmaps
- **Community Features:** Character wikis, fan art integration, discussion threads
- **Monetization:** Premium character customization, advanced backgrounds, creator revenue sharing