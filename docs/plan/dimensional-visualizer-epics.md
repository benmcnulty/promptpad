# Dimensional Visualizer: Detailed Epics & Task Matrix

This document expands the high-level implementation plan into actionable epics, sub-tasks, acceptance criteria, test coverage notes, and sequencing guidelines. Use it to create focused PRs. Keep diffs small and update status inline.

---
## Epic 0: Page Infrastructure & Bug Fixes
Purpose: Ensure the page shell behaves correctly before adding 3D features.

Tasks:
1. [ ] Scroll Bug Fix (DONE in layout.tsx) – Replace `h-screen` with `min-h-screen` to enable vertical scrolling. Add regression test: ensure body height > viewport renders scrollbar.
2. [ ] Add page accessibility landmarks (`role="main"`, heading levels audit).
3. [ ] Introduce test skeleton for new page (`__tests__/app/dimensional-visualizer/page.test.tsx`).
4. [ ] Add visual placeholder component `<VisualizerComingSoon />` to isolate page logic.

Acceptance Criteria:
- Page scrolls when content exceeds viewport.
- Tests pass and coverage registered.

---
## Epic 1: 3D Foundation Layer
Purpose: Introduce React Three Fiber (R3F) with minimal scene.

Tasks:
1. [ ] Add dependencies: `@react-three/fiber`, `@react-three/drei` (defer `leva` until controls epic).
2. [ ] Create `components/visualizer/VisualizerCanvas.tsx` that wraps `<Canvas>` with error boundary + suspense fallback.
3. [ ] Create `components/visualizer/SceneRoot.tsx` with: ambient + point light, placeholder rotating torus or wireframe sphere.
4. [ ] Lazy-load 3D bundle (`dynamic(() => import(...), { ssr:false })`).
5. [ ] Add unit test verifying component mounts without runtime errors (mock R3F).

Acceptance Criteria:
- Visiting page loads Canvas only client-side.
- No console errors.

---
## Epic 2: Vector Data Pipeline (LLM Output → Vector Model)
Purpose: Transform LLM text output into vector data structures reusable across modes.

Data Model Draft:
```ts
export interface VectorPoint {
  id: string;
  token: string; // raw token or semantic unit
  position: [number, number, number];
  magnitude?: number; // optional semantic weight
  group?: string; // cluster/group id
}
export interface VectorEdge { from: string; to: string; weight?: number; }
export interface VectorFrame { points: VectorPoint[]; edges: VectorEdge[]; meta: { source: 'refine'|'reinforce'|'spec'; createdAt: number; }; }
```

Tasks:
1. [ ] Add `lib/vectorization/` module (`tokenize`, `hashTokenToPosition`, `buildEdges`).
2. [ ] Implement baseline heuristic placement: radial spiral or force-seed (deterministic hash mapping to sphere coords).
3. [ ] Provide `vectorizeText(output: string, mode: Mode): VectorFrame`.
4. [ ] Add tests with sample text ensuring stable point counts & deterministic positions.
5. [ ] Wire into `useRefine` consumer path (listen to output changes and emit frame).

Acceptance Criteria:
- Same input text yields identical point coordinates (deterministic).
- Performance: vectorize 2K tokens < 50ms (mock test timing threshold – adjustable).

---
## Epic 3: Scene Rendering of VectorFrame
Purpose: Visualize VectorFrame as points + connecting lines.

Tasks:
1. [ ] `components/visualizer/VectorScene.tsx` consuming `VectorFrame` via context.
2. [ ] `VectorPoints` instanced mesh (performance) + color derived from token hash → palette.
3. [ ] `VectorEdges` as `Line2` (drei) or custom shader line segments.
4. [ ] Basic camera controls (`OrbitControls`).
5. [ ] Introduce `VectorFrameContext` + provider mapping latest frame.
6. [ ] Snapshot test verifying that given a mock frame, points render expected count.

Acceptance Criteria:
- Renders <5ms per frame for 1K points (profiling note placeholder).
- Camera orbit functional.

---
## Epic 4: Theming & Palette System Integration
Purpose: Reuse existing accent theme; expose semantic color channels to 3D.

Tasks:
1. [ ] Add `useAccentTheme()` hook mapping accent to gradient stops & neutral ramp.
2. [ ] Provide `ColorPaletteContext` to 3D components.
3. [ ] Token color = function(hash) cycling palette with lightness variance.
4. [ ] Tests: mapping accent 'emerald' yields expected primary color hex.

Acceptance Criteria:
- Switching accent in footer triggers re-render with new colors.

---
## Epic 5: Animation & Effects Layer
Purpose: Add motion and visual richness while isolating performance cost.

Tasks:
1. [ ] Add `effects/Glow.tsx`, `effects/TrailField.tsx`, `effects/PulseWave.tsx`.
2. [ ] Use toggles in context: `effects.enabled = { glow:true, trails:false, pulse:true }`.
3. [ ] Param interface for future UI controls (speed, intensity).
4. [ ] Ensure effects degrade gracefully (disable on low perf – `prefers-reduced-motion`).
5. [ ] Tests: effect components mount & respect disabled flag.

Acceptance Criteria:
- Disabling an effect removes its draw calls.
- No significant FPS drop (<15% vs baseline on 1K points – note placeholder measurement procedure).

---
## Epic 6: Control Surface & UI Integration
Purpose: Provide user manipulable controls for modes & visuals.

Tasks:
1. [ ] Add `VisualizationControls` panel (collapsible). Initially: toggles for effects, point size slider, edge density slider.
2. [ ] Persist controls in `localStorage` namespace `ppviz:`.
3. [ ] Integrate `leva` (deferred until here) OR custom minimal UI (decide based on bundle size guard).
4. [ ] Accessibility: all controls keyboard operable; ARIA labels.
5. [ ] Tests: persistence round-trip & ARIA roles present.

Acceptance Criteria:
- Refresh retains prior settings.
- Toggling effect updates scene within 1 animation frame.

---
## Epic 7: Visualization Modes Abstraction
Purpose: Future-proof for multiple semantic layouts.

Tasks:
1. [ ] Add `LayoutStrategy` interface: `compute(points, opts) => PositionedPoints`.
2. [ ] Implement strategies: `radialSpiral`, `clusterByGroup` (placeholder), `sequentialPath`.
3. [ ] Mode switch updates layout without full re-vectorization (reuse tokens cache).
4. [ ] Tests: strategies produce distinct bounding boxes & deterministic outputs.

Acceptance Criteria:
- Switching modes <100ms for 1K points.

---
## Epic 8: Performance & Diagnostics
Purpose: Ensure scalability and provide introspection.

Tasks:
1. [ ] Add lightweight profiler overlay (point count, frame time, memory trend approx).
2. [ ] Batch updates using `useMemo` & `InstancedBufferAttributes`.
3. [ ] Add fallback to wireframe-only mode when FPS < threshold for >2 seconds.
4. [ ] Tests: mock performance hook chooses fallback when forced low FPS signal.

Acceptance Criteria:
- Memory growth bounded (no retained stale frames in heap in dev snapshot test – manual doc procedure).

---
## Epic 9: Export & Sharing (Optional Stretch)
Purpose: Allow users to capture state.

Tasks:
1. [ ] PNG export via `gl.domElement.toDataURL()`.
2. [ ] JSON export of `VectorFrame`.
3. [ ] (Stretch) Short animation capture using frame capture library (investigate cost).

Acceptance Criteria:
- Export buttons produce non-empty outputs.

---
## Epic 10: Documentation & Developer Experience
Purpose: Maintain clarity for incoming agents.

Tasks:
1. [ ] Add `docs/visualizer/architecture.md` with updated diagrams.
2. [ ] Write `docs/visualizer/performance.md` describing optimization levers.
3. [ ] Inline JSDoc for all public interfaces.
4. [ ] Update root plan file progress markers.
5. [ ] Devlog entries per epic PR (e.g., `docs/devlog/PR-00XX-visualizer-epic-<n>.md`).

Acceptance Criteria:
- Coverage ≥80% for `lib/vectorization` & layout strategies.

---
## Cross-Cutting Concerns
| Concern | Approach |
|---------|----------|
| Determinism | Pure hash-based placement; seed from stable token index. |
| Accessibility | Provide reduced motion mode & semantic labels. |
| Performance | Instancing, memoization, lazy-loading effects. |
| Theming | Leverage existing accent context and CSS variables. |
| Testing | Unit (lib), rendering (React Testing Library), snapshot (structure), perf heuristics (mock timers). |
| Error Handling | Error boundary around Canvas; fallback UI with retry. |
| State Persistence | localStorage with versioning key `ppviz:v1`. |

---
## Sequencing Guidelines
- Only merge after green tests & docs for that epic.
- Avoid adding future-epic code paths prematurely—keep diffs focused.
- If API surfaces shift, update Appendix & architecture docs before PR approval.

---
## Open Questions (To Revisit Before Epics 5+)
1. Do we constrain token count (e.g., cap at 1500 points) for first release? (Proposed yes with soft warning.)
2. Will we add embeddings via external model locally? (Defer; placeholder hook.)
3. Should export include effect parameters for reproduction? (Proposed yes in JSON.)

Track answers in `docs/visualizer/architecture.md` once decided.

---
## Initial TODO Status Snapshot
- Epic 0: 1/4 complete
- Others: 0%

Update regularly.

---
Maintainers: Add new epics or adjust acceptance criteria as scope evolves. Keep this file concise—if it grows unwieldy, split by epic under `docs/visualizer/epics/`.
