
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


// ===== MICKEY CHEESE GAME — IMPROVED =====
(function initMickeyGame() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('game-score');
    const timerEl = document.getElementById('game-timer');
    const hintEl = document.getElementById('game-hint');
    const livesEl = document.getElementById('game-lives');
    const levelEl = document.getElementById('game-level');
    const restartBtn = document.getElementById('game-restart');

    let W, H;
    function resize() {
        const rect = canvas.getBoundingClientRect();
        W = canvas.width = rect.width;
        H = canvas.height = rect.height || 450;
    }
    resize();
    window.addEventListener('resize', resize);

    const TARGET = 10;
    let score = 0, lives = 3, level = 1;
    let startTime = 0;
    let gameActive = false, gameOver = false;
    let cheeses = [], sparkles = [], floatingTexts = [];
    let mickeyBob = 0, mickeyHappy = 0;
    let bgStars = [];

    // Generate background stars once
    for (let i = 0; i < 60; i++) {
        bgStars.push({
            x: Math.random(), y: Math.random(),
            r: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.5 + 0.1,
            twinkle: Math.random() * Math.PI * 2,
        });
    }

    const mickey = { x: 0, y: 0, mouthOpen: false, mouthTimer: 0, scale: 1, wobble: 0 };

    function updateLivesDisplay() {
        if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
    }

    function updateLevelDisplay() {
        if (levelEl) levelEl.textContent = `Level ${level}`;
    }

    function resetGame() {
        score = 0; lives = 3; level = 1;
        startTime = performance.now();
        gameActive = true; gameOver = false;
        cheeses = []; sparkles = []; floatingTexts = [];
        if (scoreEl) scoreEl.textContent = `0`;
        hintEl.textContent = '🧀 Click cheese to toss it to Mickey!';
        updateLivesDisplay();
        updateLevelDisplay();
        spawnCheese();
    }

    function getCheeseSpeed() { return 6 + level * 1.5; }

    function spawnCheese() {
        if (!gameActive) return;
        const margin = 80;
        cheeses.push({
            x: margin + Math.random() * (W - margin * 2),
            y: H - 55,
            size: 28 - level * 0.5,
            vy: 0, vx: 0,
            tossed: false, eaten: false,
            rot: 0, rotSpeed: (Math.random() - 0.5) * 0.15,
            pulse: Math.random() * Math.PI * 2,
        });
    }

    function drawBackground() {
        // Starfield background
        const t = performance.now() * 0.001;
        bgStars.forEach(s => {
            const tw = Math.sin(s.twinkle + t * 0.7) * 0.3 + 0.7;
            ctx.beginPath();
            ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${s.alpha * tw})`;
            ctx.fill();
        });

        // Ground platform
        const grd = ctx.createLinearGradient(0, H - 40, 0, H);
        grd.addColorStop(0, 'hsla(222,60%,15%,0.8)');
        grd.addColorStop(1, 'hsla(222,60%,8%,0.8)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, H - 40, W, 40);
        ctx.strokeStyle = 'hsla(42,100%,55%,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, H - 40); ctx.lineTo(W, H - 40);
        ctx.stroke();

        // Glow under Mickey
        const radGrd = ctx.createRadialGradient(W / 2, 120, 0, W / 2, 120, 120);
        radGrd.addColorStop(0, 'hsla(42,100%,55%,0.08)');
        radGrd.addColorStop(1, 'transparent');
        ctx.fillStyle = radGrd;
        ctx.fillRect(W / 2 - 120, 0, 240, 240);
    }

    function drawMickey() {
        const t = performance.now() * 0.001;
        mickeyBob = Math.sin(t * 1.8) * 3;
        const mx = W / 2;
        const my = 100 + mickeyBob;
        mickey.x = mx; mickey.y = my;

        const sc = mickey.scale + Math.sin(mickey.wobble) * 0.05;
        ctx.save();
        ctx.translate(mx, my);
        ctx.scale(sc, sc);

        // Happy glow
        if (mickey.mouthOpen) {
            ctx.beginPath();
            ctx.arc(0, 0, 60, 0, Math.PI * 2);
            const gl = ctx.createRadialGradient(0,0,20,0,0,60);
            gl.addColorStop(0, 'hsla(42,100%,55%,0.25)');
            gl.addColorStop(1, 'transparent');
            ctx.fillStyle = gl;
            ctx.fill();
        }

        // Shadow under Mickey
        ctx.beginPath();
        ctx.ellipse(0, 52, 32, 7, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();

        // Ears
        [[-32, -28], [32, -28]].forEach(([ex, ey]) => {
            ctx.beginPath();
            ctx.arc(ex, ey, 20, 0, Math.PI * 2);
            ctx.fillStyle = '#0d0d1a';
            ctx.fill();
            ctx.strokeStyle = 'hsla(42,100%,55%,0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // Inner ear shine
            ctx.beginPath();
            ctx.arc(ex - 4, ey - 4, 7, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fill();
        });

        // Head
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fillStyle = '#0d0d1a';
        ctx.fill();
        ctx.strokeStyle = 'hsla(42,100%,55%,0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Head shine
        ctx.beginPath();
        ctx.arc(-10, -14, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fill();

        // Snout
        ctx.beginPath();
        ctx.ellipse(0, 14, 16, 11, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#c8906a';
        ctx.fill();

        // Nose
        ctx.beginPath();
        ctx.ellipse(0, 8, 7, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#0d0d1a';
        ctx.fill();
        // Nose sheen
        ctx.beginPath();
        ctx.arc(-2, 6, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fill();

        // Eyes
        [[-13, -8], [13, -8]].forEach(([ex, ey]) => {
            ctx.beginPath();
            ctx.ellipse(ex, ey, 6, 7, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ex + 1.5, ey + 1, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#1a1a3e';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ex + 2.5, ey - 0.5, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            // Brow
            ctx.beginPath();
            ctx.moveTo(ex - 6, ey - 8);
            ctx.quadraticCurveTo(ex, ey - 12, ex + 6, ey - 8);
            ctx.strokeStyle = '#0d0d1a';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Mouth
        if (mickey.mouthOpen) {
            ctx.beginPath();
            ctx.arc(0, 18, 12, 0, Math.PI);
            ctx.fillStyle = '#8B1a1a';
            ctx.fill();
            // Tongue
            ctx.beginPath();
            ctx.ellipse(0, 28, 7, 5, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#e05050';
            ctx.fill();
            // Teeth
            ctx.fillStyle = 'white';
            ctx.fillRect(-10, 18, 9, 5);
            ctx.fillRect(1, 18, 9, 5);
        } else {
            ctx.beginPath();
            ctx.moveTo(-10, 20);
            ctx.quadraticCurveTo(0, 26, 10, 20);
            ctx.strokeStyle = '#0d0d1a';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }

        // Hat hint (subtle dots for ears)
        ctx.restore();

        // Happy emoji above
        if (mickey.mouthTimer > 10) {
            ctx.font = '20px serif';
            ctx.fillStyle = `rgba(255,215,0,${(mickey.mouthTimer / 30)})`;
            ctx.textAlign = 'center';
            ctx.fillText('😋', mx, my - 60);
        }

        if (mickey.wobble > 0) mickey.wobble += 0.3;
        if (mickey.wobble > Math.PI * 4) mickey.wobble = 0;
    }

    function drawCheese(c) {
        ctx.save();
        ctx.translate(c.x, c.y);
        if (c.tossed) ctx.rotate(c.rot);
        const t = performance.now() * 0.002;
        const pulse = c.tossed ? 1 : 1 + Math.sin(c.pulse + t) * 0.06;
        ctx.scale(pulse, pulse);

        // Shadow
        if (!c.tossed) {
            ctx.beginPath();
            ctx.ellipse(0, c.size * 0.5, c.size * 0.5, 4, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fill();
        }

        // Cheese wedge
        ctx.beginPath();
        ctx.moveTo(0, -c.size * 0.5);
        ctx.lineTo(c.size * 0.5, c.size * 0.5);
        ctx.lineTo(-c.size * 0.5, c.size * 0.5);
        ctx.closePath();
        const cheeseGrd = ctx.createLinearGradient(0, -c.size * 0.5, 0, c.size * 0.5);
        cheeseGrd.addColorStop(0, '#FFE448');
        cheeseGrd.addColorStop(1, '#DAA520');
        ctx.fillStyle = cheeseGrd;
        ctx.fill();
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Holes
        [[-7, 6, 3.5], [8, -1, 2.5], [0, 12, 2]].forEach(([hx, hy, hr]) => {
            ctx.beginPath();
            ctx.arc(hx, hy, hr, 0, Math.PI * 2);
            ctx.fillStyle = '#C49A00';
            ctx.fill();
        });

        // Shine
        ctx.beginPath();
        ctx.moveTo(-4, -c.size * 0.3);
        ctx.lineTo(4, -c.size * 0.2);
        ctx.lineTo(2, -c.size * 0.05);
        ctx.lineTo(-6, -c.size * 0.15);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fill();

        // Glow when hoverable
        if (!c.tossed) {
            ctx.beginPath();
            ctx.arc(0, 0, c.size * 0.7, 0, Math.PI * 2);
            const glw = ctx.createRadialGradient(0,0,0,0,0,c.size*0.7);
            glw.addColorStop(0, 'rgba(255,215,0,0.15)');
            glw.addColorStop(1, 'transparent');
            ctx.fillStyle = glw;
            ctx.fill();
        }

        ctx.restore();
        if (c.tossed) c.rot += c.rotSpeed;
    }

    function addSparkles(x, y, count = 16) {
        const colors = ['#FFD700','#4A9EFF','#FF80C0','#80FFD4','#FFF'];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            sparkles.push({
                x, y,
                vx: Math.cos(angle) * (Math.random() * 5 + 2),
                vy: Math.sin(angle) * (Math.random() * 5 + 2) - 2,
                life: 1, size: Math.random() * 5 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                type: Math.random() > 0.5 ? 'star' : 'circle',
            });
        }
    }

    function addFloatingText(x, y, text, color = '#FFD700') {
        floatingTexts.push({ x, y, text, color, life: 1, vy: -2 });
    }

    // Hover detection for cheese
    let hoverCheese = null;
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);
        hoverCheese = null;
        cheeses.forEach(c => {
            if (c.tossed || c.eaten) return;
            const dx = mx - c.x, dy = my - c.y;
            if (Math.sqrt(dx*dx+dy*dy) < c.size + 15) {
                hoverCheese = c;
                canvas.style.cursor = 'pointer';
            }
        });
        if (!hoverCheese) canvas.style.cursor = '';
    });

    canvas.addEventListener('click', (e) => {
        AudioManager.resume();
        if (!gameActive) return;
        const rect = canvas.getBoundingClientRect();
        const cx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const cy = (e.clientY - rect.top) * (canvas.height / rect.height);

        cheeses.forEach(c => {
            if (c.tossed || c.eaten) return;
            const dx = cx - c.x, dy = cy - c.y;
            if (Math.sqrt(dx*dx+dy*dy) < c.size + 15) {
                const angle = Math.atan2(mickey.y - c.y, mickey.x - c.x);
                const spd = getCheeseSpeed();
                c.vx = Math.cos(angle) * spd;
                c.vy = Math.sin(angle) * spd;
                c.tossed = true;
                AudioManager.click();
            }
        });
    });

    restartBtn.addEventListener('click', () => {
        AudioManager.click();
        resetGame();
    });

    function drawSparkle(s) {
        ctx.save();
        ctx.globalAlpha = s.life;
        if (s.type === 'star') {
            ctx.translate(s.x, s.y);
            ctx.fillStyle = s.color;
            const r = s.size * s.life;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
                const ia = a + (2 * Math.PI / 5);
                if (i === 0) ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r);
                else ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
                ctx.lineTo(Math.cos(ia)*r*0.4, Math.sin(ia)*r*0.4);
            }
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.fill();
        }
        ctx.restore();
    }

    function gameLoop() {
        requestAnimationFrame(gameLoop);
        ctx.clearRect(0, 0, W, H);

        drawBackground();
        drawMickey();

        if (mickey.mouthTimer > 0) { mickey.mouthOpen = true; mickey.mouthTimer--; }
        else mickey.mouthOpen = false;

        // Update & draw cheeses
        cheeses.forEach((c, i) => {
            if (c.eaten) return;
            if (c.tossed) {
                c.x += c.vx; c.y += c.vy;
                const dx = c.x - mickey.x, dy = c.y - mickey.y;
                if (Math.sqrt(dx*dx+dy*dy) < 45) {
                    c.eaten = true;
                    score++;
                    if (scoreEl) scoreEl.textContent = score;
                    mickey.mouthTimer = 20;
                    mickey.wobble = 0.01;
                    addSparkles(mickey.x, mickey.y);
                    addFloatingText(mickey.x + (Math.random()-0.5)*60, mickey.y - 50, '+1 ✨', '#FFD700');
                    AudioManager.chomp();

                    // Level up every 3 cheeses
                    if (score % 3 === 0 && score < TARGET) {
                        level = Math.min(5, level + 1);
                        updateLevelDisplay();
                        addFloatingText(W/2, H/2, `Level ${level}!`, '#4A9EFF');
                    }

                    if (score >= TARGET) {
                        gameActive = false;
                        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
                        hintEl.textContent = `🎉 You fed Mickey ${TARGET} cheeses in ${elapsed}s! Press Restart!`;
                        AudioManager.gameWin();
                    } else {
                        setTimeout(spawnCheese, 400);
                    }
                }
                // Off screen = lost a life
                if (c.y < -80 || c.x < -80 || c.x > W + 80) {
                    c.eaten = true;
                    lives = Math.max(0, lives - 1);
                    updateLivesDisplay();
                    addFloatingText(c.x, Math.max(50, c.y), 'Miss! 💨', '#FF6060');
                    if (lives <= 0) {
                        gameActive = false;
                        hintEl.textContent = `💔 Oh no! No more lives. Press Restart!`;
                    } else {
                        hintEl.textContent = `💔 Missed! ${lives} ${lives===1?'life':'lives'} left!`;
                        setTimeout(spawnCheese, 400);
                    }
                }
            }
            if (!c.eaten) drawCheese(c);
        });

        // Sparkles
        sparkles.forEach((s, i) => {
            s.x += s.vx * 0.95; s.y += s.vy; s.vy += 0.1; s.life -= 0.025;
            if (s.life <= 0) { sparkles.splice(i, 1); return; }
            drawSparkle(s);
        });

        // Floating texts
        floatingTexts.forEach((t, i) => {
            t.y += t.vy; t.life -= 0.018;
            if (t.life <= 0) { floatingTexts.splice(i, 1); return; }
            ctx.save();
            ctx.globalAlpha = t.life;
            ctx.font = 'bold 18px ' + getComputedStyle(document.body).getPropertyValue('--font-body');
            ctx.fillStyle = t.color;
            ctx.textAlign = 'center';
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        });

        // Timer
        if (gameActive && score > 0) {
            timerEl.textContent = ((performance.now() - startTime) / 1000).toFixed(1);
        }

        // Game over / win overlay
        if (!gameActive) {
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(0, 0, W, H);
            ctx.textAlign = 'center';
            if (score >= TARGET) {
                ctx.font = 'bold 40px serif';
                ctx.fillStyle = '#FFD700';
                ctx.fillText('🎉 Mickey is full! 🎉', W/2, H/2 - 20);
                ctx.font = '20px sans-serif';
                ctx.fillStyle = '#fff';
                ctx.fillText(`Score: ${score} in ${timerEl.textContent}s`, W/2, H/2 + 25);
            } else {
                ctx.font = 'bold 36px serif';
                ctx.fillStyle = '#FF6060';
                ctx.fillText('💔 Game Over', W/2, H/2 - 20);
                ctx.font = '20px sans-serif';
                ctx.fillStyle = '#fff';
                ctx.fillText(`You fed Mickey ${score} cheeses!`, W/2, H/2 + 25);
            }
        }
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

// ═══════════════════════════════════════════════════════
//   FEATURE 2 — GLOBAL AMBIENT STARS & LIGHTS (all sections)
// ═══════════════════════════════════════════════════════
(function initAmbientStars() {
    const canvas = document.getElementById('ambient-stars-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H;
    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = document.body.scrollHeight;
    }
    resize();
    // Rerun on window resize (not scrollHeight changes)
    window.addEventListener('resize', () => { resize(); drawStars(); });

    const STAR_COUNT = 200;
    const stars = [];
    const TWINKLE_STARS = 80;

    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * H,
            r: Math.random() * 1.5 + 0.3,
            alpha: Math.random() * 0.6 + 0.2,
            twinkle: i < TWINKLE_STARS,
            twinkleSpeed: 0.01 + Math.random() * 0.025,
            twinkleOffset: Math.random() * Math.PI * 2,
            color: Math.random() > 0.7 ? '#4A9EFF' : Math.random() > 0.5 ? '#FFD700' : '#FFFFFF',
        });
    }

    // Ambient light orbs scattered through the page
    const orbs = [];
    for (let i = 0; i < 12; i++) {
        orbs.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * H,
            r: 60 + Math.random() * 120,
            alpha: 0.02 + Math.random() * 0.04,
            color: Math.random() > 0.5
                ? `hsla(42, 100%, 55%,`
                : `hsla(210, 100%, 60%,`,
        });
    }

    function drawStars() {
        ctx.clearRect(0, 0, W, H);
        const t = performance.now() * 0.001;
        stars.forEach(s => {
            const alpha = s.twinkle
                ? s.alpha * (0.5 + 0.5 * Math.sin(t * s.twinkleSpeed * 60 + s.twinkleOffset))
                : s.alpha;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = s.color.replace('#', '#') + (alpha < 1 ? '' : '');
            ctx.globalAlpha = alpha;
            ctx.fill();
        });
        orbs.forEach(o => {
            const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
            grad.addColorStop(0, o.color + o.alpha + ')');
            grad.addColorStop(1, o.color + '0)');
            ctx.beginPath();
            ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            ctx.globalAlpha = 1;
            ctx.fillStyle = grad;
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    // Animate twinkling
    function animate() {
        requestAnimationFrame(animate);
        drawStars();
    }
    // Update canvas height periodically as page may grow/shrink
    setInterval(() => {
        const newH = document.body.scrollHeight;
        if (newH !== H) { H = canvas.height = newH; drawStars(); }
    }, 2000);

    animate();
})();


// ═══════════════════════════════════════════════════════
//   GAME IMPROVEMENTS — progress ring & win overlay
// ═══════════════════════════════════════════════════════
(function patchGame() {
    // Wait for game to initialize, then hook into score updates
    const progressCircle = document.getElementById('game-progress-circle');
    const progressText = document.getElementById('game-progress-text');
    const winOverlay = document.getElementById('game-win-overlay');
    const winTimeVal = document.getElementById('game-win-time-val');
    const winRestartBtn = document.getElementById('game-win-restart');
    const mainRestartBtn = document.getElementById('game-restart');

    function updateProgress(score) {
        if (!progressCircle || !progressText) return;
        const max = 10;
        const circumference = 157; // 2*pi*25
        const offset = circumference - (score / max) * circumference;
        progressCircle.style.strokeDashoffset = offset;
        progressText.textContent = `${score}/10`;
        // Color: gold → green as you progress
        const hue = 42 + (score / max) * 80;
        progressCircle.style.stroke = `hsl(${hue}, 100%, 55%)`;
    }

    function showWin(elapsed) {
        if (!winOverlay) return;
        if (winTimeVal) winTimeVal.textContent = elapsed;
        winOverlay.style.display = 'flex';
    }

    function hideWin() {
        if (winOverlay) winOverlay.style.display = 'none';
        updateProgress(0);
    }

    // Patch score element observer
    const scoreEl = document.getElementById('game-score');
    if (scoreEl) {
        const mo = new MutationObserver(() => {
            const score = parseInt(scoreEl.textContent) || 0;
            updateProgress(score);
        });
        mo.observe(scoreEl, { childList: true, characterData: true, subtree: true });
    }

    // Win overlay restart
    if (winRestartBtn) {
        winRestartBtn.addEventListener('click', () => {
            hideWin();
            if (mainRestartBtn) mainRestartBtn.click();
        });
    }

    // Patch game hint to detect win
    const hintEl = document.getElementById('game-hint');
    if (hintEl) {
        const hintObserver = new MutationObserver(() => {
            if (hintEl.textContent.includes('Amazing!') || hintEl.textContent.includes('fed Mickey 10')) {
                const match = hintEl.textContent.match(/(\d+\.\d+)s/);
                const elapsed = match ? match[1] : '?';
                setTimeout(() => showWin(elapsed), 300);
            }
        });
        hintObserver.observe(hintEl, { childList: true, characterData: true, subtree: true });
    }

    // Init
    hideWin();
})();


// ═══════════════════════════════════════════════════════
//   FEATURE 4 — FOUNDERS SCROLL PROGRESS
// ═══════════════════════════════════════════════════════
(function initFoundersScroll() {
    const section  = document.getElementById('founders');
    const progress = document.getElementById('founders-progress');
    if (!section || !progress) return;

    function onScroll() {
        const rect = section.getBoundingClientRect();
        const winH = window.innerHeight;
        if (rect.top < winH && rect.bottom > 0) {
            section.classList.add('in-view');
            const scrolled = Math.max(0, Math.min(1,
                (-rect.top) / (rect.height - winH)
            ));
            progress.style.height = (scrolled * 100) + '%';
        } else {
            section.classList.remove('in-view');
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Cards slide in with IntersectionObserver
    const cards = section.querySelectorAll('.founder-card');
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.transition =
                    'transform 0.7s cubic-bezier(0.34,1.2,0.64,1), opacity 0.5s ease, box-shadow 0.4s';
                entry.target.style.transform = 'translateY(0) scale(1)';
                entry.target.style.opacity = '1';
            }
        });
    }, { threshold: 0.15 });

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px) scale(0.97)';
        cardObserver.observe(card);
    });
})();


// ═══════════════════════════════════════════════════════
//   GLOBAL AMBIENT SPARKLES + LIGHTS (whole site)
// ═══════════════════════════════════════════════════════
(function initGlobalSparkles() {
    const layer = document.getElementById('global-sparkle-layer');
    if (!layer) return;

    // Create twinkling stars scattered across the whole page
    const STAR_COUNT = 120;
    for (let i = 0; i < STAR_COUNT; i++) {
        const star = document.createElement('div');
        star.className = 'amb-star';
        const size = Math.random() * 3 + 1;
        const peak = (Math.random() * 0.5 + 0.2).toFixed(2);
        const dur = (Math.random() * 4 + 2).toFixed(2) + 's';
        const delay = (Math.random() * 8).toFixed(2) + 's';
        star.style.cssText = `
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 300}%;
            width: ${size}px;
            height: ${size}px;
            --dur: ${dur};
            --delay: ${delay};
            --peak: ${peak};
            box-shadow: 0 0 ${size * 3}px ${size}px hsla(${Math.random() > 0.5 ? '42,100%,80%' : '210,100%,80%'}, 0.6);
        `;
        layer.appendChild(star);
    }

    // Create a few large ambient light blobs
    const LIGHT_DEFS = [
        { color: 'hsla(42,100%,55%,1)', w: 600, h: 400, left: '10%', top: '5%', dx: '30px', dy: '20px', ldur: '8s', ldelay: '0s' },
        { color: 'hsla(210,100%,60%,1)', w: 500, h: 350, left: '60%', top: '15%', dx: '-20px', dy: '30px', ldur: '10s', ldelay: '2s' },
        { color: 'hsla(280,80%,60%,1)', w: 400, h: 300, left: '30%', top: '50%', dx: '25px', dy: '-15px', ldur: '12s', ldelay: '1s' },
        { color: 'hsla(42,100%,55%,1)', w: 450, h: 350, left: '70%', top: '70%', dx: '-30px', dy: '20px', ldur: '9s', ldelay: '3s' },
        { color: 'hsla(160,80%,55%,1)', w: 350, h: 250, left: '5%', top: '80%', dx: '20px', dy: '-25px', ldur: '11s', ldelay: '4s' },
    ];

    LIGHT_DEFS.forEach(d => {
        const light = document.createElement('div');
        light.className = 'amb-light';
        light.style.cssText = `
            width: ${d.w}px;
            height: ${d.h}px;
            left: ${d.left};
            top: ${d.top};
            background: radial-gradient(ellipse, ${d.color} 0%, transparent 70%);
            --ldur: ${d.ldur};
            --ldelay: ${d.ldelay};
            --dx: ${d.dx};
            --dy: ${d.dy};
        `;
        layer.appendChild(light);
    });

    // Dynamic sparkle bursts on scroll (create new stars in visible viewport area)
    let lastSparkleScroll = 0;
    window.addEventListener('scroll', () => {
        const sy = window.scrollY;
        if (Math.abs(sy - lastSparkleScroll) > 300) {
            lastSparkleScroll = sy;
            // Randomly reposition a few stars near current view
            const stars = layer.querySelectorAll('.amb-star');
            const pick = Math.floor(Math.random() * stars.length);
            if (stars[pick]) {
                const viewportTop = (sy / document.body.scrollHeight * 300);
                stars[pick].style.top = (viewportTop + Math.random() * 20) + '%';
            }
        }
    }, { passive: true });
})();


// ═══════════════════════════════════════════════════════
//   FOUNDERS SCROLL-STACK CARDS
// ═══════════════════════════════════════════════════════
(function initFoundersScroll() {
    const section  = document.getElementById('founders');
    const progress = document.getElementById('founders-progress');
    if (!section || !progress) return;

    function onScroll() {
        const rect = section.getBoundingClientRect();
        const winH = window.innerHeight;

        if (rect.top < winH && rect.bottom > 0) {
            section.classList.add('in-view');
            const scrolled = Math.max(0, Math.min(1,
                (-rect.top) / (rect.height - winH)
            ));
            progress.style.height = (scrolled * 100) + '%';
        } else {
            section.classList.remove('in-view');
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const cards = section.querySelectorAll('.founder-card');
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.transition =
                    'transform 0.7s cubic-bezier(0.34,1.2,0.64,1), opacity 0.5s ease, box-shadow 0.4s';
                entry.target.style.transform = 'translateY(0) scale(1)';
                entry.target.style.opacity   = '1';
            }
        });
    }, { threshold: 0.15 });

    cards.forEach(card => {
        card.style.opacity   = '0';
        card.style.transform = 'translateY(40px) scale(0.97)';
        cardObserver.observe(card);
    });
})();


// ═══════════════════════════════════════════════════════
//   GAME TAB SWITCHER
// ═══════════════════════════════════════════════════════
(function initGameTabs() {
    const tabs = document.querySelectorAll('.game-tab');
    const panels = document.querySelectorAll('.game-panel');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById(tab.dataset.tab);
            if (target) target.classList.add('active');
            AudioManager.click();
        });
    });
})();


// ═══════════════════════════════════════════════════════
//   TINKERBELL PIXIE DUST GAME
// ═══════════════════════════════════════════════════════
(function initTinkGame() {
    const canvas = document.getElementById('tink-game-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const scoreEl  = document.getElementById('tink-score');
    const timerEl  = document.getElementById('tink-timer');
    const streakEl = document.getElementById('tink-streak');
    const bestEl   = document.getElementById('tink-best');
    const hintEl   = document.getElementById('tink-hint');
    const restartBtn = document.getElementById('tink-restart');

    let W, H;
    function resize() {
        const rect = canvas.getBoundingClientRect();
        W = canvas.width = rect.width || 700;
        H = canvas.height = 480;
    }
    resize();
    window.addEventListener('resize', resize);

    const GAME_DURATION = 30; // seconds
    const SPAWN_INTERVAL_BASE = 900; // ms
    const ORB_COLORS = [
        { h: 280, name: 'purple' },
        { h: 55,  name: 'gold' },
        { h: 180, name: 'cyan' },
        { h: 320, name: 'pink' },
        { h: 130, name: 'green' },
    ];

    let score = 0, streak = 0, bestScore = 0;
    let timeLeft = GAME_DURATION;
    let gameRunning = false, gameStarted = false;
    let orbs = [], particles = [], floats = [], bgStars = [];
    let tink = { x: 0, y: 0, tx: 0, ty: 0, frame: 0, dir: 1, trail: [] };
    let spawnTimer = null, countdownTimer = null;
    let lastSpawnTime = 0;

    // Background stars
    for (let i = 0; i < 80; i++) {
        bgStars.push({
            x: Math.random(), y: Math.random(),
            r: Math.random() * 1.5 + 0.4,
            twinkle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.8 + 0.3,
        });
    }

    function resetGame() {
        score = 0; streak = 0; timeLeft = GAME_DURATION;
        gameRunning = true; gameStarted = true;
        orbs = []; particles = []; floats = [];
        tink.x = 80; tink.y = H / 2;
        tink.tx = 80; tink.ty = H / 2; tink.trail = [];
        if (scoreEl)  scoreEl.textContent = '0';
        if (streakEl) streakEl.textContent = '0';
        if (timerEl)  timerEl.textContent = GAME_DURATION;
        hintEl.textContent = '✨ Click the glowing pixie dust orbs before they vanish!';
        clearInterval(spawnTimer);
        clearInterval(countdownTimer);

        spawnTimer = setInterval(() => {
            if (!gameRunning) { clearInterval(spawnTimer); return; }
            spawnOrb();
            // speed up over time
            if (timeLeft < 15) spawnOrb();
        }, 800);

        countdownTimer = setInterval(() => {
            if (!gameRunning) { clearInterval(countdownTimer); return; }
            timeLeft--;
            if (timerEl) timerEl.textContent = timeLeft;
            if (timeLeft <= 0) endGame();
        }, 1000);

        // Move Tinkerbell to a new random position periodically
        moveTink();
    }

    function moveTink() {
        if (!gameRunning) return;
        tink.tx = 80 + Math.random() * (W - 160);
        tink.ty = 60 + Math.random() * (H - 120);
        setTimeout(moveTink, 1500 + Math.random() * 1000);
    }

    function spawnOrb() {
        if (!gameRunning) return;
        const color = ORB_COLORS[Math.floor(Math.random() * ORB_COLORS.length)];
        // Spawn near Tinkerbell with slight offset
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 80;
        const x = Math.max(40, Math.min(W - 40, tink.x + Math.cos(angle) * dist));
        const y = Math.max(40, Math.min(H - 40, tink.y + Math.sin(angle) * dist));
        const lifespan = 1800 + Math.random() * 1200;
        const isBig = Math.random() < 0.15; // 15% chance rainbow big orb
        orbs.push({
            x, y, r: isBig ? 22 : 14 + Math.random() * 6,
            color, born: performance.now(), lifespan,
            alpha: 0, pulse: Math.random() * Math.PI * 2,
            big: isBig, points: isBig ? 3 : 1,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4 - 0.3,
        });
    }

    function endGame() {
        gameRunning = false;
        clearInterval(spawnTimer);
        clearInterval(countdownTimer);
        if (score > bestScore) {
            bestScore = score;
            if (bestEl) bestEl.textContent = bestScore;
        }
        hintEl.textContent = score >= 20
            ? `🌟 Amazing! You caught ${score} dust orbs! Tinkerbell is impressed!`
            : `✨ You caught ${score} dust orbs! Play again to beat your score!`;
        AudioManager.gameWin();
    }

    function addParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random();
            particles.push({
                x, y,
                vx: Math.cos(angle) * (Math.random() * 4 + 1.5),
                vy: Math.sin(angle) * (Math.random() * 4 + 1.5) - 1,
                r: Math.random() * 4 + 1.5,
                life: 1, color,
                type: Math.random() > 0.6 ? 'star' : 'circle',
            });
        }
    }

    function addFloat(x, y, pts) {
        floats.push({ x, y, text: pts === 1 ? '+1 ✨' : `+${pts} 🌟`, life: 1, vy: -1.8, color: pts > 1 ? '#FFD700' : '#e9d5ff' });
    }

    // Draw Tinkerbell (simplified fairy shape)
    function drawTinkerbell() {
        const t = performance.now() * 0.004;
        tink.x += (tink.tx - tink.x) * 0.04;
        tink.y += (tink.ty - tink.y) * 0.04;
        tink.dir = tink.tx > tink.x ? 1 : -1;

        // Trail
        tink.trail.unshift({ x: tink.x, y: tink.y });
        if (tink.trail.length > 18) tink.trail.pop();
        tink.trail.forEach((pt, i) => {
            const alpha = (1 - i / tink.trail.length) * 0.35;
            const size = (1 - i / tink.trail.length) * 5;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(280,100%,80%,${alpha})`;
            ctx.fill();
        });

        const x = tink.x, y = tink.y;
        const bob = Math.sin(t * 2) * 4;

        ctx.save();
        ctx.translate(x, y + bob);
        ctx.scale(tink.dir, 1);

        // Glow aura
        const aura = ctx.createRadialGradient(0, 0, 5, 0, 0, 36);
        aura.addColorStop(0, 'hsla(280,100%,80%,0.25)');
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fill();

        // Wings (two gossamer ovals) — flapping
        const wingFlap = Math.sin(t * 12) * 0.3;
        ctx.save();
        ctx.rotate(-0.3 + wingFlap);
        ctx.beginPath();
        ctx.ellipse(-8, -4, 18, 9, -0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(280,80%,90%,0.45)';
        ctx.fill();
        ctx.strokeStyle = 'hsla(280,80%,85%,0.6)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.rotate(0.3 - wingFlap);
        ctx.beginPath();
        ctx.ellipse(8, -4, 18, 9, 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(280,80%,90%,0.45)';
        ctx.fill();
        ctx.strokeStyle = 'hsla(280,80%,85%,0.6)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();

        // Body
        ctx.beginPath();
        ctx.ellipse(0, 2, 6, 11, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#4ade80';
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(0, -11, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#fde68a';
        ctx.fill();

        // Hair bun
        ctx.beginPath();
        ctx.arc(0, -18, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -15, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#1e3a5f';
        ctx.beginPath();
        ctx.arc(-2.5, -11.5, 1.8, 0, Math.PI * 2);
        ctx.arc(2.5, -11.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
        // Eye shines
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-1.8, -12.2, 0.7, 0, Math.PI * 2);
        ctx.arc(3.2, -12.2, 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Wand sparkle
        ctx.beginPath();
        ctx.moveTo(5, -8);
        ctx.lineTo(16, -20);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Wand tip star
        ctx.fillStyle = '#FFD700';
        ctx.font = '10px serif';
        ctx.textAlign = 'center';
        ctx.fillText('✦', 18, -21);

        // Dress detail
        ctx.beginPath();
        ctx.ellipse(0, 8, 7, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#86efac';
        ctx.fill();

        ctx.restore();

        // Pixie dust spray from wand tip
        if (Math.random() < 0.4) {
            const wx = x + tink.dir * 16 - 5;
            const wy = y + bob - 20;
            particles.push({
                x: wx + (Math.random()-0.5)*8,
                y: wy + (Math.random()-0.5)*8,
                vx: (Math.random()-0.5)*1.5,
                vy: -Math.random()*1.5 - 0.5,
                r: Math.random()*2+0.5,
                life: 0.8 + Math.random()*0.4,
                color: `hsl(${50+Math.random()*60},100%,80%)`,
                type: 'circle',
            });
        }
    }

    function drawOrb(orb) {
        const now = performance.now();
        const age = (now - orb.born) / orb.lifespan;
        if (age >= 1) return;
        // fade in 15%, hold, fade out last 25%
        const fadeIn = Math.min(1, age / 0.15);
        const fadeOut = age > 0.75 ? 1 - (age - 0.75) / 0.25 : 1;
        orb.alpha = fadeIn * fadeOut;

        const pulse = Math.sin(performance.now() * 0.005 + orb.pulse) * 0.15 + 1;
        const r = orb.r * pulse;
        const { h } = orb.color;

        // Danger flicker when about to expire
        const flicker = age > 0.75 ? (Math.sin(performance.now() * 0.02) * 0.5 + 0.5) : 1;

        ctx.save();
        ctx.globalAlpha = orb.alpha * flicker;

        // Outer glow
        const glow = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r * 2.5);
        glow.addColorStop(0, `hsla(${h},100%,70%,0.35)`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Core orb gradient
        const core = ctx.createRadialGradient(orb.x - r*0.3, orb.y - r*0.3, r*0.1, orb.x, orb.y, r);
        core.addColorStop(0, `hsl(${h},100%,95%)`);
        core.addColorStop(0.4, `hsl(${h},100%,70%)`);
        core.addColorStop(1, `hsl(${h},80%,40%)`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Rainbow shine for big orbs
        if (orb.big) {
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.font = `${r * 0.8}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText('★', orb.x, orb.y);
        }

        // Shine
        ctx.beginPath();
        ctx.arc(orb.x - r*0.3, orb.y - r*0.3, r*0.28, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fill();

        // Timer ring
        const ringProgress = 1 - age;
        ctx.strokeStyle = `hsla(${h},100%,80%,${orb.alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, r + 5, -Math.PI/2, -Math.PI/2 + ringProgress * Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    function drawBackground() {
        const t = performance.now() * 0.001;
        // Deep starfield
        bgStars.forEach(s => {
            const tw = Math.sin(s.twinkle + t * s.speed) * 0.4 + 0.6;
            ctx.beginPath();
            ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${s.r / 3 * tw * 0.7})`;
            ctx.fill();
        });

        // Floating magic dust motes
        const motes = 6;
        for (let i = 0; i < motes; i++) {
            const angle = t * 0.3 + (i / motes) * Math.PI * 2;
            const mx = W/2 + Math.cos(angle * 1.3) * W*0.35;
            const my = H/2 + Math.sin(angle) * H*0.3;
            const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 60);
            mg.addColorStop(0, 'hsla(280,80%,70%,0.03)');
            mg.addColorStop(1, 'transparent');
            ctx.fillStyle = mg;
            ctx.beginPath();
            ctx.arc(mx, my, 60, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawUI() {
        // Start overlay if not started
        if (!gameStarted) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, W, H);
            ctx.textAlign = 'center';
            ctx.font = 'bold 32px serif';
            ctx.fillStyle = '#e9d5ff';
            ctx.fillText('🧚 Catch Tinkerbell\'s Pixie Dust!', W/2, H/2 - 30);
            ctx.font = '18px sans-serif';
            ctx.fillStyle = '#c4b5fd';
            ctx.fillText('Click any glowing orb or press Play to start', W/2, H/2 + 15);
        }

        // Game over overlay
        if (!gameRunning && gameStarted) {
            ctx.fillStyle = 'rgba(15,5,30,0.75)';
            ctx.fillRect(0, 0, W, H);
            ctx.textAlign = 'center';

            // Stars burst
            for (let i = 0; i < 8; i++) {
                ctx.font = '20px serif';
                ctx.fillStyle = '#FFD700';
                const a = (i/8)*Math.PI*2;
                ctx.fillText('✦', W/2 + Math.cos(a)*120, H/2 - 60 + Math.sin(a)*40);
            }

            ctx.font = 'bold 38px serif';
            const rank = score >= 30 ? '🌟 Fairy Queen!' : score >= 20 ? '✨ Pixie Master!' : score >= 10 ? '🧚 Fairy Friend' : '🌸 Keep Trying!';
            ctx.fillStyle = '#e9d5ff';
            ctx.fillText(rank, W/2, H/2 - 30);
            ctx.font = 'bold 22px serif';
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`${score} Dust Orbs Caught!`, W/2, H/2 + 15);
            ctx.font = '16px sans-serif';
            ctx.fillStyle = '#a78bfa';
            ctx.fillText('Press Play Again to try once more', W/2, H/2 + 55);
        }
    }

    // Click handler
    canvas.addEventListener('click', (e) => {
        AudioManager.resume();
        if (!gameStarted && !gameRunning) { resetGame(); return; }
        if (!gameRunning) return;

        const rect = canvas.getBoundingClientRect();
        const cx = (e.clientX - rect.left) * (W / rect.width);
        const cy = (e.clientY - rect.top) * (H / rect.height);

        let hit = false;
        orbs.forEach((orb, i) => {
            if (hit) return;
            const dx = cx - orb.x, dy = cy - orb.y;
            if (Math.sqrt(dx*dx + dy*dy) < orb.r + 12) {
                hit = true;
                orbs.splice(i, 1);
                score += orb.points;
                streak++;
                if (scoreEl) scoreEl.textContent = score;
                if (streakEl) streakEl.textContent = streak;
                addParticles(orb.x, orb.y, `hsl(${orb.color.h},100%,70%)`, orb.big ? 20 : 12);
                addFloat(orb.x, orb.y - 20, orb.points * (streak >= 3 ? 2 : 1));
                if (streak >= 3) {
                    // Bonus sparkle burst!
                    for (let s = 0; s < 6; s++) addParticles(orb.x + (Math.random()-0.5)*40, orb.y + (Math.random()-0.5)*40, '#FFD700', 4);
                }
                // Tone based on streak
                const freqs = [523, 659, 784, 880, 1047];
                const fi = Math.min(freqs.length - 1, streak - 1);
                AudioManager.click();
            }
        });

        if (!hit && gameRunning) {
            // Miss — reset streak
            streak = 0;
            if (streakEl) streakEl.textContent = '0';
        }
    });

    restartBtn.addEventListener('click', () => {
        AudioManager.click();
        resetGame();
    });

    // Expire old orbs (they missed)
    function expireOrbs() {
        const now = performance.now();
        orbs = orbs.filter(orb => {
            const age = (now - orb.born) / orb.lifespan;
            if (age >= 1) {
                streak = 0;
                if (streakEl) streakEl.textContent = '0';
                addParticles(orb.x, orb.y, '#888', 5);
                return false;
            }
            return true;
        });
    }

    function gameLoop() {
        requestAnimationFrame(gameLoop);
        ctx.clearRect(0, 0, W, H);

        drawBackground();

        // Move orbs gently
        orbs.forEach(orb => { orb.x += orb.vx; orb.y += orb.vy; });

        if (gameRunning || gameStarted) {
            drawTinkerbell();
            expireOrbs();
            orbs.forEach(drawOrb);
        }

        // Particles
        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.life -= 0.022;
            if (p.life <= 0) { particles.splice(i, 1); return; }
            ctx.save();
            ctx.globalAlpha = p.life;
            if (p.type === 'star') {
                ctx.fillStyle = p.color;
                ctx.translate(p.x, p.y);
                const r = p.r * p.life;
                ctx.beginPath();
                for (let s = 0; s < 5; s++) {
                    const a = (s * 4 * Math.PI / 5) - Math.PI/2;
                    const ia = a + (2 * Math.PI / 5);
                    if (s===0) ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r);
                    else ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
                    ctx.lineTo(Math.cos(ia)*r*0.4, Math.sin(ia)*r*0.4);
                }
                ctx.closePath(); ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            }
            ctx.restore();
        });

        // Floating texts
        floats.forEach((f, i) => {
            f.y += f.vy; f.life -= 0.018;
            if (f.life <= 0) { floats.splice(i, 1); return; }
            ctx.save();
            ctx.globalAlpha = f.life;
            ctx.font = 'bold 16px sans-serif';
            ctx.fillStyle = f.color;
            ctx.textAlign = 'center';
            ctx.fillText(f.text, f.x, f.y);
            ctx.restore();
        });

        drawUI();
    }

    gameLoop();
})();


// ═══════════════════════════════════════════════════════
//   WHAT'S COMING NEXT — CHARACTER NAVIGATOR
// ═══════════════════════════════════════════════════════
(function initWhatsNext() {
    const widget   = document.getElementById('whats-next');
    const bubble   = document.getElementById('wn-char-bubble');
    const card     = document.getElementById('wn-card');
    const charEmoji= document.getElementById('wn-char-emoji');
    const tinyChar = document.getElementById('wn-tiny-char');
    const charName = document.getElementById('wn-char-name');
    const iconEl   = document.getElementById('wn-icon');
    const titleEl  = document.getElementById('wn-title');
    const descEl   = document.getElementById('wn-desc');
    const progressEl = document.getElementById('wn-progress');
    const gotoBtn  = document.getElementById('wn-goto-btn');

    if (!widget || !bubble) return;

    // ── Section map — each entry = one page section ─────────────────────
    // character: who guides you INTO this section (they appear in bubble)
    // next: what comes AFTER this section (what the card previews)
    const SECTIONS = [
        {
            id: 'hero',
            character: { emoji: '🏰', name: 'Cinderella' },
            next: {
                id: 'characters',
                icon: '🐭',
                title: 'Beloved Characters',
                desc: 'Meet Mickey, Simba & Moana — the icons who made Disney magic eternal.',
            },
        },
        {
            id: 'characters',
            character: { emoji: '🐭', name: 'Mickey' },
            next: {
                id: 'stats',
                icon: '✨',
                title: 'A Legacy of Magic',
                desc: '100 years. 500+ films. 200M+ fans. The numbers behind the dream.',
            },
        },
        {
            id: 'stats',
            character: { emoji: '🦁', name: 'Simba' },
            next: {
                id: 'char-picker',
                icon: '🎭',
                title: 'Who\'s Your Favourite?',
                desc: 'Pick your Disney companion — they\'ll follow your cursor everywhere!',
            },
        },
        {
            id: 'char-picker',
            character: { emoji: '❄️', name: 'Elsa' },
            next: {
                id: 'comic-section',
                icon: '📖',
                title: 'Story Time!',
                desc: 'Swipe through a magical mini comic — Mickey\'s biggest adventure yet.',
            },
        },
        {
            id: 'comic-section',
            character: { emoji: '🌊', name: 'Moana' },
            next: {
                id: 'game',
                icon: '🎮',
                title: 'Play the Magic',
                desc: 'Feed Mickey cheese or catch Tinkerbell\'s pixie dust — two games await!',
            },
        },
        {
            id: 'game',
            character: { emoji: '🧚', name: 'Tinkerbell' },
            next: {
                id: 'worlds',
                icon: '🌍',
                title: 'Magical Worlds Await',
                desc: 'Enchanted forests, underwater kingdoms, and galactic adventures.',
            },
        },
        {
            id: 'worlds',
            character: { emoji: '⭐', name: 'Peter Pan' },
            next: {
                id: 'story-adventure',
                icon: '📖',
                title: 'Your Disney Adventure',
                desc: 'Step into a Disney tale — pick your character and shape the ending!',
            },
        },
        {
            id: 'story-adventure',
            character: { emoji: '🐭', name: 'Mickey' },
            next: {
                id: 'founders',
                icon: '🎩',
                title: 'People Who Built the Magic',
                desc: 'Meet Walt, Roy, Ub Iwerks & the visionaries who made it all possible.',
            },
        },
        {
            id: 'founders',
            character: { emoji: '🎩', name: 'Walt' },
            next: null, // last section — hide widget
        },
    ];

    // ── Build progress pills ─────────────────────────────────────────────
    const NAV_COUNT = SECTIONS.length - 1; // exclude last (no next)
    progressEl.innerHTML = SECTIONS.slice(0, NAV_COUNT).map(() =>
        `<div class="wn-pill"></div>`
    ).join('');
    const pills = progressEl.querySelectorAll('.wn-pill');

    // ── State ────────────────────────────────────────────────────────────
    let cardOpen = false;
    let currentIdx = 0;
    let nextTargetId = null;
    let autoHideTimer = null;

    // ── Toggle card ──────────────────────────────────────────────────────
    function openCard() {
        card.classList.add('show');
        cardOpen = true;
        bubble.setAttribute('aria-expanded', 'true');
        clearTimeout(autoHideTimer);
        // Auto-hide after 8s
        autoHideTimer = setTimeout(closeCard, 8000);
    }
    function closeCard() {
        card.classList.remove('show');
        cardOpen = false;
        bubble.setAttribute('aria-expanded', 'false');
    }

    bubble.addEventListener('click', () => {
        AudioManager.click();
        if (cardOpen) closeCard(); else openCard();
    });
    bubble.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bubble.click(); }
    });

    // Click outside to close
    document.addEventListener('click', e => {
        if (cardOpen && !widget.contains(e.target)) closeCard();
    });

    // Goto button
    gotoBtn.addEventListener('click', () => {
        if (!nextTargetId) return;
        const target = document.getElementById(nextTargetId);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        AudioManager.click();
        closeCard();
    });

    // ── Update widget based on current section ────────────────────────────
    function updateWidget(idx) {
        const section = SECTIONS[idx];
        if (!section) return;

        // If last section (no "next"), hide the widget
        if (!section.next) {
            widget.classList.add('hidden-nav');
            return;
        }
        widget.classList.remove('hidden-nav');

        const { character, next } = section;
        nextTargetId = next.id;

        // Animate character emoji swap
        charEmoji.style.transform = 'scale(0) rotate(-15deg)';
        setTimeout(() => {
            charEmoji.textContent = character.emoji;
            tinyChar.textContent = character.emoji;
            charName.textContent = character.name;
            charEmoji.style.transform = '';
            charEmoji.style.transition = 'transform 0.4s cubic-bezier(0.34,1.4,0.64,1)';
        }, 150);

        // Update card content with a quick fade
        card.style.opacity = '0';
        setTimeout(() => {
            iconEl.textContent = next.icon;
            titleEl.textContent = next.title;
            descEl.textContent = next.desc;
            card.style.opacity = '';
        }, 200);

        // Update progress pills
        pills.forEach((pill, i) => {
            pill.classList.remove('done', 'current');
            if (i < idx) pill.classList.add('done');
            else if (i === idx) pill.classList.add('current');
        });

        // Auto-show card briefly on section change (only after first load)
        if (currentIdx !== idx) {
            closeCard();
            setTimeout(() => {
                openCard();
            }, 600);
        }
        currentIdx = idx;
    }

    // ── Scroll detection ─────────────────────────────────────────────────
    function detectSection() {
        let activeIdx = 0;
        SECTIONS.forEach((sec, i) => {
            const el = document.getElementById(sec.id);
            if (!el) return;
            const rect = el.getBoundingClientRect();
            // Section is "active" when its top has passed 60% of viewport
            if (rect.top <= window.innerHeight * 0.6) activeIdx = i;
        });
        return activeIdx;
    }

    // Throttled scroll handler
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            requestAnimationFrame(() => {
                const idx = detectSection();
                if (idx !== currentIdx) updateWidget(idx);
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });

    // Init
    updateWidget(0);
    // Show card after 3s on page load to introduce the feature
    setTimeout(() => { if (currentIdx === 0) openCard(); }, 3000);
})();

// ═══════════════════════════════════════════════════════════════
//   INTERACTIVE DISNEY STORYTELLING ENGINE
// ═══════════════════════════════════════════════════════════════
(function initStoryAdventure() {

    // ── Story data ────────────────────────────────────────────────────────
    // Each node: { chapter, emoji, theme, text, choices?, isEnding?, outcomeIcon?, outcomeTitle?, outcomeBody? }
    // theme strings match CSS class: theme-gold | theme-ice | theme-fire | theme-ocean | theme-magic | theme-dark | theme-nature

    const STORIES = {

        /* ════════════════ MICKEY ════════════════ */
        mickey: {
            guideIcon: '🐭', guideName: 'Mickey',
            nodes: {

                s1: {
                    chapter: 'Chapter 1 · The Wishing Well',
                    emoji: '🏰', theme: 'theme-gold',
                    text: "It's a sparkling morning in Toontown! Mickey discovers a glowing Wishing Well in the town square. A magical voice drifts up: \"One wish — but choose wisely, for magic always has a price.\" Mickey tilts his big ears and thinks hard.",
                    choices: [
                        { em: '✨', txt: 'Wish for the greatest adventure in all of Disney.',  next: 's2a' },
                        { em: '🎵', txt: 'Wish for a song that fills every heart with joy forever.',   next: 's2b' },
                        { em: '🗺️', txt: 'Wish to find the Lost Kingdom of Dreams.',           next: 's2c' },
                    ]
                },

                s2a: {
                    chapter: 'Chapter 2 · Into the Unknown',
                    emoji: '🌋', theme: 'theme-fire',
                    text: "WHOOSH! Mickey is whisked to a land of floating islands and roaring dragons. He spots a sleeping dragon blocking the only bridge to the Crystal Castle. Every second counts — how does he cross?",
                    choices: [
                        { em: '🎺', txt: 'Play a gentle lullaby on his magic flute to keep it sleeping.', next: 's3aa' },
                        { em: '🤝', txt: 'Wake the dragon and offer to be friends.',                    next: 's3ab' },
                    ]
                },

                s3aa: {
                    chapter: 'Chapter 3 · Glass Jars & Lost Dreams',
                    emoji: '🏰', theme: 'theme-magic',
                    text: "Mickey tiptoes past, flute trilling softly. The dragon snores smoke rings. Inside the Crystal Castle he finds not gold, but thousands of dreams locked in glass jars — wishes forgotten by sleeping kingdoms. He opens every single one.",
                    choices: [
                        { em: '🌈', txt: 'Watch the freed dreams erupt into living rainbows across every sky.',         next: 'end_rainbow' },
                        { em: '⭐', txt: 'Carry them home and return each dream to its rightful dreamer.',             next: 'end_dreamer' },
                    ]
                },

                s3ab: {
                    chapter: 'Chapter 3 · An Unlikely Friend',
                    emoji: '🐉', theme: 'theme-fire',
                    text: "The dragon blinks awake — and breaks into a huge toothy smile. His name is Ember, and he's been alone for 300 years. Together they soar over the Crystal Castle. Ember breathes golden fire that paints the entire sky with fireworks.",
                    choices: [
                        { em: '🏡', txt: 'Invite Ember to live in Toontown forever.',                               next: 'end_ember_home' },
                        { em: '🎆', txt: 'Promise to meet every year at the Festival of Stars.',                    next: 'end_festival' },
                    ]
                },

                s2b: {
                    chapter: 'Chapter 2 · The Song of Everywhere',
                    emoji: '🎵', theme: 'theme-magic',
                    text: "A melody rises from the well and spreads across every Disney world! Everyone dances — even villains tap their feet. The song draws all the worlds together until every beloved character stands around Mickey. But the magic is growing unstable. What should he do?",
                    choices: [
                        { em: '🎼', txt: 'Conduct an epic symphony with every Disney character playing together.',   next: 'end_symphony' },
                        { em: '💫', txt: 'Teach everyone the song so the magic lives in them forever.',             next: 'end_song_lives' },
                    ]
                },

                s2c: {
                    chapter: 'Chapter 2 · Between the Stars',
                    emoji: '🌌', theme: 'theme-dark',
                    text: "The Lost Kingdom of Dreams floats between the stars — a shimmering city of imagination and light. But its architects, the Dreamweavers, have all fallen under a forgetting spell and lie sleeping. The kingdom crumbles. Mickey has three minutes.",
                    choices: [
                        { em: '📣', txt: 'Shout the names of every Disney character at the top of his lungs.',     next: 'end_wake_shout' },
                        { em: '🌟', txt: 'Draw a giant Mickey silhouette in starlight to call them back.',          next: 'end_silhouette' },
                    ]
                },

                /* ── Mickey endings ── */
                end_rainbow: {
                    chapter: 'The End · Rainbow Keeper',
                    emoji: '🌈', theme: 'theme-magic',
                    isEnding: true,
                    outcomeIcon: '🌈',
                    outcomeTitle: 'The Rainbow Keeper',
                    outcomeBody: "The freed dreams became living rainbows that painted every sky at dusk. People remembered their forgotten wishes and felt them stir again. Mickey became known across every Disney world as the Rainbow Keeper — and every sunset in Toontown still blazes with a thousand colours he released that day."
                },
                end_dreamer: {
                    chapter: 'The End · Dream Carrier',
                    emoji: '✨', theme: 'theme-gold',
                    isEnding: true,
                    outcomeIcon: '⭐',
                    outcomeTitle: 'The Great Dream Return',
                    outcomeBody: "Mickey carried the jar satchel through every corner of every Disney world, returning each dream to its rightful owner. Sleeping kingdoms woke. Lost heroes found their courage. And Mickey? He got the greatest adventure of all — the adventure of pure, simple kindness."
                },
                end_ember_home: {
                    chapter: 'The End · The Dragon of Toontown',
                    emoji: '🏡', theme: 'theme-fire',
                    isEnding: true,
                    outcomeIcon: '🐉',
                    outcomeTitle: 'The Dragon of Toontown',
                    outcomeBody: "Ember moved to Toontown and became its most beloved citizen — giving free firework shows every Friday and keeping the whole town warm on cold winter nights. Mickey learned that the greatest wish isn't magic or treasure. It's finding a friend who was already waiting for you."
                },
                end_festival: {
                    chapter: 'The End · Festival of Stars',
                    emoji: '🌟', theme: 'theme-gold',
                    isEnding: true,
                    outcomeIcon: '🎆',
                    outcomeTitle: 'Festival of Stars',
                    outcomeBody: "Every autumn, on the night of the first star, Mickey and Ember meet above the Crystal Castle. Ember fills the sky with golden fire, and Mickey conducts it like a symphony. The Festival of Stars became the most magical night in all Disney history — and anyone who looks up can still see it."
                },
                end_symphony: {
                    chapter: 'The End · The Grand Symphony',
                    emoji: '🎼', theme: 'theme-magic',
                    isEnding: true,
                    outcomeIcon: '🎻',
                    outcomeTitle: 'Symphony of All Worlds',
                    outcomeBody: "Mickey raised his baton and every character played their part — Simba roared the bass notes, Elsa crystallised the high ones, Moana sang the ocean's melody. The music wove all the Disney worlds together permanently, so the magic of one world always flows to all the others."
                },
                end_song_lives: {
                    chapter: 'The End · The Song That Never Ends',
                    emoji: '💫', theme: 'theme-magic',
                    isEnding: true,
                    outcomeIcon: '🎵',
                    outcomeTitle: 'The Song That Never Ends',
                    outcomeBody: "Mickey taught the melody to every character, creature, and castle. The well's magic dissolved — it was no longer needed, because now the song lived in everyone's heart. Whenever the world grew cold or dark, someone somewhere would hum it, and the light always came back."
                },
                end_wake_shout: {
                    chapter: 'The End · The Loudest Voice',
                    emoji: '🌌', theme: 'theme-dark',
                    isEnding: true,
                    outcomeIcon: '📣',
                    outcomeTitle: 'The Wake-Up Call',
                    outcomeBody: "\"BELLE! SIMBA! ELSA! MOANA! RAPUNZEL!\" Mickey's voice cracked the forgetting spell like thunder. The Dreamweavers woke, grabbed their tools, and rebuilt the Kingdom in 58 seconds flat — a new record. They made Mickey an honorary Dreamweaver and named the main square after him."
                },
                end_silhouette: {
                    chapter: 'The End · Written in Stars',
                    emoji: '🌠', theme: 'theme-dark',
                    isEnding: true,
                    outcomeIcon: '🌠',
                    outcomeTitle: 'Written in Starlight',
                    outcomeBody: "Mickey gathered starlight in his gloves and traced those famous round ears across the sky. The Dreamweavers opened their eyes, saw the sign, and knew immediately — Mickey was here, and it was time to wake. His silhouette remains in the stars to this day, for anyone who knows where to look."
                },
            }
        },

        /* ════════════════ ELSA ════════════════ */
        elsa: {
            guideIcon: '❄️', guideName: 'Elsa',
            nodes: {
                s1: {
                    chapter: 'Chapter 1 · The Eternal Winter',
                    emoji: '❄️', theme: 'theme-ice',
                    text: "Arendelle wakes to a strange new winter. Ice formations have appeared overnight, spelling a message in the language of the Ancient North: \"A spirit is calling you, Elsa. One winter is not enough to save the world.\" What does she do first?",
                    choices: [
                        { em: '🌊', txt: 'Follow the voice north alone into the Enchanted Forest.',        next: 's2a' },
                        { em: '🏔️', txt: 'Climb to the Northuldra summit to see farther.',                 next: 's2b' },
                        { em: '💙', txt: 'Call Anna, Kristoff and Sven — she won\'t face this alone.',     next: 's2c' },
                    ]
                },
                s2a: {
                    chapter: 'Chapter 2 · The Pool Between Worlds',
                    emoji: '🌊', theme: 'theme-ice',
                    text: "Deep in the Enchanted Forest, Elsa finds a pool that shows other worlds — lands of permanent summer where magic never grows. A spirit rises: The Thaw. It offers her a choice: give up her power and bring eternal warmth, or keep winter and defend the balance.",
                    choices: [
                        { em: '🌸', txt: 'Accept — give up her power and let warmth spread everywhere.',   next: 'end_warmth' },
                        { em: '❄️', txt: 'Refuse — the world needs both cold and warmth to be whole.',    next: 's3a' },
                    ]
                },
                s3a: {
                    chapter: 'Chapter 3 · The Balance',
                    emoji: '🌈', theme: 'theme-ice',
                    text: "\"The world is not whole without winter,\" Elsa says. She reaches into the pool and — instead of taking or giving — weaves summer and winter together into one living tapestry. The Thaw stares, then slowly smiles. \"You are the first in a thousand years to understand.\" What does she do with this gift?",
                    choices: [
                        { em: '🌍', txt: 'Travel every land that has forgotten its season and restore it.',   next: 'end_weaver' },
                        { em: '🏔️', txt: 'Build a Palace of Seasons where all nature spirits can meet.',    next: 'end_palace' },
                    ]
                },
                s2b: {
                    chapter: 'Chapter 2 · The Echo Kingdom',
                    emoji: '🏔️', theme: 'theme-ice',
                    text: "From the summit, Elsa sees it — a second Arendelle, identical to hers, floating in the clouds. An ancient ice spirit built it as a mirror of everything Arendelle could become. But it's slowly descending. If it lands, it will cast Arendelle in permanent shadow. She has one hour.",
                    choices: [
                        { em: '🌬️', txt: 'Unleash her full power and freeze the echo kingdom in place forever.',  next: 'end_frozen_sky' },
                        { em: '💙', txt: 'Ascend into it and find out what it truly needs.',                      next: 'end_echo_peace' },
                    ]
                },
                s2c: {
                    chapter: 'Chapter 2 · The Ancient Map',
                    emoji: '🦌', theme: 'theme-ice',
                    text: "Anna, Kristoff and Sven arrive in minutes. Together they find the ice message is actually a map — to a place none of them recognise. But the map is signed with a snowflake identical to Elsa's own, dated five hundred years ago.",
                    choices: [
                        { em: '🗺️', txt: 'Follow the map together — all five of them.',                  next: 'end_five_together' },
                        { em: '📜', txt: 'Study the ancient signature in Arendelle\'s royal library first.',  next: 'end_library' },
                    ]
                },
                /* ── Elsa endings ── */
                end_warmth: {
                    chapter: 'The End · The Warmth She Gave',
                    emoji: '🌸', theme: 'theme-magic',
                    isEnding: true,
                    outcomeIcon: '🌸',
                    outcomeTitle: 'The Warmth She Gave',
                    outcomeBody: "Elsa gave her power to The Thaw, and warmth spread to every frozen corner of the world. People who had never seen flowers watched them bloom overnight. Elsa herself felt lighter — and discovered that without ice magic, she still had something no power could give: the ability to see the magic in everyone else."
                },
                end_weaver: {
                    chapter: 'The End · Season Weaver',
                    emoji: '🌈', theme: 'theme-magic',
                    isEnding: true,
                    outcomeIcon: '🌊',
                    outcomeTitle: 'The Season Weaver',
                    outcomeBody: "Elsa travelled every land that had forgotten its seasons — bringing summer to frozen kingdoms and winter to deserts that had never known cool. The world grew richer, stranger, and more beautiful than ever before. She became known across all worlds as the Season Weaver."
                },
                end_palace: {
                    chapter: 'The End · Palace of Seasons',
                    emoji: '🏔️', theme: 'theme-ice',
                    isEnding: true,
                    outcomeIcon: '🏔️',
                    outcomeTitle: 'The Palace of All Seasons',
                    outcomeBody: "Elsa built the Palace of Seasons at the top of the world — half ice, half summer garden, spring in the east wing, autumn in the west. All the spirits of nature came to live there, and for the first time in history they talked to each other. Elsa sat at the centre, translating between ice and fire, winter and bloom."
                },
                end_frozen_sky: {
                    chapter: 'The End · Sky Kingdom',
                    emoji: '❄️', theme: 'theme-ice',
                    isEnding: true,
                    outcomeIcon: '🌌',
                    outcomeTitle: 'The Frozen Sky Kingdom',
                    outcomeBody: "Elsa froze the echo kingdom perfectly in place — eternal and gleaming, floating above the clouds. It became a legendary sight: sailors navigated by it, artists painted it for centuries, and on clear winter nights children swore they could hear music drifting down from its towers."
                },
                end_echo_peace: {
                    chapter: 'The End · Sister Kingdoms',
                    emoji: '💙', theme: 'theme-ice',
                    isEnding: true,
                    outcomeIcon: '💙',
                    outcomeTitle: 'Two Arendelles',
                    outcomeBody: "Inside the echo kingdom, Elsa found the ancient ice spirit — alone, and so lonely it had forgotten why it built the place. She stayed a week, listening to five hundred years of stories. The kingdom rose back into the sky, no longer falling. Two Arendelles now exist: one of earth, one of sky. Both are home."
                },
                end_five_together: {
                    chapter: 'The End · The Five',
                    emoji: '🦌', theme: 'theme-gold',
                    isEnding: true,
                    outcomeIcon: '⭐',
                    outcomeTitle: 'The Five Who Remembered',
                    outcomeBody: "The map led to the birthplace of ice magic — and there they found five carved stones, one for each of them. Someone had always known they'd come together. The adventure was never the destination. It was always the five of them, side by side, every step of the way."
                },
                end_library: {
                    chapter: 'The End · A Name Across Time',
                    emoji: '📜', theme: 'theme-magic',
                    isEnding: true,
                    outcomeIcon: '📖',
                    outcomeTitle: 'The Same Story',
                    outcomeBody: "In the library they found a journal, five centuries old, written by a girl with power over ice who loved her sister, was afraid, and became brave. Her name was Elsa. Not the same Elsa — but the same story. Magic, Kristoff said softly, is just love that refuses to die."
                },
            }
        },

        /* ════════════════ SIMBA ════════════════ */
        simba: {
            guideIcon: '🦁', guideName: 'Simba',
            nodes: {
                s1: {
                    chapter: 'Chapter 1 · The Shadow That Speaks',
                    emoji: '🌅', theme: 'theme-fire',
                    text: "Simba stands at Pride Rock as a golden sunrise reveals something wrong — a shadow moving against the wind, shaped like a lion he's never seen. Rafiki appears at his side. \"This is a test, Lion King. Even kings must prove their heart.\" Simba steps forward.",
                    choices: [
                        { em: '👁️', txt: 'Follow the shadow silently and see where it leads.',            next: 's2a' },
                        { em: '📣', txt: 'Roar at it and demand it reveal itself.',                       next: 's2b' },
                        { em: '🌿', txt: 'Ask Rafiki to read the stars and find the truth.',              next: 's2c' },
                    ]
                },
                s2a: {
                    chapter: 'Chapter 2 · The Forgotten Valley',
                    emoji: '🌿', theme: 'theme-nature',
                    text: "Simba tracks the shadow for three days to a hidden valley lush with life — animals that fled the Pride Lands during Scar's reign and never returned. They're terrified of any lion. Simba sits down at the valley's edge and simply waits. Slowly, a young gazelle approaches.",
                    choices: [
                        { em: '💬', txt: 'Listen to every story — every fear, every loss.',               next: 'end_listening_king' },
                        { em: '🏠', txt: 'Offer a royal promise: all who return will be protected.',      next: 'end_great_return' },
                    ]
                },
                s2b: {
                    chapter: 'Chapter 2 · Mirror of Choices',
                    emoji: '💨', theme: 'theme-fire',
                    text: "The shadow stops. It turns. And Simba sees — it IS him. A version of himself from a future where he made different choices: cold, ruling through fear, proud without purpose. \"Show me what you'd do differently,\" the shadow says, and waits.",
                    choices: [
                        { em: '❤️', txt: 'Choose compassion — rule with an open heart even when it hurts.',   next: 'end_compassion' },
                        { em: '💪', txt: 'Choose courage — never let fear make decisions for him.',           next: 'end_fearless' },
                    ]
                },
                s2c: {
                    chapter: 'Chapter 2 · Written Above',
                    emoji: '🌌', theme: 'theme-dark',
                    text: "Rafiki reads the stars and goes very still. \"The shadow is a question, my king. It asks whether the Pride Lands is truly yours — or whether it belongs to all.\" Simba looks out over the savannah. He has always called himself its protector. But maybe that's not enough.",
                    choices: [
                        { em: '🌍', txt: 'Proclaim that the Pride Lands belongs to every creature in it.',    next: 'end_belongs_to_all' },
                        { em: '🤝', txt: 'Create a Council of All Creatures to rule together.',               next: 'end_council' },
                    ]
                },
                /* ── Simba endings ── */
                end_listening_king: {
                    chapter: 'The End · The Listening King',
                    emoji: '🌿', theme: 'theme-nature',
                    isEnding: true,
                    outcomeIcon: '🌿',
                    outcomeTitle: 'The Listening King',
                    outcomeBody: "Simba stayed two weeks, listening to every fear, every grief, every longing. The valley animals followed him home — not because he was king, but because he was the first lion who had ever truly listened. He became known as The Listening King, and the Pride Lands became a place of more voices than one."
                },
                end_great_return: {
                    chapter: 'The End · The Great Return',
                    emoji: '🌅', theme: 'theme-fire',
                    isEnding: true,
                    outcomeIcon: '🦁',
                    outcomeTitle: 'The Great Return',
                    outcomeBody: "Simba gave his royal promise, sealed with his roar, that no creature in his Pride Lands would ever fear again. They came back — hundreds of animals flowing like water returning to a dry riverbed. Rafiki watched from a tree branch and said: \"Now THIS is a king.\""
                },
                end_compassion: {
                    chapter: 'The End · Heart of a King',
                    emoji: '❤️', theme: 'theme-fire',
                    isEnding: true,
                    outcomeIcon: '❤️',
                    outcomeTitle: 'Heart of a King',
                    outcomeBody: "Simba chose compassion — through flood, drought, and challenge. He held his heart open through all of it. The shadow dissolved, and with it, the coldness that had been creeping in. His father's voice came on the wind, just once, barely a whisper: \"Well done, my son.\""
                },
                end_fearless: {
                    chapter: 'The End · Fearless',
                    emoji: '🌟', theme: 'theme-gold',
                    isEnding: true,
                    outcomeIcon: '⚡',
                    outcomeTitle: 'The Fearless King',
                    outcomeBody: "Simba made a vow: no decision born of fear. Not in battle, not in drought, not in darkness. The shadow crumbled to dust in the morning wind. From that day, the Pride Lands had a different kind of king — not fearless as in unafraid, but fearless as in going forward anyway."
                },
                end_belongs_to_all: {
                    chapter: 'The End · The Land That Belongs to All',
                    emoji: '🌍', theme: 'theme-nature',
                    isEnding: true,
                    outcomeIcon: '🌍',
                    outcomeTitle: 'Belonging to All',
                    outcomeBody: "Simba stood on Pride Rock and proclaimed: not the kingdom of lions, but the home of all who breathed under that sky. The shadow dissolved in the new light. And the Pride Lands, already vast, somehow grew even larger — as if the earth itself exhaled in relief."
                },
                end_council: {
                    chapter: 'The End · The Great Council',
                    emoji: '🤝', theme: 'theme-gold',
                    isEnding: true,
                    outcomeIcon: '👑',
                    outcomeTitle: 'Council of All',
                    outcomeBody: "Simba built the Great Council Rock at the base of Pride Rock — a flat stone where any creature could speak and be heard. Lions sat beside meerkats. Eagles beside mice. The Council became the most imitated idea in the animal kingdom, and Simba was the king who made himself only one voice among many."
                },
            }
        },

        /* ════════════════ MOANA ════════════════ */
        moana: {
            guideIcon: '🌊', guideName: 'Moana',
            nodes: {
                s1: {
                    chapter: 'Chapter 1 · The Second Call',
                    emoji: '🌊', theme: 'theme-ocean',
                    text: "Three years after restoring Te Fiti's heart, Moana feels the ocean calling again — but this time the waves circle in confusion. Grandmother Tala's spirit shimmers on the water. \"There is a second heart, Moana. Older than Te Fiti's. And it is breaking.\"",
                    choices: [
                        { em: '⛵', txt: 'Set sail alone immediately — the ocean will guide her.',           next: 's2a' },
                        { em: '🪝', txt: 'Find Maui first — this calls for a crew.',                       next: 's2b' },
                        { em: '🤿', txt: 'Dive beneath Motunui\'s reef to listen to what the deep knows.', next: 's2c' },
                    ]
                },
                s2a: {
                    chapter: 'Chapter 2 · The Still Sea',
                    emoji: '🌌', theme: 'theme-ocean',
                    text: "Three days out, the ocean goes perfectly, utterly still — no wind, no current, no stars. Then something rises from the deep: a creature made of bioluminescent light, as large as an island, shaped like a sleeping person. It is the second heart. And it is alive.",
                    choices: [
                        { em: '🎵', txt: 'Sing the song of Motunui softly into the water.',                next: 'end_lullaby' },
                        { em: '🤿', txt: 'Dive in and swim toward it with arms open.',                    next: 'end_open_arms' },
                    ]
                },
                s2b: {
                    chapter: 'Chapter 2 · The Demigod Returns',
                    emoji: '🪝', theme: 'theme-ocean',
                    text: "Maui arrives late with seventeen excuses. But when Moana explains, he goes quiet — which shocks her, because Maui never goes quiet. \"I know of the second heart,\" he says. \"It's where all the ocean's grief has been pooling. For a thousand years.\"",
                    choices: [
                        { em: '💧', txt: 'Have Maui draw the grief out and scatter it as rain across the world.',  next: 'end_grief_rain' },
                        { em: '🌊', txt: 'Sail together to find where the grief began and heal it at its source.',  next: 'end_source' },
                    ]
                },
                s2c: {
                    chapter: 'Chapter 2 · What the Deep Knows',
                    emoji: '🐠', theme: 'theme-ocean',
                    text: "The deep ocean speaks in images: a god older than Maui, older than Te Fiti — the First Sailor, who mapped every ocean and then let herself be forgotten so the world could find its own way. Her name has been lost. But her compass has stopped spinning.",
                    choices: [
                        { em: '🧭', txt: 'Recover the compass and carry it to the edge of the world.',    next: 'end_compass' },
                        { em: '📖', txt: 'Speak the First Sailor\'s forgotten name back into existence.',  next: 'end_name' },
                    ]
                },
                /* ── Moana endings ── */
                end_lullaby: {
                    chapter: 'The End · The Lullaby of the Deep',
                    emoji: '🌊', theme: 'theme-ocean',
                    isEnding: true,
                    outcomeIcon: '🎵',
                    outcomeTitle: 'Lullaby of the Deep',
                    outcomeBody: "Moana sang, and the great creature stirred — it had been dreaming of the surface for a thousand years. Her song gave it sky, warmth, and sound. It exhaled once, and the ocean flooded with light. The second heart was not broken; it was just very, very lonely. Moana visited every year, and was never alone on those voyages."
                },
                end_open_arms: {
                    chapter: 'The End · Chosen by the Deep',
                    emoji: '💙', theme: 'theme-ocean',
                    isEnding: true,
                    outcomeIcon: '💙',
                    outcomeTitle: 'Chosen by the Deep',
                    outcomeBody: "Moana swam into the bioluminescent light and felt the creature wake around her — not with fear, but with the tentative wonder of something never touched before. She stayed three days, floating in its glow, keeping it company. When she surfaced, the ocean glittered like nothing she'd ever seen. The heart was healed."
                },
                end_grief_rain: {
                    chapter: 'The End · The Great Rain',
                    emoji: '🌧️', theme: 'theme-ocean',
                    isEnding: true,
                    outcomeIcon: '🌧️',
                    outcomeTitle: 'The Great Rain',
                    outcomeBody: "Maui shaped his hook into a funnel and pulled a thousand years of ocean grief skyward, releasing it as rain. It rained for seven days — warm, gentle rain that smelled of every sea that had ever existed. Crops grew overnight. Rivers found their way. And for the first time in centuries, the ocean felt lighter."
                },
                end_source: {
                    chapter: 'The End · The First Wound Closed',
                    emoji: '⚓', theme: 'theme-ocean',
                    isEnding: true,
                    outcomeIcon: '🌺',
                    outcomeTitle: 'The First Wound Closed',
                    outcomeBody: "They sailed to where the grief began — a shore where, a thousand years ago, the first people had forgotten to say thank you to the sea. Moana and Maui said it now, loudly, with their whole hearts. The wound in the ocean's heart closed slowly, like a wave retreating. Maui wiped his eye and blamed spray."
                },
                end_compass: {
                    chapter: 'The End · The Navigator\'s Return',
                    emoji: '🧭', theme: 'theme-gold',
                    isEnding: true,
                    outcomeIcon: '🧭',
                    outcomeTitle: 'The Compass Restored',
                    outcomeBody: "Moana carried the compass to the edge of every known map — and then kept going, past the last named star, until she stood at the beginning of everything unmapped. She set the compass spinning. It found its direction. Then she followed it, into a sea no story had ever told, to write the first chapter of a new one."
                },
                end_name: {
                    chapter: 'The End · The Name at the Bottom of the Sea',
                    emoji: '🌟', theme: 'theme-magic',
                    isEnding: true,
                    outcomeIcon: '🌊',
                    outcomeTitle: 'Speaking Her Name',
                    outcomeBody: "Moana dove to the deepest place she could reach and spoke the First Sailor's name into the water. It travelled outward in rings of light. Far across the ocean, old mariners heard it in their sleep and woke up crying without knowing why. Te Fiti smiled. Grandmother Tala's spirit blazed like a thousand fireflies and, finally, peacefully, was still."
                },
            }
        },
    };

    // ── DOM refs ──────────────────────────────────────────────────────────
    const pickScreen    = document.getElementById('sa-pick');
    const playScreen    = document.getElementById('sa-play');
    const guideIcon     = document.getElementById('sa-guide-icon');
    const guideLabel    = document.getElementById('sa-guide-label');
    const chapterTag    = document.getElementById('sa-chapter-tag');
    const sceneEl       = document.getElementById('sa-scene');
    const sceneEmoji    = document.getElementById('sa-scene-emoji');
    const sparksEl      = document.getElementById('sa-sparks');
    const avatarEl      = document.getElementById('sa-avatar');
    const textEl        = document.getElementById('sa-text');
    const choicesEl     = document.getElementById('sa-choices');
    const endingEl      = document.getElementById('sa-ending');
    const endingStars   = document.getElementById('sa-ending-stars');
    const endingIcon    = document.getElementById('sa-ending-icon');
    const endingTitle   = document.getElementById('sa-ending-title');
    const endingBody    = document.getElementById('sa-ending-body');
    const restartBtn    = document.getElementById('sa-restart');
    const replayBtn     = document.getElementById('sa-replay');
    const newCharBtn    = document.getElementById('sa-new-char');

    if (!pickScreen || !playScreen) return;

    let currentStory = null;
    let twTimer = null;

    // ── Character tile clicks ─────────────────────────────────────────────
    pickScreen.querySelectorAll('.sa-char-tile').forEach(tile => {
        tile.addEventListener('click', () => {
            const key = tile.dataset.char;
            const story = STORIES[key];
            if (!story) return;
            currentStory = story;
            AudioManager.click();

            // Animate tile selection
            tile.style.transform = 'scale(0.93)';
            setTimeout(() => {
                tile.style.transform = '';
                switchToPlay(story);
            }, 180);
        });
    });

    function switchToPlay(story) {
        pickScreen.classList.remove('sa-screen--active');
        playScreen.classList.add('sa-screen--active');
        guideIcon.textContent  = story.guideIcon;
        guideLabel.textContent = story.guideName;
        avatarEl.textContent   = story.guideIcon;
        showNode('s1');
    }

    // ── Node rendering ────────────────────────────────────────────────────
    function showNode(nodeKey) {
        const node = currentStory.nodes[nodeKey];
        if (!node) return;

        endingEl.hidden = true;
        choicesEl.style.display = 'flex';
        choicesEl.innerHTML = '';

        // Chapter badge
        chapterTag.textContent = node.chapter;

        // Scene transition — pop out then in
        sceneEmoji.style.transition = 'transform .28s cubic-bezier(.6,0,.4,1), opacity .25s';
        sceneEmoji.style.transform  = 'scale(0) rotate(-12deg)';
        sceneEmoji.style.opacity    = '0';
        setTimeout(() => {
            sceneEmoji.textContent = node.emoji;
            // Scene theme
            sceneEl.className = 'sa-scene ' + (node.theme || 'theme-gold');
            sceneEmoji.style.transform = '';
            sceneEmoji.style.opacity   = '1';
            sceneEmoji.style.transition = 'transform .55s cubic-bezier(.34,1.45,.64,1), opacity .35s';
        }, 230);

        // Scatter fresh particles
        spawnParticles(node.theme);

        // Typewrite narrative
        clearTimeout(twTimer);
        textEl.textContent = '';
        typewrite(node.text, 0);

        // Build choice buttons with slight delay (let typewriter start first)
        if (!node.isEnding) {
            setTimeout(() => buildChoices(node.choices), 120);
        }

        // If ending, show after text finishes
        if (node.isEnding) {
            const delay = node.text.length * 23 + 600;
            setTimeout(() => showEnding(node), delay);
        }
    }

    function typewrite(text, i) {
        if (i > text.length) return;
        textEl.textContent = text.slice(0, i);
        twTimer = setTimeout(() => typewrite(text, i + 1), 21);
    }

    function buildChoices(choices) {
        choicesEl.innerHTML = '';
        choices.forEach((c, idx) => {
            const btn = document.createElement('button');
            btn.className = 'sa-choice';
            btn.style.animationDelay = (idx * 0.08) + 's';
            btn.innerHTML = `
                <span class="sa-choice-em">${c.em}</span>
                <span class="sa-choice-txt">${c.txt}</span>
                <span class="sa-choice-arr">→</span>`;
            btn.addEventListener('click', () => {
                AudioManager.click();
                // Flash scene
                sceneEmoji.style.transform = 'scale(1.18)';
                sceneEmoji.style.filter    = 'brightness(2) drop-shadow(0 0 30px white)';
                choicesEl.innerHTML = '';
                clearTimeout(twTimer);
                setTimeout(() => {
                    sceneEmoji.style.filter = '';
                    showNode(c.next);
                }, 340);
            });
            choicesEl.appendChild(btn);
        });
    }

    function showEnding(node) {
        choicesEl.style.display = 'none';
        endingEl.hidden = false;
        endingIcon.textContent  = node.outcomeIcon  || '🌟';
        endingTitle.textContent = node.outcomeTitle || 'The End';
        endingBody.textContent  = node.outcomeBody  || '';

        // Float stars
        spawnEndingStars();
        AudioManager.success && AudioManager.success();
    }

    // ── Restart / new character ───────────────────────────────────────────
    restartBtn.addEventListener('click', () => {
        AudioManager.click();
        endingEl.hidden = true;
        choicesEl.style.display = 'flex';
        showNode('s1');
    });
    replayBtn.addEventListener('click', () => {
        AudioManager.click();
        endingEl.hidden = true;
        choicesEl.style.display = 'flex';
        showNode('s1');
    });
    newCharBtn.addEventListener('click', () => {
        AudioManager.click();
        playScreen.classList.remove('sa-screen--active');
        pickScreen.classList.add('sa-screen--active');
        currentStory = null;
        clearTimeout(twTimer);
    });

    // ── Scene particles ───────────────────────────────────────────────────
    const THEME_COLORS = {
        'theme-gold':   ['#FFD700','#FFF3B0','#DAA520','#fffbe8'],
        'theme-ice':    ['#A8EDFF','#DFF6FF','#6CD4F5','#fff'],
        'theme-fire':   ['#FF9500','#FFD700','#FF4500','#FFB347'],
        'theme-ocean':  ['#00C6FF','#0080FF','#A8EDFF','#4FC3F7'],
        'theme-magic':  ['#C084FC','#E879F9','#FFD700','#F9A8D4'],
        'theme-dark':   ['#9333EA','#6366F1','#C084FC','#A78BFA'],
        'theme-nature': ['#4ADE80','#86EFAC','#FFD700','#BBF7D0'],
    };
    function spawnParticles(theme) {
        sparksEl.innerHTML = '';
        const colors = THEME_COLORS[theme] || THEME_COLORS['theme-gold'];
        for (let i = 0; i < 18; i++) {
            const el = document.createElement('div');
            el.className = 'sa-sp';
            const sz = Math.random() * 5 + 2;
            const col = colors[Math.floor(Math.random() * colors.length)];
            const tx = (Math.random() - .5) * 120;
            const ty = -(Math.random() * 90 + 20);
            Object.assign(el.style, {
                width: sz + 'px', height: sz + 'px',
                left: Math.random() * 90 + 5 + '%',
                top:  Math.random() * 60 + 15 + '%',
                background: col,
                boxShadow: `0 0 ${sz * 2}px ${col}`,
                '--tx': tx + 'px', '--ty': ty + 'px',
                '--d': (2.2 + Math.random() * 2.2) + 's',
                '--dl': (Math.random() * 2.5) + 's',
                '--op': (.45 + Math.random() * .55),
            });
            sparksEl.appendChild(el);
        }
    }

    // ── Ending star burst ─────────────────────────────────────────────────
    const STAR_EMOJIS = ['✨','⭐','🌟','💫','✦','★'];
    function spawnEndingStars() {
        endingStars.innerHTML = '';
        for (let i = 0; i < 12; i++) {
            const el = document.createElement('span');
            el.className = 'sa-ending-star';
            el.textContent = STAR_EMOJIS[i % STAR_EMOJIS.length];
            Object.assign(el.style, {
                left: Math.random() * 90 + 5 + '%',
                top:  Math.random() * 80 + 10 + '%',
                '--d':  (2.5 + Math.random() * 2.5) + 's',
                '--dl': (Math.random() * 1.5) + 's',
            });
            endingStars.appendChild(el);
        }
    }

})();
