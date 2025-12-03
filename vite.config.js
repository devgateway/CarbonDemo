import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages deployment - IMPORTANT: Update the base path to match your repository name
  // If your repo is https://github.com/username/geoserver_test, base should be '/geoserver_test/'
  // If your repo is https://github.com/username/username.github.io, set base to '/'
  // For local development, base is always '/'
  base: process.env.NODE_ENV === 'production' 
    ? '/CarbonDemo/'  // Repository: https://github.com/devgateway/CarbonDemo
    : '/',
})

