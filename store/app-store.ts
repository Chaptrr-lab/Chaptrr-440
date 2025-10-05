import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { Project, FeedPost, Creator } from '@/types';

const initialState = {
  projects: [] as Project[],
  feedPosts: [] as FeedPost[],
  creators: [] as Creator[],
  currentProject: null as Project | null,
  currentChapterIndex: 0,
  likedProjects: new Set<string>(),
};

export const useAppStore = create(
  combine(initialState, (set, get) => ({
    setProjects: (projects: Project[]) => {
      set({ projects });
    },
    setFeedPosts: (feedPosts: FeedPost[]) => set({ feedPosts }),
    setCurrentProject: (currentProject: Project | null) => set({ currentProject, currentChapterIndex: 0 }),
    setCurrentChapterIndex: (currentChapterIndex: number) => set({ currentChapterIndex }),
    
    toggleLike: (projectId: string) => set((state) => {
    const newLikedProjects = new Set(state.likedProjects);
    const projects = state.projects.map(project => {
      if (project.id === projectId) {
        if (newLikedProjects.has(projectId)) {
          newLikedProjects.delete(projectId);
          return { ...project, stats: { ...project.stats, likes: project.stats.likes - 1 } };
        } else {
          newLikedProjects.add(projectId);
          return { ...project, stats: { ...project.stats, likes: project.stats.likes + 1 } };
        }
      }
      return project;
    });
    
    return { 
      likedProjects: newLikedProjects, 
      projects,
      feedPosts: state.feedPosts.map(post => ({
        ...post,
        project: projects.find(p => p.id === post.project.id) || post.project
      }))
    };
    }),

    addProject: (project: Project) => set((state) => ({
      projects: [project, ...state.projects]
    })),

    incrementViews: (projectId: string) => set((state) => ({
      projects: state.projects.map(project =>
        project.id === projectId
          ? { ...project, stats: { ...project.stats, views: project.stats.views + 1 } }
          : project
      )
    })),

    incrementOpens: (projectId: string) => set((state) => ({
      projects: state.projects.map(project =>
        project.id === projectId
          ? { ...project, stats: { ...project.stats, opens: project.stats.opens + 1 } }
          : project
      )
    })),
  }))
);