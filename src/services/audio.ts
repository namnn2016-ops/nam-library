// Web Audio API Sound Synthesizer cho nam-libary
// Không phụ thuộc vào file âm thanh bên ngoài, phát trực tiếp qua audio hardware

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('AudioContext không được hỗ trợ:', e);
    return null;
  }
}

/**
 * Phát âm thanh "Tít ngắn" (Thao tác hợp lệ: mượn, trả, gia hạn thành công)
 * Tần số cao (880Hz - nốt A5), thời lượng ngắn (0.12s), âm sắc trong trẻo
 */
export function playSuccessBeep() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz (A5)
    
    // Envelope: bắt đầu êm, tắt nhanh
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.13);
  } catch (e) {
    console.error('Lỗi phát âm thanh thành công:', e);
  }
}

/**
 * Phát âm thanh "Tít dài" (Cảnh báo / Lỗi: mã sai, quá hạn, vi phạm giới hạn)
 * Tần số trầm hơn (320Hz), thời lượng dài (0.45s), âm sắc rõ ràng
 */
export function playErrorBeep() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth'; // Âm thanh sắc nét hơn để báo lỗi
    osc.frequency.setValueAtTime(320, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.46);
  } catch (e) {
    console.error('Lỗi phát âm thanh lỗi:', e);
  }
}
