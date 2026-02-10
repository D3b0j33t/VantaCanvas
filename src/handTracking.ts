import { Hands, Results } from '@mediapipe/hands';
import { HandLandmarks, Point2D } from './types';

export type HandResultsCallback = (landmarks: HandLandmarks | null) => void;

export class HandTracker {
  private hands: Hands;
  private videoElement: HTMLVideoElement;
  private callback: HandResultsCallback | null = null;
  private isRunning = false;
  private animationId: number | null = null;
  private canvasWidth = 640;
  private canvasHeight = 480;

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;

    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,  // Better accuracy model (less jitter)
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults((results) => this.onResults(results));
  }

  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  private onResults(results: Results): void {
    if (!this.callback) return;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Use the first detected hand (could enhance to prefer right hand)
      const landmarks = results.multiHandLandmarks[0];
      const worldLandmarks = results.multiHandWorldLandmarks?.[0];

      // Convert normalized coordinates to canvas coordinates
      const convertedLandmarks: Point2D[] = landmarks.map((lm) => ({
        x: (1 - lm.x) * this.canvasWidth,  // Mirror horizontally
        y: lm.y * this.canvasHeight
      }));

      const convertedWorldLandmarks = worldLandmarks?.map((lm) => ({
        x: -lm.x,  // Mirror
        y: -lm.y,
        z: lm.z
      }));

      this.callback({
        landmarks: convertedLandmarks,
        worldLandmarks: convertedWorldLandmarks
      });
    } else {
      this.callback(null);
    }
  }

  async start(callback: HandResultsCallback): Promise<void> {
    this.callback = callback;

    if (this.isRunning) return;

    try {
      // Request camera access - balance between speed and detection quality
      console.log('HandTracker: Requesting user media...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },  // 30fps is enough for hand tracking
          facingMode: 'user'
        }
      });

      this.videoElement.srcObject = stream;
      console.log('HandTracker: playing video...');
      // Wrap play in a try/catch to handle autoplay policies
      try {
        await this.videoElement.play();
        console.log('HandTracker: video playing');
      } catch (playError) {
        console.error('HandTracker: Video play failed', playError);
        // Sometimes play fails but streaming works, or it requires interaction.
        // We throw to let the caller handle showing a "Tap to start" or similar if needed.
        throw playError;
      }

      this.isRunning = true;

      // Use direct requestAnimationFrame for lower latency
      const processFrame = async () => {
        if (!this.isRunning) return;

        if (this.videoElement.readyState >= 2) {
          try {
            await this.hands.send({ image: this.videoElement });
          } catch (e) {
            console.error('Error sending frame to MediaPipe:', e);
          }
        }

        this.animationId = requestAnimationFrame(processFrame);
      };

      console.log('HandTracker: Starting processing loop');
      processFrame();
    } catch (error) {
      console.error('Failed to start hand tracking:', error);
      throw error;
    }
  }

  stop(): void {
    this.isRunning = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    const stream = this.videoElement.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }
}