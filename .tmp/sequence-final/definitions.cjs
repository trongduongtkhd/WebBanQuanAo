// Functional sequence diagrams consolidated from the source-reviewed 97 interactions.
// UI Form names are analysis labels explicitly requested by the report author.
const diagrams=[];
const m=(a,b,t)=>({k:'m',a,b,t}),r=(a,b,t)=>({k:'r',a,b,t});
const c=t=>m(3,3,t),st=(kind,t)=>({k:'start',kind,t}),alt=t=>st('alt',t),opt=t=>st('opt',t),el=t=>({k:'else',t}),end=()=>({k:'end'});
const query=(what,sql='SELECT dữ liệu tương ứng')=>[m(3,4,what),m(4,5,sql)];
const save=(sql='Lưu các bản ghi thay đổi',method='SaveChangesAsync()')=>[m(3,4,method),m(4,5,sql)];
const atomic=sql=>[m(3,4,'Lưu trong giao dịch'),m(4,5,sql+'; COMMIT')];
const begin=(action='Chọn thao tác',request='Gửi yêu cầu tương ứng',method='Xử lý theo thao tác')=>[m(0,1,action),m(1,2,request),m(2,3,method)];
const finish=(result='Kết quả xử lý',http='200 OK + ApiResponse',display='Hiển thị kết quả')=>[r(3,2,result),r(2,1,http),r(1,0,display)];
function add(id,title,form,controller,service,events,options={}){const d={id,code:String(id).padStart(2,'0'),title,form,controller,service,actor:options.admin?'Quản trị viên':'Khách hàng',pre:options.admin?'Đã đăng nhập với quyền Admin.':'Luồng hợp lệ; yêu cầu có bảo vệ phải đăng nhập.',events,...options};diagrams.push(d);return d;}

add(1,'Luồng xử lý chung của hệ thống','SystemForm','Controller','Service',[
 ...begin('Chọn chức năng','Gửi yêu cầu HTTP','Thực hiện nghiệp vụ'),
 ...query('Truy vấn qua AppDbContext'),c('Kiểm tra và xử lý nghiệp vụ'),
 opt('Cần ghi dữ liệu'),...save(),end(),...finish('DTO kết quả')
],{actor:'Người dùng',pre:'Sơ đồ kiến trúc tổng quát; các sơ đồ sau sử dụng tên lớp cụ thể.'});

add(2,'Đăng ký tài khoản','RegisterForm','AuthController','AuthService',[
 m(0,1,'Nhập thông tin đăng ký'),m(1,2,'POST auth/register'),
 m(2,2,'Xác minh CAPTCHA; lỗi hoặc không xác minh được thì dừng'),
 m(2,3,'RegisterAsync(dto)'),...query('Kiểm tra email và role','SELECT User / Role Customer'),
 c('Email chưa dùng; chuẩn hóa, băm BCrypt; tạo User và UserRole'),
 ...save('INSERT User và UserRole'),c('Tạo JWT qua TokenService'),r(3,2,'AuthResponseDto'),
 m(2,6,'IssueAsync(userId)'),m(6,4,'Lưu refresh token đã băm'),m(4,5,'INSERT RefreshToken'),r(6,2,'Refresh token mới'),
 m(2,2,'Đặt cookie HttpOnly'),r(2,1,'201 Created + phiên'),r(1,0,'Đăng ký và đăng nhập')
],{extra:[{name:': RefreshTokenService',type:'control'}],sources:{AuthService:['RegisterAsync'],RefreshTokenService:['IssueAsync']},pre:'Chưa có tài khoản; thông tin và CAPTCHA hợp lệ.'});

add(3,'Đăng nhập tài khoản','LoginForm','AuthController','AuthService',[
 m(0,1,'Nhập email, mật khẩu'),m(1,2,'POST auth/login'),m(2,2,'Xác minh CAPTCHA; token bị từ chối thì dừng'),
 m(2,3,'LoginAsync(dto, ip)'),...query('Tìm User kèm vai trò','SELECT User / UserRole / Role'),
 c('Kiểm tra khóa, mật khẩu BCrypt và trạng thái tài khoản'),
 opt('Tài khoản bật 2FA'),m(3,6,'Tạo challenge đăng nhập'),m(6,4,'Lưu hash và hạn challenge'),m(4,5,'INSERT TwoFactorChallenge'),r(6,3,'Challenge'),r(3,2,'Yêu cầu xác minh 2FA'),r(2,1,'Hiển thị ô nhập mã'),m(0,1,'Nhập TOTP / mã dự phòng'),m(1,2,'POST two-factor/verify hoặc recovery'),m(2,6,'Xác minh và tiêu thụ mã'),m(6,4,'Xác minh nguyên tử'),m(4,5,'Giữ lượt thử; tiêu thụ mã và challenge; reset lỗi'),r(6,2,'Kết quả xác minh'),m(2,3,'Tạo phiên cho user đã xác minh'),end(),
 c('Tạo JWT qua TokenService'),r(3,2,'AuthResponseDto'),m(2,2,'Cấp refresh cookie qua RefreshTokenService'),r(2,1,'200 OK + phiên'),r(1,0,'Đăng nhập thành công')
],{extra:[{name:': TwoFactorService',type:'control'}],sources:{AuthService:['LoginAsync','CreateAuthResponseForUserAsync'],TwoFactorService:['CreateLoginChallengeAsync','VerifyLoginCodeAsync','VerifyLoginRecoveryCodeAsync']},pre:'Tài khoản hợp lệ; nếu bật 2FA phải xác minh thêm. CAPTCHA không khả dụng được xử lý theo failOpen của đăng nhập.'});

add(4,'Quên và đặt lại mật khẩu','PasswordResetForm','AuthController','AuthService',[
 ...begin('Chọn quên / đặt lại','POST yêu cầu mật khẩu','Gọi phương thức tương ứng'),
 alt('Quên mật khẩu'),...query('Tìm User theo email'),opt('Tài khoản hoạt động'),c('Sinh reset token có hạn 30 phút'),...save('UPDATE token và thời hạn'),m(3,6,'Gửi liên kết qua email'),end(),
 el('Đặt lại mật khẩu'),...query('Tìm User theo reset token'),c('Token còn hạn; băm mật khẩu mới; xóa token'),...atomic('UPDATE mật khẩu; thu hồi refresh token'),end(),
 ...finish('Đã tiếp nhận / đặt lại xong','200 OK + ApiResponse','Thông báo kết quả; đăng nhập lại khi đổi mật khẩu')
],{extra:[{name:': EmailService',type:'control'}],sources:{AuthService:['ForgotPasswordAsync','ResetPasswordAsync']},pre:'Email hoặc reset token hợp lệ. Phản hồi quên mật khẩu không tiết lộ email có tồn tại.'});

add(5,'Quản lý phiên đăng nhập','SessionForm','AuthController','RefreshTokenService',[
 ...begin('Làm mới phiên / đăng xuất','POST refresh / logout','RotateAsync / RevokeFamilyAsync'),
 ...query('Tra token theo hash'),c('Kiểm tra thời hạn, trạng thái user và họ phiên'),
 alt('Làm mới phiên'),c('Token hợp lệ; tạo token cùng họ và hạn cũ'),...atomic('INSERT token mới; thu hồi token cũ có điều kiện'),r(3,2,'User và refresh token mới'),m(2,2,'AuthService tạo JWT; thay refresh cookie'),
 el('Đăng xuất'),...save('UPDATE thu hồi họ refresh token','ExecuteUpdateAsync()'),r(3,2,'Đã thu hồi phiên'),m(2,2,'Xóa refresh cookie'),end(),r(2,1,'200 OK + kết quả'),r(1,0,'Cập nhật trạng thái phiên')
],{sources:{RefreshTokenService:['RotateAsync','RevokeFamilyAsync']},pre:'Trình duyệt gửi cookie. Token lỗi bị từ chối; tái sử dụng ngoài grace có thể thu hồi họ phiên.'});

add(6,'Thiết lập xác thực hai lớp','TwoFactorForm','TwoFactorController','TwoFactorService',[
 ...begin('Chọn thiết lập / bật / tắt','POST users/two-factor/...','GetSetupAsync / EnableAsync / DisableAsync'),
 ...query('Đọc User và dữ liệu 2FA'),
 alt('Bắt đầu thiết lập'),c('Chưa bật 2FA; tạo và bảo vệ secret mới'),...save('UPDATE secret đang thiết lập'),
 el('Xác nhận bật 2FA'),c('Xác minh TOTP; tạo các mã khôi phục'),...atomic('Bật 2FA; lưu hash mã; thu hồi mọi refresh token'),
 el('Tắt 2FA'),c('Kiểm tra mật khẩu và TOTP / mã khôi phục'),...atomic('Xóa challenge, mã, secret; tắt 2FA; reset lỗi'),end(),
 ...finish('QR / mã khôi phục / kết quả')
],{sources:{TwoFactorService:['GetSetupAsync','EnableAsync','DisableAsync']},pre:'Đã đăng nhập. Mã khôi phục thô chỉ trả khi bật 2FA; tắt 2FA không thu hồi các phiên đang sống.'});

add(7,'Tra cứu và xem sản phẩm','ProductForm','ProductsController','StorefrontService',[
 ...begin('Tìm kiếm / chọn sản phẩm','GET api/products/...','Gọi truy vấn tương ứng'),
 alt('Tìm kiếm và lọc'),c('Chuẩn hóa trang; áp từ khóa, danh mục, hãng, màu, size và giá'),...query('Đếm và lấy trang sản phẩm','SELECT COUNT; SELECT trang theo bộ lọc'),
 el('Nổi bật / mới / liên quan'),...query('Lấy tập sản phẩm tương ứng'),
 el('Xem chi tiết'),...query('Tìm sản phẩm theo slug','SELECT sản phẩm, biến thể và ảnh'),c('Sản phẩm hoạt động; nếu không trả 404'),end(),
 c('Ánh xạ DTO; tính giá và khả dụng của biến thể'),...finish('Danh sách / chi tiết sản phẩm')
],{pre:'Không bắt buộc đăng nhập; chỉ trả sản phẩm được công khai.',sources:{StorefrontService:['GetProductsAsync','GetProductBySlugAsync','GetFeaturedProductsAsync','GetNewArrivalProductsAsync','GetRelatedProductsAsync']}});

// 08 is populated from the exact approved CartForm builder, preserving its 22 messages.
add(8,'Quản lý giỏ hàng','CartForm','CartController','CartService',[],{approvedCart:true,pre:'Đã đăng nhập; luồng hợp lệ; mỗi yêu cầu chọn một thao tác.',sources:{CartService:['GetMyCartAsync','AddItemAsync','UpdateItemAsync','DeleteItemAsync','ClearCartAsync']}});

add(9,'Quản lý danh sách yêu thích','WishlistForm','WishlistController','WishlistService',[
 ...begin('Xem / thêm / bỏ yêu thích','Gửi yêu cầu wishlist','Gọi phương thức tương ứng'),...query('Đọc danh sách hoặc bản ghi theo user'),
 alt('Xem danh sách'),c('Ánh xạ dữ liệu sản phẩm yêu thích'),
 el('Thêm yêu thích'),c('Sản phẩm đang bán và chưa được yêu thích'),...save('INSERT WishlistItem'),
 el('Bỏ yêu thích'),c('Bản ghi thuộc user và tồn tại'),...save('DELETE WishlistItem'),end(),...finish('Danh sách / kết quả thao tác')
],{sources:{WishlistService:['GetMyWishlistAsync','AddItemAsync','RemoveItemAsync']}});

add(10,'Quản lý hồ sơ và mật khẩu','ProfileForm','UsersController / AuthController','UserProfileService / AuthService',[
 ...begin('Xem / sửa hồ sơ / đổi mật khẩu','Gửi yêu cầu hồ sơ','Gọi phương thức tương ứng'),...query('Đọc User theo userId'),
 alt('Xem hồ sơ'),c('Tạo ProfileDto'),
 el('Thông tin tài khoản'),c('Đọc vai trò và tạo CurrentUserDto qua AuthService'),
 el('Cập nhật hồ sơ'),c('Cập nhật họ tên, SĐT, giới tính và URL avatar; giữ email'),...save('UPDATE User'),
 el('Đổi mật khẩu'),c('Mật khẩu cũ đúng; mật khẩu mới khác; băm BCrypt'),...atomic('UPDATE mật khẩu; thu hồi mọi refresh token'),end(),...finish('Hồ sơ / kết quả xử lý')
],{sources:{UserProfileService:['GetProfileAsync','UpdateProfileAsync','ChangePasswordAsync'],AuthService:['GetCurrentUserAsync']},pre:'Đã đăng nhập. Chọn UsersController và UserProfileService cho hồ sơ; AuthController và AuthService cho auth/me. Upload avatar được mô tả riêng.'});

add(11,'Quản lý địa chỉ giao hàng','AddressForm','AddressesController','AddressService',[
 ...begin('Chọn thao tác địa chỉ','Gửi yêu cầu địa chỉ','Gọi phương thức tương ứng'),...query('Đọc địa chỉ của user'),
 alt('Xem danh sách'),c('Ánh xạ AddressDto'),
 el('Thêm / sửa'),c('Kiểm tra quyền sở hữu; địa chỉ đầu là mặc định; điều chỉnh cờ mặc định'),...save('INSERT / UPDATE Address'),
 el('Chọn mặc định'),...atomic('Bỏ cờ cũ; đặt địa chỉ được chọn làm mặc định'),
 el('Xóa địa chỉ'),c('Nếu xóa mặc định, chọn địa chỉ mới nhất còn lại'),...atomic('DELETE Address; cập nhật mặc định khi cần'),end(),...finish('Danh sách / kết quả xử lý')
],{sources:{AddressService:['GetMyAddressesAsync','CreateAsync','UpdateAsync','SetDefaultAsync','DeleteAsync']}});

add(12,'Xem và áp dụng mã giảm giá','CouponForm','CouponsController','CouponService',[
 ...begin('Xem ưu đãi / nhập mã','GET ưu đãi / POST validate','Gọi phương thức tương ứng'),
 alt('Xem mã khả dụng'),...query('Lọc mã và lịch sử dùng của user'),c('Tạo danh sách ưu đãi khả dụng'),
 el('Kiểm tra mã cho giỏ'),...query('Đọc mã, phạm vi và dòng giỏ'),
 el('Kiểm tra cho mua ngay'),...query('Đọc mã, phạm vi và biến thể'),end(),
 c('Khi kiểm tra: xét hạn, giới hạn dùng, giá trị đơn và phạm vi'),c('Tính số tiền giảm hợp lệ; chưa ghi lượt dùng'),...finish('Ưu đãi / CouponValidateResult')
],{sources:{CouponService:['GetAvailableForUserAsync','ValidateForCartAsync']},pre:'Đã đăng nhập. ValidateForCartAsync xử lý cả giỏ và BuyNowItem. OrderService kiểm tra lại và ghi lượt dùng khi tạo đơn.'});

add(13,'Tạo đơn hàng','CheckoutForm','OrdersController','OrderService',[
 ...begin('Xác nhận đặt hàng','POST api/orders','CreateAsync(userId, dto)'),
 ...query('Đọc và khóa dữ liệu trong giao dịch','BEGIN; SELECT địa chỉ, giỏ / biến thể và coupon'),
 c('Đúng người dùng; còn bán; đủ tồn; tính giá, phí và kiểm tra lại coupon'),
 alt('Mua từ giỏ'),c('Lấy các dòng được đặt; đánh dấu xóa chúng khỏi giỏ'),
 el('Mua ngay'),c('Dùng biến thể và số lượng gửi lên; giữ nguyên giỏ'),end(),
 c('Tạo Order, OrderItem chốt giá / vốn; trừ tồn và ghi lượt coupon'),
 c('Tạo Payment và lịch sử; chọn COD / MockQR / VNPAY'),
 ...save('INSERT đơn, chi tiết, payment, lịch sử; UPDATE kho / coupon; COMMIT'),
 ...query('Đọc chi tiết đơn mới'),...finish('OrderDetailDto','201 Created + ApiResponse','Hiển thị đơn và bước thanh toán')
],{sources:{OrderService:['CreateAsync']},pre:'Đã đăng nhập; địa chỉ và dữ liệu đặt hàng hợp lệ. Có lỗi thì rollback toàn bộ giao dịch.'});

add(14,'Thanh toán QR mô phỏng','MockQrForm','OrdersController','OrderService',[
 ...begin('Lấy QR / xác nhận đã trả','GET mock-qr / POST xác nhận','GetMockQrAsync / ConfirmMockQrAsync'),...query('Đọc đơn và Payment của user'),
 c('Kiểm tra chủ đơn, phương thức MockQR và trạng thái cho phép'),
 alt('Lấy QR thanh toán'),c('Tạo dữ liệu QR mô phỏng'),
 el('Xác nhận thanh toán'),c('Ghi Paid, thời điểm và mã giao dịch'),...save('UPDATE Payment và Order'),end(),...finish('QR / chi tiết đơn')
],{sources:{OrderService:['GetMockQrAsync','ConfirmMockQrAsync']},pre:'Đã đăng nhập. MockQR là chức năng mô phỏng, không phải callback của cổng VNPAY.'});

add(15,'Thanh toán qua VNPAY','VnpayForm','VnpayController','VnpayService',[
 ...begin('Chọn thanh toán VNPAY','POST tạo payment-url','CreatePaymentUrlAsync'),
 ...query('Khóa và kiểm tra đơn','BEGIN; SELECT Order, Payment và Attempt'),
 c('Đơn thuộc user, Pending, chưa trả; kiểm tra hạn và đối soát'),
 alt('Có attempt tái dùng'),c('Lấy URL của attempt còn hạn'),el('Cần attempt mới'),c('Tạo attempt, ký URL và đặt hạn'),...save('Lưu attempt và trạng thái; COMMIT'),end(),r(3,2,'URL có chữ ký'),r(2,1,'URL thanh toán'),m(1,6,'Mở cổng thanh toán'),
 st('loop','Mỗi callback được nhận'),m(6,2,'IPN / ReturnUrl'),m(2,3,'HandleIpnAsync / HandleReturnAsync'),c('Xác minh chữ ký, merchant, tiền và mã giao dịch; Return dùng chung cơ chế IPN'),...atomic('Khóa, chống lặp; cập nhật Attempt, Payment và Order'),r(3,2,'RspCode / URL kết quả'),alt('Callback IPN'),r(2,6,'200 OK + RspCode'),el('Callback ReturnUrl'),r(2,1,'Redirect tới trang kết quả'),end(),end(),
 m(1,2,'GET trạng thái của đơn'),m(2,3,'GetStatusAsync'),...query('Đọc trạng thái thực trong DB'),...finish('VnpayStatusDto')
],{extra:[{name:': VNPAY',type:'object'}],sources:{VnpayService:['CreatePaymentUrlAsync','HandleIpnAsync','HandleReturnAsync','GetStatusAsync']},pre:'Đã đăng nhập khi tạo URL hoặc xem trạng thái. IPN và Return có thể đến theo thứ tự khác nhau; xử lý phải chống lặp.'});

add(16,'Đối soát giao dịch VNPAY','VnpayReconcileForm','VnpayController / AdminVnpayController','VnpayService',[
 ...begin('Yêu cầu xem / đối soát','Gửi yêu cầu theo vai trò','ReconcileAsync / xem danh sách'),
 opt('Quản trị xem danh sách'),m(2,4,'Đọc đơn, chủ đơn, attempt'),m(4,5,'SELECT dữ liệu quản trị'),end(),
 ...query('Đọc đơn và attempt cần kiểm tra'),c('Đúng chủ đơn / quyền Admin; kiểm tra khoảng chờ 5 phút'),
 ...save('Lưu thời điểm đối soát'),m(3,6,'Gửi QueryDR'),r(6,3,'Kết quả có chữ ký'),
 c('Xác minh phản hồi'),...query('Khóa và đọc lại attempt','BEGIN; SELECT trạng thái mới nhất'),
 c('Chống ghi đè kết quả thành công; xác định Paid / lỗi / cần xem lại'),...save('Cập nhật Attempt, Payment và Order; COMMIT'),...finish('Trạng thái sau đối soát')
],{extra:[{name:': VNPAY QueryDR',type:'object'}],sources:{VnpayService:['ReconcileAsync']},pre:'QueryDR gọi ra ngoài giao dịch cập nhật. Quản trị dùng chủ đơn thật khi gọi VnpayService.'});

add(17,'Xử lý đơn VNPAY hết hạn',null,null,'VnpayService',[
 m(0,1,'ProcessExpiredOrdersAsync'),m(1,2,'Tìm đơn Pending đã hết hạn'),m(2,3,'SELECT đơn VNPAY quá hạn'),
 st('loop','Mỗi đơn quá hạn'),m(1,1,'Đối soát trước khi hủy'),m(1,4,'QueryDR nếu cần'),r(4,1,'Kết quả đối soát'),
 m(1,2,'Khóa và đọc lại đơn'),m(2,3,'BEGIN; SELECT đơn và attempt'),
 opt('Có thể hủy an toàn'),m(1,1,'Chưa Paid; không còn attempt mở hoặc RequiresReview'),m(1,2,'Hủy đơn và hoàn dữ liệu'),m(2,3,'Hoàn kho / coupon; ghi lịch sử; COMMIT'),end(),end(),r(1,0,'Kết thúc lượt chạy')
],{lanes:[{name:': VnpayExpiryWorker',type:'control'},{name:': VnpayService',type:'control'},{name:': AppDbContext',type:'control'},{name:': SQL Server',type:'database'},{name:': VNPAY QueryDR',type:'object'}],sources:{VnpayService:['ProcessExpiredOrdersAsync']},pre:'Tác vụ nền chạy định kỳ. Đơn đã thanh toán hoặc còn giao dịch cần kiểm tra sẽ không bị hủy tùy tiện.'});

add(18,'Theo dõi và hủy đơn của khách','OrderForm','OrdersController','OrderService',[
 ...begin('Xem đơn / yêu cầu hủy','Gửi yêu cầu của chủ đơn','Gọi phương thức tương ứng'),...query('Lọc đơn theo userId'),
 alt('Danh sách / chi tiết'),c('Ánh xạ đơn, thanh toán và lịch sử'),
 el('Hủy đơn'),c('Chỉ Pending, chưa Paid; VNPAY không còn attempt mở / cần xem lại'),
 ...atomic('Hủy đơn; hoàn kho và lượt coupon; ghi lịch sử'),...query('Đọc chi tiết sau hủy'),end(),...finish('Danh sách / OrderDetailDto')
],{sources:{OrderService:['GetMyOrdersAsync','GetMyOrderByIdAsync','CancelAsync']}});

add(19,'Khách hàng yêu cầu trả hàng','ReturnRequestForm','OrdersController','OrderService',[
 ...begin('Nhập lý do trả hàng','POST yêu cầu trả hàng','CreateReturnRequestAsync'),...query('Đọc đơn, lịch sử và yêu cầu cũ'),
 c('Đúng chủ đơn; Completed và Paid; trong 7 ngày; chưa từng yêu cầu'),c('Lý do từ 10 đến 500 ký tự; tạo yêu cầu Pending'),
 ...save('INSERT ReturnRequest'),...query('Đọc chi tiết đơn mới'),...finish('OrderDetailDto','200 OK + ApiResponse','Hiển thị yêu cầu đang chờ duyệt')
],{sources:{OrderService:['CreateReturnRequestAsync']}});

add(20,'Đánh giá sản phẩm của khách','ReviewForm','ProductsController / ReviewsController','ReviewService',[
 ...begin('Xem / gửi / sửa / xóa đánh giá','Gửi yêu cầu review','Gọi phương thức tương ứng'),
 alt('Xem công khai'),...query('Kiểm tra sản phẩm; đếm và lấy trang review đã duyệt'),
 el('Xem đánh giá của tôi'),...query('Lọc Review theo userId'),
 el('Gửi / sửa / xóa'),...query('Đọc đơn đã mua và review liên quan'),c('Đúng chủ; tạo mới cần đơn Completed và chưa đánh giá dòng hàng đó'),
 c('Tạo / sửa: kiểm tra sao, nội dung và chờ duyệt; xóa: Remove'),...save('INSERT / UPDATE / DELETE Review'),end(),...finish('Trang đánh giá / kết quả')
],{sources:{ReviewService:['GetProductReviewsAsync','GetMyReviewsAsync','CreateAsync','UpdateAsync','DeleteAsync']},pre:'Xem công khai qua ProductsController; thao tác cá nhân qua ReviewsController và phải đăng nhập.'});

add(21,'Quản trị sản phẩm','AdminProductForm','AdminProductsController','ProductService',[
 ...begin('Xem / tạo / sửa / ngừng bán','Gửi yêu cầu quản trị sản phẩm','Gọi phương thức tương ứng'),...query('Đọc sản phẩm và dữ liệu kiểm tra'),
 alt('Xem danh sách / chi tiết'),c('Lọc, phân trang và ánh xạ ProductDto'),
 el('Tạo / sửa sản phẩm'),c('Kiểm tra tên, slug, giá và dữ liệu tham chiếu'),c('Mở bán lại: cần biến thể hoạt động và có tồn kho'),c('Tạo / cập nhật Product theo DTO'),
 el('Ngừng bán sản phẩm'),c('Đặt Product và mọi biến thể IsActive = false'),end(),
 opt('Thao tác ghi dữ liệu'),...save('INSERT / UPDATE Product và biến thể'),end(),...finish('Sản phẩm / kết quả thao tác')
],{admin:true,sources:{ProductService:['GetAllAsync','GetByIdAsync','CreateAsync','UpdateAsync','DeleteAsync']}});

add(22,'Quản trị biến thể sản phẩm','ProductVariantForm','AdminProductsController','ProductService',[
 ...begin('Tạo / sửa / ngừng bán biến thể','Gửi yêu cầu biến thể','Gọi phương thức tương ứng'),...query('Đọc Product, Variant, Color và Size'),
 c('Kiểm tra sản phẩm, tổ hợp màu / size, SKU và giá'),
 alt('Tạo biến thể'),c('Tạo Variant; tồn ban đầu bằng 0'),
 el('Sửa biến thể'),c('Cập nhật thông tin; không nhận tồn kho từ DTO'),
 el('Ngừng bán biến thể'),c('Đặt Variant.IsActive = false'),end(),...save('INSERT / UPDATE ProductVariant'),...finish('Biến thể / kết quả')
],{admin:true,sources:{ProductService:['CreateVariantAsync','UpdateVariantAsync','DeleteVariantAsync']},pre:'Đã đăng nhập với quyền Admin. Tồn kho được quản lý qua nghiệp vụ nhập kho và bán hàng.'});

add(23,'Upload và quản lý ảnh sản phẩm','ProductImageForm','AdminProductsController / UploadsController','ProductService',[
 m(0,1,'Chọn thao tác ảnh'),m(1,2,'Gửi yêu cầu tương ứng'),
 alt('Upload tệp ảnh'),m(2,2,'Kiểm tra thư mục, đuôi ảnh và giới hạn 5 MB'),m(2,6,'Tạo thư mục, tên GUID; ghi FileStream'),r(6,2,'URL ảnh đã lưu'),
 el('Thêm / sửa liên kết ảnh'),m(2,3,'CreateImageAsync / UpdateImageAsync'),...query('Đọc sản phẩm và ảnh liên quan'),c('Đúng sản phẩm; cập nhật URL, thứ tự và ảnh đại diện'),...save('INSERT / UPDATE ProductImage'),r(3,2,'Dữ liệu ảnh'),
 el('Xóa liên kết ảnh'),m(2,3,'DeleteImageAsync'),...query('Tìm ảnh của sản phẩm'),c('Đánh dấu xóa ProductImage'),...save('DELETE ProductImage'),r(3,2,'Đã xóa liên kết'),end(),r(2,1,'URL / kết quả thao tác'),r(1,0,'Cập nhật phần ảnh')
],{admin:true,extra:[{name:'wwwroot/uploads',type:'object'}],sources:{ProductService:['CreateImageAsync','UpdateImageAsync','DeleteImageAsync']},pre:'Admin upload JPG, JPEG, PNG hoặc WEBP. Lưu tệp và gắn URL vào sản phẩm là hai yêu cầu độc lập; xóa liên kết không xóa tệp vật lý.'});

// A single operation is selected at each request; shared reads depend on that operation.
function referenceData(id,title,form,ctrl,service,table,checks,remove){return add(id,title,form,ctrl,service,[
 ...begin('Xem / thêm / sửa / xóa','Gửi yêu cầu dữ liệu quản trị','Gọi phương thức tương ứng'),...query('Đọc bản ghi theo thao tác','SELECT '+table+' và dữ liệu kiểm tra'),
 alt('Xem dữ liệu'),c('Ánh xạ danh sách / chi tiết'),
 el('Thêm / sửa dữ liệu'),c(checks),c('Tạo / cập nhật theo DTO'),
 el('Xóa / ngừng sử dụng'),c(remove),end(),
 opt('Thao tác ghi dữ liệu'),...save('INSERT / UPDATE / DELETE theo thao tác'),end(),...finish('Dữ liệu / kết quả xử lý')
],{admin:true,sources:{[service]:['GetAllAsync','GetByIdAsync','CreateAsync','UpdateAsync','DeleteAsync']}});}
referenceData(24,'Quản trị danh mục','CategoryForm','AdminCategoriesController','CategoryService','Category','Kiểm tra slug, danh mục cha; không tự làm cha hoặc tạo vòng','Có danh mục con thì chặn; còn lại đặt IsActive = false');
referenceData(25,'Quản trị thương hiệu','BrandForm','AdminBrandsController','BrandService','Brand','Kiểm tra tên thương hiệu không trùng','Đặt Brand.IsActive = false');
referenceData(26,'Quản trị màu sắc','ColorForm','AdminColorsController','ColorService','Color','Kiểm tra tên màu không trùng','Remove Color; cơ sở dữ liệu kiểm tra ràng buộc tham chiếu');
referenceData(27,'Quản trị kích thước','SizeForm','AdminSizesController','SizeService','Size','Kiểm tra tên kích thước không trùng','Remove Size; cơ sở dữ liệu kiểm tra ràng buộc tham chiếu');
referenceData(28,'Quản trị nhà cung cấp','SupplierForm','AdminSuppliersController','SupplierService','Supplier','Kiểm tra thông tin nhà cung cấp theo DTO','Đặt Supplier.IsActive = false');

add(29,'Quản lý phiếu nhập kho','PurchaseOrderForm','AdminPurchaseOrdersController','PurchaseOrderService',[
 ...begin('Xem / lập / sửa / hủy phiếu','Gửi yêu cầu phiếu nhập','Gọi phương thức tương ứng'),...query('Đọc phiếu, NCC và biến thể'),
 alt('Xem phiếu'),c('Lọc, phân trang hoặc ánh xạ chi tiết'),
 el('Lập phiếu nhập'),c('NCC, biến thể và giá nhập hợp lệ; tạo chi tiết; cộng tồn, tính giá vốn'),
 el('Điều chỉnh phiếu'),c('Phiếu chưa hủy; hoàn nhập cũ rồi áp lượng và giá mới; tồn không âm'),
 el('Hủy phiếu'),c('Phiếu chưa hủy, đủ tồn để hoàn tác; trừ lượng nhập cũ và ghi lý do'),end(),
 opt('Lập / sửa / hủy phiếu'),...save('Lưu phiếu, chi tiết, tồn kho và giá vốn cùng một SaveChanges'),end(),...finish('Danh sách / chi tiết phiếu')
],{admin:true,sources:{PurchaseOrderService:['GetAllAsync','GetByIdAsync','CreateAsync','UpdateAsync','CancelAsync']}});

add(30,'Quản trị mã giảm giá','AdminCouponForm','AdminCouponsController','CouponService',[
 ...begin('Chọn thao tác mã giảm giá','Gửi yêu cầu quản trị coupon','Gọi phương thức tương ứng'),...query('Đọc Coupon, phạm vi và lịch sử'),
 alt('Xem mã / lịch sử dùng'),c('Lọc, phân trang và tạo DTO'),
 el('Thêm / sửa mã'),c('Kiểm tra mã trùng, thời gian, giá trị, giới hạn và phạm vi'),c('Tạo / cập nhật mã và liên kết áp dụng'),
 el('Bật / tắt mã'),c('Cập nhật IsActive'),end(),
 opt('Thao tác ghi dữ liệu'),...save('Lưu Coupon và các liên kết thay đổi'),end(),...finish('Dữ liệu / kết quả')
],{admin:true,sources:{CouponService:['GetAllAsync','GetByIdAsync','GetUsagesAsync','CreateAsync','UpdateAsync','UpdateStatusAsync']},pre:'Đã đăng nhập với quyền Admin. Các thao tác quản trị không tăng lượt dùng mã.'});

add(31,'Quản trị đơn hàng và thanh toán','AdminOrderForm','AdminOrdersController','AdminOrderService',[
 ...begin('Xem đơn / đổi trạng thái','Gửi yêu cầu quản trị đơn','Gọi phương thức tương ứng'),...query('Đọc đơn, thanh toán và dữ liệu liên quan'),
 alt('Xem danh sách / chi tiết'),c('Lọc và ánh xạ đơn, lịch sử, yêu cầu trả'),
 el('Đổi trạng thái đơn'),c('Kiểm tra bước chuyển, thanh toán và điều kiện VNPAY'),
 alt('Chọn Cancelled'),c('Chỉ từ Pending / Confirmed; hoàn kho, coupon; hoàn MockQR đã trả'),
 el('Chọn Completed'),c('Chỉ từ Shipping; COD ghi Paid, online đã Paid'),
 el('Confirmed / Shipping'),c('Chỉ sang bước kế tiếp từ Pending / Confirmed'),end(),
 c('Ghi trạng thái mới và lịch sử người thực hiện'),...atomic('Cập nhật đơn, thanh toán, kho, coupon và lịch sử'),
 el('Cập nhật thanh toán'),c('Không sửa VNPAY; không đặt Refunded; không áp đơn đã hủy / trả'),c('COD chỉ ghi Paid khi Completed'),...save('UPDATE Payment và Order'),end(),...finish('Danh sách / OrderDetailDto')
],{admin:true,sources:{AdminOrderService:['GetAllAsync','GetByIdAsync','UpdateOrderStatusAsync','UpdatePaymentStatusAsync']},pre:'Đã đăng nhập với quyền Admin. VNPAY phải Paid trước xử lý giao hàng; không hủy đơn VNPAY đã Paid hoặc Refunded vì chưa hỗ trợ hoàn qua cổng.'});

add(32,'Kiểm duyệt đánh giá','AdminReviewForm','AdminReviewsController','ReviewService',[
 ...begin('Xem / duyệt / ẩn đánh giá','Gửi yêu cầu kiểm duyệt','GetAllForAdminAsync / SetApprovalAsync'),...query('Đọc Review và dữ liệu hiển thị'),
 alt('Xem danh sách'),c('Lọc, đếm và phân trang đánh giá'),
 el('Duyệt / ẩn đánh giá'),c('Review tồn tại; cập nhật IsApproved'),...save('UPDATE Review'),end(),...finish('Trang review / kết quả')
],{admin:true,sources:{ReviewService:['GetAllForAdminAsync','SetApprovalAsync']}});

add(33,'Quản trị người dùng','UserForm','AdminUsersController','AdminUserService',[
 ...begin('Xem / khóa / mở tài khoản','Gửi yêu cầu quản trị user','Gọi phương thức tương ứng'),...query('Đọc User và các vai trò'),
 alt('Xem danh sách / chi tiết'),c('Lọc từ khóa, vai trò, trạng thái; tạo DTO'),
 el('Khóa / mở khóa'),c('User tồn tại; không tự khóa Admin đang dùng'),c('Đổi IsActive và UpdatedAt'),...save('UPDATE User'),opt('Khóa tài khoản'),m(3,6,'RevokeAllForUserAsync'),m(6,4,'Thu hồi refresh token'),m(4,5,'UPDATE RefreshToken'),end(),end(),...finish('Thông tin user / kết quả')
],{admin:true,extra:[{name:': RefreshTokenService',type:'control'}],sources:{AdminUserService:['GetAllAsync','GetByIdAsync','UpdateStatusAsync']}});

add(34,'Thống kê cửa hàng','DashboardForm','AdminDashboardController','AdminDashboardService',[
 ...begin('Chọn khoảng thời gian','GET api/admin/dashboard','GetAsync(query)'),
 c('FromDate ≤ ToDate; đổi mốc ngày Việt Nam sang UTC'),
 ...query('Tổng hợp đơn Completed','SUM TotalAmount và giá vốn theo thời gian'),
 c('Giá vốn ưu tiên UnitCost đã chốt; dự phòng giá vốn hiện tại'),c('Tính lợi nhuận và tỷ suất'),
 ...query('Đọc các chỉ số quản trị','COUNT / SELECT đơn, khách, tồn thấp và hàng bán chạy'),
 c('Tạo DashboardDto'),...finish('DashboardDto','200 OK + ApiResponse','Hiển thị chỉ số và biểu đồ')
],{admin:true,sources:{AdminDashboardService:['GetAsync']},pre:'Doanh thu lọc theo CreatedAt của đơn Completed. Tổng khách, tồn thấp và hàng bán chạy dùng phạm vi riêng trong truy vấn.'});

add(35,'Quản trị yêu cầu trả hàng','AdminReturnForm','AdminOrdersController','AdminOrderService',[
 ...begin('Duyệt / từ chối yêu cầu','Gửi quyết định trả hàng','ApproveReturnAsync / RejectReturnAsync'),...query('Đọc đơn, Payment và ReturnRequest'),
 c('Yêu cầu đang Pending; kiểm tra điều kiện và lý do xử lý'),
 alt('Chấp thuận trả hàng'),c('Chặn VNPAY vì chưa hỗ trợ hoàn qua cổng'),
 ...atomic('Hoàn kho; ghi Refunded, Returned, Approved và lịch sử'),
 el('Từ chối trả hàng'),c('Ghi Rejected, lý do, người xử lý và thời điểm'),...save('UPDATE ReturnRequest'),end(),
 ...query('Đọc chi tiết đơn sau xử lý'),...finish('OrderDetailDto')
],{admin:true,sources:{AdminOrderService:['ApproveReturnAsync','RejectReturnAsync']},pre:'Đã đăng nhập với quyền Admin. Từ chối không hoàn kho, không hoàn tiền và không chuyển đơn sang Returned.'});

add(36,'Trợ lý mua sắm','ChatForm','ChatController','ChatService',[
 ...begin('Nhập câu hỏi','POST api/chat','ReplyAsync(request)'),c('Chuẩn hóa và kiểm tra câu hỏi'),
 alt('Câu hỏi chính sách'),c('PolicyReply dùng quy định giao hàng, đổi trả và kích thước'),
 el('Tìm / so sánh sản phẩm'),...query('Đọc catalog công khai','SELECT sản phẩm, biến thể, danh mục, ảnh, màu và size'),
 m(3,6,'InterpretAsync(câu hỏi, catalog)'),m(6,6,'Gọi HTTP tới Ollama; phân tích phản hồi'),r(6,3,'Ý định và bộ lọc đã phân loại'),
 c('Áp bộ lọc trên dữ liệu thật; màu, size, giá cùng biến thể'),c('Chọn tối đa 5 sản phẩm và tạo câu trả lời'),end(),...finish('ChatResponseDto','200 OK + ApiResponse','Hiển thị câu trả lời và sản phẩm')
],{extra:[{name:': OllamaChatIntentClient',type:'control'}],sources:{ChatService:['ReplyAsync'],OllamaChatIntentClient:['InterpretAsync']},pre:'Nhánh chính sách không gọi SQL hoặc AI. AI không khả dụng trả lỗi; không tự chuyển sang kết quả tìm kiếm giả.'});

add(37,'Upload ảnh đại diện','AvatarForm','ProfileUploadsController',null,[
 m(0,1,'Chọn ảnh đại diện'),m(1,2,'POST api/uploads/avatar'),m(2,2,'Kiểm tra JPG / JPEG / PNG / WEBP; tệp không rỗng và ≤ 5 MB'),
 m(2,3,'Tạo thư mục và tên GUID'),m(2,3,'Ghi FileStream qua CopyToAsync'),r(3,2,'URL tệp đã lưu'),r(2,1,'UploadImageDto'),r(1,0,'Hiển thị / giữ URL để cập nhật hồ sơ')
],{lanes:[{name:'Khách hàng',type:'actor'},{name:': AvatarForm',type:'boundary'},{name:': ProfileUploadsController',type:'control'},{name:'wwwroot/uploads/avatars',type:'object'}],sources:{ProfileUploadsController:['UploadAvatar']},pre:'Đã đăng nhập. Upload lưu tệp trực tiếp; gắn AvatarUrl vào User là yêu cầu cập nhật hồ sơ riêng.'});

add(38,'Tra cứu dữ liệu công khai','CatalogForm / ApiClient','CategoriesController / BrandsController / ColorsController / SizesController','StorefrontService',[
 ...begin('Chọn dữ liệu cần tra cứu','GET API công khai tương ứng','Gọi phương thức tương ứng'),
 alt('Danh mục'),...query('Lấy danh mục đang hoạt động'),c('Dựng cây danh mục cha / con'),
 el('Thương hiệu'),...query('Lấy thương hiệu đang hoạt động'),
 el('Màu / kích thước'),...query('Đọc Colors / Sizes theo thứ tự'),
 el('Danh mục theo slug'),...query('Tìm danh mục theo slug'),c('Danh mục tồn tại và hoạt động; nếu không trả 404'),end(),...finish('Danh sách / chi tiết công khai')
],{sources:{StorefrontService:['GetCategoriesAsync','GetBrandsAsync','GetColorsAsync','GetSizesAsync','GetCategoryBySlugAsync']},pre:'Mỗi yêu cầu dùng Controller tương ứng. Các API màu, size và danh mục theo slug được mô tả như API hiện có; không khẳng định Angular gọi mọi endpoint.'});

module.exports={diagrams,m,r,c,st,alt,opt,el,end,query,save,atomic,begin,finish,add};
