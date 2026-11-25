# twig-mobile-base

Starter template for TaxonWorks mobile apps (Expo SDK 58, React Native 0.88, TypeScript, Expo Router).

A new app made from it already:

- shows the TaxonWorks splash, a home screen and Settings, in light and dark themes;
- stores the home server (Settings → Home server) and checks it with `/api/v1/ping`;
- opens a session by scanning the QR code shown by a TaxonWorks Task (task_token), kept in memory only;
- has a full-screen camera (zoom, tap to focus, crop to preview) and an on-device QR/barcode reader;
- has SQLite with ordered migrations, persisted settings, toasts, bottom sheets and haptics.

It is a **template**: copy it to start an app, then the app owns its copy. Nothing is imported from
this repository at runtime.

## Requirements

- Node.js 26 (`.nvmrc`), the version CI uses.
- Android: the Android SDK and a JDK.
- iOS: macOS with Xcode, and `bundle install` once. The `Gemfile` pins CocoaPods (and a `json` gem
  that keeps `pod install` working); `npx expo run:ios` uses it through `bundle exec pod` once it is
  installed, and falls back to the global `pod` otherwise.

## Start a new app

1. Copy the template (without its history):

   ```bash
   git clone --depth 1 <this repo> my-app && cd my-app && rm -rf .git && git init
   npm install
   ```

2. Name the app. `expo.name` in `app.json` is the name under the app icon, also shown at the bottom
   of Settings, and can change at any time. The rest must be unique per app and **must not change
   after the first release**:

   | Where           | What                                                                            |
   | --------------- | ------------------------------------------------------------------------------- |
   | `package.json`  | `name`                                                                          |
   | `app.json`      | `expo.slug`, `expo.scheme`, `expo.ios.bundleIdentifier`, `expo.android.package` |
   | `src/config.ts` | `databaseName` (SQLite file)                                                    |

3. Point it at its TaxonWorks Task in `src/config.ts`: `taskName` (the Task's name in the
   TaxonWorks Tasks menu, used in messages such as "Open … and scan its QR code").
4. Adjust the camera permission text in `app.json` (`NSCameraUsageDescription`) if the app also takes
   photos, and add any other permission it needs there.
5. Replace the icons in `assets/` if the app has its own (the TaxonWorks logos in `assets/images/logo`
   are shared by every app).
6. Run it in a development build (the app has native modules, so Expo Go is not enough):

   ```bash
   npm run android     # or: npm run ios (macOS only)
   npm start           # then, for later JS-only changes
   ```

## Structure

```
src/
  config.ts            what makes this app itself (name, task, database file)
  db/                  the app's SQLite database
    client.ts          getDatabase(): opens and migrates it on first use
    migrations.ts      its schema, one SQL string per change
    openDatabase.ts    applies the migrations in order (PRAGMA user_version)
  app/                 routes (Expo Router): every file is a screen, _layout.tsx the navigator
    index.tsx          home: replace its content with the app's features
    settings.tsx       Settings: add the app's sections as children
    connect.tsx        QR code scanner that opens the session
  features/
    auth/              task QR → activation → in-memory session; ConnectScreen, SessionSection
    settings/          persisted preferences (zustand + expo-sqlite kv-store), Home server section
  shared/
    api/               TaxonWorksClient (/api/v1), TaskTokenClient (task_token endpoints), typed errors
    components/        theme, Icon, Section/Row, IconButton, Toast, BottomSheet, ScreenError, splash,
                       header logo
    device/            the phone's hardware and OS: camera/ (VisionCamera preview, permission, zoom,
                       crop, rotation), haptics, files; add others here (e.g. location/)
    utils/             pure helpers used across features (e.g. messageOf for error messages)
modules/
  code-reader/         local Expo module: reads QR codes and barcodes from a photo (ML Kit / Vision)
```

Every feature follows the same layout, so anything is easy to find:

```
features/<name>/
  index.ts        public API: the only file other code imports
  types.ts        the feature's types
  store.ts        its state (zustand), if any
  components/     UI pieces
  screens/        whole screens
  hooks/          React hooks
  utils/          pure functions: data in, data out (rules, formatting, parsing)
  data/           storage on the device (SQLite, files)
  services/       everything with side effects: TaxonWorks, native modules, multi-step processes
  __tests__/
```

Only `index.ts`, `types.ts` and `store.ts` live at the root of a feature; a folder exists only when the
feature has something for it. To place a function, ask whether it has side effects: none → `utils/`,
device storage → `data/`, anything else → `services/`.

Modules in `shared/` follow the same layout when they mix kinds of files (e.g. `device/camera/`:
components, a hook, pure helpers, a service); a folder of one kind (`components/`, `api/`, `utils/`)
stays flat.

Dependencies go one way, `app → features → shared`, and ESLint enforces it:

- a feature, `shared/api` and `shared/device/camera` are imported only through their `index.ts`
  (`@/features/auth`, `@/shared/api`, never `@/features/auth/…`);
- `shared/` never imports a feature, a route, the database schema or the app config.

## Building the app's features

- **A feature:** add `src/features/<name>/` with the layout above and an `index.ts` that exports its
  public API, and use it from the routes. Keep non-route code out of `src/app/`.
- **A screen:** add a file in `src/app/` and, if it needs options, a `Stack.Screen` in `_layout.tsx`.
  End it with `export { ScreenError as ErrorBoundary } from '@/shared/components'`, so a crash while
  rendering shows an error with "Try again" instead of closing the app.
- **Settings:** add fields to `Settings` and `DEFAULT_SETTINGS` (`features/settings/types.ts`), and
  pass the app's sections as children of `SettingsScreen` in `src/app/settings.tsx`. Never store
  tokens there.
- **Local data:** append one SQL string per schema change to `MIGRATIONS` in `src/db/migrations.ts`
  (the template has none), and query with `getDatabase()` from `@/db/client`. The database is opened and
  migrated on first use. Never edit or remove a migration once released.
- **Icons:** add them to `ICONS` in `shared/components/Icon.tsx` (an SF Symbol and a Material Symbol each).
- **Talking to the Task:** with the session from `useSession()` / `getSession()`, create a
  `TaskTokenClient({ endpointUrl: session.endpointUrl, ids: session })` and call
  `post(session.token, body)` with a JSON object or a `FormData` (files). The ids the token requires
  are added for you. Errors are `TaskTokenRejectedError` (token expired or refused: end the session
  and ask for a new QR code), `HttpError` and `NetworkError`.
- **Only some QR codes:** if the app's Task binds its tokens to something, e.g. a composition, pass
  `accept` to `ConnectScreen` in `src/app/connect.tsx`:
  `<ConnectScreen accept={(qr) => qr.compositionId != null} />`.

The session lasts as long as the Task's token (set by TaxonWorks) and is lost when the app is closed;
the user scans a new QR code then.

## Commands

```bash
npm run check                 # typecheck + lint + tests
npm run format                # prettier
npx expo install <package>    # add a dependency (SDK-compatible version)
npx expo-doctor               # dependency and config checks
npm run prebuild              # regenerate android/ and ios/ from scratch (expo prebuild --clean)
npm run build:apk             # Android release APK for devices → build/app-device.apk
npm run build:apk:emulator    # Android release APK for an x86_64 emulator → build/app-emulator.apk
```

`android/` and `ios/` are generated by `expo prebuild` (Continuous Native Generation) and are not
committed: configure native behavior in `app.json` and config plugins. The APK scripts need the
Android SDK and a JDK, and sign with the debug key: set up a release signing key before publishing.
iOS builds need macOS (`npm run ios`). Builds are local: no EAS or other cloud services.

CI (`.github/workflows/check.yml`, GitHub Actions) runs `npm run check`, Prettier and `expo-doctor` on
every pull request and on main.

See `AGENTS.md` for the conventions coding agents should follow.

## Emulators and simulators

The session starts by scanning a QR code with the camera, so where the camera works decides what can
be tested:

| Where            | Camera                                     | Scan the session QR code |
| ---------------- | ------------------------------------------ | ------------------------ |
| Android emulator | virtual: a 3D scene or the computer webcam | yes, through the webcam  |
| iOS Simulator    | none ("No camera available")               | no: use a real iPhone    |
| Real phone       | yes                                        | yes                      |

### Android emulator

- Create one in Android Studio: Device Manager → create a virtual device with a recent system image.
- To scan with it, open Device Manager → Edit → Advanced settings and set the back camera to
  **Webcam0** (the computer's webcam), then show the webcam the QR code (on another screen or on
  paper). **VirtualScene** is a 3D room, only useful to check that the camera opens.
- `npm run android` installs a development build on the running emulator, built for its architecture
  (`npx expo run:android --device` to choose between the emulator and a connected phone).
- Release APKs are built for ARM only (`buildArchs` in `app.json`): `build:apk` runs on phones and on
  ARM emulators (Apple Silicon Macs); `build:apk:emulator` builds x86_64, for emulators on Intel/AMD
  computers. Install one with `adb install -r build/app-emulator.apk`.

### iOS Simulator and iPhone

- `npm run ios` opens the app in a simulator; `npx expo run:ios --device` lists the simulators and the
  connected iPhones to choose one.
- The simulator has no camera, so the camera screen shows "No camera available". The code reader
  itself works there (it switches to a Vision revision that runs on the CPU), so everything except the
  camera can be tested.
- A real iPhone needs a signing team: set `ios.appleTeamId` in `app.json` (a free Apple ID's personal
  team works for development; Xcode shows its ID). Choosing the team in Xcode also works, but
  `npm run prebuild` (`--clean`) discards it.

## Keeping apps up to date

Apps are copies, so a fix made here does not reach them on its own. Files under `src/shared/`,
`src/features/auth/`, `src/db/` (except `migrations.ts`) and `modules/code-reader/` are meant to stay
identical to the template's (except the ones an app extends: `shared/components/Icon.tsx` and
`shared/components/index.ts`): port fixes to them both ways with a plain diff.
