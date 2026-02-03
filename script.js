const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const v1 = document.getElementById('vid1');
const v2 = document.getElementById('vid2');
let backgroundImg = new Image();

let showUI = true;
let showDots = true;

// 6 puncte per video
let layers = {
    v1: {
        pts: [{x:100,y:100}, {x:300,y:100}, {x:500,y:100}, {x:100,y:400}, {x:300,y:400}, {x:500,y:400}],
        active: false
    },
    v2: {
        pts: [{x:600,y:100}, {x:800,y:100}, {x:1000,y:100}, {x:600,y:400}, {x:800,y:400}, {x:1000,y:400}],
        active: false
    }
};

function init() {
    resize();
    // Memorează configurația [cite: 2026-01-15]
    const saved = localStorage.getItem('v40_final_save');
    if(saved) {
        const data = JSON.parse(saved);
        layers.v1.pts = data.v1;
        layers.v2.pts = data.v2;
    }
    setupEvents();
    requestAnimationFrame(animate);
}

function resize() {
    if (canvas.style.width !== '100%') return; // Nu modifica daca e in mod mobil
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function setView(type) {
    const resText = document.getElementById('res-indicator');
    if (type === 'mobile') {
        canvas.width = 390; canvas.height = 844;
        canvas.style.width = '390px'; canvas.style.height = '844px';
        resText.innerText = "Mod: Smartphone (Vertical)";
    } else {
        canvas.style.width = '100%'; canvas.style.height = '100%';
        resize();
        resText.innerText = "Mod: Desktop (Full Screen)";
    }
}

function setupEvents() {
    window.addEventListener('resize', resize);
    document.getElementById('bgInput').onchange = (e) => {
        if(e.target.files[0]) backgroundImg.src = URL.createObjectURL(e.target.files[0]);
    };
    document.getElementById('video1Input').onchange = (e) => {
        if(e.target.files[0]) { v1.src = URL.createObjectURL(e.target.files[0]); v1.play(); layers.v1.active = true; }
    };
    document.getElementById('video2Input').onchange = (e) => {
        if(e.target.files[0]) { v2.src = URL.createObjectURL(e.target.files[0]); v2.play(); layers.v2.active = true; }
    };

    let dragPt = null;
    let dragLayer = null;
    let lastMouse = {x:0, y:0};

    canvas.onmousedown = (e) => {
        if(!showDots) return;
        const rect = canvas.getBoundingClientRect();
        const mouse = { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
        
        for (let key in layers) {
            layers[key].pts.forEach(p => {
                if(Math.hypot(p.x - mouse.x, p.y - mouse.y) < 20) dragPt = p;
            });
        }
        if(!dragPt) {
            for (let key in layers) {
                const p = layers[key].pts;
                if(mouse.x > p[0].x && mouse.x < p[2].x && mouse.y > p[0].y && mouse.y < p[3].y) dragLayer = layers[key];
            }
        }
        lastMouse = mouse;
    };

    window.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouse = { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
        if(dragPt) {
            dragPt.x = mouse.x; dragPt.y = mouse.y;
        } else if(dragLayer) {
            const dx = mouse.x - lastMouse.x; const dy = mouse.y - lastMouse.y;
            dragLayer.pts.forEach(p => { p.x += dx; p.y += dy; });
        }
        if(dragPt || dragLayer) {
            lastMouse = mouse;
            localStorage.setItem('v40_final_save', JSON.stringify({ v1: layers.v1.pts, v2: layers.v2.pts }));
        }
    };
    window.onmouseup = () => { dragPt = null; dragLayer = null; };
}

function animate() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if(backgroundImg.src) ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    
    [ {v:v1, l:layers.v1}, {v:v2, l:layers.v2} ].forEach(obj => {
        if(obj.v.readyState >= 2) {
            ctx.save(); ctx.beginPath();
            ctx.moveTo(obj.l.pts[0].x, obj.l.pts[0].y); ctx.lineTo(obj.l.pts[1].x, obj.l.pts[1].y); ctx.lineTo(obj.l.pts[2].x, obj.l.pts[2].y);
            ctx.lineTo(obj.l.pts[5].x, obj.l.pts[5].y); ctx.lineTo(obj.l.pts[4].x, obj.l.pts[4].y); ctx.lineTo(obj.l.pts[3].x, obj.l.pts[3].y);
            ctx.closePath(); ctx.clip();
            const minX = Math.min(obj.l.pts[0].x, obj.l.pts[3].x);
            const minY = Math.min(obj.l.pts[0].y, obj.l.pts[1].y);
            ctx.drawImage(obj.v, minX, minY, Math.max(obj.l.pts[2].x, obj.l.pts[5].x)-minX, Math.max(obj.l.pts[3].y, obj.l.pts[5].y)-minY);
            ctx.restore();
        }
    });

    if(showDots) {
        for(let key in layers) {
            layers[key].pts.forEach(p => {
                ctx.fillStyle = '#00ffff'; ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = 'white'; ctx.stroke();
            });
        }
    }
    requestAnimationFrame(animate);
}

function toggleUI() { showUI = !showUI; document.getElementById('controls').classList.toggle('hidden', !showUI); }
function toggleDots() { showDots = !showDots; }
function toggleFullScreen() { if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }
function resetPoints() { localStorage.removeItem('v40_final_save'); location.reload(); }

init();
