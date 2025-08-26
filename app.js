const startBtn = document.getElementById("startBtn");
const output = document.getElementById("output");
const micIndicator = document.getElementById("mic-indicator");
const micText = document.getElementById("mic-text");

let listening = false;
let audioCtx;
let referenceFingerprints = {};

// Carichiamo e processiamo i file audio
async function loadReferenceTracks() {
  const files = ["track1.mp3", "track2.mp3", "track3.mp3"];
  for (let file of files) {
    const response = await fetch(`sounds/${file}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await audioCtx.decodeAudioData(arrayBuffer);
    referenceFingerprints[file] = computeFingerprint(buffer);
  }
  console.log("Fingerprint caricati:", referenceFingerprints);
}

// Calcola fingerprint medio di un audio buffer
function computeFingerprint(audioBuffer) {
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  source.start();

  return new Promise(resolve => {
    setTimeout(() => {
      analyser.getByteFrequencyData(dataArray);
      source.stop();
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      resolve(avg);
    }, 1000); // aspettiamo 1 secondo per analizzare
  });
}

// Confronta un fingerprint con i reference
function matchTrack(avg) {
  let bestMatch = null;
  let bestDiff = Infinity;
  for (let track in referenceFingerprints) {
    const diff = Math.abs(referenceFingerprints[track] - avg);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestMatch = track;
    }
  }
  return bestMatch;
}

// Avvio ascolto microfono
startBtn.onclick = async () => {
  if (listening) return;
  listening = true;
  output.textContent = "🎤 In ascolto...";
  micIndicator.classList.add("listening");
  micText.textContent = "Ascolto...";

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  await loadReferenceTracks();

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  const source = audioCtx.createMediaStreamSource(stream);
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  let seconds = 0;
  const listenSeconds = 5;

  function analyze() {
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

    const match = matchTrack(avg);
    if (match) {
      output.textContent = `✅ Riconosciuta: ${match}`;
      stopListening(stream);
      return;
    }

    seconds += 0.2;
    if (seconds < listenSeconds) {
      requestAnimationFrame(analyze);
    } else {
      output.textContent = "❌ Nessuna traccia riconosciuta";
      stopListening(stream);
    }
  }

  analyze();
};

function stopListening(stream) {
  listening = false;
  micIndicator.classList.remove("listening");
  micText.textContent = "Spento";
  stream.getTracks().forEach(track => track.stop());
}
