# ZenMix - Meditation Sound Mixer

⚠️ **Private Project** - This is a private repository. All rights reserved.

ZenMix is a mobile and web application built with Expo and React Native that allows users to create custom meditation mixes by combining different ambient sounds and music tracks.

## Features

- 🎵 Mix multiple audio tracks
- 🎚️ Individual volume controls for each track
- 🎛️ Equalizer settings per track
- 🔄 Loop controls for each sound
- 💾 Save and share your mixes
- 🌐 Cross-platform (iOS, Android, Web)
- 🎨 Beautiful dark mode UI
- 👤 User profiles and preferences

## Tech Stack

- [Expo](https://expo.dev/) - React Native framework
- [React Navigation](https://reactnavigation.org/) - Navigation
- [Supabase](https://supabase.com/) - Backend and authentication
- [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/) - Audio playback
- [Lucide Icons](https://lucide.dev/) - Icons

## Development Setup

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- Expo CLI
- Expo Go app (for mobile development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/bigocox1970/ZenMix-Expo.git
   cd ZenMix-Expo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

### Running the App

#### Mobile Development
```bash
# Start the development server with tunnel option (recommended for mobile)
npx expo start --tunnel

# Then scan the QR code with Expo Go app
```

#### Web Development
```bash
# Start the development server for web
npx expo start --web
```

## Deployment

### Web (Netlify)

The project is configured for Netlify deployment:

1. Push code to GitHub
2. Connect repository to Netlify
3. Add environment variables in Netlify dashboard:
   - EXPO_PUBLIC_SUPABASE_URL
   - EXPO_PUBLIC_SUPABASE_ANON_KEY
4. Deploy!

Build settings are configured in `netlify.toml`.

### Mobile (Expo)

For iOS/Android builds:
1. Install EAS CLI: `npm install -g eas-cli`
2. Configure app.json for builds
3. Run `eas build` for production builds
4. Follow the [Expo build documentation](https://docs.expo.dev/build/setup/) for detailed steps

## Project Structure

```
ZenMix-Expo/
├── app/                   # App screens and navigation
│   ├── (tabs)/           # Tab-based screens
│   └── auth.tsx          # Authentication screen
├── components/           # Reusable components
├── assets/              # Images and static files
├── lib/                 # Utilities and services
└── supabase/            # Database migrations
```

## Development Notes

### Key Features Implementation
- Audio mixing using Expo AV
- Real-time volume and EQ controls
- User authentication with Supabase
- Cross-platform compatibility
- Persistent storage for user preferences

### Future Enhancements
- Additional sound libraries
- Advanced audio effects
- Social sharing features
- Offline mode
- Premium features

## Maintenance

### Regular Tasks
- Keep Expo SDK and dependencies updated
- Monitor Supabase usage and limits
- Backup database regularly
- Test on both iOS and Android

### Troubleshooting
- For audio issues, check Expo AV documentation
- For database issues, check Supabase logs
- For build issues, verify Expo configuration 