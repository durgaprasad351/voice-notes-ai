# 🎙️ VoiceNotes AI

A voice-first productivity app that captures your thoughts and intelligently categorizes them using AI.

## Features

- **🎤 Voice Recording**: One-tap recording for quick voice notes
- **🤖 AI-Powered**: Uses OpenAI Whisper for transcription and GPT-4o-mini for intelligent categorization
- **📱 Cross-Platform**: Works on both iOS and Android
- **📊 Smart Categories**: Automatically extracts:
  - ✅ Todos with due dates and priorities
  - ⏰ Reminders with times
  - 📅 Events with dates and locations
  - 📝 Notes and general thoughts
  - 💡 Ideas and inspiration
  - 🛒 Shopping lists
  - 👤 People and contacts
  - 📔 Journal entries
- **✓ Completion Tracking**: Say "I finished X" and the AI marks it done
- **🚗 Quick Glance UI**: Large, minimal design for use while on the go

## Setup Instructions

### Prerequisites

- Node.js 18+ (recommended: use nvm)
- npm or yarn
- Expo Go app on your phone (for testing)
- OpenAI API key

### Installation

1. **Install Node.js** (if not already installed):
   ```bash
   # Using nvm (recommended)
   nvm install 20
   nvm use 20
   ```

2. **Navigate to the project**:
   ```bash
   cd voice-notes-ai
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Add app icons** (optional but recommended):
   - Add `icon.png` (1024x1024) to `assets/`
   - Add `splash.png` (1284x2778) to `assets/`
   - Add `adaptive-icon.png` (1024x1024) to `assets/`
   - Add `favicon.png` (48x48) to `assets/`

5. **Start the development server**:
   ```bash
   npm start
   ```

6. **Run on your device**:
   - Install **Expo Go** from App Store or Play Store
   - Scan the QR code shown in the terminal
   - Or press `i` for iOS simulator / `a` for Android emulator

### First Launch

1. The app will prompt you for your OpenAI API key
2. Enter your key (starts with `sk-...`)
3. The key is stored locally and securely on your device
4. You're ready to start recording!

## Usage

### Recording Voice Notes

1. Tap the large microphone button
2. Speak naturally about what's on your mind
3. Tap again to stop recording
4. The AI will:
   - Transcribe your speech
   - Extract and categorize items
   - Show you what was captured

### Example Voice Inputs

- *"Remind me to call mom tomorrow at 5pm"*
- *"I need to buy milk, eggs, and bread"*
- *"Meeting with John on Friday at 2pm at the coffee shop"*
- *"I just finished that report for work"* (marks existing todo as complete)
- *"Had a great day today, feeling happy and productive"* (journal entry)
- *"New idea: what if we built an app that..."*

### Managing Items

- **View all items**: Tap "View All" or use the category cards
- **Complete items**: Tap the ✓ Done button on todos
- **Filter by type**: Use the filter pills in the All Items view
- **View by category**: Tap any category card on the home screen

## Tech Stack

- **Framework**: React Native + Expo
- **Routing**: Expo Router
- **Database**: SQLite (expo-sqlite)
- **Audio**: expo-av
- **Speech-to-Text**: OpenAI Whisper API
- **LLM**: OpenAI GPT-4o-mini
- **State**: React Context

## Project Structure

```
voice-notes-ai/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout
│   ├── index.tsx           # Home screen
│   ├── all.tsx             # All items view
│   ├── settings.tsx        # Settings screen
│   └── category/
│       └── [type].tsx      # Category detail view
├── components/             # Reusable UI components
├── constants/              # Theme and configuration
├── context/                # React Context providers
├── services/               # Business logic
│   ├── audio.ts            # Audio recording
│   ├── database.ts         # SQLite operations
│   └── openai.ts           # OpenAI API integration
├── types/                  # TypeScript definitions
└── assets/                 # Images and icons
```

## Configuration

### OpenAI API

The app uses:
- **Whisper** for speech-to-text (most accurate)
- **GPT-4o-mini** for entity extraction (fast and cost-effective)

Estimated cost: ~$0.01-0.02 per voice note

### Customization

- Edit `constants/theme.ts` to change colors and styling
- Modify the LLM prompt in `services/openai.ts` to adjust extraction behavior

## Troubleshooting

### "Permission denied" for microphone
- iOS: Go to Settings > VoiceNotes AI > Microphone
- Android: Go to Settings > Apps > VoiceNotes AI > Permissions

### API errors
- Verify your OpenAI API key is correct
- Check your OpenAI account has credits
- Ensure you have network connectivity

### Recording not working
- Make sure no other app is using the microphone
- Try restarting the app
- Check audio permissions are granted

## Future Enhancements

- [ ] Calendar integration (Google Calendar, Apple Calendar)
- [ ] Cross-device sync
- [ ] Offline mode with local ML models
- [ ] Widget for quick recording
- [ ] Siri/Google Assistant integration
- [ ] Export to Notion/Obsidian

## License

MIT License - feel free to use and modify!

