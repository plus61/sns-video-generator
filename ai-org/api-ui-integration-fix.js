// API-UI統合修正スクリプト（8行以内の関数で構成）

// 1. 統一APIレスポンス（3行）
export const apiResponse = {
  success: (data) => Response.json({ success: true, data, timestamp: new Date().toISOString() }),
  error: (message, status = 400) => Response.json({ success: false, error: message }, { status })
};

// 2. APIクライアント（5行）
export const apiClient = async (endpoint, options = {}) => {
  try {
    const res = await fetch(`/api/${endpoint}`, { headers: { 'Content-Type': 'application/json' }, ...options });
    return await res.json();
  } catch (error) { return { success: false, error: error.message }; }
};

// 3. エラーハンドラー（4行）
export const withErrorHandler = (handler) => async (req) => {
  try { return await handler(req); }
  catch (error) { return apiResponse.error(error.message || 'Internal server error', 500); }
};

// 4. 認証チェック（6行）
export const requireAuth = (handler) => async (req) => {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return apiResponse.error('Unauthorized', 401);
  // TODO: 実際のトークン検証
  return handler(req);
};

// 5. CORS設定（5行）
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// 6. 使用例: 統合されたAPIルート（8行）
export const exampleRoute = withErrorHandler(async (req) => {
  const { method } = req;
  if (method === 'GET') return apiResponse.success({ message: 'Hello API' });
  if (method === 'POST') {
    const body = await req.json();
    return apiResponse.success({ received: body });
  }
  return apiResponse.error('Method not allowed', 405);
});

// 7. フロントエンド使用例（5行）
export const useApi = (endpoint) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const fetch = async (options) => { setLoading(true); const res = await apiClient(endpoint, options); setData(res); setLoading(false); };
  return { data, loading, fetch };
};