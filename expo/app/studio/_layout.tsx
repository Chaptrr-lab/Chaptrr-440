import { Stack } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';

export default function StudioLayout() {
  const { activeTheme } = useTheme();
  
  return (
    <Stack 
      screenOptions={{ 
        headerShown: true,
        headerStyle: {
          backgroundColor: activeTheme.colors.background,
        },
        headerTintColor: activeTheme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen name="[projectId]/index" options={{ headerShown: false }} />
      <Stack.Screen 
        name="[projectId]/broadcast/index" 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="[projectId]/broadcast/intro" 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="[projectId]/broadcast/settings" 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen name="analytics" options={{ headerShown: false }} />
      <Stack.Screen name="broadcast-room" options={{ headerShown: false }} />
      <Stack.Screen name="stories-trash" options={{ headerShown: false }} />
    </Stack>
  );
}
