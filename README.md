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
and deploy the function and Storage rules with the Firebase CLI:

```bash
npm --prefix functions install
firebase deploy --project cleanmystreetapp --only functions,storage
```

The app sends the signed-in user's Firebase ID token as a bearer token. Set
`EXPO_PUBLIC_API_URL` to the deployed function URL if the function is hosted in
a different project or region. The default is
`https://us-central1-cleanmystreetapp.cloudfunctions.net/api`.

| Endpoint | JSON body | Firestore destination |
| --- | --- | --- |
| `POST /reports` | `{ "reportId": "...", "description": "...", "wasteType": "Illegal Dumping", "latitude": -29.86, "longitude": 31.01, "imageUrl": "https://...", "imagePath": "reports/{userId}/{reportId}.jpg" }` | `reports/{reportId}` |
| `POST /community/posts` | `{ "body": "...", "category": "Cleanup" }` | `communityPosts/{postId}` |
| `POST /campaigns/{campaignId}/contributions` | `{ "amount": 100 }` | `campaigns/{campaignId}/contributions/{contributionId}` |

Report submission requires a description, supported waste type, GPS coordinates,
and a photo URL/path. The app uploads report photos to
`reports/{reporterId}/{reportId}.jpg` in Firebase Storage before creating the
Firestore document. Firestore report documents include `description`,
`wasteType`, `location` (`latitude` and `longitude`), `imageUrl`, `imagePath`,
`reporterId`, `status` (`pending_verification`), `createdAt`, and `updatedAt`.
Community categories are `Cleanup`, `Tips`, or `Question`. Contributions are
recorded as whole-ZAR pledges only; this endpoint does not process payments or
store payment details. Requests require authentication and return `400` for
invalid input, `401` when unauthenticated, and `404` when the campaign does not
exist.

The featured campaign screen submits pledges for the Firestore document
`campaigns/musgrave-road-cleanup`; create that document before using the
contribution form. The report flow requires camera and foreground-location
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
