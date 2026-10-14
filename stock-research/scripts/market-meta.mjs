export function datasetMeta(key,url,label,fetchedAt){
  const sourceName=key.startsWith('twse')?'TWSE':key.startsWith('tpex')?'TPEx':'Unknown';
  const scopeHint=key.endsWith('Revenue')?'single_month':key.endsWith('Income')?'quarter_unspecified':key.endsWith('Price')||key.endsWith('Valuation')?'single_day':null;
  return {url,label,sourceName,fetchedAt,publishedAt:null,datasetPeriod:null,scopeHint};
}
