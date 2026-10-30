/* AI Noise Remover — browser-side spectral denoising engine (v1 DSP).
   Engine slot: replace/extend with DeepFilterNet WASM later via DenoiseEngine. */
(function () {
  "use strict";

  var UI = Object.assign({
    choose: "Choose an audio file",
    drop: "or drag & drop an audio / video file here",
    analyzing: "Analyzing noise profile…",
    denoising: "Denoising… {p}%",
    done: "Done ✓ Compare the two players, then download.",
    noAudio: "Could not find an audio track in this file.",
    decodeFail: "This file format is not supported — try MP3, WAV, M4A, OGG or WebM.",
    download: "↓ Download cleaned audio (WAV)",
    before: "Before",
    after: "After",
    strength: "Noise reduction strength",
    low: "Gentle", medium: "Balanced", high: "Aggressive"
  }, window.UI_STRINGS || {});

  var $ = function (id) { return document.getElementById(id); };
  var STRENGTH = { low: 1.6, medium: 2.4, high: 3.4 }; // spectral subtraction oversubtraction factor

  var state = { ctx: null, beforeBuf: null, afterBuf: null, fileName: "audio" };

  /* ---------- STFT Wiener denoiser (decision-directed, Ephraim-Malah style) ---------- */
  function denoise(buffer, factor) {
    var mono = mixToMono(buffer);
    var N = 2048, hop = N / 4, win = hann(N);
    var half = N / 2 + 1;
    var frames = Math.floor((mono.length - N) / hop) + 1;
    if (frames < 4) throw new Error("too-short");
    var out = new Float32Array(mono.length + N);

    // --- noise PSD: init from the quietest 10% of frames, then track with running minimum
    var frameEnergy = new Float32Array(frames);
    for (var f = 0; f < frames; f++) {
      var e = 0;
      for (var i = 0; i < N; i++) { var s = mono[f * hop + i]; e += s * s; }
      frameEnergy[f] = e;
    }
    var quiet = Array.prototype.map.call(frameEnergy, function (v, k) { return k; })
      .sort(function (a, b) { return frameEnergy[a] - frameEnergy[b]; })
      .slice(0, Math.max(2, Math.floor(frames * 0.1)));
    var noisePsd = new Float32Array(half);
    for (var t = 0; t < quiet.length; t++) {
      var seg = mono.subarray(quiet[t] * hop, quiet[t] * hop + N);
      var m0 = stftMagnitudes(seg, win);
      for (var k = 0; k < half; k++) noisePsd[k] += m0[k] * m0[k];
    }
    for (k = 0; k < half; k++) noisePsd[k] /= quiet.length;
    smoothFreq(noisePsd);

    var prevGain = new Float32Array(half); prevGain.fill(1);
    var prevPsd = new Float32Array(half);
    var re = new Float32Array(N), im = new Float32Array(N);
    var winSqSum = 0;
    for (i = 0; i < N; i++) winSqSum += win[i] * win[i];

    for (f = 0; f < frames; f++) {
      var off = f * hop;
      for (i = 0; i < N; i++) { re[i] = mono[off + i] * win[i]; im[i] = 0; }
      fft(re, im, false);

      var noisyPsd = new Float32Array(half);
      for (k = 0; k < half; k++) noisyPsd[k] = re[k] * re[k] + im[k] * im[k];

      // decision-directed a-priori SNR
      for (k = 0; k < half; k++) {
        var nPsd = Math.max(noisePsd[k], 1e-12);
        var snrPost = noisyPsd[k] / nPsd - 1;
        var snrPrior = 0.98 * prevGain[k] * prevGain[k] * prevPsd[k] / nPsd
                     + 0.02 * Math.max(snrPost, 0);
        // Wiener gain, strength "factor" sharpens the subtraction via snr scale
        var g = snrPrior / (snrPrior + factor);
        g = Math.max(g, 0.05);
        prevGain[k] = g;
        prevPsd[k] = Math.max(g * g * noisyPsd[k], 0); // estimated clean psd
        re[k] *= g; im[k] *= g;
        if (k > 0 && k < N / 2) { re[N - k] = re[k]; im[N - k] = -im[k]; }
      }

      fft(re, im, true);
      for (i = 0; i < N; i++) out[off + i] += re[i] * win[i] / winSqSum;
    }
    return bufferToStereo(out.subarray(0, mono.length), buffer);
  }

  function smoothFreq(arr) {
    for (var k = 1; k < arr.length - 1; k++) arr[k] = 0.25 * arr[k - 1] + 0.5 * arr[k] + 0.25 * arr[k + 1];
  }

  function mixToMono(buffer) {
    var len = buffer.length, out = new Float32Array(len), ch = buffer.numberOfChannels;
    for (var c = 0; c < ch; c++) {
      var d = buffer.getChannelData(c);
      for (var i = 0; i < len; i++) out[i] += d[i] / ch;
    }
    // gentle high-pass (~80 Hz one-pole) to cut rumble before denoising
    var fs = buffer.sampleRate || 48000;
    var a = 1 / (1 + 2 * Math.PI * 80 / fs);
    var prevIn = 0, prevOut = 0;
    for (var i = 0; i < len; i++) {
      var x = out[i];
      prevOut = a * (prevOut + x - prevIn);
      prevIn = x;
      out[i] = prevOut;
    }
    return out;
  }
  function bufferToStereo(mono, ref) {
    var buf = audioCtx().createBuffer(ref.numberOfChannels > 1 ? 2 : 1, mono.length, ref.sampleRate);
    var d0 = buf.getChannelData(0);
    if (buf.numberOfChannels === 1) { d0.set(mono); return buf; }
    var d1 = buf.getChannelData(1);
    for (var i = 0; i < mono.length; i++) { d0[i] = mono[i]; d1[i] = mono[i]; }
    return buf;
  }
  function stftMagnitudes(seg, win) {
    var N = win.length, re = new Float32Array(N), im = new Float32Array(N);
    for (var i = 0; i < N; i++) re[i] = (seg[i] || 0) * win[i];
    fft(re, im, false);
    var half = N / 2 + 1, mag = new Float32Array(half);
    for (var k = 0; k < half; k++) mag[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    return mag;
  }
  function hann(N) { var w = new Float32Array(N); for (var i = 0; i < N; i++) w[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1))); return w; }

  /* iterative radix-2 FFT (in-place) */
  function fft(re, im, inverse) {
    var n = re.length, bits = Math.log2(n) | 0;
    for (var i = 1, j = 0; i < n; i++) {
      var bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { var tr = re[i]; re[i] = re[j]; re[j] = tr; var ti = im[i]; im[i] = im[j]; im[j] = ti; }
    }
    for (var len = 2; len <= n; len <<= 1) {
      var ang = (inverse ? 2 : -2) * Math.PI / len;
      var wr = Math.cos(ang), wi = Math.sin(ang);
      for (i = 0; i < n; i += len) {
        var cr = 1, ci = 0;
        for (j = 0; j < len / 2; j++) {
          var ur = re[i + j], ui = im[i + j];
          var vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci;
          var vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr;
          re[i + j] = ur + vr; im[i + j] = ui + vi;
          re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi;
          var ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
        }
      }
    }
    if (inverse) for (i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }

  function audioCtx() {
    if (!state.ctx) state.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return state.ctx;
  }

  /* ---------- WAV encoder ---------- */
  function encodeWav(buffer) {
    var chans = buffer.numberOfChannels, len = buffer.length, sr = buffer.sampleRate;
    var bytes = 44 + len * chans * 2;
    var ab = new ArrayBuffer(bytes), v = new DataView(ab);
    function str(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
    str(0, "RIFF"); v.setUint32(4, bytes - 8, true); str(8, "WAVE"); str(12, "fmt ");
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, chans, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * chans * 2, true);
    v.setUint16(32, chans * 2, true); v.setUint16(34, 16, true);
    str(36, "data"); v.setUint32(40, len * chans * 2, true);
    var o = 44;
    var data = [];
    for (var c = 0; c < chans; c++) data.push(buffer.getChannelData(c));
    for (var i = 0; i < len; i++) for (c = 0; c < chans; c++) {
      var s = Math.max(-1, Math.min(1, data[c][i]));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2;
    }
    return new Blob([ab], { type: "audio/wav" });
  }

  /* ---------- UI wiring ---------- */
  function setStatus(msg) { $("status").textContent = msg; }

  function handleFile(file) {
    if (!file) return;
    state.fileName = (file.name || "audio").replace(/\.[^.]+$/, "");
    setStatus(UI.analyzing);
    var reader = new FileReader();
    reader.onload = function () {
      audioCtx().decodeAudioData(reader.result, function (buf) {
        if (!buf.numberOfChannels || !buf.length) { setStatus(UI.noAudio); return; }
        state.beforeBuf = buf;
        $("playerBefore").src = URL.createObjectURL(new Blob([reader.result]));
        var strength = STRENGTH[$("strength").value] || STRENGTH.medium;
        setTimeout(function () {
          try {
            state.afterBuf = denoise(buf, strength);
            var blob = encodeWav(state.afterBuf);
            $("playerAfter").src = URL.createObjectURL(blob);
            var dl = $("download");
            dl.href = URL.createObjectURL(blob);
            dl.download = state.fileName + "-denoised.wav";
            dl.style.display = "inline-block";
            setStatus(UI.done);
          } catch (e) {
            setStatus(e.message === "too-short" ? UI.noAudio : UI.decodeFail);
          }
        }, 30);
      }, function () { setStatus(UI.decodeFail); });
    };
    reader.readAsArrayBuffer(file);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var fileInput = $("file"), dropZone = $("dropZone");
    fileInput.addEventListener("change", function () { handleFile(fileInput.files[0]); });
    ["dragover", "dragenter"].forEach(function (ev) {
      dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.add("drag"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      dropZone.addEventListener(ev, function (e) { e.preventDefault(); dropZone.classList.remove("drag"); });
    });
    dropZone.addEventListener("drop", function (e) { handleFile(e.dataTransfer.files[0]); });
    $("strength").addEventListener("change", function () {
      if (state.beforeBuf) handleFileFromBuffer();
    });
    function handleFileFromBuffer() {
      if (state.beforeBuf) {
        var strength = STRENGTH[$("strength").value] || STRENGTH.medium;
        setStatus(UI.analyzing);
        setTimeout(function () {
          state.afterBuf = denoise(state.beforeBuf, strength);
          var blob = encodeWav(state.afterBuf);
          $("playerAfter").src = URL.createObjectURL(blob);
          var dl = $("download");
          dl.href = URL.createObjectURL(blob);
          dl.download = state.fileName + "-denoised.wav";
          dl.style.display = "inline-block";
          setStatus(UI.done);
        }, 30);
      }
    }
  });
})();
