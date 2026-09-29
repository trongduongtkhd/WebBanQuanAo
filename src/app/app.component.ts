import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'shop-clothing-ui';

  constructor(router: Router) {
    // Một số trình duyệt/extension làm mất phần path của link đặt lại mật khẩu
    // trong email, chỉ giữ lại query string trên domain gốc. Nếu phát hiện
    // trường hợp này (đang ở "/" nhưng có "token" trên URL), tự điều hướng
    // sang đúng trang đặt lại mật khẩu để luồng vẫn hoạt động.
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token && window.location.pathname === '/') {
      router.navigate(['/auth/reset-password'], {
        queryParams: { token },
        replaceUrl: true,
      });
    }
  }
}
