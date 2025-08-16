import { Stack } from "expo-router";
import React from "react";

export default function ChatsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "AI Chats",
          headerLargeTitle: true,
          headerStyle: {
            backgroundColor: "#F2F2F7",
          },
          headerShadowVisible: false,
        }} 
      />
    </Stack>
  );
}