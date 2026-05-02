┌──────────────────────────────────────────────────────┐
│                VITEST (Fast, No Browser)              │
│            All using Driver Pattern                   │
│            All using given/when/get/then              │
│            All using ts-stubber for interfaces        │
│                                                      │
│  ├── Utils Driver        (isDellEmail, parseHashtags) │
│  ├── VideoPort Driver    (interface contract)         │
│  ├── EmailPort Driver    (interface contract)         │
│  ├── DatabasePort Driver (interface contract)         │
│  ├── Cloudflare Adapter Driver (API calls)            │
│  ├── Resend Adapter Driver     (email sending)        │
│  └── API Route Drivers         (business logic)       │
│                                                      │
│  ❌ NO component unit tests                           │
├──────────────────────────────────────────────────────┤
│              CYPRESS (Real Browser)                   │
│            All using Driver Pattern                   │
│            All using given/when/get/then              │
│                                                      │
│  ├── Login Page Driver     (E2E auth flow)            │
│  ├── Verify Page Driver    (E2E verify flow)          │
│  ├── Feed Page Driver      (E2E feed interaction)     │
│  ├── Upload Page Driver    (E2E upload flow)          │
│  └── Responsive Driver     (viewport testing)         │
│                                                      │
│  Components tested through E2E, not in isolation      │
└──────────────────────────────────────────────────────┘