// 1. THIẾT LẬP MÀN HÌNH
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pauseScreen = document.getElementById('pauseScreen');
const btnResume = document.getElementById('btnResume');

// Chặn hành vi mặc định (zoom/scroll)
document.body.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 2. TẢI HÌNH ẢNH
const imgBuom = new Image(); imgBuom.src = 'assets/buom.png';
const imgCay = new Image(); imgCay.src = 'assets/cay.png';
const imgNen = new Image(); imgNen.src = 'assets/nen.png';

// --- KHO 1: CỎ (Xuất hiện nhiều) ---
const nguonCo = ['assets/co 1.png', 'assets/co 2.png', 'assets/co 3.png'];
let khoAnhCo = [];
nguonCo.forEach(src => {
    let img = new Image(); img.src = src; khoAnhCo.push(img);
});

// --- KHO 2: THÚ (Xuất hiện ít) ---
const nguonThu = ['assets/tho.png', 'assets/ga.png', 'assets/ga 2.png', 'assets/gau.png', 'assets/ho.png', 'assets/nai.png', 'assets/voi.png'];
let khoAnhThu = [];
nguonThu.forEach(src => {
    let img = new Image(); img.src = src; khoAnhThu.push(img);
});

// 3. CẤU HÌNH THÔNG SỐ (Game Balance)
// Tốc độ bay của game (Cảnh vật trôi xuống nhanh hay chậm)
// 30% chiều cao màn hình mỗi giây
const GAME_SPEED = canvas.height * 0.35; 
const BUTTERFLY_SPEED = canvas.width * 0.6; // Tốc độ di chuyển trái phải của bướm

let buom = { 
    x: canvas.width / 2, 
    y: canvas.height - 200, // Bướm bay cao hơn một chút cho thoáng
    banKinh: 20,
    flapTimer: 0 // Biến đếm để tạo hiệu ứng vỗ cánh
};

let danhSachCay = [];
let bgY = 0; // Vị trí của hình nền (để làm hiệu ứng trôi)
let danhSachTrangTri = []; //Danh sách chứa cỏ và thú
let joystickData = { x: 0, y: 0 }; 
let gameOver = false;
let isPaused = false;
let lastTime = 0;
let lastTapTime = 0;

// --- LOGIC NHẤN ĐÚP (DOUBLE TAP) ---
document.addEventListener('touchstart', function(e) {
    if (e.target === btnResume) return;
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;
    if (tapLength < 100 && tapLength > 0 && !gameOver) {
        togglePause();
        e.preventDefault();
    }
    lastTapTime = currentTime;
});

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) pauseScreen.classList.remove('hidden');
    else resumeGame();
}

function resumeGame() {
    isPaused = false;
    pauseScreen.classList.add('hidden');
    lastTime = performance.now();
    requestAnimationFrame(update);
}

btnResume.addEventListener('click', resumeGame);
btnResume.addEventListener('touchstart', resumeGame);

// 4. JOYSTICK
var manager = nipplejs.create({
    zone: document.getElementById('zone_joystick'),
    mode: 'dynamic',
    color: 'white',
    size: 150,
    threshold: 0.1
});

manager.on('move', function (evt, data) {
    if (!isPaused) {
        joystickData.x = data.vector.x;
        joystickData.y = data.vector.y;
    }
});

manager.on('end', function () {
    joystickData.x = 0;
    joystickData.y = 0;
});

// 5. VÒNG LẶP GAME CHÍNH
function update(timestamp) {
    if (gameOver) return;
    if (isPaused) return;

    if (!lastTime) lastTime = timestamp;
    const deltaTime = (timestamp - lastTime) / 1000; 
    lastTime = timestamp;

    if (deltaTime > 0.1) {
        requestAnimationFrame(update);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- A. XỬ LÝ HÌNH NỀN TRÔI (Tạo cảm giác bay tới) ---
    // Di chuyển vị trí nền xuống dưới
    bgY += GAME_SPEED * deltaTime;
    // Nếu ảnh trôi hết màn hình, reset lại để lặp vô tận
    if (bgY >= canvas.height) {
        bgY = 0;
    }
    
    // Vẽ 2 hình nền nối đuôi nhau để không bị hở màu đen
    if (imgNen.complete) {
        ctx.drawImage(imgNen, 0, bgY, canvas.width, canvas.height); // Hình 1
        ctx.drawImage(imgNen, 0, bgY - canvas.height, canvas.width, canvas.height); // Hình 2 nằm ngay bên trên
    } else {
        ctx.fillStyle = "#228B22"; ctx.fillRect(0,0,canvas.width, canvas.height);
    }
    
    // A. SINH CỎ (Tần suất CAO, kích thước NGẪU NHIÊN)
    // Số 6.0 nghĩa là rất nhiều cỏ (bạn có thể tăng giảm số này)
    if (Math.random() < 12.0 * deltaTime) { 
        let imgCo = khoAnhCo[Math.floor(Math.random() * khoAnhCo.length)];
        
        // Random kích thước từ 40px đến 90px
        let sizeNgauNhien = 40 + Math.random() * 50; 

        danhSachTrangTri.push({
            x: Math.random() * canvas.width,
            y: -100,
            img: imgCo,
            width: sizeNgauNhien,  // Chiều ngang ngẫu nhiên
            height: sizeNgauNhien, // Chiều dọc bằng chiều ngang (giữ tỷ lệ vuông)
            tocDo: GAME_SPEED, // Cỏ trôi theo nền
            gocXoay: Math.random() * Math.PI * 2
        });
    }

    // B. SINH THÚ (Tần suất THẤP)
    // Số 0.5 nghĩa là thỉnh thoảng mới có 1 con
    if (Math.random() < 1.0 * deltaTime) { 
        let imgThu = khoAnhThu[Math.floor(Math.random() * khoAnhThu.length)];
        
        danhSachTrangTri.push({
            x: Math.random() * canvas.width,
            y: -100,
            img: imgThu,
            width: 60, // Kích thước thú cố định (hoặc random ít thôi)
            height: 60,
            tocDo: GAME_SPEED * 1.2, // MẸO: Cho thú chạy nhanh hơn nền một chút cho sinh động
            gocXoay: Math.random() * Math.PI * 2
        });
    }

    // C. VẼ TẤT CẢ (Chung một vòng lặp cho nhẹ máy)
    for (let i = 0; i < danhSachTrangTri.length; i++) {
        let vat = danhSachTrangTri[i];
        vat.y += vat.tocDo * deltaTime; // Dùng tốc độ riêng của từng loại
        
        if (vat.img && vat.img.complete) {
          ctx.save();
          // 2. Dời điểm vẽ đến GIỮA TÂM của vật thể (để xoay quanh tâm, không phải xoay quanh góc)
          ctx.translate(vat.x + vat.width / 2, vat.y + vat.height / 2);
          // 3. Xoay bút vẽ theo góc đã random
          ctx.rotate(vat.gocXoay);
          ctx.drawImage(vat.img, -vat.width/2, -vat.height/2, vat.width, vat.height);
          ctx.restore();
        }
    }

    // --- B. XỬ LÝ BƯỚM VỖ CÁNH ---
    // Cập nhật vị trí bướm (Chỉ cho phép di chuyển TRÁI/PHẢI và LÊN/XUỐNG trong khung hình)
    buom.x += BUTTERFLY_SPEED * joystickData.x * deltaTime;
    buom.y -= BUTTERFLY_SPEED * joystickData.y * deltaTime;

    // Giới hạn màn hình
    if(buom.x < 0) buom.x = 0;
    if(buom.x > canvas.width) buom.x = canvas.width;
    if(buom.y < 0) buom.y = 0;
    if(buom.y > canvas.height) buom.y = canvas.height;
    
    // Tính toán hiệu ứng vỗ cánh (Co dãn chiều rộng theo hàm Sin)
    buom.flapTimer += deltaTime * 15; // Tốc độ đập cánh (số càng to đập càng nhanh)
    // Scale chạy từ 0.6 đến 1.0 (Lúc nhỏ nhất là cụp cánh, lúc 1 là xòe cánh)
    let wingScale = 0.8 + 0.2 * Math.sin(buom.flapTimer); 
    
    // Vẽ bướm với chiều rộng thay đổi
    if (imgBuom.complete) {
        let currentWidth = 50 * wingScale; // Chiều rộng lúc vỗ
        let offset = (50 - currentWidth) / 2; // Để giữ bướm ở giữa tâm
        ctx.drawImage(imgBuom, buom.x - 25 + offset, buom.y - 25, currentWidth, 50);
    }

    // --- C. XỬ LÝ CÂY (Vật cản gắn chặt với mặt đất) ---
    // Tỉ lệ cây xuất hiện
    if (Math.random() < 1.5 * deltaTime) { 
        danhSachCay.push({
            x: Math.random() * canvas.width,
            y: -150, // Xuất hiện từ xa tít phía trên
            width: canvas.width * 0.18, // Cây to hơn một chút
            height: canvas.width * 0.18
        });
    }

    for (let i = 0; i < danhSachCay.length; i++) {
        let c = danhSachCay[i];
        
        // QUAN TRỌNG: Cây di chuyển cùng tốc độ với nền (GAME_SPEED)
        // Tạo cảm giác cây cối đứng yên dưới đất, còn bướm bay qua
        c.y += GAME_SPEED * deltaTime;
        
        if (imgCay.complete) ctx.drawImage(imgCay, c.x, c.y, c.width, c.height);

        // Xử lý va chạm
        let dist = Math.hypot(buom.x - (c.x + c.width/2), buom.y - (c.y + c.height/2));
        // Thu nhỏ vùng va chạm một chút (c.width/3) để game dễ thở hơn
        if (dist < (buom.banKinh + c.width/3.5)) {
             ketThucGame();
        }
    }

    // Xóa cây đã trôi qua khỏi màn hình
    if (danhSachCay.length > 0 && danhSachCay[0].y > canvas.height) {
        danhSachCay.shift();
    }

    requestAnimationFrame(update);
}

function ketThucGame() {
    gameOver = true;
    setTimeout(() => {
        alert("CHÚC MỪNG BẠN, THUA SẶC MÁU RỒI");
        location.reload();
    }, 100);
}

requestAnimationFrame(update);
