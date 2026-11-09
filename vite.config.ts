/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import type { Plugin } from 'vite'

// `vite --mode mock` swaps src/services/* for in-memory fakes in src/mocks/services,
// so every screen can be viewed signed in without Firebase. Never used in builds.
const mockServices = (): Plugin => {
  const services = path.resolve(import.meta.dirname, 'src/services')
  const mocks = path.resolve(import.meta.dirname, 'src/mocks/services')
  return {
    name: 'nubox-mock-services',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || importer.startsWith(mocks) || !source.includes('services/')) return null
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      if (!resolved?.id.startsWith(services + path.sep)) return null
      return path.join(mocks, path.basename(resolved.id))
    },
  }
}

// https://github.com/reactjs/react.dev/issues/8353
export default defineConfig(({ mode }) => ({
  plugins: [
    mode === 'mock' && mockServices(),
    tailwindcss(),
    react(),
    babel({
      plugins: ['babel-plugin-react-compiler'],
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'firebase-firestore', test: /node_modules[\\/]@firebase[\\/]firestore[\\/]/, priority: 3 },
            { name: 'firebase-auth', test: /node_modules[\\/]@firebase[\\/]auth[\\/]/, priority: 3 },
            { name: 'firebase', test: /node_modules[\\/]@?firebase[\\/]/, priority: 2 },
          ],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vite-setup.ts',
  },
}))
