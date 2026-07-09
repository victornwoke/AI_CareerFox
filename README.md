# CareerFox AI 🦊

A playful, premium AI career coach mobile app that helps job seekers practice interviews, improve CVs, track applications, and build daily job-search confidence through structured workflows, AI-powered feedback, and gamification.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Building & Deployment](#building--deployment)
  - [iOS App Store](#ios-app-store)
  - [Google Play Store](#google-play-store)
- [API Integration](#api-integration)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**CareerFox AI** is a production-quality iOS and Android application designed for job seekers who need structured, AI-powered guidance to:

- **Practice Mock Interviews** with realistic questions and AI-powered feedback
- **Improve CV/Resume** content with CV Coach and AI analysis
- **Track Job Applications** with follow-up reminders
- **Build Confidence** through daily missions, XP, streaks, and achievements
- **Get Personalized Feedback** from multiple AI providers (Gemini, OpenRouter)

The app combines a structured career training system with cutting-edge AI features to feel like a personal career coach in the user's pocket.

### Target Users

- Graduates and entry-level job seekers
- Career changers
- Tech candidates preparing for interviews
- Professionals returning to work
- Users lacking confidence in explaining experience

---

## Features

### Core Features

1. **Interview Practice**
   - Realistic behavioral and technical questions
   - Video/voice recording of answers
   - AI-powered feedback on readiness scores
   - Progress tracking and score trends
   - Category breakdown (Technical vs Behavioral)

2. **CV Coach**
   - Upload CV and job description
   - AI analysis using vision models
   - Section-by-section feedback
   - Keyword and bullet-point suggestions
   - File upload with automatic text extraction

3. **Application Tracker**
   - Log job applications with company/role details
   - Status tracking (Applied, Interview, Offer, Rejected)
   - Follow-up reminders
   - Application history and metrics

4. **Learning Categories**
   - Structured lesson paths
   - Voice-based learning sessions
   - Interactive practice questions
   - Career-specific content

5. **Progress Dashboard**
   - Questions answered, average score, time spent
   - 7-day/30-day/all-time views
   - Score trends visualization
   - Category performance breakdown
   - Achievements and streaks

6. **User Profile**
   - Target role and experience level setup
   - Profile management
   - Onboarding flow
   - Legal links (Privacy Policy, Terms of Service)

### Advanced Features

- **Clerk Authentication** - Secure sign-up, sign-in, and email verification
- **PostHog Analytics** - User engagement and feature usage tracking
- **Voice Sessions** - Python-based Vision Agents for interactive coaching
- **Multi-Model AI** - Fallback routing between Gemini and OpenRouter
- **Offline Support** - AsyncStorage for data persistence
- **Stream Video Integration** - Real-time video streaming (foundation)

---

## Tech Stack

### Frontend

- **Expo** `~57.0.3` - Cross-platform app framework
- **React Native** `0.86.0` - Mobile UI framework
- **TypeScript** `~6.0.3` - Type safety
- **Expo Router** `~57.0.4` - File-based routing
- **NativeWind** `^5.0.0-preview.4` - Tailwind CSS for React Native
- **Zustand** `^5.0.14` - State management
- **AsyncStorage** `2.2.0` - Local data persistence
- **React Native Safe Area Context** - Safe area handling
- **Expo Symbols** - SF Symbols for iOS
- **React Native Reanimated** `4.5.0` - Animations

### Authentication & Backend

- **Clerk** `^3.7.0` - Authentication and user management
- **JWT** `^9.0.0` - Token signing/verification

### AI & Content

- **Google Gemini API** - Primary AI provider (interviews, CV analysis)
- **OpenRouter API** - Fallback AI provider (rate limit handling)
- **Vision Agents** `v0.6.6+` -Python-based voice coaching

### File Processing

- **pdf-parse** `^1.1.1` - PDF text extraction
- **mammoth** `^1.8.0` - DOCX text extraction

### Analytics & Logging

- **PostHog** `^4.54.4` - Product analytics

### Development Tools

- **ESLint** `^9.0.0` - Code linting
- **Tailwind CSS** `^4.3.2` - Utility-first CSS
- **PostCSS** `^8.5.16` - CSS processing
- **Node.js** `v24.13.0` - JavaScript runtime

---

## Prerequisites

### Required

- **Node.js** `v24.x` or later
- **npm** `10.x` or later
- **Xcode** `15.0+` (for iOS development)
- **Android Studio** `2024.1+` (for Android development)
- **CocoaPods** (for iOS dependencies)

### Required API Keys

1. **Google Gemini API Key** - Interview practice & CV analysis
2. **OpenRouter API Key** - Fallback AI provider
3. **Clerk API Keys** - Authentication (public and secret keys)
4. **Stream Video API Keys** - Video streaming (optional)
5. **PostHog Project Token** - Analytics (optional)

### Optional

- **Vision Agents Setup** - Python `3.9+` for voice coaching service
- **macOS/Linux** - Development machine

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/careerfox-ai.git
cd careerfox-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install iOS Dependencies (macOS only)

```bash
cd ios
pod install
cd ..
```

### 4. Install Python Dependencies (for Vision Agents)

```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r vision-agent/requirements.txt
```

### 5. Setup Environment Variables

Create a `.env` file in the project root:

```bash
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Stream Video (optional)
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

# PostHog Analytics (optional)
POSTHOG_PROJECT_TOKEN=your_posthog_token
POSTHOG_HOST=https://eu.i.posthog.com

# Legal URLs (optional)
PRIVACY_POLICY_URL=https://example.com/privacy
TERMS_OF_SERVICE_URL=https://example.com/terms
SUPPORT_EMAIL=support@careerfox.ai
```

---

## Running the App

### Development Server

Start the Expo development server:

```bash
npm start
```

### iOS Development

**Simulator:**

```bash
npx expo run:ios
```

**Physical Device (iPad/iPhone):**

```bash
npx expo run:ios --device "iPad (A16)"
```

Alternatively, scan the QR code with Expo Go app.

### Android Development

**Emulator:**

```bash
npx expo run:android
```

**Physical Device:**

```bash
npx expo run:android --device
```

### Python Voice Coaching Service

Start the Vision Agents service (separate terminal):

```bash
source .venv/bin/activate
cd vision-agent
python agent.py
```

The service will be available at `http://localhost:8000`

---

## Project Structure

```txt
careerfox-ai/
├── app/                           # Expo Router pages (file-based routing)
│   ├── (auth)/                    # Authentication screens
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── verify-email.tsx
│   ├── (onboarding)/              # Onboarding flow
│   │   ├── target-role.tsx
│   │   └── experience-level.tsx
│   ├── (tabs)/                    # Tab navigation
│   │   ├── home.tsx
│   │   ├── learn.tsx
│   │   ├── progress.tsx
│   │   ├── applications.tsx
│   │   └── profile.tsx
│   ├── interview/                 # Interview practice
│   │   ├── question.tsx
│   │   ├── voice.tsx
│   │   ├── behavioral.tsx
│   │   └── lesson-intro.tsx
│   ├── cv/                        # CV coach
│   │   ├── index.tsx
│   │   └── results.tsx
│   └── applications/              # Application tracking
│       ├── new.tsx
│       ├── [id].tsx
│       └── list.tsx
├── src/                           # Source code
│   ├── app/                       # Root layout
│   ├── components/                # Reusable UI components
│   │   ├── ui/                    # Basic UI elements
│   │   ├── interview/             # Interview components
│   │   ├── learning/              # Learning components
│   │   ├── auth/                  # Auth components
│   │   └── tabs/                  # Tab navigation
│   ├── lib/                       # Utility functions & business logic
│   │   ├── ai/                    # AI providers (Gemini, OpenRouter)
│   │   ├── server/                # Server API calls
│   │   └── utils/                 # Helper functions
│   ├── store/                     # Zustand state management
│   │   ├── useAuthStore.ts
│   │   ├── useInterviewStore.ts
│   │   ├── useProgressStore.ts
│   │   └── ...
│   ├── types/                     # TypeScript types
│   ├── constants/                 # App constants
│   │   ├── colors.ts
│   │   └── images.ts
│   └── data/                      # Static content
│       ├── interviewQuestions.ts
│       └── ...
├── assets/                        # Images, icons, fonts
│   ├── images/
│   └── expo.icon/
├── config/                        # App configuration
├── ios/                           # iOS native code (Xcode project)
├── android/                       # Android native code
├── vision-agent/                  # Python Vision Agents service
│   ├── agent.py
│   ├── requirements.txt
│   └── README.md
├── app.config.js                  # Expo configuration
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
├── eslint.config.js               # ESLint config
├── metro.config.js                # Metro bundler config
├── postcss.config.mjs             # PostCSS config
├── global.css                     # Global styles
└── README.md                      # This file
```

---

## Environment Setup

### 1. API Keys

#### Gemini API

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikeys)
2. Create a new API key
3. Add to `.env`: `GEMINI_API_KEY=sk-...`

#### OpenRouter API

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up and create API key
3. Add to `.env`: `OPENROUTER_API_KEY=sk-or-v1-...`

#### Clerk Authentication

1. Visit [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Copy API keys to `.env`:
   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...`
   - `CLERK_SECRET_KEY=sk_live_...`

### 2. Development Machine Setup

**macOS:**

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install CocoaPods
sudo gem install cocoapods

# Install Node Version Manager (nvm) - optional but recommended
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 24.13.0
nvm use 24.13.0
```

**Linux/Ubuntu:**

```bash
# Install required packages
sudo apt-get update
sudo apt-get install -y nodejs npm python3 python3-venv

# For Android development
sudo apt-get install -y android-studio
```

### 3. Verify Installation

```bash
node --version     # v24.13.0 or later
npm --version      # 10.x or later
npm run typecheck  # Should pass with no errors
npm run lint       # Should pass with no errors
```

---

## Building & Deployment

### iOS App Store

#### \*Prerequisites

- Apple Developer Account ($99/year)
- Xcode installed
- Certificates and provisioning profiles set up

#### Step 1: Update Version

Edit `app.config.js`:

```javascript
export default {
  expo: {
    version: "1.0.1", // Increment version
    ios: {
      buildNumber: "2", // Increment build number
    },
  },
};
```

#### Step 2: Create iOS Build

```bash
# Prerequisites: Xcode, Xcode Command Line Tools, certificates

# Option A: Using Expo Build Service (recommended)
npx eas build --platform ios --auto-submit

# Option B: Local build
npx expo prebuild --clean
cd ios
xcodebuild -workspace AICareerFox.xcworkspace \
  -scheme AICareerFox \
  -configuration Release \
  -archivePath build/AICareerFox.xcarchive \
  archive

# Export IPA from the archive
xcodebuild -exportArchive \
  -archivePath build/AICareerFox.xcarchive \
  -exportPath build/export \
  -exportOptionsPlist ExportOptions.plist
cd ..

# Resulting IPA: ios/build/export/AICareerFox.ipa
```

#### Step 3: Upload to App Store Connect

```bash
# After creating archive in Xcode

# Option A: Using Xcode Organizer
# 1. Open Xcode > Window > Organizer
# 2. Select your archive
# 3. Click "Distribute App"
# 4. Select "App Store Connect"
# 5. Follow prompts

# Option B: Using Transporter
xcrun altool --upload-app -f ios/build/export/AICareerFox.ipa \
  -t ios \
  -u your-apple-id@example.com \
  -p app-specific-password
```

#### Step 4: App Store Review

1. Visit [App Store Connect](https://appstoreconnect.apple.com/)
2. Navigate to **My Apps > CareerFox AI**
3. Fill in app information:
   - App Name, Subtitle, Description
   - Keywords, Category
   - Screenshot and Preview Video
   - Support URL, Privacy Policy
   - Contact Information
4. Set up pricing and availability
5. Submit for review

#### Step 5: Monitor Review Status

- Check App Store Connect dashboard for review status
- Typical review time: 24-48 hours
- Response required for any feedback or rejections

#### Release to Users

Once approved:

1. Click "Release"
2. Select version
3. Confirm release to App Store

### Google Play Store

#### \*Prerequisites (Google Play)

- Google Play Developer Account ($25 one-time)
- Signing certificate (keystore file)
- Android SDK tools

#### Step 1: Create Signing Certificate

```bash
# Generate keystore (one-time)
keytool -genkey-dname "cn=Victor, ou=Engineering, o=CareerFox, c=US" \
  -alias careerfox-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -keystore careerfox.keystore

# Store keystore file securely (don't commit to git)
mkdir -p ~/.android
cp careerfox.keystore ~/.android/
```

#### Step 2: Update Gradle Configuration

Edit `android/app/build.gradle`:

```gradle
android {
  ...
  signingConfigs {
    release {
      storeFile file("${System.properties['user.home']}/.android/careerfox.keystore")
      storePassword System.getenv("KEYSTORE_PASSWORD")
      keyAlias System.getenv("KEY_ALIAS")
      keyPassword System.getenv("KEY_PASSWORD")
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
      ...
    }
  }
  ...
}
```

#### Step 3: Create Android Build

```bash
# Set environment variables
export KEYSTORE_PASSWORD=your_keystore_password
export KEY_ALIAS=careerfox-key
export KEY_PASSWORD=your_key_password

# Build APK and Bundle
npx expo prebuild --clean
cd android
./gradlew bundleRelease
cd ..

# APK location: android/app/build/outputs/apk/release/app-release.apk
# Bundle location: android/app/build/outputs/bundle/release/app-release.aab
```

#### Step 4: Upload to Google Play Console

1. Visit [Google Play Console](https://play.google.com/console)
2. Navigate to **Apps > CareerFox AI**
3. Create new release in **Release > Production**
4. Upload APK or AAB file:
   - **Recommended**: Use AAB (Android App Bundle) for better size optimization
5. Fill in release notes and changes

#### Step 5: Complete Store Listing

1. **Store listing** > Fill in:
   - Short description (80 characters)
   - Full description (up to 4000 characters)
   - Screenshots (5-8 images)
   - Feature graphic (1024x500)
   - Category and content rating
   - Privacy policy URL
2. **App content** > Fill in questionnaire
3. **Target audience** > Select regions and age rating

#### Step 6: Set Up Pricing

1. Navigate to **Pricing & distribution**
2. Select free or paid
3. Select countries/regions
4. Review and finalize

#### Step 7: Submit for Review

1. Click **Review and roll out to production**
2. Confirm all details
3. Submit
4. Wait for review (typically 24-48 hours, up to 7 days)

#### Step 8: Monitor & Release

- Check review status in Play Console dashboard
- Once approved, click **Release** to make public
- Monitor crash reports and user ratings in **Analytics**

#### Post-Launch Monitoring

Monitor key metrics:

- **Crashes & ANRs** - Track app stability
- **User ratings** - Monitor app store rating
- **Reviews** - Read user feedback
- **Engagement** - Track daily active users
- **Retention** - Monitor D1, D7, D30 retention

---

## API Integration

### Gemini Provider

**Used for:**

- Interview feedback and readiness scoring
- Lesson, practice, and general structured AI flows
- Question generation and explanations

**Error Handling:**

- Rate limit (429): Automatically fallbacks to OpenRouter
- Temporary unavailability and provider misconfiguration mapped to 503: falls back to OpenRouter when available
- Timeout (504): surfaced as provider timeout

**Integration Points:**

- `src/lib/ai/geminiProvider.ts` - Gemini client setup
- `src/lib/ai/aiProvider.ts` - Primary provider selection for non-CV flows
- `src/lib/server/aiFeedback.ts` - General feedback generation

### OpenRouter Provider

**Used for:**

- CV analysis and improvement suggestions
- Fallback AI provider for non-CV flows when Gemini is unavailable or rate-limited
- Multimodal requests that include uploaded files

**Supported Models:**

- **Text Models**: LLaMA 3.3 70B, Qwen 3 Coder, Gemma 4 31B
- **Vision Models**: GPT-4o, Gemini 2.0 Flash, LLaMA 3.2 90B Vision

**Integration Points:**

- `src/lib/ai/openrouterProvider.ts` - OpenRouter client setup
- `src/lib/ai/aiProvider.ts` - CV routing and Gemini fallback routing
- `src/lib/server/aiFeedback.ts` - CV feedback generation via `getCvAiProvider()`

### Clerk API

**Used for:**

- User authentication and session management
- Email verification
- User profile data

**Integration Points:**

- `app/(auth)/` - Auth screens
- `src/lib/server/` - Protected API routes

---

## Development Workflow

### Running Tests

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Lint with auto-fix
npm run lint -- --fix
```

### Code Style

- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS via NativeWind
- **State**: Zustand for global state
- **UI Components**: Custom components + React Native
- **File Naming**: `kebab-case.tsx` for components, `camelCase.ts` for utilities

### Creating New Features

1. **Create components** in `src/components/`
2. **Add types** in `src/types/`
3. **Create store** in `src/store/` if needed
4. **Add screens** in `app/` using file-based routing
5. **Test** with `npm run typecheck && npm run lint`
6. **Commit** with meaningful messages

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "feat: add new interview practice feature"

# Push to remote
git push origin feature/feature-name

# Create Pull Request on GitHub
```

---

## Troubleshooting

### Common Issues

#### Issue: `npm install` fails with peer dependency warnings

**Solution:**

```bash
npm install --legacy-peer-deps
```

#### Issue: iOS build fails with CocoaPods errors

**Solution:**

```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
npx expo prebuild --clean
```

#### Issue: Expo dev server won't start

**Solution:**

```bash
# Clear cache and restart
npx expo start --clear
```

#### Issue: Gemini API returns 429 (rate limited)

**Solution:**

- App automatically falls back to OpenRouter
- Check API quota on Google Cloud Console
- Wait a few minutes before retrying
- Consider upgrading to paid Gemini plan

#### Issue: Environment variables not loading

**Solution:**

```bash
# Ensure .env file exists in project root
# Restart dev server after changes
npx expo start --clear

# For iOS/Android builds, verify in eas.json or app.config.js
```

#### Issue: "Metro server not found" error

**Solution:**

```bash
# Kill the dev server and restart
lsof -ti:8081 | xargs kill -9
npx expo start
```

### Debug Logs

Enable detailed logging:

```bash
# Development server
npx expo start --verbose

# Build logs
npx eas build --platform ios --verbose

# Device logs
npx expo run:ios --verbose
```

---

## Contributing

### Code Standards

- Use TypeScript strictly (no `any` types)
- Write clear, descriptive commit messages
- Follow Tailwind CSS conventions for styling
- Keep components small and focused
- Add comments for complex logic

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Create Pull Request with clear description
6. Address review feedback
7. Merge when approved

### Reporting Issues

Use GitHub Issues with:

- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Device and OS version
- Screenshots/logs if applicable

---

## Performance Optimization

### Mobile App

- **Bundle Size**: Monitor with `npx expo run:ios -- --bundle-visualizer`
- **Memory**: Use `React.memo()` for heavy components
- **Navigation**: Lazy load screens with `React.lazy()`
- **Analytics**: Batch events with PostHog

### Backend Services

- **API Calls**: Cache responses with AsyncStorage
- **File Processing**: Process PDFs/DOCX on backend
- **AI Requests**: Use request deduplication and caching

---

## Security Considerations

### API Keys

- ✅ Store in `.env` file (never commit)
- ✅ Use separate keys for development/production
- ✅ Rotate keys regularly
- ✅ Restrict API key permissions in provider dashboards

### User Data

- ✅ Use Clerk for secure authentication
- ✅ Never store passwords locally
- ✅ Use HTTPS for all API calls
- ✅ Implement rate limiting on backend

### Code Security

- ✅ Keep dependencies updated: `npm audit fix`
- ✅ Use secrets management for CI/CD
- ✅ Regular security scans
- ✅ Code review for sensitive changes

---

## License

This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.

---

## Support

For questions or issues:

- **Email**: <support@careerfox.ai>
- **Documentation**: See `prompts/` directory for detailed feature guides
- **Issues**: Create GitHub issue with details

---

## Changelog

### Version 1.0.0 (2026-07-09)

- ✅ Initial MVP release
- ✅ Interview practice with AI feedback
- ✅ CV coach with file upload
- ✅ Application tracker
- ✅ Progress dashboard with time-period filtering
- ✅ User authentication with Clerk
- ✅ Analytics with PostHog
- ✅ Support for iOS and Android

---

**Last Updated**: July 9, 2026

For the latest information, visit [CareerFox AI](https://careerfox.ai)
