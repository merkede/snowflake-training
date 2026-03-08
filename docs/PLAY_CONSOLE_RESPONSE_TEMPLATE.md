# Play Console Response Template

Last updated: 8 March 2026

Use this as a draft when completing Play Console forms. Update responses if app behavior changes.

## 1) App Access

- App requires login: **No**
- All functionality accessible without credentials: **Yes**

## 2) Ads

- App contains ads: **No** (confirm before submission)

## 3) Data Safety (Draft Mapping)

Base this on current implementation in the repository:

- Stored locally on device:
  - study progress
  - flashcard state/streak
  - exam history
  - certificate name input
  - theme preferences
- No server-side account registration flow present in app code.
- No ad SDK / analytics SDK present in dependencies.

Draft answers (verify in console wording at submission time):

- Do you collect or share any required user data types?  
  - **No**, for server-side collection/sharing flows currently implemented.
- Is data processed ephemerally?  
  - **N/A** unless new network processing is added.
- Is all user data encrypted in transit?  
  - App uses HTTPS scheme in Capacitor config; verify all production endpoints remain HTTPS.
- Is data deletable by user?  
  - Local data can be cleared via app/browser storage reset or uninstall.

If you add analytics/crash tools later (Firebase, Sentry, etc.), you must update Data Safety answers before release.

## 4) Privacy Policy URL

- Set Play Console privacy policy URL to your deployed page:
  - `https://<your-domain>/privacy`

Do not submit with a placeholder/non-public URL.

## 5) Content Rating

- Complete questionnaire based on educational content.
- Verify final rating is appropriate for your target audience.

## 6) Permissions

Current manifest permission set:

- `android.permission.INTERNET`

If any new sensitive permissions are added later, check whether a declaration form is required before release.

## 7) Testing Track Strategy

- Internal testing first
- Closed testing next (especially important for new personal accounts)
- Production with staged rollout

