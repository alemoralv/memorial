# Scroll-craft · Marilú

Design refinement of the existing family memorial, using
[nateherkai/scroll-craft](https://github.com/nateherkai/scroll-craft), retrieved
4 September 2026. The full working brief is in the project workspace at
`../scrollcraft/builds/marilu-premium/BRIEF.md`.

The creative direction is a physical family album: the complete dandelion
photograph on independently moving paper mounts, Marilú's name in the established
Bodoni/Archivo pairing, khaki paper, forest ink, and deep rose. The visitor moves
from recognition to her life, to the photographic peak, to the quiet of Stay,
to family recollections, to familiar recipes and songs, and finally to a
contribution and her own “so beat it”. The existing contact sheet with an empty
place for the visitor remains the signature interaction.

This is a revision of the existing gallery/catalog grammar. Its only registry
peer is the same memorial, so the 4-of-6 distinct-new-site gate is not claimed.
Changing the family album's signature for novelty would contradict the task.
The other page grammars do not fit a navigable collection of real family objects.
The authored brief reuses PRODUCT.md and the current README; no new interview or
invented biographical information was needed.

## Implementation

- `premium.css`: page presentation and separate phone composition.
- `premium.js`: paper depth, mobile index, photo-viewer keyboard entry/focus loop,
  and live responsive hero layout. No credentials or cloud operations.
- `index.html`: semantic name, photographic mount, readable timeline, album
  entrance, song room, accessible file controls, and a complete ending.
- `memorial.js`: preserves the database integration and fixes a cached-photo
  rendering race. A requested image must decode before it replaces the current
  photograph and caption. Cached shared images are now inserted into the album,
  including those previously fetched by the contact strip.
- The shared engine, archive, video, Firestore identifiers, and stored family
  contributions remain unchanged. All deployed paths are relative.
- No assets were generated. Her family's real photographs and Stay are the
  source material; no KIE credit was needed or used. No secret is shipped.

## Verification

Run a static server from this directory, then:

```sh
node scripts/verify-premium.mjs
```

The default preview is `http://localhost:4517/`; installed Chrome and
`playwright-core` are required. The test uses an isolated in-browser Firebase
stub, intercepts all Firestore traffic, and does not write to the live memorial.
It exercises all four contribution types and image compression, field validation,
candle controls, keyboard photo viewing, book preference persistence, the cached
shared-image regression, navigation/recomposition, Stay playback, reduced motion,
and the no-JavaScript fallback. Output is under ignored `lab/`.

The Scroll-craft harness is run separately against the live reads on desktop,
phone, and reduced motion. Those runs sample actual scroll frames and produce
contact sheets; raw evidence stays in ignored `lab/premium-final-*`.

No production submissions are made for QA. Real iPhone hardware, Safari decoding,
and low-power behavior cannot be certified by the Chrome emulation runs.

### Result of the review

- Three complete Scroll-craft walkthroughs, with 143 sampled frames across
  desktop, phone, and reduced motion. No dead scroll or JavaScript exceptions.
  The phone rerun waits for the live contribution data before measuring the page;
  its evidence is `lab/premium-phone-ready/`. Earlier sheets are retained.
- Visual review caught and corrected the cached-photo blank frame, small-screen
  book control clipping, and the duplicate anchor offset caused by the fixed
  header. Final book-control bottoms were 864/1000px (desktop), 718/844px (phone),
  and 542/640px (compact), all above the fixed contact strip.
- The nine interaction groups in `lab/premium-interactions/results.json` passed.
  All submission outcomes use isolated test data. The live database was read only.
- Final `/memorial/` package-path checks loaded the current archive/contributions
  on 1600×1000, 390×844, and 360×640 viewports without horizontal overflow or
  runtime exceptions. Pointer-state screenshots show the photographic mount moves.
- Palette ratios: primary ink 8.95:1, accent 4.70:1, secondary ink on the darkest
  paper 5.27:1, input boundaries 3.83:1, and placeholders 4.84:1. The harness also
  measured the closing cue against its rendered ground; this is not a claim of
  full WCAG certification.
- Feel check: recognition / tenderness / closeness / stillness / connection /
  familiarity / belonging / affection. The initial hidden photograph contradicted
  recognition; the immediate photographic opening fixes that. The blank shared
  photographs interrupted closeness; the cached-image fix and retained previous
  print correct it. The album remains the largest scroll span and the final phrase
  resolves visibly.
- Raw desktop/reduced logs include aborted long-poll Firestore listener requests;
  live content did arrive. The phone-ready run has no failed requests. Local
  proxy-path and premature no-JS layout probes were superseded by direct-path and
  loaded-stylesheet checks. No source photo, video, or shared engine file changed.
