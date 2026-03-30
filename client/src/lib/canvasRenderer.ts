import { Mood, ParticleType } from '@/stores/sceneStore';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: ParticleType;
  size: number;
  opacity: number;
}

/**
 * Canvas renderer for background scenes with procedural drawing.
 */
export class SceneCanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private dpr: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dpr = window.devicePixelRatio || 1;
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;
    this.setupCanvas();
  }

  /**
   * Setup canvas with proper DPI scaling.
   */
  private setupCanvas(): void {
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  /**
   * Resize canvas to new dimensions.
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.setupCanvas();
  }

  /**
   * Draw procedural background based on mood.
   */
  drawBackground(mood: Mood, colorPalette: string[], intensity: number): void {
    this.ctx.clearRect(0, 0, this.width, this.height);

    switch (mood) {
      case 'fantasy':
        this.drawFantasyBackground(colorPalette, intensity);
        break;
      case 'noir':
        this.drawNoirBackground(colorPalette, intensity);
        break;
      case 'intimate':
        this.drawIntimateBackground(colorPalette, intensity);
        break;
      case 'mysterious':
        this.drawMysteriousBackground(colorPalette, intensity);
        break;
      case 'action':
        this.drawActionBackground(colorPalette, intensity);
        break;
      case 'peaceful':
        this.drawPeacefulBackground(colorPalette, intensity);
        break;
    }
  }

  /**
   * Draw fantasy background with magical elements.
   */
  private drawFantasyBackground(colors: string[], intensity: number): void {
    // Gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Add magical particles/stars
    if (intensity > 0.3) {
      this.drawStars(colors[3] || '#ffd700', Math.floor(20 * intensity));
    }

    // Add parallax layers
    if (intensity > 0.5) {
      this.drawParallaxLayers(colors, intensity);
    }
  }

  /**
   * Draw noir background with dark, moody elements.
   */
  private drawNoirBackground(colors: string[], intensity: number): void {
    // Dark gradient
    const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Add vignette effect
    this.drawVignette(colors[0], intensity);

    // Add subtle noise
    if (intensity > 0.4) {
      this.drawNoise(0.1 * intensity);
    }
  }

  /**
   * Draw intimate background with warm, soft elements.
   */
  private drawIntimateBackground(colors: string[], intensity: number): void {
    // Warm gradient
    const gradient = this.ctx.createRadialGradient(this.width / 2, this.height / 2, 0, this.width / 2, this.height / 2, Math.max(this.width, this.height));
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[2]);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Add soft glow
    if (intensity > 0.3) {
      this.drawSoftGlow(colors[1], intensity);
    }
  }

  /**
   * Draw mysterious background with fog and shadows.
   */
  private drawMysteriousBackground(colors: string[], intensity: number): void {
    // Dark base
    this.ctx.fillStyle = colors[0];
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Add fog layers
    this.drawFogLayers(colors, intensity);

    // Add subtle shapes
    if (intensity > 0.5) {
      this.drawMysteriousShapes(colors, intensity);
    }
  }

  /**
   * Draw action background with dynamic elements.
   */
  private drawActionBackground(colors: string[], intensity: number): void {
    // Dynamic gradient
    const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Add dynamic elements
    if (intensity > 0.4) {
      this.drawDynamicShapes(colors, intensity);
    }
  }

  /**
   * Draw peaceful background with serene elements.
   */
  private drawPeacefulBackground(colors: string[], intensity: number): void {
    // Soft gradient
    const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Add soft clouds
    this.drawClouds(colors[2], intensity);
  }

  /**
   * Draw stars for fantasy mood.
   */
  private drawStars(color: string, count: number): void {
    this.ctx.fillStyle = color;

    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const size = Math.random() * 2 + 1;

      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  /**
   * Draw parallax layers.
   */
  private drawParallaxLayers(colors: string[], intensity: number): void {
    for (let i = 0; i < 3; i++) {
      this.ctx.fillStyle = colors[i % colors.length];
      this.ctx.globalAlpha = 0.1 * intensity;

      const layerHeight = this.height / 3;
      this.ctx.fillRect(0, i * layerHeight, this.width, layerHeight);
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * Draw vignette effect.
   */
  private drawVignette(color: string, intensity: number): void {
    const gradient = this.ctx.createRadialGradient(this.width / 2, this.height / 2, 0, this.width / 2, this.height / 2, Math.max(this.width, this.height) / 2);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, color);

    this.ctx.fillStyle = gradient;
    this.ctx.globalAlpha = 0.3 * intensity;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.globalAlpha = 1;
  }

  /**
   * Draw noise texture.
   */
  private drawNoise(opacity: number): void {
    const imageData = this.ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 255;
      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = opacity * 255;
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Draw soft glow effect.
   */
  private drawSoftGlow(color: string, intensity: number): void {
    const gradient = this.ctx.createRadialGradient(this.width / 2, this.height / 2, 0, this.width / 2, this.height / 2, Math.max(this.width, this.height));
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');

    this.ctx.fillStyle = gradient;
    this.ctx.globalAlpha = 0.2 * intensity;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.globalAlpha = 1;
  }

  /**
   * Draw fog layers.
   */
  private drawFogLayers(colors: string[], intensity: number): void {
    for (let i = 0; i < 3; i++) {
      this.ctx.fillStyle = colors[(i + 1) % colors.length];
      this.ctx.globalAlpha = (0.1 + i * 0.05) * intensity;

      const y = (i / 3) * this.height;
      this.ctx.fillRect(0, y, this.width, this.height / 3);
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * Draw mysterious shapes.
   */
  private drawMysteriousShapes(colors: string[], intensity: number): void {
    this.ctx.globalAlpha = 0.2 * intensity;

    for (let i = 0; i < 3; i++) {
      this.ctx.fillStyle = colors[(i + 2) % colors.length];
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const size = Math.random() * 100 + 50;

      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * Draw dynamic shapes for action mood.
   */
  private drawDynamicShapes(colors: string[], intensity: number): void {
    this.ctx.globalAlpha = 0.3 * intensity;

    for (let i = 0; i < 5; i++) {
      this.ctx.fillStyle = colors[i % colors.length];
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const size = Math.random() * 50 + 20;

      this.ctx.fillRect(x, y, size, size);
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * Draw clouds for peaceful mood.
   */
  private drawClouds(color: string, intensity: number): void {
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = 0.3 * intensity;

    for (let i = 0; i < 3; i++) {
      const x = (i / 3) * this.width;
      const y = (i / 3) * this.height;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 40, 0, Math.PI * 2);
      this.ctx.arc(x + 30, y, 50, 0, Math.PI * 2);
      this.ctx.arc(x + 60, y, 40, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }
}

/**
 * Particle system renderer for overlay effects.
 */
export class ParticleSystemRenderer {
  private particles: Particle[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private dpr: number;
  private maxParticles: number;

  constructor(canvas: HTMLCanvasElement, maxParticles: number = 100) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dpr = window.devicePixelRatio || 1;
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;
    this.maxParticles = maxParticles;
    this.setupCanvas();
  }

  /**
   * Setup canvas with proper DPI scaling.
   */
  private setupCanvas(): void {
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  /**
   * Resize canvas.
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.setupCanvas();
  }

  /**
   * Emit particles.
   */
  emit(type: ParticleType, count: number, audioLevel: number = 0.5): void {
    for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
      const particle = this.createParticle(type, audioLevel);
      this.particles.push(particle);
    }
  }

  /**
   * Create a single particle.
   */
  private createParticle(type: ParticleType, audioLevel: number): Particle {
    const x = Math.random() * this.width;
    const y = Math.random() * this.height;

    let vx = (Math.random() - 0.5) * 2;
    let vy = (Math.random() - 0.5) * 2;
    let size = 2;
    let maxLife = 2000;

    switch (type) {
      case 'embers':
        vy = -Math.random() * 2 - 1;
        size = Math.random() * 3 + 1;
        maxLife = 1500;
        break;
      case 'rain':
        vy = Math.random() * 3 + 2;
        vx = (Math.random() - 0.5) * 0.5;
        size = 1;
        maxLife = 2000;
        break;
      case 'fog':
        vx = (Math.random() - 0.5) * 0.5;
        vy = (Math.random() - 0.5) * 0.5;
        size = Math.random() * 10 + 5;
        maxLife = 3000;
        break;
      case 'leaves':
        vy = Math.random() * 1 + 0.5;
        vx = (Math.random() - 0.5) * 1;
        size = Math.random() * 4 + 2;
        maxLife = 2500;
        break;
      case 'dust':
        vx = (Math.random() - 0.5) * 1.5;
        vy = (Math.random() - 0.5) * 1.5;
        size = Math.random() * 2 + 0.5;
        maxLife = 1500;
        break;
    }

    // React to audio level
    vx *= 1 + audioLevel * 0.5;
    vy *= 1 + audioLevel * 0.5;

    return {
      x,
      y,
      vx,
      vy,
      life: maxLife,
      maxLife,
      type,
      size,
      opacity: 1,
    };
  }

  /**
   * Update particles.
   */
  update(deltaTime: number, audioLevel: number = 0.5): void {
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime * 1000;
      p.opacity = p.life / p.maxLife;

      // React to audio
      if (audioLevel > 0.5) {
        p.vy *= 1.01;
      }

      return p.life > 0 && p.x > -50 && p.x < this.width + 50 && p.y > -50 && p.y < this.height + 50;
    });
  }

  /**
   * Draw particles.
   */
  draw(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (const particle of this.particles) {
      this.ctx.globalAlpha = particle.opacity;
      this.ctx.fillStyle = this.getParticleColor(particle.type);

      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * Get color for particle type.
   */
  private getParticleColor(type: ParticleType): string {
    switch (type) {
      case 'embers':
        return '#ff6b35';
      case 'rain':
        return '#4a90e2';
      case 'fog':
        return '#e0e0e0';
      case 'leaves':
        return '#8b6f47';
      case 'dust':
        return '#c9a961';
      default:
        return '#ffffff';
    }
  }
}
