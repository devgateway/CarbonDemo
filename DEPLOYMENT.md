# GitHub Pages Deployment Guide

## Quick Start

1. **Update the base path** in `vite.config.js`:
   - Open `vite.config.js`
   - Change `/geoserver_test/` to match your repository name
   - Example: If your repo is `my-geoserver-map`, change it to `/my-geoserver-map/`
   - If your repo is `username.github.io`, change it to `/`

2. **Enable GitHub Pages**:
   - Go to your repository → **Settings** → **Pages**
   - Under "Source", select **GitHub Actions**
   - Save

3. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Setup GitHub Pages deployment"
   git push origin main
   ```

4. **Wait for deployment**:
   - Go to **Actions** tab in your repository
   - Watch the "Deploy to GitHub Pages" workflow run
   - When complete, your site will be live!

## Repository Name Examples

| Repository Name | Base Path in vite.config.js |
|----------------|----------------------------|
| `geoserver_test` | `/geoserver_test/` |
| `my-map-app` | `/my-map-app/` |
| `username.github.io` | `/` |

## Troubleshooting

### 404 Errors
- **Problem**: Getting 404 errors when accessing the site
- **Solution**: Make sure the `base` path in `vite.config.js` exactly matches your repository name (case-sensitive)

### Assets Not Loading
- **Problem**: Images, CSS, or JS files not loading
- **Solution**: 
  1. Check browser console for 404 errors
  2. Verify the base path is correct
  3. Clear browser cache and try again

### CORS Issues with GeoServer
- **Problem**: GeoServer layers not loading due to CORS
- **Solution**: Configure GeoServer to allow requests from your GitHub Pages domain:
  ```
  https://username.github.io
  ```

### Workflow Not Running
- **Problem**: GitHub Actions workflow doesn't trigger
- **Solution**:
  1. Check that you've enabled GitHub Actions in repository settings
  2. Ensure you're pushing to `main` or `master` branch
  3. Check the **Actions** tab for any error messages

## Manual Deployment (Alternative)

If you prefer not to use GitHub Actions:

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

## Updating Your Site

After making changes:
1. Commit and push to GitHub
2. GitHub Actions will automatically rebuild and redeploy
3. Your changes will be live in a few minutes

