const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const v1 = document.getElementById('vid1');
const v2 = document.getElementById('vid2');
let backgroundImg = new Image();
let showUI = true, showDots = true, currentMode = 'desktop';

// Structura cu 6 puncte per strat
let layers = {
    v1: { pts: [{x:50,y:50}, {x:200,y:50}, {x:350,y:50}, {x:50,y:300}, {x:200,y:300}, {x:350,y:300}] },
    v2: { pts: [{x:400,y:50}, {x:550,y:50}, {x:700,y:50}, {x:400,y:300}, {x:550,y:300}, {x:700,y:300}] }
};

function setView(type) {
    currentMode = type;
    const resText = document.getElementById('res-indicator');
    if (type === 'mobile') {
        canvas.width = 390; canvas.height = 844;
        canvas.style.width = '390px'; canvas.style.height = '844px';
        resText.innerText = "MOD: SMARTPHONE (390x844)";
    } else {
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        canvas.style.width = '100%'; canvas.style.height = '100%';
        resText.innerText = "MOD: DESKTOP (FULL)";
    }
}

function setupEvents() {
    window.onresize = () => { if(currentMode === 'desktop') setView('desktop'); };
    document.getElementById('bgInput').onchange = (e) => { if(e.target.files[0]) backgroundImg.src = URL.createObjectURL(e.target.files[0]); };
    document.getElementById('video1Input').onchange = (e) => { if(e.target.files[0]) { v1.src = URL.createObjectURL(e.target.files[0]); v1.play(); }};
    document.getElementById('video2Input').onchange = (e) => { if(e.target.files[0]) { v2.src = URL.createObjectURL(e.target.files[0]); v2.play(); }};

    let dragPt = null, dragLayer = null, lastMouse = {x:0, y:0};

    canvas.onmousedown = (e) => {
        if(!showDots) return;
        const rect = canvas.getBoundingClientRect();
        const mouse = { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
        for (let key in layers) {
            layers[key].pts.forEach(p => { if(Math.hypot(p.x - mouse.x, p.y - mouse.y) < 30) dragPt = p; });
        }
        if(!dragPt) {
            for (let key in layers) {
                const p = layers[key].pts;
                if(mouse.x > Math.min(p[0].x, p[3].x) && mouse.x < Math.max(p[2].x, p[5].x) && 
                   mouse.y > Math.min(p[0].y, p[1].y) && mouse.y < Math.max(p[3].y, p[5].y)) dragLayer = layers[key];
            }
        }
        lastMouse = mouse;
    };

    window.onmousemove = (e) => {
        if(!dragPt && !dragLayer) return;
        const rect = canvas.getBoundingClientRect();
        const mouse = { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
        const dx = mouse.x - lastMouse.x, dy = mouse.y - lastMouse.y;
        if(dragPt) { dragPt.x = mouse.x; dragPt.y = mouse.y; }
        else if(dragLayer) { dragLayer.pts.forEach(p => { p.x += dx; p.y += dy; }); }
        lastMouse = mouse;
        localStorage.setItem('v40_final', JSON.stringify({ v1: layers.v1.pts, v2: layers.v2.pts }));
    };
    window.onmouseup = () => { dragPt = null; dragLayer = null; };
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(backgroundImg.src) ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    
    [v1, v2].forEach((v, i) => {
        if(v.readyState >= 2) {
            const l = i === 0 ? layers.v1 : layers.v2;
            ctx.save(); ctx.beginPath();
            // Ordinea punctelor pentru desenare corecta
            ctx.moveTo(l.pts[0].x, l.pts[0].y); ctx.lineTo(l.pts[1].x, l.pts[1].y); ctx.lineTo(l.pts[2].x, l.pts[2].y);
            ctx.lineTo(l.pts[5].x, l.pts[5].y); ctx.lineTo(l.pts[4].x, l.pts[4].y); ctx.lineTo(l.pts[3].x, l.pts[3].y);
            ctx.closePath(); ctx.clip();
            
            // Calcul dinamic pentru a permite tragerea in orice directie
            const minX = Math.min(...l.pts.map(p => p.x));
            const minY = Math.min(...l.pts.map(p => p.y));
            const maxX = Math.max(...l.pts.map(p => p.x));
            const maxY = Math.max(...l.pts.map(p => p.y));
            
            ctx.drawImage(v, minX, minY, maxX - minX, maxY - minY);
            ctx.restore();
        }
    });
    
    if(showDots) {
        for(let key in layers) layers[key].pts.forEach(p => { 
            ctx.fillStyle = '#00ffff'; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI*2); ctx.fill(); 
        });
    }
    requestAnimationFrame(animate);
}

function toggleUI() { showUI = !showUI; document.getElementById('controls').classList.toggle('hidden', !showUI); }
function toggleDots() { showDots = !showDots; }
function toggleFullScreen() { if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }
function resetPoints() { localStorage.removeItem('v40_final'); location.reload(); }

// Restaurare date salvate [cite: 2026-01-15]
const saved = localStorage.getItem('v40_final');
if(saved) { const d = JSON.parse(saved); layers.v1.pts = d.v1; layers.v2.pts = d.v2; }

setupEvents(); setView('desktop'); animate();
