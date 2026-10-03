# DRAFT: review before publishing

# Privacy Policy — GainsLab (IronLog-React)

Last updated: [DATE_TO_COMPLETE]
Privacy contact: [CONTACTO_A_COMPLETAR]

## 1. What data we store

GainsLab stores your training and nutrition data so you can use the app on
multiple devices. When signed in (email and password only), it syncs with
Firebase (Google) under the `users/{your-id}` document:

- Identity: email, uid, last seen (lastSeen).
- Training: active program, active mesocycle, active session, exercise
  library, personal templates, session history (`logs`), recovery feedback
  (rpFeedback).
- Nutrition and body: nutrition logs, cardio sessions, body weight logs,
  custom foods, nutrition goal, macro goals, and user profile (weight,
  height, etc.).
- App: settings (config), per-section sync state (sectionSyncMeta).
- Subscription (`users/{your-id}/data/subscription`): written by an external
  backend; the client only reads it to determine Pro access.

Without an account (local/guest mode), data stays on your device only.

## 2. How we use it

- To show your plan, history, stats, and trends.
- To sync across your devices and restore your data if you switch phones.
- To determine your Pro access from the subscription.

We do not sell your data or use it for advertising.

## 3. Retention

Your data is kept while your account exists. Deleting your account in the app
("You" profile → Account → Delete account) removes your `users/{your-id}`
document, your data documents (`data/*`, including history), and your auth
user. The subscription tied to the account is lost. You can also wipe that
device's data with the matching checkbox.

## 4. Your rights

You can access, correct, export ("You" profile → Data → Export), or delete
your data at any time from the app, or by writing to [CONTACTO_A_COMPLETAR].

## 5. Security

Transfer and storage use Firebase infrastructure with access rules limiting
each document to its owner. No system is 100% secure; if an incident occurs we
will notify you through the available contact channel.
