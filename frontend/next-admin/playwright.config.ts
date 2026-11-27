import { defineConfig, devices } from '@playwright/test';

const DATABASE_URL = 'postgresql://paroquia:paroquia@localhost:5433/paroquia_test';
const API_URL = 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // migrate + seed de teste + API (o seed recusa banco que não seja *_test)
      cwd: '../../backend/nest-api',
      command: 'npx prisma migrate deploy && npm run seed:e2e && npm run start:prod',
      url: `${API_URL}/health/ready`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NODE_ENV: 'test',
        PORT: '3000',
        DATABASE_URL,
        JWT_SECRET: 'e2e-secret-e2e-secret-e2e-secret-123456',
        STORAGE_PROVIDER: 'cloudinary',
        CLOUDINARY_CLOUD_NAME: 'fake',
        CLOUDINARY_API_KEY: 'fake',
        CLOUDINARY_API_SECRET: 'fake',
        TRUST_PROXY_HOPS: '0',
      },
    },
    {
      command: 'npm run build && npm run start',
      url: 'http://localhost:3001/login',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        // não sei qual das duas o código lê; defino as duas
        NEST_API_URL: API_URL,
        API_URL,
      },
    },
  ],
});