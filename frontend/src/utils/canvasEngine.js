/**
 * Aviator Canvas Rendering Engine (React Compatible)
 */

export class AviatorCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    
    // Config properties
    this.paddingLeft = 60;
    this.paddingBottom = 40;
    
    // Core states
    this.planeX = 0;
    this.planeY = 0;
    this.planeAngle = 0;
    this.propellerAngle = 0;
    this.curvePoints = [];
    this.particles = [];
    
    // Grid scrolling offsets
    this.gridOffsetX = 0;
    this.gridOffsetY = 0;
    
    // Simulation scale & settings
    this.multiplier = 1.0;
    this.gameState = 'PRE_ROUND'; // PRE_ROUND, PLAYING, CRASHED
    this.crashTime = 0;
    
    // Resize handling
    this.resize();
    this.resizeListener = () => this.resize();
    window.addEventListener('resize', this.resizeListener);
    
    // Run animation frame loop
    this.animationFrameId = null;
    this.animate();
  }

  destroy() {
    window.removeEventListener('resize', this.resizeListener);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || 600;
    this.height = rect.height || 350;
    
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
    
    this.startX = this.paddingLeft;
    this.startY = this.height - this.paddingBottom;
    
    this.hoverX = this.width * 0.70;
    this.hoverY = this.height * 0.40;
  }

  setGameState(state, multiplier = 1.0) {
    this.gameState = state;
    this.multiplier = multiplier;
    
    if (state === 'PRE_ROUND') {
      this.curvePoints = [];
      this.particles = [];
      this.gridOffsetX = 0;
      this.gridOffsetY = 0;
      this.planeX = this.startX;
      this.planeY = this.startY;
      this.planeAngle = 0;
    } else if (state === 'CRASHED') {
      this.crashTime = Date.now();
    }
  }

  updateMultiplier(multiplier) {
    this.multiplier = multiplier;
  }

  addParticle(x, y) {
    this.particles.push({
      x: x - 15,
      y: y + 2,
      vx: -1.5 - Math.random() * 2,
      vy: (Math.random() - 0.5) * 1.5,
      alpha: 1.0,
      size: 2 + Math.random() * 4,
      color: Math.random() > 0.3 ? '#e11d48' : '#fbbf24'
    });
  }

  updatePhysics() {
    this.propellerAngle += 0.45;
    if (this.propellerAngle > Math.PI * 2) this.propellerAngle = 0;

    if (this.gameState === 'PLAYING') {
      const t = Math.min(1.0, (this.multiplier - 1.0) / 1.0);
      const targetX = this.startX + (this.hoverX - this.startX) * t;
      const targetY = this.startY - (this.startY - this.hoverY) * t;
      
      const floatOffset = Math.sin(Date.now() * 0.01) * 3;
      
      this.planeX = targetX;
      this.planeY = targetY + floatOffset;
      
      if (t < 1.0) {
        this.planeAngle = -Math.atan2(this.startY - this.hoverY, this.hoverX - this.startX) * 0.7;
      } else {
        this.planeAngle = Math.sin(Date.now() * 0.005) * 0.03;
      }
      
      if (this.multiplier > 2.0) {
        const speedFactor = Math.log(this.multiplier) * 1.5;
        this.gridOffsetX = (this.gridOffsetX + speedFactor) % 80;
        this.gridOffsetY = (this.gridOffsetY + speedFactor * 0.5) % 80;
      }
      
      this.curvePoints.push({ x: this.planeX, y: this.planeY });
      if (this.curvePoints.length > 300) {
        this.curvePoints.shift();
      }

      if (Math.random() > 0.4) {
        this.addParticle(this.planeX, this.planeY);
      }
    } else if (this.gameState === 'CRASHED') {
      const elapsed = (Date.now() - this.crashTime) / 1000;
      const speed = elapsed * 800;
      this.planeX += Math.cos(this.planeAngle - 0.2) * speed * 0.05;
      this.planeY -= Math.sin(this.planeAngle - 0.2) * speed * 0.05 - (elapsed * 5);
      this.planeAngle -= 0.005;
      
      if (this.curvePoints.length > 0 && Math.random() > 0.5) {
        this.curvePoints.shift();
      }
    }
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      if (this.gameState === 'PLAYING' && this.multiplier > 2.0) {
        p.x -= Math.log(this.multiplier) * 0.5;
      }
      p.y += p.vy;
      p.alpha -= 0.03;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  drawBackground() {
    const ctx = this.ctx;
    ctx.fillStyle = '#090a0f';
    ctx.fillRect(0, 0, this.width, this.height);
    
    const originX = this.startX;
    const originY = this.startY;
    const maxDist = Math.max(this.width, this.height) * 1.5;
    const rayCount = 14;
    const pulseFactor = 0.04 * Math.sin(Date.now() * 0.0015);
    
    ctx.save();
    ctx.translate(originX, originY);
    ctx.strokeStyle = 'rgba(225, 29, 72, 0.03)';
    ctx.lineWidth = 15;
    
    for (let i = 0; i < rayCount; i++) {
      const angle = -(i * (Math.PI / 2 / (rayCount - 1))) + pulseFactor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * maxDist, Math.sin(angle) * maxDist);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    
    const startValX = this.startX - this.gridOffsetX;
    for (let x = startValX; x < this.width; x += 80) {
      if (x < this.startX) continue;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.startY);
      ctx.stroke();
    }
    
    const startValY = this.startY + this.gridOffsetY;
    for (let y = startValY; y > 0; y -= 60) {
      if (y > this.startY) continue;
      ctx.beginPath();
      ctx.moveTo(this.startX, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1.5;
    
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(this.width, this.startY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(this.startX, 0);
    ctx.lineTo(this.startX, this.startY);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let x = this.startX + 60; x < this.width; x += 60) {
      ctx.beginPath();
      ctx.arc(x, this.startY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
    for (let y = this.startY - 50; y > 20; y -= 50) {
      ctx.beginPath();
      ctx.arc(this.startX, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawFlightPath() {
    const ctx = this.ctx;
    if (this.curvePoints.length < 2) return;
    
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    
    for (let i = 0; i < this.curvePoints.length; i++) {
      ctx.lineTo(this.curvePoints[i].x, this.curvePoints[i].y);
    }
    
    const lastPt = this.curvePoints[this.curvePoints.length - 1];
    ctx.lineTo(lastPt.x, this.startY);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(this.startX, this.startY - 150, this.startX, this.startY);
    gradient.addColorStop(0, 'rgba(225, 29, 72, 0.25)');
    gradient.addColorStop(1, 'rgba(225, 29, 72, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
    
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    
    for (let i = 0; i < this.curvePoints.length; i++) {
      ctx.lineTo(this.curvePoints[i].x, this.curvePoints[i].y);
    }
    
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawPlane(x, y, angle) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.fillStyle = '#e11d48';
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.ellipse(-5, 0, 8, 20, Math.PI / 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', -4, -10);
    
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(8, -2, 4, Math.PI, Math.PI * 1.8);
    ctx.lineTo(12, -2);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.moveTo(-15, -4);
    ctx.lineTo(-24, -13);
    ctx.lineTo(-20, -14);
    ctx.lineTo(-11, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(-18, 0, 3, 7, -Math.PI/6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(22, 0, 4, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.save();
    ctx.translate(23, 0);
    ctx.rotate(this.propellerAngle);
    
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, 14);
    ctx.stroke();
    
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.restore();
  }

  animate() {
    this.updatePhysics();
    
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground();
    this.drawGrid();
    
    // draw particles
    this.ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();

    this.drawFlightPath();
    
    if (this.gameState === 'PLAYING' || this.gameState === 'CRASHED') {
      this.drawPlane(this.planeX, this.planeY, this.planeAngle);
    } else {
      this.drawPlane(this.startX, this.startY - 3, 0);
    }
    
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
}
