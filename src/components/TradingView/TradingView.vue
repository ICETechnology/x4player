<template>
	<div ref="ctn" class="tradingview-ctn">
		<div class="FULL" :id="containerID" />
		<CustomToolBar ref="ctb" :widget="widget" @addIndicator="addIndicator" @restore="onRestore" @toggleTrade="onToggleTrade"/>
		<TVCReport v-if="enableTrade && chartReady && $tvc.toggleTrade" :widget="widget" />
		<TVCPosition v-if="enableTrade && chartReady && $tvc.toggleTrade" :widget="widget" />
	</div>
</template>

<script>
import TradingViewFn from '@/components/TradingView/TradingViewFn.js';
import CustomToolBar from '@/components/TradingView/CustomToolBar.vue';
import TVCReport from '@/components/TradingView/TVC.Report.vue';
import TVCPosition from '@/components/TradingView/TVC.Position.vue';
import tvcCore from 'tvc.core';


export default {
	mixins: [TradingViewFn],
	props: ['containerID', 'lineMode', 'propSid', 'storeKey', 'hideTitle'],
	data() {
		return {
			resolution: '1D',
			widget: null,
			// 指定黑白色系切換時，要覆寫的變數與內容
			overwiteColor: {
				'state.charts[0].panes[0].sources[0].state.baseLineColor': {Light: "#B2B5BE", Dark: "#5d606b"},
				'state.charts[0].panes[0].sources[0].state.candleStyle.wickColor': {Light: "#737375", Dark: "#B5B5B8"},
				'state.charts[0].panes[0].sources[0].state.hollowCandleStyle.wickColor': {Light: "#737375", Dark: "#B5B5B8"},
				'state.charts[0].panes[0].sources[0].state.haStyle.wickColor': {Light: "#737375", Dark: "#B5B5B8"},
				'state.charts[0].panes[0].sources[0].state.renkoStyle.upColorProjection': {Light: "#a9dcc3", Dark: "#336854"},
				'state.charts[0].panes[0].sources[0].state.renkoStyle.downColorProjection': {Light: "#f5a6ae", Dark: "#7f323f"},
				'state.charts[0].panes[0].sources[0].state.renkoStyle.borderUpColorProjection': {Light: "#a9dcc3", Dark: "#336854"},
				'state.charts[0].panes[0].sources[0].state.renkoStyle.borderDownColorProjection': {Light: "#f5a6ae", Dark: "#7f323f"},
				'state.charts[0].panes[0].sources[0].state.pbStyle.upColorProjection': {Light: "#a9dcc3", Dark: "#336854"},
				'state.charts[0].panes[0].sources[0].state.pbStyle.downColorProjection': {Light: "#f5a6ae", Dark: "#7f323f"},
				'state.charts[0].panes[0].sources[0].state.pbStyle.borderUpColorProjection': {Light: "#a9dcc3", Dark: "#336854"},
				'state.charts[0].panes[0].sources[0].state.pbStyle.borderDownColorProjection': {Light: "#f5a6ae", Dark: "#7f323f"},
				'state.charts[0].panes[0].sources[0].state.kagiStyle.upColorProjection': {Light: "#a9dcc3", Dark: "#336854"},
				'state.charts[0].panes[0].sources[0].state.kagiStyle.downColorProjection': {Light: "#f5a6ae", Dark: "#7f323f"},
				'state.charts[0].panes[0].sources[0].state.pnfStyle.upColorProjection': {Light: "#a9dcc3", Dark: "#336854"},
				'state.charts[0].panes[0].sources[0].state.pnfStyle.downColorProjection': {Light: "#f5a6ae", Dark: "#7f323f"},
				'state.charts[0].panes[0].sources[0].state.rangeStyle.upColorProjection': {Light: "#a9dcc3", Dark: "#336854"},
				'state.charts[0].panes[0].sources[0].state.rangeStyle.downColorProjection': {Light: "#f5a6ae", Dark: "#7f323f"},
				'state.charts[0].chartProperties.paneProperties.background': {Light: "#ffffff", Dark: "#131722"},
				'state.charts[0].chartProperties.paneProperties.backgroundGradientStartColor': {Light: "#ffffff", Dark: "#181C27"},
				'state.charts[0].chartProperties.paneProperties.backgroundGradientEndColor': {Light: "#ffffff", Dark: "#131722"},
				'state.charts[0].chartProperties.paneProperties.vertGridProperties.color': {Light: "rgba(42, 46, 57, 0.06)", Dark: "rgba(240, 243, 250, 0.06)"},
				'state.charts[0].chartProperties.paneProperties.horzGridProperties.color': {Light: "rgba(42, 46, 57, 0.06)", Dark: "rgba(240, 243, 250, 0.06)"},
				'state.charts[0].chartProperties.scalesProperties.lineColor': {Light: "rgba(42, 46, 57, 0.14)", Dark: "rgba(240, 243, 250, 0.12)"},
				'state.charts[0].chartProperties.scalesProperties.textColor': {Light: "#131722", Dark: "#B2B5BE"},
				// 不更新 backgroundType 解決黑白色系各自咬住這個值
				// 'state.charts[0].chartProperties.paneProperties.backgroundType': {Light: "solid", Dark: "gradient"},
			},			
			// 左下方快選全畫面顯示範圍
			time_frames: [
				{
					text: "5y",
					resolution: "1W",
					title: "5年",
				},
				{
					text: "1y",
					resolution: "1W",
					title: "1年",
				},
				{
					text: "6m",
					resolution: "1D",
					title: window.urlParam.locale==='zh' ? '6个月' : '6個月',
				},
				{
					text: "3m",
					resolution: "60",
					title: window.urlParam.locale==='zh' ? '3个月' : '3個月',
				},
				{
					text: "1m",
					resolution: "30",
					title: window.urlParam.locale==='zh' ? '1个月' : '1個月',
				},
				{ text: "5d", resolution: "5" },
				{ text: "1d", resolution: "1" },
			],
			// 當前訂閱的 sid,nk
			sub: {sid:'', nk:''},
			// 區分各 sid,resolution 訂閱實體的容器
			instance: {},
			// 要 tradingview 停用的功能 (受 tradingview 規範)
			disabledFeatures: [
				'header_symbol_search',		// 原生搜尋按鈕
				'header_fullscreen_button',	// 原生全螢幕按鈕
				'header_saveload',			// 隐藏保存/加载按钮
				'symbol_search_hot_key',	// 按任意键进行商品搜索
				'volume_force_overlay',		// 在主数据量列的窗格上放置成交量指标
				'countdown',				// 隱藏 K棒倒數計時功能
				'header_compare',			// 原生的比較按鈕
				'header_indicators',		// 原生的搜尋按鈕
				'left_toolbar',				// 停用左側工具列
				'header_screenshot',		// 停用快照按鈕
				'header_undo_redo',			// 上一動/下一動按鈕
			],
			// Tradingview chartReady
			chartReady: false,
		}
	},
	beforeMount() {
		this.$store.state.components.tradingview = this;
		// 開市狀態預設不顯示
		if (localStorage.getItem("tradingview.Chart.ShowMarketOpenStatus") == null)
			localStorage.setItem("tradingview.Chart.ShowMarketOpenStatus", 'false');

		// 走勢圖模式
		if (this.lineMode) {
			// 停用頂部工具列
			this.disabledFeatures.push('header_widget');
			// 停用底部工具列
			this.disabledFeatures.push('timeframes_toolbar');
		}
		console.log('[TVC] version : ', TradingView.version());
	},
	mounted() {
        this.initTradingView();
    },
	beforeDestroy() {},
	components: {CustomToolBar, TVCReport, TVCPosition},
	methods: {
		// 取得 localStorage key 內容
		localStorageGetItem(key) {
			let storageKey = `TVC${this.storeKey||''}_${key}`;
			let data = localStorage.getItem(storageKey);
			let content = data ? (data.length < 1024 ? data : `size : ${data.length/1024}kb`) : null;
			console.log(`[TVC] localStorageGetItem [${storageKey}] : `, content);
			return data;
		},
		// 寫入 localStorage key 內容
		localStorageSetItem(key, data) {
			data = typeof(data)==='object' ? JSON.stringify(data) : data;
			let storageKey = `TVC${this.storeKey||''}_${key}`;
			localStorage.setItem(storageKey, data);
			let content = data ? (data.length < 1024 ? data : `size : ${data.length/1024}kb`) : null;
			console.log(`[TVC] localStorageSetItem [${storageKey}] : `, content);
		},
		// 移除 localStorage key 內容
		localStorageRemoveItem(key) {
			let storageKey = `TVC${this.storeKey||''}_${key}`;
			localStorage.removeItem(storageKey);
		},
		initTradingView() {
			console.log(`TradingView.initTradingView (lineMode:${this.lineMode})`, this.sid);
			var widget = this.widget = new TradingView.widget({
				debug: false, // uncomment this line to see Library errors and warnings in the console
				// the chart should use all the available space in the container and resize when the container itself is resized.
				autosize: true,
				"timeScale": {
					"timeVisible": false,
					"secondsVisible": false,
					"position": "top"
				},
				symbol: this.sid,
				// 至少間隔多久才呼叫 onAutoSaveNeeded
				auto_save_delay: 1,
				// 最後儲存 state 狀態 (首次開啟 == null)
				saved_data: this.getState(),
				// 分K ("1", "3", "5", "15", "30", "45", "60", "120", "180", "240", "1D", "1W", "1M")
				// interval: this.lineMode ? '1' : '1D',
				container: this.containerID,
				library_path: `${window.cloudPath}/charting_library/`,
				locale: this.$tvc.locale,
				timezone: this.$tvc.timezone,
				disabled_features: this.disabledFeatures,
				// 加入 iframe_loading_compatibility_mode 相容舊版瀏覽器，以解決在 android 無法運作的問題
				enabled_features: vuex.device.isIOS ? [] : ['iframe_loading_compatibility_mode'],
				charts_storage_api_version: "1.1",
				client_id: 'tradingview.com',
				user_id: 'public_user_id',
				// 影響上方與左方工具列
				theme: window.urlParam.theme || 'Dark',
				custom_css_url: `../css/tvc.css?v=${window._version.v}`,
				time_frames: this.time_frames,
				// 支持 mode: 'line' 走勢圖模式
				// type: this.lineMode ? 'line' : 'candles',
				// 首次開啟(無任何儲存值)可以吃到這些設定
				overrides: {
					// 預設不顯示商品名稱
					// "paneProperties.legendProperties.showSeriesTitle": false,
				},
				studies_overrides: {
					// 量柱狀圖顏色
					"volume.volume.color.0": "#26a69a",
					"volume.volume.color.1": "#ef5350",
				},
				// 客製指標
				custom_indicators_getter: async function (PineJS) {
					return tvcCore.getIdcList(PineJS);
				},
				// 資料源
				datafeed: {
					onReady: (callback)=>{
						console.log('[TVC] onReady');
						setTimeout(callback, 0, {});
					},
					// getMarks?(symbolInfo: LibrarySymbolInfo, from: number, to: number, onDataCallback: GetMarksCallback<Mark>, resolution: ResolutionString): void;
					// getTimescaleMarks?(symbolInfo: LibrarySymbolInfo, from: number, to: number, onDataCallback: GetMarksCallback<TimescaleMark>, resolution: ResolutionString): void;
					// getServerTime?(callback: ServerTimeCallback): void;
					// 用戶搜尋商品
					searchSymbols: async function (userInput, exchange, symbolType, onResult) {
					},
					// 商品處理
					resolveSymbol: (ticker, onResolve, onError, extension)=>{
						console.log('[TVC] resolveSymbol : ', ticker);
						let sid = ticker;
						let minfo = this.minfo;
						// 顯示乘數
						const symbolPlus = this.getSymbolPlus(sid);
						// 最小跳動點數
						const ticksize = this.findMinimumTicksize(minfo.TickSize);
						// 顯示分母
						const deno = this.getDenominator(sid);
						// 是否為分數商品
						const fractional = !isNaN(deno) && deno !== 1;
						// 還搞不太清楚 scale 的定義...
						let scale = Math.pow(10, this.getDigits(ticksize));
						// 價格精度 : PriceScale 参数确定了图表价格量表上的价格线之间的周期
						const pricescale = fractional ? deno : scale / symbolPlus;
						// 最小步進值(整數)
						const minmov = fractional ? ticksize * deno : this.getSafeFloat(ticksize * scale);
						// 顯示名稱 ex. "澳幣 HOT"
						let month = sid.split('.')[4];
						// 依據 locale 決定商品名稱要取用 ENG / CHS / CHT(預設)
						let langKey = this.$tvc.locale==='en' ? 'ENG' : (this.$tvc.locale==='zh' ? 'CHS' : 'CHT');
						const displayName = `${minfo.Name[langKey]}${month?(' '+month):''}`;
						let info = {
							"ticker": sid,
							"name": displayName,
							// 多檔合約(比較)重開時，從 resolveSymbol 呼叫進來的 ticker 會是這邊帶的 full_name，所以得要帶完整 sid
							"full_name": sid,
							"description": displayName,
							"type": this.resolveSymbolType,
							"session": this.tvcSession,
							"exchange": minfo.Exchange,
							"listed_exchange": minfo.Exchange,
							"timezone": this.tvcTimezone,
							"has_intraday": true,	// 显示商品是否具有日内（分钟）历史数据
							"format": "price",
							"pricescale": pricescale,
							"minmov": minmov,
							"fractional": fractional,
							"supports_time": true,
							// "supported_resolutions": ["1", "3", "5", "15", "30", "45", "60", "120", "180", "240", "1D", "1W", "1M"],
							"supported_resolutions": ["1", "3", "5", "15", "30", "60", "1D", "1W", "1M"],
						};
						console.log('TradingView.execResolveSymbol.onResolve : ', JSON.stringify(info));
						onResolve(info);
					},
					getBars: (symbolInfo, resolution, periodParams, onResult, onError)=>{
						console.log('[TVC] getBars', symbolInfo, resolution, periodParams);
						let sid = symbolInfo.ticker;
						this.resolution = resolution;
						let nk = this.resolutionToNK(resolution);
						let sidrs = `${sid},${resolution}`;
						// 支持多合約情境 (比較功能)，所以要以合約區分儲存
						this.instance[sidrs] = this.instance[sidrs] || this.createInstance({sid, nk});
						this.instance[sidrs].onResult = onResult;
						// 逾時回覆 (不回覆會使 TVC 持續呈現等待狀態)
						this.instance[sidrs].timeout = setTimeout((sidrs)=>{
							this.instance[sidrs].onResult([], {noData: false});
						}, 9988, sidrs);

						if (!this.instance[sidrs].$SCI_SID) {
							// 回補並訂閱
							M4C.SciChartData.sub({com_instance: this.instance[sidrs], sid, nk});
						}
						else {
							// 取得更多資料
							let existMore = M4C.SciChartData.getMore({com_instance: this.instance[sidrs]});
							// 核心直接回覆已無更多資料時
							if (!existMore) {
								console.log('[TVC] getBars getMore => noMoreData !');
								this.instance[sidrs].onResult([], {noData: true});
								clearTimeout(this.instance[sidrs].timeout);
							}
						}
					},
					subscribeBars: (symbolInfo, resolution, onTick, guId)=>{
						console.log('[TVC] subscribeBars', symbolInfo, resolution, guId);
						let tmp = guId.split('_#_');
						let sid = tmp[0];
						let nk = this.resolutionToNK(tmp[1]);
						let sidrs = `${sid},${resolution}`;
						this.instance[sidrs].onTick = onTick;
					},
					unsubscribeBars: (guId)=>{
						console.log('[TVC] unsubscribeBars', guId);
						let tmp = guId.split('_#_');
						let sid = tmp[0];
						let resolution = tmp[1];
						let nk = this.resolutionToNK(resolution);
						let sidrs = `${sid},${resolution}`;
						// 解除訂閱
						M4C.SciChartData.unsub({com_instance: this.instance[sidrs], sid, nk});
						// 將 instance 刪除
						delete this.instance[sidrs];
					},
					// subscribeDepth?(symbol: string, callback: DomeCallback): string;
					// unsubscribeDepth?(subscriberUID: string): void;
					// getVolumeProfileResolutionForPeriod?(currentResolution: ResolutionString, from: number, to: number, symbolInfo: LibrarySymbolInfo): ResolutionString;
				},
			});
			// 若 header 被停用 -> 不聽 headerReady 以免 exception
			if (this.disabledFeatures.indexOf('header_widget') == -1) {
				widget.headerReady().then(this.onHeaderReady);
			}
			widget.onChartReady(this.onChartReady);
		},
		// widget.headerReady
		onHeaderReady() {
			console.log('[TVC] widget.headerReady');
			// 客製化功能列
			this.$refs.ctb.customToolBar();
		},
		// widget.onChartReady
		onChartReady() {
			this.chartReady = true;
			console.log('[TVC] onChartReady');
			this.widget.subscribe("onAutoSaveNeeded", this.saveState);
			// 隱藏掉右下角的時間戳記
			try {
				if (this.publicPdSetting.features.disableMachineTime)
					document.querySelector('iframe').contentDocument.querySelector('button').style.display = 'none';
			}catch(e){};
			// 首次開啟(不存在儲存狀態)，直接存一份當前的
			let lastState = this.localStorageGetItem('STATE');
			if (!this.isValidJson(lastState))
				this.saveState();
			// 覆寫 window.open 避免在 app 裡 window.open 導致整個畫面被轉走的問題
			let iframe = this.$refs.ctn.getElementsByTagName('iframe')[0];
			let iframeWindow = iframe.contentWindow || iframe.contentDocument.defaultView;
			iframeWindow.open = function(url) {
				console.log(`iframeWindow.open url : ${url}`);
				window.openLink(url);
				return {};
			};
		},
		// 支持多合約情境 (比較功能)，所以要以合約區分儲存
		createInstance({sid, nk}) {
			return {
				sid: sid,
				nk: nk,
				// 收到首次回補(含已存在的)資料
				onInitData({sid, chartData, timeKeyList}) {
					let $tv = vue.$store.state.components.tradingview;
					let result = $tv.collectData({sid, chartData, timeKeyList, nk: this.nk});
					console.log(`[TVC] onInitData (${sid}) result.data : `, result.data, '', {NOT_TO_CLOUD: true});
					setTimeout(o=>{o.self.onResult(o.result.data, {noData: false});}, 0, {self: this, result});
					clearTimeout(this.timeout);
				},
				// 收到更多資料 (由 getMore 觸發補回來的)
				onMoreData({sid, chartData, timeKeyList, moreTimeKeyList}) {
					let $tv = vue.$store.state.components.tradingview;
					let result = $tv.collectData({sid, chartData, timeKeyList, nk: this.nk});
					console.log(`[TVC] onMoreData (${sid}) result.data : `, result.data, '', {NOT_TO_CLOUD: true});
					setTimeout(o=>{o.self.onResult(o.result.data, {noData: false});}, 0, {self: this, result});
					clearTimeout(this.timeout);
				},
				// 收到即時更新Tick
				onUpdateTick(index, tick, timeKey) {
					let $tv = vue.$store.state.components.tradingview;
					const bar = $tv.parseData(this.sid, this.nk, timeKey, tick);
					setTimeout(o=>{if (o.self.onTick) o.self.onTick(o.bar);}, 0, {self: this, bar});
				},
				// 收到即時新的Tick
				onAppendTick(index, tick, timeKey, timeKeyList) {
					let $tv = vue.$store.state.components.tradingview;
					const bar = $tv.parseData(this.sid, this.nk, timeKey, tick);
					setTimeout(o=>{if (o.self.onTick) o.self.onTick(o.bar);}, 0, {self: this, bar});
				},
				// 查詢失敗回覆錯誤碼
				onChartError(sid, errCode) {
					// 此查詢條件在即時或歷史都沒有資料，並且往更之前的時間查找也找不到歷史資料
					if (errCode === -24 || errCode === -25) {
						console.log(`[TVC] 此查詢條件在即時或歷史都沒有資料，並且往更之前的時間查找也找不到歷史資料 (-24 or -25)`);
						this.onResult([], {noData: true});
					}
					else
						console.log(`[TVC] onChartError (${sid}) errCode : `, errCode);
				},
			};
		},
		// 讀取上次儲存的圖表狀態
		getState() {
			// 走勢圖模式 -> 強制使用系統預設值, 技術分析 -> 優先使用最後儲存狀態，沒有時才使用系統預設
			let str = this.lineMode ? this.lineModeStateText : (this.localStorageGetItem('STATE') || this.defaultStateText);
			let state = JSON.parse(str || null);
			// 對 state 內容開始進行覆寫
			if (state)
				this.overwriteState(state);
			return state;
		},
		// 儲存圖表狀態
		saveState() {
			console.log('[TVC] saveState');
			this.widget.save((state)=>{
				this.localStorageSetItem('STATE', state);
			});
		},
		// 新增指標
		addIndicator(id) {
			try {
				this.widget.activeChart().createStudy(id, false, false);
			} catch(e) {console.error('Add Indicator fail!', e)}
		},
		// 覆寫 state
		overwriteState(state) {
			try {
				// 覆寫 [儲存狀態內的合約代碼] to [當前指定的合約代碼]
				state.charts[0].panes[0].sources[0].state.symbol = this.sid;
				// 覆寫 [儲存狀態內的分K] to [當前指定的分K]
				if (this.lineMode)
					state.charts[0].panes[0].sources[0].state.interval = '1';
				// 走勢圖模式
				if (this.lineMode) {
					state.charts[0].panes[0].sources[0].state.style = 2;
				}
				// 商品標題顯示/隱藏
				state.charts[0].chartProperties.paneProperties.legendProperties.showSeriesTitle = !this.hideTitle;
			}catch(e){
				console.log('[TVC] overwriteState exception : ', e);
			}
		},
		// 恢復出場預設
		onRestore() {
			this.localStorageRemoveItem('STATE');
			this.$emit('restore');
		},
		// 切換顯示回報與部位
		onToggleTrade() {
			vuex.tvc.toggleTrade = !vuex.tvc.toggleTrade;
		},
	},
	watch: {
		sid() {
			this.widget.setSymbol(this.sid, this.resolution, () => {});
		},
		quoteLoginReady(nv) {
			// 報價重連完成 -> 重新 initial 以解決斷線重連沒有重新訂閱的問題
			if (nv)
				this.$emit('restore');
		},
	},
	computed: {
		// 報價登入完成
		quoteLoginReady() {
			return vuex.wsConnMap.quote.loginReady;
		},
		// tvc變數容器
		$tvc() {
			return this.$store.state.tvc;
		},
		// 合約代碼
		sid() {
			return this.propSid || M4C.Symbol.selectedSymbolToHot();
		},
		minfo() {
			return M4C.Symbol.getMainformInfo(this.sid);
		},
		publicPdSetting() {
			return this.$store.state.config.publicPdSetting;
		},
		// 技術分析 State 純文字值 (含週期/分區/指標等等...)
		defaultStateText() {
			try{return Base64.decode(this.publicPdSetting.CONFIG.TVC.state.default);}catch(e){}
			// 相前相容用
			try{return Base64.decode(this.publicPdSetting.CONFIG.TVC.defaultState);}catch(e){}
		},
		// 走勢圖 State 純文字值
		lineModeStateText() {
			let str;
			try{str = Base64.decode(this.publicPdSetting.CONFIG.TVC.state.line);}catch(e){}
			return `{"layout":"s","charts":[{"panes":[{"sources":[{"type":"MainSeries","id":"_seriesId","zorder":0,"haStyle":{"studyId":"BarSetHeikenAshi@tv-basicstudies-60"},"renkoStyle":{"studyId":"BarSetRenko@tv-prostudies-64"},"pbStyle":{"studyId":"BarSetPriceBreak@tv-prostudies-34"},"kagiStyle":{"studyId":"BarSetKagi@tv-prostudies-34"},"pnfStyle":{"studyId":"BarSetPnF@tv-prostudies-34"},"rangeStyle":{"studyId":"BarSetRange@tv-basicstudies-72"},"formattingDeps":{"format":"price","pricescale":1,"minmov":1,"fractional":false},"state":{"style":2,"esdShowDividends":true,"esdShowSplits":true,"esdShowEarnings":true,"esdShowBreaks":false,"esdFlagSize":2,"showContinuousContractSwitches":true,"showContinuousContractSwitchesBreaks":false,"showFuturesContractExpiration":true,"showLastNews":true,"showCountdown":false,"bidAsk":{"visible":false,"lineStyle":1,"lineWidth":1,"bidLineColor":"#2962FF","askLineColor":"#F7525F"},"prePostMarket":{"visible":true,"lineStyle":1,"lineWidth":1,"preMarketColor":"#FB8C00","postMarketColor":"#2962FF"},"highLowAvgPrice":{"highLowPriceLinesVisible":false,"highLowPriceLabelsVisible":false,"averageClosePriceLineVisible":false,"averageClosePriceLabelVisible":false,"highLowPriceLinesColor":"","highLowPriceLinesWidth":1,"averagePriceLineColor":"","averagePriceLineWidth":1},"visible":true,"showPriceLine":true,"priceLineWidth":1,"priceLineColor":"","baseLineColor":"#5d606b","showPrevClosePriceLine":false,"prevClosePriceLineWidth":1,"prevClosePriceLineColor":"#555555","minTick":"default","dividendsAdjustment":{},"backAdjustment":false,"settlementAsClose":true,"sessionId":"regular","sessVis":false,"statusViewStyle":{"fontSize":16,"showExchange":true,"showInterval":true,"symbolTextSource":"description"},"candleStyle":{"upColor":"#089981","downColor":"#F23645","drawWick":true,"drawBorder":true,"borderColor":"#378658","borderUpColor":"#089981","borderDownColor":"#F23645","wickColor":"#B5B5B8","wickUpColor":"#089981","wickDownColor":"#F23645","barColorsOnPrevClose":false,"drawBody":true},"hollowCandleStyle":{"upColor":"#089981","downColor":"#F23645","drawWick":true,"drawBorder":true,"borderColor":"#378658","borderUpColor":"#089981","borderDownColor":"#F23645","wickColor":"#B5B5B8","wickUpColor":"#089981","wickDownColor":"#F23645","drawBody":true},"haStyle":{"upColor":"#089981","downColor":"#F23645","drawWick":true,"drawBorder":true,"borderColor":"#378658","borderUpColor":"#089981","borderDownColor":"#F23645","wickColor":"#B5B5B8","wickUpColor":"#089981","wickDownColor":"#F23645","showRealLastPrice":false,"barColorsOnPrevClose":false,"inputs":{},"inputInfo":{},"drawBody":true},"barStyle":{"upColor":"#089981","downColor":"#F23645","barColorsOnPrevClose":false,"dontDrawOpen":false,"thinBars":true},"hiloStyle":{"color":"#2962FF","showBorders":true,"borderColor":"#2962FF","showLabels":true,"labelColor":"#2962FF","drawBody":true,"fontSize":7},"columnStyle":{"upColor":"rgba(8, 153, 129, 0.5)","downColor":"rgba(242, 54, 69, 0.5)","barColorsOnPrevClose":true,"priceSource":"close"},"lineStyle":{"color":"#2962FF","linestyle":0,"linewidth":2,"priceSource":"close"},"lineWithMarkersStyle":{"color":"#2962FF","linestyle":0,"linewidth":2,"priceSource":"close"},"steplineStyle":{"color":"#2962FF","linestyle":0,"linewidth":2,"priceSource":"close"},"areaStyle":{"color1":"rgba(41, 98, 255, 0.28)","color2":"#2962FF","linecolor":"#2962FF","linestyle":0,"linewidth":2,"priceSource":"close","transparency":100},"hlcAreaStyle":{"highLineColor":"#089981","highLineStyle":0,"highLineWidth":2,"lowLineColor":"#F23645","lowLineStyle":0,"lowLineWidth":2,"closeLineColor":"#868993","closeLineStyle":0,"closeLineWidth":2,"highCloseFillColor":"rgba(8, 153, 129, 0.2)","closeLowFillColor":"rgba(242, 54, 69, 0.2)"},"renkoStyle":{"upColor":"#089981","downColor":"#F23645","borderUpColor":"#089981","borderDownColor":"#F23645","upColorProjection":"#336854","downColorProjection":"#7f323f","borderUpColorProjection":"#336854","borderDownColorProjection":"#7f323f","wickUpColor":"#089981","wickDownColor":"#F23645","inputs":{"source":"close","sources":"Close","boxSize":3,"style":"ATR","atrLength":14,"wicks":true},"inputInfo":{"source":{"name":"Source"},"sources":{"name":"Source"},"boxSize":{"name":"Box size"},"style":{"name":"Style"},"atrLength":{"name":"ATR length"},"wicks":{"name":"Wicks"}}},"pbStyle":{"upColor":"#089981","downColor":"#F23645","borderUpColor":"#089981","borderDownColor":"#F23645","upColorProjection":"#336854","downColorProjection":"#7f323f","borderUpColorProjection":"#336854","borderDownColorProjection":"#7f323f","inputs":{"source":"close","lb":3},"inputInfo":{"source":{"name":"Source"},"lb":{"name":"Number of line"}}},"kagiStyle":{"upColor":"#089981","downColor":"#F23645","upColorProjection":"#336854","downColorProjection":"#7f323f","inputs":{"source":"close","style":"ATR","atrLength":14,"reversalAmount":1},"inputInfo":{"source":{"name":"Source"},"style":{"name":"Style"},"atrLength":{"name":"ATR length"},"reversalAmount":{"name":"Reversal amount"}}},"pnfStyle":{"upColor":"#089981","downColor":"#F23645","upColorProjection":"#336854","downColorProjection":"#7f323f","inputs":{"sources":"Close","reversalAmount":3,"boxSize":1,"style":"ATR","atrLength":14,"oneStepBackBuilding":false},"inputInfo":{"sources":{"name":"Source"},"boxSize":{"name":"Box size"},"reversalAmount":{"name":"Reversal amount"},"style":{"name":"Style"},"atrLength":{"name":"ATR length"},"oneStepBackBuilding":{"name":"One step back building"}}},"baselineStyle":{"baselineColor":"#758696","topFillColor1":"rgba(8, 153, 129, 0.28)","topFillColor2":"rgba(8, 153, 129, 0.05)","bottomFillColor1":"rgba(242, 54, 69, 0.05)","bottomFillColor2":"rgba(242, 54, 69, 0.28)","topLineColor":"#089981","bottomLineColor":"#F23645","topLineWidth":2,"bottomLineWidth":2,"priceSource":"close","transparency":50,"baseLevelPercentage":50},"rangeStyle":{"barStyle":0,"upColor":"#089981","downColor":"#F23645","upColorProjection":"#336854","downColorProjection":"#7f323f","thinBars":true,"candlesUpColor":"#089981","candlesDownColor":"#F23645","candlesBorderUpColor":"#089981","candlesBorderDownColor":"#F23645","candlesWickUpColor":"#089981","candlesWickDownColor":"#F23645","inputs":{"range":10,"phantomBars":false},"inputInfo":{"range":{"name":"Range"},"phantomBars":{"name":"Phantom bars"}}},"symbol":"I.F.TWF.TXF.HOT","shortName":"臺指 HOT","timeframe":"","onWidget":false,"interval":"1","unitId":null,"showInDataWindow":true,"showSessions":false,"currencyId":null,"priceAxisProperties":{"autoScale":true,"autoScaleDisabled":false,"lockScale":false,"percentage":false,"percentageDisabled":false,"log":false,"logDisabled":false,"alignLabels":true,"isInverted":false,"indexedTo100":false}}}],"mainSourceId":"_seriesId","stretchFactor":2000,"leftAxisesState":[],"rightAxisesState":[{"state":{"id":"4ZJPC7MZ6g3D","m_priceRange":null,"m_isAutoScale":true,"m_isPercentage":false,"m_isIndexedTo100":false,"m_isLog":false,"m_isLockScale":false,"m_isInverted":false,"m_topMargin":0.1,"m_bottomMargin":0.08,"alignLabels":true,"logFormula":{"logicalOffset":4,"coordOffset":0.0001}},"sources":["_seriesId"]}],"overlayPriceScales":{},"priceScaleRatio":null},{"sources":[{"type":"study_Volume","id":"liDiIs","state":{"styles":{"vol":{"display":15,"linestyle":0,"linewidth":1,"plottype":5,"trackPrice":false,"transparency":50,"color":"#26a69a","title":"vol"},"vol_ma":{"display":0,"linestyle":0,"linewidth":1,"plottype":0,"trackPrice":false,"transparency":0,"color":"#2196f3","title":"vol_ma"},"smoothedMA":{"display":0,"linestyle":0,"linewidth":1,"plottype":0,"trackPrice":false,"transparency":0,"color":"#2196f3","title":"smoothedMA"}},"palettes":{"volumePalette":{"colors":{"0":{"color":"#26a69a","width":1,"style":0},"1":{"color":"#ef5350","width":1,"style":0}}}},"inputs":{"showMA":false,"length":20,"col_prev_close":false,"symbol":"","smoothingLine":"SMA","smoothingLength":9},"precision":"default","bands":{},"graphics":{},"ohlcPlots":{},"filledAreasStyle":{},"filledAreas":{},"visible":true,"showLegendValues":true,"showLabelsOnPriceScale":true,"parentSources":{},"intervalsVisibilities":{"ticks":true,"seconds":true,"secondsFrom":1,"secondsTo":59,"minutes":true,"minutesFrom":1,"minutesTo":59,"hours":true,"hoursFrom":1,"hoursTo":24,"days":true,"daysFrom":1,"daysTo":366,"weeks":true,"weeksFrom":1,"weeksTo":52,"months":true,"monthsFrom":1,"monthsTo":12,"ranges":true}},"zorder":-10000,"ownFirstValue":null,"metaInfo":{"palettes":{"volumePalette":{"colors":{"0":{"name":"Falling"},"1":{"name":"Growing"}}}},"inputs":[{"id":"symbol","name":"Other Symbol","defval":"","type":"symbol","optional":true,"isHidden":false,"display":15},{"id":"showMA","name":"show MA","defval":false,"type":"bool","isHidden":true,"display":0},{"id":"length","name":"MA Length","defval":20,"type":"integer","min":1,"max":2000,"display":15},{"defval":false,"id":"col_prev_close","name":"Color based on previous close","type":"bool","display":0},{"id":"smoothingLine","name":"Smoothing Line","defval":"SMA","type":"text","options":["SMA","EMA","WMA"],"display":15},{"id":"smoothingLength","name":"Smoothing Length","defval":9,"type":"integer","min":1,"max":10000,"display":15}],"plots":[{"id":"vol","type":"line"},{"id":"volumePalette","palette":"volumePalette","target":"vol","type":"colorer"},{"id":"vol_ma","type":"line"},{"id":"smoothedMA","type":"line"}],"graphics":{},"defaults":{"styles":{"vol":{"display":15,"linestyle":0,"linewidth":1,"plottype":5,"trackPrice":false,"transparency":50,"color":"#000080"},"vol_ma":{"display":0,"linestyle":0,"linewidth":1,"plottype":0,"trackPrice":false,"transparency":0,"color":"#2196F3"},"smoothedMA":{"display":0,"linestyle":0,"linewidth":1,"plottype":0,"trackPrice":false,"transparency":0,"color":"#2196F3"}},"palettes":{"volumePalette":{"colors":{"0":{"color":"#F7525F","width":1,"style":0},"1":{"color":"#22AB94","width":1,"style":0}}}},"inputs":{"showMA":false,"length":20,"col_prev_close":false,"symbol":"","smoothingLine":"SMA","smoothingLength":9}},"_metainfoVersion":53,"isTVScript":false,"isTVScriptStub":false,"is_hidden_study":false,"styles":{"vol":{"title":"Volume","histogramBase":0},"vol_ma":{"title":"Volume MA","histogramBase":0},"smoothedMA":{"title":"Smoothed MA","histogramBase":0}},"description":"Volume","shortDescription":"Volume","is_price_study":false,"id":"Volume@tv-basicstudies-1","format":{"type":"volume"},"description_localized":"成交量","shortId":"Volume","packageId":"tv-basicstudies","version":"1","fullId":"Volume@tv-basicstudies-1","productId":"tv-basicstudies","_serverMetaInfoVersion":52}}],"mainSourceId":"liDiIs","stretchFactor":1000,"leftAxisesState":[],"rightAxisesState":[{"state":{"id":"Tk7mnkIqmEgh","m_priceRange":null,"m_isAutoScale":true,"m_isPercentage":false,"m_isIndexedTo100":false,"m_isLog":false,"m_isLockScale":false,"m_isInverted":false,"m_topMargin":0.1,"m_bottomMargin":0.08,"alignLabels":true,"logFormula":{"logicalOffset":4,"coordOffset":0.0001}},"sources":["liDiIs"]}],"overlayPriceScales":{},"priceScaleRatio":null}],"timeScale":{"m_barSpacing":6,"m_rightOffset":10,"rightOffsetPercentage":5,"usePercentageRightOffset":false},"chartProperties":{"paneProperties":{"backgroundType":"gradient","background":"#131722","backgroundGradientStartColor":"#181C27","backgroundGradientEndColor":"#131722","gridLinesMode":"both","vertGridProperties":{"color":"rgba(240, 243, 250, 0.06)"},"horzGridProperties":{"color":"rgba(240, 243, 250, 0.06)"},"crossHairProperties":{"color":"#9598A1","style":2,"transparency":0,"width":1},"topMargin":10,"bottomMargin":8,"axisProperties":{"autoScale":true,"autoScaleDisabled":false,"lockScale":false,"percentage":false,"percentageDisabled":false,"indexedTo100":false,"log":false,"logDisabled":false,"alignLabels":true,"isInverted":false},"legendProperties":{"showStudyArguments":true,"showStudyTitles":true,"showStudyValues":true,"showSeriesTitle":true,"showSeriesOHLC":true,"showLegend":true,"showBarChange":true,"showVolume":false,"showBackground":true,"showPriceSource":true,"backgroundTransparency":50,"showLogo":true},"separatorColor":"#2A2E39"},"scalesProperties":{"backgroundColor":"#ffffff","lineColor":"rgba(240, 243, 250, 0)","textColor":"#B2B5BE","fontSize":12,"scaleSeriesOnly":false,"showSeriesLastValue":true,"seriesLastValueMode":1,"showSeriesPrevCloseValue":false,"showStudyLastValue":true,"showSymbolLabels":false,"showStudyPlotLabels":false,"showBidAskLabels":false,"showPrePostMarketPriceLabel":true,"showFundamentalNameLabel":false,"showFundamentalLastValue":true,"barSpacing":6,"axisHighlightColor":"rgba(41, 98, 255, 0.25)","axisLineToolLabelBackgroundColorCommon":"#2962FF","axisLineToolLabelBackgroundColorActive":"#143EB3","showPriceScaleCrosshairLabel":true,"showTimeScaleCrosshairLabel":true,"crosshairLabelBgColorLight":"#131722","crosshairLabelBgColorDark":"#363A45"},"chartEventsSourceProperties":{"visible":true,"futureOnly":true,"breaks":{"color":"#555555","visible":false,"style":2,"width":1}},"tradingProperties":{"showPositions":true,"positionPL":{"visibility":true,"display":0},"bracketsPL":{"visibility":true,"display":0},"showOrders":true,"showExecutions":true,"showExecutionsLabels":false,"showReverse":true,"horizontalAlignment":2,"extendLeft":true,"lineLength":5,"lineWidth":1,"lineStyle":0},"priceScaleSelectionStrategyName":"auto"},"sessions":{"properties":{"graphics":{"backgrounds":{"outOfSession":{"color":"#2962FF","transparency":92,"visible":false},"preMarket":{"color":"#FF9800","transparency":92,"visible":false},"postMarket":{"color":"#2962FF","transparency":92,"visible":false}},"vertlines":{"sessBreaks":{"color":"#4985e7","style":2,"visible":false,"width":1}}}}},"version":3,"timezone":"Asia/Taipei","shouldBeSavedEvenIfHidden":true,"linkingGroup":null,"lineToolsGroups":{"groups":[]},"chartId":"1"}],"symbolLock":0,"intervalLock":0,"trackTimeLock":0,"dateRangeLock":0,"crosshairLock":1,"layoutsSizes":{"s":[{"percent":1}]}}`;
		},
		// 商品資訊->商品類型要顯示的文字
		resolveSymbolType() {
			if (M4C.Symbol.isFut(this.sid)) return this.$ln('期貨');
			if (M4C.Symbol.isOpt(this.sid)) return this.$ln('選擇權');
			if (M4C.Symbol.isStk(this.sid)) return this.$ln('證券');
			return '--';
		},
		// 啟用交易功能
		enableTrade() {
			try{return this.publicPdSetting.CONFIG.TVC.enableTrade;}catch(e){}
		},
		// 交易時段 ex. "0700-2400:2|0000-0601,0700-2400:3456|0000-0601:7"
		tvcSession() {
			return this.minfo.TVCSession || M4C.Symbol.getExgMainformInfo(this.sid).TVCSession;
		},
		// 時區
		tvcTimezone() {
			return this.minfo.TVCTimezone || M4C.Symbol.getExgMainformInfo(this.sid).TVCTimezone || "Asia/Taipei";
		},
	},
}
</script>

<style scoped>
</style>