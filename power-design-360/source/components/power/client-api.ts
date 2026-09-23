import {fingerprint,type Spec,type Result} from '@/lib/power/model';
export async function requestCalculation(spec:Spec,apiBase:string,signal?:AbortSignal):Promise<Result>{
 const response=await fetch(`${apiBase}/api/calculate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(spec),signal:signal??AbortSignal.timeout(15000)});
 if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('計算服務暫時無法使用，請稍後再試。');
 const data=await response.json() as Partial<Result>&{error?:string};if(!response.ok)throw new Error(data.error??'計算失敗，請檢查輸入參數。');
 if(data.fingerprint!==fingerprint(spec)||!data.metrics||!Array.isArray(data.checks))throw new Error('計算結果與目前參數不一致，請重新執行。');
 return data as Result;
}
