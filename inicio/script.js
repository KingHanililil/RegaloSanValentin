// Canvas background with animated particles and gradient
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Particles array
const particles = [];
const particleCount = 100;

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = Math.random() * 0.5 + 0.2;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = Math.random() > 0.5 ? '#ff69b4' : '#87ceeb'; // Pink or blue
        this.life = 1;
        this.decay = Math.random() * 0.005 + 0.002;
    }

    update() {
        this.x += this.speedX;
        this.y -= this.speedY;
        this.life -= this.decay;
        this.opacity = this.life * (Math.random() * 0.5 + 0.3);

        // Wrap around
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Initialize particles
for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
}

// Floating hearts class
class FloatingHeart {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 50;
        this.size = Math.random() * 20 + 10;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = Math.random() * 1 + 0.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.opacity = 0.6;
    }

    update() {
        this.x += this.speedX;
        this.y -= this.speedY;
        this.rotation += this.rotationSpeed;

        if (this.y < -100) {
            this.y = canvas.height + 50;
            this.x = Math.random() * canvas.width;
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❤', 0, 0);
        ctx.restore();
    }
}

const hearts = [];
for (let i = 0; i < 8; i++) {
    hearts.push(new FloatingHeart());
}

// Gradient that rotates
let gradientAngle = 0;

function drawBackground() {
    // Create animated gradient background
    const gradient = ctx.createLinearGradient(
        Math.cos(gradientAngle) * canvas.width / 2 + canvas.width / 2,
        Math.sin(gradientAngle) * canvas.height / 2 + canvas.height / 2,
        Math.cos(gradientAngle + Math.PI) * canvas.width / 2 + canvas.width / 2,
        Math.sin(gradientAngle + Math.PI) * canvas.height / 2 + canvas.height / 2
    );

    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.5, '#1a0a2e');
    gradient.addColorStop(1, '#0f0f1e');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add a subtle shine effect
    const shineGrad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height)
    );
    shineGrad.addColorStop(0, 'rgba(255, 105, 180, 0.05)');
    shineGrad.addColorStop(1, 'rgba(135, 206, 235, 0)');
    ctx.fillStyle = shineGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function animate() {
    drawBackground();

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();

        if (particles[i].life <= 0) {
            particles.splice(i, 1);
            particles.push(new Particle());
        }
    }

    // Update and draw hearts
    for (let heart of hearts) {
        heart.update();
        heart.draw();
    }

    // Update gradient angle for animation
    gradientAngle += 0.001;

    requestAnimationFrame(animate);
}

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Start animation
animate();
