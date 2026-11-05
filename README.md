# 1320-DaLat

Đà Lạt 3D thế giới mở, chạy ngay trên trình duyệt. Đi bộ quanh hồ Xuân Hương, đứng cạnh nụ atiso 15 m ở Quảng trường Lâm Viên, đạp vịt, thuê xe máy hoặc ô tô chạy qua đèo Prenn xuống hồ Tuyền Lâm, đặt phòng khách sạn hay homestay, câu cá và chụp ảnh.

![Ảnh xem trước](docs/preview.jpg)

## Chơi thử

Mở `index.html` bằng Chrome, Edge hoặc Safari bản mới. Trang tự tải three.js từ CDN nên máy cần có mạng.

| Phím | Tác dụng |
| --- | --- |
| W A S D / mũi tên | Đi bộ, lái xe |
| Shift | Chạy |
| Space | Nhảy · phanh tay · giật cần khi câu cá |
| E | Tương tác: thuê xe, lên thuyền, đặt phòng, câu cá |
| F | Xuống xe / lên bờ |
| C | Chụp ảnh |
| P | Mở album ảnh |
| Kéo chuột · cuộn | Xoay và zoom camera |

Trên điện thoại có cần điều khiển và các nút ảo. Máy yếu thì bấm **Đồ họa: Nhẹ**.

## Có gì trong game

- **Trung tâm:** hồ Xuân Hương, Quảng trường Lâm Viên (nụ atiso ~15 m, bông dã quỳ ~18 m), nhà thờ Con Gà, chợ Đà Lạt và chợ đêm, Thủy Tạ, ga Đà Lạt có tàu hơi nước chạy qua đường hầm.
- **Ngoại ô:** núi Langbiang, vườn nhà kính, đèo Prenn, thác Prenn, hồ Tuyền Lâm, Thiền viện Trúc Lâm.
- **Phương tiện:** thuyền thiên nga, xe máy, ô tô, có xe chạy trên đường và người đi dạo.
- **Lưu trú:** 3 khách sạn và 3 homestay, đặt phòng rồi ngủ tới sáng hôm sau. Tên và giá là hư cấu.
- **Hoạt động:** câu cá ở bờ hồ, chụp ảnh và xem lại trong album.
- **Thời tiết:** sáng sớm sương mù, trưa, hoàng hôn, đêm.

Công trình làm theo kích thước thật (1 đơn vị = 1 m), nhưng khoảng cách giữa các điểm được rút ngắn để đi lại nhanh. Vị trí là bố cục gần đúng, chưa lấy từ dữ liệu bản đồ.

## Đăng lên web miễn phí

- **GitHub Pages:** Settings → Pages → Source: `main` / `/ (root)`. Trang sẽ ở `https://nguyenhuunhan1307.github.io/1320-DaLat/`.
- **Vercel:** Import repo này, không cần cấu hình gì thêm. Ra địa chỉ dạng `ten-du-an.vercel.app`.
- **Netlify:** Kéo thả thư mục repo vào app.netlify.com/drop.

## Thư mục `unity/`

Ba script C# cho phiên bản Unity (Unity 2021.3 LTS trở lên, Input Manager cũ):

| Script | Việc làm | Đã sửa |
| --- | --- | --- |
| `PlayerInteraction.cs` | Nhấn E tương tác với quầy thuê xe, thuyền thiên nga, lễ tân, chỗ câu cá | Quét hình cầu quanh nhân vật thay cho tia từ giữa màn hình (tia 3 m không chạm được gì ở góc nhìn thứ ba); gọi `UnityEvent` để gắn UI trong Inspector; thêm gợi ý "Nhấn E…" |
| `FishingMiniGame.cs` | Câu cá: chờ 3–8 giây, có 1,5 giây để giật cần | Bản gốc bấm Space lúc nào cũng câu được cá; giờ phải đợi cá cắn. Dừng coroutine khi thôi câu. Thêm loại cá, cân nặng, sự kiện để thêm vào túi đồ |
| `PhotoCameraTool.cs` | Nhấn C chụp ảnh lưu PNG | Lưu vào `persistentDataPath` (bản gốc dùng `dataPath`, bị lỗi khi build); tự tạo RenderTexture nếu camera chưa có; giải phóng bộ nhớ; tên file theo ngày giờ |

Cách dùng: chép `unity/Assets/Scripts` vào thư mục `Assets` của dự án Unity. Tạo các tag `VehicleRental`, `SwanBoat`, `HotelReception`, `FishingSpot` (Project Settings → Tags and Layers) rồi gắn cho collider tương ứng.

Muốn có Đà Lạt thật tỉ lệ 1:1 thì dùng **Cesium for Unity** (hoặc Cesium for Unreal) để tải Google Photorealistic 3D Tiles. Cần tạo API key Google Maps Platform và tài khoản Cesium ion.
