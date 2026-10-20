export const environment = {
  production: true,
  apiUrl: '/api',
  apiOrigin: '', // Cùng origin với frontend, nginx đã proxy /uploads -> backend
  // Site key Cloudflare Turnstile (công khai). Bản docker build từ file này: đổi key thì phải build lại image frontend.
  // Khóa thử nghiệm: 1x00000000000000000000AA (luôn đạt), 2x00000000000000000000AB (luôn trượt).
  turnstileSiteKey: '0x4AAAAAAFaY5MWqwzQyD6s4',
};
