# Taishin Nova SDK

將台新 Nova API 官網下載的 **Mac ARM64** Python wheel 放在此資料夾，例如：

`taishin_sdk-<version>-cp37-abi3-macosx_11_0_arm64.whl`

然後重新執行 `install.command`。安裝腳本會自動偵測並安裝 wheel。

不要把 `.pfx` 憑證、帳號、密碼或憑證密碼提交到 Git。憑證可放在 Mac 任意私人路徑，並只在本機 `.env` 設定 `TAISHIN_CERT_PATH`。
