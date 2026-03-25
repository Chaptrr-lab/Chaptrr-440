import { Stack } from 'expo-router';

export default function CreateLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="project/[projectId]/chapters" />
      <Stack.Screen name="project/[projectId]/characters/index" />
      <Stack.Screen name="project/[projectId]/characters/new" />
      <Stack.Screen name="project/[projectId]/characters/[characterId]/index" />
      <Stack.Screen name="project/[projectId]/chapters/new" />
      <Stack.Screen name="project/[projectId]/chapters/drafts" />
      <Stack.Screen name="project/[projectId]/chapters/trash" />
      <Stack.Screen name="project/[projectId]/chapters/[chapterId]/edit" />
    </Stack>
  );
}