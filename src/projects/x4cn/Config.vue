<template>
    <div class="config-vue hidden"></div>
</template>

<script>
export default {
	data() {
		return {
			CONFIG: {
				/** 操作模式 (目前分 cn/tw) */
				OPERATING_MODE: 'cn',
				/** 開始登入報價 */
				LOGIN_QUOTE: true,
				/** 底部版面列功能按鈕 */
				LAYOUT: {
					'optcloud': {
						label: "首页",
						icon: "home", 
						layout: {
							head: {
								com1: "MenuIcon",
								com2: "MixHeadText",
								row2: "MarginSimple",
							},
							body: 'MixOptCloud'
						},
					},
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
					'DELTA': {TXT: "总Delta$ :", SHOW: 1, ISPRICE: 1},
					'GAMMA': {TXT: "总Gamma$ :", SHOW: 1, ISPRICE: 1},
					'REALIZED_DAILY_PL': {TXT:"平仓盈亏 :", SHOW: 1, ISPRICE: 1, CLR0: true},
					'PREMIUM_NET': {TXT:"权利金收支 :", SHOW: 1, ISPRICE: 1},
					'STOCK_PL': {TXT:"证券资金收支 :", SHOW: 1, ISPRICE: 1},
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
				BS5_BEST_ONE: false,
				/** 帳務版面預設的幣別 */
				RIGHTS_TAB_DEFAULT_CURRENCY: "CNY",
				/** 支持備兌鎖定與解鎖功能 */
				ENABLE_WARRANT: true,
				/** 支援組合持倉功能 */
				ENABLE_COMBINEPOSITION: true,
				/** 支持行權功能 */
				ENABLE_EXERCISE: true,
				/** 以萬為量的顯示單位 (未設定時使用 K/M) */
				UNIT_TEN_THOUSAND: true,
				/** 允許登入其它交易帳號 */
				LOGIN_MORE_TRADER: true,
				/** 預設使用語系 */
				DEFAULT_LANGUAGE: "zh",
				/** 要求權限說明 */
				REQUEST_PERMISSION_HELPER: true,
				/** 有支持平倉時自動拆分持倉的交易所清單預設:大商所、鄭商所、廣期所(後續如果有增減，直接在公開設定的CONFIG調整) */
				AUTO_SPLIT_COMPOSITE_WHEN_OFFSET: ['DCE', 'CZCE', 'GFEX'],
				/** 有支持組合持倉的交易所策略對映表。預設:上證所、深交所、大商所、廣期所(後續如果有增減，直接在公開設定的CONFIG調整) */
				"COMPOSITE_EXG_STRATEGYMAP": {
					"SSE": [0,1,2,3,4,5,6],
					"SZSE": [0,1,2,3,4,5,6,7],
					"DCE": [0,2,4,5,8,9,10,11,12,13],
					"GFEX": [0,2,4,5,8,9,11,12,13]
				}
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
		window.mm = this;
	},
	computed: {
		// 公開設定的設定資料
		publicConfig() {try{return this.$store.state.config.publicPdSetting.CONFIG;}catch(e){};},
	}
}
</script>

<style scoped>
</style>