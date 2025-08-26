let audioCtx, analyser, source;
let refTracks = {};
let refFingerprints = {};

// Calcola un fingerprint molto semplice (puoi migliorarlo con librerie più avanzate)
function getFingerprintFromBuffer(buffer) {
  const arr = new Float32Array(buffer.length);
  buffer.copyFromChannel(arr, 0);
  let sum = 0;
  let energy = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += Math.abs(arr[i]);
    energy += arr[i] * arr[i];
  }
  return { avg: sum / arr.length, energy: Math.sqrt(energy / arr.length) };
}

async function loadReferenceTracks() {
  const ctx = new AudioContext();
  const fetchAndDecode = async (url) => {
    const resp = await fetch(url);
    const buf = await resp.arrayBuffer();
    return await ctx.decodeAudioData(buf);
  };

  // Carica le tue tracce da /sounds
  refTracks["track1"] = await fetchAndDecode("sounds/track1.wav");
  refTracks["track2"] = await fetchAndDecode("sounds/track2.wav");
  refTracks["track3"] = await fetchAndDecode("sounds/track3.wav");

  // Calcola fingerprint di riferimento
  for (const [name, buffer] of Object.entries(refTracks)) {
    refFingerprints[name] = getFingerprintFromBuffer(buffer.getChannelData(0));
  }

  document.getElementById("status").innerText = "Tracce caricate.";
}

async function startListening() {
  audioCtx = new AudioContext();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  source = audioCtx.createMediaStreamSource(stream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  document.getElementById("status").innerText = "🎧 In ascolto...";
  detectLoop();
}

function detectLoop() {
  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);

  // fingerprint del microfono
  let sum = 0;
  let energy = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += Math.abs(buffer[i]);
    energy += buffer[i] * buffer[i];
  }
  const micFingerprint = { avg: sum / buffer.length, energy: Math.sqrt(energy / buffer.length) };

  // Confronto molto grezzo: differenza minima
  let bestMatch = null;
  let bestDiff = Infinity;

  for (const [name, ref] of Object.entries(refFingerprints)) {
    const diff = Math.abs(micFingerprint.avg - ref.avg) + Math.abs(micFingerprint.energy - ref.energy);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestMatch = name;
    }
  }

  if (bestMatch && bestDiff < 0.01) { // soglia da regolare
    document.getElementById("message").innerText = `🔓 Riconosciuta: ${bestMatch}`;
  }

  requestAnimationFrame(detectLoop);
}

document.getElementById("startBtn").addEventListener("click", async () => {
  await loadReferenceTracks();
  await startListening();
});

// Registra service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
