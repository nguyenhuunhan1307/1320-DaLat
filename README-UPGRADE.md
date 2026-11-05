# Đà Lạt Sương Mù — v10 Rental Fleet Multiplayer

Bản nâng cấp tiếp tục trên v9, bổ sung hệ thống thuê phương tiện qua NPC và tồn kho xe đồng bộ toàn phòng.

## Tính năng thuê xe mới

- **NPC thuê xe máy:** có nhân viên tại quầy; người chơi phải đến hỏi giá, chọn xe và xác nhận thuê.
- **Xe máy phân hạng:** xe tay ga phổ thông và mô tô thể thao, có mẫu 3D khác nhau.
- **NPC thuê ô tô:** sedan, hatchback, MPV 7 chỗ và SUV camping.
- **Giá thuê minh họa trong game:** tay ga 90.000đ/lượt; mô tô thể thao 220.000đ/lượt; hatchback 280.000đ/lượt; sedan 320.000đ/lượt; MPV 480.000đ/lượt; SUV camping 1.200.000đ/lượt (cao nhất).
- **Đồng bộ tồn kho:** máy chủ xác nhận quyền thuê theo từng ID xe; khi có người thuê, xe biến mất khỏi bãi trên tất cả máy người chơi trong cùng phòng. Những người khác không thể thuê trùng chiếc xe đó.
- **Trả xe tại NPC:** người chơi đi bộ về quầy thuê xe tương ứng, mở bảng giá và chọn “Trả xe đang thuê”. Xe được đưa về đúng vị trí bãi ban đầu và xuất hiện lại cho cả phòng.
- **Tự giải phóng khi mất kết nối:** nếu người thuê thoát game hoặc mất kết nối, máy chủ xóa quyền thuê để xe xuất hiện lại trong bãi.
- **Một phương tiện mỗi người:** người chơi cần trả xe hiện tại trước khi thuê xe khác.

> Giá hiện là giá hiển thị và xác nhận trong game; bản này chưa có ví tiền, số dư hoặc hệ thống trừ tiền/kiếm tiền.

## Những tính năng multiplayer kế thừa

- Đồng bộ nhân vật, vị trí, phương tiện đang lái, hành khách và hoạt động chung.
- Đi chung xe bằng `G`, xuống xe bằng `F`.
- Voice Chat WebRTC theo khoảng cách, bật/tắt micro và loa.
- Hoạt động nhóm, câu cá, thông báo ghé địa điểm, dựng trại camper.
- Phòng online mặc định `dalat`, tối đa 64 người.

## Cấu trúc gói

- `Da-Lat-Suong-Mu-Cinematic-v8.html` — game client (giữ tên file để tương thích URL hiện tại).
- `index.html` — trang vào game.
- `server.js` — WebSocket relay, xác nhận thuê/trả xe và quản lý tồn kho theo phòng.
- `package.json`, `Procfile`, `render.yaml` — cấu hình deploy Render.

## Deploy Render

1. Cập nhật repository máy chủ bằng `server.js`, `package.json`, `Procfile`, `render.yaml`.
2. Build Command: `npm install`; Start Command: `npm start`.
3. Kiểm tra `https://TEN-MIEN-RENDER/health` trả về `ok: true`.
4. WebSocket: `wss://TEN-MIEN-RENDER/ws`.

## Deploy Vercel

1. Cập nhật `Da-Lat-Suong-Mu-Cinematic-v8.html` và `index.html` trong repository Vercel.
2. Commit/push để deploy. Giữ nguyên tên HTML để link hiện tại không bị đổi.

## Kiểm tra đề xuất

1. Mở cùng room `dalat` trên hai thiết bị.
2. Thiết bị A đến NPC thuê xe máy, chọn một xe và xác nhận. Thiết bị B phải thấy đúng xe đó biến mất khỏi bãi; các xe còn lại vẫn còn.
3. Thiết bị B thử thuê cùng ID xe: máy chủ phải từ chối, nhưng cho thuê một xe khác còn trống.
4. Thiết bị A lái xe rời bãi, xuống xe; thiết bị B vẫn không thấy xe trong bãi.
5. Thiết bị A quay lại quầy, mở bảng giá và trả xe; cả hai thiết bị phải thấy xe xuất hiện lại đúng vị trí.
6. Thử thoát kết nối khi đang thuê: máy chủ giải phóng xe và phát trạng thái tồn kho mới.
7. Lặp lại với sedan, MPV và SUV camping; kiểm tra camping có giá cao nhất.

## Lưu ý kỹ thuật

- Máy chủ kiểm tra ID xe, quyền sở hữu, vị trí gần quầy và trạng thái đang lái trước khi chấp nhận thuê/trả.
- Nếu người chơi thuê xe, chiếc xe gốc bị ẩn ở các máy khác; bản sao xe của người lái vẫn được dựng theo trạng thái multiplayer. Khi trả hoặc người thuê mất kết nối, xe gốc được khôi phục ở vị trí bãi.
- Giá thuê chỉ là báo giá/xác nhận; chưa trừ tiền vì game chưa có hệ thống tiền tệ.
- Voice Chat vẫn dùng STUN công khai; một số mạng cần TURN server riêng.
- Đã kiểm tra cú pháp JavaScript của client module và server. Chưa deploy lên tài khoản Vercel/Render và chưa xác nhận bằng phiên chơi hai thiết bị thực tế.


## v11 — Thuê xe trực tiếp và hồi bãi sau 60 giây
- Bỏ tương tác NPC thuê xe; người chơi bấm Thuê xe ngay tại phương tiện.
- Xe thuê là một phiên bản phương tiện riêng; xe trong bãi xuất hiện lại sau 60 giây để người khác có thể thuê tiếp.
- Xe đã thuê vẫn tiếp tục di chuyển và đồng bộ online; trả xe bằng nút Trả xe sau khi xuống xe.
