# SamVidyaa — Landing Page Design Brief

**Prepared for:** Design
**Prepared by:** Product
**Status:** Ready for design exploration

---

## 0. How to read this brief

This document defines **what the landing page must communicate and let people do**. It **deliberately contains no visual direction** — no colours, typography, layout, imagery style, section order, or component look. Those decisions are entirely yours. The goal is to give you the product truth and the business goals with a clean slate so the concept comes from you.

Where a "must have" is listed, it is a *content or functional* requirement (e.g. "visitors must be able to create an account"), not a layout instruction. Feel free to arrange, prioritise, combine, or reimagine anything as long as the requirements below are met.

---

## 1. What the product is

**SamVidyaa** is a full-stack **learning and lab-management platform for colleges**. It brings coursework, hands-on lab/coding tasks, progress tracking, and student engagement into one place, with a workspace tailored to each type of user.

In one line (working description — copy is not final, see §11):
> A single platform where colleges run courses, set hands-on tasks, and keep students engaged through progress tracking, rewards, and an AI study assistant.

The platform serves three roles, each with its own experience once logged in:

| Role | What they do on the platform |
| --- | --- |
| **Student** | Enrol in courses, complete tasks (including hands-on coding/lab work), track their progress and history, earn points, claim rewards, climb leaderboards, collaborate with peers, and ask an AI assistant for help. |
| **Instructor / Teacher** | Create courses, modules, and tasks; import task documents and upload handouts; view course and student analytics; manage rewards; and post announcements. |
| **Admin** | Oversee the whole platform — courses, users, announcements, testimonials, and the downloadable desktop app. |

The landing page is the **public front door** for all of these people before they sign in.

---

## 2. Why the landing page exists (goals)

**Primary goal:** Convert the right visitors into registered users (and returning users back into the app).

**Secondary goals:**
- Explain what SamVidyaa is quickly and credibly to someone who has never heard of it.
- Establish trust/legitimacy (real usage numbers, real voices, clear contact).
- Distribute the **desktop companion app** to students who need it for lab/coding tasks.
- Give institutions/educators an easy way to make contact or enquire.

**How we'll judge success (KPIs):**
- Sign-up starts and completions from the page.
- Returning-user log-ins.
- Desktop app downloads.
- Contact/enquiry submissions.
- Bounce rate and time-to-first-meaningful-action.

---

## 3. Who we are talking to (audiences)

Design for these visitors, roughly in priority order:

1. **Prospective students** at a college that uses (or is adopting) SamVidyaa. Motivations: engaging way to learn, see their progress, earn rewards, get help, do practical coding work. This is the largest audience.
2. **Instructors / educators** evaluating whether the platform will save them time and give them insight into their students. Motivations: course/task management, analytics, keeping students engaged.
3. **Institutional decision-makers** (department heads, admins) assessing the platform for adoption. Motivations: credibility, breadth of features, ease of rollout, a way to get in touch.

A visitor should be able to self-identify quickly and find the message that speaks to them.

---

## 4. What visitors must be able to DO (conversion actions)

The page must make the following actions possible and easy. Priority order shown; the top two are the most important.

1. **Create an account** (sign up). *(Links to the existing sign-up route.)*
2. **Log in** (for returning users). *(Links to the existing log-in route.)*
3. **Download the desktop companion app** — when a build is available.
4. **Get in touch / enquire** — for educators and institutions.
5. **Switch language** between **English and Hindi**.
6. **Switch appearance** between light and dark (see §7 — this is a product-wide capability, not a styling suggestion).

---

## 5. What the page must SAY (key messages / value propositions)

These are the ideas that must land. *How* they are expressed visually and verbally is open; the substance must be present and truthful.

- **All-in-one for college learning:** courses, modules, and tasks live in one place instead of scattered tools.
- **Built around each role:** students, instructors, and admins each get a workspace made for them.
- **Hands-on, not just reading:** students complete practical tasks, including **coding/lab work**, with results captured automatically via the desktop companion app.
- **Engagement by design (gamification):** points, rewards, and leaderboards keep students motivated.
- **Progress you can see:** students track their own progress and history; instructors get course and performance analytics.
- **An AI study assistant:** students can ask questions and get answers grounded in their course materials.
- **Collaboration:** students can work together on tasks with peers in the same course.
- **Stay in the loop:** announcements keep courses aligned.
- **Made to be inclusive:** available in **English and Hindi**, and in light or dark appearance.
- **Credible and real:** live platform numbers and genuine voices back up the claims.

Do not invent features or metrics that are not in this brief. If a message needs a proof point we don't have yet, flag it (see §11).

---

## 6. Required content & functional elements (inventory)

Everything below must be present or possible **somewhere** on the page. Grouping and arrangement are your call. "Priority" indicates importance, not position.

| # | Element | Priority | Notes / source of truth |
| --- | --- | --- | --- |
| 6.1 | **Product name / brand mark** | Must | Name is "SamVidyaa." Ask if a logo/wordmark exists (§11). |
| 6.2 | **Sign-up entry point** | Must | Leads to account creation. |
| 6.3 | **Log-in entry point** | Must | For returning users. |
| 6.4 | **Concise explanation of what SamVidyaa is** | Must | The elevator pitch for a first-time visitor. |
| 6.5 | **The key value propositions from §5** | Must | Communicated clearly; visitors should grasp the core offer without scrolling forever. |
| 6.6 | **Live platform statistics** | Must | Pulled live from the backend: **total courses** and **total users**. Numbers are real and variable — could be small, large, or zero. Must handle a loading state and a zero/low state gracefully. |
| 6.7 | **Desktop companion app download** | Must | Real data from the backend: availability, version, file size, and download count. The app may be **available or unavailable** at any time — design for both. When unavailable, the download action is disabled/absent and the state is communicated. |
| 6.8 | **Social proof / testimonials** | Should | Real testimonials from the backend. Count is **variable (0 to many)**. Each has: name, role, a quote, an optional photo (fallback needed when absent), and an implied top rating. Must handle **none** (element hidden or replaced), **one**, and **several**. |
| 6.9 | **FAQ** | Should | A set of question/answer pairs, content-managed and translatable. Number of items can change. |
| 6.10 | **Contact method** | Should | Address, phone, and email are shown. A contact/enquiry form is expected — **note:** whether the form actually submits is an open decision (§11). Real contact details still needed. |
| 6.11 | **Language switch (EN / HI)** | Must | Visible and usable before sign-in. |
| 6.12 | **Light/dark appearance switch** | Must | Product-wide capability; the page must work in both (§7). |
| 6.13 | **Navigation** | Must | A way to reach the above actions/sections. |
| 6.14 | **Footer** | Must | At minimum copyright. Legal links (privacy/terms) are an open decision (§11). |

---

## 7. Dynamic content, states, and edge cases (important)

Much of this page is **driven by live data**, so it will not always look "full." Please design for the real range of states, not just the happy path:

- **Loading:** stats, testimonials, and app details are fetched after the page loads. There is a moment before they arrive.
- **Empty / unavailable:**
  - No testimonials yet → the element should gracefully disappear or degrade.
  - Desktop app not published → download is unavailable and clearly so.
  - Stats at zero or very low early on.
- **Populated & large:** numbers can grow large (localise formatting); testimonials can be many; FAQ list can be long.
- **Both languages:** every piece of copy exists in **English and Hindi**. Hindi and English strings differ in length — layouts must tolerate **variable text length** without breaking.
- **Both appearances:** the product ships a **light and a dark** mode with a user toggle. The landing page must be usable and legible in **both** — please provide both. *(This is a functional requirement of the product, not a stylistic recommendation; the actual palette is yours to define.)*

Designs that only cover the "everything is full and in English" case will not be implementable.

---

## 8. Brand voice & tone (verbal, not visual)

Guidance on **personality and language**, not appearance:

- **Trustworthy and credible** — this is used by educational institutions; it should feel legitimate and safe.
- **Clear and jargon-light** — students and educators of varying technical comfort should understand it.
- **Encouraging and motivating** — the product is about progress and engagement; the voice can reflect that energy without being gimmicky.
- **Inclusive** — bilingual by default; avoid idioms that won't translate to Hindi.

Final marketing copy is not written yet (§11). Placeholder/representative copy is acceptable for design; call out where real copy is needed.

---

## 9. Accessibility, responsiveness & performance requirements

- **Responsive:** must work from small mobile screens up to large desktops. Many students will arrive on phones.
- **Accessible:** aim for WCAG AA — sufficient contrast (in both light and dark), keyboard operability, meaningful labels for interactive controls (language switch, theme toggle, carousels, forms), and sensible focus order.
- **Performance-conscious:** it's a marketing entry point — it should feel fast. Be mindful of heavy assets.
- **Localisation-ready:** all text must be translatable (EN/HI) and tolerate length changes; numbers and any dates should follow the active locale.

---

## 10. Technical context & handoff expectations

Context (so your output is buildable, not to constrain the concept):

- The landing page is one screen of a **React single-page web app** (React + Vite). It links out to existing **sign-up** and **log-in** pages, which are separate screens (not part of this brief).
- Some content is fetched from **public backend endpoints** already in place: platform stats, latest desktop app info, and testimonials. This is why §7's states matter.
- A landing page **already exists** and this is effectively a **redesign** — you can request access to the current version for reference, but you are **not** expected to follow it.

**Please deliver:**
- Responsive designs across breakpoints (mobile → desktop) for all required content in §6.
- **Both light and dark** variants.
- All key **content states** from §7 (loading, empty/unavailable, populated — including large numbers and zero-testimonial cases).
- Accommodation for **English and Hindi** (either both language mocks, or clear guidance on how variable-length copy is handled).
- Interaction/motion intent, accessibility annotations, and dev-ready specs/assets (spacing, sizes, exports, and any tokens).

---

## 11. Decisions & inputs still needed (open questions)

Please confirm these with Product before or during design — they affect the work:

1. **Brand assets:** Is there an existing logo/wordmark, or should one be created? Are there any locked brand elements or is this fully open?
2. **Final copy:** Who writes the marketing copy (headline, value props, FAQ, CTAs)? Placeholder for now?
3. **Testimonials:** Do we have real, consented testimonials (names, roles, quotes, photos) or are these representative for now?
4. **Contact details:** Real address, phone, and email to display.
5. **Contact form behaviour:** Should the enquiry form actually send a message (and to where), or is it display-only for now? *(Currently the form does not submit.)*
6. **Legal:** Do we need privacy policy / terms links in the footer? Any compliance requirements?
7. **Audience emphasis:** Should the page lean more toward **students**, **educators/institutions**, or balance both equally?
8. **Positioning:** Is SamVidyaa presented as free, institution-licensed, or is pricing out of scope for this page?
9. **Product imagery:** Are screenshots or visuals of the actual app permitted, or should representations be abstract?
10. **Domain / favicon / meta:** Confirm final domain, page title, and social-share metadata needs (SEO/Open Graph).

---

## 12. Scope boundaries (non-goals)

- This brief covers **only the public landing page**. The authenticated dashboards (student/instructor/admin) and the sign-up/log-in screens are **out of scope**.
- No visual direction is provided **on purpose** — do not treat the omission as a gap to fill with the current design; treat it as creative freedom.
- Do not represent features or metrics beyond those described here.

---

*End of brief. Questions to Product.*
