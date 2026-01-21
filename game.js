// 1. THIẾT LẬP MÀN HÌNH
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // Công cụ bút vẽ

// Đặt kích thước game bằng đúng màn hình điện thoại
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 2. TẢI HÌNH ẢNH (Thay thế hình vuông bằng hình thật)
const imgBuom = new Image(); imgBuom.src = 'assets/buom.png';
const imgCay = new Image(); imgCay.src = 'assets/cay.png';
const imgNen = new Image(); imgNen.src = 'assets/nen.png';

// 3. KHAI BÁO CÁC BIẾN (Dữ liệu game)
let buom = { 
    x: canvas.width / 2, // Vị trí ngang
    y: canvas.height - 150, // Vị trí dọc
    tocDo: 5, // Tốc độ bay
    banKinh: 20 // Độ to của bướm (để tính va chạm)
};

let danhSachCay = []; // Danh sách các cây đang rơi
let tocDoCay = 3; 
let joystickData = { x: 0, y: 0 }; // Lưu hướng điều khiển
let gameOver = false;

// 4. CẤU HÌNH JOYSTICK (Dùng thư viện Nipple.js)
var manager = nipplejs.create({
    zone: document.getElementById('zone_joystick'),
    mode: 'dynamic', // Loại joystick xuất hiện chỗ ngón tay chạm
    color: 'white'
});

// Lắng nghe khi người chơi kéo joystick
manager.on('move', function (evt, data) {
    // data.vector chứa hướng x và y (từ -1 đến 1)
    joystickData.x = data.vector.x;
    joystickData.y = data.vector.y;
});

// Khi thả tay ra, bướm dừng lại
manager.on('end', function () {
    joystickData.x = 0;
    joystickData.y = 0;
});

// 5. HÀM CHÍNH (Vòng lặp game - Chạy liên tục 60 lần/giây)
function update() {
    if (gameOver) return; // Nếu thua thì dừng lại

    // Xóa màn hình cũ để vẽ hình mới
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // -- VẼ NỀN --
    // Vẽ hình nền full màn hình (nếu chưa có ảnh thì vẽ màu xanh)
    ctx.drawImage(imgNen, 0, 0, canvas.width, canvas.height); 

    // -- XỬ LÝ BƯỚM --
    // Cập nhật vị trí bướm theo joystick
    buom.x += joystickData.x * buom.tocDo;
    buom.y -= joystickData.y * buom.tocDo; // Trừ y vì trong lập trình game, y càng nhỏ là càng lên cao

    // Giới hạn không cho bướm bay ra khỏi màn hình
    if(buom.x < 0) buom.x = 0;
    if(buom.x > canvas.width) buom.x = canvas.width;
    
    // Vẽ bướm
    ctx.drawImage(imgBuom, buom.x - 25, buom.y - 25, 50, 50); // Vẽ ảnh kích thước 50x50

    // -- XỬ LÝ CÂY --
    // Tạo cây mới ngẫu nhiên (tỉ lệ 2%)
    if (Math.random() < 0.02) {
        danhSachCay.push({
            x: Math.random() * canvas.width,
            y: -50, // Xuất hiện từ trên nóc màn hình
            width: 50,
            height: 50
        });
    }

    // Di chuyển và vẽ từng cây
    for (let i = 0; i < danhSachCay.length; i++) {
        let c = danhSachCay[i];
        c.y += tocDoCay; // Cây rơi xuống
        
        ctx.drawImage(imgCay, c.x, c.y, c.width, c.height);

        // Kiểm tra va chạm (Đơn giản hóa: khoảng cách giữa tâm bướm và cây)
        let khoangCachX = Math.abs(buom.x - (c.x + 25));
        let khoangCachY = Math.abs(buom.y - (c.y + 25));
        
        if (khoangCachX < 30 && khoangCachY < 30) {
            ketThucGame();
        }
    }

    requestAnimationFrame(update); // Gọi lại hàm này liên tục
}

function ketThucGame() {
    gameOver = true;
    alert("GAME OVER! Bạn đã đâm vào cây.");
    location.reload(); // Tải lại trang để chơi lại
}

// Bắt đầu game
update();