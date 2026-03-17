import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { initializeDatabase, initializeSampleData, listProjects } from "@/lib/database";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { useAppStore } from "@/store/app-store";
import { mockProjects, generateFeedPosts } from "@/data/mock-data";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { activeTheme, mode } = useTheme();
  
  return (
    <View style={[styles.navContainer, { backgroundColor: activeTheme.colors.background }]}>
      <StatusBar 
        barStyle={mode === 'dark' ? "light-content" : "dark-content"}
        backgroundColor={activeTheme.colors.background}
      />
      <Stack screenOptions={{ 
        headerBackTitle: "Back",
        contentStyle: [styles.stackContent, { backgroundColor: activeTheme.colors.background }]
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="project" 
          options={{ 
            headerShown: false,
            presentation: "card"
          }} 
        />
        <Stack.Screen 
          name="reader" 
          options={{ 
            headerShown: false,
            presentation: "card"
          }} 
        />
        <Stack.Screen 
          name="create" 
          options={{ 
            headerShown: false,
            presentation: "card"
          }} 
        />
        <Stack.Screen 
          name="profile" 
          options={{ 
            headerShown: false,
            presentation: "card"
          }} 
        />
        <Stack.Screen 
          name="onair" 
          options={{ 
            headerShown: false,
            presentation: "card"
          }} 
        />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navContainer: {
    flex: 1,
  },
  stackContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorMessage: {
    color: '#cccccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { setProjects, setFeedPosts } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('Starting app initialization...');
        
        // Initialize database
        await initializeDatabase();
        console.log('Database initialized successfully');
        
        // Initialize sample data
        await initializeSampleData();
        console.log('Sample data initialized');
        
        // Load projects from database
        const dbProjects = await listProjects();
        console.log('Loaded projects from database:', dbProjects.length);
        
        // Merge with mock projects for explore feed
        setProjects(mockProjects);
        setFeedPosts(generateFeedPosts(mockProjects));
        
        console.log('App initialization complete');
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown initialization error');
      } finally {
        // Always hide splash screen
        try {
          await SplashScreen.hideAsync();
        } catch (splashError) {
          console.error('Failed to hide splash screen:', splashError);
        }
      }
    };
    
    initApp();
  }, [setProjects, setFeedPosts]);

  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Initialization Failed</Text>
        <Text style={styles.errorMessage}>{initError}</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <GestureHandlerRootView style={styles.container}>
            <AppInitializer>
              <RootLayoutNav />
            </AppInitializer>
          </GestureHandlerRootView>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}