function openLetter() {
    const wrapper = document.querySelector(".wrapper");
    wrapper.classList.toggle("open");
}

// Marble shader background (WebGL) + falling hearts (2D canvas)
(function(){
    const bg = document.getElementById('bgCanvas');
    const gl = bg.getContext('webgl');
    if (!gl) return;

    function resizeCanvasToDisplaySize(canvas){
        const dpr = window.devicePixelRatio || 1;
        const w = Math.floor(canvas.clientWidth * dpr);
        const h = Math.floor(canvas.clientHeight * dpr);
        if (canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; return true; }
        return false;
    }

    bg.style.width = '100%'; bg.style.height = '100%'; bg.style.position = 'fixed'; bg.style.left = '0'; bg.style.top = '0';

    const vert = 'attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos,0.0,1.0); }';
    const frag = `precision highp float;
        varying vec2 vUv; uniform float uTime; uniform vec2 uRes;
        vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;} vec2 mod289(vec2 x){return x - floor(x*(1.0/289.0))*289.0;} vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);} 
        float snoise(vec2 v){ const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439); vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx); vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0); vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod289(i); vec3 p = permute(permute(i.y + vec3(0.0,i1.y,1.0)) + i.x + vec3(0.0,i1.x,1.0)); vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0); m = m*m; m = m*m; vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox; m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h); vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.y = a0.y * x12.x + h.y * x12.y; g.z = a0.z * x12.z + h.z * x12.w; return 130.0 * dot(m, g); }
        void main(){ vec2 uv = vUv * vec2(uRes.x/uRes.y,1.0); float t = uTime * 0.05; float n = 0.0; float scale = 2.0; float amp = 1.0; for(int i=0;i<5;i++){ n += abs(snoise(uv * scale + vec2(t*0.3,t*0.2))) * amp; scale *= 2.0; amp *= 0.5; } float veins = sin((uv.y + n * 0.8) * 10.0); float m = smoothstep(0.25,0.62,veins); vec3 base = vec3(0.78,0.86,0.96); vec3 veinColor = mix(vec3(1.0), base, 0.25); vec3 color = mix(base, veinColor, m * 0.45); float crack = snoise(uv * 60.0 + vec2(t*5.0,t*3.0)); float thin = smoothstep(0.90,0.995,crack); vec3 crackColor = mix(vec3(0.53,0.81,0.92), base, 0.25); color = mix(color, crackColor, thin * 0.6); float dist = distance(vUv, vec2(0.5)); color *= smoothstep(0.9,0.3,dist); gl_FragColor = vec4(color,1.0); }`;

    function compileShader(type, source){ const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s); if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){ console.error(gl.getShaderInfoLog(s)); return null; } return s; }
    const vs = compileShader(gl.VERTEX_SHADER, vert);
    const fs = compileShader(gl.FRAGMENT_SHADER, frag);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.bindAttribLocation(prog,0,'aPos'); gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog, gl.LINK_STATUS)){ console.error(gl.getProgramInfoLog(prog)); return; }
    const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const uTime = gl.getUniformLocation(prog,'uTime'); const uRes = gl.getUniformLocation(prog,'uRes');

    function renderGL(time){
        resizeCanvasToDisplaySize(bg);
        gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
        gl.useProgram(prog);
        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
        gl.uniform1f(uTime, time*0.001);
        gl.uniform2f(uRes, gl.canvas.width, gl.canvas.height);
        gl.drawArrays(gl.TRIANGLES,0,6);
        requestAnimationFrame(renderGL);
    }
    requestAnimationFrame(renderGL);

    // Hearts canvas
    const hc = document.getElementById('heartsCanvas');
    hc.style.position = 'fixed'; hc.style.left='0'; hc.style.top='0'; hc.style.width='100%'; hc.style.height='100%'; hc.style.pointerEvents='none';
    const ctx = hc.getContext('2d'); const particles = []; const max = 60; const colors = ['#6ba3d5','#7cb5e8','#ffffff'];

    function resize2(){ const dpr = window.devicePixelRatio || 1; hc.width = Math.floor(hc.clientWidth * dpr); hc.height = Math.floor(hc.clientHeight * dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
    function spawn(i){ const w = hc.clientWidth; const x = Math.random()*w; const size = 12 + Math.random()*28; particles[i] = { x:x, y: -Math.random()*hc.clientHeight - Math.random()*200, vy: 30 + Math.random()*120, rot: Math.random()*Math.PI*2, vrot: (Math.random()-0.5)*1.5, s: size, color: colors[Math.floor(Math.random()*colors.length)], delay: Math.random()*3.0 }; }
    for(let i=0;i<max;i++) spawn(i);


    function drawHeart(x,y,s,col,rot){
        ctx.save();
        ctx.translate(x,y);
        ctx.rotate(rot);
        ctx.scale(s/100,s/100);
        ctx.beginPath();
        ctx.moveTo(0,30);
        ctx.bezierCurveTo(0,-10,50,-10,50,20);
        ctx.bezierCurveTo(50,45,25,68,0,80);
        ctx.bezierCurveTo(-25,68,-50,45,-50,20);
        ctx.bezierCurveTo(-50,-10,0,-10,0,30);
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.fill();
        ctx.restore();
    }

    let last = performance.now();
    function anim(now){
        resize2();
        const dt = (now-last)*0.001;
        last = now;
        ctx.clearRect(0,0,hc.clientWidth,hc.clientHeight);
        for(let i=0;i<max;i++){
            const p = particles[i];
            if(!p) continue;
            if(p.delay>0){ p.delay -= dt; continue; }
            p.y += p.vy * dt;
            p.x += Math.sin(now*0.001 + i) * 10 * dt;
            p.rot += p.vrot * dt;
            drawHeart(p.x,p.y,p.s,p.color,p.rot);
            if(p.y - p.s > hc.clientHeight) spawn(i);
        }
        requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);
    window.addEventListener('resize', ()=>{ resizeCanvasToDisplaySize(bg); resize2(); });
})();

// 3D tulips overlay using three.js (dynamically imported)
(async function(){
    // dynamic import of three.module
    let mod;
    try{ mod = await import('https://unpkg.com/three@0.136.0/build/three.module.js'); }catch(e){ console.warn('three import failed', e); return; }
    const { Scene, OrthographicCamera, WebGLRenderer, Group, Mesh, MeshStandardMaterial, CylinderGeometry, SphereGeometry, Color, AmbientLight, DirectionalLight, LatheGeometry, Vector2 } = mod;

    // create overlay canvas
    const threeCanvas = document.createElement('canvas');
    threeCanvas.id = 'threeCanvas';
    threeCanvas.style.position = 'fixed'; threeCanvas.style.left = '0'; threeCanvas.style.top = '0'; threeCanvas.style.width = '100%'; threeCanvas.style.height = '100%'; threeCanvas.style.pointerEvents = 'none'; threeCanvas.style.zIndex = '2';
    document.body.appendChild(threeCanvas);

    const renderer = new WebGLRenderer({ canvas: threeCanvas, alpha: true, antialias: true });

    const scene = new Scene();

    let width = window.innerWidth, height = window.innerHeight;
    const camera = new OrthographicCamera(-width/2, width/2, height/2, -height/2, -1000, 1000);
    camera.position.z = 10;

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);

    // lighting
    scene.add(new AmbientLight(0xffffff, 0.6));
    const dl = new DirectionalLight(0xffffff, 0.6); dl.position.set(0.5,1,0.8); scene.add(dl);

    // shared geometries/materials
    const stemGeom = new CylinderGeometry(1,1,40,6);
    const petalGeom = new SphereGeometry(7,12,10);
    const stemMat = new MeshStandardMaterial({ color: new Color(0x3b7a3b) });
    const petalMatBlue = new MeshStandardMaterial({ color: new Color(0x001f4d), roughness: 0.6, metalness: 0.1 });
    const petalMatLightBlue = new MeshStandardMaterial({ color: new Color(0x003d82), roughness: 0.6, metalness: 0.05 });

    // Tulip generator (simple, clean sphere-based petals with blue tones)
    function createTulip(useAlt){
        const g = new Group();

        // stem
        const stemHeight = (48 + Math.random()*18) * 0.5;
        const stemGeo = new CylinderGeometry(0.6,0.9,stemHeight,10);
        const stem = new Mesh(stemGeo, stemMat);
        stem.position.y = 0;
        g.add(stem);

        const petMat = useAlt ? petalMatLightBlue : petalMatBlue;

        // cup where petals join
        const cup = new Mesh(new CylinderGeometry(3.2,3.8,2.2,12), petMat);
        cup.position.y = stemHeight * 0.5 + 1.0;
        cup.scale.set(1.0,0.5,1.0);
        g.add(cup);

        // 5 clean petals arranged in a circle
        const petalCount = 5;
        for(let i=0;i<petalCount;i++){
            const p = new Mesh(petalGeom, petMat);
            p.position.y = stemHeight * 0.5 + 5.5;
            const angle = (i/petalCount) * Math.PI * 2;
            const radius = 3.5 + Math.random()*0.5;
            p.position.x = Math.cos(angle) * radius;
            p.position.z = Math.sin(angle) * (radius * 0.5);
            // slight scale variation for natural look
            p.scale.set(1.1, 1.0, 0.7);
            // tilt petals outward and slightly backward
            p.rotation.set(-0.9 + Math.random()*0.1, angle, 0);
            g.add(p);
        }

        // central bud detail
        const bud = new Mesh(new SphereGeometry(2.8,10,8), petMat);
        bud.position.y = stemHeight * 0.5 + 7.8;
        bud.scale.set(0.95,1.0,0.85);
        g.add(bud);

        // pair of simple leaves
        const leafMat = new MeshStandardMaterial({ color: new Color(0x3f8f4a), roughness: 0.7 });
        for(let i=0;i<2;i++){
            const lf = new Mesh(new CylinderGeometry(0.4,0.5,6,8), leafMat);
            lf.scale.set(0.8,0.8,0.35);
            lf.rotation.set(0, (i===0?0.6:-0.6), (i===0?0.15:-0.15));
            lf.position.y = -stemHeight * 0.1;
            lf.position.x = (i===0? -2.2 : 2.2);
            lf.position.z = (i===0? -0.8 : 0.8);
            g.add(lf);
        }

        return g;
    }

    const tulips = [];
    const tulipCount = 12;
    for(let i=0;i<tulipCount;i++){
        const t = createTulip(Math.random() < 0.5);
        scene.add(t);
        tulips.push({group: t, vy: 30 + Math.random()*80, x: 0, y: 0});
    }

    function placeTulipsInitial(){
        width = window.innerWidth; height = window.innerHeight;
        renderer.setSize(width, height);
        camera.left = -width/2; camera.right = width/2; camera.top = height/2; camera.bottom = -height/2; camera.updateProjectionMatrix();
        for(let i=0;i<tulips.length;i++){
            const t = tulips[i];
            const x = (Math.random() - 0.5) * width;
            // place above the top of the screen so they fall downward
            const y = height/2 + Math.random() * (height * 0.6 + 300);
            t.group.position.set(x, y, 0);
            // orient petals to face forward and stem downwards
            t.group.rotation.set(0, Math.random()*0.6 - 0.3, 0);
            t.vy = 30 + Math.random()*90;
        }
    }
    placeTulipsInitial();

    let lastT = performance.now();
    function tick(now){
        const dt = (now - lastT) * 0.001; lastT = now;
        for(let i=0;i<tulips.length;i++){
            const t = tulips[i];
            // move downwards on screen
            t.group.position.y -= t.vy * dt;
            t.group.rotation.y += 0.2 * dt;
            // slight horizontal sway
            t.group.position.x += Math.sin((now*0.001 + i) * 0.7) * 6 * dt;
            // if moved past bottom, respawn above
            if(t.group.position.y < -height/2 - 60){
                t.group.position.y = height/2 + (20 + Math.random()*300);
                t.group.position.x = (Math.random()-0.5) * width;
                t.vy = 30 + Math.random()*90;
            }
        }
        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    window.addEventListener('resize', ()=>{ placeTulipsInitial(); });

})();

// Audio persistence
function saveAudioTime() {
    const audio = document.getElementById('bgAudio');
    if (audio) {
        sessionStorage.setItem('audioTime', audio.currentTime);
    }
}

window.addEventListener('load', () => {
    const audio = document.getElementById('bgAudio');
    const savedTime = sessionStorage.getItem('audioTime');
    if (savedTime && audio) {
        audio.currentTime = parseFloat(savedTime);
    }
    
    // Intentar desmutar inmediatamente si viene de otra página
    setTimeout(() => {
        if (audio) {
            audio.muted = false;
            audio.play().catch(err => {
                console.log('Autoplay requiere interacción del usuario');
            });
        }
    }, 100);
});

// Permitir desmutar con interacción del usuario como respaldo
function enableAudio() {
    const audio = document.getElementById('bgAudio');
    if (audio) {
        audio.muted = false;
        audio.play().catch(err => console.log('Error al reproducir:', err));
    }
    document.removeEventListener('click', enableAudio);
    document.removeEventListener('touchstart', enableAudio);
}

document.addEventListener('click', enableAudio);
document.addEventListener('touchstart', enableAudio);