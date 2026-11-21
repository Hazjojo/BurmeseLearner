# Getting it on your phone (one-time setup, ~10 minutes)

Every push to `main` is automatically built and tested by GitHub Actions. To also **deploy** it to Firebase Hosting:

1. **Create a Firebase project.** Go to https://console.firebase.google.com → *Add project* (e.g. `burmeselearner`). Google Analytics isn't needed. Note the **project ID**.
2. **Create a deploy key.** In the Firebase console: ⚙ *Project settings* → *Service accounts* → *Generate new private key*. This downloads a JSON file. Treat it like a password.
3. **Give GitHub the key and project ID.** In the GitHub repo: *Settings* → *Secrets and variables* → *Actions*:
   - *Secrets* tab → *New repository secret*: name `FIREBASE_SERVICE_ACCOUNT`, value = the whole JSON file's contents.
   - *Variables* tab → *New repository variable*: name `FIREBASE_PROJECT_ID`, value = your project ID.
4. **Deploy.** Re-run the latest CI workflow (*Actions* tab), or push any change. The app is then live at `https://<project-id>.web.app`.
5. **Install on your phone.** Open that URL. Android (Chrome): ⋮ → *Add to Home screen*. iPhone (Safari): Share → *Add to Home Screen*. It works offline.

## Where data lives (for now)

Progress, review history and recordings are stored **on the device** (IndexedDB). Use *Settings → Export backup* now and then. Cloud sync (Firestore + Storage, locked to your account by `firestore.rules` / `storage.rules`) is the next step and needs the Blaze plan with a budget alert.
