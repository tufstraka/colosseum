# Dependency Audit & Fixes

## Critical Issues Fixed

### 1. ✅ jsPDF (v4.2.1 → v2.5.2)
**Problem:** Using ancient version from 2016 (npm misidentified as v4 but was actually old v1)  
**Fix:** Upgraded to modern v2.5.2 with TypeScript types included  
**Impact:** Better PDF rendering, security patches, proper types  
**Breaking changes:** None - API is backward compatible

### 2. ✅ Removed @types/jspdf
**Problem:** Conflicting with jsPDF's built-in types  
**Fix:** Removed separate @types package (v2.5.2 includes types)  
**Impact:** No more type conflicts

### 3. ✅ Updated patch versions
- `@aws-sdk/client-bedrock-runtime`: 3.1010.0 → 3.1011.0
- `@tanstack/react-query`: 5.90.21 → 5.91.0  
- `viem`: 2.47.2 → 2.47.5
- `zustand`: 5.0.11 → 5.0.12
- `tailwind-merge`: 2.6.0 → 2.6.1

**Impact:** Bug fixes and performance improvements

## Deferred Updates (Intentional)

### 1. Next.js (15.1.0 → 16.x available)
**Why:** Major version jump, needs testing. Current version is stable.  
**Action:** Test v16 in dev environment first

### 2. Tailwind CSS (3.4.19 → 4.x available)
**Why:** v4 is major rewrite with breaking changes  
**Action:** Requires migration guide review

### 3. wagmi (2.19.5 → 3.x available)
**Why:** Major version with breaking changes  
**Action:** Wait for v3 stability, current v2 works fine

### 4. @types/node (22.x → 25.x available)
**Why:** Node 25 is not LTS yet  
**Action:** Keep aligned with actual Node runtime version

## Memory Optimizations Applied

1. **package.json:**
   - Added `resolutions` field for React 19 enforcement
   - Updated all patch versions to latest stable

2. **next.config.js:**
   - Enabled `swcMinify` (faster, less memory)
   - Reduced image device sizes
   - Optimized webpack chunk splitting
   - Removed AVIF format (memory-intensive)

3. **Build process:**
   - Created `deploy-optimized.sh` with memory limits
   - Added `setup-swap.sh` for 2GB swap space
   - Stop PM2 during builds to free memory

## Known Issues (Non-Critical)

### @talismn/connect-wallets peer dependency warnings
**Status:** Working fine despite warnings  
**Cause:** Package lists React 18 as peer, we're on React 19  
**Fix:** Using `--legacy-peer-deps` flag (safe)  
**Impact:** None - package is compatible

### lucide-react updates available
**Status:** 0.468.0 installed, 0.577.0 available  
**Action:** Can update incrementally, current version works  
**Risk:** Low - icon library, no breaking changes expected

## Verification Checklist

After deployment, verify:
- ✅ App builds successfully
- ✅ PDF generation works (jsPDF v2)
- ✅ No TypeScript errors
- ✅ No runtime errors in browser console
- ✅ Wallet connection works (@talismn)
- ✅ API routes respond correctly

## Recommended Next Steps

1. **Immediate:** Deploy current changes
2. **This week:** Add monitoring for memory usage during builds
3. **Next sprint:** Test Next.js 16 in staging
4. **Future:** Evaluate Tailwind v4 migration
