const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const video = document.getElementById('sourceVideo');
const uiLayer = document.getElementById('ui-layer');
const videoInput = document.getElementById('videoInput');

let points = [];
let isDragging = false;
let currentPoint = null;

// Inițializare puncte: 0-2 (sus), 3-4 (mijloc laturi), 5-7 (jos)
function initPoints() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pad = 100;

    points = [
        {x: pad, y: pad}, {x: w/2, y: pad}, {x: w-pad, y: pad}, // Sus
        {x: pad, y: h/2},                   {x: w-pad, y: h/2}, // Mijloc
        {x: pad, y: h-pad}, {x: w/2, y: h-pad}, {x: w-pad, y: h-pad} // Jos
    ];
    createHandles();
}

function createHandles() {
    uiLayer.innerHTML = '';
    points.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = 'handle';
        div.style.left = p.x + 'px';
        div.style.top = p.y + 'px';
        
        div.onmousedown = (e) => {
            isDragging = true;
            currentPoint = i;
        };
        uiLayer.appendChild(div);
    });
}

window.onmousemove = (e) => {
    if (isDragging && currentPoint !== null) {
        points[currentPoint].x = e.clientX;
        points[currentPoint].y = e.clientY;
        const handles = document.querySelectorAll('.handle');
        handles[currentPoint].style.left = e.clientX + 'px';
        handles[currentPoint].style.top = e.clientY + 'px';
    }
};

window.onmouseup = () => { isDragging = false; currentPoint = null; };

// Logica de randare cu deformare prin subdiviziune
function render() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (video.readyState >= 2) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        // Randăm video-ul în 4 sectoare folosind punctele noastre
        // Sector 1 (Stânga Sus)
        drawQuad(video, 0, 0, vw/2, vh/2, points[0], points[1], points[3], calculateCenter());
        // Sector 2 (Dreapta Sus)
        drawQuad(video, vw/2, 0, vw/2, vh/2, points[1], points[2], calculateCenter(), points[4]);
        // Sector 3 (Stânga Jos)
        drawQuad(video, 0, vh/2, vw/2, vh/2, points[3], calculateCenter(), points[5], points[6]);
        // Sector 4 (Dreapta Jos)
        drawQuad(video, vw/2, vh/2, vw/2, vh/2, calculateCenter(), points[4], points[6], points[7]);
    }
    requestAnimationFrame(render);
}

function calculateCenter() {
    // Calculăm un punct central dinamic bazat pe media punctelor de pe margini
    return {
        x: (points[1].x + points[6].x + points[3].x + points[4].x) / 4,
        y: (points[1].y + points[6].y + points[3].y + points[4].y) / 4
    };
}

// Funcție pentru desenarea unei felii de video deformată (Simplificată pentru performanță)
function drawQuad(img, sx, sy, sw, sh, p1, p2, p3, p4) {
    // În context 2D pur, folosim o aproximare prin transformări multiple
    // Pentru un warping perfect de 8 puncte "curbe", WebGL ar fi pasul următor
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.clip();
    
    // Calculăm o cutie de încadrare pentru acest cadran
    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);
    
    ctx.drawImage(img, sx, sy, sw, sh, minX, minY, maxX - minX, maxY - minY);
    ctx.restore();
}

videoInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        video.src = URL.createObjectURL(file);
        video.play();
    }
};

function resetPoints() { initPoints(); }
function toggleUI() { uiLayer.style.display = uiLayer.style.display === 'none' ? 'block' : 'none'; }

initPoints();
render();