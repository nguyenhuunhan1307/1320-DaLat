# Đà Lạt Sương Mù — v9 Open World Multiplayer

Bản nâng cấp giữ nguyên thế giới 3D, bản đồ, cảnh quan, hệ thống đi bộ, xe máy, ô tô, camper, thuyền, khách sạn/homestay, nhà hàng và câu cá của bản v8; bổ sung lớp Multiplayer mở rộng.

## Những phần đã bổ sung

- **Đồng bộ nhân vật:** vị trí, độ cao, hướng nhìn, chạy/ngồi/nằm, trang phục.
- **Đồng bộ phương tiện:** xe máy, ô tô, camper, thuyền; vị trí, hướng, độ nghiêng, tốc độ. Mỗi người chơi online có bản sao phương tiện riêng ở máy người xem để không ghi đè xe thuê của người chơi đó.
- **Đi chung xe:** người chơi có thể đứng gần xe do người khác lái rồi nhấn `G` hoặc nút **🚗 Đi cùng**. Ghế phụ được phân bổ theo trạng thái phòng; nhấn `F` để xuống. Người lái cần tiếp tục lái xe bình thường.
- **Voice Chat theo khoảng cách:** WebRTC audio, bật/tắt micro, bật/tắt loa, hiển thị trạng thái micro/đang nói, âm lượng giảm theo khoảng cách, tắt tiếng từng người ngay trong danh sách phòng.
- **Hoạt động nhóm:** trạng thái câu cá, thông báo bắt được cá, thông báo ghé khách sạn/homestay và tương tác tại địa điểm; đồng bộ trạng thái dựng trại trên camper.
- **Phòng online:** mặc định `dalat`, tối đa 64 kết nối/phòng (có thể đổi bằng `MAX_PLAYERS_PER_ROOM`).
- **Health endpoint:** `/health` để Render kiểm tra dịch vụ.

## Cấu trúc gói

- `Da-Lat-Suong-Mu-Cinematic-v8.html` — game client (mã nguồn nâng cấp v9, giữ tên file để tương thích đường dẫn hiện tại).
- `index.html` — trang vào game, tự gắn WebSocket server và mã phòng.
- `server.js` — WebSocket relay, room state, passenger seat validation, event relay và WebRTC signaling.
- `package.json`, `Procfile`, `render.yaml` — cấu hình deploy Render.

## Deploy máy chủ lên Render

1. Giải nén ZIP, đưa `server.js`, `package.json`, `Procfile` và `render.yaml` vào repository GitHub dành cho server.
2. Trên Render, tạo **New → Web Service**, kết nối repository.
3. Build Command: `npm install`.
4. Start Command: `npm start`.
5. Sau khi deploy, mở `https://TEN-MIEN-RENDER/health`. Kết quả phải có `"ok":true`.
6. Địa chỉ WebSocket sẽ là `wss://TEN-MIEN-RENDER/ws`.

Nếu dùng domain hiện tại, game đã mặc định trỏ tới:

`wss://one320-dalat.onrender.com/ws`

Nếu Render cấp domain khác, mở game với tham số:

`?server=wss%3A%2F%2FTEN-MIEN-RENDER%2Fws&room=dalat`

## Deploy game lên Vercel

1. Đưa `Da-Lat-Suong-Mu-Cinematic-v8.html` và `index.html` vào repository Vercel hiện tại.
2. Commit/push để Vercel deploy bản mới.
3. Đảm bảo Production Deployment Protection không yêu cầu đăng nhập đối với người chơi; domain production phải truy cập công khai.
4. Mở domain production bằng cửa sổ ẩn danh để kiểm tra.

## Cách kiểm tra Multiplayer

1. Mở game trên hai thiết bị/trình duyệt khác nhau.
2. Cả hai vào cùng room `dalat` và đặt hai tên khác nhau.
3. Di chuyển ở quảng trường: hai người phải nhìn thấy avatar nhau.
4. Người A lái xe máy/ô tô/thuyền: người B phải nhìn thấy đúng phương tiện và xe di chuyển theo.
5. Người B đứng gần xe A, bấm `G` hoặc **🚗 Đi cùng** để lên ghế trống; bấm `F` để xuống.
6. Hai người bật micro, cho phép quyền Microphone; thử nói chuyện khi đứng gần và di chuyển ra xa. Danh sách người chơi có thể chạm để tắt tiếng từng người.
7. Thử câu cá, bắt cá, ghé khách sạn và dựng trại camper để kiểm tra thông báo/trạng thái chung.

## Lưu ý kỹ thuật quan trọng

- Voice Chat dùng WebRTC peer-to-peer với STUN công khai. Cấu hình này có thể hoạt động trực tiếp giữa nhiều mạng, nhưng một số mạng NAT/firewall sẽ cần **TURN server** riêng để kết nối ổn định. Gói hiện tại chưa kèm dịch vụ TURN hoặc thông tin đăng nhập TURN.
- Người chơi cần mở game bằng HTTPS và cấp quyền micro. iPhone/Safari có thể yêu cầu thao tác chạm nút bật micro sau khi vào game.
- Server hiện là **room relay**, không phải máy chủ mô phỏng vật lý authoritative. Vị trí xe được người lái gửi lên và chuyển tiếp cho các máy khác; đây chưa phải hệ thống chống gian lận hoặc vật lý cạnh tranh thời gian thực.
- Ghế phụ online là avatar người chơi thật. Nút `R/T` thêm/bớt NPC trang trí được giữ cho chế độ offline; trong online, người chơi thật lên xe bằng `G`/nút **Đi cùng**.
- Các bảng đặt phòng/giá phòng trong game vẫn là dữ liệu minh họa. Bản nâng cấp chỉ chia sẻ hoạt động ghé thăm/tương tác, không tạo đặt phòng thật hay đồng bộ tồn phòng thương mại.
- Chưa có tài khoản, lưu tiến trình cloud, chat chữ, matchmaking toàn cầu hoặc quản trị/moderation.

## Phím điều khiển liên quan

- `WASD`: di chuyển / lái xe.
- `E`: tương tác hoặc lên xe người chơi gần nhất.
- `G`: lên/xuống xe cùng người chơi.
- `F`: xuống xe.
- `R/T`: thêm/bớt NPC trang trí khi offline.
- Nút `🎙 Bật micro`, `🔊 Âm thanh`: Voice Chat.

**Bản này đã được kiểm tra cú pháp JavaScript của game module và server. Cần deploy lên Vercel/Render và thử trên hai thiết bị thật để xác nhận kết nối WebSocket/WebRTC theo mạng đang sử dụng.**
