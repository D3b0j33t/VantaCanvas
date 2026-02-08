import { HandTracker } from './handTracking';
import { GestureDetector } from './gestureDetector';
import { DrawingCanvas } from './drawingCanvas';
import { HandVisualizer } from './handVisualizer';
import { Scene3D } from './scene3D';
import { ObjectManager } from './objectManager';
import { Multiplayer, MultiplayerEvent } from './multiplayer';
import { HandLandmarks, GestureState, Point2D, BalloonObject, Stroke } from '../utils/types';
import { GESTURE, TIMING, PARTICLES } from '../utils/constants';
import { ParticleSystem } from './particles';

export class AirCanvas {
  // Core components
  private handTracker: HandTracker;
  private gestureDetector: GestureDetector;
  private drawingCanvas: DrawingCanvas;
  private handVisualizer: HandVisualizer;
  private scene3D: Scene3D;
  private objectManager: ObjectManager;
  private multiplayer: Multiplayer;
  private particleSystem: ParticleSystem;

  // Preview components
  private previewVideo: HTMLVideoElement;
  private previewCanvas: HTMLCanvasElement;
  private previewCtx: CanvasRenderingContext2D;

  // UI Elements
  private loadingOverlay: HTMLElement | null;
  private statusMessage: HTMLElement | null;
  private colorSwatches: NodeListOf<HTMLElement>;

  // Modal elements
  private inviteModal: HTMLElement | null;
  private roomCodeDisplay: HTMLElement | null;
  private joinCodeInput: HTMLInputElement | null;
  private statusDot: HTMLElement | null;
  private statusText: HTMLElement | null;

  // State
  private isDrawing = false;
  private currentColor = '#FFB3BA';
  private lastGestureState: GestureState | null = null;
  private currentLandmarks: HandLandmarks | null = null;
  private palmHoldStart = 0;
  private handDetected = false;
  private lastFrameTime = 0;
  private grabbedObject: BalloonObject | null = null;
  private lastPinchPosition: Point2D | null = null;


  // Mouse controls state
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private selectedObject: BalloonObject | null = null;

  // Camera preview drag state
  private isPreviewDragging = false;
  private previewDragStartX = 0;
  private previewDragStartY = 0;
  private previewStartLeft = 0;
  private previewStartTop = 0;

  private animationId: number | null = null;
  private isRunning = false;

  // Bound event handlers
  private boundResize: () => void;
  private boundOnMouseDown: (e: MouseEvent) => void;
  private boundOnMouseMove: (e: MouseEvent) => void;
  private boundOnMouseUp: () => void;
  private boundOnWheel: (e: WheelEvent) => void;
  private boundOnTouchStart: (e: TouchEvent) => void;
  private boundOnTouchMove: (e: TouchEvent) => void;
  private boundOnSceneClick: (e: MouseEvent) => void;

  constructor() {
    // Initialize bound handlers
    this.boundResize = this.resize.bind(this);
    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchStart = this.onTouchStart.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnSceneClick = this.onSceneClick.bind(this);

    // Get DOM elements
    const videoElement = document.getElementById('webcam') as HTMLVideoElement;
    const sceneCanvas = document.getElementById('scene-canvas') as HTMLCanvasElement;
    const drawCanvas = document.getElementById('draw-canvas') as HTMLCanvasElement;
    const handCanvas = document.getElementById('hand-canvas') as HTMLCanvasElement;

    // Preview elements
    // In React version, webcam IS the preview video
    const previewVideo = document.getElementById('preview-video') as HTMLVideoElement;
    this.previewVideo = previewVideo || videoElement;

    this.previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
    this.previewCtx = this.previewCanvas.getContext('2d')!;

    this.loadingOverlay = document.getElementById('loading-overlay');
    this.statusMessage = document.getElementById('status-message');
    this.colorSwatches = document.querySelectorAll('.color-swatch');

    // Modal elements
    this.inviteModal = document.getElementById('invite-modal');
    this.roomCodeDisplay = document.getElementById('room-code');
    this.joinCodeInput = document.getElementById('join-code-input') as HTMLInputElement;
    this.statusDot = document.getElementById('status-dot');
    this.statusText = document.getElementById('status-text');

    // Initialize components
    this.handTracker = new HandTracker(videoElement);
    this.gestureDetector = new GestureDetector();
    this.drawingCanvas = new DrawingCanvas(drawCanvas);
    this.handVisualizer = new HandVisualizer(handCanvas);
    this.scene3D = new Scene3D(sceneCanvas);
    this.objectManager = new ObjectManager(
      this.scene3D,
      window.innerWidth,
      window.innerHeight
    );
    this.multiplayer = new Multiplayer();
    this.particleSystem = new ParticleSystem(window.innerWidth, window.innerHeight);

    // Set initial size
    this.resize();

    // Setup event listeners
    this.setupEventListeners();
    this.setupButtonListeners();
    this.setupPreviewDrag();
    this.setupMultiplayer();

    // Start the application
    this.isRunning = true;
    this.init();
  }

  private setupEventListeners(): void {
    // Store bound methods for cleanup
    this.boundResize = this.resize.bind(this);
    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchStart = this.onTouchStart.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnSceneClick = this.onSceneClick.bind(this);

    // Window resize
    window.addEventListener('resize', this.boundResize);

    // Color palette clicks (no need for cleanup given DOM structure, but could be improved)
    this.colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        this.colorSwatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.currentColor = swatch.dataset.color || '#FFB3BA';
      });
    });

    // Mouse controls for 3D scene
    const sceneCanvas = document.getElementById('scene-canvas')!;

    sceneCanvas.addEventListener('mousedown', this.boundOnMouseDown);
    sceneCanvas.addEventListener('mousemove', this.boundOnMouseMove);
    sceneCanvas.addEventListener('mouseup', this.boundOnMouseUp);
    sceneCanvas.addEventListener('mouseleave', this.boundOnMouseUp);
    sceneCanvas.addEventListener('wheel', this.boundOnWheel);

    // Touch support
    sceneCanvas.addEventListener('touchstart', this.boundOnTouchStart);
    sceneCanvas.addEventListener('touchmove', this.boundOnTouchMove);
    sceneCanvas.addEventListener('touchend', this.boundOnMouseUp);

    // Click to select objects
    sceneCanvas.addEventListener('click', this.boundOnSceneClick);
  }

  private setupButtonListeners(): void {
    // Undo button
    const undoBtn = document.getElementById('undo-btn');
    undoBtn?.addEventListener('click', () => {
      this.objectManager.undo();
      this.showStatus('Undo', 1000);
    });

    // Clear all button
    const clearAllBtn = document.getElementById('clear-all-btn');
    clearAllBtn?.addEventListener('click', () => {
      this.clearAll();
      // Broadcast to peers
      if (this.multiplayer.isConnected()) {
        this.multiplayer.broadcast({ type: 'clear_all' });
      }
    });

    // Invite button
    const inviteBtn = document.getElementById('invite-btn');
    inviteBtn?.addEventListener('click', () => {
      this.openInviteModal();
    });

    // Modal close button
    const modalClose = document.getElementById('modal-close');
    modalClose?.addEventListener('click', () => {
      this.closeInviteModal();
    });

    // Close modal on overlay click
    this.inviteModal?.addEventListener('click', (e) => {
      if (e.target === this.inviteModal) {
        this.closeInviteModal();
      }
    });

    // Copy code button
    const copyCodeBtn = document.getElementById('copy-code-btn');
    copyCodeBtn?.addEventListener('click', () => {
      this.copyRoomCode();
    });

    // Join room button
    const joinRoomBtn = document.getElementById('join-room-btn');
    joinRoomBtn?.addEventListener('click', () => {
      this.joinRoom();
    });

    // Join on Enter key
    this.joinCodeInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.joinRoom();
      }
    });

    // Camera preview expand button
    const previewExpandBtn = document.getElementById('preview-expand-btn');
    const cameraPreview = document.getElementById('camera-preview');
    previewExpandBtn?.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent drag from starting
      cameraPreview?.classList.toggle('expanded');
      // Update preview canvas size when expanded
      this.updatePreviewCanvasSize();
    });
  }

  private setupPreviewDrag(): void {
    const cameraPreview = document.getElementById('camera-preview');
    const expandBtn = document.getElementById('preview-expand-btn');
    if (!cameraPreview) return;

    // Mouse events
    cameraPreview.addEventListener('mousedown', (e) => {
      // Don't start drag if clicking on the expand button
      if (e.target === expandBtn) return;
      this.startPreviewDrag(e.clientX, e.clientY, cameraPreview);
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isPreviewDragging) return;
      this.movePreview(e.clientX, e.clientY, cameraPreview);
    });

    document.addEventListener('mouseup', () => {
      this.endPreviewDrag(cameraPreview);
    });

    // Touch events
    cameraPreview.addEventListener('touchstart', (e) => {
      // Don't start drag if touching the expand button
      if (e.target === expandBtn) return;
      if (e.touches.length === 1) {
        e.preventDefault(); // Prevent scrolling
        this.startPreviewDrag(e.touches[0].clientX, e.touches[0].clientY, cameraPreview);
      }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (!this.isPreviewDragging) return;
      if (e.touches.length === 1) {
        this.movePreview(e.touches[0].clientX, e.touches[0].clientY, cameraPreview);
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      this.endPreviewDrag(cameraPreview);
    });

    // Double-click to reset position
    cameraPreview.addEventListener('dblclick', (e) => {
      if (e.target === expandBtn) return;
      this.resetPreviewPosition(cameraPreview);
    });
  }

  private resetPreviewPosition(preview: HTMLElement): void {
    preview.classList.remove('custom-position');
    preview.style.left = '';
    preview.style.top = '';
  }

  private startPreviewDrag(clientX: number, clientY: number, preview: HTMLElement): void {
    this.isPreviewDragging = true;
    this.previewDragStartX = clientX;
    this.previewDragStartY = clientY;

    // Get current position
    const rect = preview.getBoundingClientRect();
    this.previewStartLeft = rect.left;
    this.previewStartTop = rect.top;

    preview.classList.add('dragging');
  }

  private movePreview(clientX: number, clientY: number, preview: HTMLElement): void {
    const deltaX = clientX - this.previewDragStartX;
    const deltaY = clientY - this.previewDragStartY;

    let newLeft = this.previewStartLeft + deltaX;
    let newTop = this.previewStartTop + deltaY;

    // Constrain to viewport
    const rect = preview.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width;
    const maxTop = window.innerHeight - rect.height;

    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));

    // Apply custom position (remove centered transform)
    preview.classList.add('custom-position');
    preview.style.left = `${newLeft}px`;
    preview.style.top = `${newTop}px`;
  }

  private endPreviewDrag(preview: HTMLElement): void {
    if (this.isPreviewDragging) {
      this.isPreviewDragging = false;
      preview.classList.remove('dragging');
    }
  }

  private updatePreviewCanvasSize(): void {
    const cameraPreview = document.getElementById('camera-preview');
    // const isExpanded = cameraPreview?.classList.contains('expanded');

    // Get computed size of the preview container
    if (cameraPreview) {
      const rect = cameraPreview.getBoundingClientRect();
      this.previewCanvas.width = rect.width;
      this.previewCanvas.height = rect.height;
    }
  }

  private setupMultiplayer(): void {
    // Initialize multiplayer
    this.multiplayer.initialize().then(() => {
      if (this.roomCodeDisplay) {
        this.roomCodeDisplay.textContent = this.multiplayer.getRoomCode();
      }
    }).catch(err => {
      console.error('Failed to initialize multiplayer:', err);
    });

    // Handle status changes
    this.multiplayer.onStatusChange((status, _message) => {
      if (this.statusDot) {
        this.statusDot.className = `status-dot ${status === 'connected' ? 'connected' : status === 'connecting' ? 'connecting' : ''}`;
      }
      if (this.statusText) {
        this.statusText.textContent = status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Not connected';
      }
    });

    // Handle multiplayer events
    this.multiplayer.onEvent((event: MultiplayerEvent) => {
      this.handleMultiplayerEvent(event);
    });
  }

  private handleMultiplayerEvent(event: MultiplayerEvent): void {
    switch (event.type) {
      case 'balloon_created':
        // Create balloon from peer's stroke
        this.objectManager.createFromStroke(event.strokeData);
        break;

      case 'clear_all':
        this.drawingCanvas.clearAll();
        this.objectManager.clearAll();
        break;

      case 'peer_joined':
        this.showStatus('Friend joined!', 2000);
        break;

      case 'peer_left':
        this.showStatus('Friend left', 2000);
        break;
    }
  }

  private openInviteModal(): void {
    this.inviteModal?.classList.add('visible');
  }

  private closeInviteModal(): void {
    this.inviteModal?.classList.remove('visible');
  }

  private async copyRoomCode(): Promise<void> {
    const code = this.multiplayer.getRoomCode();
    try {
      await navigator.clipboard.writeText(code);
      const copyBtn = document.getElementById('copy-code-btn');
      if (copyBtn) {
        copyBtn.textContent = '✓';
        setTimeout(() => {
          copyBtn.textContent = '📋';
        }, 2000);
      }
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  private async joinRoom(): Promise<void> {
    const code = this.joinCodeInput?.value.trim().toUpperCase();
    if (!code || code.length !== 6) {
      if (this.statusText) {
        this.statusText.textContent = 'Please enter a 6-character code';
      }
      return;
    }

    try {
      await this.multiplayer.joinRoom(code);
      this.showStatus('Connected!', 2000);
    } catch {
      if (this.statusText) {
        this.statusText.textContent = 'Failed to connect';
      }
    }
  }

  private onMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    // Check if clicking on an object
    const hitObject = this.objectManager.getObjectAtPosition(e.clientX, e.clientY);
    if (hitObject) {
      this.selectedObject = hitObject;
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.lastMouseX;
    const deltaY = e.clientY - this.lastMouseY;

    if (this.selectedObject) {
      // Rotate the selected object
      this.objectManager.rotateObject(this.selectedObject, deltaX * 0.01, deltaY * 0.01);
    } else {
      // Orbit the camera
      this.scene3D.orbitCamera(deltaX * 0.005, deltaY * 0.005);
    }

    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.selectedObject = null;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.scene3D.zoomCamera(e.deltaY * 0.001);
  }

  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;

      const hitObject = this.objectManager.getObjectAtPosition(
        e.touches[0].clientX,
        e.touches[0].clientY
      );
      if (hitObject) {
        this.selectedObject = hitObject;
      }
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.isDragging || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - this.lastMouseX;
    const deltaY = e.touches[0].clientY - this.lastMouseY;

    if (this.selectedObject) {
      this.objectManager.rotateObject(this.selectedObject, deltaX * 0.01, deltaY * 0.01);
    } else {
      this.scene3D.orbitCamera(deltaX * 0.005, deltaY * 0.005);
    }

    this.lastMouseX = e.touches[0].clientX;
    this.lastMouseY = e.touches[0].clientY;
  }

  private onSceneClick(e: MouseEvent): void {
    const hitObject = this.objectManager.getObjectAtPosition(e.clientX, e.clientY);
    if (hitObject) {
      this.objectManager.selectObject(hitObject);
    }
  }

  private async init(): Promise<void> {
    try {
      // Start hand tracking
      await this.handTracker.start((landmarks) => this.onHandResults(landmarks));

      // Setup camera preview
      this.setupCameraPreview();

      // Hide loading overlay
      if (this.loadingOverlay) {
        this.loadingOverlay.classList.add('hidden');
      }

      // Start animation loop
      this.animate();
    } catch (error) {
      console.error('Failed to initialize:', error);
      this.showStatus('Camera access denied. Please allow camera access and refresh.');
    }
  }

  public setColor(color: string) {
    this.currentColor = color; // Assuming currentColor is a property to store the active drawing color
    if (this.objectManager) {
      this.objectManager.setColor(color);
    }
    if (this.particleSystem) {
      // Update particle color if needed, or just current drawing color
    }
  }

  public undo() {
    if (this.objectManager) {
      this.objectManager.undo();
    }
  }

  public clear() {
    if (this.objectManager) {
      this.objectManager.clear();
    }
    if (this.drawingCanvas) {
      this.drawingCanvas.clearAll();
    }
  }

  public inviteFriend(): string {
    // Return a dummy code for now or hook into multiplayer
    return this.multiplayer ? this.multiplayer.getRoomCode() : "1234";
  }

  private setupCameraPreview(): void {
    // If previewVideo IS webcam, we don't need to copy stream.
    if (this.previewVideo.id === 'webcam') return;

    // Get the video stream from the hand tracker and display in preview
    const webcam = document.getElementById('webcam') as HTMLVideoElement;
    if (webcam.srcObject) {
      this.previewVideo.srcObject = webcam.srcObject;
      this.previewVideo.play();
    }

    // Set preview canvas size (4:3 ratio to match camera)
    this.previewCanvas.width = 320;
    this.previewCanvas.height = 240;
  }

  private resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.handTracker.setCanvasSize(width, height);
    this.drawingCanvas.resize(width, height);
    this.handVisualizer.resize(width, height);
    this.scene3D.resize(width, height);
    this.objectManager.updateSize(width, height);
    if (this.particleSystem) {
      this.particleSystem.resize(width, height);
    }
  }

  private onHandResults(landmarks: HandLandmarks | null): void {
    const wasDetected = this.handDetected;
    this.handDetected = landmarks !== null;
    this.currentLandmarks = landmarks;

    // Show/hide hand detection message
    if (!this.handDetected && wasDetected) {
      this.showStatus('Show your hand to begin');
    } else if (this.handDetected && !wasDetected) {
      this.hideStatus();
    }

    // Render hand tracking on preview canvas
    this.renderPreviewOverlay(landmarks);

    if (!landmarks) {
      // Pause drawing if hand leaves
      if (this.isDrawing) {
        this.isDrawing = false;
      }
      return;
    }

    // Detect gesture
    const gestureState = this.gestureDetector.detect(landmarks);

    // Handle gesture
    this.handleGesture(gestureState, landmarks);

    this.lastGestureState = gestureState;
  }

  private renderPreviewOverlay(landmarks: HandLandmarks | null): void {
    const previewWidth = this.previewCanvas.width || 320;
    const previewHeight = this.previewCanvas.height || 240;
    this.previewCtx.clearRect(0, 0, previewWidth, previewHeight);

    if (!landmarks) return;

    // Use uniform scaling to maintain aspect ratio (same as main screen)
    const scale = Math.min(previewWidth / window.innerWidth, previewHeight / window.innerHeight);
    const offsetX = (previewWidth - window.innerWidth * scale) / 2;
    const offsetY = (previewHeight - window.innerHeight * scale) / 2;

    // Draw hand skeleton connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ];

    // Scale line width and joint size based on preview size
    const uiScale = previewWidth / 320;
    this.previewCtx.strokeStyle = '#bee17d';
    this.previewCtx.lineWidth = 2 * uiScale;

    for (const [from, to] of connections) {
      const start = landmarks.landmarks[from];
      const end = landmarks.landmarks[to];

      this.previewCtx.beginPath();
      this.previewCtx.moveTo(start.x * scale + offsetX, start.y * scale + offsetY);
      this.previewCtx.lineTo(end.x * scale + offsetX, end.y * scale + offsetY);
      this.previewCtx.stroke();
    }

    // Draw joints
    this.previewCtx.fillStyle = '#bee17d';
    for (const lm of landmarks.landmarks) {
      this.previewCtx.beginPath();
      this.previewCtx.arc(lm.x * scale + offsetX, lm.y * scale + offsetY, 3 * uiScale, 0, Math.PI * 2);
      this.previewCtx.fill();
    }
  }

  private handleGesture(state: GestureState, landmarks: HandLandmarks): void {
    const indexTip = this.gestureDetector.getIndexTip(landmarks);

    switch (state.current) {
      case 'draw':
        this.handleDraw(indexTip);
        break;

      case 'pinch':
        this.handlePinch(landmarks);
        break;

      case 'palm':
        this.handlePalm();
        break;

      case 'swipe':
        this.handleSwipe(indexTip);
        break;

      default:
        // Release grabbed object if gesture changes
        if (this.grabbedObject) {
          this.objectManager.releaseObject(this.grabbedObject);
          this.grabbedObject = null;
          this.lastPinchPosition = null;
        }
        break;
    }

    // Reset timers and clear live position if gesture changed
    if (this.lastGestureState && state.current !== this.lastGestureState.current) {
      this.palmHoldStart = 0;
      // Clear live position when leaving draw mode
      if (this.lastGestureState.current === 'draw') {
        this.drawingCanvas.clearLivePosition();
      }
    }
  }

  private handleDraw(position: { x: number; y: number }): void {
    // Always update live position for real-time line feedback
    this.drawingCanvas.updateLivePosition(position);

    // Check if poking an object
    const hitObject = this.objectManager.getObjectAtPosition(position.x, position.y);
    if (hitObject) {
      this.objectManager.pokeObject(hitObject);
      return;
    }

    if (!this.isDrawing) {
      // Start new stroke
      this.isDrawing = true;
      this.drawingCanvas.startStroke(position, this.currentColor);
    } else {
      // Continue stroke
      this.drawingCanvas.addPoint(position);

      // Emit particles while drawing
      this.particleSystem.emit(
        position.x,
        position.y,
        this.currentColor,
        PARTICLES.COUNT_PER_STROKE
      );
    }

    // Render immediately for lowest latency (don't wait for animation frame)
    this.drawingCanvas.render();
  }

  private handlePinch(landmarks: HandLandmarks): void {
    const pinchCenter = this.gestureDetector.getPinchCenter(landmarks);

    if (this.isDrawing) {
      // Pause drawing but keep stroke
      this.isDrawing = false;
      this.drawingCanvas.pauseStroke();
    }

    // Check if grabbing an object
    if (!this.grabbedObject) {
      const hitObject = this.objectManager.getObjectAtPosition(pinchCenter.x, pinchCenter.y);
      if (hitObject) {
        this.grabbedObject = hitObject;
        this.objectManager.grabObject(hitObject);
        this.lastPinchPosition = pinchCenter;
      }
    } else {
      // Move and rotate grabbed object based on hand movement
      if (this.lastPinchPosition) {
        const deltaX = pinchCenter.x - this.lastPinchPosition.x;
        const deltaY = pinchCenter.y - this.lastPinchPosition.y;

        // Move the object
        this.objectManager.moveGrabbedObject(this.grabbedObject, pinchCenter.x, pinchCenter.y);

        // Rotate based on movement
        this.objectManager.rotateObject(this.grabbedObject, deltaX * 0.02, deltaY * 0.02);
      }
      this.lastPinchPosition = pinchCenter;
    }
  }

  private handlePalm(): void {
    // Release any grabbed object
    if (this.grabbedObject) {
      this.objectManager.releaseObject(this.grabbedObject);
      this.grabbedObject = null;
      this.lastPinchPosition = null;
    }

    // Track palm hold time
    if (this.palmHoldStart === 0) {
      this.palmHoldStart = performance.now();
    }

    const holdDuration = performance.now() - this.palmHoldStart;

    if (holdDuration >= GESTURE.PALM_HOLD_TIME) {
      // Close and inflate current stroke
      this.closeAndInflate();
      this.palmHoldStart = 0;
    }
  }

  private handleSwipe(position: { x: number; y: number }): void {
    // Check if swiping on an object
    const hitObject = this.objectManager.getObjectAtPosition(position.x, position.y);
    if (hitObject) {
      this.objectManager.removeObject(hitObject);
    }
  }

  private async closeAndInflate(): Promise<void> {
    const stroke = this.drawingCanvas.closeStroke();
    this.drawingCanvas.clearLivePosition();

    if (!stroke) {
      this.showStatus('Draw a larger shape', 1000);
      return;
    }

    this.isDrawing = false;

    // Animate the closing
    const startTime = performance.now();
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / (TIMING.STROKE_CLOSE_PULSE * 1000), 1);

      this.drawingCanvas.renderClosingAnimation(stroke, progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Create 3D balloon
        this.createBalloon(stroke);
      }
    };
    animate();
  }

  private async createBalloon(stroke: Stroke): Promise<void> {
    // Clear the stroke from drawing canvas FIRST before creating 3D object
    this.drawingCanvas.removeCompletedStroke(stroke);
    this.drawingCanvas.clear();

    try {
      await this.objectManager.createFromStroke(stroke);

      // Broadcast to peers
      if (this.multiplayer.isConnected()) {
        this.multiplayer.broadcast({
          type: 'balloon_created',
          strokeData: stroke
        });
      }
    } catch (error) {
      console.error('Failed to create balloon:', error);
      this.showStatus('Failed to create shape', 2000);
    }
  }

  private async clearAll(): Promise<void> {
    this.showStatus('Clearing all...');
    this.drawingCanvas.clearAll();
    await this.objectManager.clearAll();
    this.hideStatus();
  }

  private animate(): void {
    if (!this.isRunning) return;

    this.animationId = requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const deltaTime = this.lastFrameTime > 0 ? (now - this.lastFrameTime) / 1000 : 0.016;
    this.lastFrameTime = now;

    // Update 3D objects
    this.objectManager.update(deltaTime, now / 1000);

    // Render 3D scene
    this.scene3D.render();

    // Update and render particles
    this.particleSystem.update(deltaTime);
    this.particleSystem.render();

    // Render drawing canvas
    this.drawingCanvas.render();

    // Render hand visualization
    const gestureState = this.lastGestureState || {
      current: 'none' as const,
      previous: 'none' as const,
      duration: 0,
      velocity: { x: 0, y: 0 },
      confidence: 0
    };
    this.handVisualizer.render(
      this.currentLandmarks,
      gestureState,
      this.currentColor,
      deltaTime
    );
  }

  private showStatus(message: string, duration?: number): void {
    if (!this.statusMessage) return;

    this.statusMessage.textContent = message;
    this.statusMessage.classList.add('visible');

    if (duration) {
      setTimeout(() => this.hideStatus(), duration);
    }
  }

  private hideStatus(): void {
    if (this.statusMessage) {
      this.statusMessage.classList.remove('visible');
    }
  }
  public cleanup(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.particleSystem.destroy();
    this.handTracker.stop();
    if (this.multiplayer) {
      this.multiplayer.destroy();
    }

    // Remove event listeners
    window.removeEventListener('resize', this.boundResize);

    const sceneCanvas = document.getElementById('scene-canvas');
    if (sceneCanvas) {
      sceneCanvas.removeEventListener('mousedown', this.boundOnMouseDown);
      sceneCanvas.removeEventListener('mousemove', this.boundOnMouseMove);
      sceneCanvas.removeEventListener('mouseup', this.boundOnMouseUp);
      sceneCanvas.removeEventListener('mouseleave', this.boundOnMouseUp);
      sceneCanvas.removeEventListener('wheel', this.boundOnWheel);
      sceneCanvas.removeEventListener('touchstart', this.boundOnTouchStart);
      sceneCanvas.removeEventListener('touchmove', this.boundOnTouchMove);
      sceneCanvas.removeEventListener('touchend', this.boundOnMouseUp);
      sceneCanvas.removeEventListener('click', this.boundOnSceneClick);
    }
  }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // new AirCanvas();
});
