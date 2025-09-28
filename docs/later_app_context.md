
# Later App — Comprehensive Product Context

## Overview
Later is a **calm digital companion** designed to help people **capture, organize, and revisit the important (but not urgent) things in their lives**.  
It combines elements of a **read-later app, task manager, and personal assistant**, with a focus on **reducing mental clutter** and encouraging **intentional engagement** rather than doom-scrolling or constant reactive behavior.

The app is designed to be **mobile-first**, lightweight, and intuitive. It supports both **work** and **life** flows, intelligently adapting to the user’s context — like commuting, winding down in the evening, or starting a focused work block.

---

## Core Problem
Modern digital life generates **constant micro-decisions**:
- Emails you can't reply to immediately but don't want to lose.
- Articles, newsletters, or videos you want to read later.
- Invitations, events, and reminders that need attention soon.
- Creative inspiration or notes you want to capture before they disappear.

Current tools are **fragmented**:
- Email clients are for inbox zero, not for triage and reflection.
- Read-later apps (e.g., Pocket, Readwise Reader) focus only on articles.
- Task managers create pressure rather than calm.

Later solves this by being a **single place** to **capture, triage, and engage** with these moments — like a **second brain** that learns over time.

---

## Vision
Later is more than a productivity tool. Its vision is to become:
- A **context-aware companion** that gently surfaces the *right thing at the right time*.
- A **bridge between work and life**, respecting both without blending them into chaos.
- A **mindful alternative to distraction apps**, encouraging reflection and purposeful engagement.

> *Goal:* When you have five spare minutes, Later helps you decide whether to **act**, **read**, or **rest**, instead of defaulting to Instagram or email.

---

## Core Features

### 1. **Capture**
A frictionless way to save anything you encounter during the day:
- Quick Capture button (floating "+" FAB).
- Inputs:
  - **Title** (required)
  - **Notes** (optional)
  - **Link** (optional)
  - **Tag** — Work, Life, Inspiration
- Saved items default to the **Inbox** for later categorization.
- Use case examples:
  - Snap an idea while cooking.
  - Save a newsletter you skimmed at a stoplight.
  - Jot down a task from a quick conversation.

---

### 2. **Inbox (Triage Zone)**
The Inbox is a **temporary holding space** for unsorted, unprioritized items.
- Items can be **swiped right** to categorize or **swiped left** to archive.
- Bulk selection mode allows multiple items to be archived or categorized.
- Tags: Work, Life, Inspiration (extensible later).
- Example item types:
  - Emails
  - Event reminders
  - Captured notes
  - Articles
  - Podcasts

> The goal is to **empty the Inbox regularly**, like a digital decluttering ritual.

---

### 3. **Now Screen**
The Now screen provides **context-aware suggestions**, answering the question:
*"What should I focus on right now?"*

Sections:
- **Greeting & Contextual Subtext**: Time of day and mood setting.
- **For This Moment Strip** (Smart Suggestion Engine):
  - Surfaces *one* recommendation based on:
    - Available time (e.g., 20 min before school pickup).
    - Modality (e.g., hands-free listening during a commute).
    - Attention level (work vs. rest).
  - Examples:
    - "Reply to this quick 2-min email."
    - "Listen to this 15-min podcast while you drive."
    - "Skim this saved article before bed."
- **Might Need Attention**:
  - Events or tasks that are urgent but not overwhelming.
  - Example: Dentist appointment reminder, field trip email.
- **Continue Reading**:
  - Progressively saved reading/listening content.

---

### 4. **Library**
A permanent home for **organized, saved content**.
- Filter by category: **All, Work, Life, Inspiration.**
- Stores:
  - Articles
  - Podcasts
  - Notes
  - Creative inspiration
- Future integrations:
  - **Readwise** for syncing highlights.
  - **Snipd** for podcast summaries and AI notes.

---

### 5. **Reader Overlay**
Allows users to **consume content without leaving Later**:
- **Summary mode**: AI-generated short version with key bullets.
- **Full mode**: Complete article or content piece.
- Progress bar tracks how far you’ve read.
- "Open Original" button links out to the source.

---

### 6. **Calendar Integration (Future)**
- Quick action to "Add to Calendar" for event cards.
- Start with local storage to simulate scheduling.
- Later integrate with Google Calendar or iCal APIs.

---

## Context Awareness & Smart Suggestions
Later’s intelligence layer personalizes recommendations over time.

MVP rules:
- **Time of Day**:
  - Morning → show triage items.
  - Afternoon commute → surface audio content.
  - Evening → reflective reading or creative inspiration.
- **Duration Match**:
  - If you have 5 minutes, suggest a short item.
  - If you have 20 minutes, suggest a podcast episode.
- **Attention Type**:
  - During work hours → urgent but small tasks.
  - Off hours → restorative or inspiring content.

Future potential:
- Calendar integrations to understand availability.
- Bluetooth or location to infer driving context.
- AI scoring of items to rank importance.

---

## User Journeys

### Scenario 1: Email Triage
1. At a red light, Nikki sees a student email come in.
2. She swipes it into Later instead of replying immediately.
3. Later, when sitting on the couch, she opens Now → Inbox.
4. The app suggests this email as a 2-min action.
5. She replies, swipes "Done," and clears it.

---

### Scenario 2: Commute Listening
1. Nikki gets in the car to pick up her son.
2. Later recognizes this 20-min commute window.
3. The "For This Moment" strip suggests a podcast she saved earlier.
4. Nikki taps "Listen" and plays it hands-free.

---

### Scenario 3: Quiet Reflection
1. After work, Nikki sits down with tea.
2. Later surfaces a saved article about design inspiration.
3. She reads in the built-in Reader mode.
4. She finishes feeling recharged instead of distracted.

---

## Competitive Landscape

| Tool | Strength | Weakness |
|------|----------|----------|
| **Readwise Reader** | Excellent for reading workflows, AI summaries. | Focused only on articles and reading. |
| **Pocket** | Simple save-and-read system. | Lacks triage or task context. |
| **Todoist** | Strong task management. | Overwhelming for reflective use, no content focus. |
| **Apple Reminders** | Deep system integration. | Poor capture UX, no rich content. |
| **Later (Position)** | Unified inbox for life + work, context-aware, calming experience. | Needs to prove value vs. specialized apps. |

Later’s differentiator: **context awareness + holistic life/work balance**.

---

## Technical Foundations
Initial build will be **front-end only**, using:
- **Aura** or **Vibe Code** for rapid prototyping.
- TailwindCSS for styling.
- Lucide icons for visuals.
- LocalStorage for state persistence.

Later, transition to **Cursor + Supabase** for full-stack functionality.

---

## Roadmap

### Phase 1: Prototype (Aura)
- Static data with full UI flows.
- Screens: Now, Inbox, Library.
- Reader overlay working with mock summaries.
- Quick Capture modal.
- Swipe gestures for Inbox.

### Phase 2: Early Beta (Cursor)
- Add Supabase backend.
- Implement simple rules for smart suggestions.
- Local Calendar simulation.

### Phase 3: Intelligence Layer
- AI-driven summaries and suggestions.
- Readwise + Snipd integrations.
- Driving and context detection.

---

## Key Design Principles
1. **Calm Technology**
   - The app should feel like a gentle guide, not another source of stress.
   - Interfaces are quiet, muted, and respectful of attention.

2. **One Action at a Time**
   - Focus the user on one suggestion or one inbox item.
   - Reduce overwhelm by removing decision fatigue.

3. **Flexible, Not Rigid**
   - Supports both quick triage and deep reflection.
   - Adapts to the user’s patterns without forcing strict rules.

---

## Sample Data Types

**Inbox Item**
```json
{
  "id": "abc123",
  "title": "Field Trip Email",
  "type": "email",
  "summary": "Reminder to complete consent form by Wednesday.",
  "tag": "unsorted",
  "createdAt": "2025-09-27T10:00:00Z"
}
```

**Library Item**
```json
{
  "id": "xyz789",
  "title": "The quiet power of consistent habits",
  "type": "article",
  "duration": 5,
  "progress": 0.4,
  "tag": "life",
  "sourceUrl": "https://example.com/article"
}
```

---

## Why Later Matters
Later addresses a growing cultural need:
- People feel **overwhelmed by digital inputs** and crave **mindful technology**.
- Current tools either **increase anxiety** (tasks, endless emails) or **feed distraction** (social media).
- Later provides a **third path**: a place to pause, prioritize, and engage with what truly matters.

---

## Success Metrics
- Daily active users spending **<15 min/day** in the app.
- % of Inbox items cleared within 48 hours.
- Engagement rate with smart suggestions.
- Positive sentiment in user feedback: calmness, clarity, reduced stress.

---

## Future Opportunities
- Paid tier with advanced AI features:
  - Personalized recommendations.
  - AI-generated summaries and insights.
  - Deeper integrations (calendar, Slack, email).

- Cross-platform sync:
  - iOS, Android, Web.
  - Browser extensions for quick capture.

- Potential for **enterprise wellness tool** for work-life balance.

---

## Final Note
Later is a tool for people who **don’t want another productivity app** — they want a **calm space** to gather, process, and revisit what matters. It’s less about doing *more* and more about **doing the right thing at the right time**, with the least friction possible.
