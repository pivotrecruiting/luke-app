# Design Guidelines: Welcome & Onboarding Flow

**Note:** Unable to access wireframe files from the zip. These guidelines should be refined once wireframes are viewable. The implementation should match the provided wireframes exactly.

## Architecture

### Authentication
- Determine from wireframes if authentication is required
- If login/signup screens are present, implement SSO (Apple Sign-In for iOS, Google for Android)
- If no auth screens shown, implement as local-first app

### Navigation Structure
**Onboarding Flow (Stack-Only Navigation):**
- Welcome Screen → Onboarding Screens → Main App Entry
- Linear progression with "Next" buttons
- Include "Skip" option if shown in wireframes
- Final screen transitions to main app navigation

## Screen Specifications

### Welcome Screen
**Layout:**
- Full-screen immersive experience
- Content should respect safe area insets (top: insets.top + Spacing.xl, bottom: insets.bottom + Spacing.xl)
- Primary CTA button at bottom
- Logo/branding at top or center
- Tagline/value proposition copy

**Components:**
- Brand logo/app icon
- Headline text
- Subheadline/description text
- Primary button ("Get Started" or equivalent)
- Secondary button/link (if "Already have account" is shown)

### Onboarding Screens
**Layout:**
- Swipeable carousel OR step-by-step with Next buttons (match wireframes)
- Progress indicators (dots or step counter)
- Consistent header spacing
- Bottom action area for navigation buttons

**Components per screen:**
- Hero image/illustration
- Title text
- Description text
- Next/Continue button
- Skip button (top-right corner)
- Page indicators

**Content Pattern:**
- Screen 1: Primary feature/benefit
- Screen 2: Secondary feature/benefit
- Screen 3: Call-to-action/permissions (if applicable)

## Visual Design

### Color Palette
Extract from wireframes:
- Primary color (CTAs, key elements)
- Background color
- Text colors (primary, secondary)
- Accent colors (if any)

### Typography
- Welcome headline: Large, bold (match wireframe sizing)
- Onboarding titles: Medium-large, semibold
- Body text: Regular weight, readable size
- Button text: Medium weight

### Component Styling

**Buttons:**
- Primary CTA: Solid fill with primary color
- Rounded corners (follow wireframe radius)
- Minimum height: 48px for accessibility
- Press state: Reduce opacity to 0.8

**Progress Indicators:**
- Active: Primary color
- Inactive: Gray/muted
- Size and spacing: Match wireframes exactly

**Images/Illustrations:**
- Maintain aspect ratios from wireframes
- Use provided assets if included in zip
- If generating placeholders, match style shown

### Spacing System
- Screen padding: Horizontal 20-24px (match wireframes)
- Vertical rhythm between elements: Match wireframe gaps
- Bottom button spacing: Safe area + 20-24px

## Interaction Design

**Welcome Screen:**
- Fade-in animation on mount (optional, if not specified)
- Button press feedback (opacity change)
- Smooth transition to onboarding

**Onboarding Carousel (if applicable):**
- Horizontal swipe gesture enabled
- Snap to page boundaries
- Update progress indicators on page change
- "Next" button triggers same page transition as swipe

**Navigation Flow:**
- "Skip" jumps to final screen or main app
- "Next" advances one screen
- Final screen "Get Started" → main app or signup
- No back navigation during onboarding (one-way flow)

## Accessibility

- All touchable areas minimum 44x44pt
- Sufficient color contrast ratios (4.5:1 for text)
- Meaningful button labels
- Support dynamic text sizing
- Screen reader support for all text content

## Assets Required

Extract from wireframes:
- App logo/icon
- Onboarding illustrations (3-4 images typically)
- Any decorative graphics
- Icon set for features (if shown)

**Implementation Priority:**
1. Match wireframe layouts pixel-perfect
2. Extract exact colors, fonts, spacing
3. Replicate component styles precisely
4. Implement animations only if specified
5. Ensure navigation flow matches wireframes exactly