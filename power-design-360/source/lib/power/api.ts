import { calculate } from './engine.ts';
import { ENGINE_VERSION, specSchema } from './model.ts';
import {requirementsSchema} from './requirements.ts';
import {synthesize} from './synthesis.ts';

const LIMIT = 16_384;
const allowedOrigins = ['https://alger68.github.io'];
function headers(request: Request) {
  const h: Record<string, string> = {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Origin'};
  const origin = request.headers.get('Origin');
  if (origin && allowedOrigins.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}
export async function preflight(request: Request) {
  return new Response(null, {status: 204, headers: {...headers(request), 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}});
}
async function jsonRequest(request: Request, design=false): Promise<Response> {
  const reply = (body: unknown, status = 200) => Response.json(body, {status, headers: headers(request)});
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return reply({error: '請使用 JSON 格式。'}, 415);
  if (Number(request.headers.get('content-length')) > LIMIT) return reply({error: '輸入資料超過 16 KB。'}, 413);
  let text = '';
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply({error: '缺少輸入資料。'}, 400);
    const decoder = new TextDecoder();
    let size = 0;
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > LIMIT) {await reader.cancel(); return reply({error: '輸入資料超過 16 KB。'}, 413);}
      text += decoder.decode(value, {stream: true});
    }
    text += decoder.decode();
    const body=JSON.parse(text);
    if(design){
      const parsed=requirementsSchema.safeParse(body);
      if(!parsed.success)return reply({error:'需求或邊界條件不完整，請檢查標示欄位。',issues:parsed.error.issues.map(i=>({field:i.path.join('.'),message:i.message}))},422);
      return reply(synthesize(parsed.data));
    }
    const parsed = specSchema.safeParse(body);
    if (!parsed.success) return reply({error: '參數不符合計算範圍，請檢查標示欄位。', issues: parsed.error.issues.map(i => ({field: i.path.join('.'), message: i.message}))}, 422);
    return reply(calculate(parsed.data));
  } catch {
    return reply({error: '無法解析輸入資料，請使用有效 JSON。'}, 400);
  }
}
export const calculateRequest=(request:Request)=>jsonRequest(request);
export const synthesizeRequest=(request:Request)=>jsonRequest(request,true);
export const health = () => Response.json({status:'ok',engine:ENGINE_VERSION,models:['half-bridge-llc-fha','hwllc-energy-envelope','asymmetric-half-bridge-seed'],hwllcGainModel:'pending',storage:'stateless'}, {headers:{'Cache-Control':'no-store'}});
