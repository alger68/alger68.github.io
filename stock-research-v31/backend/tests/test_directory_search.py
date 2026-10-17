class FakeHttp:
    def __init__(self,data): self.data=data
    def get_json(self,url): return self.data[url]

def test_directory_search_resolves_ticker_and_taiwan_name_variant():
    from app.services.directory import DirectoryService
    urls=DirectoryService.URLS
    http=FakeHttp({
      urls['TWSE']:[{'公司代號':'2395','公司名稱':'研華','公司簡稱':'研華','產業別':'25'},{'公司代號':'2330','公司名稱':'台積電','公司簡稱':'台積電','產業別':'24'}],
      urls['TPEX']:[{'SecuritiesCompanyCode':'1240','CompanyName':'茂生農經','CompanyAbbreviation':'茂生農經','SecuritiesIndustryCode':'33'}],
    })
    s=DirectoryService(http)
    assert s.search('2395')[0]['name']=='研華'
    assert s.search('研華')[0]['ticker']=='2395'
    assert s.search('臺積電')[0]['ticker']=='2330'
    assert s.search('1240')[0]['exchange']=='TPEX'


def test_directory_exposes_official_industry_mapping_for_market_heatmap():
    from app.services.directory import DirectoryService
    urls=DirectoryService.URLS
    http=FakeHttp({
      urls['TWSE']:[{'公司代號':'2395','公司名稱':'研華','公司簡稱':'研華','產業別':'25'}],
      urls['TPEX']:[{'SecuritiesCompanyCode':'6488','CompanyName':'GlobalWafers','CompanyAbbreviation':'環球晶','SecuritiesIndustryCode':'24'}],
    })
    mapping=DirectoryService(http).industry_map()
    assert mapping[('TWSE','2395')]=={'industry_code':'25','industry':'電腦及週邊設備業'}
    assert mapping[('TPEX','6488')]=={'industry_code':'24','industry':'半導體業'}
