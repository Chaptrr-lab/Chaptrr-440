# Chaptrr-440 Repository Summary

> Auto-generated summary of the current source code.

## Project Overview

Chaptrr is a React Native / Expo mobile app for creating, reading, and sharing serial fiction. It features animated dialogue bubbles, background image regions, character tracking, document import, and a broadcast/publishing system. The app targets iOS, Android, and web (via React Native Web).

---

## Types

### `types/index.ts`
Central TypeScript interface definitions for the entire application.
**Key exports:** `Creator`, `Character`, `CustomBubble`, `Block`, `Chapter`, `Project`, `CoinTransaction`, `EarningsData`, `AnalyticsData`, `WalletData`, `BroadcastData`, `OnAirSnapshot`, `FeedPost`

---

## Lib Modules

### `lib/auth.ts`
Simple authentication helper with demo-mode support. Returns a fixed user ID and checks project ownership.
**Key exports:** `isProjectAuthor()`, `getCurrentUserId()`

### `lib/database.ts` (~77 KB)
The primary data access layer. Uses SQLite on native platforms and AsyncStorage on web. Handles all CRUD operations for projects, chapters, characters, blocks, and bubbles, plus database initialization and sample data loading.
**Key exports:** `initDB()`, `getProjects()`, `saveProject()`, `getChapters()`, `saveChapter()`, `getCharacters()`, `saveCharacter()`, and many more.

### `lib/async-storage.ts`
Cross-platform storage abstraction that selects between browser `localStorage` and an in-memory fallback depending on the runtime environment.
**Key exports:** `WebAsyncStorage`, `InMemoryStorage`, default storage instance

### `lib/persist.ts`
Higher-level chapter persistence helpers built on top of `database.ts`.
**Key exports:** `upsertChapter()`, `setChapterStatus()`, `listChaptersByProject()`

### `lib/store.ts` *(legacy/unused)*
Minimal stub for a chapter storage interface; appears to be superseded by `database.ts`.

### `lib/exporters.ts`
Exports chapters to plain-text novel format or JSONL backup. Platform-aware: uses a browser Blob download on web and the native share sheet on mobile.
**Key exports:** `toNovelTxt()`, `toBackupJSONL()`, `exportFile()`

### `lib/upload-parser.ts`
Parses uploaded `.txt` and `.docx` files into `Block` arrays. Handles BOM stripping, smart quotes, and chapter boundary detection. Uses JSZip + fast-xml-parser for `.docx`.
**Key exports:** `parseTXT()`, `parseDOCX()`, `createBlockFromParagraph()`

---

## State Management

### `store/app-store.ts`
Zustand store for global app state — projects, feed posts, creators, and the currently open project/chapter.
**Key exports:** `useAppStore` hook
- State: `projects`, `feedPosts`, `creators`, `currentProject`, `currentChapterIndex`
- Actions: `toggleLike()`, `addProject()`, `incrementViews()`, `incrementOpens()`

---

## Theme

### `theme/ThemeProvider.tsx`
React context that manages light/dark mode with persistence via AsyncStorage.
**Key exports:** `ThemeProvider` (component), `useTheme()` hook → `{ activeTheme, mode, setMode, isLoaded }`

### `theme/tokens.ts`
Design token objects defining color palettes for light and dark themes.
**Key exports:** `lightTheme`, `darkTheme`
- Token categories: `background`, `surface`, `card`, `border`, `text` (primary/secondary/muted), `accent`, `error`, `warning`, `success`

---

## UI Primitives

### `ui/SafeImage.tsx`
Safe wrapper around `expo-image` that validates URIs (http/https/file/content/data schemes) and renders a fallback view for invalid or missing images.
**Key exports:** `SafeImage` (default) — props: `uri`, `style`, `resizeMode`, `fallback`

---

## Components

### `components/ErrorBoundary.tsx`
Class-based React error boundary that catches render errors and shows a "Try again" reset button.
**Key exports:** `ErrorBoundary` (default)

### `components/BgRenderer.tsx`
Renders chapter blocks distributed over background image regions, applying gradient fade-in/out effects at region boundaries.
**Key exports:** `preprocessBgBlocks()`, `BgSection`, `BgRenderer` (default)

### `components/reader/ChapterReader.tsx`
Main chapter reading component. Computes background image spans from the block array and renders each section with or without a background.
**Key exports:** `ChapterReader` (default), `computeSpans()`, `Section`

---

## Bubble Components

### `components/bubbles/BubbleRenderer.tsx`
Central dispatcher that routes each `Block` to the correct bubble-style component based on `textStyle`.
**Key exports:** `BubbleRenderer` (default), `TextRenderer`, `ImageRenderer`
Supported styles: `plain`, `dialogue`, `shout`, `loud`, `loud-convex`, `machine`, `bloom`, `thinking`, `custom`

### `components/bubbles/ShoutBubble.tsx`
Static spiky shout bubble rendered via a stretchable `ImageBackground` with cap insets. Color-tintable.
**Key exports:** `ShoutBubble` (default)

### `components/bubbles/AnimatedShoutBubble.tsx` (~338 lines)
Fully animated SVG shout bubble. Generates a rounded rectangle body with three tiers of oscillating spikes (BIG/MEDIUM/THIN) using chaotic frequency mixing. Applies an SVG gooey filter and runs at 18 FPS via `setInterval`.
**Key exports:** `AnimatedShoutBubble` (default)

### `components/bubbles/BloomBubble.tsx` (~164 lines)
Organic animated blob bubble. Elliptical body surrounded by animated petal spikes with sinusoidal ripple distortion and a gooey SVG filter for smooth blending.
**Key exports:** `BloomBubble` (default)

### `components/bubbles/LoudBubble.tsx` (~227 lines)
Concave or convex bubble with 8 corner spikes whose lean angles are derived from the bubble's aspect ratio. Spike lengths are driven by chaotic oscillators.
**Key exports:** `LoudBubble` (default) — prop: `variant` (`'concave' | 'convex'`)

### `components/bubbles/MachineBubble.tsx` (~159 lines)
Sharp octagonal bubble with rectangular corner spikes and monospace font styling. Less organic animation than the other bubble types.
**Key exports:** `MachineBubble` (default)

---

## Novel Editor

### `components/novel/NovelEditor.tsx` (~300+ lines)
Prose-first chapter editor. Automatically converts quoted text regions to animated speech bubbles. Supports `.txt`/`.docx` file import, a bubble-type picker with live preview, and a toggle between novel mode and block mode.
**Key exports:** `NovelEditor` (default)
**Key internals:** `parseIntoSegments()`, `BubbleSegment`, `ProseSegment`

---

## Data

### `data/mock-data.ts`
Static mock data for development: creators, projects, and chapters with full block structures.
**Key exports:** `mockCreators`, `mockProjects`, `createBlocks()`, `createChapters()`, `generateFeedPosts()`

---

## Assets

### `assets/AppLogo.tsx`
SVG app logo with a purple-to-blue gradient fill. Dynamically sized while preserving aspect ratio.
**Key exports:** `AppLogo` (default)

---

## App Screens (Expo Router file-based routing)

### `app/_layout.tsx`
Root layout. Wraps the app in `QueryClientProvider` (React Query) and `ThemeProvider`, then sets up the Stack navigator.
Route groups: `(tabs)`, `project`, `reader`, `create`, `profile`, `onair`, `studio`, `author`, `modal`

### `app/index.tsx`
Splash/redirect screen. Checks the `onboarding_complete` AsyncStorage flag and routes new users to `/onboarding` or returning users to the explore tab.

### `app/onboarding.tsx`
5-step taste-profile onboarding flow: reading pace → format preference → trope grid (4×4, max 5) → mood slider → reference story text. Saves the profile to AsyncStorage on completion.

### `app/(tabs)/_layout.tsx`
Bottom tab navigator with three tabs: Explore (Compass icon), Library (BookOpen icon), Studio (Palette icon). Colors adapt to the active theme.

### `app/(tabs)/explore/index.tsx`
Main discovery feed. Renders vertical `FeedCard` components with cover image, author, hook-signal badge (Rising / Hooked / Hidden gem based on score), like/subscribe/bookmark actions, and a "Read Ch.1" CTA.

### `app/(tabs)/library.tsx`
User reading shelves: Reading, Want to Read, Finished, Dropped. Each shelf shows `ShelfCard` components with progress bars; a "Continue Reading" banner appears for in-progress stories.

### `app/(tabs)/studio.tsx`
Creator Studio tab — minimal stub that links out to per-project studio routes.

### `app/create/index.tsx`
Create entry-point screen (minimal).

### `app/create/project/[projectId]/chapters/new.tsx`
Auto-creates a new chapter record in the database and immediately redirects to the chapter edit screen.

### `app/create/project/[projectId]/chapters/[chapterId]/edit.tsx`
Full chapter editor. Features: block CRUD, bubble-type picker modal, image/text/background block creation, character selector for dialogue bubbles, custom bubble upload, .txt/.docx file import, Novel/Block mode toggle, and live preview via `BubbleRenderer`.

### `app/create/project/[projectId]/characters/new.tsx`
Character creator screen: name, description, 8-color picker. Saves the character to the database.

### `app/project/[projectId]/index.tsx`
Public project detail / story page.

### `app/reader.tsx`
Chapter reading screen. Renders chapter content using `ChapterReader` and `BgRenderer`. Includes a chapter-end sequence: hook rating prompt → 5-second countdown → next chapter preview → Start Now / Cancel.

### `app/profile/index.tsx`
User profile view.

### `app/studio/[projectId]/index.tsx`
Per-project creator studio dashboard.

### `app/studio/[projectId]/broadcast/index.tsx`
Broadcast/publishing settings for a project.

### `app/onair/[projectId]/index.tsx`
Live/published story view.

### `app/author/[authorId]/index.tsx`
Public author profile page.

### `app/modal/index.tsx`
Generic modal screen.

---

## Configuration Files

### `app.json`
Expo app configuration. App name: "Novel MVP Clone Clone". Plugins: `expo-router`, `expo-image-picker`, `expo-sqlite` (with SQLCipher on iOS), `expo-document-picker`. Deep-link origin: `rork.com`.

### `package.json`
Project dependencies. Key packages: React 19.1.0, React Native 0.81.4, Expo 54.0.12, Zustand, React Query, `expo-sqlite`, `expo-image-picker`, `expo-document-picker`, `react-native-svg`, `lucide-react-native`, `jszip`, `fast-xml-parser`, `@rork-ai/toolkit-sdk`.

### `tsconfig.json`
TypeScript config. Strict mode enabled. Path alias: `@/*` → `./`.

### `babel.config.js`
Expo Babel preset with `unstable_transformImportMeta` plugin.

### `metro.config.js`
Metro bundler config. Adds `.wasm` to asset extensions and integrates the Rork AI toolkit.

### `eslint.config.js`
ESLint rules. Notably bans direct `react-native` `Image` imports — all image rendering must use `SafeImage` instead.

### `expo-env.d.ts`
Auto-generated Expo TypeScript environment declarations.

---

## Technology Stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo Router (file-based navigation) |
| Global state | Zustand |
| Server state | React Query |
| Storage | SQLite (native) / AsyncStorage (web) |
| Animation | React Native Animated + `react-native-svg` gooey filters |
| Document parsing | JSZip + fast-xml-parser |
| Icons | Lucide React Native |
| Language | TypeScript (strict mode) |
| Platforms | iOS · Android · Web |
