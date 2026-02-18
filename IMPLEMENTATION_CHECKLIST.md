# Implementation Checklist - Android Personalized Onboarding

## Pre-Integration Setup

- [ ] Review `ONBOARDING_QUICK_START.md` (5 min read)
- [ ] Review `ANDROID_ONBOARDING_GUIDE.md` (10 min read)
- [ ] Verify Supabase project is active
- [ ] Confirm backend server is running
- [ ] Test backend health endpoint: `GET /health`

## Database Setup

- [ ] Create Supabase tables using migration:
  ```sql
  SELECT * FROM mcp__supabase__list_tables();
  ```
- [ ] Verify 3 new tables exist:
  - [ ] trader_profiles
  - [ ] onboarding_responses
  - [ ] trader_settings
- [ ] Verify RLS is enabled on all 3 tables
- [ ] Verify policies are in place for all 3 tables
- [ ] Test database connection from app

## Mobile App Integration

### Step 1: Import Components
- [ ] Import `useOnboardingFlow` hook
- [ ] Import `TraderOnboardingScreen` component
- [ ] Import `SplashScreenWithOnboarding` (optional)

### Step 2: Update Authentication Flow
- [ ] Add onboarding check after login
- [ ] Show `TraderOnboardingScreen` if not completed
- [ ] Call `useOnboardingFlow.completeOnboardingAndSave()` on finish

### Step 3: Apply Settings
- [ ] Load trader settings from Supabase
- [ ] Apply risk per trade percentage
- [ ] Apply position sizing
- [ ] Enable/disable features based on settings
- [ ] Set AI aggressiveness level

### Step 4: Test Locally
- [ ] Run app on Android emulator
- [ ] Complete full onboarding flow
- [ ] Verify all 15 questions display correctly
- [ ] Test multi-select questions (4, 9, 11)
- [ ] Test single-select questions (1, 2, 3, 5, 6, 7, 8, 10, 12, 13, 14, 15)

## Backend Integration

- [ ] Verify `onboarding.js` route file exists
- [ ] Verify `server.js` includes onboarding routes
- [ ] Test POST `/api/onboarding/save`
- [ ] Test GET `/api/onboarding/status/:userId`
- [ ] Test PUT `/api/onboarding/update-settings/:userId`
- [ ] Test POST `/api/onboarding/recommendations`

## Android Configuration

- [ ] Verify `AndroidManifest.xml` updated with:
  - [ ] INTERNET permission
  - [ ] ACCESS_NETWORK_STATE permission
  - [ ] POST_NOTIFICATIONS permission
  - [ ] VIBRATE permission

## Feature Validation

### Welcome Screen
- [ ] Text displays correctly
- [ ] Benefits show with icons
- [ ] Time estimate shown (3-5 minutes)
- [ ] "Start Personalization" button works
- [ ] "Skip for Now" button works

### Question Screens
- [ ] Progress bar displays and updates
- [ ] Percentage shown correctly
- [ ] Question title clear
- [ ] Subtitle/description provided
- [ ] All options selectable
- [ ] Previous button appears (except Q1)
- [ ] Next button only enabled with answer
- [ ] Animations smooth (60 FPS)

### Completion Screen
- [ ] Celebration animation plays
- [ ] Trader profile badge displays
- [ ] Personalized message shows
- [ ] 5 recommendations displayed
- [ ] Feature badges show correctly
- [ ] Next steps listed
- [ ] "Begin Trading" button works

### Data Persistence
- [ ] Start onboarding
- [ ] Complete Q1-Q7
- [ ] Close app
- [ ] Reopen app
- [ ] Verify resumes at Q8
- [ ] Complete remaining questions
- [ ] Verify data saved to Supabase

## Database Verification

### Verify Trader Profile Saved
```sql
SELECT * FROM trader_profiles
WHERE user_id = 'YOUR_USER_ID';
```
Expected: Row with 15 response fields

### Verify Onboarding Responses Saved
```sql
SELECT * FROM onboarding_responses
WHERE user_id = 'YOUR_USER_ID';
```
Expected: Row with detailed breakdown

### Verify Trader Settings Generated
```sql
SELECT * FROM trader_settings
WHERE user_id = 'YOUR_USER_ID';
```
Expected: Row with recommendations

## Performance Testing

- [ ] Measure onboarding completion time (target: 3-5 min)
- [ ] Monitor UI frame rate (target: 60 FPS)
- [ ] Profile database queries (target: <100ms)
- [ ] Check Supabase sync (target: <500ms)
- [ ] Test on low-end device (Android 8.0)
- [ ] Test on high-end device (Android 14+)

## Error Handling

- [ ] Test without internet connection
- [ ] Test with invalid auth token
- [ ] Test with Supabase down
- [ ] Test with incomplete responses
- [ ] Verify error messages display correctly
- [ ] Verify app recovers gracefully

## Security Testing

- [ ] Verify user can't access other users' data
- [ ] Verify JWT token required for API
- [ ] Verify RLS policies enforced
- [ ] Test with expired session
- [ ] Verify no secrets in logs

## Multi-Device Sync

- [ ] Complete onboarding on Android
- [ ] Verify data in Supabase
- [ ] Open app on another Android device
- [ ] Verify settings sync correctly
- [ ] Test update from second device
- [ ] Verify changes sync back

## UI/UX Testing

- [ ] Test on portrait orientation
- [ ] Test on landscape orientation
- [ ] Test with keyboard open
- [ ] Test with keyboard closed
- [ ] Verify touch targets are 48dp+
- [ ] Test with large text setting
- [ ] Test with dark mode
- [ ] Test accessibility features

## Integration Testing

### Test Onboarding → Home Screen
- [ ] Complete onboarding
- [ ] Verify settings applied to home
- [ ] Verify recommendations displayed
- [ ] Verify features enabled/disabled

### Test Onboarding → Trading
- [ ] Complete onboarding
- [ ] Navigate to trading
- [ ] Verify position sizing applied
- [ ] Verify risk limits applied
- [ ] Verify Auto BE works (if enabled)

### Test Onboarding → Settings
- [ ] Complete onboarding
- [ ] Go to settings
- [ ] Verify all settings available
- [ ] Verify can update settings
- [ ] Verify changes persist

## Backend Integration Testing

- [ ] API returns correct recommendations
- [ ] API correctly calculates risk
- [ ] API correctly maps features
- [ ] API saves data correctly
- [ ] API retrieves data correctly

## Localization Testing (if applicable)

- [ ] All text translatable
- [ ] No hardcoded strings in UI
- [ ] Date formatting works in locale
- [ ] Numbers formatted in locale
- [ ] Currency symbols correct

## Analytics Integration (if applicable)

- [ ] Track onboarding started
- [ ] Track each question completed
- [ ] Track onboarding finished
- [ ] Track skipped
- [ ] Track completion time

## Documentation Review

- [ ] `ONBOARDING_QUICK_START.md` complete
- [ ] `ANDROID_ONBOARDING_GUIDE.md` complete
- [ ] `ANDROID_ONBOARDING_SUMMARY.md` complete
- [ ] Code comments sufficient
- [ ] Function docstrings added
- [ ] README updated with onboarding info

## Deployment Preparation

- [ ] Code reviewed by team
- [ ] No console warnings/errors
- [ ] No TypeScript errors
- [ ] No linter warnings
- [ ] Git commits ready
- [ ] Release notes prepared
- [ ] Update app version
- [ ] Prepare play store listing

## Final Checks

- [ ] Fresh install from APK works
- [ ] Onboarding completes without errors
- [ ] Settings applied correctly
- [ ] No data loss on app crash
- [ ] Performance acceptable
- [ ] Battery drain minimal
- [ ] No memory leaks
- [ ] No permission issues

## Post-Launch

- [ ] Monitor error logs
- [ ] Track completion rate
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Plan iteration based on usage
- [ ] Document learned lessons

---

## Checklist Summary

**Total Items**: 150+

**Estimated Time to Complete**:
- Setup: 30 minutes
- Integration: 1-2 hours
- Testing: 2-3 hours
- **Total: 4-6 hours**

**Sign-off**:
- [ ] Code Complete
- [ ] Testing Complete
- [ ] Documentation Complete
- [ ] Ready for Production

---

**Status**: Ready for implementation team to proceed
