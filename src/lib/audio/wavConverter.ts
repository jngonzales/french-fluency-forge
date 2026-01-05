/**
 * WAV Audio Converter
 * Converts any audio format to WAV PCM for Azure Speech API compatibility
 */

/**
 * Convert audio blob to WAV format (16kHz, mono, PCM)
 * Azure Pronunciation Assessment requires WAV for best results
 */
export async function convertToWav(audioBlob: Blob): Promise<Blob> {
  try {
    console.log('[WAV Converter] Starting conversion...');
    console.log('[WAV Converter] Input format:', audioBlob.type, 'Size:', audioBlob.size);

    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 16000, // Azure optimal sample rate
    });

    // Read blob as array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log('[WAV Converter] Decoded audio:', {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
    });

    // Get audio data (convert to mono if needed)
    let audioData: Float32Array;
    if (audioBuffer.numberOfChannels === 1) {
      audioData = audioBuffer.getChannelData(0);
    } else {
      // Mix down to mono
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      audioData = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        audioData[i] = (left[i] + right[i]) / 2;
      }
    }

    // Resample to 16kHz if needed
    let resampledData = audioData;
    if (audioBuffer.sampleRate !== 16000) {
      console.log('[WAV Converter] Resampling from', audioBuffer.sampleRate, 'to 16000 Hz');
      resampledData = resampleAudio(audioData, audioBuffer.sampleRate, 16000);
    }

    // Convert float32 to int16 (WAV PCM format)
    const pcmData = new Int16Array(resampledData.length);
    for (let i = 0; i < resampledData.length; i++) {
      // Clamp to [-1, 1] and convert to 16-bit integer
      const s = Math.max(-1, Math.min(1, resampledData[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Create WAV file
    const wavBlob = createWavBlob(pcmData, 16000, 1);
    
    console.log('[WAV Converter] Conversion complete');
    console.log('[WAV Converter] Output format: audio/wav, Size:', wavBlob.size);
    console.log('[WAV Converter] Sample rate: 16kHz, Channels: 1 (mono)');

    // Clean up
    await audioContext.close();

    return wavBlob;
  } catch (error) {
    console.error('[WAV Converter] Error:', error);
    throw new Error(`WAV conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Resample audio data from one sample rate to another
 */
function resampleAudio(
  audioData: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  if (fromRate === toRate) {
    return audioData;
  }

  const ratio = fromRate / toRate;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const sourceIndex = i * ratio;
    const sourceIndexFloor = Math.floor(sourceIndex);
    const sourceIndexCeil = Math.min(sourceIndexFloor + 1, audioData.length - 1);
    const fraction = sourceIndex - sourceIndexFloor;

    // Linear interpolation
    result[i] = audioData[sourceIndexFloor] * (1 - fraction) + 
                audioData[sourceIndexCeil] * fraction;
  }

  return result;
}

/**
 * Create WAV blob from PCM data
 */
function createWavBlob(
  pcmData: Int16Array,
  sampleRate: number,
  numChannels: number
): Blob {
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // WAV file header (44 bytes)
  
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // File size - 8
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // Write PCM data
  const offset = 44;
  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(offset + i * 2, pcmData[i], true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Write string to DataView
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Check if browser supports WAV conversion
 */
export function canConvertToWav(): boolean {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
}

/**
 * Get optimal audio format for pronunciation assessment
 */
export function getOptimalAudioFormat(): string {
  // WAV is always optimal for Azure
  return 'audio/wav';
}

