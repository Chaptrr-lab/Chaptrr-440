// Simple auth helper for project ownership
// In a real app, this would check against user authentication

export const isProjectAuthor = async (projectId: string): Promise<boolean> => {
  // For now, always return true since we're in demo mode
  // In production, this would check if the current user owns the project
  return true;
};

export const getCurrentUserId = (): string => {
  // For demo purposes, return a fixed user ID
  return '1';
};