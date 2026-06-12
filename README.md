# PageVoice

PageVoice is an MVP browser extension that turns meaningful web content into narrated audio. It targets Chromium browsers first with a Manifest V3 side panel, typed content-script extraction, queue-based playback, browser-native speech, and OpenAI text-to-speech.

## Current Status

- Working target: Chrome, Edge, Brave, and Chromium via `dist/chromium`.
- Prepared targets: Firefox build output and Safari Web Extension prep output.
- Functional providers: Browser Speech and OpenAI TTS.
- Experimental providers: ElevenLabs first-pass integration and Local Kokoro stub.
- Picker mode now favors readable content blocks, supports Shift-click to add a picked block to the queue, and blocks accidental link navigation while active.
- Cloud TTS playback caches generated chunks for the current side-panel session, retries transient provider failures, and prefetches the next chunk while playback is moving.
- Core privacy rule: only cleaned text selected by the user is sent to cloud TTS providers.

## Setup

```bash
npm install
npm run test
npm run build:chromium
```

Useful scripts:

```bash
npm run dev
npm run test
npm run build
npm run build:chromium
npm run build:firefox
npm run build:safari-prep
npm run typecheck
npm run check
```

## GitHub Build Checks

The repo includes `.github/workflows/ci.yml`. On pushes to `main`, pushes to `codex/**` branches, and pull requests into `main`, GitHub Actions runs:

- `npm ci`
- `npm audit --omit=dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build:chromium`
- `npm run build:firefox`
- `npm run build:safari-prep`

The workflow runs on Node 20 and Node 22 and uploads the built extension packages from the Node 22 job as short-lived artifacts.

Dependabot is configured in `.github/dependabot.yml` for npm and GitHub Actions updates.

## Load In Chrome Or Edge

1. Run `npm run build:chromium`.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable Developer Mode.
4. Choose "Load unpacked".
5. Select `dist/chromium`.
6. Open a normal `http://` or `https://` page and click the PageVoice extension button.

The extension cannot run on browser internal pages such as `chrome://`, `edge://`, extension store pages, or restricted/sandboxed pages.

## TTS Provider Setup

Browser Speech works without an API key and uses the browser or operating system voice list.

OpenAI TTS:

1. Open the PageVoice side panel or options page.
2. Enter an OpenAI API key.
3. Select provider `OpenAI`.
4. Choose a voice such as `alloy`, `nova`, `marin`, or `cedar`.

OpenAI requests use `gpt-4o-mini-tts` by default and include the selected narrator style instruction when supported. The extension sends cleaned text chunks only, never full page HTML. Cloud providers may bill per request or rate limit long queues; PageVoice caches generated audio by provider, voice, style, speed, and text hash for the current panel session.

ElevenLabs is marked experimental. Add an API key and optionally a manual voice ID in settings. Voice listing and synthesis are implemented, but the UX is not yet as polished as the OpenAI path.

Local Kokoro is a stub behind a feature flag. It documents the planned local model path and does not block the MVP.

## Architecture

```text
src/background      MV3 service worker, commands, settings router
src/content         page extraction, picker overlay, selection capture
src/sidepanel       React side panel UI and playback queue
src/options         settings/options page
src/offscreen       offscreen audio scaffold
src/shared/browser browser API adapter layer
src/shared/messages typed message contracts
src/shared/settings versioned settings
src/shared/extraction readability, generic DOM, Reddit, HN, cleaner, chunker
src/shared/tts      provider interfaces and provider implementations
```

Browser-specific API access is isolated under `src/shared/browser`. Extraction, cleaning, chunking, settings, messages, and TTS contracts are browser-agnostic.

## Extraction Pipeline

For normal pages, PageVoice tries `@mozilla/readability` first. If that does not return enough text, it falls back to a custom DOM extractor that scores visible elements by text length, density, punctuation, semantic tags, link ratio, UI-heavy penalties, and content-oriented class/id hints.

For picker mode, the content script precomputes meaningful readable blocks, highlights the nearest readable ancestor under the cursor, and captures cleaned text on click. It prefers article paragraphs, heading-plus-body sections, Reddit comments, forum comments, and documentation sections while rejecting link-heavy navigation, sidebars, forms, cookie banners, and control-heavy UI. Escape cancels picker mode. Normal click replaces the preview and queue with the picked block; Shift-click adds the block to the existing queue.

## Reddit Support

Reddit pages use a dedicated extractor for post title/body and visible comments across common modern/shreddit and old Reddit DOM shapes. The side panel exposes Reddit-specific controls for original post only, post plus top visible comments, selected comment, selected comment subtree, top comments, comment limit, AutoModerator filtering, deleted/removed filtering, usernames, scores, and timestamps. Defaults avoid metadata so narration sounds closer to "Reddit post... Top comments... Next comment..." than a raw screen reader. Quoted comment text is preserved with a natural "Quoted:" prefix.

Selected comment and selected subtree modes use the browser's current text selection to find the nearest Reddit comment. If no comment is selected, PageVoice falls back to the first visible readable comment.

## Settings Import And Export

The side panel and options page can export non-secret settings to `pagevoice-settings.json` and import compatible JSON settings. API keys are intentionally excluded from exports.

## Privacy Model

- No telemetry.
- No full page HTML is sent to cloud providers.
- No hidden/scraped data extraction.
- Only visible, cleaned text the user asks to read is sent to the selected TTS provider.
- API keys are stored in extension local storage and are not sent to content scripts by PageVoice messages.
- API keys are redacted from logs.
- Cloud AI voices show an AI-generated disclosure.
- Browser Speech is labeled as local/browser voice.

## Firefox Notes

`npm run build:firefox` outputs `dist/firefox` with a prepared MV3 manifest and popup fallback. Firefox sidebars and MV3 behavior differ from Chromium, so this target is scaffolding-level and needs browser-specific QA before release.

## Safari Notes

`npm run build:safari-prep` outputs `dist/safari-prep`. To package for Safari later, create a Safari Web Extension wrapper in Xcode, import or copy the generated extension assets, configure signing, then test through Safari's Develop menu. Safari support is not complete in this MVP.

## Known Limitations

- Playback state lives in the side panel, so closing the panel can interrupt active playback.
- Offscreen audio support is scaffolded but not the primary playback path yet.
- Generic DOM extraction is heuristic and will need site-specific tuning.
- Reddit extraction supports common modern/old structures, but Reddit markup changes frequently.
- Selected Reddit comment modes depend on there being an active text selection inside a comment; otherwise they fall back to a visible comment.
- PDFs are not supported yet.
- Firefox and Safari outputs are prepared but not polished release builds.
- Local Kokoro is a planned provider, not a functional local model runtime.

## Roadmap

- More site-specific extractors for forums, documentation, and issue trackers.
- Firefox sidebar polish.
- Safari packaging through Xcode.
- Native companion app for local/private TTS.
- Local Kokoro or MLX-backed voices.
- Mobile Safari investigation.
- Save audio for offline listening.
- Per-site presets.
- Multi-voice comment narration.
