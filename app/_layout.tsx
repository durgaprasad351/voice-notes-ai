import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '../context/AppContext';
import { colors } from '../constants/theme';
import { VoiceNoteModal } from '../components/VoiceNoteModal';

function GlobalUI() {
  const { activeVoiceNoteId, closeVoiceNote } = useApp();
  
  return (
    <VoiceNoteModal 
      visible={!!activeVoiceNoteId}
      voiceNoteId={activeVoiceNoteId}
      onClose={closeVoiceNote}
    />
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <GlobalUI />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="all" 
          options={{ 
            title: 'All Items',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="category/[type]" 
          options={{ 
            title: 'Category',
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            title: 'Settings',
            presentation: 'modal',
          }} 
        />
      </Stack>
    </AppProvider>
  );
}

