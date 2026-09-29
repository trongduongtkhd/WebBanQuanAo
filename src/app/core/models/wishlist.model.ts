import { PublicProduct } from './catalog.model';

export interface WishlistItem extends PublicProduct {
  createdAt: string;
}
