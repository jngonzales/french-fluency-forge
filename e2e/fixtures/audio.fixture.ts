import { Page } from '@playwright/test';

/**
 * Mock MediaStream and MediaRecorder for audio recording tests
 */
export async function mockAudioRecording(page: Page) {
  await page.addInitScript(() => {
    // Create a mock MediaStream
    class MockMediaStream {
      active = true;
      id = 'mock-stream-id';
      
      getTracks() {
        return [
          {
            kind: 'audio',
            id: 'mock-audio-track',
            enabled: true,
            stop: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
          }
        ];
      }
      
      getAudioTracks() {
        return this.getTracks();
      }
      
      getVideoTracks() {
        return [];
      }
      
      addTrack() {}
      removeTrack() {}
      addEventListener() {}
      removeEventListener() {}
    }

    // Mock MediaRecorder
    class MockMediaRecorder extends EventTarget {
      state = 'inactive';
      ondataavailable: ((event: any) => void) | null = null;
      onstop: ((event: any) => void) | null = null;
      onerror: ((event: any) => void) | null = null;
      
      private chunks: Blob[] = [];
      private startTime: number = 0;
      
      constructor(stream: any, options?: any) {
        super();
        this.state = 'inactive';
      }
      
      start() {
        this.state = 'recording';
        this.startTime = Date.now();
        this.chunks = [];
      }
      
      stop() {
        this.state = 'inactive';
        
        // Create a realistic mock audio blob (webm format)
        // This is a minimal valid WebM file with Opus audio
        const mockAudioData = new Uint8Array([
          0x1a, 0x45, 0xdf, 0xa3, // EBML header
          0x01, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x1f,
          0x42, 0x86, 0x81, 0x01,
          0x42, 0xf7, 0x81, 0x01,
          0x42, 0xf2, 0x81, 0x04,
          0x42, 0xf3, 0x81, 0x08,
          0x42, 0x82, 0x88, 0x77, 0x65, 0x62, 0x6d,
          0x42, 0x87, 0x81, 0x04,
          0x42, 0x85, 0x81, 0x02,
        ]);
        
        const blob = new Blob([mockAudioData], { type: 'audio/webm;codecs=opus' });
        
        // Dispatch dataavailable event
        if (this.ondataavailable) {
          this.ondataavailable({ data: blob });
        }
        this.dispatchEvent(new CustomEvent('dataavailable', { detail: { data: blob } }));
        
        // Dispatch stop event
        if (this.onstop) {
          this.onstop(new Event('stop'));
        }
        this.dispatchEvent(new Event('stop'));
      }
      
      pause() {
        this.state = 'paused';
      }
      
      resume() {
        this.state = 'recording';
      }
      
      static isTypeSupported(type: string) {
        return true;
      }
    }

    // Override getUserMedia
    const mockGetUserMedia = async (constraints: any) => {
      return new MockMediaStream() as any;
    };

    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = mockGetUserMedia;
    } else {
      (navigator as any).mediaDevices = {
        getUserMedia: mockGetUserMedia,
      };
    }

    // Override MediaRecorder
    (window as any).MediaRecorder = MockMediaRecorder;
  });
}

/**
 * Create a realistic mock audio blob for testing
 */
export function createMockAudioBlob(durationMs: number = 2000): Blob {
  // Create a minimal valid WebM file
  const mockAudioData = new Uint8Array(1024); // 1KB mock audio
  return new Blob([mockAudioData], { type: 'audio/webm;codecs=opus' });
}

/**
 * Wait for audio element to be ready and play
 */
export async function waitForAudioReady(page: Page, selector: string = 'audio') {
  await page.waitForSelector(selector, { state: 'attached' });
  await page.waitForFunction(
    (sel) => {
      const audio = document.querySelector(sel) as HTMLAudioElement;
      return audio && audio.readyState >= 2; // HAVE_CURRENT_DATA
    },
    selector,
    { timeout: 10000 }
  );
}

