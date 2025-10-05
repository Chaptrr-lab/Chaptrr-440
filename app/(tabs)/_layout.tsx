import { Tabs } from "expo-router";
import { Compass, BookOpen, Palette } from "lucide-react-native";
import React from "react";
import { useTheme } from "@/theme/ThemeProvider";

export default function TabLayout() {
  const { activeTheme } = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeTheme.colors.accent,
        tabBarInactiveTintColor: activeTheme.colors.text.muted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: activeTheme.colors.background,
          borderTopWidth: 1,
          borderTopColor: activeTheme.colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="studio"
        options={{
          title: "Studio",
          tabBarIcon: ({ color, size }) => <Palette color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}