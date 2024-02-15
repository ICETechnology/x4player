<template>
    <div class="m4c-analysis hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
			sessionId: `X4_${"".random()}`,
			mapComTagToName: {
				'MixOptCloud': '首页',
				'MixMarket': '市场',
				'OptionT': '期权',
				'MixTrading': '交易',
				'MixSetting': '设定',
				'QuotePage': '商品行情',
				'QuotePageMixRT': '商品行情-即',
				'QuotePageMixChart': '商品行情-Ｋ',
				'QuotePageKChartOrder': '商品行情-图',
				'QuotePageFastOrder': '商品行情-快',
				'QuotePageThunder': '商品行情-闪',
				'FloatOrder': '下单盒',
				'OrderConfirm': '下单确认',
				'ArticleContent': '文章内容',
				'PlotOrder': '策略下单盒',
				'ExgSelector':  '期货交易所选择器',
				'OptionSymbolSelector': '期权商品选择器',
				'Search': '搜寻商品',
				'CloudReportCardList': '云端回报',
				'TradingAccountManager': '交易帐号管理',
				'Settlement': '结算单',
				'Password': '修改密码',
				'LoginTrade': '登入交易帐号',
				'SideMenu': '左侧菜单',
				'PositionCardList': '持仓',
				'MixReportList.All': '委讬回报(所有回报)',
				'MixReportList.Working': '委讬回报(有效回报)',
				'MixReportList.TotalFilled': '委讬回报(完全成交)',
				'MixReportList.PartialFilled': '委讬回报(部分成交)',
				'MixReportList.Error': '委讬回报(错误回报)',
				'FilledReportCardList': '成交回报',
				'SettingSystem': '系统设定',
				'SettingOrder': '交易设定',
				'SettingDeviceInfo': '设备信息',
				'OptCloudDialog': '期权云弹窗',
				'MixPosition': '持倉',
				'EnterStrategySelector': '进场策略选择',
				'EnterStrategyOrderBox': '进场策略下单盒',
				'StopLoss': '止盈止损下单盒',
				'Announce': '公告',
				'BankTransfer' : '資金轉帳',
				'BankTransferContainer' : '資金轉帳(容器)',
				'ColumnConfig' : '欄位設定',
				'ConfigColumnSD' : '新欄位設定',
				'DesktopFontSize' : '桌機版調整字體',
				'DesktopLayoutImport' : '桌機版匯入版面',
				'DesktopTradingAccountManager' : '桌機版交易帳號管理',
				'ExerciseRecord' : '行權記錄',
				'HistoryQueryContainer' : '歷史查詢(容器)',
				'IssueListMix' : '問題回報(容器)',
				'IssueReport' : '問題回報',
				'LoginTradeAuto' : '自動登入交易視窗',
				'LoginTradeNew' : '手動登入交易視窗',
				'LoginedBTOManager' : '登入帳號管理列表',
				'NoticeMSG' : '三大提醒',
				'OptCloudHelper' : '期權雲說明',
				'OrderConfirmOpposite' : '反手',
				'PositionCardDetail' : '持倉明細',
				'QRScanner' : 'QRCode掃描器',
				'QuotePageSub' : '商品行情子視窗',
				'ReportCardDetail' : '回報明細',
				'SearchPlus' : '搜尋元件',
				'SelfSelectEditor' : '自選編輯器',
				'SettingConsole' : '設定列印console(開發用)',
				'Skew' : 'Skew',
				'ThunderSetting' : '閃電設定',
				'Agree' : '啟動同意書',
				'CombinePositionOrder': '組合持倉委託',
				'PositionMixGreeks': '持倉Greeks',
				'ResourcePluginDialog': 'RP彈窗',
				'SmoAgreement': '雲端洗價同意書',
				'SmoAgreementConfig': '雲端洗價同意書設定',
				'src/components/ResourcePlugin/RelativeVideoListDialog': 'RP影片列表彈窗',
				'src/components/ResourcePlugin/ResourceDetailEntryDialog': 'RP文章詳情彈窗',
			},
		}
	},
	beforeMount() {
		let self = this;
		// 支持 Vuex + Window全域
		M4C.Analysis = this.$store.state.m4c.analysis = this;
		// 監看彈窗
		eventBus.$on("POPUP-DIALOG", (comClass, param, config)=>{
			setTimeout(()=>{
				let comTag = param && param.clsName ? param.clsName : self.getComponentClassName(comClass);
				self.componentEnter(comTag);
			}, 100);
		});
	},
    methods: {
		// 取得元件的 ClassName (保留)
		getComponentClassName(com) {
			if (typeof(com) === 'string')
				return com;
			let comTag;
			if (typeof(com) === 'object') {
				if (com.$options)
					comTag = com.$options._componentTag;
				if (!comTag) {
					try{
						let __file = com.__file || com.$options.__file;
						comTag = __file.split('\\').slice(-1)[0].split('.vue')[0];
					}catch(e){}
				}
			}
			return comTag;
		},
		/** TabGroup 啟動元件 */
		onTabGroupActive(comTag) {
			if (!this.UBA) return;
			// 委託回報分類
			if (comTag === 'MixReportList')
				comTag = `MixReportList.${this.$store.state.mixReport.reportType}`;
			if (this.mapComTagToName[comTag])
				this.componentEnter(comTag);
		},		
		// 進入元件畫面
		componentEnter(comTag) {
			if (comTag === this.lastEnter)
				return;
			this.lastEnter = comTag;
			this.publish(comTag, 'enter');
		},
		// 離開元件畫面
		componentLeave(comTag) {
			this.publish(comTag, 'leave');
		},
		// 進入背景化
		onPause() {
			// this.publish(this.lastEnter, 'leave');
		},
		// 從背景恢復
		onResume() {
			this.sessionId = `X4_${"".random()}`;
			this.publish(this.lastEnter, 'enter');
		},
		// 送出
		publish(comTag, item){
			if (!this.UBA) return;
			if (!comTag) return;
			// 轉出實際的元件 class-name
			comTag = this.getComponentClassName(comTag);
			// 期權雲彈窗->加送期權雲內容頁
			if (comTag === 'OptCloudDialog')
				comTag = this.$store.state.status.optCloudDialogName;
			// 商品行情 -> 加送商品行情內容頁
			else if (comTag === 'QuotePage')
				comTag = this.$store.state.status.quotePageDisplayClass;
			// 轉中文
			comTag = this.mapComTagToName[comTag] || comTag;
			// 避免送出沒有 comTag 的分析
			if (!comTag) return;
			let cmd = {
				s: "analysis",
				c: "s",
				r: "".random(),
				d: {
					"type": "pd_uba",
					"session_id": this.sessionId,
					"page_id": comTag,
					"item_id": item,
				}
			};
			M4C.send(cmd, 'quote');
		},
		// 桌機版切換版面/元件
		desktopEnter(page) {
			this.publish(page, 'enter');
		},
	},
	watch: {
		/** 版面切換 */
		'$store.state.layout.body'(nv) {
			this.componentEnter(nv);
		},
		/** 商品行情畫面切換 */
		'$store.state.status.quotePageDisplayClass'(nv) {
			this.componentEnter(nv);
		},
		/** 委託回報切換分類 */
		'$store.state.mixReport.reportType'(nv) {
			this.componentEnter(`MixReportList.${nv}`);
		},
		/** 報價登入完成 -> 補送統計首頁 */
		'$store.state.wsConnMap.quote.loginReady': function(nv) {
			this.lastEnter = null;
			this.componentEnter(this.$store.state.layout.body);
		},
	},
    computed: {
		/** 由 pdsetting.function.UBA 來決定是否發送統計 */
		UBA() {
			let fn = this.$store.state.config.quotePdSetting.function;
			return fn && fn.UBA;
		},
		quoteLoginReady() {

		}
	},
}
</script>
