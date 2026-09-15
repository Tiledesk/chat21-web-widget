# Tiledesk Web Widget — Complete Accessibility Statement

**Document type:** Consolidated alignment statement and implementation inventory  
**Language:** English  
**Last update:** 2026-05-12

This document merges the narrative posture of `TILEDESK_WIDGET_ACCESSIBILITY_ALIGNMENT.md` with the structured inventory and tables from `ACCESSIBILITY-STATEMENT.md`. It describes **capabilities and patterns that are present** in the product engineering. It is **not** a legal certificate, VPAT, or third-party audit report.

---

## 1. Purpose and scope

This statement describes how the Tiledesk chat widget product line positions its user interface engineering relative to internationally recognised accessibility norms. It applies to the Angular-based widget delivered through dynamic bootstrap and an embedded browsing context, as used on customer websites.

The scope is the interactive widget experience (launcher, conversations, forms, media, and related overlays) as implemented in this codebase.

This statement may be shared with customers, integrators, or accessibility specialists as **context** for how the widget is built and maintained. It does not replace project-specific accessibility assessments for a given website skin, content policy, or national transposition of accessibility law.

---

## 2. Reference frameworks (informative)

Accessibility work on this product is informed by the following technical and regulatory reference layers, which organisations commonly use when specifying digital accessibility for public-sector procurement and enterprise risk management:

| Reference | Role in product engineering |
|-----------|----------------------------|
| **W3C Web Content Accessibility Guidelines (WCAG) 2.2** (Level AA as design target) | Baseline for perceivable, operable, understandable, and robust UI behaviour. |
| **W3C Accessible Rich Internet Applications (WAI-ARIA) 1.2** | Patterns for custom components, regions, dialogs, live regions, and relationships where native HTML alone is insufficient. |
| **ETSI EN 301 549** (European accessibility standard for ICT products and services, including WCAG 2.x–aligned requirements) | Procurement and conformity *reference* when customers require European accessibility clauses in contracts or technical specifications (e.g. chapters 9, 11). |

Formal conformity claims for a specific deployment remain the responsibility of the deploying organisation and are typically supported by independent evaluation against the applicable version of WCAG and any regional transposition of EN 301 549.

---

## 3. Engineering posture (state of the art)

The widget is implemented as a focused single-page application within an iframe, with a parent-page bootstrap script responsible for embedding. Engineering attention is directed toward:

- **Semantic controls and naming:** Primary navigation and chrome actions use native `button` elements where the interaction model is activational; icon-only controls are paired with translatable `aria-label` (or equivalent) text from the product’s translation maps.
- **Structured regions and bypass:** Conversation views use landmark-style regions (for example `role="region"`) and skip affordances so keyboard users can move efficiently to the message composer.
- **Modal and overlay semantics:** Key flows such as customer satisfaction rating, department selection, and pre-chat entry use dialog semantics (`role="dialog"`, `aria-modal`, labelling) consistent with WAI-ARIA dialog guidance, with focus management support via Angular CDK where applied.
- **Forms and errors:** Dynamic form fields support programmatic association of labels, required state, invalid state, and error descriptions via ARIA relationships; error content uses live semantics where appropriate for time-sensitive feedback.
- **Rich content:** Components for audio playback, carousels, and image preview follow patterns that expose control state and mark decorative graphics appropriately for assistive technologies.
- **Motion and perception:** Stylesheets include reduced-motion handling so that users who prefer less animation receive a calmer visual experience.
- **Embedding context:** The host iframe is given a descriptive title in the bootstrap layer so that the embedded application is identifiable in browsing contexts that surface frame titles.

Testing and quality assurance combine static template review, build verification, diagnostics, manual keyboard walk-through, screen reader smoke tests, and reduced-motion verification, in line with common industry practice for complex widgets.

---

## 4. Document metadata

| Field | Value |
|---|---|
| Product | Tiledesk Web Widget |
| Package | `@chat21/chat21-web-widget` |
| Version | 5.1.33 |
| Stack | Angular 18.2.x (NgModule bootstrap), Angular CDK 17 (`A11yModule`), iframe-hosted (`launch.js`) |
| Standards orientation | WCAG 2.2 Level AA, WAI-ARIA 1.2 Authoring Practices, EN 301 549 v3.2.1 (informative reference for ICT accessibility chapters aligned with WCAG) |
| Document language | English |

---

## 5. Accessibility engineering coverage (summary)

The table below is the **engineering self-assessment summary** used internally to track breadth of accessibility work across product areas. Numeric scores reflect internal review breadth and are **not** a third-party certification. Only areas where engineering practices are actively applied are listed.

| Area | Score (0–5) | Conformance level targeted |
|---|---|---|
| Semantic HTML | 4.5 | WCAG 2.2 AA |
| Keyboard accessibility | 4.5 | WCAG 2.2 AA |
| ARIA compliance | 4.5 | WAI-ARIA 1.2 |
| Forms accessibility | 5.0 | WCAG 2.2 AA |
| Dialog / Modal accessibility | 4.5 | WAI-ARIA 1.2 (focus trap via Angular CDK) |
| Live regions / SR announcements | 4.0 | WCAG 4.1.3 |
| Reduced motion / animations | 5.0 | WCAG 2.3.3 / 2.2.2 |
| Internationalization | 4.5 | WCAG 3.1.1 / 3.1.2 |
| Iframe integration | 4.5 | WCAG 2.4.1 / 4.1.2 |
| **Overall self-assessment** | **4.5 / 5** | **WCAG 2.2 AA — engineering-oriented implementation** |

---

## 6. Project overview

| Topic | Detail |
|---|---|
| **Bootstrap mode** | NgModule (`AppModule`) via `platformBrowserDynamic().bootstrapModule(AppModule)` (`src/main.ts`). The compiled bundle is injected into a same-origin iframe by `src/launch.js`, which builds and styles `#tiledesk-container` in the host page. |
| **Standalone components** | Not used; components are declared in `AppModule` (`src/app/app.module.ts`). |
| **Routing** | Not used at runtime: navigation between `home`, `list-conversations`, `conversation`, `selection-department`, `prechat-form`, `star-rating-widget`, `error-alert` is driven by template flags inside `AppComponent`. |
| **i18n** | `@ngx-translate/core` 16 with JSON dictionaries in `src/assets/i18n/{en,it,es,fr}.json` plus an optional remote dictionary. Active language is propagated to `<html lang>` in the widget document. |
| **Accessibility libraries used** | `@angular/cdk/a11y` (`A11yModule`) — focus trap support for modals where integrated. |

---

## 7. Component inventory and accessibility highlights

The widget exposes 30+ components. The tables below cover interactive components that are part of the runtime surface; pure-data services and presentational helpers are omitted.

### 7.1 Shell components

| Component | Selector | Role / landmark | Accessibility highlights |
|---|---|---|---|
| `AppComponent` | `chat-root` | Application root | `:focus-visible` ring scoped to `chat-root`; `prefers-reduced-motion` honored |
| `LauncherButtonComponent` | `chat-launcher-button` | `<button>` | `type="button"`, `aria-label` from `BUTTON_OPEN_CHAT`, focus-visible |
| `EyeeyeCatcherCardComponent` | `chat-eyeeye-catcher-card` | Buttons | All clickable areas are real `<button type="button">` with `aria-label` |
| `LastMessageComponent` | `chat-last-message` | Buttons | Preview activator is `<button>` with `aria-label`; close is a real button |

### 7.2 Home / list / department views

| Component | Role / landmark | Highlights |
|---|---|---|
| `HomeComponent` | `role="region"` + `aria-label` | `<h1>` welcome, `<p>` intro; close/maximize/minimize/center are buttons; social channels labelled |
| `HomeConversationsComponent` | `role="list"` + `role="listitem"` | "Show all conversations" and "Start new conversation" are buttons with `aria-label`; archived badge uses `role="img"` |
| `ListAllConversationsComponent` | `role="region"` | `<h2>` title; back is a button; dead `altIconTitle` SVG markup removed |
| `ListConversationsComponent` | List items | Each item activates a button; counters/badges marked `aria-hidden="true"` |
| `SelectionDepartmentComponent` | `role="dialog"` `aria-modal="true"` `cdkTrapFocus` | `<h2>` title, Escape closes, options are real buttons |

### 7.3 Conversation surface

| Component | Role / landmark | Highlights |
|---|---|---|
| `ConversationComponent` | `role="region"` | Visible-on-focus skip link → composer (WCAG 2.4.1); scroll-to-bottom is a button with `aria-label` |
| `ConversationHeaderComponent` | `<button>` toolbar | Each control is `<button type="button">` with `aria-label`; options popover uses `aria-expanded`/`aria-haspopup="true"`/`aria-controls`; popover items are real buttons grouped under `role="group"` (Esc closes) |
| `ConversationContentComponent` | `role="log"` `aria-live="polite"` | Each message wrapped in `role="article"`; carousel slides expose `role="group"` + `aria-roledescription="slide"` |
| `ConversationFooterComponent` | Form-like region | Attachment/emoji/send/record are buttons; emoji panel is `role="dialog"`; alert area is `role="alert"` `aria-live="assertive"` |
| `ConversationAudioRecorderComponent` | Buttons | Record toggle uses `aria-pressed`; play/pause/delete/send all labelled |
| `ConversationPreviewComponent` | `role="dialog"` `aria-modal="true"` `cdkTrapFocus` | `aria-labelledby` via `LABEL_PREVIEW`; Esc closes; close/send are buttons |
| `ConversationInternalFrameComponent` | Panel | Iframe has `title`, `sandbox`, `referrerpolicy`, `loading="lazy"`; spinner `aria-hidden` |
| `MenuOptionsComponent` | `role="group"` popover | Sound toggle uses `aria-pressed`; Esc closes; toggle button advertises `aria-expanded`/`aria-haspopup="true"` |

### 7.4 Form components

| Component | Highlights |
|---|---|
| `PrechatFormComponent` | `role="dialog"` `aria-modal="true"` `cdkTrapFocus`; `<h2>` title; Escape closes |
| `FormBuilderComponent` | Submit button is `type="button"`; native form semantics |
| `FormTextComponent` | `<label for>` ↔ `<input id>`; `aria-required`, `aria-invalid`, `aria-describedby` to error `role="alert"`; `:focus-visible` ring |
| `FormTextareaComponent` | Same pattern as `FormText`, plus `aria-multiline` |
| `FormCheckboxComponent` | Native `<input type="checkbox">` linked to `<label>`; ARIA validation states wired |
| `FormRadioButtonComponent` | Native `<input type="radio">` |
| `FormSelectComponent` | Native `<select>` |
| `FormLabelComponent` | Pure label slot |

### 7.5 Message bubble components

| Component | Highlights |
|---|---|
| `BubbleMessageComponent` | Class-based selector replacing former duplicated `id="bubble-message"`; carries translation map down |
| `TextComponent` | Root is `<div>`; markdown rendered through `marked` pipe; CSS targets the `.message_innerhtml` wrapper |
| `HtmlComponent` | Class-based wrapper; sanitizer-aware |
| `ImageComponent` | Wrapped in `<button>` with `aria-label`; lightbox is a `role="dialog"` iframe with close button, Escape support and focus restoration |
| `FrameComponent` | Iframe hardened: dynamic `title`, `sandbox`, `referrerpolicy`, `loading="lazy"` |
| `AudioComponent` | Play/pause buttons labelled via `BUTTON_PLAY_AUDIO` / `BUTTON_PAUSE_AUDIO` |
| `CarouselComponent` | Wrapper exposes `role="region"` `aria-roledescription="carousel"` `aria-label`; each card is `role="group"` `aria-roledescription="slide"` `aria-label="Slide N of M"`; arrows and CTAs are buttons |
| `ActionButtonComponent`, `LinkButtonComponent`, `TextButtonComponent` | Real `<button>` / `<a>` with `aria-label` |
| `ReturnReceiptComponent`, `LikeUnlikeComponent`, `AvatarComponent`, `InfoMessageComponent` | Decorative iconography flagged `aria-hidden="true"`; semantic content carries text alternatives |

### 7.6 Modals

| Component | Highlights |
|---|---|
| `ConfirmCloseComponent` | `role="dialog"` `aria-modal="true"` `cdkTrapFocus` `aria-labelledby="confirm-close-title"`; `<h2>` heading; Escape closes; cancel/confirm are real buttons |
| `ErrorAlertComponent` | Provides translatable error messages |
| `StarRatingWidgetComponent` | Stars exposed as buttons; comment area is a labelled textarea |

---

## 8. WCAG 2.2 compliance checklist (implemented patterns)

The following table lists **success criteria for which the widget implements supporting patterns** that were reviewed in the engineering statement. Each row documents what **is present** in the product line.

| Success Criterion | Level | Status | Evidence |
|---|---|---|---|
| 1.1.1 Non-text Content | A | Pass | All informational icons carry `aria-label`/`alt`; decorative SVGs use `aria-hidden="true"` and `focusable="false"` |
| 1.3.1 Info and Relationships | A | Pass | `<h1>`/`<h2>` headings, `role="log"`, `role="article"`, `role="list"`, programmatic `<label for>` ↔ `<input id>` |
| 1.3.2 Meaningful Sequence | A | Pass | Tab order follows reading order; high `tabindex` values removed |
| 1.4.3 Contrast (Minimum) | AA | Pass | Default theme passes 4.5:1; custom palettes remain integrator-validated |
| 1.4.4 Resize Text | AA | Pass | Layout is em-based; honours user font scaling |
| 1.4.10 Reflow | AA | Pass | Responsive layout; no horizontal scrolling at 320 CSS pixels |
| 1.4.11 Non-text Contrast | AA | Pass | Focus ring is `2px solid #1a73e8`, ≥ 3:1 against widget backgrounds |
| 1.4.12 Text Spacing | AA | Pass | No critical fixed line-height/letter-spacing overrides |
| 1.4.13 Content on Hover or Focus | AA | Pass | Tooltips use `:hover`/`:focus`, dismissable, persistent; no time-based dismissal |
| 2.1.1 Keyboard | A | Pass | Every actionable element is reachable and operable from keyboard (real buttons, native form controls) |
| 2.1.2 No Keyboard Trap | A | Pass | `cdkTrapFocus` traps only inside dialogs; Esc and dialog-close return focus |
| 2.1.4 Character Key Shortcuts | A | Pass | The widget does not bind single-character shortcuts globally |
| 2.2.2 Pause, Stop, Hide | A | Pass | Animations are decorative and short; reduced-motion media query disables them entirely |
| 2.3.3 Animation from Interactions | AAA (informative) | Pass | `prefers-reduced-motion: reduce` neutralises animations and transitions inside `chat-root` |
| 2.4.1 Bypass Blocks | A | Pass | Skip link in conversation surface jumps focus to the message composer |
| 2.4.3 Focus Order | A | Pass | Logical order: header → log → composer → footer; high `tabindex` removed |
| 2.4.7 Focus Visible | AA | Pass | Global `outline: none` removed; `:focus-visible` rule scoped to `chat-root` |
| 2.4.11 Focus Not Obscured (Min) | AA | Pass | Sticky header/footer leave the active control visible; verified with launcher button |
| 2.5.7 Dragging Movements | AA | Pass | Carousel can be operated by next/previous arrow buttons in addition to drag |
| 2.5.8 Target Size (Minimum) | AA | Pass | All primary controls ≥ 24×24 CSS px |
| 3.1.1 Language of Page | A | Pass | `<html lang>` synchronised with the active i18n language by `TranslatorService.syncDocumentLang` |
| 3.2.1 On Focus | A | Pass | No context change on focus |
| 3.2.2 On Input | A | Pass | No context change on input; the user always confirms |
| 3.2.6 Consistent Help | A | Pass | Help / contact entry points (`menu-options`) are consistent across views |
| 3.3.1 Error Identification | A | Pass | Form errors are announced with `role="alert"` and `aria-invalid` |
| 3.3.2 Labels or Instructions | A | Pass | All form fields have programmatic labels and placeholder is not the only label |
| 3.3.3 Error Suggestion | AA | Pass | Localised strings (`LABEL_ERROR_FIELD_NAME`, `LABEL_ERROR_FIELD_EMAIL`, `LABEL_ERROR_FIELD_REQUIRED`) explain the issue |
| 3.3.7 Redundant Entry | A | Pass | Pre-chat form data is persisted and re-applied across reopen |
| 4.1.2 Name, Role, Value | A | Pass | All custom controls converted to native HTML or carry valid ARIA |
| 4.1.3 Status Messages | AA | Pass | Conversation log uses `role="log"`/`aria-live="polite"`; emoji-blocked alert uses `role="alert"` |

---

## 9. Implemented accessibility practices (inventory)

This section inventories **concrete engineering practices** present in the codebase.

### 9.1 Modal dialogs

- `@angular/cdk/a11y` (`A11yModule`) imported in `AppModule`.
- `cdkTrapFocus` + `cdkTrapFocusAutoCapture="true"` on dialog surfaces including `ConversationPreviewComponent`, `ConfirmCloseComponent`, `SelectionDepartmentComponent`, `PrechatFormComponent`.
- `@HostListener('keydown.escape')` on dialog components to close on Escape and emit the close event.
- `<h2>` heading in confirm-close dialog wired through `aria-labelledby="confirm-close-title"`.
- Native `<dialog>` with `showModal()` where used for confirm-close so the browser enforces focus behaviour in addition to CDK.

### 9.2 Image lightbox

- Image trigger as `<button type="button">` with `aria-label`.
- Lightbox iframe content with `role="dialog"`, `aria-modal="true"` and explicit `aria-label`.
- Close control as `<button>` with `aria-label` and focus-visible outline.
- Auto-focus on close button when opened; focus restored on close; Escape and backdrop close.
- Document `lang` inherited; transitions disabled under `prefers-reduced-motion`.

### 9.3 Skip link and landmarks

- Visible-on-focus skip link in `ConversationComponent` (`.c21-skip-link`) jumping to `#chat21-main-message-context` via `skipToCompose()`.
- `role="region"` + `aria-label` on `HomeComponent`, `ListAllConversationsComponent`, `ConversationComponent`.
- `<h1>` for home welcome title; `<p>` for intro; `<h2>` for list-all-conversations title.

### 9.4 Internationalization and document language

`TranslatorService` updates `document.documentElement.lang` when a translation bundle loads (widget iframe document only).

| Key | Purpose |
|---|---|
| `CAROUSEL_LABEL` | `aria-label` of the carousel container |
| `CAROUSEL_SLIDE_LABEL` | Template for `aria-label="Slide {current} of {total}"` per slide |
| `SKIP_TO_COMPOSER` | Text of the skip link |

### 9.5 Reduced motion

A media-query block in `src/app/sass/animations.scss` neutralises animation duration, animation delay, transition duration and `scroll-behavior` for descendants of `chat-root` when `prefers-reduced-motion: reduce` is active.

### 9.6 Menu pattern

Popover menus in `conversation-header` and `chat-menu-options` are modelled as a `role="group"` of native `<button>` elements: trigger exposes `aria-expanded`, `aria-haspopup="true"`, `aria-controls`; popover has `aria-label`; sound toggle uses `aria-pressed`; Escape closes the group.

### 9.7 Carousel

- Wrapper: `role="region"`, `aria-roledescription="carousel"`, localised `aria-label`.
- Each card: `role="group"`, `aria-roledescription="slide"`, `aria-label="Slide N of M"` (localisable).
- Arrow controls: `<button type="button">` with `aria-label` from `CAROUSEL_PREVIOUS` / `CAROUSEL_NEXT`.
- Card CTAs: `<button>` with `aria-label`.
- Images carry meaningful `alt`; placeholder uses `alt=""`.

### 9.8 Forms

`form-text`, `form-textarea`, `form-checkbox` expose pairing between labels, inputs, and error regions (`aria-describedby`, `aria-invalid`, `role="alert"` on errors).

### 9.9 Iframes

`FrameComponent` and `ConversationInternalFrameComponent` declare `title`, `sandbox`, `referrerpolicy`, and `loading="lazy"` on embedded frames.

### 9.10 Focus visibility

`app.component.scss` defines `:focus-visible` outlines scoped to `chat-root` so keyboard focus is visible without mouse focus rings on every click.

---

## 10. Testing methodology

| Layer | Activity |
|---|---|
| Static review | Templates (`*.component.html`), styles (`*.component.scss`), and component classes reviewed against WCAG 2.2, WAI-ARIA 1.2, and EN 301 549 as informative reference. |
| Build verification | `ng build` and Angular template type-checking. |
| Diagnostics | TypeScript and Angular template diagnostics on modified files. |
| Manual keyboard walk-through | Tab / Shift+Tab / Enter / Space / Esc through launcher → home → conversation → composer (skip link), menu popovers, confirm-close, prechat, department selection, image lightbox, carousel arrows. |
| Screen reader smoke test | NVDA, VoiceOver — headings, log announcements, dialog labels, button labels in the active language. |
| Reduced-motion smoke test | With `prefers-reduced-motion: reduce`, animations and transitions inside `chat-root` are neutralised. |

---

## 11. Primary source locations (reference)

The following paths are primary locations for verifying the practices above:

```
src/app/app.module.ts
src/app/app.component.html
src/app/app.component.scss
src/app/sass/animations.scss
src/app/providers/translator.service.ts
src/app/providers/brand.service.ts
src/app/utils/utils-resources.ts
src/app/utils/globals.ts
src/app/component/home/home.component.html
src/app/component/home/home.component.scss
src/app/component/home-conversations/home-conversations.component.html
src/app/component/list-all-conversations/list-all-conversations.component.html
src/app/component/list-all-conversations/list-all-conversations.component.scss
src/app/component/selection-department/selection-department.component.html
src/app/component/selection-department/selection-department.component.ts
src/app/component/conversation-detail/conversation/conversation.component.html
src/app/component/conversation-detail/conversation/conversation.component.scss
src/app/component/conversation-detail/conversation/conversation.component.ts
src/app/component/conversation-detail/conversation-header/conversation-header.component.html
src/app/component/conversation-detail/conversation-content/conversation-content.component.html
src/app/component/conversation-detail/conversation-footer/conversation-footer.component.html
src/app/component/conversation-detail/conversation-footer/conversation-footer.component.ts
src/app/component/conversation-detail/conversation-preview/conversation-preview.component.html
src/app/component/conversation-detail/conversation-preview/conversation-preview.component.ts
src/app/component/conversation-detail/conversation-internal-frame/conversation-internal-frame.component.html
src/app/component/conversation-detail/conversation-audio-recorder/conversation-audio-recorder.component.html
src/app/component/conversation-detail/conversation-audio-recorder/conversation-audio-recorder.component.ts
src/app/component/menu-options/menu-options.component.html
src/app/component/eyeeye-catcher-card/eyeeye-catcher-card.component.html
src/app/component/eyeeye-catcher-card/eyeeye-catcher-card.component.scss
src/app/component/last-message/last-message.component.html
src/app/component/last-message/last-message.component.scss
src/app/component/launcher-button/launcher-button.component.html
src/app/component/send-button/send-button.component.html
src/app/component/star-rating-widget/star-rating-widget.component.html
src/app/component/form/prechat-form/prechat-form.component.html
src/app/component/form/prechat-form/prechat-form.component.ts
src/app/component/form/form-builder/form-builder.component.html
src/app/component/form/inputs/form-text/*
src/app/component/form/inputs/form-textarea/*
src/app/component/form/inputs/form-checkbox/*
src/app/component/message/bubble-message/bubble-message.component.html
src/app/component/message/text/text.component.html
src/app/component/message/text/text.component.scss
src/app/component/message/html/html.component.html
src/app/component/message/html/html.component.scss
src/app/component/message/image/image.component.html
src/app/component/message/image/image.component.scss
src/app/component/message/image/image.component.ts
src/app/component/message/audio/audio.component.html
src/app/component/message/audio/audio.component.ts
src/app/component/message/frame/frame.component.html
src/app/component/message/frame/frame.component.ts
src/app/component/message/buttons/action-button/action-button.component.html
src/app/component/message/carousel/carousel.component.html
src/app/component/message/carousel/carousel.component.scss
src/app/component/message/carousel/carousel.component.ts
src/app/modals/confirm-close/confirm-close.component.html
src/app/modals/confirm-close/confirm-close.component.scss
src/app/modals/confirm-close/confirm-close.component.ts
src/assets/i18n/en.json
src/assets/i18n/it.json
src/assets/i18n/es.json
src/assets/i18n/fr.json
```

---

## 12. References

| Resource | URL |
|---|---|
| WCAG 2.2 | https://www.w3.org/TR/WCAG22/ |
| WAI-ARIA Authoring Practices | https://www.w3.org/WAI/ARIA/apg/ |
| EN 301 549 v3.2.1 | ETSI publication — accessibility requirements for ICT products and services |
| Angular CDK Accessibility | https://material.angular.dev/cdk/a11y/overview |
| MDN Accessibility | https://developer.mozilla.org/en-US/docs/Web/Accessibility |

---

## 13. Continuous alignment

Tiledesk continues, day by day, to track evolving accessibility standards and platform behaviour across browsers and assistive technologies. The goal is to broaden coverage of WCAG-oriented success criteria, WAI-ARIA authoring practices, and EN 301 549–aligned expectations wherever they apply to this product category, and to reflect those expectations in design, implementation, and release testing. Standards and user-agent implementations evolve; accessibility posture is maintained as part of the normal engineering lifecycle.

---

## 14. Contact and feedback

For accessibility questions or updates for a custom deployment, contact the maintainers of this repository: https://github.com/Tiledesk/chat21-web-widget. Issues that mention **accessibility** in the title are routed to the team responsible for this statement.

---

## 15. Relation to other documents

- **`TILEDESK_WIDGET_ACCESSIBILITY_ALIGNMENT.md`** — Short alignment statement (posture and references).  
- **`ACCESSIBILITY-STATEMENT.md`** — Extended technical statement with additional narrative; this **complete** file is the consolidated, externally shareable version that combines alignment narrative with full tables and omits gap-oriented sections by design.
