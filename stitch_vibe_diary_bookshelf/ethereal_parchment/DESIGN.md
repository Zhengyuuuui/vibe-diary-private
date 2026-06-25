```markdown
# Design System Specification: The Literary Sanctuary

## 1. Overview & Creative North Star
**Creative North Star: The Literary Sanctuary**
This design system rejects the clinical coldness of modern "flat" design in favor of a tactile, editorial experience. It is designed to feel like a private study—a place where thoughts are curated rather than just recorded. We break the "template" look through intentional asymmetry, generous use of white space (inspired by the concept of *Ma*), and a hierarchy that prioritizes the poetic beauty of Chinese typography. This is not a utility; it is a digital heirloom.

## 2. Colors
The palette is a sophisticated study in neutrals, moving away from high-contrast blacks and whites toward a warm, organic spectrum.

*   **The "No-Line" Rule:** To maintain a serene atmosphere, 1px solid borders for sectioning are strictly prohibited. Boundaries between content areas must be defined exclusively through shifts in tonal value. Use `surface-container-low` (#f4f4f0) for large sections and `surface-container-lowest` (#ffffff) for inset elements.
*   **Surface Hierarchy & Nesting:** Treat the UI as a physical stack of fine paper. 
    *   **Level 0 (Base):** `surface` (#faf9f6)
    *   **Level 1 (Sections):** `surface-container-low` (#f4f4f0)
    *   **Level 2 (Active Cards):** `surface-container-lowest` (#ffffff)
*   **The "Glass & Gradient" Rule:** Floating elements, such as navigation shelves, should utilize Glassmorphism. Apply a backdrop-blur (12px–20px) to `surface-container-lowest` at 85% opacity. For CTAs, use a subtle radial gradient from `primary` (#695d4a) to `primary_dim` (#5d513f) to provide a sense of "ink-on-paper" depth.

## 3. Typography
Typography is the soul of this system. We utilize a high-contrast scale to create an editorial rhythm.

*   **Display & Headlines:** `notoSerif` (focused on elegant SC characters). These should have a tracking of `-0.02em` to feel tightly bound and authoritative. `display-lg` (3.5rem) should be used sparingly for "vibe" setting.
*   **Body & Titles:** `newsreader`. This serif provides a literary, rhythmic flow for long-form diary entries. `body-lg` (1rem) is the standard for storytelling.
*   **Labels:** `manrope`. Use this clean sans-serif for functional metadata (timestamps, word counts). It provides a necessary modern anchor to the otherwise classical aesthetic.
*   **Hierarchy Note:** Always prioritize vertical typesetting for short Chinese pull-quotes or dates to emphasize the "Sanctuary" aesthetic.

## 4. Elevation & Depth
Depth is achieved through "Tonal Layering" rather than traditional structural dividers.

*   **The Layering Principle:** Stack `surface-container` tiers to create lift. A card (`surface-container-lowest`) placed upon a background (`surface`) provides enough contrast for the eye without needing a harsh outline.
*   **Ambient Shadows:** For floating "shelves," use extra-diffused shadows. 
    *   *Shadow Token:* `0px 20px 40px rgba(105, 93, 74, 0.06)`. Note the tint: the shadow is a soft brown-grey (`primary` color at low opacity), mimicking natural light filtered through a room.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` token (#afb3ae) at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism:** Use `surface-container-lowest` with an 80% opacity and a `blur(16px)` to create a frosted glass effect for persistent floating headers or navigation.

## 5. Components

### Cards & Diary Covers
*   **Visuals:** Forbid divider lines. Instead, use varied textures:
    *   **Linen:** A fine, repeated noise pattern with low contrast.
    *   **Aged Leather:** A subtle radial gradient of `primary_container` (#f2e0c8) to `primary` (#695d4a).
    *   **Patterned Paper:** Soft geometric motifs using `outline-variant` at 5% opacity.
*   **Interaction:** On hover, a card should not "grow" (scale); it should subtly shift in tonal value to `surface-container-highest` (#e0e4de).

### Buttons
*   **Primary:** `primary` (#695d4a) background with `on_primary` (#fff6ee) text. Radius: `md` (0.375rem).
*   **Secondary:** `secondary_container` (#e3e2e0) background. No border.
*   **Tertiary:** Purely typographic using `newsreader` in `primary` color, with a subtle underline using `outline-variant`.

### Floating Shelves
*   A custom component: A wide, horizontal container with `full` rounded corners (9999px), using `surface-container-lowest` at 90% opacity and an ambient shadow. Used for navigation and toolbars.

### Input Fields
*   **Styling:** Remove the input box entirely. Use a single "Ghost Border" bottom line (`outline-variant` at 20%) that transitions to `primary` (#695d4a) when focused. 
*   **Typography:** User input should always use `newsreader` to make the act of writing feel like literature.

### Chips & Tags
*   Use `surface-container-high` (#e6e9e4) with `label-md` typography. No borders. Use `xl` (0.75rem) roundedness for a pill-like, organic feel.

## 6. Do's and Don'ts

### Do
*   **Embrace Asymmetry:** Place titles slightly off-center to mimic high-end magazine layouts.
*   **Respect the "Ma":** Use the spacing scale generously. If a section feels crowded, double the white space rather than adding a divider.
*   **Texture as Function:** Use linen textures for "Archived" entries and smooth leather for "Current" entries.

### Don't
*   **No Pure Black:** Never use #000000. Use `on_surface` (#2f3430) for text to maintain the soft, ink-like feel.
*   **No Standard Grids:** Avoid the "3-column card grid" look. Vary card widths or use staggered offsets to keep the layout feeling "artistic."
*   **No High-Heeled Shadows:** Avoid dark, tight, or heavy shadows. If a shadow is noticeable as a "shadow," it is too dark. It should feel like a soft glow of light.
*   **No Dividers:** If you are tempted to use a `<hr>` or a 1px line, use a 16px–32px gap of `surface` color instead.```