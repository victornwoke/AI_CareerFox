## Visual Reference Files

No dedicated screen reference is required for this prompt.

Still follow:

- `AGENTS.md`
- the existing app design system
- the Figma source link if available

Read AGENTS.md first and follow it strictly.

Set up NativeWind in this Expo + React Native app following the NativeWind documentation I provided exactly. Use the installed NativeWind version and apply the required configuration, global.css setup, babel config, and metro config changes,TypeScript types, and app entry imports as needed.Do not use outdated setuport different version docs

# Installation (/v5/getting-started/installation)

import { Tab, Tabs } from "fumadocs-ui/components/tabs";

import Install from "./\_install.mdx";
import TailwindInstall from "./\_tailwind.mdx";
import { Callout } from "@/components/callout";

{/_# Installation_/}

{/\* <a
href="./installation/"
className="underline underline-offset-8 text-fd-primary hover:opacity-100 p-4"

> {"Expo"}
> </a>
> {/\* {" | "} <a
> href="./installation/frameworkless"
> className="decoration-transparent hover:decoration-fd-foreground opacity-70 hover:opacity-100 underline-offset-8 rounded-lg p-4"
>
> {"Framework-less"}
> </a> _/}
> {/_ {" | "} <a
> href="./installation/nextjs"
> className="decoration-transparent hover:decoration-fd-foreground opacity-70 hover:opacity-100 underline-offset-8 rounded-lg p-4"
>
> {"Next.js"}
> </a> \*/}

<Callout type="tip">
 If you'd like to skip manual setup and use Nativewind, you can use the following command to initialize a new Expo project with Nativewind v5, Expo SDK 54, and Tailwind CSS.

<Tabs groupId="v5-npm-install" items={["npm", "yarn", "pnpm", "bun"]}>
<Tab value="npm">

```bash
npx rn-new@next --nativewind
```

  </Tab>
  <Tab value="yarn">
```bash
yarn dlx rn-new@next --nativewind
```
  </Tab>
  <Tab value="pnpm">
```bash
pnpx rn-new@next --nativewind
```
  </Tab>
  <Tab value="bun">
```bash
bunx rn-new@next --nativewind
```
  </Tab>
</Tabs>

</Callout>

## Installation with Expo

### 1. Install Nativewind

<Install framework="expo" />

### 2. Setup Tailwind CSS

<TailwindInstall framework="expo" />

**Add Tailwind to your PostCSS configuration**

Create a `postcss.config.mjs` file in the root of your Expo project if you don't already have one, then add `@tailwindcss/postcss` there, or wherever PostCSS is configured in your project.

```jsx title="postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Create a `global.css` file and add the Tailwind directives.

```css title="global.css"
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";

@import "nativewind/theme";
```

> From here onwards, replace `./global.css` with the relative path to the CSS file you just created.

<Callout type="tip">
  Instead of using the standard `@tailwind`, Nativewind recommends using the
  at-rules above which provide better compatibility with `react-native-web`
</Callout>

### 3. Create or modify your metro.config.js

Run `npx expo customize metro.config.js` to create a `metro.config.js` file if you don't already have one, then wrap the default config with `withNativewind`.

```js title="metro.config.js"
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config);
```

### 4. Import your CSS file

```js title="App.js"
import "./global.css"

export default App() {
  /* Your App */
}
```

<Callout type="warn">
  You should import your CSS file inside the same file as the top-most component of
  your app. Do **not** import it in the same file that calls
  `AppRegistry.registerComponent` or your app will not Fast Refresh properly.
</Callout>

### 5. Override the lightningcss version

Force `lightningcss` to a specific version in your `package.json`:

<Tabs groupId="v5-npm-install" items={["npm", "yarn", "pnpm", "bun"]}>
<Tab value="npm">
`json title="package.json"
    {
      "overrides": {
        "lightningcss": "1.30.1"
      }
    }
    `
</Tab>
<Tab value="yarn">
`json title="package.json"
    {
      "resolutions": {
        "lightningcss": "1.30.1"
      }
    }
    `
</Tab>
<Tab value="pnpm">
`json title="package.json"
    {
      "pnpm": {
        "overrides": {
          "lightningcss": "1.30.1"
        }
      }
    }
    `
</Tab>
<Tab value="bun">
`json title="package.json"
    {
      "overrides": {
        "lightningcss": "1.30.1"
      }
    }
    `
</Tab>
</Tabs>

<Callout type="warn">
  If you don't pin the `lightningcss` version, you may encounter deserialization errors with respect to `global.css` when building your app.
</Callout>

### 6. TypeScript setup (optional)

<include>./\_typescript.mdx</include>

<include>./\_try-it-out.mdx</include>

<include>./\_additional-guides.mdx</include>

Tasks:

1. Configure Tailwind/NativeWind using the correct docs for that version.
2. Add or update:
   - `tailwind.config.js` or equivalent config
   - `global.css`
   - Babel config
   - Metro config
   - TypeScript declaration file for NativeWind
   - root layout CSS imports
3. Ensure className works across React Native components supported by NativeWind.
4. Do not upgrade NativeWind unless I approve it.
5. Do not introduce unrelated UI changes.

Validation:

- Run `npm run lint` if available.
- Run `npm run typecheck` if available.
- Start the app and confirm no NativeWind runtime/config errors.
