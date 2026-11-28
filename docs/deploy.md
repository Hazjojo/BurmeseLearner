# Getting it on your phone (one-time setup)

## Quickest: GitHub Pages (1 click, no accounts)

The app works fully on its own: progress and recordings are stored on the phone. To publish it:

1. In the GitHub repo: **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.
2. Re-run the *GitHub Pages* workflow (*Actions* tab → GitHub Pages → *Run workflow*), or push any change.
3. Open **https://hazjojo.github.io/BurmeseLearner/** on your phone and add it to the home screen. It works offline.

Use *Settings → Export backup* now and then: without cloud sync, the phone is the only copy. Firebase (below) adds sync and cloud backup later. Progress doesn't move between the two addresses automatically, but export → import carries it over.

---

## Firebase (adds cloud sync)


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
3. Let the deploy key update security rules: Google Cloud console → *IAM* → edit the `firebase-adminsdk-…@<project-id>.iam.gserviceaccount.com` principal → add the roles **Firebase Rules Admin** and **Service Usage Consumer**.
4. Push or re-run CI so the rules deploy, then in the app: *Settings → Cloud sync → Sign in with Google*.

## 3. Syncing recordings (Blaze plan, pennies per month)

Cloud Storage now requires the pay-as-you-go **Blaze** plan. At one user's scale this should cost essentially nothing.

1. Firebase console → *Upgrade* → Blaze. Then Google Cloud console → *Billing* → *Budgets & alerts* → create a **$5 budget alert**.
2. *Build* → **Storage** → *Get started* (production mode, same region).
3. Re-run CI to deploy `storage.rules` (owner-only, audio files under 5 MB).

Recordings then upload automatically and appear on every device you sign in on.

## Testing sync locally

`npm run test:sync` runs the sync integration test against the Firebase emulators (needs Java).


## 4. Speaking features (speech checking & AI conversation)

A small server function (`functions/`) checks your spoken Burmese with Azure speech recognition and runs the conversation partner with Gemini on this Google Cloud project. One-time setup:

1. **Azure key → GitHub.** Repo *Settings → Secrets and variables → Actions → New repository secret*: name `AZURE_SPEECH_KEY`, value = *KEY 1* from the Azure Speech resource (*Keys and Endpoint*).
2. **Let the deploy key deploy functions.** Google Cloud console → *IAM* → edit the `firebase-adminsdk-…` principal → add roles: **Editor**, **Cloud Functions Admin**, **Cloud Run Admin**, **Secret Manager Admin**, **Service Account User**.
3. Push or re-run CI. The *Deploy server functions* step enables the needed APIs, stores the Azure key in Secret Manager and deploys.
4. If conversation replies fail with a permission error: IAM → the *Default compute service account* (`<number>-compute@developer.gserviceaccount.com`) → add **Vertex AI User**.

Costs at one learner's scale: Azure speech recognition free tier (5 audio hours/month), Gemini Flash a few pence per hour of conversation, Cloud Functions free tier. The function caps usage at 400 calls/day and only answers the first account that uses it (yours).

## 5. Daily reminder notifications

1. Firebase console → ⚙ **Project settings → Cloud Messaging → Web Push certificates → Generate key pair**. Copy the **key pair** string (it's a public key, safe to share).
2. GitHub repo → *Settings → Secrets and variables → Actions → **Variables*** → new variable `FIREBASE_VAPID_KEY` = that string.
3. Push or re-run CI. Then in the app: *Settings → Daily reminder → Turn on*, and allow notifications. On iPhone this only works from the Home Screen app.

A scheduled function (`sendReminders`, every 15 minutes) sends the reminder at your chosen time, and skips it if you've already practised that day.
