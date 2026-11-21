# Getting it on your phone (one-time setup)

Every push to `main` is built and tested by GitHub Actions. Once the steps below are done, it is also **deployed** to Firebase.

## 1. Hosting (~10 min, free)

1. **Create a Firebase project.** Go to https://console.firebase.google.com → *Add project* (e.g. `burmeselearner`). Google Analytics isn't needed. Note the **project ID**.
2. **Register a web app.** In the project: ⚙ *Project settings* → *General* → *Your apps* → *Add app* → Web (`</>`). Any nickname; tick **Also set up Firebase Hosting**. Skip the code snippets. The app reads its config automatically from Hosting.
3. **Create a deploy key.** ⚙ *Project settings* → *Service accounts* → *Generate new private key*. This downloads a JSON file. Treat it like a password.
4. **Give GitHub the key and project ID.** In the GitHub repo: *Settings* → *Secrets and variables* → *Actions*:
   - *Secrets* tab → *New repository secret*: name `FIREBASE_SERVICE_ACCOUNT`, value = the whole JSON file's contents.
   - *Variables* tab → *New repository variable*: name `FIREBASE_PROJECT_ID`, value = your project ID.
5. **Deploy.** Re-run the latest CI workflow (*Actions* tab), or push any change. The app is live at `https://<project-id>.web.app`.
6. **Install on your phone.** Open that URL. Android (Chrome): ⋮ → *Add to Home screen*. iPhone (Safari): Share → *Add to Home Screen*. It works offline.

Without the steps below, everything is stored on the phone only (use *Settings → Export backup* now and then).

## 2. Cloud sync for progress (free)

1. Firebase console → *Build* → **Authentication** → *Get started* → *Sign-in method* → enable **Google**.
2. *Build* → **Firestore Database** → *Create database* → choose a European location (e.g. `europe-west2`, London) → start in **production mode**. The security rules in `firestore.rules` are deployed by CI and only let you read your own data.
3. Push or re-run CI so the rules deploy, then in the app: *Settings → Cloud sync → Sign in with Google*.

## 3. Syncing recordings (Blaze plan, pennies per month)

Cloud Storage now requires the pay-as-you-go **Blaze** plan. At one user's scale this should cost essentially nothing.

1. Firebase console → *Upgrade* → Blaze. Then Google Cloud console → *Billing* → *Budgets & alerts* → create a **$5 budget alert**.
2. *Build* → **Storage** → *Get started* (production mode, same region).
3. Re-run CI to deploy `storage.rules` (owner-only, audio files under 5 MB).

Recordings then upload automatically and appear on every device you sign in on.

## Testing sync locally

`npm run test:sync` runs the sync integration test against the Firebase emulators (needs Java).
