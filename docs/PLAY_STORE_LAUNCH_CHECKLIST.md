# Google Play Launch Checklist

Last updated: 8 March 2026

## 1. Build Integrity

- [ ] Install required toolchains:
  - Node.js 20+
  - Java 17+
  - Android SDK + build tools
- [ ] Run web production build:
  - `npm run build`
- [ ] Sync Capacitor assets into Android project:
  - `npx cap sync android`
- [ ] Produce release AAB:
  - `cd android && ./gradlew bundleRelease`
- [ ] Verify release artifact exists:
  - `android/app/build/outputs/bundle/release/app-release.aab`

## 2. Versioning

- [ ] Set unique versionCode for every upload.
- [ ] Set versionName for human-readable release tracking.
- [ ] Use Gradle overrides for CI:
  - `-PAPP_VERSION_CODE=<int>`
  - `-PAPP_VERSION_NAME=<string>`

## 3. Policy + Legal

- [ ] Confirm in-app privacy policy route works:
  - `/privacy`
- [ ] Set Play Console privacy policy URL to the deployed policy page.
- [ ] Complete Data Safety form with behavior matching the app implementation.
- [ ] Complete App Content and Content Rating sections.
- [ ] Confirm permissions declared are minimal and justified.

## 4. Listing Assets

- [ ] App icon
- [ ] Feature graphic
- [ ] Phone screenshots
- [ ] Short description
- [ ] Full description
- [ ] Category and contact details

## 5. Testing + Rollout

- [ ] Upload to Internal testing first.
- [ ] Validate install, launch, navigation, and core learning flows.
- [ ] Validate WebView-specific behavior:
  - keyboard interactions in SQL practice
  - orientation/resize handling
  - offline/poor network behavior
- [ ] Check Android Vitals after testing.
- [ ] Move to Closed/Open testing as needed.
- [ ] Use staged rollout for Production.

## 6. Personal Account Gate (if applicable)

- [ ] If this Play Console account is a personal account created after 13 Nov 2023:
  - meet current production-access testing requirements before applying for production.

