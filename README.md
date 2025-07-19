# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install![splash-icon.png](../../Downloads/splash-icon.png)
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Problems with local emulator when Expo build goes expired

As per chat GPT:

This issue stems from how Expo and Expo Go manage build credentials and runtime permissions, especially regarding web socket connections and build expiration. Here's what's likely happening:

✅ What's Happening:
When you test your React Native app locally in an Android emulator with Expo Go and a build that has expired on the Expo Application Services (EAS) server, the expired state prevents certain services and modules—like WebSockets—from functioning. Here's why:

🔍 Technical Reasons:
Expo Go + Dev Server Compatibility:

Expo Go uses a runtime environment managed by Expo, and it enforces certain checks—especially when the app is linked to a specific build ID or profile.

When that build has expired (as per EAS policies), Expo disables some network features (including WebSocket communications), which affects:

- Live reload
- Metro bundler connection
- Real-time backend WebSocket usage

EAS Build Expiry Enforcement:

If the expired build was associated with custom EAS credentials or updates, Expo Go may refuse to initialize fully, or it may restrict web socket access (used for hot reloading, logs, or your app’s WebSocket logic).

Expo Dev Client vs Expo Go:

If you are using a custom Expo Dev Client, and the underlying EAS build expires, the client may no longer be able to verify or handshake properly with the dev server (Metro), and WebSocket communication may silently fail.

You may see connection attempts in logs like:

`Failed to connect to WebSocket server at ws://localhost:19000
or no logs at all.`

Network Restrictions from Expo:

Expo may block outbound WebSocket connections when running under an expired build profile due to security or consistency constraints.

✅ Fixes and Workarounds:
1. Rebuild the Dev Client (EAS Dev Build):
   Run:

```bash
eas build --profile development --platform android
```

Then reinstall the new client on your emulator.

2. Switch to Using expo start --dev-client with Fresh Dev Client:
   Make sure you launch your dev server like this:

```bash
expo start --dev-client
```

This ensures it's serving the bundle with proper WebSocket access.

3. Use Bare Expo Go (if you don’t need custom native code):
   If you're not using custom native modules, use plain Expo Go instead of Dev Client builds. It avoids the EAS build expiration problem entirely.

4. Ensure Emulator Network Config is Correct:
   WebSockets require emulator to resolve localhost to your host machine. On Android, use:

```cpp
ws://10.0.2.2:19000
```

instead of localhost.

🧪 Debugging Tips:
Run adb logcat to see if any WebSocket errors or expo-updates module errors appear.

Confirm the dev server is reachable from the emulator: open browser in emulator and go to http://10.0.2.2:19000.

Summary:
Your app’s inability to open WebSocket connections is a side effect of the expired EAS build. The best solution is to rebuild your dev client or use Expo Go without an expired EAS build link. Expo's runtime enforces expiration and disables features like WebSockets to ensure consistency and version control across deployments.

Let me know your setup (expo-dev-client? eas.json configs?) and I can give a more tailored fix.