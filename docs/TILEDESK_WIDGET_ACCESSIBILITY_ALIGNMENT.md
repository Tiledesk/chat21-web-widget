# Tiledesk Chat Widget — Accessibility Alignment Statement

> **Consolidated edition:** For the full statement including all inventory tables and checklists, see [`TILEDESK_WIDGET_ACCESSIBILITY_STATEMENT_COMPLETE.md`](./TILEDESK_WIDGET_ACCESSIBILITY_STATEMENT_COMPLETE.md).

**Product:** Tiledesk web chat widget (Angular 18 application, iframe-hosted)  
**Document type:** Alignment and engineering posture statement  
**Language:** English  
**Date:** 12 May 2026

---

## 1. Purpose and scope

This statement describes how the Tiledesk chat widget product line positions its user interface engineering relative to internationally recognised accessibility norms. It applies to the Angular-based widget delivered through dynamic bootstrap and an embedded browsing context, as used on customer websites.

The scope is the interactive widget experience (launcher, conversations, forms, media, and related overlays) as implemented in this codebase.

---

## 2. Reference frameworks (informative)

Accessibility work on this product is informed by the following technical and regulatory reference layers, which organisations commonly use when specifying digital accessibility for public-sector procurement and enterprise risk management:

| Reference | Role in product engineering |
|-----------|----------------------------|
| **W3C Web Content Accessibility Guidelines (WCAG) 2.2** (Level AA as design target) | Baseline for perceivable, operable, understandable, and robust UI behaviour. |
| **W3C Accessible Rich Internet Applications (WAI-ARIA) 1.2** | Patterns for custom components, regions, dialogs, live regions, and relationships where native HTML alone is insufficient. |
| **ETSI EN 301 549** (European accessibility standard for ICT products and services, including WCAG 2.x-aligned requirements) | Used as a procurement and conformity *reference* when customers require European accessibility clauses in contracts or technical specifications. |

This document is an **alignment statement**. It describes the product’s accessibility engineering approach and current posture. It is **not** a legal certificate, VPAT, or third-party audit report. Formal conformity claims for a specific deployment remain the responsibility of the deploying organisation and are typically supported by independent evaluation against the applicable version of WCAG and any regional transposition of EN 301 549.

---

## 3. State of the art (engineering posture)

The widget is implemented as a focused single-page application within an iframe, with a parent-page bootstrap script responsible for embedding. Engineering attention is directed toward:

- **Semantic controls and naming:** Primary navigation and chrome actions are implemented with native `button` elements where the interaction model is activational; icon-only controls are paired with translatable `aria-label` (or equivalent) text drawn from the product’s translation maps.
- **Structured regions and bypass:** Conversation views use landmark-style regions (for example `role="region"`) and documented skip affordances so keyboard users can move efficiently to the message composer.
- **Modal and overlay semantics:** Key flows such as customer satisfaction rating, department selection, and pre-chat entry use dialog semantics (`role="dialog"`, `aria-modal`, labelling) consistent with WAI-ARIA dialog guidance.
- **Forms and errors:** Dynamic form fields support programmatic association of labels, required state, invalid state, and error descriptions via ARIA relationships; error content uses assertive live semantics where appropriate for time-sensitive feedback.
- **Rich content:** Components for audio playback, carousels, and image preview follow patterns that expose control state (for example pressed/playing) and decorative graphics are marked non-exposed to assistive technologies where suitable.
- **Motion and perception:** Stylesheets include reduced-motion handling so that users who prefer less animation receive a calmer visual experience.
- **Embedding context:** The host iframe is given a descriptive title in the bootstrap layer so that the embedded application is identifiable in browsing contexts that surface frame titles.

Testing and quality assurance combine unit-level template checks, end-to-end UI automation where configured, and manual verification scenarios with major assistive technology and keyboard-only usage, in line with common industry practice for complex widgets.

---

## 4. Continuous alignment

Tiledesk continues, day by day, to track evolving accessibility standards and platform behaviour across browsers and assistive technologies. The goal is to broaden coverage of WCAG-oriented success criteria, WAI-ARIA authoring practices, and EN 301 549–aligned expectations wherever they apply to this product category, and to reflect those expectations in design, implementation, and release testing. This is an ongoing process: standards and user-agent implementations change, and the product’s accessibility posture is maintained as part of normal engineering lifecycle rather than as a one-time checklist.

---

## 5. Use of this document

This statement may be shared with customers, integrators, or accessibility specialists as **context** for how the widget is built and maintained. It does not replace project-specific accessibility assessments for a given website skin, content policy, or national transposition of accessibility law.

For questions about this statement or accessibility in a specific deployment, contact Tiledesk through your usual commercial or support channel.
