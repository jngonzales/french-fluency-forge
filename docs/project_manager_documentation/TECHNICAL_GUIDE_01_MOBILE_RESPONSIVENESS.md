# Technical Guide: Mobile Responsiveness

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Status:** Partially Implemented

---

## Table of Contents

1. [Overview](#overview)
2. [Current Responsive Design](#current-responsive-design)
3. [Mobile Access Strategy](#mobile-access-strategy)
4. [Testing Mobile Responsiveness](#testing-mobile-responsiveness)
5. [Known Issues](#known-issues)
6. [Implementation Guide](#implementation-guide)

---

## Overview

French Fluency Forge is built with **responsive design** using Tailwind CSS. The app should work on mobile devices, but it's not optimized for mobile-first usage. This document describes the current state and what to do if students try to access it on mobile.

**Key Points:**
- ✅ App is responsive (adapts to screen size)
- ⚠️ Not optimized for mobile-first
- ⚠️ Some features may be difficult on mobile
- ❌ No native mobile app

---

## Current Responsive Design

### Framework and Tools

**Tech Stack:**
- **Tailwind CSS** - Utility-first CSS framework
- **Responsive breakpoints:**
  - `sm:` 640px (mobile landscape)
  - `md:` 768px (tablet)
  - `lg:` 1024px (desktop)
  - `xl:` 1280px (large desktop)

**Mobile Detection Hook:**
- `src/hooks/use-mobile.tsx`
- Detects screen width < 768px
- Used for conditional rendering

### Responsive Components

**Dashboard:**
- ✅ Responsive layout (stacks on mobile)
- ✅ Charts use `ResponsiveContainer` from Recharts
- ✅ Cards stack vertically on mobile
- ✅ Touch-friendly buttons

**Assessment Pages:**
- ✅ Responsive forms
- ✅ Audio recording works on mobile
- ✅ Buttons sized for touch

**Phrases System:**
- ✅ Responsive tables (horizontal scroll if needed)
- ✅ Single-column layouts on mobile
- ✅ Big buttons for touch

**Navigation:**
- ✅ Mobile menu (hamburger)
- ✅ Sidebar collapses on mobile
- ✅ Sheet components for mobile drawers

### Current Implementation

**File:** `src/hooks/use-mobile.tsx`

```typescript
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);
  
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    // ... listener setup
  }, []);
  
  return !!isMobile;
}
```

**Usage:**
```typescript
const { isMobile } = useIsMobile();

if (isMobile) {
  return <MobileLayout />;
} else {
  return <DesktopLayout />;
}
```

---

## Mobile Access Strategy

### If Students Try to Access on Mobile

**Current Behavior:**
1. App loads and renders
2. Layout adapts to screen size
3. Features work but may be cramped
4. Some interactions may be difficult

**Recommended Approach:**

#### Option 1: Use Responsive Design (Current)

**Pros:**
- ✅ Works on all devices
- ✅ No additional development
- ✅ Single codebase

**Cons:**
- ⚠️ Not optimized for mobile
- ⚠️ Some features may be difficult
- ⚠️ Audio recording may have issues on some devices

**What to Tell Students:**
- "The app works on mobile but is best experienced on desktop or tablet"
- "For best results, use a desktop browser"
- "Mobile access is available but some features may be limited"

#### Option 2: Mobile-Optimized Views (Future)

**What to Build:**
- Mobile-specific layouts
- Simplified navigation
- Touch-optimized interactions
- Mobile-first components

**Implementation:**
- Create mobile-specific components
- Use `useIsMobile()` hook to conditionally render
- Optimize for touch interactions
- Simplify complex features for mobile

#### Option 3: Native Mobile App (Future)

**What to Build:**
- React Native app
- Or Progressive Web App (PWA)
- Native mobile experience

**Pros:**
- ✅ Best mobile experience
- ✅ Native features (push notifications, etc.)
- ✅ App store distribution

**Cons:**
- ❌ Significant development effort
- ❌ Separate codebase (or React Native)
- ❌ App store approval process

### Current Recommendation

**For Now:**
- Keep responsive design
- Document mobile limitations
- Provide desktop recommendation
- Monitor mobile usage and issues

**Future:**
- Consider mobile-optimized views if mobile usage is high
- Consider PWA for better mobile experience
- Consider native app if mobile is primary platform

---

## Testing Mobile Responsiveness

### Test Scenario 1: Mobile Viewport (375px)

**Steps:**
1. Open browser DevTools
2. Set viewport to 375px (iPhone)
3. Navigate through app:
   - Dashboard
   - Assessment
   - Phrases
   - Settings
4. Verify:
   - No horizontal scroll
   - All content visible
   - Buttons are tappable
   - Forms are usable

**Expected Result:**
- App works on mobile viewport
- Some features may be cramped
- All functionality accessible

### Test Scenario 2: Tablet Viewport (768px)

**Steps:**
1. Set viewport to 768px (iPad)
2. Test all pages
3. Verify:
   - Layout adapts well
   - More space than mobile
   - Better experience

**Expected Result:**
- Good experience on tablet
- Better than mobile
- All features usable

### Test Scenario 3: Real Mobile Device

**Steps:**
1. Deploy app to production
2. Open on real mobile device (iPhone/Android)
3. Test:
   - Audio recording
   - Form submission
   - Navigation
   - Charts/graphs
4. Verify:
   - Everything works
   - Performance is acceptable
   - No crashes

**Expected Result:**
- App works on real device
- Some limitations may exist
- Audio may have device-specific issues

### Test Scenario 4: Touch Interactions

**Steps:**
1. Test on touch device
2. Verify:
   - Buttons are large enough (min 44x44px)
   - Touch targets are adequate
   - No accidental clicks
   - Swipe gestures work (if implemented)

**Expected Result:**
- Touch-friendly
- Adequate touch targets
- No interaction issues

---

## Known Issues

### Current Limitations

1. **Charts on Mobile:**
   - Charts may be small on mobile
   - May need to zoom/scroll
   - Consider simplified mobile charts

2. **Audio Recording:**
   - Browser compatibility varies
   - iOS Safari has restrictions
   - May require user gesture
   - Some devices may not support

3. **Forms:**
   - Long forms may be difficult
   - Keyboard may cover inputs
   - May need to scroll to see all fields

4. **Tables:**
   - Wide tables may need horizontal scroll
   - May be difficult to use on mobile

5. **Navigation:**
   - Hamburger menu works but may be hidden
   - Deep navigation may be difficult

### Browser Compatibility

**Tested Browsers:**
- ✅ Chrome (desktop/mobile)
- ✅ Safari (desktop/mobile)
- ✅ Firefox (desktop)
- ⚠️ Edge (may have issues)
- ⚠️ Older browsers (may not work)

**Mobile Browsers:**
- ✅ iOS Safari (with limitations)
- ✅ Chrome Mobile
- ⚠️ Samsung Internet (may have issues)
- ⚠️ Older mobile browsers (may not work)

---

## Implementation Guide

### Making Components Mobile-Friendly

**1. Use Responsive Utilities:**

```tsx
<div className="flex flex-col md:flex-row">
  <div className="w-full md:w-1/2">Content</div>
</div>
```

**2. Use Mobile Hook:**

```tsx
const { isMobile } = useIsMobile();

return (
  <div>
    {isMobile ? (
      <MobileLayout />
    ) : (
      <DesktopLayout />
    )}
  </div>
);
```

**3. Touch-Friendly Buttons:**

```tsx
<Button 
  className="min-h-[44px] min-w-[44px]" // iOS recommended size
  size="lg" // Large touch target
>
  Click Me
</Button>
```

**4. Responsive Charts:**

```tsx
<ResponsiveContainer width="100%" height={isMobile ? 300 : 450}>
  <LineChart data={data}>
    {/* Chart config */}
  </LineChart>
</ResponsiveContainer>
```

**5. Mobile Navigation:**

```tsx
<Sheet> {/* Mobile drawer */}
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon">
      <Menu />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    {/* Navigation items */}
  </SheetContent>
</Sheet>
```

### Testing Checklist

- [ ] Test on 375px viewport (iPhone)
- [ ] Test on 768px viewport (iPad)
- [ ] Test on real mobile device
- [ ] Verify no horizontal scroll
- [ ] Verify touch targets are adequate
- [ ] Test audio recording on mobile
- [ ] Test forms on mobile
- [ ] Test charts on mobile
- [ ] Test navigation on mobile
- [ ] Verify performance is acceptable

---

## Key Files Reference

- **Mobile Hook:** `src/hooks/use-mobile.tsx`
- **Dashboard:** `src/pages/DashboardPage.tsx`
- **Responsive Components:** All components use Tailwind responsive utilities
- **Test Config:** `playwright.config.ts` (includes mobile viewports)

---

## Next Steps

### Short Term

1. **Document Mobile Limitations**
   - Add note to user guide
   - Provide desktop recommendation
   - List known mobile issues

2. **Fix Critical Mobile Issues**
   - Fix any horizontal scroll issues
   - Ensure touch targets are adequate
   - Test audio recording on mobile

### Medium Term

3. **Mobile-Optimized Views**
   - Create mobile-specific layouts
   - Simplify complex features
   - Optimize for touch

4. **PWA Implementation**
   - Add service worker
   - Add manifest.json
   - Enable offline support (if needed)

### Long Term

5. **Native Mobile App**
   - Evaluate React Native
   - Or build PWA with native features
   - Consider app store distribution

---

**This document should be updated as mobile features are implemented or issues are discovered.**

