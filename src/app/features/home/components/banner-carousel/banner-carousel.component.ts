import { Component, OnDestroy, OnInit } from '@angular/core';

interface BannerSlide {
  imageUrl: string;
  alt: string;
  link: string;
  label?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
}

@Component({
  selector: 'app-banner-carousel',
  templateUrl: './banner-carousel.component.html',
  styleUrls: ['./banner-carousel.component.scss'],
})
export class BannerCarouselComponent implements OnInit, OnDestroy {
  readonly slides: BannerSlide[] = [
    {
      imageUrl: 'assets/images/banners/hero-banner.jpg',
      alt: 'Bộ sưu tập mới tại Clothing Store',
      link: '/products',
      label: 'NEW COLLECTION',
      title: 'Phong cách tạo nên dấu ấn riêng',
      subtitle:
        'Khám phá những thiết kế thời trang hiện đại tại Clothing Store.',
      ctaText: 'Mua sắm ngay',
    },
    {
      imageUrl: 'assets/images/banners/finalsale_topbanner_desktop-160926.webp',
      alt: 'Final Sale giá từ 149K',
      link: '/products',
    },
    {
      imageUrl: 'assets/images/banners/ao-gio_topbanner_desktop-180826.webp',
      alt: 'Bộ sưu tập áo gió đa năng',
      link: '/products',
    },
    {
      imageUrl: 'assets/images/banners/jeans_topbanner_desktop-110926a.webp',
      alt: 'Bộ sưu tập Jeans',
      link: '/products',
    },
  ];

  currentIndex = 0;

  private readonly intervalMs = 5000;
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  goTo(index: number): void {
    this.currentIndex = (index + this.slides.length) % this.slides.length;
  }

  next(): void {
    this.goTo(this.currentIndex + 1);
  }

  previous(): void {
    this.goTo(this.currentIndex - 1);
  }

  startAutoplay(): void {
    this.stopAutoplay();

    this.intervalId = setInterval(() => this.next(), this.intervalMs);
  }

  stopAutoplay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
