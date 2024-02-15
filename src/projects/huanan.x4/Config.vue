<template>
    <div class="config-vue hidden"></div>
</template>

<script>
export default {
	data() {
		return {
			CONFIG: {
				/** 交易版面顯示那些功能元件 */
				TRADE_TAB_LIST: [
					// 模擬帳號時才會顯示此頁簽 (與下面互斥)
					{label: "持仓", comClass: "PositionCardList"},
					// 一般帳號時才會顯示此頁簽 (與上面互斥)
					{labelClass: "MixPositionTab", comClass: "MixPosition"},
					// 綜合回報 (下拉選單)
					{labelClass: "MixReportTab", comClass: "MixReportList"},
					// 成交回報
					{label: "成交", comClass: "FilledReportCardList", AlertByEvent: "RECEIVE-REALTIME-FILLED"},
				],	
				/** 五檔顯示最佳虛擬一檔 */
				BS5_BEST_ONE: true,
				/** 以萬為量的顯示單位 (未設定時使用 K/M) */
				UNIT_TEN_THOUSAND: true,
				/** 允許登入其它交易帳號 */
				LOGIN_MORE_TRADER: false,
				/** 預設使用語系 */
				DEFAULT_LANGUAGE: "zh-TW",
				/** 預設顯示帳務資訊(上層) */
				DEFAULT_HEADMARGIN: true,
				/** 預設不顯示語系切換項目 */
				NO_LANG_ITEM: true,
				/** 報價按鈕隨即時資料亮起 */
				QUOTE_PRICE_LIGHTUP: true,
				/** 出金畫面顯示那些功能元件 */
				WithdrawalExchange_TAB_LIST: [
					// 一般出金
					{label: "一般出金", comClass: "Withdrawal"},
					// 幣別互轉
					{label: "币别互转", comClass: "CurrencyExchange"},
					// 出金記錄
					{label: "出金记录", comClass: "WithdrawalRecord"},
				],
				// 登出交易帳號時直接 reload
				LOGOUT_RELOAD: true,
				// 不自動登入交易 (有登入頁需要登入時)
				NOT_AUTO_LOGIN_TRADE: true,
				// 當沖保證金折扣清單(原本想改依折扣區分，但太複雜且目前也沒必要，等真的有需要再來改)
				DayTradeMarginDisCountList: ["I.F.TWF.TXF", "I.F.TWF.MXF", "I.F.TWF.FXF", "I.F.TWF.EXF"],
				// 當沖保證金原價清單
				DayTradeMarginOriginList: [],				
			},
		}
	},
	beforeMount() {
		// 合併設定 + 上提
		this.$store.state.config.CONFIG = this.$deepMerge(this.CONFIG, this.publicConfig);
		// 台灣模式
		this.$store.state.config.twMode = true;
		// 選擇權預設品種
		this.$store.state.opt.selectedSymbol = 'I.O.TWF.TXO';
		// 預設記住密碼，因台新沒有記住密碼的選項，為了避免快速登入無法使用，預設為true
		this.$store.state.login.keepPassword = true;
		this.$store.state.status.keepPassword = true;
	},
	computed: {
		// 公開設定的設定資料
		publicConfig() {
			try{return this.$store.state.config.publicPdSetting.CONFIG;}catch(e){};
		},
	}
}
</script>

<style scoped>
</style>