
// Cầu nối xác minh đơn hàng dịch vụ được chuyển sang từ photo-moments
// (giỏ hàng thanh toán online). Đơn được tạo/thanh toán bên photo-moments,
// app này chỉ xác minh trạng thái trước khi cho phép chụp.

const PHOTO_MOMENTS_GAS_URL = "https://script.google.com/macros/s/AKfycbxhpSv6qg4xyaQ6kh6yPa20x9pe2ldDBBM8euSJhxU_y9x70Ud1C2-CTdl57vUNKEhd/exec";

// Phải khớp với EXECUTION_API_KEY trong photo-moments/src/pages/Cart.tsx.
// Chuỗi ngẫu nhiên (KHÔNG phải Google API key thật) hardcode trực tiếp vì AI Studio
// Secrets không bơm biến VITE_*/REACT_APP_* vào bước build (chỉ dùng được cho biến
// đọc lúc runtime như GEMINI_API_KEY) — import.meta.env.VITE_SERVICE_ENTRY_API_KEY
// luôn ra rỗng trên bản deploy thật, dẫn tới lỗi "sai apiKey". An toàn để hardcode vì
// đây không phải credential thật nên Google sẽ không tự thu hồi khi lộ trong repo/bundle.
export const SERVICE_ENTRY_API_KEY = "428fb24038f3c73503f7342332431fdab5cbb94dcaefeabf";

export interface ServiceSessionToken {
  orderId: string;
  serviceCode: string;
  size: string;
  qty: number;
  timestamp: number;
}

export const decodeServiceToken = (token: string): ServiceSessionToken | null => {
  try {
    const decoded = JSON.parse(atob(token));
    if (!decoded || typeof decoded.orderId !== 'string') return null;
    return decoded as ServiceSessionToken;
  } catch (e) {
    console.error('decodeServiceToken failed:', e);
    return null;
  }
};

export const verifyOrderPaid = async (orderId: string): Promise<boolean> => {
  try {
    const response = await fetch(PHOTO_MOMENTS_GAS_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'get_orders' })
    });
    if (!response.ok) return false;
    const json = await response.json();
    if (json.status !== 'success' || !Array.isArray(json.data)) return false;
    const order = json.data.find((o: any) => String(o.id) === String(orderId));
    return !!order && order.status === 'paid';
  } catch (e) {
    console.error('verifyOrderPaid failed:', e);
    return false;
  }
};
