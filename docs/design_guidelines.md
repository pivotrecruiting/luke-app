# Design Guidelines: Luke Finance App

## App Overview
Luke is a German-language personal finance app that helps users gain control over their finances through onboarding questionnaires about savings goals, income, and expenses.

## Color Palette

### Primary Colors
- **Primary Purple**: #7340fd - Main CTA buttons, selections, highlights
- **Accent Lavender**: #7B8CDE - Progress indicators, input borders, secondary elements
- **Button Purple**: #8E97FD - Continue buttons, action buttons

### Background Colors
- **White**: #FFFFFF - Main screen backgrounds
- **Dark Gradient**: #0a0a15 to #000000 - Welcome screen background
- **Chip Background**: #E9E1FF - Light purple for chip/pill backgrounds

### Card Colors (Goal Selection)
- **Overview**: #7B8CDE (Lavender)
- **Klarna**: #F07B6E (Coral)
- **Subscriptions**: #F5C5A8 (Peach)
- **Savings**: #F5D76E (Yellow)
- **Goals**: #7ECBA1 (Mint)
- **Peace**: #D4B5C7 (Mauve)

### Text Colors
- **Primary Text**: #000000
- **Secondary Text**: #9CA3AF (Gray)
- **Button Text**: #FFFFFF

### Accent Colors
- **Teal**: #2d9a8c - Decorative blur circles
- **Divider**: #E5E7EB

## Typography

### Font Family
- Primary: System font (Inter-inspired)

### Font Sizes & Weights
- **h1**: 28px, Bold (700) - Screen titles
- **h2**: 25px, ExtraBold (800) - Welcome headline
- **h3**: 20px, Bold (700) - Section headings
- **h4**: 18px, SemiBold (600) - Card labels, subheadings
- **body**: 16px, Regular (400) - Body text, descriptions
- **small**: 14px, Regular (400) - Subtitles, hints
- **tiny**: 12px, Regular (400) - Legal text
- **button**: 14px, ExtraBold (800) - Button text (uppercase)
- **chip**: 14px, Medium (500) - Chip/pill labels

## Spacing System
- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 20px
- **2xl**: 24px
- **3xl**: 32px
- **4xl**: 40px
- **5xl**: 48px
- **inputHeight**: 56px
- **buttonHeight**: 56px

## Border Radius
- **xs**: 8px - Small inputs
- **sm**: 12px - Inputs, chips
- **md**: 16px - Cards, buttons
- **lg**: 24px - Large cards
- **xl**: 32px - Primary buttons
- **full**: 9999px - Pills, chips

## Components

### Primary Button
- Background: #8E97FD or #7340fd
- Height: 56px
- Border Radius: 16px
- Text: Uppercase, bold, white
- Press state: Opacity 0.8

### Skip/Secondary Button
- Background: #E8E4F3
- Border: 1px #7B8CDE
- Height: 56px
- Border Radius: 16px
- Text: #7B8CDE, semibold

### Currency Input
- Height: 56px
- Border: 2px #7B8CDE (highlighted) or 1px #E5E7EB (normal)
- Border Radius: 12px
- € prefix left-aligned

### Chips/Pills
- Background: #E9E1FF
- Border: 2px (gray unselected, black selected)
- Border Radius: full (9999px)
- Padding: 8px vertical, 16px horizontal

### Goal Cards
- Height: 160px
- Width: 48% (2-column grid)
- Border Radius: 16px
- Padding: 16px
- Selection: 4px border ring in #7340fd

### Progress Dots
- Active: 32px wide × 8px tall, #7B8CDE
- Inactive: 8px × 8px, #D1D5DB
- Gap: 8px between dots

## Screen Patterns

### Safe Area Handling
- Top padding: insets.top + 20px (no header screens)
- Bottom padding: insets.bottom + 20px

### Floating Button Container
- Position: absolute bottom
- Background: white
- Padding: 16px top, varies bottom

### Content Layout
- Horizontal padding: 20px
- Gap between sections: 24-32px

## Animation & Interaction

### Button Press
- Opacity change to 0.8

### Card Selection
- 4px border ring appears with spring animation

### Screen Transitions
- Slide from right (React Navigation default)

## Assets

### Welcome Screen
- Lamp image: nordic-style-colorful-metal-pendant-light-fixture-dining-room-ta.png
- Purple blur circle for depth effect

### Onboarding3 Screen (Erspartes)
- Coins illustration: image_1767541830063.png
- Ellipse background: image_1767542218268.png

### Goal Card Images (Onboarding2)
- Overview: image_1767540420128.png
- Klarna: image_1767540689248.png
- Subscriptions: image_1767540704833.png
- Savings: image_1767540547771.png
- Goals: image_1767540578781.png
- Peace: image_1767540595139.png
