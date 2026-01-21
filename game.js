// 1. THIẾT LẬP MÀN HÌNH & CHẶN LỖI CẢM ỨNG
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pauseScreen = document.getElementById('pauseScreen');
const btnResume = document.getElementById('btnResume');

// Chặn hành vi mặc định
document.body.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 2. TẢI HÌNH ẢNH
const imgBuom = new Image(); imgBuom.src = 'assets/buom.png';
const imgCay = new Image(); imgCay.src = 'assets/cay.png';
const imgNen = new Image(); imgNen.src = 'assets/rung.png';

// 3. CẤU HÌNH THÔNG SỐ
const SPEED_BUOM_PER_SEC = canvas.width * 0.6; 
const SPEED_CAY_PER_SEC = canvas.height * 0.4; 

let buom = { 
    x: canvas.width / 2, 
    y: canvas.height - 150, 
    banKinh: 20 
};

let danhSachCay = [];
let joystickData = { x: 0, y: 0 }; 
let gameOver = false;
let isPaused = false; // Trạng thái tạm dừng
let lastTime = 0; 

// --- LOGIC NHẤN ĐÚP (DOUBLE TAP) ---
let lastTapTime = 0;

// Lắng nghe cú chạm trên toàn màn hình
document.addEventListener('touchstart', function(e) {
    // Không xử lý nếu đang chạm vào nút Resume
    if (e.target === btnResume) return;

    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;

    // Nếu khoảng cách giữa 2 lần chạm nhỏ hơn 1000ms (1 giây) và chưa game over
    if (tapLength < 1000 && tapLength > 0 && !gameOver) {
        togglePause();
        e.preventDefault(); // Chặn việc tạo thêm joystick khi double tap
    }
    lastTapTime = currentTime;
});

// Hàm Bật/Tắt Tạm dừng
function togglePause() {
    isPaused = !isPaused;
    
    if (isPaused) {
        pauseScreen.classList.remove('hidden'); // Hiện bảng thông báo
        // Khi dừng, ta không làm gì cả, vòng lặp update sẽ tự chặn
    } else {
        resumeGame();
    }
}

// Hàm Tiếp tục game (Gán vào nút OK)
function resumeGame() {
    isPaused = false;
    pauseScreen.classList.add('hidden'); // Ẩn bảng thông báo
    lastTime = performance.now(); // Reset thời gian để tránh giật lag sau khi pause
    requestAnimationFrame(update); // Gọi lại vòng lặp ngay lập tức
}

// Gán sự kiện cho nút OK
btnResume.addEventListener('click', resumeGame);
btnResume.addEventListener('touchstart', resumeGame); // Hỗ trợ cảm ứng tốt hơn

// 4. CẤU HÌNH JOYSTICK
var manager = nipplejs.create({
    zone: document.getElementById('zone_joystick'),
    mode: 'dynamic',
    color: 'white',
    size: 150,
    threshold: 0.1
});

manager.on('move', function (evt, data) {
    if (!isPaused) { // Chỉ nhận điều khiển khi không pause
        joystickData.x = data.vector.x;
        joystickData.y = data.vector.y;
    }
});

manager.on('end', function () {
    joystickData.x = 0;
    joystickData.y = 0;
});

// 5. VÒNG LẶP GAME
function update(timestamp) {
    if (gameOver) return;

    // NẾU ĐANG TẠM DỪNG -> KHÔNG LÀM GÌ CẢ, CHỜ TIẾP
    if (isPaused) {
        // Vẫn gọi requestAnimationFrame nhưng không vẽ lại để giữ hình đứng yên
        // Hoặc chỉ đơn giản là return không gọi lại, nhưng logic nút Resume sẽ gọi lại
        return; 
    }

    if (!lastTime) lastTime = timestamp;
    const deltaTime = (timestamp - lastTime) / 1000; 
    lastTime = timestamp;

    if (deltaTime > 0.1) { // Chống lag khi chuyển tab hoặc vừa resume
        requestAnimationFrame(update);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (imgNen.complete) {
        ctx.drawImage(imgNen, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#87CEEB"; ctx.fillRect(0,0,canvas.width, canvas.height);
    }

    // -- XỬ LÝ BƯỚM --
    buom.x += SPEED_BUOM_PER_SEC * joystickData.x * deltaTime;
    buom.y -= SPEED_BUOM_PER_SEC * joystickData.y * deltaTime;

    if(buom.x < 0) buom.x = 0;
    if(buom.x > canvas.width) buom.x = canvas.width;
    if(buom.y < 0) buom.y = 0;
    if(buom.y > canvas.height) buom.y = canvas.height;
    
    if (imgBuom.complete) ctx.drawImage(imgBuom, buom.x - 25, buom.y - 25, 50, 50);

    // -- XỬ LÝ CÂY --
    if (Math.random() < 2.0 * deltaTime) { 
        danhSachCay.push({
            x: Math.random() * canvas.width,
            y: -100,
            width: canvas.width * 0.15,
            height: canvas.width * 0.15
        });
    }

    for (let i = 0; i < danhSachCay.length; i++) {
        let c = danhSachCay[i];
        c.y += SPEED_CAY_PER_SEC * deltaTime;
        
        if (imgCay.complete) ctx.drawImage(imgCay, c.x, c.y, c.width, c.height);

        let dist = Math.hypot(buom.x - (c.x + c.width/2), buom.y - (c.y + c.height/2));
        if (dist < (buom.banKinh + c.width/3)) {
             ketThucGame();
        }
    }

    if (danhSachCay.length > 0 && danhSachCay[0].y > canvas.height) {
        danhSachCay.shift();
    }

    requestAnimationFrame(update);
}

function ketThucGame() {
    gameOver = true;
    setTimeout(() => {
        alert("Thua rồi! Bấm OK để chơi lại.");
        location.reload();
    }, 100);
}

requestAnimationFrame(update);
