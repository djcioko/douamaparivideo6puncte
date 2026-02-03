const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const v1 = document.getElementById('vid1');
const v2 = document.getElementById('vid2');
let backgroundImg = new Image();

let showUI = true;
let showDots = true;

// 6 puncte per video, toate Cyan pentru vizibilitate
let layers = {
    v1: {
        pts: [{x:150,y:150}, {x:350,y:150}, {x:550,y:150}, {x:150,y:400}, {x:350,y:400}, {x:550,y:400}],
        active: false
    },
    v2: {
        pts: [{x:650,y:150}, {x:850,y:150}, {x:1050,y:150}, {x:650,y:400}, {x:850,y:400}, {x:1050,y:400}],
        active: false
    }
};

function init() {
    resize();
    const saved = localStorage.getItem('v40_dual_mapper_v2');
    if(saved) {
        const data = JSON.parse(saved);
        layers.v1.pts = data.v1;
        layers.v2.pts = data.v2;
    }
    setupEvents();
    requestAnimationFrame(animate);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
        const mouse = {x: e.clientX, y: e.clientY};
        
        // 1. Verificăm punctele de control
        for (let key in layers) {
            layers[key].pts.forEach(p => {
                if(Math.hypot(p.x - mouse.x, p.y - mouse.y) < 25) dragPt = p;
            });
        }

        // 2. Verificăm zona de mijloc pentru Drag Mutare (între puncte)
        if(!dragPt) {
            for (let key in layers) {
                const p = layers[key].pts;
                if(mouse.x > p[0].x && mouse.x < p[2].x && mouse.y > p[0].y && mouse.y < p[3].y) {
                    dragLayer = layers[key];
                }
            }
        }
        lastMouse = mouse;
    };

    window.onmousemove = (e) => {
        const mouse = {x: e.clientX, y: e.clientY};
        if(dragPt) {
            dragPt.x = mouse.x;
            dragPt.y = mouse.y;
        } else if(dragLayer) {
            const dx = mouse.x - lastMouse.x;
            const dy = mouse.y - lastMouse.y;
            dragLayer.pts.forEach(p => { p.x += dx; p.y += dy; });
        }
        if(dragPt || dragLayer) {
            lastMouse = mouse;
            localStorage.setItem('v40_dual_mapper_v2', JSON.stringify({ v1: layers.v1.pts, v2: layers.v2.pts }));
        }
    };

    window.onmouseup = () => { dragPt = null; dragLayer = null; };
}

function drawVideoMesh(video, pts) {
    if(video.readyState < 2) return;
    
    // Desenăm video folosind cliparea pe zona celor 6 puncte
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.lineTo(pts[2].x, pts[2].y);
    ctx.lineTo(pts[5].x, pts[5].y); ctx.lineTo(pts[4].x, pts[4].y); ctx.lineTo(pts[3].x, pts[3].y);
    ctx.closePath();
    ctx.clip();
    
    const minX = Math.min(pts[0].x, pts[3].x);
    const minY = Math.min(pts[0].y, pts[1].y);
    const width = Math.max(pts[2].x, pts[5].x) - minX;
    const height = Math.max(pts[3].y, pts[5].y) - minY;
    
    ctx.drawImage(video, minX, minY, width, height);
    ctx.restore();
}

function animate() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if(backgroundImg.src) ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    
    drawVideoMesh(v1, layers.v1.pts);
    drawVideoMesh(v2, layers.v2.pts);
    
    if(showDots) {
        for(let key in layers) {
            layers[key].pts.forEach(p => {
                ctx.fillStyle = '#00ffff'; ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
            });
        }
    }
    requestAnimationFrame(animate);
}

function toggleUI() { showUI = !showUI; document.getElementById('controls').classList.toggle('hidden', !showUI); }
function toggleDots() { showDots = !showDots; }
function toggleFullScreen() { if(!document.fullscreenElement) canvas.requestFullscreen(); else document.exitFullscreen(); }
function resetPoints() { localStorage.removeItem('v40_dual_mapper_v2'); location.reload(); }

init();
