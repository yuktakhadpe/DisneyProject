/* ===================================================
   DISNEY REIMAGINED — JavaScript
   Loading screen, Three.js particles, game, sounds, interactions
   =================================================== */

// ===== AUDIO SYSTEM =====
const AudioManager = (() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let enabled = true;

    function playTone(freq, duration = 0.15, type = 'sine', vol = 0.08) {
        if (!enabled) return;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) { }
    }

    return {
        hover: () => playTone(880, 0.08, 'sine', 0.04),
        click: () => playTone(660, 0.12, 'triangle', 0.06),
        success: () => {
            playTone(523, 0.15, 'sine', 0.06);
            setTimeout(() => playTone(659, 0.15, 'sine', 0.06), 120);
            setTimeout(() => playTone(784, 0.2, 'sine', 0.06), 240);
        },
        magic: () => {
            [523, 587, 659, 784, 880].forEach((f, i) => {
                setTimeout(() => playTone(f, 0.3, 'sine', 0.04), i * 100);
            });
        },
        chomp: () => playTone(220, 0.1, 'square', 0.05),
        gameWin: () => {
            [523, 659, 784, 1047].forEach((f, i) => {
                setTimeout(() => playTone(f, 0.25, 'sine', 0.06), i * 150);
            });
        },
        toggle: () => { enabled = !enabled; return enabled; },
        isEnabled: () => enabled,
        resume: () => { if (ctx.state === 'suspended') ctx.resume(); }
    };
})();


// ===== LOADING SCREEN =====
(function initLoader() {
    window.addEventListener('load', () => {
        setTimeout(() => {
            AudioManager.resume();
            AudioManager.magic();
            const loader = document.getElementById('loading-screen');
            if (loader) loader.classList.add('hidden');
        }, 3800);
    });
})();


// ===== SOUND TOGGLE =====
(function initSoundToggle() {
    const btn = document.getElementById('sound-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        AudioManager.resume();
        const on = AudioManager.toggle();
        btn.querySelector('.sound-on').style.display = on ? 'block' : 'none';
        btn.querySelector('.sound-off').style.display = on ? 'none' : 'block';
    });
})();


// ===== SPARKLE CURSOR TRAIL =====
(function initSparkleTrail() {
    const canvas = document.getElementById('sparkle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouseX = 0, mouseY = 0;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        for (let i = 0; i < 2; i++) {
            particles.push({
                x: mouseX + (Math.random() - 0.5) * 10,
                y: mouseY + (Math.random() - 0.5) * 10,
                size: Math.random() * 3 + 1,
                life: 1,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5 - 0.5,
                color: Math.random() > 0.5 ? 'hsla(42, 100%, 55%,' : 'hsla(210, 100%, 70%,'
            });
        }
    });

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) { particles.splice(i, 1); return; }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = p.color + p.life + ')';
            ctx.fill();
        });
        if (particles.length > 150) particles.splice(0, 50);
    }
    animate();
})();


// ===== THREE.JS MAGIC PARTICLES — ENHANCED =====
(function initThreeJS() {
    const canvas = document.getElementById('magic-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // ─── MOUSE & SCROLL TRACKING ───────────────────────────────────────
    let mouseX = 0, mouseY = 0, scrollRatio = 0, targetScrollRatio = 0;
    let smoothMouseX = 0, smoothMouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    window.addEventListener('scroll', () => {
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        targetScrollRatio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    });

    // ─── WARP TUNNEL ───────────────────────────────────────────────────
    // Thousands of stars arranged in a cylinder pointing at the viewer
    const WARP_COUNT = 8000;
    const warpGeo = new THREE.BufferGeometry();
    const warpPos = new Float32Array(WARP_COUNT * 3);
    const warpColors = new Float32Array(WARP_COUNT * 3);
    const warpOrigZ = new Float32Array(WARP_COUNT);
    const goldPalette = [
        [1.0, 0.85, 0.2],  // gold
        [0.29, 0.62, 1.0], // blue
        [1.0, 1.0, 1.0],   // white
        [1.0, 0.5, 0.8],   // pink
    ];
    for (let i = 0; i < WARP_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.5 + Math.random() * 14;
        const z = (Math.random() - 0.5) * 200;
        warpPos[i * 3] = Math.cos(angle) * radius;
        warpPos[i * 3 + 1] = Math.sin(angle) * radius;
        warpPos[i * 3 + 2] = z;
        warpOrigZ[i] = z;
        const c = goldPalette[Math.floor(Math.random() * goldPalette.length)];
        warpColors[i * 3] = c[0];
        warpColors[i * 3 + 1] = c[1];
        warpColors[i * 3 + 2] = c[2];
    }
    warpGeo.setAttribute('position', new THREE.BufferAttribute(warpPos, 3));
    warpGeo.setAttribute('color', new THREE.BufferAttribute(warpColors, 3));
    const warpMat = new THREE.PointsMaterial({
        size: 0.08, vertexColors: true, transparent: true, opacity: 0.0,
        sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const warpPoints = new THREE.Points(warpGeo, warpMat);
    scene.add(warpPoints);

    // ─── GALAXY SPIRAL ────────────────────────────────────────────────
    const GALAXY_COUNT = 12000;
    const galaxyGeo = new THREE.BufferGeometry();
    const galaxyPos = new Float32Array(GALAXY_COUNT * 3);
    const galaxyColors = new Float32Array(GALAXY_COUNT * 3);
    const ARMS = 5;
    for (let i = 0; i < GALAXY_COUNT; i++) {
        const arm = (i % ARMS) / ARMS * Math.PI * 2;
        const t = Math.random();
        const radius = t * 18;
        const spinAngle = radius * 0.35;
        const branchAngle = arm + spinAngle;
        const scatter = (1 - t) * 3 + 0.2;
        const rx = (Math.random() - 0.5) * scatter;
        const ry = (Math.random() - 0.5) * scatter * 0.3;
        const rz = (Math.random() - 0.5) * scatter;
        galaxyPos[i * 3] = Math.cos(branchAngle) * radius + rx;
        galaxyPos[i * 3 + 1] = ry;
        galaxyPos[i * 3 + 2] = Math.sin(branchAngle) * radius + rz - 35;
        const insideness = 1.0 - t;
        // inner = warm gold, outer = cool blue
        galaxyColors[i * 3] = 0.6 + insideness * 0.4;
        galaxyColors[i * 3 + 1] = 0.45 + insideness * 0.4;
        galaxyColors[i * 3 + 2] = 0.2 + (1 - insideness) * 0.8;
    }
    galaxyGeo.setAttribute('position', new THREE.BufferAttribute(galaxyPos, 3));
    galaxyGeo.setAttribute('color', new THREE.BufferAttribute(galaxyColors, 3));
    const galaxyMat = new THREE.PointsMaterial({
        size: 0.06, vertexColors: true, transparent: true, opacity: 0.85,
        sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const galaxyPoints = new THREE.Points(galaxyGeo, galaxyMat);
    scene.add(galaxyPoints);

    // ─── MAGICAL FLOATING ORBS ────────────────────────────────────────
    const orbGroup = new THREE.Group();
    const orbData = [];
    const orbColors = [0xFFD700, 0x4A9EFF, 0xFF80C0, 0x80FFD4, 0xFFD700];
    for (let i = 0; i < 12; i++) {
        const r = 0.08 + Math.random() * 0.14;
        const innerGeo = new THREE.SphereGeometry(r, 16, 16);
        const innerMat = new THREE.MeshBasicMaterial({
            color: orbColors[i % orbColors.length],
            transparent: true, opacity: 0.95,
        });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);

        // Glow rings around each orb
        const ringCount = 3;
        const orbRings = [];
        for (let rr = 0; rr < ringCount; rr++) {
            const ringR = r * (1.8 + rr * 0.6);
            const rGeo = new THREE.RingGeometry(ringR, ringR + 0.012, 32);
            const rMat = new THREE.MeshBasicMaterial({
                color: orbColors[i % orbColors.length],
                transparent: true, opacity: 0.18 - rr * 0.04,
                side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
            });
            const rMesh = new THREE.Mesh(rGeo, rMat);
            rMesh.rotation.x = Math.random() * Math.PI;
            rMesh.rotation.y = Math.random() * Math.PI;
            innerMesh.add(rMesh);
            orbRings.push(rMesh);
        }

        const angle = (i / 12) * Math.PI * 2;
        const dist = 3.5 + Math.random() * 3;
        innerMesh.position.set(
            Math.cos(angle) * dist,
            (Math.random() - 0.5) * 4,
            Math.sin(angle) * dist - 5
        );
        orbGroup.add(innerMesh);
        orbData.push({
            mesh: innerMesh, rings: orbRings,
            speed: 0.2 + Math.random() * 0.4,
            offset: Math.random() * Math.PI * 2,
            orbitRadius: dist,
            orbitAngle: angle,
            floatOffset: Math.random() * Math.PI * 2,
        });
    }
    scene.add(orbGroup);

    // ─── MICKEY SILHOUETTE (point cloud) ──────────────────────────────
    const mickeyGroup = new THREE.Group();
    function spherePts(r, n, ox, oy, oz) {
        const pts = [];
        for (let i = 0; i < n; i++) {
            const u = Math.random(), v = Math.random();
            const th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1);
            pts.push(new THREE.Vector3(
                ox + r * Math.sin(ph) * Math.cos(th),
                oy + r * Math.sin(ph) * Math.sin(th),
                oz + r * Math.cos(ph)
            ));
        }
        return pts;
    }
    const mickeyPts = [
        ...spherePts(2.2, 3000, 0, 0, 0),
        ...spherePts(1.2, 900, -2.1, 2.1, 0),
        ...spherePts(1.2, 900, 2.1, 2.1, 0),
    ];
    const mickeyGeo = new THREE.BufferGeometry().setFromPoints(mickeyPts);
    const mickeyMat = new THREE.PointsMaterial({
        color: 0xFFD700, size: 0.045, transparent: true, opacity: 0.92,
        blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const mickeyMesh = new THREE.Points(mickeyGeo, mickeyMat);
    mickeyGroup.add(mickeyMesh);

    // Wireframe shells
    [[2.1, 0, 0, 0], [1.15, -2.1, 2.1, 0], [1.15, 2.1, 2.1, 0]].forEach(([r, px, py, pz]) => {
        const m = new THREE.Mesh(
            new THREE.SphereGeometry(r, 18, 18),
            new THREE.MeshBasicMaterial({
                color: 0xD4A017, wireframe: true, transparent: true, opacity: 0.12,
                blending: THREE.AdditiveBlending,
            })
        );
        m.position.set(px, py, pz);
        mickeyGroup.add(m);
    });

    // Concentric glowing rings around Mickey
    [3.6, 5.2, 7.0].forEach((rr, idx) => {
        const rGeo = new THREE.RingGeometry(rr, rr + 0.05, 96);
        const rMat = new THREE.MeshBasicMaterial({
            color: idx === 0 ? 0xFFD700 : idx === 1 ? 0x4A9EFF : 0xFF80C0,
            transparent: true, opacity: 0.25 - idx * 0.06,
            side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
        });
        const rMesh = new THREE.Mesh(rGeo, rMat);
        rMesh.rotation.x = Math.PI / 2;
        rMesh.userData.idx = idx;
        mickeyGroup.add(rMesh);
    });

    mickeyGroup.position.set(0, 0, -10);
    scene.add(mickeyGroup);

    // ─── BACKGROUND STAR FIELD ─────────────────────────────────────────
    const bgCount = 3500;
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(bgCount * 3);
    for (let i = 0; i < bgCount; i++) {
        bgPos[i * 3] = (Math.random() - 0.5) * 300;
        bgPos[i * 3 + 1] = (Math.random() - 0.5) * 300;
        bgPos[i * 3 + 2] = -30 - Math.random() * 100;
    }
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    const bgMat = new THREE.PointsMaterial({
        color: 0xffffff, size: 0.05, transparent: true, opacity: 0.5,
        sizeAttenuation: true, depthWrite: false,
    });
    scene.add(new THREE.Points(bgGeo, bgMat));

    // ─── GOLD PARTICLE CLOUD ──────────────────────────────────────────
    const goldCount = 5000;
    const goldGeo = new THREE.BufferGeometry();
    const goldPos2 = new Float32Array(goldCount * 3);
    for (let i = 0; i < goldCount; i++) {
        goldPos2[i * 3] = (Math.random() - 0.5) * 30;
        goldPos2[i * 3 + 1] = (Math.random() - 0.5) * 30;
        goldPos2[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    goldGeo.setAttribute('position', new THREE.BufferAttribute(goldPos2, 3));
    const goldMat = new THREE.PointsMaterial({
        color: 0xD4A017, size: 0.035, transparent: true, opacity: 0.75,
        sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const goldPoints = new THREE.Points(goldGeo, goldMat);
    scene.add(goldPoints);

    // ─── SHOOTING STARS ────────────────────────────────────────────────
    const shootingStars = [];
    function createShootingStar() {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(6);
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const color = Math.random() > 0.5 ? 0xFFD700 : 0x4A9EFF;
        const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
        const line = new THREE.Line(geo, mat);
        const star = {
            mesh: line,
            x: (Math.random() - 0.5) * 25,
            y: Math.random() * 12 + 4,
            z: (Math.random() - 0.5) * 8,
            vx: -(Math.random() * 0.4 + 0.15),
            vy: -(Math.random() * 0.25 + 0.1),
            tailLen: 0.3 + Math.random() * 0.8,
            life: 1,
        };
        scene.add(line);
        shootingStars.push(star);
    }
    setInterval(createShootingStar, 1800);

    // ─── NEBULA CLOUDS ─────────────────────────────────────────────────
    const nebulaGroup = new THREE.Group();
    [[0x0d1a33, -8, 3, -18], [0x1a0533, 6, -4, -20], [0x0a2040, -3, -6, -22], [0x150825, 10, 5, -16]].forEach(([c, px, py, pz]) => {
        const geo = new THREE.SphereGeometry(3 + Math.random() * 2.5, 10, 10);
        const mat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.055, depthWrite: false });
        const m = new THREE.Mesh(geo, mat);
        m.position.set(px, py, pz);
        m.userData = { speed: 0.08 + Math.random() * 0.12, offset: Math.random() * Math.PI * 2 };
        nebulaGroup.add(m);
    });
    scene.add(nebulaGroup);

    // ─── RESIZE ────────────────────────────────────────────────────────
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ─── ANIMATE ───────────────────────────────────────────────────────
    let prevTime = 0;
    function animate() {
        requestAnimationFrame(animate);
        const time = performance.now() * 0.001;
        const dt = time - prevTime;
        prevTime = time;

        // Smooth mouse & scroll
        smoothMouseX += (mouseX - smoothMouseX) * 0.05;
        smoothMouseY += (mouseY - smoothMouseY) * 0.05;
        scrollRatio += (targetScrollRatio - scrollRatio) * 0.04;

        // Camera parallax from mouse (gentle)
        camera.position.x += (smoothMouseX * 1.2 - camera.position.x) * 0.04;
        camera.position.y += (-smoothMouseY * 0.8 - camera.position.y) * 0.04;
        // Camera zoom/fly on scroll — pull toward galaxy
        const camZ = 8 - scrollRatio * 32;
        camera.position.z += (camZ - camera.position.z) * 0.035;
        camera.lookAt(0, 0, camera.position.z - 10);

        // WARP TUNNEL — activate on scroll
        const warpIntensity = Math.min(1, scrollRatio * 3);
        warpMat.opacity = warpIntensity * 0.7;
        const posArr = warpGeo.attributes.position.array;
        const TUNNEL_SPEED = 0.4 + warpIntensity * 4.0;
        for (let i = 0; i < WARP_COUNT; i++) {
            posArr[i * 3 + 2] += TUNNEL_SPEED * dt;
            if (posArr[i * 3 + 2] > camera.position.z + 5) {
                posArr[i * 3 + 2] -= 210;
            }
        }
        warpGeo.attributes.position.needsUpdate = true;

        // Galaxy rotation
        galaxyPoints.rotation.y = time * 0.04;
        galaxyMat.opacity = 0.6 + Math.sin(time * 0.3) * 0.15;

        // Mickey animations
        mickeyGroup.rotation.y = time * 0.25 + smoothMouseX * 0.4;
        mickeyGroup.rotation.x = smoothMouseY * 0.2;
        mickeyGroup.position.y = Math.sin(time * 1.1) * 0.45;
        mickeyMat.size = 0.04 + Math.sin(time * 2.5) * 0.012;
        // Fade Mickey as user scrolls deeper
        mickeyMat.opacity = Math.max(0, 0.95 - scrollRatio * 2.5);
        // Spin concentric rings at different speeds
        mickeyGroup.children.forEach((child) => {
            if (child.userData.idx !== undefined) {
                const speeds = [0.8, -0.5, 1.2];
                child.rotation.z += speeds[child.userData.idx] * dt;
            }
        });

        // Gold particles
        goldPoints.rotation.x = time * 0.025 + smoothMouseY * 0.12;
        goldPoints.rotation.y = time * 0.04 + smoothMouseX * 0.12;
        goldMat.opacity = (0.55 + Math.sin(time * 0.6) * 0.2) * (1 - scrollRatio * 0.7);

        // Floating orbs
        orbData.forEach((od, i) => {
            od.orbitAngle += od.speed * 0.008;
            od.mesh.position.x = Math.cos(od.orbitAngle) * od.orbitRadius;
            od.mesh.position.z = Math.sin(od.orbitAngle) * od.orbitRadius - 5;
            od.mesh.position.y += Math.sin(time * od.speed + od.floatOffset) * 0.006;
            // Pulse glow rings
            od.rings.forEach((ring, ri) => {
                ring.rotation.x += (0.4 + ri * 0.3) * dt;
                ring.rotation.y += (0.3 + ri * 0.2) * dt;
                ring.material.opacity = (0.12 - ri * 0.03) * (0.6 + 0.4 * Math.sin(time * od.speed + od.offset));
            });
        });

        // Nebula breathing
        nebulaGroup.children.forEach((m) => {
            const s = 1 + Math.sin(time * m.userData.speed + m.userData.offset) * 0.12;
            m.scale.set(s, s, s);
        });

        // Shooting stars
        shootingStars.forEach((s, i) => {
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.012;
            const pos = s.mesh.geometry.attributes.position.array;
            pos[0] = s.x; pos[1] = s.y; pos[2] = s.z;
            pos[3] = s.x - s.vx * s.tailLen * 8;
            pos[4] = s.y - s.vy * s.tailLen * 8;
            pos[5] = s.z;
            s.mesh.geometry.attributes.position.needsUpdate = true;
            s.mesh.material.opacity = s.life * 0.9;
            if (s.life <= 0) { scene.remove(s.mesh); shootingStars.splice(i, 1); }
        });

        renderer.render(scene, camera);
    }
    animate();
})();


// ===== NAVBAR SCROLL + SOUND =====
(function initNavbar() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('mobile-toggle');
    const links = document.getElementById('nav-links');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    toggle.addEventListener('click', () => {
        AudioManager.resume();
        AudioManager.click();
        toggle.classList.toggle('active');
        links.classList.toggle('open');
    });

    links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            AudioManager.resume();
            AudioManager.click();
            toggle.classList.remove('active');
            links.classList.remove('open');
        });
        a.addEventListener('mouseenter', () => AudioManager.hover());
    });
})();


// ===== HOVER / CLICK SOUNDS FOR BUTTONS =====
(function initButtonSounds() {
    document.addEventListener('click', () => AudioManager.resume(), { once: true });
    document.querySelectorAll('.btn-sound, .btn-primary, .btn-outline, .btn-disney-plus').forEach(btn => {
        btn.addEventListener('mouseenter', () => AudioManager.hover());
        btn.addEventListener('click', () => AudioManager.click());
    });
    document.querySelectorAll('.character-card').forEach(card => {
        card.addEventListener('mouseenter', () => AudioManager.hover());
    });
    document.querySelectorAll('.story-link').forEach(link => {
        link.addEventListener('mouseenter', () => AudioManager.hover());
        link.addEventListener('click', () => AudioManager.click());
    });
})();


// ===== SCROLL ANIMATIONS =====
(function initScrollAnimations() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.index ? parseInt(entry.target.dataset.index) * 150 : 0;
                    setTimeout(() => entry.target.classList.add('visible'), delay);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '-50px' }
    );
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
})();


// ===== COUNTER ANIMATION =====
(function initCounters() {
    let counted = false;
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !counted) {
                    counted = true;
                    AudioManager.success();
                    document.querySelectorAll('.stat-value').forEach(counter => {
                        const target = parseInt(counter.dataset.target);
                        let current = 0;
                        const increment = target / 60;
                        const timer = setInterval(() => {
                            current += increment;
                            if (current >= target) {
                                counter.textContent = target;
                                clearInterval(timer);
                            } else {
                                counter.textContent = Math.floor(current);
                            }
                        }, 25);
                    });
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.3 }
    );
    const statsSection = document.getElementById('stats');
    if (statsSection) observer.observe(statsSection);
})();


// ===== CHARACTER CARD INTERACTIONS =====
(function initCharacterCards() {
    const cards = document.querySelectorAll('.character-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });
    if (cards.length > 0) cards[0].classList.add('active');
})();


// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});


// ===== HERO PARALLAX =====
(function initParallax() {
    const heroBg = document.querySelector('.hero-bg img');
    if (!heroBg) return;
    window.addEventListener('scroll', () => {
        heroBg.style.transform = `translateY(${window.scrollY * 0.3}px) scale(1.1)`;
    });
})();


// ===== MICKEY CHEESE GAME =====
(function initMickeyGame() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('game-score');
    const timerEl = document.getElementById('game-timer');
    const hintEl = document.getElementById('game-hint');
    const restartBtn = document.getElementById('game-restart');

    let W, H;
    function resize() {
        const rect = canvas.getBoundingClientRect();
        W = canvas.width = rect.width;
        H = canvas.height = rect.height || 450;
    }
    resize();
    window.addEventListener('resize', resize);

    let score = 0;
    let startTime = 0;
    let gameActive = true;
    let cheeses = [];
    let sparkles = [];

    // Mickey position
    const mickey = {
        x: 0, y: 0, w: 80, h: 90,
        mouthOpen: false, mouthTimer: 0,
    };

    function resetGame() {
        score = 0;
        startTime = performance.now();
        gameActive = true;
        cheeses = [];
        sparkles = [];
        scoreEl.textContent = '0';
        hintEl.textContent = '🧀 Click cheese to toss it to Mickey!';
        spawnCheese();
    }

    function spawnCheese() {
        if (!gameActive) return;
        cheeses.push({
            x: 80 + Math.random() * (W - 200),
            y: H - 60,
            size: 30,
            vy: 0,
            vx: 0,
            tossed: false,
            eaten: false,
        });
    }

    function drawMickey(ctx) {
        const mx = W / 2;
        const my = 80;
        mickey.x = mx;
        mickey.y = my;

        // Ears
        ctx.beginPath();
        ctx.arc(mx - 30, my - 30, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
        ctx.strokeStyle = '#D4A017';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(mx + 30, my - 30, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.arc(mx, my, 35, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
        ctx.stroke();

        // Eyes
        ctx.beginPath();
        ctx.arc(mx - 12, my - 8, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#D4A017';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mx + 12, my - 8, 5, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.beginPath();
        if (mickey.mouthOpen) {
            ctx.arc(mx, my + 10, 12, 0, Math.PI);
            ctx.fillStyle = '#D4A017';
            ctx.fill();
        } else {
            ctx.arc(mx, my + 8, 10, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.strokeStyle = '#D4A017';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Nose
        ctx.beginPath();
        ctx.ellipse(mx, my + 2, 6, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#D4A017';
        ctx.fill();
    }

    function drawCheese(ctx, c) {
        ctx.save();
        ctx.translate(c.x, c.y);
        // Cheese wedge
        ctx.beginPath();
        ctx.moveTo(0, -c.size / 2);
        ctx.lineTo(c.size / 2, c.size / 2);
        ctx.lineTo(-c.size / 2, c.size / 2);
        ctx.closePath();
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Holes
        ctx.beginPath();
        ctx.arc(-5, 5, 3, 0, Math.PI * 2);
        ctx.arc(8, -2, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#E6BE32';
        ctx.fill();
        ctx.restore();
    }

    function addSparkles(x, y) {
        for (let i = 0; i < 12; i++) {
            sparkles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1,
                size: Math.random() * 4 + 2,
                color: Math.random() > 0.5 ? '#FFD700' : '#4A9EFF',
            });
        }
    }

    canvas.addEventListener('click', (e) => {
        AudioManager.resume();
        if (!gameActive) return;
        const rect = canvas.getBoundingClientRect();
        const cx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const cy = (e.clientY - rect.top) * (canvas.height / rect.height);

        cheeses.forEach(c => {
            if (c.tossed || c.eaten) return;
            const dx = cx - c.x;
            const dy = cy - c.y;
            if (Math.sqrt(dx * dx + dy * dy) < c.size + 15) {
                // Toss towards Mickey
                const angle = Math.atan2(mickey.y - c.y, mickey.x - c.x);
                c.vx = Math.cos(angle) * 8;
                c.vy = Math.sin(angle) * 8;
                c.tossed = true;
                AudioManager.click();
            }
        });
    });

    restartBtn.addEventListener('click', () => {
        AudioManager.click();
        resetGame();
    });

    function gameLoop() {
        requestAnimationFrame(gameLoop);
        ctx.clearRect(0, 0, W, H);

        drawMickey(ctx);

        if (mickey.mouthTimer > 0) {
            mickey.mouthOpen = true;
            mickey.mouthTimer--;
        } else {
            mickey.mouthOpen = false;
        }

        // Update cheeses
        cheeses.forEach((c, i) => {
            if (c.eaten) return;
            if (c.tossed) {
                c.x += c.vx;
                c.y += c.vy;

                // Check collision with Mickey
                const dx = c.x - mickey.x;
                const dy = c.y - mickey.y;
                if (Math.sqrt(dx * dx + dy * dy) < 40) {
                    c.eaten = true;
                    score++;
                    scoreEl.textContent = score;
                    mickey.mouthTimer = 15;
                    addSparkles(mickey.x, mickey.y);
                    AudioManager.chomp();

                    if (score >= 10) {
                        gameActive = false;
                        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
                        hintEl.textContent = `🎉 Amazing! You fed Mickey 10 cheeses in ${elapsed}s! 🎉`;
                        AudioManager.gameWin();
                    } else {
                        setTimeout(spawnCheese, 500);
                    }
                }

                // Off screen
                if (c.y < -50 || c.x < -50 || c.x > W + 50) {
                    c.eaten = true;
                    setTimeout(spawnCheese, 300);
                }
            }
            if (!c.eaten) drawCheese(ctx, c);
        });

        // Sparkles
        sparkles.forEach((s, i) => {
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.03;
            if (s.life <= 0) { sparkles.splice(i, 1); return; }
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = s.life;
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        // Timer
        if (gameActive && score > 0) {
            timerEl.textContent = ((performance.now() - startTime) / 1000).toFixed(1);
        }

        // Ground line
        ctx.strokeStyle = 'hsla(42, 100%, 55%, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, H - 30);
        ctx.lineTo(W, H - 30);
        ctx.stroke();
    }

    resetGame();
    gameLoop();
})();


// ===== HERO PARALLAX & INTERACTIVE ANIMATIONS =====
(function initHeroAnimations() {
    const hero = document.getElementById('hero');
    const heroImage = document.querySelector('.hero-main-image');
    const heroImageWrapper = document.querySelector('.hero-image-wrapper');
    const heroContent = document.querySelector('.hero-content');
    const sparkles = document.querySelectorAll('.floating-sparkle');

    if (!hero || !heroImage) return;

    const isMobile = window.innerWidth <= 768;
    const parallaxIntensity = isMobile ? 0.3 : 1;

    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let scrollY = 0;

    // Mouse move parallax
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Scroll parallax
    window.addEventListener('scroll', () => {
        const heroRect = hero.getBoundingClientRect();
        const heroHeight = heroRect.height;
        scrollY = Math.max(0, -heroRect.top);

        // Parallax effect on scroll
        if (heroRect.top < window.innerHeight && heroRect.bottom > 0) {
            const scrollProgress = scrollY / heroHeight;
            if (heroImageWrapper) {
                heroImageWrapper.style.transform = `translateY(${scrollProgress * 50}px) scale(${1 + scrollProgress * 0.1})`;
            }
        }
    });

    // Smooth mouse parallax animation
    function animateParallax() {
        requestAnimationFrame(animateParallax);

        // Smooth interpolation
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        // Apply parallax to image
        if (heroImage) {
            const moveX = targetX * 20 * parallaxIntensity;
            const moveY = targetY * 20 * parallaxIntensity;
            heroImage.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }

        // Parallax to content (subtle)
        if (heroContent && !isMobile) {
            const contentMoveX = targetX * -10 * parallaxIntensity;
            const contentMoveY = targetY * -10 * parallaxIntensity;
            heroContent.style.transform = `translate(${contentMoveX}px, ${contentMoveY}px)`;
        }

        // Animate sparkles based on mouse (only on desktop)
        if (!isMobile) {
            sparkles.forEach((sparkle, index) => {
                const intensity = (index % 2 === 0) ? 0.3 : 0.5;
                const sparkleX = targetX * 15 * intensity * parallaxIntensity;
                const sparkleY = targetY * 15 * intensity * parallaxIntensity;
                sparkle.style.transform = `translate(${sparkleX}px, ${sparkleY}px)`;
            });
        }
    }

    animateParallax();

    // Scroll indicator click
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const charactersSection = document.getElementById('characters');
            if (charactersSection) {
                charactersSection.scrollIntoView({ behavior: 'smooth' });
                AudioManager.click();
            }
        });
    }

    // Add mouse enter/leave effects
    hero.addEventListener('mouseenter', () => {
        if (heroImage) {
            heroImage.style.transition = 'transform 0.3s ease';
        }
    });

    hero.addEventListener('mouseleave', () => {
        if (heroImage) {
            heroImage.style.transition = 'transform 0.5s ease';
        }
    });

    // Intersection Observer for hero animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px'
    };

    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('hero-visible');
            }
        });
    }, observerOptions);

    if (heroContent) {
        heroObserver.observe(heroContent);
    }
})();


console.log('✨ Disney Reimagined — Loaded successfully');

// ═══════════════════════════════════════════════════════
//   CHARACTER PICKER + EMOJI CURSOR
// ═══════════════════════════════════════════════════════
(function initCharPicker() {

    const CHARS = {
        mickey: { emoji: '🐭', name: 'Mickey Mouse', msg: 'Mickey Mouse is following you!' },
        moana: { emoji: '🌊', name: 'Moana', msg: 'Moana is riding the waves with you!' },
        simba: { emoji: '🦁', name: 'Simba', msg: 'Simba is roaring right beside you!' },
        elsa: { emoji: '❄️', name: 'Elsa', msg: 'Elsa is letting it go — right to your cursor!' },
    };

    const cursor = document.getElementById('emoji-cursor');
    const activeEl = document.getElementById('char-pick-active');
    const activeEmoji = document.getElementById('char-active-emoji');
    const activeName = document.getElementById('char-active-name');

    let chosen = null;
    let raf = null;
    // Smooth cursor position
    let cx = -200, cy = -200;   // current rendered position
    let tx = -200, ty = -200;   // mouse target

    // Track mouse for emoji cursor
    document.addEventListener('mousemove', (e) => {
        tx = e.clientX;
        ty = e.clientY;
    });

    function animCursor() {
        if (chosen) {
            // Smooth lag follow — charming for kids
            cx += (tx - cx) * 0.18;
            cy += (ty - cy) * 0.18;
            cursor.style.left = cx + 'px';
            cursor.style.top = cy + 'px';
        }
        raf = requestAnimationFrame(animCursor);
    }
    animCursor();

    // Hover sparkle burst on pick btns
    document.querySelectorAll('.char-pick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            AudioManager.resume();
            AudioManager.magic();

            const key = btn.dataset.char;
            const data = CHARS[key];
            if (!data) return;

            // Toggle off if re-clicking same
            if (chosen === key) {
                resetCharCursor();
                return;
            }

            chosen = key;

            // Visual state on buttons
            document.querySelectorAll('.char-pick-btn').forEach(b => b.classList.remove('chosen'));
            btn.classList.add('chosen');

            // Show cursor
            cursor.textContent = data.emoji;
            cursor.style.display = 'block';
            document.body.style.cursor = 'none';

            // Show active bar
            activeEmoji.textContent = data.emoji;
            activeName.textContent = data.msg;
            activeEl.classList.add('visible');

            // Tiny confetti burst from the button
            burstFromBtn(btn, data.emoji);
        });

        // Sound on hover
        btn.addEventListener('mouseenter', () => AudioManager.hover());
    });

    // Confetti emoji burst
    function burstFromBtn(btn, emoji) {
        const rect = btn.getBoundingClientRect();
        for (let i = 0; i < 8; i++) {
            const el = document.createElement('div');
            el.textContent = emoji;
            el.style.cssText = `
                position:fixed;
                left:${rect.left + rect.width / 2}px;
                top:${rect.top + rect.height / 2}px;
                font-size:1.4rem;
                pointer-events:none;
                z-index:99998;
                transition:all 0.7s cubic-bezier(0,0.6,0.6,1);
                opacity:1;
            `;
            document.body.appendChild(el);
            const angle = (i / 8) * Math.PI * 2;
            const dist = 60 + Math.random() * 60;
            requestAnimationFrame(() => {
                el.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist - 40}px) scale(0.3)`;
                el.style.opacity = '0';
            });
            setTimeout(() => el.remove(), 750);
        }
    }

    // Global reset function (called by Reset button onclick)
    window.resetCharCursor = function () {
        chosen = null;
        cursor.style.display = 'none';
        document.body.style.cursor = '';
        activeEl.classList.remove('visible');
        document.querySelectorAll('.char-pick-btn').forEach(b => b.classList.remove('chosen'));
        AudioManager.click();
    };

})();


// ═══════════════════════════════════════════════════════
//   COMIC CARD DECK — SWIPE / CLICK / DRAG
// ═══════════════════════════════════════════════════════
(function initComicDeck() {

    const deck = document.getElementById('comic-deck');
    if (!deck) return;

    const prevBtn = document.getElementById('comic-prev');
    const nextBtn = document.getElementById('comic-next');
    const dots = document.querySelectorAll('.comic-dot');
    const hintEl = document.getElementById('comic-hint');

    const TOTAL = 5;
    let current = 0;   // index of the "top" card (0 = page 1)
    let animating = false;

    // Cards ordered front → back (page 1 first in DOM = last child = visually top)
    // We reverse to get them in visual order: cards[0] = page1 (top), cards[4] = page5 (bottom)
    function getCards() {
        return [...deck.querySelectorAll('.comic-card')].reverse();
    }

    function updateDots() {
        dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function updateButtons() {
        if (prevBtn) prevBtn.disabled = current === 0;
        if (nextBtn) nextBtn.disabled = current === TOTAL - 1;
    }

    // Lay out the deck positions based on current
    function layoutCards(animated) {
        getCards().forEach((card, i) => {
            const relIdx = i - current; // negative = already passed, 0 = top, positive = behind

            card.classList.remove('slide-out-left', 'slide-out-right', 'promote');

            if (relIdx < 0) {
                // Already swiped — hide behind everything
                card.style.transform = 'translateX(-110%) rotate(-6deg)';
                card.style.opacity = '0';
                card.style.zIndex = '0';
                card.style.pointerEvents = 'none';
            } else {
                const stackI = relIdx; // 0 = top, 1 = next, ...
                card.style.transform = `
                    translateX(${stackI * 6}px)
                    translateY(${stackI * 6}px)
                    scale(${1 - stackI * 0.04})
                `;
                card.style.opacity = stackI > 3 ? '0' : '1';
                card.style.zIndex = String(TOTAL - stackI);
                card.style.pointerEvents = stackI === 0 ? 'auto' : 'none';
            }

            if (animated) card.classList.add('promote');
        });
    }

    function goNext() {
        if (animating || current >= TOTAL - 1) return;
        animating = true;

        const cards = getCards();
        const topCard = cards[current];

        // Slide top card out to the left
        topCard.classList.add('slide-out-left');
        AudioManager.click();

        setTimeout(() => {
            current++;
            updateDots();
            updateButtons();
            layoutCards(true);
            animating = false;
            if (hintEl) hintEl.textContent = current === TOTAL - 1
                ? '🎉 You reached the end! ← swipe back'
                : '👆 Swipe or click → to turn the page';
        }, 430);
    }

    function goPrev() {
        if (animating || current <= 0) return;
        animating = true;
        AudioManager.click();

        current--;
        updateDots();
        updateButtons();

        // Snap the "coming back" card into place
        const cards = getCards();
        const topCard = cards[current];
        topCard.classList.remove('slide-out-left', 'slide-out-right');
        topCard.style.transform = 'translateX(110%) rotate(6deg)';
        topCard.style.opacity = '0';
        topCard.style.zIndex = String(TOTAL);
        topCard.style.pointerEvents = 'none';

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                layoutCards(true);
                animating = false;
            });
        });
    }

    // Next / Prev buttons
    if (nextBtn) nextBtn.addEventListener('click', goNext);
    if (prevBtn) prevBtn.addEventListener('click', goPrev);

    // Dot navigation
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            if (animating || i === current) return;
            if (i > current) goNext();
            else goPrev();
        });
    });

    // Keyboard arrows
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') goNext();
        if (e.key === 'ArrowLeft') goPrev();
    });

    // ── SWIPE / DRAG GESTURE ───────────────────
    let dragStartX = null, dragCurrentX = 0, isDragging = false;
    const SWIPE_THRESHOLD = 60;

    function onDragStart(x) {
        if (animating) return;
        dragStartX = x;
        isDragging = true;
        deck.classList.add('dragging');
    }

    function onDragMove(x) {
        if (!isDragging || dragStartX === null) return;
        dragCurrentX = x - dragStartX;
        const cards = getCards();
        const topCard = cards[current];
        if (!topCard) return;
        topCard.style.transition = 'none';
        const rot = dragCurrentX * 0.04;
        topCard.style.transform = `translateX(${dragCurrentX}px) rotate(${rot}deg)`;
        topCard.style.opacity = String(Math.max(0.4, 1 - Math.abs(dragCurrentX) / 300));
    }

    function onDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        deck.classList.remove('dragging');

        if (Math.abs(dragCurrentX) > SWIPE_THRESHOLD) {
            dragCurrentX > 0 ? goPrev() : goNext();
        } else {
            // Snap back
            layoutCards(true);
        }
        dragStartX = null;
        dragCurrentX = 0;
    }

    // Mouse events
    deck.addEventListener('mousedown', e => onDragStart(e.clientX));
    window.addEventListener('mousemove', e => { if (isDragging) onDragMove(e.clientX); });
    window.addEventListener('mouseup', () => onDragEnd());

    // Touch events
    deck.addEventListener('touchstart', e => onDragStart(e.touches[0].clientX), { passive: true });
    deck.addEventListener('touchmove', e => onDragMove(e.touches[0].clientX), { passive: true });
    deck.addEventListener('touchend', () => onDragEnd());

    // Init
    updateDots();
    updateButtons();
    layoutCards(false);

})();