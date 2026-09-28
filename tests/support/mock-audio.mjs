// A stand-in for the Web Audio API that makes no sound and counts what it is asked to do (docs/AUDIO.md §7): for unit
// tests in node, and - the same function's source, installed before the page loads - for `npm run test:audio` in a
// headless browser. `installMockAudio` must stay self-contained (no imports, no closure over this module): it is sent
// to the browser as text.
export function installMockAudio(target) {
  const log = { contexts: 0, nodes: 0, starts: 0, bySource: {}, resumed: 0 };
  class Param {
    constructor(value = 0) { this.value = value; }
    setValueAtTime(value) { this.value = value; return this; }
    linearRampToValueAtTime(value) { this.value = value; return this; }
    exponentialRampToValueAtTime(value) { this.value = value; return this; }
    setTargetAtTime(value) { this.value = value; return this; }
    cancelScheduledValues() { return this; }
  }
  class Node {
    constructor(ctx) { this.context = ctx; log.nodes++; this.outputs = []; }
    connect(node) { this.outputs.push(node); return node; }
    disconnect() { this.outputs = []; }
  }
  class Source extends Node {
    start() { log.starts++; this.started = true; }
    stop() { this.stopped = true; }
  }
  class Context {
    constructor() {
      log.contexts++;
      this.currentTime = 0; this.sampleRate = 8000; this.state = 'running';
      this.destination = new Node(this);
    }
    createGain() { const n = new Node(this); n.gain = new Param(1); return n; }
    createBiquadFilter() { const n = new Node(this); n.type = 'lowpass'; n.frequency = new Param(350); n.Q = new Param(1); n.gain = new Param(0); return n; }
    createStereoPanner() { const n = new Node(this); n.pan = new Param(0); return n; }
    createDynamicsCompressor() { const n = new Node(this); for (const key of ['threshold', 'knee', 'ratio', 'attack', 'release']) n[key] = new Param(0); return n; }
    createOscillator() { const n = new Source(this); n.type = 'sine'; n.frequency = new Param(440); n.detune = new Param(0); return n; }
    createBufferSource() { const n = new Source(this); n.buffer = null; n.loop = false; n.playbackRate = new Param(1); return n; }
    createBuffer(channels, length, rate) { const data = new Float32Array(length); return { length, sampleRate: rate, numberOfChannels: channels, getChannelData: () => data }; }
    resume() { log.resumed++; this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
  }
  target.AudioContext = Context;
  target.webkitAudioContext = Context;
  target.__mockAudio = log;
  return { AudioContext: Context, log };
}

/** For node: a mock with a clock the test moves. */
export function createMockAudio() {
  const holder = {};
  const { AudioContext, log } = installMockAudio(holder);
  return { AudioContext, log, advance(ctx, seconds) { ctx.currentTime += seconds; } };
}
