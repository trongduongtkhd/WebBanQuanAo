// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api', // Backend chạy qua docker-compose (clothing-api)
  apiOrigin: 'http://localhost:8080', // Dùng để dựng URL ảnh trả về dạng đường dẫn tương đối (/uploads/...)
  // Site key Cloudflare Turnstile (công khai, khác secret key ở backend). Để trống thì form đăng nhập/đăng ký báo lỗi cấu hình.
  // Khóa thử nghiệm: 1x00000000000000000000AA (luôn đạt), 2x00000000000000000000AB (luôn trượt).
  turnstileSiteKey: '0x4AAAAAAFaY5MWqwzQyD6s4',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
