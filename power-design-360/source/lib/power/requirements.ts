import {z} from 'zod';
const n=(min:number,max:number)=>z.number({invalid_type_error:'請填入有效數值'}).finite('請填入有限數值').min(min,`不得小於 ${min}`).max(max,`不得大於 ${max}`);
export const requirementsSchema=z.object({
 vacMin:n(60,300),vacMax:n(60,300),lineHz:n(45,65),outputV:n(5,100),outputA:n(.1,40),
 outputInterface:z.enum(['dc','usb-pd']),holdMs:n(0,100),rippleMv:n(10,5000),
 stepPercent:n(10,100),transientPercent:n(.5,20),responseUs:n(20,5000),
 ambientC:n(-20,85),caseLimitC:n(20,120),targetEfficiency:n(80,98),
 priority:z.enum(['balanced','compact','low-frequency']),
}).strict().superRefine((s,c)=>{
 if(s.vacMax<s.vacMin)c.addIssue({code:'custom',path:['vacMax'],message:'最高輸入須不低於最低輸入'});
 if(s.caseLimitC<=s.ambientC)c.addIssue({code:'custom',path:['caseLimitC'],message:'機殼上限須高於環境溫度'});
 if(s.outputV*s.outputA>600)c.addIssue({code:'custom',path:['outputA'],message:'目前候選庫支援至 600 W'});
 if(s.rippleMv/1000>=s.outputV)c.addIssue({code:'custom',path:['rippleMv'],message:'漣波需求須低於輸出電壓'});
});
export type Requirements=z.infer<typeof requirementsSchema>;
export const defaultRequirements:Requirements={vacMin:90,vacMax:264,lineHz:50,outputV:48,outputA:5,outputInterface:'usb-pd',holdMs:20,rippleMv:240,stepPercent:50,transientPercent:3,responseUs:200,ambientC:40,caseLimitC:70,targetEfficiency:96,priority:'balanced'};
export const designSnapshotSchema=z.object({modelVersion:z.string().max(40),requirements:requirementsSchema,candidateId:z.string().max(100),specKey:z.string().max(6000),summary:z.string().max(20000)}).strict();
