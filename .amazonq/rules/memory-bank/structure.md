# Structure — AI Mind Law

## Directory Layout

```
ai-mind-law/
├── public/                  # Static assets (favicon, marketing images)
├── src/
│   ├── components/
│   │   └── ui/              # shadcn/ui component library (40+ primitives)
│   ├── data/
│   │   └── sampleTender.ts  # Fictional tender + simulated analysis (illustrative only)
│   ├── hooks/
│   │   └── use-mobile.tsx   # Responsive breakpoint hook
│   ├── lib/
│   │   ├── services/
│   │   │   ├── documentProcessing.ts  # PDF.js browser-side text extraction
│   │   │   ├── csv.ts                 # CSV export utility
│   │   │   └── evidence.ts            # Evidence extraction helpers
│   │   ├── types.ts                   # Shared TypeScript types
│   │   ├── utils.ts                   # cn() and general helpers
│   │   ├── error-capture.ts           # Error capture utilities
│   │   ├── error-page.ts              # Error page helpers
│   │   └── lovable-error-reporting.ts # Lovable platform error reporting
│   ├── routes/
│   │   ├── __root.tsx       # Root layout (TanStack Router)
│   │   ├── index.tsx        # `/` route — currently a placeholder
│   │   └── README.md        # Route-level notes
│   ├── test/
│   │   ├── app-routing.test.tsx  # Routing smoke tests
│   │   └── setup.ts              # Vitest setup (jest-dom matchers)
│   ├── router.tsx           # TanStack Router instance
│   ├── routeTree.gen.ts     # Auto-generated route tree (do not edit)
│   ├── server.ts            # SSR entry point / error wrapper
│   ├── start.ts             # App bootstrap
│   └── styles.css           # Global Tailwind CSS v4 styles + CSS variables
├── .amazonq/rules/memory-bank/  # Amazon Q memory bank docs
├── .lovable/                    # Lovable platform config and plan
├── components.json          # shadcn/ui CLI config
├── vite.config.ts           # Vite config via @lovable.dev/vite-tanstack-config
├── tsconfig.json            # TypeScript strict config
├── eslint.config.js         # ESLint flat config
├── .prettierrc              # Prettier config
├── vitest.config.ts         # Vitest config
└── package.json
```

## Core Architectural Patterns

- **File-based routing** via TanStack Router; `routeTree.gen.ts` is auto-generated — never edit manually.
- **UI layer** is entirely shadcn/ui primitives built on Radix UI + Tailwind CSS v4.
- **Services** in `src/lib/services/` are plain TypeScript modules (no class instances) — imported directly into routes/components.
- **Path alias** `@/` maps to `src/` throughout the codebase.
- **SSR** is handled by Nitro (via `@lovable.dev/vite-tanstack-config`); `src/server.ts` is the custom entry point.
- **State management**: TanStack Query for async server state; React Hook Form + Zod for form state.
