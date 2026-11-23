# Welcome to your CleanMyStreet_Client app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Firebase write API

The Firebase Cloud Function in `functions/` exposes authenticated POST endpoints.
Enable Firestore and Firebase Storage for the `cleanmystreetapp` Firebase project
and deploy the functions and database/storage rules with the Firebase CLI:

```bash
npm --prefix functions install
firebase deploy --project cleanmystreetapp --only functions,storage,firestore:rules
```

The app sends the signed-in user's Firebase ID token as a bearer token. Set
`EXPO_PUBLIC_API_URL` to the deployed function URL if the function is hosted in
a different project or region. The default is
`https://us-central1-cleanmystreetapp.cloudfunctions.net/api`.

| Endpoint | JSON body | Firestore destination |
| --- | --- | --- |
| `POST /reports` | `{ "reportId": "...", "description": "...", "wasteType": "Illegal Dumping", "latitude": -29.86, "longitude": 31.01, "imageUrl": "https://...", "imagePath": "reports/{userId}/{reportId}.jpg" }` | `reports/{reportId}` |
| `POST /community/posts` | `{ "body": "...", "category": "Cleanup" }` | `communityPosts/{postId}` |
| `POST /community/posts/{postId}/likes` | none (toggles the user's like) | `communityPosts/{postId}/likes/{userId}`, `users/{userId}/likedPosts/{postId}` |
| `POST /community/posts/{postId}/comments` | `{ "body": "..." }` | `communityPosts/{postId}/comments/{commentId}` |
| `POST /campaigns/{campaignId}/contributions` | `{ "amount": 100 }` | `campaigns/{campaignId}/contributions/{contributionId}` |

Report submission requires a description, supported waste type, GPS coordinates,
and a photo URL/path; `siteName` is optional. Each new report also creates a
campaign at `campaigns/{reportId}` with status `funding` and a R5,000 goal, so
the site appears on Home ready for pledges. Pledges are also copied to
`users/{userId}/contributions` for the My Activity screen. The app uploads report photos to
`reports/{reporterId}/{reportId}.jpg` in Firebase Storage before creating the
Firestore document. Firestore report documents include `description`,
`wasteType`, `location` (`latitude` and `longitude`), `imageUrl`, `imagePath`,
`reporterId`, `status` (`pending_verification`), `createdAt`, and `updatedAt`.
Community categories are `Cleanup`, `Tips`, or `Question`. Contributions are
recorded as whole-ZAR pledges; this endpoint does not process payments or
store payment details (see Ozow payments below for paying now). Requests require authentication and return `400` for
invalid input, `401` when unauthenticated, and `404` when the campaign does not
exist.

The featured campaign screen submits pledges for the Firestore document
`campaigns/musgrave-road-cleanup`; create that document before using the
contribution form by running `npm --prefix functions run seed` with Admin
credentials (`gcloud auth application-default login` or
`GOOGLE_APPLICATION_CREDENTIALS`). It skips the campaign document if it already
exists.

News articles are read from the `newsArticles` collection, newest
`publishedAt` first. Each document needs `title`, `story`, `category` (`Most
Popular`, `Recent News`, `Recycling` or `Sites`) and a `publishedAt` timestamp;
`imageUrl` or `imagePath` is optional. `imageUrl` can be a direct HTTP(S) URL;
Storage paths in either field are resolved to download URLs by the app. Add or
edit articles in the Firebase console.

The News And Sites screen also searches within 25 km of the device location for
landfills, recycling centres, waste disposal sites and transfer stations. It
uses OpenStreetMap data through the public Overpass API and, when configured,
Google Places for landfill and recycling-centre listings. OpenStreetMap
contributors are credited in the facility section; tapping a result opens its
map location. Location permission is required for these searches.

OpenStreetMap search works without an API key. To enable Google Places, set
`GOOGLE_PLACES_API_KEY` in the local environment to a key with Places API (New)
enabled, then rebuild/restart the app so the Expo config is refreshed. The
existing `GOOGLE_MAPS_DEMO_KEY` can also be used as a fallback for both
Google Maps and Places, while `GOOGLE_MAPS_API_KEY` configures the native map
and is a fallback for Places. These are client-side keys; use a dedicated,
API-restricted key with billing and quota limits, and do not commit real keys.

In-app notifications live in `users/{userId}/notifications`. The API writes one
when a report is submitted and when a pledge is recorded; users can only change
a notification's `read` field.

The app uses local notifications only (`expo-notifications`); there are no push
tokens or server-sent pushes. Both settings are off until the user turns them
on and grants permission:

- **Report and campaign alerts** show a device notification when a new entry
  appears in `users/{userId}/notifications`. They only fire while the app is
  open or recently backgrounded, because nothing wakes a closed app.
- **Cleanup reminders** schedule a weekly notification for Saturday 08:00. Direct messages in Community are hidden until
conversations have a backend. The report flow requires camera and foreground-location
permissions. Its Firebase Storage rules allow signed-in users to upload images
under their own report folder, and allow signed-in users to read report photos.
The report-location map is interactive on iOS and Android: it centers on the
device location, and users can tap the map or drag the marker to fine-tune the
dumping-site position. For Android development/production builds, set
`GOOGLE_MAPS_API_KEY` to a key with Maps SDK for Android enabled before running
Expo prebuild or creating a native build, then rebuild the app. The web version
uses the location fallback because `react-native-maps` does not support web.

The authenticated API helpers are exported from `src/services/api.ts`. The
report workflow, including photo upload and submission, is coordinated by
`src/services/reportService.ts`; community posts and contributions use the API
helpers directly.

User settings and privacy preferences are stored in the signed-in user's
`users/{userId}.preferences` map. Saved sites and campaigns are stored in
`users/{userId}/savedItems/{type}_{itemId}`. Deploy `firestore.rules` before
using those features; the rules restrict profile and saved-item access to the
owning authenticated user.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Ozow payments

Campaigns accept real payments through [Ozow](https://ozow.com) instant EFT,
next to the existing "pledge to pay later" option. On the campaign screen the
user picks **Pay now with Ozow**, the API creates a payment and returns a
checkout link, and the user pays in their bank app. The web app does a
full-page redirect to Ozow. iOS and Android open it with
`WebBrowser.openAuthSessionAsync`. Ozow then sends the user back to
`/paymentresult`, which follows the payment live from Firestore.

| Endpoint | Auth | Purpose |
| --- | --- | --- |
| `POST /campaigns/{campaignId}/payments` | ID token | `{ "amount": 100, "returnUrl": "cleanmystreet://paymentresult" }` creates `payments/{paymentId}` (status `pending`) and returns `checkoutUrl`. |
| `GET /payments/ozow/{paymentId}/checkout?token=…` | one-time token (30 min) | Auto-posts the SHA512-signed request to `https://pay.ozow.com`. |
| `GET/POST /payments/ozow/return` | none | Ozow's Success/Cancel/Error URL. Checks the status with Ozow's `GetTransactionByReference` API, then redirects to the payment's `returnUrl`. |
| `POST /payments/ozow/notify` | Ozow hash | Ozow's NotifyUrl. Verifies the SHA512 hash, site code and amount. |
| `POST /payments/{paymentId}/verify` | ID token | Asks Ozow for a pending payment's status again. |

A redirect alone never marks a payment as paid. A payment is settled only by a
verified notification or by Ozow's status API. Once complete, a payment is
recorded once: the API adds it to the campaign's `pledgedAmount`,
`pledgeCount` and `paidAmount`, writes `campaigns/{id}/contributions/{paymentId}`
and `users/{uid}/contributions/{paymentId}` with status `paid`, and sends an
in-app notification. If the amount doesn't match, the payment is flagged
`needsReview` and not counted. Users can read only their own `payments` documents.


## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
