<template>
    <div class="config-vue hidden"></div>
</template>

<script>
// 向前相容 app 2.32- (未來可移除)
window.comp = window.comp || 'ss2';
window.prod = window.prod || 'fftw';
export default {
	data() {
		return {
			CONFIG: {
				/** 操作模式 (目前分 cn/tw) */
				OPERATING_MODE: "tw",
				/** 底部版面列功能按鈕 */
				LAYOUT: {
					'market': {
						label: "市场",
						icon: "language", 
						layout: {
							head: {
								com1: "MenuIcon",
								com2: "ExgBtn",
								row2: "MarginSimple",
							},
							body: 'MixMarket'
						},
					},
					'option': {
						label: "期权",
						icon: "format_line_spacing",
						layout: {
							head: {
								com1: "MenuIcon",
								com2: "OptionSymbolSelectorBtn",
								row2: "MarginSimple",
							},
							body: 'OptionT'
						}
					},
					'trading': {
						label: "交易",
						icon: "monetization_on",
						layout: {
							head: {
								com1: "MenuIcon",
								com2: "MixHeadText",
								row2: "MarginSimple",
							},
							body: 'MixTrading'
						}
					},
					'more': {
						label: "更多",
						icon: "more_horiz",
					},
				},
				/** 資金欄位 */
				MarginColumn: {
					'UNREALIZED_PL': {TXT: "逐笔浮盈 :", SHOW: 1, ISPRICE: 1},
					'REALIZED_DAILY_PL': {TXT:"平仓盈亏 :", SHOW: 1, ISPRICE: 1},
					'$STATIC_BALANCE': {TXT:"静态权益 :", SHOW: 1, ISPRICE: 1},
					'CURRENT_BALANCE': {TXT:"市值权益 :", SHOW: 1, ISPRICE: 1},
					'TRIAL_BALANCE': {TXT:"试算市值权益 :", SHOW: 1, ISPRICE: 1},
					'AVAILABLE_MARGIN': {TXT:"可用资金 :", SHOW: 1, ISPRICE: 1},
					'TOTAL_MARGIN': {TXT:"占用保证金 :", SHOW: 1, ISPRICE: 1},
					'RISK_RATE': {TXT:"风险度 :", SHOW: 1, ISPERCENT: 1},
					'TOTAL_FEE': {TXT:"手续费 :", SHOW: 1, ISPRICE: 1, DLEN: 1},
				},
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
				/** 每日自動彈出結算單 */
				POPUP_SETTLEMENT: false,
				/** 五檔顯示最佳虛擬一檔 */
				BS5_BEST_ONE: true,
				/** 帳務版面預設的幣別 */
				RIGHTS_TAB_DEFAULT_CURRENCY: "CNY",
				/** 支持備兌鎖定與解鎖功能 */
				ENABLE_WARRANT: true,
				/** 支援組合持倉功能 */
				ENABLE_COMBINEPOSITION: false,
				/** 支持行權功能 */
				ENABLE_EXERCISE: true,
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
				/** 交易版面顯示那些功能元件 */
				WithdrawalExchange_TAB_LIST: [
					// 一般出金
					{label: "一般出金", comClass: "Withdrawal"},
					// 幣別互轉
					{label: "币别互转", comClass: "CurrencyExchange"},
					// 出金記錄
					{label: "出金记录", comClass: "WithdrawalRecord"},
					// 換匯
					{label: "换汇", comClass: "Exchange"},
				],
				// 登出交易帳號時直接 reload
				LOGOUT_RELOAD: true,
			},
		}
	},
	beforeMount() {
		// 預設以CONFIG為初始設定
		let mergeConfig = this.CONFIG;
		// 有公開設定時合併設定。
		if(this.publicConfig) {
			mergeConfig = this.$deepMerge(this.CONFIG, this.publicConfig);
		}
		// 因server儲存的mongo db無法正常存json key含有$字符，所以額外處理資金欄位中的$STATIC_BALANCE欄位
		if(mergeConfig.MarginColumn.STATIC_BALANCE) {
			// 以取代字串的方式替換STATIC_BALANCE(試過delete方式會改變順序)
			let JSONStr = JSON.stringify(mergeConfig.MarginColumn).replace(/\"STATIC_BALANCE\"/, '"$STATIC_BALANCE"');
			this.$set(mergeConfig, "MarginColumn", JSON.parse(JSONStr));
		}
		this.$store.state.config.CONFIG = window.CONFIG = mergeConfig;
		// this.$store.state.config.CONFIG = window.CONFIG = this.CONFIG;
		// 台灣模式
		this.$store.state.config.twMode = this.CONFIG.OPERATING_MODE === 'tw';
		// 選擇權預設品種
		this.$store.state.opt.selectedSymbol = 'I.O.TWF.TXO';
		// 需啟動記憶密碼 (否則 SIM 訪客密碼也無法記憶)
		this.$store.state.login.keepPassword = true;
	},
	computed: {
		// 公開設定的設定資料
		publicConfig() {try{return this.$store.state.config.publicPdSetting.CONFIG;}catch(e){};},
	}
}
</script>

<style scoped>
</style>