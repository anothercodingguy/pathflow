# Google Cloud OAuth Setup Guide for PathFlow

This document provides step-by-step instructions to configure **Google Cloud OAuth 2.0 Client Credentials** for authenticating PathFlow dashboard users locally and in production on Vercel.

---

## 1. Step-by-Step Google Cloud Console Setup

### Step 1: Open Google Cloud Console
Go to [https://console.cloud.google.com/](https://console.cloud.google.com/) and sign in with your Google account.

### Step 2: Create or Select a Project
1. Click the project dropdown in the top navigation bar.
2. Click **New Project**.
3. Name it **PathFlow DevTools** and click **Create**.
4. Ensure the newly created project is selected.

---

### Step 3: Configure OAuth Consent Screen
1. In the left navigation menu, go to **APIs & Services** → **OAuth consent screen**.
2. Select User Type: **External** and click **Create**.
3. App Information:
   - **App name**: `PathFlow AI Agent Execution Intelligence`
   - **User support email**: Choose your email address
   - **Developer contact information**: Enter your email address
4. Click **Save and Continue**.
5. Scopes: Click **Add or Remove Scopes** and select:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
6. Click **Save and Continue**.
7. Test Users (while in Testing mode): Add your Google email address as a test user.
8. Click **Save and Continue**.

---

### Step 4: Create OAuth 2.0 Web Client Credentials
1. In the left navigation menu, go to **APIs & Services** → **Credentials**.
2. Click **+ Create Credentials** at the top → select **OAuth client ID**.
3. Application type: Select **Web application**.
4. Name: `PathFlow Web Client`.
5. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://pathflow-psi.vercel.app`
6. **Authorized redirect URIs** (Exact Auth.js Callback Routes):
   - **Development**: `http://localhost:3000/api/auth/callback/google`
   - **Production**: `https://pathflow-psi.vercel.app/api/auth/callback/google`
7. Click **Create**.

---

### Step 5: Copy Client Credentials
A modal will display your credentials:
- **Client ID**: `xxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxx`

Copy both values.

---

## 2. Local Environment Configuration (`.env`)

Add the credentials to your local `.env` file in the root `PathFlow/` directory:

```bash
# Auth.js Secret Key (Generate via: openssl rand -base64 32)
AUTH_SECRET="your_random_auth_secret_key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxx"
```

---

## 3. Vercel Production Environment Variables

1. Go to your Vercel Dashboard at [https://vercel.com](https://vercel.com) → Select **`pathflow-psi`**.
2. Go to **Settings** → **Environment Variables**.
3. Add the following variables:

| Variable Name | Example Value | Target Environments |
|---|---|---|
| `GOOGLE_CLIENT_ID` | `xxxx.apps.googleusercontent.com` | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxx` | Production, Preview, Development |
| `AUTH_SECRET` | `your_random_auth_secret_key` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://pathflow-psi.vercel.app` | Production, Preview, Development |

4. Click **Save**.
5. Go to **Deployments** → Click **Redeploy** on your latest build.

---

## 4. Verifying Authentication Flow

1. Open `http://localhost:3000/login` (or `https://pathflow-psi.vercel.app/login`).
2. Click **Continue with Google**.
3. Select your Google account on the consent screen.
4. You will be redirected to **`/runs`** with an authenticated session!
5. Your Google avatar, name, and email will be displayed in the top right Navbar user menu.
