import { HandLandmarks, GestureType, GestureState, Point2D } from '../utils/types';
import { LANDMARKS, GESTURE } from '../utils/constants';

export class GestureDetector {
  private lastLandmarks: HandLandmarks | null = null;
  private lastTime: number = 0;
  private gestureStartTime: number = 0;
  private currentGesture: GestureType = 'none';
  private previousGesture: GestureType = 'none';
  // private palmHistory: Point2D[] = [];
  // private velocityHistory: Point2D[] = [];

  detect(landmarks: HandLandmarks | null): GestureState {
    const now = performance.now();
    const dt = this.lastTime > 0 ? (now - this.lastTime) / 1000 : 0;
    this.lastTime = now;

    if (!landmarks) {
      return this.createState('none', { x: 0, y: 0 }, 0);
    }

    const velocity = this.calculateVelocity(landmarks, dt);
    const detectedGesture = this.detectGestureType(landmarks);

    if (detectedGesture !== this.currentGesture) {
      this.previousGesture = this.currentGesture;
      this.currentGesture = detectedGesture;
      this.gestureStartTime = now;
    }

    const duration = now - this.gestureStartTime;
    this.lastLandmarks = landmarks;

    // Yahan pinchDistance bhi return kar rahe hain taake Main file use kar sake
    const pinchDistance = this.distance(
      landmarks.landmarks[LANDMARKS.THUMB_TIP],
      landmarks.landmarks[LANDMARKS.INDEX_TIP]
    );

    return {
      ...this.createState(this.currentGesture, velocity, duration),
      pinchDistance: pinchDistance // Extra data for zoom logic
    };
  }

  private createState(gesture: GestureType, velocity: Point2D, duration: number): GestureState {
    return {
      current: gesture,
      previous: this.previousGesture,
      duration,
      velocity,
      confidence: 1.0
    };
  }

  private calculateVelocity(landmarks: HandLandmarks, dt: number): Point2D {
    if (!this.lastLandmarks || dt === 0) return { x: 0, y: 0 };
    const currentPalm = this.getPalmCenter(landmarks);
    const lastPalm = this.getPalmCenter(this.lastLandmarks);
    return {
      x: (currentPalm.x - lastPalm.x) / dt,
      y: (currentPalm.y - lastPalm.y) / dt
    };
  }

  private getPalmCenter(landmarks: HandLandmarks): Point2D {
    const wrist = landmarks.landmarks[LANDMARKS.WRIST];
    const indexMcp = landmarks.landmarks[LANDMARKS.INDEX_MCP];
    const pinkyMcp = landmarks.landmarks[LANDMARKS.PINKY_MCP];
    return {
      x: (wrist.x + indexMcp.x + pinkyMcp.x) / 3,
      y: (wrist.y + indexMcp.y + pinkyMcp.y) / 3
    };
  }

  private detectGestureType(landmarks: HandLandmarks): GestureType {
    const lm = landmarks.landmarks;

    // 1. PINCH CHECK (High Priority)
    // Calculate hand scale (distance from wrist to index MCP)
    const handScale = this.distance(lm[LANDMARKS.WRIST], lm[LANDMARKS.INDEX_MCP]);

    // Adaptive threshold based on hand size
    const adaptiveThreshold = handScale * GESTURE.PINCH_RATIO;
    const pinchDistance = this.distance(lm[LANDMARKS.THUMB_TIP], lm[LANDMARKS.INDEX_TIP]);

    if (pinchDistance < adaptiveThreshold) {
      return 'pinch';
    }

    // 2. DRAW CHECK (Strict Index Finger)
    // Sirf Index finger khuli honi chahiye, baqi band
    if (this.isPointingIndex(landmarks)) {
      return 'draw';
    }

    // 3. PALM / ROTATE CHECK
    if (this.isOpenPalm(landmarks)) {
      return 'palm';
    }

    // 4. FIST CHECK
    if (this.isFist(landmarks)) {
      return 'fist';
    }

    return 'none';
  }

  private distance(p1: Point2D, p2: Point2D): number {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  // --- Helper Checks ---

  private isFingerExtended(landmarks: HandLandmarks, tipIdx: number, pipIdx: number): boolean {
    const lm = landmarks.landmarks;
    const wrist = lm[LANDMARKS.WRIST];

    // Check distance from wrist: Tip should be further than PIP
    const tipDist = this.distance(wrist, lm[tipIdx]);
    const pipDist = this.distance(wrist, lm[pipIdx]);

    return tipDist > pipDist;
  }

  private isPointingIndex(landmarks: HandLandmarks): boolean {
    // Index OPEN
    const indexOpen = this.isFingerExtended(landmarks, LANDMARKS.INDEX_TIP, LANDMARKS.INDEX_PIP);
    // Middle, Ring, Pinky CLOSED
    const middleClosed = !this.isFingerExtended(landmarks, LANDMARKS.MIDDLE_TIP, LANDMARKS.MIDDLE_PIP);
    const ringClosed = !this.isFingerExtended(landmarks, LANDMARKS.RING_TIP, LANDMARKS.RING_PIP);
    const pinkyClosed = !this.isFingerExtended(landmarks, LANDMARKS.PINKY_TIP, LANDMARKS.PINKY_PIP);

    return indexOpen && middleClosed && ringClosed && pinkyClosed;
  }

  private isOpenPalm(landmarks: HandLandmarks): boolean {
    // All fingers must be open
    return (
      this.isFingerExtended(landmarks, LANDMARKS.INDEX_TIP, LANDMARKS.INDEX_PIP) &&
      this.isFingerExtended(landmarks, LANDMARKS.MIDDLE_TIP, LANDMARKS.MIDDLE_PIP) &&
      this.isFingerExtended(landmarks, LANDMARKS.RING_TIP, LANDMARKS.RING_PIP) &&
      this.isFingerExtended(landmarks, LANDMARKS.PINKY_TIP, LANDMARKS.PINKY_PIP)
    );
  }

  private isFist(landmarks: HandLandmarks): boolean {
    // All fingers closed
    return (
      !this.isFingerExtended(landmarks, LANDMARKS.INDEX_TIP, LANDMARKS.INDEX_PIP) &&
      !this.isFingerExtended(landmarks, LANDMARKS.MIDDLE_TIP, LANDMARKS.MIDDLE_PIP) &&
      !this.isFingerExtended(landmarks, LANDMARKS.RING_TIP, LANDMARKS.RING_PIP) &&
      !this.isFingerExtended(landmarks, LANDMARKS.PINKY_TIP, LANDMARKS.PINKY_PIP)
    );
  }

  getIndexTip(landmarks: HandLandmarks): Point2D {
    return landmarks.landmarks[LANDMARKS.INDEX_TIP];
  }

  getPinchCenter(landmarks: HandLandmarks): Point2D {
    const thumb = landmarks.landmarks[LANDMARKS.THUMB_TIP];
    const index = landmarks.landmarks[LANDMARKS.INDEX_TIP];
    return { x: (thumb.x + index.x) / 2, y: (thumb.y + index.y) / 2 };
  }
}