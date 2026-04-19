# Sound assets

Drop two short audio files here (`.mp3` or `.wav`):

- `tap.mp3` — played on every habit / challenge log tap. Target: soft "pop",
  **~80–120 ms**, peak ≤ −6 dB so it doesn't overpower at system volume.
- `complete.mp3` — played when a challenge hits full completion
  (`progress === target`). Target: warm chime / arpeggio,
  **~400–700 ms**, celebratory but not obnoxious.

Missing files are tolerated: `src/shared/hooks/useMicroInteraction.ts` wraps
`expo-audio` loads in try/catch and silently no-ops if the asset can't
resolve. So you can ship the app before the SFX exists — tap feedback will
just be haptic + animation.

## Recommended free sources

- [Pixabay Free Sounds](https://pixabay.com/sound-effects/) — CC0, no
  attribution needed.
- [Freesound.org](https://freesound.org/) — check per-file license.

## Adding a new sound

1. Drop the file into `assets/sounds/`.
2. Register it in `src/shared/hooks/useMicroInteraction.ts` under `SOUND_MAP`.
3. Call via `play('myKey')`.
