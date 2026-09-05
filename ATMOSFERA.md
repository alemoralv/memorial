# Marilú: luz, papel y fotografías

Refinement requested 4 September 2026, continuing the existing Scrollcraft
gallery/catalog composition and the khaki, forest and rose palette.

- Photographs have no visible legends, titles, provenance, or decorative copy
  in the opening, scroll album, book, or fullscreen viewer. Original metadata
  remains intact for accessible image descriptions and contact-strip controls.
- `atmosfera.css` places two layers of paper and light below the entire content
  stack. `atmosfera.js` moves them gently with scrolling and a fine pointer.
- The pointer leaves brief dandelion seeds in the surrounding paper, recalling
  the opening photograph. It keeps the native cursor, caps particles at 18,
  stops rendering after they fade, and pauses in a hidden tab. A canvas cutout
  protects photographs and reading surfaces in addition to the DOM layer order.
- Touch devices keep the texture without a pointer effect. Reduced motion also
  removes background travel. No additional third-party runtime was introduced.
- Archivo and Bodoni Moda are now served locally in their original styles and
  weights, with the original SIL Open Font Licenses. The three Latin-subset
  WOFF2 files total 112,064 bytes and include the Spanish accented characters.
- Photos use the space released by their captions. Fullscreen controls have a
  separate reserved area, and the book-turn shadow is removed from the images.

## Generated asset

`assets/papel-luz.webp` was generated with the user's KIE credential using
`seedream/5-pro-text-to-image`, then encoded as a 1920-pixel-wide WebP (81,686
bytes). It is decorative paper and light. No family photographs were uploaded
or altered. Credentials stay in the parent workspace `.env`; the public site
only loads the finished local asset. All asset paths remain relative.

The task ID, exact prompt, and original PNG are recorded outside the deployed
site in the project workspace. Direct Node requests timed out; authenticated
generation and download succeeded through Chrome against the official KIE API.

## Verification

The existing `node scripts/verify-premium.mjs` suite passed all nine interaction
groups with isolated Firebase fixtures, including contributions, uploaded photo
compression, candles, photo loading, book persistence, keyboard navigation,
video playback, reduced motion, and the no-JavaScript fallback.

`node scripts/verify-atmosphere.mjs` checks five viewport/motion configurations,
caption absence, photo/control geometry, horizontal overflow, background layer
order, pointer activation and idle cleanup, book and fullscreen presentation,
and browser exceptions. Evidence is in ignored `lab/atmosfera/`.

The final Scrollcraft walkthroughs are in `lab/atmosfera-final-desktop/`,
`lab/atmosfera-final-phone/`, and `lab/atmosfera-final-quiet/` (143 frames total,
no dead scroll detected). Earlier captures remain as diagnostic history.
These are Chrome tests, not physical iPhone or Safari verification.

The five final viewport/motion checks passed, with the real local display font
loaded. The small opening copy measured at least 5.12:1 against screenshots of
the rendered background. The softer light blend corrected the dark paper under
small rose copy; these measurements do not constitute a full WCAG audit.

Final walkthroughs had no font-download failures. Firebase reported intermittent
backend timeouts in this environment and used its existing offline fallback;
live synchronization is therefore not certified by the walkthroughs. The nine
isolated interaction groups passed, and no archive/photo/video source changed.

The reference OpenAI URL was read, but its interactive browser page presented
a Cloudflare interstitial. The dandelion effect is an original adaptation;
pixel-for-pixel reproduction of that cursor interaction is not claimed.

No live contributions were submitted, and no production deployment was made.

Preview: http://localhost:4517/

## Visual review

The gallery/catalog grammar remains appropriate to a growing family collection;
a new filmic journey or fixed scene replacement would displace its photographs.
This is a refinement of the same site, not a claim to a new 4-of-6 fingerprint.
The intended sequence remains recognition, tenderness, closeness, stillness,
connection, familiarity, belonging, and affection. The reviewed opening, clean
album/book/viewer frames, and held "so beat it" ending support that sequence.
Removing the legends gives the photographs the intended uninterrupted presence.

The late arrival of live memories shifted some positions during the mechanical
walkthroughs. The dedicated checks therefore revisit sections using their current
geometry; separate final captures confirm the complete closing phrase and the
phone album, book, and viewer. The visual review also prompted the softer light
blend and local fonts, correcting darker small-copy backgrounds and fallback
type. Background texture and family photographs were visually inspected.
