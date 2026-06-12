# PageVoice Native Companion Plan

PageVoice starts as a browser extension. A native companion is intentionally out of scope for the MVP, but the codebase is structured so one can be added without rewriting extraction, settings, chunking, or TTS provider contracts.

## Why A Native Companion Exists

- Local/private TTS for users who do not want selected text sent to a cloud voice provider.
- Apple Silicon acceleration for local models.
- Offline playback and downloads.
- Lower latency after local models are warm.
- Global keyboard shortcuts that work outside the browser extension surface.
- Saving generated audio files for later listening.

## Candidate Frameworks

- Tauri: small footprint, Rust-native shell, good fit for a local helper app.
- Electron: mature extension-adjacent ecosystem and broad platform support.
- Native Swift for macOS: best long-term macOS integration if PageVoice leans into Apple Silicon and system media controls.

## Local TTS Options

- Kokoro through an ONNX/WebGPU path where browser or desktop GPU support is sufficient.
- MLX-based TTS on Apple Silicon through a native macOS helper.
- Future local models exposed through the same `TTSProvider` contract used by the extension.

## Communication

The browser extension can communicate with the native companion through browser native messaging or a localhost API. Localhost mode must require explicit user consent and clear setup. Native messaging is preferable for a packaged companion because browser permissions and host registration make the boundary explicit.

The companion should consume the same chunk-level request shape used by cloud providers: cleaned text, voice id, style instruction, speed, format, and a text hash. That lets the extension reuse the current queue cache, retry, and prefetch behavior for local TTS without coupling extraction to a native runtime.

## Extension Integration Points

- Add a native-companion provider that implements the shared `TTSProvider` contract.
- Keep provider keys, local connection state, and consent flags in versioned settings.
- Reuse the side-panel cloud/local indicator so local playback is visibly distinct from AI cloud voices.
- Preserve the current rule that content scripts never receive provider secrets or native connection details.

## Security And Privacy

- Do not start a silent local server without user consent.
- Send only selected, cleaned text to the companion.
- Keep full page HTML out of the native boundary.
- Show a clear local/cloud indicator in the extension UI.
- Avoid storing generated audio unless the user explicitly saves or downloads it.
- Cache audio by text hash, provider, voice, style, and speed, with an explicit user-controlled cache clearing path before persistent native caching is added.
- Treat the companion API like a local privileged surface: validate message shapes, reject unexpected origins, and keep logs free of selected text unless debugging is explicitly enabled.
