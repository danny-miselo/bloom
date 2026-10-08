# Publish Bloom with Netlify

Bloom is prepared for Netlify. Supabase provides authentication and encrypted data storage; it does not host the React website. This setup does not create a deployed URL automatically.

## Git-connected publishing

1. Put this app's repository on GitHub using your app export/GitHub workflow.
2. In Netlify, choose **Add new project → Import an existing project**, then select the repository.
3. Netlify reads `netlify.toml`. The build command is `npm run build` and the publish folder is `dist`; no secret environment variables are required for the browser app.
4. Deploy and copy the resulting HTTPS Netlify URL.

Netlify also accepts a built `dist` folder through manual drag-and-drop deployment. Upload the production output, not the source folder. The output includes `_redirects` so email callbacks and page refreshes work.

## Required Supabase URL configuration

Once the actual published URL is known, open Supabase **Authentication → URL Configuration → Redirect URLs** and allow these exact routes at that origin:

- `https://YOUR-SITE.netlify.app/auth/callback`
- `https://YOUR-SITE.netlify.app/reset-password`

Also allow the running preview's callback/reset URLs if they are not registered automatically. Do not change the project's Site URL to fix preview callbacks; Bloom supplies its current absolute callback URL explicitly.

Keep email confirmation enabled. Supabase's default confirmation/recovery templates should respect the requested redirect URL; a custom template must not force a fixed unrelated Site URL.

## First sign-in and sharing

- Cloud vault access is currently restricted in the database to the email **dannyraymiselo@gmail.com**, with a verified email. Other accounts have no vault access even if they sign up.
- Create that account through Bloom, confirm the email, and sign in.
- Choose a separate sanctuary password. If this browser contains the original local vault, choose **Import the original vault from this browser** and enter its old password. Import is explicit, and the original stays untouched.
- At a different website origin, the old browser vault is not accessible. Export its encrypted backup on the original preview first, then restore the file in the published app.
- Wait for **Synced privately** before opening the vault on another device. Sign in with the same approved account and unlock with the same sanctuary password.
- Prefer changing the approved access email to Philile's email in a subsequent controlled change rather than sharing your personal account password.

## Privacy and recovery

All journal entries, photos, boards, intentions and reminders are stored inside an AES-GCM encrypted envelope. The encryption password is never uploaded. RLS permits only the verified approved owner. There are no public table grants or public photo buckets.

Account-password reset does not reset the sanctuary encryption password. Keep that password and encrypted backups safe. Concurrent device edits are not merged: a revision mismatch stops cloud overwrites, retains local pending changes and offers backup/load-cloud recovery. Cloud syncing requires connectivity; local encrypted autosave continues while an unlocked session is open.

Jess AI and background notifications remain unconnected; this change does not claim to enable either.
