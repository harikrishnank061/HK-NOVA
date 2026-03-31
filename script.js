const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let particles = [];
const particleCount = 100;
const connectionDistanceBase = 140;
const mouse = { x: null, y: null, radius: 180 };
const phantomMouse = { x: 0, y: 0, active: true };
let startTime = Date.now();
let globalShape = 'all';
let driftSpeedMultiplier = 1.5;
let activeTheme = 'neon';
let isMagnetic = false;

const themes = {
    neon: { color: 'rgba(0, 255, 255, 0.8)', line: 'rgba(0, 255, 255, 0.2)', glow: 'rgba(0, 255, 255, 0.5)' },
    solar: { color: 'rgba(255, 200, 50, 0.8)', line: 'rgba(255, 200, 50, 0.2)', glow: 'rgba(255, 200, 50, 0.5)' },
    aurora: { color: 'rgba(100, 255, 100, 0.8)', line: 'rgba(100, 255, 100, 0.2)', glow: 'rgba(100, 255, 100, 0.5)' }
};

// UI Element References
const nodeCounter = document.getElementById('node-count');
const fluxDisplay = document.getElementById('flux-speed');

// Toggle Handles
document.getElementById('magnet-toggle').addEventListener('change', (e) => {
    isMagnetic = e.target.checked;
});

document.getElementById('speed-range').addEventListener('input', (e) => {
    driftSpeedMultiplier = parseFloat(e.target.value);
});

const menuToggle = document.getElementById('menu-toggle');
const settingsPanel = document.getElementById('settings-panel');
const settingsHint = document.getElementById('settings-hint');
const loaderWrapper = document.getElementById('loader-wrapper');

// Sequence Control
setTimeout(() => {
    loaderWrapper.classList.add('fade-out');
    // Reveal text slowly after loader starts fading
    setTimeout(() => {
        if (contentOverlay) contentOverlay.classList.add('visible');
    }, 500); 
}, 3000); 

menuToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('active');
    settingsHint.classList.add('hidden');
});


const themeBtns = document.querySelectorAll('.theme-btn');
themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTheme = btn.dataset.theme;
        document.documentElement.style.setProperty('--accent-color', themes[activeTheme].color);
    });
});

const optionBtns = document.querySelectorAll('.option-btn');
optionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        optionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        globalShape = btn.dataset.shape;
        particles.forEach(p => {
            p.shape = globalShape === 'all' ? Math.floor(Math.random() * 4) : parseInt(globalShape);
        });
    });
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    phantomMouse.active = false;
});

// Mobile Touch Support
window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        phantomMouse.active = false;
    }
}, { passive: false });

window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        phantomMouse.active = false;
        
        // Handle particle generation on tap
        if (!e.target.closest('#settings-panel') && !e.target.closest('#menu-toggle')) {
            for (let i = 0; i < 8; i++) {
                particles.push(new Particle(mouse.x, mouse.y));
            }
            if (contentOverlay && contentOverlay.classList.contains('visible')) {
                contentOverlay.classList.remove('visible');
                contentOverlay.classList.add('hidden');
            }
        }
    }
}, { passive: false });

const contentOverlay = document.querySelector('.content-overlay');

window.addEventListener('mousedown', (e) => {
    if (e.target.closest('#settings-panel') || e.target.closest('#menu-toggle')) return;
    
    // Smoothly fade overlay on first interaction
    if (contentOverlay && contentOverlay.classList.contains('visible')) {
        contentOverlay.classList.remove('visible');
        contentOverlay.classList.add('hidden');
    }

    for (let i = 0; i < 8; i++) {
        particles.push(new Particle(e.clientX, e.clientY));
    }
});

class Particle {
    constructor(x, y) {
        this.x = x || Math.random() * canvas.width;
        this.y = y || Math.random() * canvas.height;
        this.z = Math.random() * 0.8 + 0.2;
        this.size = (Math.random() * 2 + 1) * this.z;
        this.vx = (Math.random() - 0.5) * this.z;
        this.vy = (Math.random() - 0.5) * this.z;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.1;
        this.shape = globalShape === 'all' ? Math.floor(Math.random() * 4) : parseInt(globalShape);
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = themes[activeTheme].color;
        ctx.strokeStyle = themes[activeTheme].color;
        ctx.lineWidth = 1;
        ctx.beginPath();

        if (this.shape === 0) {
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 1) {
            const s = this.size * 1.5;
            ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
            ctx.moveTo(0, -s); ctx.lineTo(0, s);
            ctx.stroke();
        } else if (this.shape === 2) {
            const s = this.size * 2;
            ctx.moveTo(0, -s); ctx.lineTo(s, 0);
            ctx.lineTo(0, s); ctx.lineTo(-s, 0);
            ctx.closePath(); ctx.fill();
        } else if (this.shape === 3) {
            const spikes = 5;
            const outerRadius = this.size * 2.5;
            const innerRadius = this.size;
            let rot = Math.PI / 2 * 3;
            let step = Math.PI / spikes;
            ctx.moveTo(0, -outerRadius);
            for (let i = 0; i < spikes; i++) {
                ctx.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius);
                rot += step;
                ctx.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius);
                rot += step;
            }
            ctx.closePath(); ctx.fill();
        }
        ctx.restore();
    }

    update() {
        this.x += this.vx * driftSpeedMultiplier;
        this.y += this.vy * driftSpeedMultiplier;
        this.angle += this.spin;

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        const targetX = mouse.x ?? phantomMouse.x;
        const targetY = mouse.y ?? phantomMouse.y;

        if (targetX !== null) {
            let dx = targetX - this.x;
            let dy = targetY - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < mouse.radius * this.z) {
                const angle = Math.atan2(dy, dx);
                const force = (mouse.radius * this.z - distance) / (mouse.radius * this.z);
                const pushPull = isMagnetic ? 1.5 : -3;
                this.x += Math.cos(angle) * force * pushPull;
                this.y += Math.sin(angle) * force * pushPull;
            }
        }
    }
}


function init() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function connect() {
    const targetX = mouse.x ?? (phantomMouse.active ? phantomMouse.x : null);
    const targetY = mouse.y ?? (phantomMouse.active ? phantomMouse.y : null);

    let combinedNodes = [...particles];
    if (targetX !== null) combinedNodes.push({ x: targetX, y: targetY * 1, isMouse: true, z: 1 });

    for (let a = 0; a < combinedNodes.length; a++) {
        let clusterCount = 0; // Track local density
        for (let b = a + 1; b < combinedNodes.length; b++) {
            let dx = combinedNodes[a].x - combinedNodes[b].x;
            let dy = combinedNodes[a].y - combinedNodes[b].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            const distLimit = connectionDistanceBase * (combinedNodes[a].z ?? 1);

            if (distance < distLimit) {
                clusterCount++;
                let opacity = (1 - (distance / distLimit)) * 0.3;
                
                // Enhance brightness if in a cluster
                if (clusterCount > 4) opacity *= 1.5;

                ctx.strokeStyle = themes[activeTheme].line.replace('0.2', opacity.toFixed(2));
                ctx.lineWidth = 0.5 * (combinedNodes[a].z ?? 1);
                ctx.beginPath();
                ctx.moveTo(combinedNodes[a].x, combinedNodes[a].y);
                ctx.lineTo(combinedNodes[b].x, combinedNodes[b].y);
                ctx.stroke();
            }
        }
    }
}

function updatePhantomMouse() {
    if (!phantomMouse.active) return;
    const time = Date.now() * 0.001;
    phantomMouse.x = canvas.width / 2 + Math.cos(time * 0.5) * (canvas.width * 0.3);
    phantomMouse.y = canvas.height / 2 + Math.sin(time * 0.8) * (canvas.height * 0.3);
}

function animate() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    updatePhantomMouse();

    for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
        particles[i].update();
    }
    
    connect();

    // Update HUD
    nodeCounter.innerText = particles.length;
    fluxDisplay.innerText = (driftSpeedMultiplier * 10).toFixed(0);
    
    if (particles.length > 200) particles.shift();
    requestAnimationFrame(animate);
}

init();
animate();




