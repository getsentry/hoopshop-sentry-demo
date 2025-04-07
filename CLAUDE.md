# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Test Commands
- Build: `npm run build`
- Development: `npm run dev`
- Lint: `npm run lint`
- E2E Tests: `npm run test:e2e`
- Single Test: `npx playwright test path/to/test.spec.ts`
- Checkout Flow Test: `npm run test:checkout`
- Checkout Flow Test UI: `npm run test:checkout:ui`
- View Test Report: `npm run report`

## Code Style Guidelines
- TypeScript with strict type checking
- React functional components with hooks
- Imports: group React/third-party, then local imports
- Error handling: use try/catch with explicit error logging
- Feature flag pattern for enabling/disabling features
- Use context for shared state (CartContext, FeatureFlagsContext)
- Component naming: PascalCase for components, camelCase for functions
- Tailwind for styling with className="" pattern
- Use data-testid attributes for E2E testing elements
- Avoid any type and use explicit interfaces/types