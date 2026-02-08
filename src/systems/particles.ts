

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
    alpha: number;
}

export class ParticleSystem {
    private particles: Particle[] = [];
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;

        // Create a canvas for particles if one doesn't exist
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'particle-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none'; // Click-through
        this.canvas.style.zIndex = '5'; // Above UI overlay (or below if preferred)

        document.querySelector('.content-wrapper')?.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d')!;
        this.resize(width, height);
    }

    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    }

    emit(x: number, y: number, color: string, count: number = 5, speed: number = 2): void {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * speed;

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: 1.0,
                maxLife: 0.5 + Math.random() * 0.5, // 0.5 to 1.0 seconds
                color,
                size: 2 + Math.random() * 4,
                alpha: 1.0
            });
        }
    }

    emitExplosion(x: number, y: number, color: string, count: number = 30): void {
        this.emit(x, y, color, count, 8);
    }

    update(deltaTime: number): void {
        // Remove dead particles
        this.particles = this.particles.filter(p => p.life > 0);

        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= deltaTime;
            p.alpha = Math.max(0, p.life / p.maxLife);

            // Gravity/Drag effect
            p.vy += 0.1; // Slight gravity
            p.vx *= 0.95; // Drag
            p.vy *= 0.95;
        }
    }

    render(): void {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Batch drawing by composite operation if needed, but simple loop is fine for < 1000 particles
        this.ctx.globalCompositeOperation = 'lighter'; // Additive blending for glow look

        for (const p of this.particles) {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'source-over';
    }

    clear(): void {
        this.particles = [];
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    destroy(): void {
        this.clear();
        this.canvas.remove();
    }
}
