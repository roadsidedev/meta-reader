# Performance & Mobile Guide

## Performance Targets

StoryStage targets the following performance metrics to deliver a smooth, responsive experience on mid-range mobile devices:

| Metric | Target | Rationale |
|--------|--------|-----------|
| Frame Rate | 60fps minimum (120fps on high-end) | Smooth text highlighting and particle animation |
| Pretext Layout | <0.1ms per layout | Ensures sub-millisecond text reflow |
| AI Latency | <200ms (chunk to visual update) | Imperceptible delay between narration and scene change |
| Canvas Redraw | 30fps on low-battery | Extends battery life without noticeable degradation |
| Initial Load | <3s on 4G | Fast startup for mobile users |
| EPUB Parse | <2s for 100KB file | Quick import and chapter extraction |

## Mobile Device Targets

**Primary:** iPhone 13 (A15 Bionic, 6GB RAM), Samsung Galaxy A52 (Snapdragon 720G, 4GB RAM).

**Secondary:** iPad (7th gen), Pixel 6a.

**Fallback:** iPhone 11 (A13 Bionic, 4GB RAM) – ensures graceful degradation on older devices.

## Optimization Strategies

### 1. Canvas Rendering

**Use OffscreenCanvas for heavy computations:** Offload particle calculations to a worker thread, then composite results back to main canvas.

```typescript
// Main thread
const offscreenCanvas = canvas.transferControlToOffscreen();
const worker = new Worker('particle-worker.js');
worker.postMessage({ canvas: offscreenCanvas }, [offscreenCanvas]);

// Worker thread
self.onmessage = (event) => {
  const { canvas } = event.data;
  const ctx = canvas.getContext('2d');
  // Compute particles and draw
};
```

**Batch canvas operations:** Group multiple `fillRect`, `fillText`, and `drawImage` calls to minimize state changes.

**Use `requestAnimationFrame` for smooth updates:** Synchronize all canvas redraws to the browser's refresh rate.

### 2. Pretext Optimization

**Pre-layout text:** Prepare Pretext layout during idle time (using `requestIdleCallback`) to avoid jank during playback.

```typescript
useEffect(() => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      const prepared = prepareWithSegments(upcomingChunk, fontString);
      setPreparedText(prepared);
    });
  }
}, [upcomingChunk]);
```

**Virtualize long chapters:** Only layout and render visible text + 1–2 buffer paragraphs. Use Pretext `layoutNextLine` for incremental layout.

**Cache layout results:** Store layout results in a Map keyed by chunk ID to avoid re-computing identical layouts.

### 3. AI & TTS Optimization

**Local-first analysis:** Use `@xenova/transformers` for instant mood classification before making cloud API calls.

**Batch API requests:** Combine multiple narration chunks into a single cloud API call to reduce latency and bandwidth.

**Cache AI responses:** Store scene prompts and mood classifications in IndexedDB; reuse for similar narration patterns.

**Async cloud calls:** Use `Promise.all` to parallelize multiple API requests without blocking rendering.

### 4. Memory Management

**Reuse particle objects:** Pre-allocate a pool of particle objects and recycle them instead of creating new ones.

```typescript
class ParticlePool {
  private pool: Particle[] = [];
  private active: Particle[] = [];

  acquire(): Particle {
    return this.pool.pop() || { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, type: 'ember' };
  }

  release(particle: Particle): void {
    this.pool.push(particle);
  }

  update(deltaTime: number): void {
    this.active = this.active.filter((p) => {
      p.life -= deltaTime;
      return p.life > 0;
    });
  }
}
```

**Minimize re-renders:** Use `React.memo` and `useMemo` to prevent unnecessary component updates.

**Lazy-load components:** Use dynamic imports for theater controls and settings panels.

### 5. Battery & Thermal Management

**Detect battery level:** Use Battery Status API to throttle animations on low battery.

```typescript
const battery = await navigator.getBattery?.();
if (battery && battery.level < 0.2) {
  // Throttle particles to 30fps
  particleUpdateInterval = 33; // ms
}
```

**Disable effects on thermal throttling:** Monitor device temperature via performance metrics; disable particles if device is overheating.

**Use `prefers-reduced-motion`:** Respect user's motion preferences and disable animations if requested.

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion) {
  // Enable animations
}
```

## Mobile-Specific Considerations

### Touch Performance

**Debounce touch events:** Throttle slider and progress bar updates to 100ms to avoid excessive re-renders.

**Use passive event listeners:** Add `{ passive: true }` to scroll and touch listeners to enable browser optimizations.

```typescript
canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
```

**Avoid layout thrashing:** Batch DOM reads and writes; use `requestAnimationFrame` to group updates.

### Responsive Canvas Sizing

**Use CSS media queries:** Define canvas dimensions in CSS and read from `getComputedStyle` to ensure consistency.

**Handle device pixel ratio:** Always multiply canvas dimensions by `devicePixelRatio` for crisp rendering on high-DPI displays.

**Debounce resize events:** Throttle resize handler to 200ms to avoid excessive re-layouts.

### Network Optimization

**Lazy-load EPUB chapters:** Download chapters on-demand instead of loading the entire file upfront.

**Compress TTS audio:** Use lossy compression (MP3, AAC) to reduce bandwidth; cache on device via IndexedDB.

**Implement service worker:** Cache EPUB files, TTS audio, and UI assets for offline playback.

## Testing on Mobile Devices

### Chrome DevTools Mobile Emulation

1. Open DevTools (F12).
2. Click the device toggle (mobile icon).
3. Select target device (iPhone 13, Galaxy A52).
4. Throttle network to "Slow 4G" and CPU to "4x slowdown" to simulate real conditions.
5. Use Performance tab to profile canvas rendering and identify bottlenecks.

### Real Device Testing

**iOS:** Use Safari DevTools via Mac to profile on real iPhone.

**Android:** Use Chrome DevTools remote debugging to profile on real Android device.

**Metrics to monitor:**
- Frame rate (target 60fps).
- Memory usage (target <100MB).
- CPU usage (target <50% sustained).
- Battery drain (target <5% per hour of playback).

### Performance Profiling

Use the Performance API to measure critical operations:

```typescript
performance.mark('pretext-layout-start');
const { lines, height } = layoutWithLines(prepared, width, lineHeight);
performance.mark('pretext-layout-end');
performance.measure('pretext-layout', 'pretext-layout-start', 'pretext-layout-end');

const measure = performance.getEntriesByName('pretext-layout')[0];
console.log(`Pretext layout took ${measure.duration.toFixed(2)}ms`);
```

## Deployment Checklist

- [ ] Pretext layout benchmarked <0.1ms on target devices.
- [ ] Canvas rendering maintains 60fps on iPhone 13 and Galaxy A52.
- [ ] AI latency <200ms from narration boundary to visual update.
- [ ] Memory usage stable at <100MB during 30-minute playback session.
- [ ] Battery drain <5% per hour on real device.
- [ ] Service worker caches EPUB and TTS audio for offline playback.
- [ ] Mobile controls tested on iOS Safari and Android Chrome.
- [ ] Orientation change (portrait ↔ landscape) handled smoothly without jank.
- [ ] High-contrast mode accessible and readable.
- [ ] Keyboard navigation works on all controls.
