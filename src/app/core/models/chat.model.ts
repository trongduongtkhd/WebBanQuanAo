export interface ChatVariant {
  color: string;
  size: string;
  stockQuantity: number;
  price: number;
}

export interface ChatProduct {
  productId: number;
  productName: string;
  slug: string;
  thumbnailUrl?: string | null;
  brandName?: string | null;
  categoryName: string;
  material?: string | null;
  description?: string | null;
  minPrice: number;
  maxPrice: number;
  variants: ChatVariant[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  products?: ChatProduct[];
}

export interface ChatReply {
  reply: string;
  products: ChatProduct[];
  suggestions: string[];
  usedAi: boolean;
}

export interface ChatRequest {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  productIds: number[];
  productSlug: string | null;
}
