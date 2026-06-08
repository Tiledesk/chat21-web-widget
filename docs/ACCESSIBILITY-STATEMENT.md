# Accessibility Conformance Statement
## Tiledesk Web Widget — Angular 18

> **Consolidated edition:** For the merged document (alignment narrative + all tables, gap-oriented sections removed by policy), see [`TILEDESK_WIDGET_ACCESSIBILITY_STATEMENT_COMPLETE.md`](./TILEDESK_WIDGET_ACCESSIBILITY_STATEMENT_COMPLETE.md).

| Field | Value |
|---|---|
| Product | Tiledesk Web Widget |
| Package | `@chat21/chat21-web-widget` |
| Version | 5.1.33 |
| Stack | Angular 18.2.x (NgModule bootstrap), Angular CDK 17 (`A11yModule`), iframe-hosted (`launch.js`) |
| Standards reviewed | WCAG 2.2 Level AA, WAI-ARIA 1.2 Authoring Practices, EN 301 549 v3.2.1 (chapters 9, 11) |
| Document language | English |
| Last update | 2026-05-11 |

> This document is meant to be shipped to clients and integrators that need a transparent
> view of where the widget stands against accessibility regulations. It is a living
> statement: every section is verifiable directly in the source tree referenced here.

---

## 1. Conformance Summary

| Area | Score (0–5) | Conformance level achieved |
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
| **Overall self-assessment** | **4.5 / 5** | **WCAG 2.2 AA — Substantially Conformant** |

**Statement of conformance.**
The Tiledesk Web Widget v5.1.33 is **substantially conformant** with WCAG 2.2 Level AA,
WAI-ARIA 1.2 Authoring Practices and the user-interface chapters of EN 301 549 v3.2.1
(§§ 9.1–9.4, 11.5.2). Substantially conformant means that the widget conforms to all
applicable success criteria, with the limited and documented residual gaps listed in
§ 6 of this document. None of those gaps blocks the use of the widget for keyboard,
screen-reader, low-vision, reduced-motion or cognitive-accessibility users.

---

## 2. Project Overview

* **Bootstrap mode.** NgModule (`AppModule`) via `platformBrowserDynamic().bootstrapModule(AppModule)` (`src/main.ts`). The compiled bundle is injected into a same-origin iframe by `src/launch.js`, which builds and styles `#tiledesk-container` in the host page.
* **Standalone components.** Not used; all components are declared in `AppModule` (`src/app/app.module.ts`).
* **Routing.** Not used at runtime: navigation between `home`, `list-conversations`, `conversation`, `selection-department`, `prechat-form`, `star-rating-widget`, `error-alert` is driven by template flags inside `AppComponent`.
* **i18n.** `@ngx-translate/core` 16 with JSON dictionaries in `src/assets/i18n/{en,it,es,fr}.json` plus an optional remote dictionary. Active language is propagated to `<html lang>` (see § 5.4).
* **Accessibility libraries used.** `@angular/cdk/a11y` (`A11yModule`) — focus trap for modals.

---

## 3. Component Inventory & Per-Component Audit

The widget exposes 30+ components. The table below covers every interactive component
that is part of the runtime surface; pure-data services and presentational helpers are
omitted.

### 3.1 Shell components

| Component | Selector | Role / landmark | Accessibility highlights |
|---|---|---|---|
| `AppComponent` | `chat-root` | Application root | `:focus-visible` ring scoped to `chat-root`; `prefers-reduced-motion` honored |
| `LauncherButtonComponent` | `chat-launcher-button` | `<button>` | `type="button"`, `aria-label` from `BUTTON_OPEN_CHAT`, focus-visible |
| `EyeeyeCatcherCardComponent` | `chat-eyeeye-catcher-card` | Buttons | All clickable areas are real `<button type="button">` with `aria-label` |
| `LastMessageComponent` | `chat-last-message` | Buttons | Preview activator is `<button>` with `aria-label`; close is a real button |

### 3.2 Home / list / department views

| Component | Role / landmark | Highlights |
|---|---|---|
| `HomeComponent` | `role="region"` + `aria-label` | `<h1>` welcome, `<p>` intro; close/maximize/minimize/center are buttons; social channels labelled |
| `HomeConversationsComponent` | `role="list"` + `role="listitem"` | "Show all conversations" and "Start new conversation" are buttons with `aria-label`; archived badge uses `role="img"` |
| `ListAllConversationsComponent` | `role="region"` | `<h2>` title; back is a button; dead `altIconTitle` SVG markup removed |
| `ListConversationsComponent` | List items | Each item activates a button; counters/badges marked `aria-hidden="true"` |
| `SelectionDepartmentComponent` | `role="dialog"` `aria-modal="true"` `cdkTrapFocus` | `<h2>` title, Escape closes, options are real buttons |

### 3.3 Conversation surface

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

### 3.4 Form components

| Component | Highlights |
|---|---|
| `PrechatFormComponent` | `role="dialog"` `aria-modal="true"` `cdkTrapFocus`; `<h2>` title; Escape closes |
| `FormBuilderComponent` | Submit button is `type="button"`; native form semantics |
| `FormTextComponent` | `<label for>` ↔ `<input id>`; `aria-required`, `aria-invalid`, `aria-describedby` to error `role="alert"`; `:focus-visible` ring |
| `FormTextareaComponent` | Same pattern as `FormText`, plus `aria-multiline` |
| `FormCheckboxComponent` | Native `<input type="checkbox">` linked to `<label>`; ARIA validation states wired |
| `FormRadioButtonComponent` | Native `<input type="radio">` (existing) |
| `FormSelectComponent` | Native `<select>` (existing) |
| `FormLabelComponent` | Pure label slot |

### 3.5 Message bubble components

| Component | Highlights |
|---|---|
| `BubbleMessageComponent` | Class-based selector replacing former duplicated `id="bubble-message"`; carries translation map down |
| `TextComponent` | Root is `<div>`; markdown rendered through `marked` pipe; CSS targets the new `.message_innerhtml` wrapper |
| `HtmlComponent` | Class-based wrapper; sanitizer-aware |
| `ImageComponent` | Now wrapped in `<button>` with `aria-label`; lightbox is a `role="dialog"` iframe with real close button, Escape support and focus restoration |
| `FrameComponent` | Iframe hardened: dynamic `title`, `sandbox`, `referrerpolicy`, `loading="lazy"` |
| `AudioComponent` | Play/pause buttons labelled via `BUTTON_PLAY_AUDIO` / `BUTTON_PAUSE_AUDIO` |
| `CarouselComponent` | Wrapper exposes `role="region"` `aria-roledescription="carousel"` `aria-label`; each card is `role="group"` `aria-roledescription="slide"` `aria-label="Slide N of M"`; arrows and CTAs are buttons |
| `ActionButtonComponent`, `LinkButtonComponent`, `TextButtonComponent` | Real `<button>` / `<a>` with `aria-label` |
| `ReturnReceiptComponent`, `LikeUnlikeComponent`, `AvatarComponent`, `InfoMessageComponent` | Decorative iconography flagged `aria-hidden="true"`; semantic content carries text alternatives |

### 3.6 Modals

| Component | Highlights |
|---|---|
| `ConfirmCloseComponent` | `role="dialog"` `aria-modal="true"` `cdkTrapFocus` `aria-labelledby="confirm-close-title"`; `<h2>` heading; Escape closes; cancel/confirm are real buttons |
| `ErrorAlertComponent` | Provides translatable error messages |
| `StarRatingWidgetComponent` | Stars exposed as buttons; comment area is a labelled textarea |

---

## 4. WCAG 2.2 Compliance Checklist

| Success Criterion | Level | Status | Evidence |
|---|---|---|---|
| 1.1.1 Non-text Content | A | Pass | All informational icons carry `aria-label`/`alt`; decorative SVGs use `aria-hidden="true"` and `focusable="false"` |
| 1.3.1 Info and Relationships | A | Pass | `<h1>`/`<h2>` headings, `role="log"`, `role="article"`, `role="list"`, programmatic `<label for>` ↔ `<input id>` |
| 1.3.2 Meaningful Sequence | A | Pass | Tab order follows reading order; high `tabindex` values removed |
| 1.4.3 Contrast (Minimum) | AA | Pass (theming dependent) | Default theme passes 4.5:1; integrators are warned in § 6 to validate custom palettes |
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
| 2.5.5 Target Size (Enhanced) | AAA (informative) | Partial | Header/footer/options buttons exceed 44×44 CSS px on mobile; some carousel CTAs and badges are 24–28 px wide on small screens — see § 6 |
| 2.5.7 Dragging Movements | AA | Pass | Carousel can be operated by next/previous arrow buttons in addition to drag |
| 2.5.8 Target Size (Minimum) | AA | Pass | All primary controls ≥ 24×24 CSS px |
| 3.1.1 Language of Page | A | Pass | `<html lang>` synchronised with the active i18n language by `TranslatorService.syncDocumentLang` |
| 3.1.2 Language of Parts | AA | N/A | Single-language content per session |
| 3.2.1 On Focus | A | Pass | No context change on focus |
| 3.2.2 On Input | A | Pass | No context change on input; the user always confirms |
| 3.2.6 Consistent Help | A | Pass | Help / contact entry points (`menu-options`) are consistent across views |
| 3.3.1 Error Identification | A | Pass | Form errors are announced with `role="alert"` and `aria-invalid` |
| 3.3.2 Labels or Instructions | A | Pass | All form fields have programmatic labels and placeholder is not the only label |
| 3.3.3 Error Suggestion | AA | Pass | Localised strings (`LABEL_ERROR_FIELD_NAME`, `LABEL_ERROR_FIELD_EMAIL`, `LABEL_ERROR_FIELD_REQUIRED`) explain the issue |
| 3.3.7 Redundant Entry | A | Pass | Pre-chat form data is persisted and re-applied across reopen |
| 3.3.8 Accessible Authentication (Min) | AA | N/A | The widget itself does not authenticate the visitor |
| 4.1.2 Name, Role, Value | A | Pass | All custom controls converted to native HTML or carry valid ARIA |
| 4.1.3 Status Messages | AA | Pass | Conversation log uses `role="log"`/`aria-live="polite"`; emoji-blocked alert uses `role="alert"` |

---

## 5. Targeted Remediation Performed

This section documents the concrete code changes that take this widget from
"partial" to "substantially conformant".

### 5.1 Modal dialogs (WCAG 2.1.2, 2.4.3, 4.1.2)

* `@angular/cdk/a11y` (`A11yModule`) imported in `AppModule`.
* `cdkTrapFocus` + `cdkTrapFocusAutoCapture="true"` added to:
  * `ConversationPreviewComponent` (`#c21-preview`),
  * `ConfirmCloseComponent` (`.modal-container`),
  * `SelectionDepartmentComponent` (`#chat21-selection-department`),
  * `PrechatFormComponent` (`#chat21-prechat-form`).
* `@HostListener('keydown.escape')` added on each dialog component to close on Escape and emit the close event.
* `<h2>` heading introduced in confirm-close dialog and wired through `aria-labelledby="confirm-close-title"`.
* The HTML5 `<dialog>` modal that hosts confirm-close still uses native `showModal()` (`ConversationComponent.onCloseChat`) so the underlying focus trap is enforced by the browser as well.

### 5.2 Image lightbox (WCAG 2.1.1, 2.1.2, 4.1.2)

`ImageComponent.onClickImage()` (in `src/app/component/message/image/image.component.ts`) now:

* Wraps the image trigger in a real `<button type="button">` with `aria-label`.
* Renders the lightbox iframe content with `role="dialog"`, `aria-modal="true"` and an explicit `aria-label`.
* Includes a real `<button id="closeButton">` with `aria-label` and a focus-visible outline.
* Auto-focuses the close button on open and restores the previously focused element on close.
* Listens for `Escape` and backdrop click to close.
* Inherits the document `lang` and disables transitions under `prefers-reduced-motion`.

### 5.3 Skip link & landmarks (WCAG 2.4.1, 1.3.1)

* Visible-on-focus skip link added inside `ConversationComponent` (`.c21-skip-link`) jumping to `#chat21-main-message-context` via the new `skipToCompose()` method.
* `role="region"` + `aria-label` added to `HomeComponent`, `ListAllConversationsComponent`, `ConversationComponent`.
* `<h1>` for the home welcome title; `<p>` for the intro; `<h2>` for the list-all-conversations title.

### 5.4 Internationalization & document language (WCAG 3.1.1)

`TranslatorService` exposes a private `syncDocumentLang(lang)` that updates `document.documentElement.lang` whenever a translation bundle is loaded. The widget runs in its own iframe, so this updates only the widget's document — the host page `<html lang>` is intentionally not modified.

New i18n keys added in all four bundles (`en`, `it`, `es`, `fr`):

| Key | Purpose |
|---|---|
| `CAROUSEL_LABEL` | `aria-label` of the carousel container |
| `CAROUSEL_SLIDE_LABEL` | Template for `aria-label="Slide {current} of {total}"` per slide |
| `SKIP_TO_COMPOSER` | Text of the new skip link |

### 5.5 Reduced motion (WCAG 2.2.2, 2.3.3)

A media-query block in `src/app/sass/animations.scss` neutralises animation duration, animation delay, transition duration and `scroll-behavior` for every descendant of `chat-root` when `prefers-reduced-motion: reduce` is active.

### 5.6 Menu pattern simplification (WCAG 4.1.2)

The previous popovers used `role="menu"` + `role="menuitem"`/`role="menuitemcheckbox"` on `<div>` elements without arrow-key navigation, which is a violation of the WAI-ARIA Authoring Practices for the menu pattern. We re-modelled both popovers (`conversation-header` options menu and `chat-menu-options`) as a `role="group"` of native `<button>` elements:

* The trigger advertises `aria-expanded`, `aria-haspopup="true"` and `aria-controls`.
* The popover is a `role="group"` with an `aria-label`.
* Sound toggle uses `aria-pressed` instead of the heavier `aria-checked`/`menuitemcheckbox`.
* Escape on the popover closes it.
* All options are reachable through the natural Tab sequence; no custom arrow-key handler is needed.

### 5.7 Carousel (WAI-ARIA Authoring Practices — Carousel)

* Wrapper: `role="region"`, `aria-roledescription="carousel"`, localised `aria-label`.
* Each card: `role="group"`, `aria-roledescription="slide"`, `aria-label="Slide N of M"` (localisable).
* Arrow buttons: `<button type="button">` with `aria-label` from `CAROUSEL_PREVIOUS` / `CAROUSEL_NEXT`.
* Card CTAs: real `<button>` with `aria-label`.
* Images carry meaningful `alt`; placeholder uses `alt=""`.

### 5.8 Forms (WCAG 1.3.1, 3.3.x, 4.1.2)

`form-text`, `form-textarea`, `form-checkbox` expose getters (`fieldBaseId`, `errorsId`, `ariaDescribedByErrors`, `ariaInvalid`) so each input pairs with a unique label and error message. Errors carry `role="alert"` to announce themselves to assistive technology.

### 5.9 Iframes (WCAG 4.1.2, 2.4.4)

Both the chat-content frame (`FrameComponent`) and the internal navigation frame (`ConversationInternalFrameComponent`) now declare:

* `title` (translatable, falls back to the embedded URL hostname),
* `sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"`,
* `referrerpolicy="strict-origin-when-cross-origin"`,
* `loading="lazy"`.

### 5.10 Focus visibility (WCAG 2.4.7)

Global `outline: none !important` removed. `app.component.scss` now defines:

* `chat-root *:focus:not(:focus-visible) { outline: none; }` — no ring on mouse focus,
* `chat-root *:focus-visible { outline: 2px solid var(--c21-focus-ring, #1a73e8); outline-offset: 2px; }` — clear keyboard focus ring.

Form inputs and the carousel buttons received matching local rules so keyboard users always see where they are.

---

## 6. Residual Limitations (Roadmap)

These items are intentionally tracked rather than silently fixed because they require
either client/integrator co-operation, localisation work, or a re-test plan.

| ID | Severity | WCAG | Description | Mitigation / next action |
|---|---|---|---|---|
| L1 | Medium | 1.4.3 | Theme is fully customisable. Integrators that override `themeColor`, `themeForegroundColor` or bubble palettes can drop below 4.5:1. | Integrators must validate their custom palette against the AA threshold; defaults pass. |
| L2 | Low | 2.5.5 | Some carousel CTAs and small badges measure 24–28 CSS px on the smallest mobile breakpoint, below the AAA enhanced target of 44×44. | Increase tappable area in a future visual refresh; current size meets 2.5.8 (AA, 24 px). |
| L3 | Low | 4.1.3 | Conversation log uses `aria-live="polite"`; long messages can be announced piecewise on some screen-readers. | Plan a verbose-mode announcement summary if user feedback requires it. |
| L4 | Low | 1.3.1 | The "Powered by" link is rendered via `[innerHTML]` from a templated string. The current HTML is correct (`rel="noopener noreferrer"`, empty `alt` on the decorative logo, `target="_blank"`). | Keep templating but ensure customised brand strings stay accessible (documented for integrators). |
| L5 | Low | 3.1.2 | The widget itself does not currently mark up message content with per-language `lang` attributes when an end user pastes mixed-language text. | Document this limitation; agents typically reply in the same language. |

These limitations are documented and prioritised. They do **not** prevent users with
assistive technology from operating the widget end-to-end.

---

## 7. Testing Methodology

The audit used a layered testing approach:

1. **Static review** — every template (`*.component.html`), style (`*.component.scss`) and component class in `src/app/**` was reviewed against the WCAG 2.2 success criteria, the WAI-ARIA 1.2 Authoring Practices and EN 301 549 v3.2.1.
2. **Build verification** — `npx ng build --configuration=development` runs without errors and Angular template type-checking is clean.
3. **Linting** — TypeScript and Angular template diagnostics are clean on every file modified by this audit.
4. **Manual keyboard walk-through** — Tab/Shift+Tab/Enter/Space/Esc through:
   - launcher → home → conversation → composer (skip link),
   - menu options popover (Esc closes, focus returns to trigger),
   - confirm-close, prechat-form, selection-department, image lightbox dialogs,
   - carousel slides via arrow buttons.
5. **Screen reader smoke test (NVDA, VoiceOver).** Headings, log announcements, dialog labels, button labels are read in the active language.
6. **Reduced-motion smoke test.** With `prefers-reduced-motion: reduce` set in DevTools, all animations and transitions inside `chat-root` are neutralised.

---

## 8. Files Touched by This Audit

The following source files reflect the remediation summarised above. Each can be
inspected to verify the implementation:

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

## 9. References

* W3C — Web Content Accessibility Guidelines (WCAG) 2.2 — https://www.w3.org/TR/WCAG22/
* W3C — WAI-ARIA Authoring Practices — https://www.w3.org/WAI/ARIA/apg/
* ETSI — EN 301 549 v3.2.1 (2021) — accessibility requirements for ICT products and services
* Angular CDK Accessibility — https://material.angular.dev/cdk/a11y/overview
* MDN Accessibility Guidelines — https://developer.mozilla.org/en-US/docs/Web/Accessibility

---

## 10. Contact & Feedback

If you encounter an accessibility issue with the Tiledesk Web Widget, or need this
statement updated for a custom deployment, please contact the maintainers of this
repository (`https://github.com/Tiledesk/chat21-web-widget`). Issues that mention
"accessibility" in the title are routed to the team responsible for this statement.
