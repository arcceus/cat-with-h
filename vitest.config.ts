import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

export default defineConfig({
  test: {
    // Add any other test configurations here
  },
}) 