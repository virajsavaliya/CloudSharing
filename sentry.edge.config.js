// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is required for middleware and it's not the same as the client side sentry config.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Configure the instrumenter to use OpenTelemetry instead of Sentry
  instrumenter: "otel",

  // Ensure performance monitoring is enabled
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ depth: 3 }),
  ],

  // Capture all performance data
  enableTracing: true,
  
  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',
});