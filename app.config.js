import legalDefaultsModule from './config/legal-defaults.js'

const { legalDefaults } = legalDefaultsModule

export default {
  expo: {
    name: 'CareerFox AI',
    slug: 'careerfox-ai',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'aicareerfox',
    userInterfaceStyle: 'automatic',
    ios: {
      icon: './assets/expo.icon',
      bundleIdentifier: 'ai.careerfox.app',
      supportsTablet: false,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'server',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#208AEF',
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      ],
      '@clerk/expo',
      'expo-secure-store',
      'expo-localization',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
      posthogHost: process.env.POSTHOG_HOST || 'https://eu.i.posthog.com',
      privacyPolicyUrl:
        process.env.PRIVACY_POLICY_URL || legalDefaults.privacyPolicyUrl,
      supportEmail: process.env.SUPPORT_EMAIL || legalDefaults.supportEmail,
      termsOfServiceUrl:
        process.env.TERMS_OF_SERVICE_URL || legalDefaults.termsOfServiceUrl,
    },
  },
}
