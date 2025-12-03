# Setting Up Password Protection with GitHub Secrets

This guide explains how to set the site password using GitHub Secrets for your GitHub Pages deployment.

## Step-by-Step Instructions

### 1. Navigate to Repository Settings

1. Go to your GitHub repository: `https://github.com/devgateway/CarbonDemo`
2. Click on the **Settings** tab (at the top of the repository)

### 2. Access Secrets and Variables

1. In the left sidebar, scroll down to **Secrets and variables**
2. Click on **Actions**

### 3. Create a New Secret

1. Click the **New repository secret** button
2. Fill in the form:
   - **Name**: `VITE_SITE_PASSWORD`
     - ⚠️ **Important**: The name must be exactly `VITE_SITE_PASSWORD` (case-sensitive)
   - **Secret**: Enter your desired password
     - Example: `MySecurePassword123!`
3. Click **Add secret**

### 4. Verify the Secret

1. You should see `VITE_SITE_PASSWORD` listed in your secrets
2. The value will be hidden (shown as `••••••••`)

### 5. Trigger a New Deployment

The secret will be used automatically on the next deployment. To trigger it:

**Option A: Push a commit**
```bash
git commit --allow-empty -m "Trigger deployment with password secret"
git push origin main
```

**Option B: Manual workflow trigger**
1. Go to the **Actions** tab in your repository
2. Click on **Deploy to GitHub Pages** workflow
3. Click **Run workflow** button
4. Select the branch (usually `main`)
5. Click **Run workflow**

### 6. Verify It Works

1. After deployment completes (check the Actions tab)
2. Visit your site: `https://devgateway.github.io/CarbonDemo/`
3. You should see the password prompt
4. Enter the password you set in the secret
5. You should gain access to the site

## How It Works

- The GitHub Actions workflow reads the `VITE_SITE_PASSWORD` secret during the build process
- Vite injects it as an environment variable into your React app
- The password protection component uses this value to authenticate users
- The password is embedded in the built JavaScript (client-side protection)

## Security Notes

⚠️ **Important Security Considerations:**

1. **Client-Side Protection**: This is client-side password protection, not server-side security
   - The password is visible in the built JavaScript bundle
   - Anyone with technical knowledge can extract it from the browser
   - This is suitable for basic access control, not high-security applications

2. **For Better Security**, consider:
   - Using GitHub's private repository feature
   - Implementing server-side authentication
   - Using a service like Netlify or Vercel with built-in password protection
   - Using OAuth or other authentication providers

## Troubleshooting

### Password Not Working After Setting Secret

1. **Check the secret name**: Must be exactly `VITE_SITE_PASSWORD`
2. **Trigger a new deployment**: Secrets are only used during build time
3. **Check workflow logs**: Go to Actions → Latest workflow run → Build step
4. **Verify the secret exists**: Settings → Secrets and variables → Actions

### Secret Not Available in Build

- Make sure the secret name is `VITE_SITE_PASSWORD` (not `SITE_PASSWORD` or anything else)
- Vite only exposes environment variables that start with `VITE_`
- The workflow file must reference it: `VITE_SITE_PASSWORD: ${{ secrets.VITE_SITE_PASSWORD }}`

### Changing the Password

1. Go to Settings → Secrets and variables → Actions
2. Find `VITE_SITE_PASSWORD`
3. Click the **Update** button (pencil icon)
4. Enter the new password
5. Click **Update secret**
6. Trigger a new deployment

## Example Workflow

The workflow file (`.github/workflows/deploy.yml`) already includes:

```yaml
- name: Build
  run: npm run build
  env:
    NODE_ENV: production
    VITE_SITE_PASSWORD: ${{ secrets.VITE_SITE_PASSWORD }}
```

This passes the secret to the build process, where Vite makes it available to your React app.

