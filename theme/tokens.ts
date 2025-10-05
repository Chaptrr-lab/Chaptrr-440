export interface ThemeTokens {
  colors: {
    background: string;
    surface: string;
    card: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    accent: string;
    error: string;
    warning: string;
    success: string;
  };
}

export const lightTheme: ThemeTokens = {
  colors: {
    background: '#ffffff',
    surface: '#f5f5f5',
    card: '#f8f9fa',
    border: 'rgba(0, 0, 0, 0.12)',
    text: {
      primary: '#1a1a1a',
      secondary: '#333333',
      muted: '#555555',
    },
    accent: '#6366f1',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
  },
};

export const darkTheme: ThemeTokens = {
  colors: {
    background: '#000000',
    surface: '#111111',
    card: '#1a1a1a',
    border: 'rgba(255, 255, 255, 0.1)',
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
      muted: '#666666',
    },
    accent: '#6366f1',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
  },
};
