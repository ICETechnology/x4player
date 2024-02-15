import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

// mobile-detect.js
var MobileDetect = require('mobile-detect');
const md = new MobileDetect(window.navigator.userAgent);
// 當前為 PWA (standalone) 模式
const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator.standalone) || document.referrer.includes('android-app://');
const isIPad = (navigator.userAgent.match(/iPad/i) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) || navigator.userAgent.includes('Macintosh');

export default new Vuex.Store({
    state: {
		// 自動化測試
		autotest: {
			enable: false,
		},
		/** 裝置相關 */
		device: {
			width: 0,
			height: 0,
			ipv4: null,
			ipv6: null,
			/** 是否為行動裝置 (chrome 模擬 device 時也會 true) */
			isMobile: !!md.mobile() || window.isPad || isIPad,
			// 是否為 iPad
			isIPad: isIPad,
			/** 是否為 Android */
			isAndroid: md.is("AndroidOS"),
			/** 是否為 iOS */
			isIOS: md.is("iOS") || isIPad,
			/** 是否為 iOS 實體裝置 (包含 APP 與 PWA) */
			isDeviceIOS: md.is("iOS") && (window.isAPP || isPWA),
			/** 是否為 PWA 模式 */
			isPWA: isPWA,
			/** 是否為開發者模式 */
			isDVM: window.dvm,
			/** 是否為 App 模式 */
			isAPP: window.isAPP,
			/** 是否為 Desktop 模式 */
			isDesktop: window.isDesktop,
			/** 是否為 Electron 模式 */
			isElectron: window.isElectron,
			/** ratio (物理像素/设备像素) 用以放大 canvas 解決模糊問題*/
			ratio: 0,
			/** 版本號 */
			version: window._version,
			/** APP 版本號 (僅 APP 情境才會有) */
			appVersion: '--',
			/** OptionCloud 版本號 */
			optionCloudVersion: '--',
			/** ResourcePlugin 版本號 */
			resourcePluginVersion: '--',
			/** device ID (也可能是由 client 自己 random 出來) */
			deviceID: '',
			// IP: iPhone, IA: iPad, GP: GPhone, AA: Android Pad
			deviceType: md.is("iOS") ? (window.isPad ? 'IA' : 'IP') : (window.isPad ? 'AA' : 'GP'),
			/** 綁定裝置ID */
			bundleDevice: {},
			/** 同步之前的 deviceID (可用於解除同步使用) */
			orginDeviceID: '',
			/** 從 device 取得或虛擬出來的 MAC_ADDRESS */
			macAddress: '',
			/** 送至 BGInfo 的 deviceToken */
			deviceToken: '',
			/** 穿透式 API 取得的 deviceSystemInfo */
			deviceSystemInfo: null,
			/** BrokerID+TraderID 對應 deviceDigest 表 */
			deviceDigestMap: {},
			/** chrome 核心版本號 (android device 時才會有) */
			chromeVersion: window.chromeVersion,
			/** 是否為 Pad 寬高情境 (僅用寬高判斷，不是真的判斷 ipad) */
			isPad: window.isPad && !window.isDesktop,
			/** 寬度超過 450px 時，強制降低至多少寬度 (for Pad) */
			restrictWidth: window.restrictWidth || 375,
			/** 內嵌於 3rd app 情境 */
			isEmbedded: window.navigator.appInfo ? window.navigator.appInfo.isEmbedded : false,
			/** 顯示螢幕截圖保護 */
			screenShotProtect: "",
		},
		/** wechat 相關 */
		wechat: {
			unionid: '',
		},
		/** 連線容器 */
		wsConnMap: {},
		/** 登入相關 */
		login: {
			/** 登入完成 */
			loginReady: false,
			/** 當前登入的 brokerID */
			brokerID: '',
			/** 當前登入的 traderID (交易帐号) */
			traderID: '',
			/** 顯示用的 traderID */
			displayTraderID: '',
			/** 當前登入的 accountID (資金帳號) */
			accountID: '',
			/** `brokerID|traderID` (可用以偵測交易帳號切換) */
			btID: '',
			/** `brokerID|accountID` (可用以偵測回覆資料對應關係，因為 server 回覆資料可能沒有 traderID) */
			baID: '',
			/** `brokerID|traderID|accountID` */
			btaID: '',
			/** 當前登入的 traderName (交易帐号名称) */
			traderName: '',
			/** 當前登入的 accounts (资金帐号) */
			accounts: '',
			/** 当前登入的 brokerName */
			brokerName: '',
			/** 是否為模擬帳號 */
			isSIM: false,
			/** 當前登入是否為個股期權帳號 (未設定 tp/ntp 時預設為 true) */
			isStockOption: true,
			/** 當前登入是否為證券帳號 (未設定 tp/ntp 時預設為 true) */
			isStock: true,
			/** 當前登入是否為期貨帳號 (未設定 tp/ntp 時預設為 true) */
			isFut: true,
			/** 當前登入是否為期權帳號 (未設定 tp/ntp 時預設為 true) */
			isOption: true,
			// 記住密碼
			keepPassword: false,
			// 記住身分證號
			keepAccount: false,
		},
		// SIM 相關
		sim: {
			// 使用哪種登入
			thirdPartyType: "",
			// 用以登入 SIM 的 wechat unionid (經過轉換全小寫)
			wechatUnionid: "",
			// 用以登入 SIM 的手機門號
			phoneNumber: "",
			// 用以登入 SIM 的遊客賬號 (目前用 deviceID)
			guestID: "",
		},
		/** 當前顯示版面 (啟動階段從 config 得來，可接受變化) */
		layout: {},
		/** 語系相關 */
		lang: {
			/** 語系 */
			language: "",
			/** 語系(總表用 ex. 'CHT' / 'CHS' / 'ENG') */
			mainformLangKey: "",
			/** 語系對應表 */
			mappingTable: window._language.MappingTable,
		},
		/** 當前關注商品 */
		selectedSymbol: {
			QO: {},
			// I.F.CME.6A.201912
			ID: "",
			// "澳幣"
			Name: "",
			// "6A1906"
			CIDM4: "",
			// 此商品部位匯總
			positionSum: {},
			// 總表
			MInfo: {},
			// 是否為期權商品
			isOpt: false,
			// 以主連(熱門月)方式呈現
			displayAsHot: false,
			// 損益說明物件
			plMemo: null,
		},
		/** 趨勢圖 */
		tickChart: {
			tickList: [],
			maxSize: 0,
		},
		/** 設定相關 */
		config: {
			// brokerKey to brokerID 對應表
			brokerKeyToID: {},
			/** 專案代號 */
			projectID: window.projectID || 'cn',
			/** 設定檔 */
			CONFIG: {},
			/** 雲端洗價同意書簽署時間 */
			smoSignedDate: null,
			/** 雲端異常通知email */
			smoAlertEmail: '',
			/** 最新的雲端條件單同意書版號 */
			cloudSmoAgreementVersion: null,
			/** 已簽署雲端條件單同意書版號 */
			localSmoAgreementVersion: null,
			/** 要以報價連線送出的命令 service 種類 */
			sendByQuote: {
				'dispatcher': 1,
				'Symbol': 1,
				'ContractSpec': 1,
				'Q': 1,
				'O': 1,
				'OG': 1,
				'ad': 1,
				'HistoryData': 1,
				'K': 1,
				'rsrc': 1,
				'helpdesk': 1,
				'analysis': 1,
				'OptionCloud': 1,
				'APConfig': 1,
				'ann': 1,
			},
			feedbackDelayTime: 10,
			/** 音效開關 */
			soundEffect: true,
			/** 動線音效開關 */
			fllowEffect: false,
			/** DATA音效開關 */
			dataEffect: false,
			soundEffectUri: [
				{n: 'order-1', v:'order'},
				{n: 'order-2', v:'report_filled'},
				{n: 'order-3', v:'report_error'},
				{n: 'order-4', v:'error'},
				{n: 'short-1', v:'zapsplat_multimedia_notification_bright_metal_tuned_mallet_short_subtle_001_45086'},
				{n: 'short-2', v:'zapsplat_multimedia_notification_bright_metal_tuned_mallet_short_subtle_002_45087'},
				{n: 'short-3', v:'zapsplat_multimedia_notification_bright_metal_tuned_mallet_short_subtle_003_45088'},
				{n: 'short-4', v:'zapsplat_multimedia_alert_notification_glassy_high_pitched_short_positive_001_42348'},
				{n: 'short-5', v:'zapsplat_multimedia_alert_notification_glassy_high_pitched_short_positive_002_42349'},
				{n: 'short-6', v:'zapsplat_multimedia_alert_notification_glassy_high_pitched_short_positive_003_42350'},
				{n: 'short-7', v:'zapsplat_multimedia_alert_notification_glassy_flick_short_001_42340'},
				{n: 'short-8', v:'zapsplat_multimedia_alert_notification_glassy_flick_short_002_42341'},
				{n: 'short-9', v:'zapsplat_multimedia_alert_notification_glassy_flick_short_003_42342'},
				{n: 'short-10', v:'zapsplat_multimedia_alert_notification_glassy_flick_short_004_42343'},
				{n: 'short-11', v:'zapsplat_multimedia_alert_notification_glassy_flick_short_005_42344'},
				{n: 'short-12', v:'zapsplat_multimedia_alert_notification_glassy_flick_short_006_42345'},
				{n: 'short-13', v:'zapsplat_multimedia_alert_notification_glassy_flick_short_007_42346'},
				{n: 'short-14', v:'zapsplat_leisure_can_silly_string_spray_short_46149'},
				{n: 'short-15', v:'foley_ACME_scout_whistle_blow_short'},
				{n: 'short-16', v:'human-burp-short-child-5-years-old-001'},
				{n: 'short-17', v:'app_alert_tone_029'},
				{n: 'short-18', v:'app_alert_tone_030'},
				{n: 'short-19', v:'app_alert_tone_031'},
				{n: 'long-1', v:'arcade-game-fruit-machine-jackpot-001-short'},
				{n: 'long-2', v:'arcade-game-fruit-machine-jackpot-002-short'},
				{n: 'long-3', v:'zapsplat_multimedia_game_sound_bright_warm_positive_short_tone_001_40553'},
				{n: 'long-4', v:'zapsplat_multimedia_game_sound_bright_warm_positive_short_tone_002_40554'},
				{n: 'long-5', v:'zapsplat_multimedia_game_sound_bright_warm_positive_short_tone_003_40555'},
				{n: 'long-6', v:'zapsplat_multimedia_game_sound_bright_warm_positive_short_tone_004_40556'},
				{n: 'long-7', v:'zapsplat_multimedia_game_sound_bright_warm_positive_short_tone_005_40557'},
				{n: 'long-8', v:'zapsplat_multimedia_game_sound_bright_warm_positive_short_tone_006_40558'},
			],
			advanceEffectSetting: {
				order:"order",
				report_filled:"report_filled",
				report_error:"report_error",
				switchPage: "zapsplat_multimedia_notification_bright_metal_tuned_mallet_short_subtle_001_45086",
				switchTab: "zapsplat_multimedia_notification_bright_metal_tuned_mallet_short_subtle_002_45087",
				popupDialog: "zapsplat_multimedia_notification_bright_metal_tuned_mallet_short_subtle_003_45088",
				closeDialog: "zapsplat_multimedia_alert_notification_glassy_high_pitched_short_positive_001_42348",
				reloadData: "zapsplat_multimedia_alert_notification_glassy_high_pitched_short_positive_002_42349",
				queryResult_done: "zapsplat_multimedia_alert_notification_glassy_high_pitched_short_positive_003_42350",
				queryResult_fail: "foley_ACME_scout_whistle_blow_short",
				queryResult_noData: "human-burp-short-child-5-years-old-001",
				expand: "zapsplat_multimedia_alert_notification_glassy_flick_short_001_42340",
				back: "zapsplat_multimedia_alert_notification_glassy_flick_short_002_42341",
				startComplete: "arcade-game-fruit-machine-jackpot-001-short",
				rtTick: "zapsplat_multimedia_alert_notification_glassy_flick_short_003_42342",
				sendOrder: "zapsplat_multimedia_alert_notification_glassy_flick_short_004_42343",
				iptChange: "zapsplat_multimedia_alert_notification_glassy_flick_short_005_42344",
				slideInMenu: "zapsplat_multimedia_alert_notification_glassy_flick_short_006_42345",
				slideOutMenu: "zapsplat_multimedia_alert_notification_glassy_flick_short_007_42346",
				switchData: "app_alert_tone_029",
			},
			/** 行情報價使用元件 */
			quoteComponentClass: "QuoteMarket",
			/** 期貨分類表 (會由 trader.info 取回的 SYMBOL_CATEGORY 所覆蓋) */
			classification: "FMM_FREXG",
			/** 幣別對應表 */
			currencyMap: {
				"***": {label: "基币"},
				"USD": {label: "美金"},
				"CNY": {label: "人民币"},
				"HKD": {label: "港币"},
				"JPY": {label: "日圆"},
				"EUR": {label: "欧元"},
				"GBP": {label: "英镑"},
				"MYR": {label: "马币"},
			},
			/** 使用手势锁 */
			enablePatternLock: false,
			/** 從 AC 取得，要帶給 vue-option-cloud 的設定 */
			optionCloud: {},
			/** AC 回覆內容的 pd.setting */
			acPdSetting: {},
			/** 從 AC 取得，要用來取 [報價] 相關的設定 */
			acQuoteSetting: {},
			/** URL參數 */
			urlParam: window.urlParam,
			/** 強制指定 Trade 連線主機位置 */
			forceTradeHost: '',
			/** 從 config.path.xxx.js 設定的路徑 */
			$path: window.$path,
			/** 手數輸入方式K:keybord, S:scroll */
			inputType: "K",
			/** 顯示大字型 */
			largeSize: true,
			// 顯示大字型提示
			showLargeNotice: true,
			/** 報價樣式 */
			quoteStyle: 'QuoteCardPPV',
			quoteStyleList: [
				'QuoteCardPPV',
				'QuoteCardBSPQ',
				'QuoteCardSD',
				// 'QuoteTable',
				'QuoteTableX',
				'MultiStockRow',
			],
			/** 需要有交易登入才可使用的元件 (要进入这些元件前会检查是否已经登入交易) */
			requireTradeLoginMap: {
				FloatOrder: 1,
				OrderConfirm: 1,
				OrderModify: 1,
				OrderSelect: 1,
			},
			/** 下單盒是否顯示Greeks */
			orderBlockGreeks: false,
			/** 委託別對應顯示文字表 */
			mapOrderTypeLabel: {
				'MARKET':	'市价',
				'LIMIT':	'限价',
				'HIT':		'对手价',
				'JOIN':		'本方价',
				'STOP':		'停损市价',
				'STPLMT':	'停损限价',
				'MIT':		'触价市价',
				'LIT':		'触价限价',
				'TSTOP':	'移動停損市價',
				'TSTPLMT':	'移動停損限價',
				'MWP':		'一定范围市价',
				'5LvlMKT':	'五档市价',
				'5LvlMTL':	'五档市价转限价',
				'BST':		'最优市价',
				'BSTL':		'最优市价转限价',
				'MTL':		'市价转现价',
				'TAS':		'盘后结算价',

				'LATEST':	'最新价',
				'UDLIMIT':	'涨跌停限价',
			},
			/** 交易所未指定委託別時，預設支持的委託別 */
			defaultOrderType: ['LIMIT', 'MARKET'],
			/** 保持恒亮 (不进入休眠) */
			keepAwake: true,
			/** 商品连动范围 (layout: 版面内, system: 全系统) */
			syncMode: 'layout',
			/** 公開的 pdsetting 內容 */
			publicPdSetting: window.$publicPdSetting,
			/** 報價的 pdsetting 內容 */
			quotePdSetting: {},
			/** 交易的 pdsetting 內容 */
			tradePdSetting: {},
			/** 下單盒模式 (0:普通, 1:高級) */
			orderBoxMode: 0,
			/** 庫存商品自動加入關注 (true:是, false:否) */
			posListAddToFocusList: true,
			/** 文章內文字體大小 */
			articleContentFontSize: 'normal',
			defaultWatchList: ["I.S.SSE.510050", "I.S.SSE.510300"],
			/** 一般持倉表格排序設定 */
			normalPositionTable_sortKey: "SYMBOL",
			normalPositionTable_sortDesc: false,
			// 多股同列當前使用的組件名稱
			multiStockComClass: "MiniTChart",
			// 已同意的同意書 (字串型態)
			confirmAgreement: "",
			// 自選localStorage最後更新時間
			ssgListUpdateTime: 0,
			// 以對手價計算損益
			profitByOpposite: false,
		},
		/** UI功能 */
		ui: {
			QuoteCardMode: "",
			HistoryQueryCtnStyle: ["grid_view", "grid_view", "view_agenda"],
			/** 浮動置中視窗 */
			// floatDialog: null,
		},
		/** 查詢結果 (含即時資料) */
		result: {
			queryPositionSumResult: {},
			queryOffsetSumResult: {},
			queryReportResult: {},
			queryMarginResult: {},
			queryHoldPromptResult: {},
			queryExecEtfOptExerciseResult: {},
			queryCoverShortageResult: {},
			queryIssueResult: {},
			queryExerciseRecordResult: {},
			queryCombineReportResult: {},
			queryPositionLimitResult: {},
			queryMarginRateResult: {},
			queryMarginAmountResult: {},
			queryContinuousIOCResult: {},
		},
		/** 資料類 */
		data: {
			/** 自選群組 (SelfSelectGroupList) */
			ssgList: [],
			/** 關注列表 */
			focusList: [],
			/** 持倉匯總 - 一般 */
			normalPositionSumList: [],
			/** 持倉匯總 - 一般 (以 sid 作為 key 的表) */
			normalPositionSumMap: {},
			/** 持倉匯總 - 組合 */
			compositePositionSumList: [],
			/** 持倉限額 */
			positionLimitList: [],
			/** 有效回報 */
			availableReportList: [],
			/** 全部回報 */
			orderReportList: [],
			/** 成交回報 */
			filledReportList: [],
			/** 雲端回報 */
			cloudReportList: [],
			/** 資金資料 */
			marginData: {},
			/** 夜盤資金資料 */
			afterhoursMarginData: {},
			/** 連續IOC列表 */
			continuousIOCList: [],
			/** 廣告列表 */
			adList: [],
			/** 問題與建議列表 */
			issueData: {},
			/** 問題與建議未讀列表 */
			issueUnreadData: {},
			/** 公告列表 */
			announceList: [],
			/** 公告未讀數 */
			announceUnreads: 0,
			/** 公告分類 */
			announceClassify: {},
			/** 公告彈出未讀列表 */
			announcePopupUnreadList: [],
			/** 保證金比率資料 */
			marginRateData:{},
			/** 匯率資料 (以 'USD' 為 key 的物件)*/
			xRate: {},
			/** 期權線圖 */
			scichartOptionList: [],
			/** 微笑曲線(波動率)預設選取數 */
			sciChartSmileCurveDefaultQty: 3,
		},
		/** 字體大小 */
		fontSize: {
			pico: 2.6,		// 10px
			nano: 2.9,		// 11px
			micro: 3.2,		// 12px
			mini: 3.46,		// 13px
			small: 3.73,	// 14px
			little: 4.0,	// 15px
			normal: 4.2,	// 16px
			big: 4.8,		// 18px
			large: 5.6,		// 21px
			xl: 6.9,		// 26px
		},
		/** 字體px */
		fontSizePX: {},
		/** 元件同步溝通用的變數 */
		sync: {
			/** 開啟 floatDialog 時，阻擋觸控事件的遮罩 */
			floatDialogStopEvent: false,
			/** 顯示 floatDialog 右上角關閉圖示 (文章放大圖時使用) */
			floatDialogCloseIcon: true,
			/** 行情元件當前展開哪個商品代碼 */
			quoteCardExpandID: '',
			/** 行情元件目前為拖曳調整順序的狀態 */
			quoteDragMode: false,
			/** 自動開啟次選單 */
			autoOpenSubMenu: false,
			/** 指定 tabGroup 啟動時要預設顯示哪個頁簽(的class) */
			tgActiveClass: '',
			/** 要出現亮起效果的回報ID */
			hiLightRptKey: '',
			/** SingleSelect 資料 */
			singleSelectData: null,
			/** 此 btID 登入後要自動切換至選中 (要傳太多層所以利用這個變數來同步) */
			autoSelectedBTID: '',
			/** 日期同步共用變數 */
			datePick: {
				date: '',
				start: '',
				end: '',
				showLimitDate: false,
			},
		},
		/** 委託相關變數 */
		order: {
			orderTypeFromDCore: false,
			// 当前下单条件有没有自动市价转交易
			convertMarketPrice: null,
			/** 委託價格別 */
			orderType: 'LIMIT',
			/** 委託價 */
			inputOrderPrice: 0,
			// SSE註冊制保護限價
			inputProtectionPrice: 0,
			/** 委託量 */
			inputOrderQty: 1,
			/** 停損價 */
			inputStopPrice: 0,
			/** 觸發價 */
			inputTouchPrice: 0,
			/** 效期別 (ROD/IOC/FOK) */
			inputTimeInForce: "ROD",
			/** 買進委託價格 */
			buyOrderPrice: 0,
			/** 賣出委託價格 */
			sellOrderPrice: 0,
			/** OCO 條件1價格 */
			inputOcoCondition1Price: 0,
			/** OCO 條件2價格 */
			inputOcoCondition2Price: 0,
			/** 盈利觸發價差點數 */
			inputOrderPipValue: 0,
			/** 備兌 */
			covered: false,
			/** 價格跳數 */
			jumpCnt: 0,
			/** 市價保護限價價格超價跳數 */
			protectionJumpCnt: 0,
			/** 委託數量 */
			orderQty: 1,
			/** 是否出現委託確認視窗 */
			confirm: true,
			/** 止盈跳數 */
			tpJumpCnt: 10,
			/** 止跳數 */
			slJumpCnt: 5,
			/** 平倉反手價格跳數 */
			oppositeFlag: "HIT",
			/** 平倉反手價格跳數 */
			oppositeJump: 1,
			/** 平倉確認 */
			closeConfirm: true,
			/** 備兌 */
			warrant: false,
			dayTrade: false,
			/** 快速下單-買進預設 */
			fastOrderBuy: "S",
			/** 快速下單-賣出預設 */
			fastOrderSell: "B",
			/** 期貨預設下單數量 */
			futQty: 1,
			/** 選擇權預設下單數量 */
			optQty: 1,
			/** 證券預設下單數量 */
			stkQty: 100,
			/** 證券最低單位 */
			stkQtyStep: 100,
			/** 每筆下單口數限制(預設改為空字串) */
			maxQty: "",
			/** 期貨自動拆分數量 */
			futSplitQty: 0,
			/** 選擇權自動拆分數量 */
			optSplitQty: 0,
			/** 證券自動拆分數量 */
			stkSplitQty: 0,
			/** 上期所、INE平仓设定 */
			closeShfeIne: "PCTD",
			/** 超價基低價格 */
			overBase: 'HIT',
			/** 超價加掛跳數 */
			overJump: 1,
			/** 觸A下B用的委託商品代碼 */
			symbolB: "",
			/** 委託方向 */
			side: "",
			// 勾選市價單以〖一定範圍市價〗送出
			useRangeMarket: false,
			// 下單後重設買賣
			resetBS: false,
			// 下單後重設口數
			resetQty: false,
			// 下單後重設價格
			resetPrice: false,
			// 下單後關閉下單盒
			closeOrderBox: false,
		},
		/** 描述或呈現狀態相關 */
		status: {
			// 是否可使用指紋辨識
			fingerPrintAvailable: false,
			// cordova.plugin.device -> window.device.available
			windowDeviceAvailable: false,
			// 登入畫面上的記憶密碼 (與 login.keepPassword 僅在登入成功後會同步)
			keepPassword: false,
			// 登入畫面上的記住身分證號 (與 login.keepAccount 僅在登入成功後會同步)
			keepAccount: false,
			// 關閉快速登入介面
			closeSecurityLock: false,
			// 是否不再提醒啟用快速登入
			isNotRemindSecurityLock: false,
			// 90天密碼：使用者要求沿用密碼
			extendPwd: false,
			/** 經連線測試出來的報價主機host */
			quoteHost: null,
			/** 經連線測試出來的報價主機websocket */
			quoteWebsocket: null,
			/** 載入遠端 OC js/css 完成 */
			ocReady: false,
			/** 載入遠端 RP js 完成 */
			rpReady: false,
			/** 語系檔完成 */
			languageReady: !!window._language,
			/** 總表已到達 */
			mainformArrive: false,
			/** 總表/分類表/合約表 */
			mainformReady: false,
			/** 商品行情内容元件 */
			quotePageDisplayClass: "QuotePageMixChart",
			/** 裝置方向 */
			orientation: "portrait",
			/** 裝置轉向中 */
			rotating: false,
			/** 裝置是否為直向 */
			isPortrait: true,
			/** 當前行情頁簽 代碼 (update by ExgSelector)*/
			quoteTabID: "",
			/** 當前行情頁簽 型態 ex. pos/sel/exg (update by ExgBtn) */
			quoteTabType: "",
			/** 當前行情頁簽 名稱 (update by ExgBtn) */
			quoteTabName: "",
			/** 交易版面當前功能的 Label */
			tradeTabName: "",
			/** 帳務版面當前功能 */
			rightsTabID: "",
			/** 帳務版面當前功能的 Label */
			rightsTabName: "",
			/** 顯示 SideMenu */
			showSideMenu: false,
			/** 是否顯示標題列的權益數資料 */
			displayHeadMargin: false,
			/** quoteInfo 是否可見 (可見時 KChart 的 move 不作動) */ 
			swipeUpContainerVisible: false,
			/** 当前横向的 class */
			landscapeClass: null,
			/** 是否有包含選擇權分類表 */
			existOpt: false,
			/** 當前選取幣別 */
			selectedCurrency: "",
			/** 暫停狀態 (pause/resume) */
			pause: false,
			/** 期權雲彈窗元件名稱 */
			optCloudDialogName: '',
			/** 暫時禁止 click 事件 500ms */
			lockClick: false,
			/** 显示『更多』元件 */
			displayExtraMenu: false,
			/** 報價SD卡片高度 */
			quoteCardSDHeight: 0,
			/** 當前正顯示一般持倉 */
			isPosition: false,
			/** 币别选单列表 */
			currencyOptionList: [],
			/** 資金轉帳 */
			bank: {
				balanceAmount: null,
			},
			/** 預設要彈出的文章代號 */
			popupArticleAuthKey: null,
			cardHeight: {
				REPORT: 0,
				FILL: 0,
				BILL: 0,
				SETTLE: 0,
			},
			/** 當前關注合約列表 */
			curContractsList: [],
			// 商品詳情預設顯示的元件
			mixChartActivComclass: "SciTChart",
			announcePopupTime: "",
			/** 當前是否在成交列表 */
			isFillList: false,
			// 使用哪一种登入元件 (app 有支持 wechat 才用 LoginTradeMix)
			loginTradeClass: 'LoginTradeNew',
			// 輸入中的數字 (ex. 簡訊驗證碼)
			inputCodeNumber: '',
			// 資金資料更新時間
			marginUpdateTime: null,
			// 每次登入會顯示一次夜盤提示
			showAfterhours: true
		},
		thunder_defaultSettings: {
			enter:{
				positionEffect:"AUTO",
				stopOrderType: "STOP",
				stopOrderTicksize: 1,
				touchOrderType: "MIT",
				touchOrderTicksize: 1,
				ocoEnterType: 1,
				ocoOrderType: "MIT",
				ocoOrderTicksize: 1,
				bkOrderType: "MARKET",
				bkOrderTicksize: 1,
			},
			outer: {
				positionEffect:"AUTO",
				protectSPType: "MIT",
				protectSPTicksize: 10,
				spSmoTicksize: 1,
				protectSLType: "STOP",
				protectSLTicksize: 10,
				slSmoTicksize: 1,
				protectTSType: "TSTOP",
				protectTSTicksize: 10,
				tsSmoTicksize: 1,
			},
			other: {
				orderConfirm: true,		//下單確認
				closeConfirm: true,		//平倉確認
				stopJump: 5,			//停損價跳數
				showLine: 1,			//顯示最高低價線1顯示0關閉
				rowRange: "M",
			}
		},
		/** 閃電下單相關 */
		thunder: {
			orderConfirm: true,		//下單確認
			closeConfirm: true,		//平倉確認
			stopJump: 5,			//停損價跳數
			showLine: 1,			//顯示最高低價線1顯示0關閉
			// 委託別 (LIMIT/STOPMARKET/STOPLIMIT)
			orderType: 'LIMIT',
            orderQty: 1,
			tsiJumpQty: 0,
            isMiddle: true,
            scrollLock: true,
			model: 'N',
			useRangeMarket: false,
			// 進場選擇 (Sm/Slm/T/O)
			enterType: '',
			ocoOrder: [],
			selectedPrice: "",
			protectType: [],
			settings: {
				enter:{
					positionEffect:"AUTO",
					stopOrderType: "STOP",
					stopOrderTicksize: 1,
					touchOrderType: "MIT",
					touchOrderTicksize: 1,
					ocoEnterType: 1,
					ocoOrderType: "MIT",
					ocoOrderTicksize: 1,
					bkOrderType: "MARKET",
					bkOrderTicksize: 1,
				},
				outer: {
					positionEffect:"AUTO",
					protectSPType: "MIT",
					protectSPTicksize: 10,
					spSmoTicksize: 1,
					protectSLType: "STOP",
					protectSLTicksize: 10,
					slSmoTicksize: 1,
					protectTSType: "TSTOP",
					protectTSTicksize: 10,
					tsSmoTicksize: 1,
				},
				other: {
					orderConfirm: true,		//下單確認
					closeConfirm: true,		//平倉確認
					stopJump: 5,			//停損價跳數
					showLine: 1,			//顯示最高低價線1顯示0關閉
					rowRange: "M",
					keepStrategy: false,	//記憶進出場策略
				}
			}
		},
		/** 技術線圖相關 */
		Kchart: {
			/** kchart 效能紀錄 */
			usuage: {},
			/** 捲動漸停是否active */
			runDown: true,
			/** 捲動漸停最高循環秒數 */
			runDownMaxCircleMs: 96,
			/** 捲動漸停磨擦力係數 */
			friction: 0.6,
			/** Tchart是否active */
			TChart: false,
			/** 技術分析選在幾分K上 */
			NK: '1',
			/** 技術分析指標 */
			Idc: 'MA',
			/** 技術分析量圖 */
			Vol: 'Volume',
			/** 技術分析十字線開關 */
			Cross: false,
			crossIdx: "",
			/** 委託價線 */
			orderLine: false,
			reportLineObj: {},
			crossTick: {},
			/** 行情(market)/下單(order)模式 */
			model: 'market',
			/** 下單(order)模式下天地線的範圍(ticksize數量) */
			range: 20,
			/** 線圖縮放 */
			zoom: false,
			reset: false,
			longPress: false,
			toggleMenu: false,
			// 劃線資料
			drawLineData: {},
			// 畫線模式
			drawLineModel: '',
			// 選中的線條資料
			focusDrawLine: {},
			showPosLine: true,
			showWorkingLine: true,
			// 線圖橫置時顯示副圖(1張)
			showSubIdcOnLandscape: true,
			config:{
				MA: [{v: 5, c: '#3A85AD', s: true},{v: 21, c: '#FF0000', s: true},{v: 2, c: '#00FF50', s: false}],
				BBAND: {period: 20, std: 2, drawConfig: {
					'upper': '#375691',					//上線顏色(upper)
					'mean': '#FF0000',						//中線顏色(mean)
					'lower': '#915B13',					//下線顏色(lower)
					'fill': 'rgba(31, 30, 44, 0.5)',	//中間填滿的顏色
				}},
				SAR: {INCREMENTAL: 0.02, MAX_VAL: 0.2},
				ichimoku: {short: 7, middle: 22, long: 44, drawConfig: {
					'Tenkan': '#FF0000',					//短期顏色
					'Kijun': '#4C82CE',						//中期顏色
					'Chinkou': '#00FF00',					//長期顏色
					'SenkouA': 'rgba(209, 99, 238, 0.74)',	//前移指標A顏色
					'SenkouB': 'rgba(209, 99, 238, 0.74)',	//前移指標B顏色
					'Kumo': 'rgba(0, 0, 255, 0.1)',		//雲帶填滿的顏色
				}},
				RSI:[ {v: 7, c: '#5373A5', s: true}, {v: 14, c: '#B26F0C', s: true}, {v: 21, c: '#00FF50', s: false}],
				KD:{range: 9, K: 3,	D: 3, drawConfig: {
					'K': "#457ad1",
					'D': "#ef9003",
				}},
				MACD: {short: 12, long: 26,	MACD: 9, drawConfig: {
					'DIF': "#457ad1",					// 短周期
					'DEM': "#ef9003",					// 長周期
					'UP': "#d75442",					// 漲
					'DN':"#6ba583",						// 跌
				}},
				ATR: {range: 14, c: '#5373A5'},
				DMI: {diRange: 14, adxRange: 14, posDiColor: '#5373A5', negaDiColor: '#A2B153', adxColor: '#B14453'},
				WR: {period: 14},
			},
			default:{
				MA: [{v: 5, c: '#3A85AD', s: true},{v: 21, c: '#FF0000', s: true},{v: 2, c: '#00FF50', s: false}],
				BBAND: {period: 20, std: 2, drawConfig: {
					'upper': '#375691',					//上線顏色(upper)
					'mean': '#FF0000',						//中線顏色(mean)
					'lower': '#915B13',					//下線顏色(lower)
					'fill': 'rgba(31, 30, 44, 0.5)',	//中間填滿的顏色
				}},
				SAR: {INCREMENTAL: 0.02, MAX_VAL: 0.2},
				ichimoku: {short: 7, middle: 22, long: 44, drawConfig: {
					'Tenkan': '#FF0000',					//短期顏色
					'Kijun': '#4C82CE',						//中期顏色
					'Chinkou': '#00FF00',					//長期顏色
					'SenkouA': 'rgba(209, 99, 238, 0.74)',	//前移指標A顏色
					'SenkouB': 'rgba(209, 99, 238, 0.74)',	//前移指標B顏色
					'Kumo': 'rgba(0, 0, 255, 0.1)',		//雲帶填滿的顏色
				}},
				RSI:[ {v: 7, c: '#5373A5', s: true}, {v: 14, c: '#B26F0C', s: true}, {v: 21, c: '#00FF50', s: false}],
				KD:{range: 9, K: 3,	D: 3, drawConfig: {
					'K': "#457ad1",
					'D': "#ef9003",
				}},
				MACD: {short: 12, long: 26,	MACD: 9, drawConfig: {
					'DIF': "#457ad1",					// 短周期
					'DEM': "#ef9003",					// 長周期
					'UP': "#d75442",					// 漲
					'DN':"#6ba583",						// 跌
				}},
				ATR: {range: 14, c: '#5373A5'},
				DMI: {diRange: 14, adxRange: 14, posDiColor: '#5373A5', negaDiColor: '#A2B153', adxColor: '#B14453'},
				WR: {period: 14},
			},
		},
		/** 各類資料是否要列印 (預設值 : 一般User是否上傳至Cloud) */
		logConsole: {
			'dispatcher/pnr': 0,
			'Symbol/get': 1,
			'Q': 0,
			'O': 0,
			'OG': 0,
			'K': 0,
			'ad': 0,
			'rsrc': 0,
			'analysis': 1,
			'HistoryData': 0,
			'TRADE/otp.request': 1,
			'TRADE/otp.verify': 1,
			'TRADE/cert.info': 1,
			'TRADE/cert.apply': 1,
			'TRADE/report': 1,
			'TRADE/report.account': 1,
			'TRADE/account.positionsum': 1,
			'TRADE/account.position': 1,
			'TRADE/account.rights': 1,
		},
		/** 新手教學 */
		helper: {},
		/** 期權相關變數 */
		opt: {
			/** 剩餘天數 */
			remainDays: 0,
			/** 策略下單 ProfitLoss 計算結果 */
			profitLossResult: {},
			/** 當前期權商品代碼 */
			selectedSymbol: "I.O.SSE.510050",
			/** 當前期權商品總表 */
			selectedMainformInfo: {},
			/** 當前標的物物件 (minfo.Underlying) */
			underlying: {},
			/** 標的物 SID */
			underlyingS: "",
			// 是否為期貨期權
			isFeatureOption: null,
			/** 標的物 總表 */
			underlyingSInfo: {},
			/** 標的物 QuoteObject */
			underlyingSQO: {},
			/** 展開的 [商品+月份] */
			expandMap: {},
			/** 每個月份展開幾個履約價 (用 100 來表示全部) */
			expandCnt: 100,
			/** 當前選擇商品的所有合約列表 */
			contracts: {},
			/** 期權欄位設定 */
			columnsV3: [
				{head: '买价', key: 'BP', isPrice: 1},
				{head: '卖价', key: 'SP', isPrice: 1},
				{head: '最新价', key: 'P', isPrice: 1},
				{head: '总量', key: 'V'},
				{head: '涨跌', key: 'UD'},
				{head: '涨跌幅', key: 'UDR'},
				{head: '买量', key: 'BV'},
				{head: '卖量', key: 'SV'},
				{head: '未平仓量', key: 'OI'},
				{head: 'IV', key: 'IV'},
				{head: 'IV涨跌', key: 'IV_CHG'},
				{head: 'Delta', key: 'DE'},
				{head: 'Gamma', key: 'GA'},
				{head: 'Vega', key: 'VE'},
				{head: 'Theta', key: 'TH'},
				{head: 'Rho', key: 'RH'},
				{head: '仓差', key: 'OI_DIFF', hide: 1},
				{head: '理论价', key: 'THP', hide: 1},
				{head: '杠杆率', key: 'GR', hide: 1},
				{head: '真实杠杆率', key: 'LV', hide: 1},
				{head: '溢价率', key: 'PR', hide: 1},
				{head: '历史波动率', key: 'HV4', hide: 1},
			],
			/** 期權欄位設定 (中國用) */
			columnsCN: [
				{head: '买价', key: 'BP', isPrice: 1},
				{head: '卖价', key: 'SP', isPrice: 1},
				{head: '最新价', key: 'P', isPrice: 1},
				{head: '总量', key: 'V'},
				{head: '涨跌', key: 'UD'},
				{head: '涨跌幅', key: 'UDR'},
				{head: '买量', key: 'BV'},
				{head: '卖量', key: 'SV'},
				{head: '未平仓量', key: 'OI'},
				{head: 'IV', key: 'IV'},
				{head: 'IV涨跌', key: 'IV_CHG'},
				{head: 'Delta', key: 'DE'},
				{head: 'Gamma', key: 'GA'},
				{head: 'Vega', key: 'VE'},
				{head: 'Theta', key: 'TH'},
				{head: 'Rho', key: 'RH'},
				{head: '仓差', key: 'OI_DIFF', hide: 1},
				{head: '理论价', key: 'THP', hide: 1},
				{head: '杠杆率', key: 'GR', hide: 1},
				{head: '真实杠杆率', key: 'LV', hide: 1},
				{head: '溢价率', key: 'PR', hide: 1},
				{head: '历史波动率', key: 'HV4', hide: 1},
				{head: '熔断参考价', key: 'BR', isPrice: 1},
				// {head: '标的中价', key: 'TMP', title:'标的中间价'},
				// {head: '期权中价', key: 'MP', title: '选择权中间价'},
				// {head: '自然日', key: 'TX', title: '距离下市时间占每年比率(自然日)'},
				// {head: '交易日', key: 'TDTX', title: '距离下市时间占每年比率(交易日)'},
				// {head: '期权天数', key: 'AOD', title: '美式选择权天数'},
				// {head: '偏移值', key: 'AO', title: '美式greeks偏移值'},
				{head: '时间价值', key: 'TV'},
				// {head: '内在价值', key: 'EV'},
			],
			/** 顯示除權息合約 */
			displayPRIADJ: true,
			/** 行權價反向排序 */
			reverse: false,
			/** 期權策略設定表 */
			defaultStrategyList: null,
			// 當前關注合約對應到的標的合約
			underlyingSid: '',
		},
		/** 策略下单盒相关变数 */
		plOrder: {
			sid1: "",
			sid2: "",
			qo1: {},
			qo2: {},
			qty: 1,
			// 當前選擇的策略參數物件
			selectedStrategy: {},
		},
		/** M4C二級核心響應變數 */
		m4c: {},
		/** 底部版面列 */
		bottomBar: {
			activeKey: "",
		},
		/** 期權雲 */
		optCloud: {},
		/** 從 Server 取得的資料/狀態 */
		server: {
			// 從 server 來的資金所包含的幣別 ex. ["CNY", "USD", ...]
			marginCurrencyList: [],
		},
		/** 確認視窗 */
		confirmDialog: {
			data: null,
		},
		/** 多交易帳號機制 - 已登入交易帳號列表*/
		loginedBTOList: [],
		/** 登入中的 bto 清單 (含排序) */
		loginReadyBTOList: [],
		/** 經排序後的所有 bto 列表 (已登入的會排在最前面) */
		sortedBTOList: [],
		/** 當前選擇的 BTO (BrokerID-TraderID-Object) */
		selectedBTO: null,
		/** 當前選擇的 WSConn 物件 */
		selectedWSConn: null,
		/** 當前登入的 BTO (BrokerID-TraderID-Object) */
		loginedBTO: null,
		/** 結算單自動確認 */
		autoConfirmSettlement: {},
		/** 組合持倉策略設定(期貨跨品種) */
		compositeConfig: {},
		/** Notifycation 元件快捷方法 */
		notify: {},
		notifyClose: {},
		/** 分類文章 (動態建立出下一層) */
		article: {},
		/** 組合型回報 */
		mixReport: {
			/** 當前切換回報類型 */
			reportType: "",
		},
		/** 組合型持倉 */
		mixPosition: {
			/** 當前切換回報類型 */
			positionType: "",
		},
		/** 搜尋元件相關 */
		search: {
			symbolObjList: [],
		},
		/** 彈出視窗容器 */
		popup: {
			dialogList: [],
			floatDialogList: [],
		},
		/** 一般持倉 */
		position: {
			dailyPL: false,
		},
		continuousIOC: {
			statusType: [],
		},
		/** 由報價連線 AC 回覆的交易商列表 brokers 轉出來的 brokerMap */
		brokerMap: {},
		/** 由報價連線 AC 回覆的交易商列表 brokers 轉出來的 (broker_key || broker_id) to label */
		brokerNameMap: {},
		/** 登入交易的訊息表 (預設) */
		loginTradeMessageMap: {
			'OPEN': '连线已建立',
			'AC-LOGIN': '正在登入连线',
			'AC-LOGIN-READY': '连线登入完成',
			'AC-LOGIN-FAIL': '连线登入失败',
			'TRADER-LOGIN': '正在登入交易',
			'TRADER-LOGIN-READY': '交易登入完成',
			'TRADER-LOGIN-FAIL': '交易登入失败',
			'TIMEOUT': '登入命令无回应',
			'NO-AVIALABLE-ACCOUNT': '无可用帐号',
		},
		/** 桌機版 */
		desktop: {
			/** 版面版號 -> 改變時可強制覆蓋 user 版面 */
			layoutV: '20210713',
			/** 所有版面 */
			layout: [],
			/** 當前選擇的版面 */
			selectedLayout: {},
			/** 對應 class to com-obj 的表 */
			comMap: {},
			/** 正在拖曳中的元件 設定物件 */
			dragCom: null,
			/** 正在拖曳中的元件 所屬的 DesktopContainer instance */
			dragCtn: null,
			/** 字體大小乘數 */
			fontSizeRatio: 7,
			/** 字體要套用所有版面 */
			fontSizeToAll: true,
			/** 字體選項 */
			fontSizeOptions: [
				{label: '5', value: 5},
				{label: '6', value: 6},
				{label: '7', value: 7},
				{label: '8', value: 8},
				{label: '9', value: 9},
				{label: '10', value: 10},
				{label: '11', value: 11},
				{label: '12', value: 12},
			],
			/** 可編輯版面 */
			layoutEditable: false,
			/** 彈出視窗 */
			dskDlgList: [],
			/** 顯示可拖曳元件視窗 */
			displayComponents: false,
			/** 報價欄位版號 -> 改變時可強制覆蓋 user 設定 */
			quoteColumnsV: '20210224',
			/** 報價欄位 */
			quoteColumns: [
				{label: '代码', key: 'symbol', align: 'left'},
				{label: '合约', key: 'contractName', align: 'left'},
				{label: '最新', key: 'p', isPrice: 1},
				{label: '涨跌', key: '$cg', isChange: 1, udClr: 1},
				{label: '涨跌幅', key: '$cgr', udClr: 1},
				{label: '买价', key: 'bp1', isPrice: 1},
				{label: '买量', key: 'bv1'},
				{label: '卖价', key: 'sp1', isPrice: 1},
				{label: '卖量', key: 'sv1'},
				{label: '成交量', key: 'v'},
				{label: '持仓量', key: 'oi'},
				{label: '开盘', key: 'o', isPrice: 1},
				{label: '最高', key: 'h', isPrice: 1},
				{label: '最低', key: 'l', isPrice: 1},
				{label: '昨收盘', key: 'pc', isPrice: 1},
				{label: '昨结算', key: 'r', isPrice: 1},
				{label: '现量', key: 'q', hide: 1},
				{label: '昨持仓', key: 'yoi', hide: 1},
				{label: '涨停', key: 'hl', isPrice: 1, hide: 1},
				{label: '跌停', key: 'll', isPrice: 1, hide: 1},
				{label: '结算', key: 'st', isPrice: 1, hide: 1},
			],
			/** 回報欄位版號 -> 改變時可強制覆蓋 user 設定 */
			reportColumnsV: '20210708',
			/** 回報欄位 */
			reportColumns: [
				{label: '更新时间', key: '$UPDATE_TIME', align: 'left'},
				{label: '交易所', key: '$EXG_NAME', align: 'left'},
				{label: '商品名称', key: '$CONTRACT_NAME', align: 'left'},
				{label: '状态', key: '$STATUS', align: 'center', classKey: '$STATUS_CLASS'},
				{label: '买卖', key: '$SIDE_TEXT', align: 'center'},
				{label: '仓别', key: '$POSITION_EFFECT_TEXT', align: 'center'},
				{label: '委托别', key: '$ORDER_TYPE_TEXT'},
				{label: '委托价', key: '$ORDER_PRICE', isPrice: 1},
				{label: '停损价', key: 'STOP_PRICE', isPrice: 1},
				{label: '触发价', key: '$TRG_PRICE', isPrice: 1, hide: 1},
				{label: '委托量', key: '$ORDER_QTY'},
				{label: '有效量', key: '$AVAILABLE_QTY'},
				{label: '撤单量', key: '$REMOVED_QTY'},
				{label: '成交量', key: 'CUM_QTY'},
				{label: '成交均', key: 'AVG_PRICE', isPrice: 1},
				{label: '备注', key: '$MSG', align: 'left'},
				{label: '网路单号', key: 'ORDER_ID'},
				{label: '委托书号', key: 'EXORD_ID'},
			],
			/** 持倉欄位版號 -> 改變時可強制覆蓋 user 設定 */
			positionColumnsV: '20210708',
			/** 持倉欄位 */
			positionColumns: [
				{label: '交易所', key: '$EXG_NAME', align: 'left'},
				{label: '商品名称', key: '$CONTRACT_NAME', align: 'left'},
				{label: '多持仓', key: '$BQTY'},
				{label: '空持仓', key: '$SQTY'},
				{label: '净持仓', key: '$NET_QTY'},
				{label: '多可平', key: '$OBQTY'},
				{label: '空可平', key: '$OSQTY'},
				{label: '净可平', key: '$NET_OFFSETABLE_QTY'},
				{label: '逐日盈亏', key: 'UNREALIZED_DAILY_PL', isPL: 1},
				{label: '逐笔盈亏', key: 'UNREALIZED_PL', isPL: 1},
				{label: '多备兑持仓', key: '$CBQTY', hide: 1},
				{label: '空备兑持仓', key: '$CSQTY', hide: 1},
				{label: '今多持仓', key: 'BUY_QTY'},
				{label: '今空持仓', key: 'SELL_QTY'},
				{label: '昨多持仓', key: 'PREV_BUY_QTY'},
				{label: '昨空持仓', key: 'PREV_SELL_QTY'},
				{label: '多可平(不含备兑)', key: 'OFFSETABLE_BUY_QTY', hide: 1},
				{label: '空可平(不含备兑)', key: 'OFFSETABLE_SELL_QTY', hide: 1},
				{label: '今备兑多', key: 'COVERED_BUY_QTY', hide: 1},
				{label: '今备兑空', key: 'COVERED_SELL_QTY', hide: 1},
				{label: '昨备兑多', key: 'PREV_COVERED_BUY_QTY', hide: 1},
				{label: '昨备兑空', key: 'PREV_COVERED_SELL_QTY', hide: 1},
				{label: '备兑多可平', key: 'OFFSETABLE_COVERED_BUY_QTY', hide: 1},
				{label: '备兑空可平', key: 'OFFSETABLE_COVERED_SELL_QTY', hide: 1},
				{label: '多均(逐日)', key: '$BUY_PRICE_DAILY', isPrice: 1},
				{label: '多均(逐笔)', key: '$BUY_PRICE', isPrice: 1},
				{label: '空均(逐日)', key: '$SELL_PRICE_DAILY', isPrice: 1},
				{label: '空均(逐笔)', key: '$SELL_PRICE', isPrice: 1},
				{label: 'DELTA', key: '$DELTA', isPrice: 1},
				{label: 'GAMMA', key: '$GAMMA', isPrice: 1},
			],
			/** 最大化的元件 */
			maxTabComs: null,
		},
		/** 啟動全畫面的 LoadingIcon */
		loading: false,
		/** 連動期權雲的品種代碼 */
		outerSelectedSymbol: '',
		/** 進階搜尋 */
		searchPlus: {
			/** 最後停留的頁簽idx */
			tabIndex: 0,
			/** 搜尋期貨最後選擇的商品 */
			searchFuturesSelected: '',
			/** 搜尋期權最後選擇的商品 */
			searchOptionSelected: '',
		},
		/** 背景透明化 (掃描機制使用) */
		bgcTransparent: false,
		/** 截圖中 */
		onScreenShot: false,
		/** 欄位設定 (手機版/自訂欄位卡片) */
		columnSD: {
			// 報價自訂卡片欄位
			quote: {
				rowColCnt: 4,
				autoStorage: true,
				default: [
					{label: '最新', key: 'p', isPrice: 1, show: 1},
					{label: '涨跌', key: '$cg', isChange: 1, udClr: 1, show: 1},
					{label: '买价', key: 'bp1', isPrice: 1, show: 1},
					{label: '买量', key: 'bv1', show: 1},
					{label: '成交量', key: 'v', show: 1},
					{label: '涨跌幅', key: '$cgr', udClr: 1, show: 1},
					{label: '卖价', key: 'sp1', isPrice: 1, show: 1},
					{label: '卖量', key: 'sv1', show: 1},
					{label: '持仓量', key: 'oi'},
					{label: '开盘', key: 'o', isPrice: 1},
					{label: '最高', key: 'h', isPrice: 1},
					{label: '最低', key: 'l', isPrice: 1},
					{label: '昨收盘', key: 'pc', isPrice: 1},
					{label: '昨结算', key: 'r', isPrice: 1},
					{label: '现量', key: 'q'},
					{label: '昨持仓', key: 'yoi'},
					{label: '涨停', key: 'hl', isPrice: 1},
					{label: '跌停', key: 'll', isPrice: 1},
					{label: '结算', key: 'st', isPrice: 1},
					{label: '$CSkew', key: 'cskew', hide: 1},
					{label: 'CSkew(昨)', key: 'ycskew', hide: 1},
					{label: 'CSkew(%)', key: '$cskew$pct', hide: 1},
					{label: '$CallIVVariety', key: 'CallIVVariety', hide: 1},
					{label: '$HV20', key: 'HV20', hide: 1},
					{label: '$HV40', key: 'HV40', hide: 1},
					{label: '$HV65', key: 'HV65', hide: 1},
					{label: '$HV130', key: 'HV130', hide: 1},
					{label: '$HV260', key: 'HV260', hide: 1},
					{label: '$IVRank', key: 'IVRank', hide: 1},
					{label: '$PCRatio', key: 'PCRatio', hide: 1},
					{label: '$PSkew', key: 'pskew', hide: 1},
					{label: 'PSkew(昨)', key: 'ypskew', hide: 1},
					{label: 'PSkew(%)', key: '$pskew$pct', hide: 1},
					{label: '$PutIVVariety', key: 'PutIVVariety', hide: 1},
					{label: '$SkewDiff', key: 'SkewDiff', hide: 1},
					{label: '$TVRank', key: 'ThresholdVolumeRank', hide: 1},
					{label: '$VIX', key: 'VIX', hide: 1},
					{label: '$VIXMinusHV20', key: 'VIXMinusHV20', hide: 1},
					{label: '$VolumeRank', key: 'VolumeRank', hide: 1},							
				],
			},
			// 報價表格欄位
			quote_tablex: {
				autoStorage: true,
				default: [
					{label: '最新', key: 'p', isPrice: 1, show: 1},
					{label: '涨跌', key: '$cg', isChange: 1, udClr: 1, show: 1},
					{label: '买价', key: 'bp1', isPrice: 1, show: 1},
					{label: '买量', key: 'bv1', show: 1},
					{label: '成交量', key: 'v', show: 1},
					{label: '涨跌幅', key: '$cgr', udClr: 1, show: 1},
					{label: '卖价', key: 'sp1', isPrice: 1, show: 1},
					{label: '卖量', key: 'sv1', show: 1},
					{label: '开盘', key: 'o', isPrice: 1, show: 1},
					{label: '最高', key: 'h', isPrice: 1, show: 1},
					{label: '最低', key: 'l', isPrice: 1, show: 1},
					{label: '昨收盘', key: 'pc', isPrice: 1, show: 1},
					{label: '昨结算', key: 'r', isPrice: 1, show: 1},
					{label: '现量', key: 'q', show: 1},
					{label: '结算', key: 'st', isPrice: 1, show: 1},
					{label: '持仓量', key: 'oi'},
					{label: '昨持仓', key: 'yoi'},
					{label: '涨停', key: 'hl', isPrice: 1},
					{label: '跌停', key: 'll', isPrice: 1},
				],
			},
			// 持倉明細卡片欄位
			position: {
				rowColCnt: 3,
				default: [
					{label: '多持仓', key: '$BQTY', show: 1},
					{label: '空持仓', key: '$SQTY', show: 1},
					{label: '净持仓', key: '$NET_QTY', show: 1},
					{label: '多可平', key: '$OBQTY', show: 1},
					{label: '空可平', key: '$OSQTY', show: 1},
					{label: '净可平', key: '$NET_OFFSETABLE_QTY', show: 1},
					{label: '多均(逐日)', key: '$BUY_PRICE_DAILY', isPrice: 1, show: 1},
					{label: '空均(逐日)', key: '$SELL_PRICE_DAILY', isPrice: 1, show: 1},
					{label: '逐日盈亏', key: 'UNREALIZED_DAILY_PL', isPL: 1, show: 1},
					{label: '多均(逐笔)', key: '$BUY_PRICE', isPrice: 1, show: 1},
					{label: '空均(逐笔)', key: '$SELL_PRICE', isPrice: 1, show: 1},
					{label: '逐笔盈亏', key: 'UNREALIZED_PL', isPL: 1, show: 1},
					// {label: '多备兑持仓', key: '$CBQTY', show: 1},
					{label: '空备兑持仓', key: '$CSQTY', show: 1},
					{label: '净备兑持仓', key: '$NET_COVERED_QTY', show: 1},
					{label: '今多持仓', key: 'BUY_QTY', show: 1},
					{label: '今空持仓(不含备兑)', key: 'SELL_QTY', show: 1},
					// {label: '', key: null, show: 1},
					{label: '昨多持仓', key: 'PREV_BUY_QTY', show: 1},
					{label: '昨空持仓(不含备兑)', key: 'PREV_SELL_QTY', show: 1},
					// {label: '', key: null, show: 1},
					{label: '多可平(不含备兑)', key: 'OFFSETABLE_BUY_QTY', show: 1},
					{label: '空可平(不含备兑)', key: 'OFFSETABLE_SELL_QTY', show: 1},
					// {label: '', key: null, show: 1},
					// {label: '今备兑多', key: 'COVERED_BUY_QTY', show: 1},
					{label: '今备兑空', key: 'COVERED_SELL_QTY', show: 1},
					// {label: '', key: null, show: 1},
					// {label: '昨备兑多', key: 'PREV_COVERED_BUY_QTY', show: 1},
					{label: '昨备兑空', key: 'PREV_COVERED_SELL_QTY', show: 1},
					// {label: '', key: null, show: 1},
					// {label: '备兑多可平', key: 'OFFSETABLE_COVERED_BUY_QTY', show: 1},
					{label: '备兑空可平', key: 'OFFSETABLE_COVERED_SELL_QTY', show: 1},
					// {label: '', key: null, show: 1},
					{label: 'DELTA', key: '$DELTA', isPrice: 1, show: 1},
					{label: 'GAMMA', key: '$GAMMA', isPrice: 1, show: 1},
				],
				showDetailList: [
					{label: '持仓', dataKey:['$BQTY', '$SQTY', '$NET_QTY'], show: 1},
					{label: '可平', dataKey:['$OBQTY', '$OSQTY', '$NET_OFFSETABLE_QTY'], show: 1},
					{label: '今仓', dataKey:['BUY_QTY', 'SELL_QTY', '$NET_BUY_SELL_QTY'], show: 1},
					{label: '昨仓', dataKey:['PREV_BUY_QTY', 'PREV_SELL_QTY', '$NET_PREV_BUY_SELL_QTY'], show: 1},
					{label: '均价(逐日)', dataKey:['$BUY_PRICE_DAILY', '$SELL_PRICE_DAILY', 'UNREALIZED_DAILY_PL'], show: 1, showPL: true},
					{label: '均价(逐笔)', dataKey:['$BUY_PRICE', '$SELL_PRICE', 'UNREALIZED_PL'], show: 1, showPL: true},
					{label: '备兑仓', dataKey:['$CBQTY', '$CSQTY', '$NET_COVERED_QTY'], show: 1},
					{label: '今备兑', dataKey:['COVERED_BUY_QTY', 'COVERED_SELL_QTY', '$NET_COVERED_BUY_SELL_QTY'], show: 1},
					{label: '昨备兑', dataKey:['PREV_COVERED_BUY_QTY', 'PREV_COVERED_BUY_QTY', '$NET_PREV_COVERED_BUY_SELL_QTY'], show: 1},
					{label: '备兑可平', dataKey:['OFFSETABLE_COVERED_BUY_QTY', 'OFFSETABLE_COVERED_SELL_QTY', '$NET_COVERED_OFFSETABLE_QTY'], show: 1},
				],
			},
			// 回報明細卡片欄位
			report: {
				rowColCnt: 3,
				default: [
					{label: '更新时间', key: '$UPDATE_TIME', align: 'left', show: 1},
					{label: '状态', key: '$STATUS', align: 'center', classKey: '$STATUS_CLASS', show: 1},
					{label: '有效期', key: 'TIME_IN_FORCE', show: 1},
					{label: '买卖', key: '$SIDE_TEXT', align: 'center', show: 1},
					{label: '仓别', key: '$POSITION_EFFECT_TEXT', align: 'center', show: 1},
					{label: '委托别', key: '$ORDER_TYPE_TEXT', show: 1},
					{label: '委托价', key: '$ORDER_PRICE', isPrice: 1, show: 1},
					{label: '停损价', key: '$STOP_PRICE', isPrice: 1, show: 1},
					{label: '触发价', key: '$TRG_PRICE', isPrice: 1, show: 1},
					{label: '委托量', key: '$ORDER_QTY', show: 1},
					{label: '有效量', key: '$AVAILABLE_QTY', show: 1},
					{label: '撤单量', key: '$REMOVED_QTY', show: 1},
					{label: '成交量', key: 'CUM_QTY', show: 1},
					{label: '成交均价', key: '$AVG_PRICE', isPrice: 1, show: 1},
					{label: '來源別', key: 'SOURCE_ID', show: 1},
					{label: '网路单号', key: 'ORDER_ID', show: 1},
					{label: '委托书号', key: 'EXORD_ID', show: 1},
					{label: '有效期限', key: '$EXPIRE_TIME', show: 1, 'fontSize': 'font-size-mini'},
				],
			},
			// 權益數元件 Rights 使用的欄位設定 (國內)
			rights_in_20230303: {
				autoStorage: true,
				default: [
					{label: '可動用出金保證金', key: 'AVAILABLE_MARGIN', show: 1},
					{label: '前日餘額', key: 'BEGIN_REALIZED_BALANCE', show: 1},
					{label: '存提', key: 'FUND_TRANS', show: 1},
					{label: '權利金收入與支出', key: 'PREMIUM_NET', show: 1},
					{label: '本日期貨平倉損益淨額', key: 'REALIZED_PL', show: 1},
					{label: '手續費', key: 'TOTAL_FEE', show: 1},
					{label: '交易稅', key: 'TOTAL_TAX', show: 1},
					{label: '本日餘額', key: 'TODAY_BALANCE', show: 1},
					{label: '未沖銷期貨浮動損益', key: 'UNREALIZED_FUT_PL', show: 1},
					{label: '未沖銷選擇權浮動損益', key: 'UNREALIZED_OPT_PL', show: 1},
					{label: '權益數', key: 'FUT_BALANCE', show: 1},
					{label: '選擇權市值', key: 'OPTION_MARKET_VALUE', show: 1},
					{label: '未沖銷買方選擇權市值', key: 'OPTION_MARKET_VALUE_B', show: 1},
					{label: '未沖銷賣方選擇權市值', key: 'OPTION_MARKET_VALUE_S', show: 1},
					{label: '權益總值', key: 'CURRENT_BALANCE', show: 1},
					{label: '原始保證金', key: 'ORIGIN_MARGIN', show: 1},
					{label: '維持保證金', key: 'TOTAL_MARGIN', show: 1},
					{label: '期貨淨平倉損益', key: 'REALIZED_FUT_PL', show: 1},
					{label: '選擇權淨平倉損益', key: 'REALIZED_OPT_PL', show: 1},
					{label: '委託保證金及委託權利金', key: 'WITHHOLD_MARGIN', show: 1},
					{label: '加收保證金', key: 'EXTRA_MARGIN', show: 1},
					{label: '超額/追繳保證金', key: 'CALL_MARGIN', isPrice: 1, show: 1},
					{label: '風險指標', key: 'RISK_RATE', isPrice: 1, show: 1},
				],
			},
			// 權益數元件 Rights 使用的欄位設定 (國外)
			rights_ob_20221230: {
				autoStorage: true,
				default: [
					{label: '前日餘額', key: 'BEGIN_REALIZED_BALANCE', show: 1},
					{label: '存提', key: 'FUND_TRANS', show: 1},
					{label: '權利金收入與支出', key: 'PREMIUM_NET', show: 1},
					{label: '平倉損益', key: 'REALIZED_PL', show: 1},
					{label: '手續費', key: 'TOTAL_FEE', show: 1},
					{label: '浮動損益', key: 'UNREALIZED_PL', show: 1},
					{label: '今日異動', key: 'UNREALIZED_DAILY_PL', show: 1},
					{label: '權益數', key: 'FUT_BALANCE', show: 1},
					{label: '選擇權市值', key: 'OPTION_MARKET_VALUE', show: 1},
					{label: '權益總值', key: 'CURRENT_BALANCE', show: 1},
					{label: '原始保證金', key: 'ORIGIN_MARGIN', show: 1},
					{label: '維持保證金', key: 'TOTAL_MARGIN', show: 1},
					{label: '全額保證金', key: 'DELIVERY_MARGIN', show: 1},
					{label: '委託保證金', key: 'WITHHOLD_MARGIN', show: 1},
					{label: '原始保證金(基)', key: 'BASE_ORIGIN_MARGIN', show: 1},
					{label: '可動用或出金保證金(基)', key: 'BASE_AVAILABLE_MARGIN', show: 1},
					{label: '風險指標', key: 'RISK_RATE', show: 1},
					{label: '匯率', key: 'END_XRATE', show: 1},
					{label: '追繳金額', key: 'CALL_MARGIN', show: 1},
				],
			},
		},
		jstest: {
			display: !!window.urlParam.jstest,
		},
		// 新功能展示 Tooltip 功能
		tooltips: {
			passMap: {},
		},
		// 蒐集所有元件
		components: {},
		// 市價轉換設定
		convertMarketPrice: {},
		tableX: {
			// 排序欄位
			sortKey: "",
			// 排序方式
			sortBy: "",
		},
		// sciChart Plugin設定
		sciChartPlugin: {
			// 當前點擊的icon
			curClick: null
		},
		// 憑證相關
		cert: {},
		// 期權T字報價
		optionT: {
			// 當前捲在第幾欄
			scollOnIndex: 0,
			// 當前顯示幾欄 (單邊撐開時會=6)
			displayColumnCount: 3,
		},
		// TVC 相關
		tvc: {
			// 手機模式
			mobile: urlParam.mobile || false,
			// 語系 zh, en, zh_TW
			locale: urlParam.locale || "zh_TW",
			// 主題色系
			theme: urlParam.theme || 'Dark',
			// 時區
			timezone: urlParam.timezone || "Asia/Taipei",
			// 走勢圖模式
			lineMode: urlParam.mode === 'line',
			// tradingview instance
			widget: null,
			// 當前品種的總表
			minfo: {},
			// pdsetting 來源
			pdsettingHost: window.location.hostname === 'localhost' || window.location.hostname.indexOf('172.28')===0 ? 'ss2-dev.icetech.com.tw' : window.location.hostname,
			pdsettingComp: urlParam.comp || window.comp || 'ss2',
			pdsettingProd: urlParam.prod || window.prod || 'tvc',
			// 動作 ("search"/"compare")
			act: '',
			// 合約代碼
			sid: '',
			// tradingview 的分K定義 ex. "1", "3", "5", "15", "30", "45", "60", "120", "180", "240", "1D", "1W", "1M"
			resolution: '',
			// 分母值
			pricescaleMap: {},
			// icon from https://css.gg/
			icon: {
				// 比較Icon
				add: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M13 7C13 6.44772 12.5523 6 12 6C11.4477 6 11 6.44772 11 7V11H7C6.44772 11 6 11.4477 6 12C6 12.5523 6.44772 13 7 13H11V17C11 17.5523 11.4477 18 12 18C12.5523 18 13 17.5523 13 17V13H17C17.5523 13 18 12.5523 18 12C18 11.4477 17.5523 11 17 11H13V7Z" fill="currentColor"/></svg>`,
				// 搜尋Icon
				search: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M18.319 14.4326C20.7628 11.2941 20.542 6.75347 17.6569 3.86829C14.5327 0.744098 9.46734 0.744098 6.34315 3.86829C3.21895 6.99249 3.21895 12.0578 6.34315 15.182C9.22833 18.0672 13.769 18.2879 16.9075 15.8442C16.921 15.8595 16.9351 15.8745 16.9497 15.8891L21.1924 20.1317C21.5829 20.5223 22.2161 20.5223 22.6066 20.1317C22.9971 19.7412 22.9971 19.1081 22.6066 18.7175L18.364 14.4749C18.3493 14.4603 18.3343 14.4462 18.319 14.4326ZM16.2426 5.28251C18.5858 7.62565 18.5858 11.4246 16.2426 13.7678C13.8995 16.1109 10.1005 16.1109 7.75736 13.7678C5.41421 11.4246 5.41421 7.62565 7.75736 5.28251C10.1005 2.93936 13.8995 2.93936 16.2426 5.28251Z" fill="currentColor"/></svg>`,
				// 上鎖Icon
				lock: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M18 10.5C19.6569 10.5 21 11.8431 21 13.5V19.5C21 21.1569 19.6569 22.5 18 22.5H6C4.34315 22.5 3 21.1569 3 19.5V13.5C3 11.8431 4.34315 10.5 6 10.5V7.5C6 4.18629 8.68629 1.5 12 1.5C15.3137 1.5 18 4.18629 18 7.5V10.5ZM12 3.5C14.2091 3.5 16 5.29086 16 7.5V10.5H8V7.5C8 5.29086 9.79086 3.5 12 3.5ZM18 12.5H6C5.44772 12.5 5 12.9477 5 13.5V19.5C5 20.0523 5.44772 20.5 6 20.5H18C18.5523 20.5 19 20.0523 19 19.5V13.5C19 12.9477 18.5523 12.5 18 12.5Z" fill="currentColor"/></svg>`,
				// 未上鎖Icon
				unlock: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M19 7H17C17 4.79086 15.2091 3 13 3C10.7909 3 9 4.79086 9 7V10H18C19.6569 10 21 11.3431 21 13V19C21 20.6569 19.6569 22 18 22H6C4.34315 22 3 20.6569 3 19V13C3 11.3431 4.34315 10 6 10H7V7C7 3.68629 9.68629 1 13 1C16.3137 1 19 3.68629 19 7ZM18 12H6C5.44772 12 5 12.4477 5 13V19C5 19.5523 5.44772 20 6 20H18C18.5523 20 19 19.5523 19 19V13C19 12.4477 18.5523 12 18 12Z" fill="currentColor"/></svg>`,
				// 關閉
				close: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.2253 4.81108C5.83477 4.42056 5.20161 4.42056 4.81108 4.81108C4.42056 5.20161 4.42056 5.83477 4.81108 6.2253L10.5858 12L4.81114 17.7747C4.42062 18.1652 4.42062 18.7984 4.81114 19.1889C5.20167 19.5794 5.83483 19.5794 6.22535 19.1889L12 13.4142L17.7747 19.1889C18.1652 19.5794 18.7984 19.5794 19.1889 19.1889C19.5794 18.7984 19.5794 18.1652 19.1889 17.7747L13.4142 12L19.189 6.2253C19.5795 5.83477 19.5795 5.20161 19.189 4.81108C18.7985 4.42056 18.1653 4.42056 17.7748 4.81108L12 10.5858L6.2253 4.81108Z" fill="currentColor"/></svg>`,
				// 恢復預設
				restore: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.1459 11.0499L12.9716 9.05752L15.3462 8.84977C14.4471 7.98322 13.2242 7.4503 11.8769 7.4503C9.11547 7.4503 6.87689 9.68888 6.87689 12.4503C6.87689 15.2117 9.11547 17.4503 11.8769 17.4503C13.6977 17.4503 15.2911 16.4771 16.1654 15.0224L18.1682 15.5231C17.0301 17.8487 14.6405 19.4503 11.8769 19.4503C8.0109 19.4503 4.87689 16.3163 4.87689 12.4503C4.87689 8.58431 8.0109 5.4503 11.8769 5.4503C13.8233 5.4503 15.5842 6.24474 16.853 7.52706L16.6078 4.72412L18.6002 4.5498L19.1231 10.527L13.1459 11.0499Z" fill="currentColor"/></svg>`,
				// 儲存
				save: `<svg	width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 11C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13H15.9595C16.5118 13 16.9595 12.5523 16.9595 12C16.9595 11.4477 16.5118 11 15.9595 11H8Z" fill="currentColor"/><path d="M8.04053 15.0665C7.48824 15.0665 7.04053 15.5142 7.04053 16.0665C7.04053 16.6188 7.48824 17.0665 8.04053 17.0665H16C16.5523 17.0665 17 16.6188 17 16.0665C17 15.5142 16.5523 15.0665 16 15.0665H8.04053Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M5 3C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5ZM7 5H5L5 19H19V5H17V6C17 7.65685 15.6569 9 14 9H10C8.34315 9 7 7.65685 7 6V5ZM9 5V6C9 6.55228 9.44772 7 10 7H14C14.5523 7 15 6.55228 15 6V5H9Z" fill="currentColor"/></svg>`
			},
			// 儲存從 localStorage 取出的 object
			onLocalStorageGetItem: {},
			// 切換顯示交易功能
			toggleTrade: true,
		},		
		// 快速登入
		securityLogin: {
			type: '',   // pattern, finger
			value: '',
		},		
	},
	getters:{
		/** 取得語系 */
        getLanguage(state){
			return state.lang.language;
		},
		/** 依關注商品類型給予預設數量 */
		getDefaultQty(state){
			let sid = state.selectedSymbol.ID;
			// 期貨預設下單數量
			if(sid.indexOf("I.F") == 0)
				return state.order.futQty;
			// 選擇權預設下單數量
			else if(sid.indexOf("I.O") == 0)
				return state.order.optQty;
			// 證券預設下單數量
			else if(sid.indexOf("I.S") == 0)
				return state.order.stkQty;
			// 預設下單數量
			else return state.order.orderQty;
		}
    },	
	mutations: {
		/** 切換語系 (zh, zh-TW, en) */
		setLanguage(state, langCode) {
			state.lang.language = window.selectedLang = langCode;
			// 非繁中/簡中 -> 預設為英文
			let mlkey = "ENG";
			if (langCode == "zh") mlkey = 'CHS';
			else if (langCode == "zh-TW") mlkey = 'CHT';
			state.lang.mainformLangKey = window.mainformLangKey = mlkey;
		},
		/** 切換關注商品 */
		setSelectedSymbol(state, sid) {
			let monthSymbol = M4C.Symbol.toMonthSymbol(sid);
			state.selectedSymbol.ID = monthSymbol;
			state.selectedSymbol.QO = M4C.Quote.getQuoteObject(monthSymbol);
			state.selectedSymbol.Name = M4C.Symbol.getContractName(monthSymbol);
			state.selectedSymbol.CIDM4 = M4C.Symbol.getCIDM4(monthSymbol);
			state.selectedSymbol.MInfo = M4C.Symbol.getMainformInfo(monthSymbol);
			state.selectedSymbol.positionSum = state.data.normalPositionSumList.find(pos => pos.SYMBOL == monthSymbol) || {};
			state.selectedSymbol.isOpt = sid.indexOf("I.O.") === 0;
			state.selectedSymbol.displayAsHot = false;
			state.selectedSymbol.plMemo = null;
			// 期權商品多處理opt.selectedSymbol切換
			if(state.selectedSymbol.isOpt){
				const selectedSymbol =  sid.split('.').slice(0, 4).join('.');
				// 解決 [T字週台選]進入[策略下單盒]時 opt.selectedSymbol 會被切換為 I.O.TWF.TX1 導致返回T字報價的商品跳回第一項 https://trello.com/c/ma2naepG
				const TWFarr = ['I.O.TWF.TX1', 'I.O.TWF.TX2', 'I.O.TWF.TX3', "I.O.TWF.TX4", "I.O.TWF.TX5"];
				state.opt.selectedSymbol = TWFarr.includes(selectedSymbol)? "I.O.TWF.TXO" : selectedSymbol;
			}
		},
		/** 將當前關注商品指定為主連(熱門月)呈現模式 */
		setSelectedSymbolDisplayAsHot(state) {
			state.selectedSymbol.CIDM4 = M4C.$ln("主连");
			state.selectedSymbol.displayAsHot = true;
		},
		/** 設定裝置方向 */
		setOrientation(state, val) {
			state.status.orientation = val;
			state.status.isPortrait = val==="portrait";
		},
		/** 技術分析NK */
		setNK(state, nk) {
			state.Kchart.NK = nk;
		},
		/** 技術分析指標 */
		setKchartIdc(state, idc){
			state.Kchart.Idc = idc;
		},
		/** 技術分析十字線 */
		setKchartCross(state, v){
			state.Kchart.Cross = v;
			state.Kchart.crossTick = {};
		},
		setKchartCrossTick(state, obj){
			state.Kchart.crossTick = obj;
		},
		/** 技術分析量圖 */
		setKchartVol(state, v){
			state.Kchart.Vol = v;
		},
		setKChartModel(state, model){
			state.Kchart.model = model;
		},
		/** 設定行情報價當前選到的交易所ID (同時會產生 Name) */
		setQuoteTabID(state, tabID) {
			state.status.quoteTabID = tabID || state.status.quoteTabID;
		},
		/** 重設指定指標的設定 */
		reSetKchartConfig(state, target){
			let config = state.Kchart.config[target];
			for(let key in config){
				let obj = config[key];
				if(typeof obj != 'object'){
					state.Kchart.config[target][key] = state.Kchart.default[target][key];
				}
				else{
					for(let k in config[key]){
						state.Kchart.config[target][key][k] = state.Kchart.default[target][key][k];
					}
				}
			}
		},
		setContractsList(state, sortedList) {
			try {state.status.curContractsList = sortedList.map(o=>o.sid);}catch(e){}
		}
    }
})
