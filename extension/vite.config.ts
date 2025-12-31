import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        // We could add background script here if we were bundling it with Vite,
        // but for now we are using a static service-worker.js in public/
        // If we wanted to bundle the service worker with TS, we'd add it here.
      },
    },
  },
})
