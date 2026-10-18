// Số lượng tối đa của một dòng giỏ hàng (khớp [Range(1, 100)] ở backend).
export const MAX_CART_QUANTITY = 100;

export const CART_QUANTITY_RANGE_MESSAGE = 'Số lượng phải từ 1 đến 100.';

// Lấy thông báo lỗi từ phản hồi API: lỗi nghiệp vụ trả { message },
// lỗi validate của ASP.NET trả { errors: { Field: [msg] } }.
export function getApiErrorMessage(error: any, fallback: string): string {
  const body = error?.error;

  if (body?.message) {
    return body.message;
  }

  if (body?.errors) {
    const messages = Object.values(body.errors as Record<string, string[]>)
      .reduce((all, items) => all.concat(items), [] as string[]);

    if (messages.length > 0) {
      return messages[0];
    }
  }

  return fallback;
}
