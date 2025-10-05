import { Stack } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';

export default function OnAirLayout() {
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
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'On Air',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="[projectId]/index" 
        options={{ 
          headerShown: false
        }} 
      />
    </Stack>
  );
}
