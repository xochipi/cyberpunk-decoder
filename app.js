const referenceTracks = [
  { file: "sounds/track1.mp3", message: "🔓 Codice sbloccato: 1234" },
  { file: "sounds/track2.mp3", message: "📡 Segnale radio intercettato" },
  { file: "sounds/track3.mp3", message: "💾 Dati nascosti trovati" }
];

const startBtn = document.getElementById("startBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

let audioCtx;
let referenceBuffers = [];

async function loadReferenceTracks() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  for (let track of referenceTracks) {
    const resp = await fetch(track.file);
    const arrBuf = await resp.arrayBuffer();
    const audioBuf = await audioCtx.decodeAudioData(arrBuf);
    referenceBuffers.push({ buffer: audioBuf, message: track.message });
  }
}

function compareAudio(inputBuffer) {
  for (let ref of referenceBuffers) {
    // Confronto super semplificato: media di energia del segnale
    const inputData = inputBuffer.getChannelData(0);
    const refData = ref.buffer.getChannelData(0);

    const inputEnergy = inputData.reduce((a, b) => a + Math.abs(b), 0);
    const refEnergy = refData.reduce((a, b) => a + Math.abs(b), 0);

    const ratio = inputEnergy / refEnergy;

    if (ratio > 0.8 && ratio < 1.2) {
      return ref.message;
    }
  }
  return null;
}

async function startListening() {
  statusEl.textContent = "🎙️ Attivazione microfono...";
  await loadReferenceTracks();

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  source.connect(analyser);

  const processor = audioCtx.createScriptProcessor(4096, 1, 1);
  analyser.connect(processor);
  processor.connect(audioCtx.destination);

  statusEl.textContent = "🎙️ Microfono attivo, sto ascoltando...";

  processor.onaudioprocess = (e) => {
    const inputBuffer = e.inputBuffer;
    const match = compareAudio(inputBuffer);

    if (match) {
      resultEl.textContent = match;
    }
  };
}

startBtn.onclick = startListening;
