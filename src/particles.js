export class ParticleSystem {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particles = [];
  }
  
  createExplosion(x, y, color, particleCount = 30) {
    for (let i = 0; i < particleCount; i++) {
      const speed = Math.random() * 3 + 1;
      const angle = Math.random() * Math.PI * 2;
      
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1,
        color: color,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.02
      });
    }
  }
  
  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Reduce alpha
      particle.alpha -= particle.decay;
      
      // Remove dead particles
      if (particle.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  draw(ctx) {
    ctx.save();
    
    for (const particle of this.particles) {
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}
