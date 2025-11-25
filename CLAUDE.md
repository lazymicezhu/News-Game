# News Game - Architecture & Development Guide

## Project Overview

A newsgame (interactive news experience) centered on the 2025 California wildfires, designed to explore how game mechanics and narrative choices influence players' understanding of news credibility and their emotional engagement. The game presents players with decision points about information sources, evidence verification, and journalistic judgment.

**Research Context**: Part of an experimental study examining how format (text vs. game) and authorship (human vs. AI) affect credibility perception and emotional response.

---

## High-Level Architecture

```
User Interaction
    ↓
main.js (Init + Event Binding)
    ↓
router.js (Scene Navigation State Machine)
    ├→ gameState.js (Data Storage)
    └→ ui.js (DOM Rendering)
         ├→ renderScene()
         ├→ renderFlowchart()
         ├→ renderEvidenceAssistant()
         └→ renderRecap()
    ↓
scenes.js (Narrative Data Structure)
    ├→ textDB.js (Centralized Text Content)
    └→ assistantLines.js (Random Contextual Hints)
```

### Core Flow

1. **Initialization** (`main.js`)
   - Routes to `router.init(scenes, 'intro')`
   - Binds keyboard shortcuts (R to restart, 1-9 to select choices)
   - Listens for restart button clicks

2. **Scene Rendering** (`router.goTo(sceneId)`)
   - Validates scene exists
   - Updates `gameState.currentSceneId`
   - Calls `renderScene()` with callback `handleChoice`
   - Renders flowchart sidebar and assistant character

3. **Choice Handling** (`router.handleChoice(choice)`)
   - Detects branching (user backtracked, then chose differently)
   - Logs decision with metadata (source credibility, unverified flag, trustDelta effect)
   - Applies state effects (`gameState.applyEffect()`)
   - Transitions to next scene
   - Updates history

4. **Ending** (Choices array is empty)
   - Calls `showFooter()` (restart button visible)
   - Calls `renderRecap()` to display:
     - Narrative angle (official/community/hype/balanced)
     - Trust score calculation
     - Decision replay
     - Evidence marking summary

---

## Key Modules & Responsibilities

### 1. **router.js** - Scene Navigation & Game State Machine

**Exports**: `gameRouter` (singleton)

**Key Methods**:
- `init(scenes, startSceneId)` - Initialize router and load first scene
- `goTo(sceneId)` - Navigate to scene, render UI, update history
- `handleChoice(choice)` - Process player selection, apply effects, move to next scene
- `restart()` - Reset game to initial state
- `getCurrentScene()` - Return current scene object

**Architecture Pattern**: 
- **Stateless routing**: Router is the single coordinator between scenes and state
- **Callback-driven UI**: `renderScene` receives `onChoice` callback to decouple scene logic from rendering
- **History branching**: Truncates history when player backtracks + makes a new choice (simplified state management)

**Critical Design Detail**:
```javascript
// In handleChoice:
const { history, currentSceneId } = gameState.getState();
if (history[history.length - 1] !== currentSceneId) {
    // User backtracked: truncate future timeline
    gameState.truncateHistory(currentSceneId);
}
```

### 2. **state.js** - Global Game State Container

**Exports**: `gameState` (singleton)

**Core Data**:
```javascript
currentSceneId: string           // Current scene ID
variables: Object               // Dynamic state (e.g., angle, trustDelta)
history: Array<string>          // Scene IDs visited (linear path)
decisions: Array<Object>        // Logged choices with metadata
evidenceMarks: Object           // Evidence credibility assessments
assistantPool: Array<string>    // Shuffled assistant lines
```

**Key Methods**:
- `init(startSceneId)` - Reset all state to initial
- `setVariable(key, value)` - Update game variable
- `applyEffect(effect)` - Bulk set variables from choice.effect
- `logDecision(entry)` - Record a choice with scene context
- `markEvidence(evidenceId, status, meta)` - Store evidence judgment (trusted/doubtful/viewed)
- `nextAssistantLine(sourceLines)` - Return next line from shuffled pool (no repeats until refill)
- `getEvidenceMarks()` - Return copy of all evidence marks

**Patterns**:
- **Immutable copies**: Returns `{ ...this.variables }` to prevent external mutation
- **Fisher-Yates shuffle**: `nextAssistantLine()` shuffles array once, then pops from end
- **Timestamp tracking**: Every decision and evidence mark gets `timestamp: Date.now()`

### 3. **ui.js** - DOM Rendering & User Interaction

**Exports**: Seven functions

**Main Entry Points**:
- `renderScene(scene, onChoice)` - Render main scene DOM (title, image, text, choices)
- `renderFlowchart(scenes, currentState, onNodeClick)` - Render left sidebar story tree
- `renderEvidenceAssistant(evidenceList, sceneId, sceneTitle)` - Render Paimon character + evidence cards
- `renderRecap(sceneContainer)` - Generate end-game summary with stats

**Sub-Patterns**:

1. **Source Badge** - Color-coded credibility indicator
   ```javascript
   const trustColorMap = {
       high: '#16a34a',    // green
       medium: '#f59e0b',  // amber
       low: '#ef4444'      // red
   };
   ```

2. **Evidence Cards** - Interactive judgment UI
   - Three buttons: "相信" (trusted), "存疑" (doubtful), "已阅" (viewed)
   - On click, calls `gameState.markEvidence()` and removes action buttons
   - Displays status badge after marking

3. **Assistant Floating Panel** - Contextual hints and evidence review
   - Always visible (even with 0 evidence; shows rotating lines)
   - Minimize button (−/+) collapses evidence list
   - Avatar click opens "Evidence History Panel" (global review of all marked evidence)
   - Assistant text rotates through `assistantLines` array

4. **Recap Generation** - Post-game stats
   ```
   Narrative Angle = most-frequent angle from decisions
   Trust Score = 65 (base) + sum(trustDelta) + evidence bonuses
   Decision Replay = bulleted list of choices
   Evidence Stats = counts of trusted/doubtful/viewed marks
   ```

**Key DOM Structure**:
```html
<div class="game-wrapper">
  <aside id="flowchart-container"><!-- Story tree --></aside>
  <div class="container">
    <main id="app"><!-- Current scene --></main>
  </div>
  <div id="assistant"><!-- Paimon + evidence cards --></div>
</div>
```

### 4. **scenes.js** - Narrative Content Tree

**Exports**: `scenes` (Object keyed by scene IDs)

**Scene Structure**:
```javascript
{
    id: string,
    title: string,
    image: string (optional),           // Path to art asset
    text: string,                       // From textDB.js
    source: { label, details, credibility: 'high'|'medium'|'low' } (optional),
    unverified: boolean (optional),     // Flags low-credibility sources
    evidence: Array<{
        id: string,
        title: string,
        content: string,
        credibility: string
    }> (optional),
    choices: Array<{
        text: string,
        next: string,                   // Target scene ID
        effect: Object,                 // { angle, trustDelta, ... }
        hint: string (optional),        // Tooltip on hover
        tags: Array<string> (optional)
    }>
}
```

**Game Structure** (16 scenes):
```
intro
├── cal_fire_briefing ──→ official_draft (ending)
│   └── suppression_ops
│       ├── frontline_embed ──→ investigative_draft (ending)
│       │   └── clickbait_draft (ending)
│       └── evac_center
│
├── social_feed
│   ├── rumor_spread
│   │   ├── clickbait_draft (ending)
│   │   └── fact_check
│   │       ├── balanced_draft (ending)
│   │       └── investigative_draft (ending)
│   ├── fact_check (same as above)
│   └── evac_center
│
└── evac_center
    ├── community_voices ──→ balanced_draft or clickbait_draft
    ├── logistics_check ──→ balanced_draft or clickbait_draft
    └── fact_check
```

**Four Narrative Angles**:
- `official`: Relies on Cal Fire briefings (trustDelta: +2 to +4)
- `community`: Centers on evacuee stories (trustDelta: +1 to +3)
- `hype`: Uses unverified social media (trustDelta: -2 to -5)
- `balanced`: Cross-references sources and verifies claims (trustDelta: +2 to +5)

**Four Endings**:
- `official_draft` - Authority-focused, lacks human dimension
- `balanced_draft` - Integrates data + community voices
- `clickbait_draft` - Unverified claims amplified, reader trust damaged
- `investigative_draft` - Deep investigation, multiple sources, actionable insights

### 5. **main.js** - Initialization & Event Binding

**Exports**: None (module side-effects)

**Responsibilities**:
- Imports `scenes` from `scenes.js` and `gameRouter` from `router.js`
- Calls `gameRouter.init(scenes, 'intro')`
- Binds restart button click listener
- Sets up keyboard shortcuts:
  - `R` key: Restart (only if footer visible = game ended)
  - `1-9` keys: Select choice by index
- Logs startup messages to console

**Pattern**: 
- **Deferred initialization**: If DOM not ready, waits for `DOMContentLoaded`
- **Input multiplexing**: Supports both mouse clicks and keyboard shortcuts for accessibility

---

## Data Storage & Content Architecture

### textDB.js - Centralized Narrative Text

```javascript
export const textDB = {
    intro: "...",
    calBriefing: "...",
    balancedDraft: "...",
    // ... 10+ scene texts
};
```

**Why centralized?**
- Easy to swap narratives for A/B testing (same game structure, different content)
- Simplifies multi-language support
- Decouples narrative from game logic

### assistantLines.js - Contextual Hint Pool

```javascript
export const assistantLines = [
    "风在变，我也帮你转视角",
    "口罩戴好，脑袋也要滤谣",
    // ... 8 lines total
];
```

**Usage**: 
- Paimon character rotates through lines when no evidence cards available
- Drawn randomly via `gameState.nextAssistantLine()` without repeats per cycle
- Thematic relevance to wildfire and fact-checking

---

## Critical Cross-Module Patterns

### Pattern 1: Callback-Driven Scene Updates

```javascript
// router.js
renderScene(scene, (choice) => this.handleChoice(choice));

// ui.js receives callback
export function renderScene(scene, onChoice) {
    button.onclick = () => onChoice(choice, index);
}
```

**Why**: Decouples scene rendering from navigation logic. Router decides what happens on choice; UI only calls the callback.

### Pattern 2: Shallow State Snapshots

```javascript
gameState.getState() → {
    currentSceneId,
    variables: { ...this.variables },
    history: [...this.history],
    decisions: [...this.decisions ],
    evidenceMarks: { ...this.evidenceMarks }
}
```

**Why**: Prevents external code from mutating internal state. Each caller gets a fresh shallow copy.

### Pattern 3: Effect Application via Metadata

```javascript
// In choice:
{
    text: "Choose X",
    next: "scene_y",
    effect: { angle: 'balanced', trustDelta: 3 }
}

// In router:
gameState.applyEffect(choice.effect);
```

**Why**: Separates effect data from logic. Easy to adjust trustDelta weights for experiments without code changes.

### Pattern 4: History Branching Detection

```javascript
// Player goes: A → B → [backtracks] → A → [new choice] → C
// Before new C: gameState.truncateHistory('A')
// Result: history = [A, C]
```

**Why**: Prevents "phantom" futures when player revisits old decision points. Simplified implementation—doesn't clean up unused variables (acknowledged in code comment).

### Pattern 5: Evidence Marking with Metadata

```javascript
gameState.markEvidence(
    'evidence_id',
    'trusted',
    { sceneId, sceneTitle, title }
);

// Stored as:
evidenceMarks[id] = {
    status,
    sceneId,
    sceneTitle,
    title,
    timestamp: Date.now()
}
```

**Why**: Allows end-game recap to show *where* player saw each piece of evidence and how they judged it. Supports research analysis.

---

## Trust & Credibility System

### Source Credibility Badges

Each scene has an optional `source` object:
```javascript
source: {
    label: "官方通报" | "目击者口述" | "社交媒体帖" | etc.,
    details: "Tooltip text",
    credibility: 'high' | 'medium' | 'low'
}
```

**UI Rendering**:
- Badge text: `[${source.label}]`
- Color: `trustColorMap[credibility]` (green/amber/red)
- Hover shows `details`

### Unverified Content Flags

```javascript
if (scene.unverified) {
    // Render: <div class="uncertainty-pill">尚未证实 · 请谨慎</div>
    // Add CSS class: unverified-text (typically faded/gray background)
}
```

### Trust Score Calculation (End-Game)

```
score = 65 (baseline)
score += sum of (choice.effect.trustDelta) from all decisions
score -= 6 for each unverified source used
score += 4 if player marked ANY evidence as trusted
score += 2 if player marked ANY evidence as doubtful (shows critical thinking)

Final: Math.min(100, Math.max(10, score))
```

**Philosophy**: Balances exploratory play (low score possible) with responsible sourcing (reward for verification).

---

## Key Technical Details

### 1. No Typewriter Effect

Code contains no character-by-character animation. Text is set directly via `.textContent` or `.innerHTML`.

### 2. Flowchart Sidebar

- Shows **visited scenes** (history) as clickable nodes
- Shows **future scenes** (unvisited next targets) as grayed-out nodes
- Clicking visited node = backtrack (triggers route change, which calls `truncateHistory`)
- Current scene node has `active` class (no click handler)

### 3. Minimize Button on Evidence Cards

- Appears only if evidence cards exist
- Clicking toggles `assistant-bubble--solo` class
- Rotates icon: `−` (minimize) ↔ `+` (expand)

### 4. Evidence History Panel

- Opened by clicking Paimon avatar
- Shows all marked evidence globally (not just current scene)
- Displays: evidence title, scene context, player's judgment status
- Closes on clicking `×` button or clicking avatar again
- Hides main bubble while open

### 5. Keyboard Shortcuts Implementation

```javascript
// Numeric shortcuts
const num = parseInt(e.key);
if (num >= 1 && num <= 9) {
    const currentScene = gameRouter.getCurrentScene();
    if (currentScene && currentScene.choices && currentScene.choices[num - 1]) {
        gameRouter.handleChoice(choice);
    }
}
```

**Why check footer visibility?** Prevents accidental restart mid-game.

### 6. Module Import Pattern

All modules use ES6 imports/exports:
```javascript
import { gameState } from './state.js';
export const gameRouter = new GameRouter();
```

**No bundler**: Game runs directly in browser with `<script type="module">`.

---

## Research Integration Points

### For Experimental Study:

1. **Authorship Labeling**: Scene text comes from `textDB.js`. A/B test by swapping text content (human vs. AI-written).

2. **Adjustable Weights**: 
   - `trustDelta` values in choice effects
   - Trust score calculation formula in `calculateTrustScore()`
   - Can be tuned per experiment group

3. **Evidence Marking for Metrics**: 
   - Player's credibility judgments tracked in `gameState.evidenceMarks`
   - Can analyze: which sources did group X trust vs. doubt?
   - Supports post-hoc comparison of credibility perception by group

4. **Decision Replay**: 
   - Full `gameState.decisions` exported at end
   - Records: scene, choice, source credibility, unverified flag, effect
   - Enables analysis of information-seeking patterns

5. **Emotional Angle Tracking**:
   - `effect.angle` on each choice
   - Accumulates to `narrative angle` in recap
   - Can correlate emotional engagement with angle selection

---

## Data Flow Diagram

```
Player Click
    ↓
ui.renderScene(choice) callback triggered
    ↓
router.handleChoice(choice)
    ├→ gameState.logDecision({ sceneId, choiceText, effect, ... })
    ├→ gameState.applyEffect(choice.effect)
    └→ router.goTo(choice.next)
        ├→ gameState.setCurrentScene(choice.next)
        ├→ ui.renderScene(nextScene)
        │   ├→ ui.renderEvidenceAssistant(evidence)
        │   └→ ui.renderFlowchart()
        └→ [Optional] ui.renderRecap() if no choices remain
            ├→ Summarize angle & trust score
            ├→ List decisions
            └→ Count evidence marks
```

---

## Extension Points for Future Features

1. **Saves/Checkpoints**: Add `gameState.save(slot)` and `gameState.load(slot)`

2. **Multiple Narratives**: Duplicate `scenes` object, swap in `router.init()`

3. **Dynamic Difficulty**: Adjust evidence availability or trustDelta based on player performance

4. **Analytics Export**: Add `gameState.toJSON()` for exporting decisions to server

5. **Accessibility**: Add ARIA labels to buttons, keyboard navigation for flowchart

6. **Responsive Design**: Currently assumes desktop (flowchart sidebar). Could hide sidebar on mobile

7. **Localization**: Extract all hardcoded UI strings (button labels, tooltips) into `i18n` object

---

## Common Debugging Scenarios

### Stuck at Wrong Scene
- Check `gameRouter.currentSceneId` in console
- Verify `choice.next` points to valid scene ID in `scenes` object
- Check for typos in `scenes.js` scene IDs

### Evidence Not Showing
- Confirm `scene.evidence` array is not empty
- Check browser console for `renderEvidenceAssistant()` errors
- Verify `evidenceList` is being passed to function

### Trust Score Wrong
- Review all decisions: `gameState.decisions`
- Check each choice's `trustDelta` value
- Verify evidence marks: `gameState.evidenceMarks`
- Manually calculate: 65 + sum(trustDelta) - 6*unverified + bonuses

### Keyboard Shortcuts Not Working
- Ensure footer is visible (game ended)
- For numeric shortcuts: check `choice.text` renders for index 0-8
- Press keys *after* scene finishes rendering

---

## Summary

This is a tightly integrated narrative game engine optimized for:
- **Player agency**: Multiple paths, clear consequence tracking
- **Research rigor**: Detailed logging of every decision and evidence judgment
- **Content flexibility**: Text and scenes separate from logic
- **Accessibility**: Keyboard shortcuts + visual feedback for choices
- **Extensibility**: Modular design allows swapping narratives, adjusting weights, adding features

The architecture exemplifies the **Model-View-Controller** pattern:
- **Model**: `state.js` (game data)
- **View**: `ui.js` (rendering)
- **Controller**: `router.js` (navigation + logic flow)

With `main.js` as the app entry point and `scenes.js` as the content repository.
