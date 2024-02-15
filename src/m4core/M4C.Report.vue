<template>
    <div class="m4c-report hidden" />
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			reports: {},
			filledReportKeyList: [],
			availableReportKeyList: [],
			cloudReportKeyList: [],
			// 有新的新雲端條件單(警示小紅點用)
			newCloudReport: false,
			/** requestID to baID */
			ridToBAID: {},
			// 讓所有回報的 notify 都共用(續用)，覆蓋效果
			notifyKeep: {},
			// 有效單的 client 流水號
			workingIndex: 0,
		}
	},
	beforeMount() {
		console.log(`M4C.Report.beforeMount`);
		// 支持 Vuex + Window全域
		M4C.Report = this.$store.state.m4c.report = this;
		// 註冊資料分派 - 即時回報
		M4C.regDispatch({'s': 'TRADE', 'c': 'report', 'callback': this.onRealtimeData.bind(this)});
		// 註冊資料分派 - 回補回報
		M4C.regDispatch({'s': 'TRADE', 'c': 'report.account', 'callback': this.onQueryData.bind(this)});
		// 註冊資料分派 - 回報額外欄位
		M4C.regDispatch({'s': 'TRADE', 'c': 'additional.report.account', 'callback': this.onAdditionalReportData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'additional.report', 'callback': this.onAdditionalReportData.bind(this)});
	},
    methods: {
		initReport(param) {
			this.clearData();
			if (!this.baID) return;
			let result = this.$store.state.result.queryReportResult = this.baseQuery(`${this.baID}|report.account`, param);
			this.$set(result, 'availableReportList', this.$store.state.data.availableReportList = []);
			this.$set(result, 'orderReportList', this.$store.state.data.orderReportList = []);
			this.$set(result, 'filledReportList', this.$store.state.data.filledReportList = []);
			this.$set(result, 'cloudReportList', this.$store.state.data.cloudReportList = []);
			return result;
		},
		// 重設小紅點提示
		clearAlert() {
			eventBus.$emit("RECEIVE-REALTIME-FILLED", false);
			this.newCloudReport = false;
		},
		// 完整清除回報資料
		clearData() {
			this.availableReportKeyList = [];
			this.cloudReportKeyList = [];
			this.filledReportKeyList = [];
			this.reports = {};
			this.$store.state.data.availableReportList = [];
			this.$store.state.data.orderReportList = [];
			this.$store.state.data.filledReportList = [];
			this.$store.state.data.cloudReportList = [];
			this.clearAlert();
		},

		// 查詢回報
		queryReport(param) {
			if (!this.accountID) return;
			if (!this.$store.state.selectedWSConn.loginReady) return;
			let result = this.initReport(param);
			let rid = "".random();
			this.ridToBAID[rid] = this.baID;
			let cmd = {};
			cmd.s = 'TRADE';
			cmd.c = 'report.account';		// 委託回報 report.account / 成交回報 fill.account
			cmd.r = rid;
			cmd.d = {};
			cmd.d.ACCOUNT_ID = this.accountID;
			M4C.send(cmd);
			return result;
		},
		// 查詢/訂閱額外回報
		queryAdditionalReport() {
			if (!this.accountID) return;
			if (!this.$store.state.selectedWSConn.loginReady) return;
			let cmd = {};
			cmd.s = 'TRADE';
			cmd.c = 'additional.report.account';
			cmd.r = ''.random();
			cmd.d = {};
			cmd.d.ACCOUNT_ID = [this.accountID];
			M4C.send(cmd);
		},
		onRealtimeData(data) {
			this.onData(data, true);
		},
		onQueryData(data) {
			this.onData(data);
			// 回補回報完成
			if (data.lt) {
				// 排序
				this.sort();
				// 查詢/訂閱額外欄位
				this.queryAdditionalReport();
			}
		},
		// 回報額外欄位
		onAdditionalReportData(data) {
			if(data.d && data.d.REPORT_KEY){
				data.$IS_ADDITIONAL_REPORT = true;
				data.d.REPORT_KEY.merge = true;
				this.onData(data);
			}
		},
		// 收到資料
		onData(data, isRealtime) {
			let self = this;
			if (!data.d) return;
			let thisRpt = data.d;
			let thisKey = thisRpt.REPORT_KEY || {};
			let brokerID = thisKey.broker_id;
			let accountID = thisKey.account_id;
			let baID = brokerID && accountID ? `${brokerID}|${accountID}` : this.ridToBAID[data.r];
			let result = self.baseOnTradeData(`${baID}|report.account`, data);
			// 僅處理當前關注子帳
			if (thisRpt.REPORT_KEY && baID === this.baID) {
				let reportKey = thisRpt.key = thisRpt.REPORT_KEY.report_id;
				// 本筆回報對應的原回報
				let origRpt = this.reports[reportKey];
				let rpt, isNewRpt;
				// merge:false -> 用原回報合併後，新增於畫面上
				if (!thisRpt.REPORT_KEY.merge) {
					// 委託狀態若為 PendingReplace || PendingCancel 直接丟棄
					let status = thisRpt.REPORT_KEY.status;
					if (status === 'PendingReplace' || status === 'PendingCancel') return;
					// 視為新回報
					isNewRpt = true;
					// 本單蓋上原單 (填補補足欄位)
					let newRpt = Object.assign({}, origRpt, thisRpt);
					// 替換為新 report key 以避免覆蓋混淆
					let newRptKey = newRpt.REPORT_KEY.report_id = `${reportKey}-${''.random()}`;
					rpt = this.reports[newRptKey] = newRpt;
				}
				// merge:true -> 往下比較 phase
				else {
					// 同 ReportKey 若 [phase 較小] 則直接丟棄
					if (origRpt && thisRpt.REPORT_KEY.phase !== -1 && thisRpt.REPORT_KEY.phase < origRpt.REPORT_KEY.phase) return;
					// 同 ReportKey 若 [phase 相等] 且 [timestamp 較小] 則直接丟棄
					if (origRpt && thisRpt.REPORT_KEY.phase === origRpt.REPORT_KEY.phase) {
						if (thisRpt.REPORT_KEY.timestamp < origRpt.REPORT_KEY.timestamp) return;
					}
					// 此回報是否為全新回報
					isNewRpt = !origRpt;
					// 額外欄位(additional.report) -> 將 SMO 填至 $ADDITIONAL_REPORT_SMO (避免與原 SMO 互相覆蓋導致問題)
					if (data.$IS_ADDITIONAL_REPORT) {
						// 此 AdditionReport 對應不回原始 Report 時，直接丟棄，不往下進行處理
						if (!this.reports[reportKey]) return;
						this.$set(this.reports[reportKey], '$ADDITIONAL_REPORT_SMO', thisRpt.SMO);
						rpt = this.reports[reportKey];
					}
					else {
						// 同 ReportKey 時 -> 欄位覆蓋
						rpt = this.reports[reportKey] = Object.assign(this.reports[reportKey] || {}, thisRpt);
					}
				}

				// 擴增方便性/必要性欄位
				this.extendColumn(rpt, data);
				
				let rptMapKey = accountID;
				// 更新 [所有委回] 回報列表
				this.updateOrderReportList(rpt, isNewRpt);
				// 更新 [包含成交] 回報列表
				this.updateFilledReportList(rpt);
				// 更新 [有效委託] 回報列表
				this.updateAvailableReportList(rpt);
				// 更新 [雲端委託] 回報列表
				this.updateCloudReportList(rpt);

				// 即時回報廣播
				if (isRealtime)
					this.alert(rpt);
			}
		},
		alert(rpt) {
			// 即時回報提示訊息
			this.flashMessage(rpt);
			// 雲端回報廣播 (與所有其它回報互斥)
			if (rpt.$IS_CLOUD) {
				eventBus.$emit("RECEIVE-REALTIME-CLOUD", rpt);
			}
			else {
				// 即時回報廣播
				eventBus.$emit("RECEIVE-REALTIME-REPORT", rpt);
				// 委託成功廣播
				if (rpt.REPORT_KEY.status === "New") {
					eventBus.$emit("RECEIVE-REALTIME-SUCCESS", rpt);
				}
				// 成交回報廣播
				if (rpt.CUM_QTY > 0) {
					eventBus.$emit("RECEIVE-REALTIME-FILLED", rpt);
				}					
				// 成交回報廣播
				if (rpt.REPORT_KEY.status === "Rejected") {
					eventBus.$emit("RECEIVE-REALTIME-FAILED", rpt);
				}
			}
		},
		// 對『所有回報』進行排序
		sort() {
			let list = this.orderReportList;
			if (list) {
				console.time(`M4C.Report.sort()`);
				list.sort((a, b)=>{
					return new Date(b.UPDATE_TIME) - new Date(a.UPDATE_TIME);
				});
				console.timeEnd(`M4C.Report.sort()`);
			}
		},
		// 彈出提示訊息
		flashMessage(rpt) {
			let icon = `campaign`;
			let qty = 0;
			let tcOrderType = rpt.TC_ORDER_TYPE;
			// 委託失敗
			if (rpt.$IS_FAIL){
				icon = `error`;
				qty = rpt.ORDER_QTY;
			}
			// 委託成功
			else if (rpt.$ISWORKING){
				icon = `check_circle`;
				qty = rpt.$AVAILABLE_QTY;
			}
			// 成交回報
			else if (rpt.$IS_FILLED){
				icon = `stars`;
				qty = rpt.CUM_QTY;
			}
			// 刪單成功
			else if (rpt.REPORT_KEY.status === "Cancelled") {
				icon = `delete`;
			}
			// 止盈止損
			if (rpt.$IS_OCO && rpt.OCO[0]) {
				qty = rpt.OCO[0].ORDER_QTY || qty;
				tcOrderType = rpt.OCO[0].TC_ORDER_TYPE || tcOrderType;
			}

			let brokerName = '', txtOrderType = '';
			try{brokerName = this.$store.state.brokerNameMap[rpt.BROKER_ID] || rpt.BROKER_ID;}catch(e){}
			let displayAccountID = M4C.Trader.getDisplayTraderID(rpt.ACCOUNT_ID || rpt.TRADER_ID);				
			let bsText = rpt.$SIDE ? (rpt.$SIDE==="BUY" ? this.$ln("买进") : this.$ln("卖出")) : '';
			let qtyText = qty ? `${qty}${this.$ln("手")}` : '';
			
			try{txtOrderType = this.$ln(this.$store.state.config.mapOrderTypeLabel[tcOrderType] || tcOrderType);}catch(e){}
			this.$store.state.notify({
				keep: this.notifyKeep,
				icon: icon,
				head: rpt.$STATUS,
				// 买进 澳币2009 委托成功
				htmlBody: `
					<div class="flex-col">
						<div class="clr-gray">${brokerName}</div>
						<div>${displayAccountID}</div>
						<div>${this.$ln('合约')} : ${rpt.$CONTRACT_NAME} ${rpt.$CONTRACT_NAME2 ? ('& ' + rpt.$CONTRACT_NAME2) : ''}</div>
						<div>${this.$ln('委托')} : ${bsText} ${txtOrderType} ${qtyText}</div>
						<div class="word-break-all">${this.$ln('备注')} : ${rpt.$MEMO}</div>
					</div>
					`,
				onclick: this.onClickNotify.bind(this),
				rpt: rpt,
			});
		},
		/** 彈出的提示被點擊 */
		onClickNotify(obj) {
			let rpt = obj.param.rpt;
			let reportType = 'All';
			if (rpt.$IS_FILLED)
				reportType = "TotalFilled";
			else if (rpt.$ISWORKING)
				reportType = rpt.$IS_CLOUD ? "All" : "Working";
			// 自動切換到指定的回報
			this.$store.state.sync.tgActiveClass = 'MixReportList';
			// 自動切換到指定的回報類型
			this.$store.state.mixReport.reportType = reportType;
			this.$store.state.sync.hiLightRptKey = rpt.key;
			setTimeout(()=>{
				this.$store.state.sync.hiLightRptKey = '';
			}, 500);
			// 關閉全部彈窗
			eventBus.$emit("CLOSE-ALL-DIALOG");
			// 切換至交易版面
			this.$store.state.bottomBar.activeKey = "trading";
		},
		// 更新 [所有委回] 回報列表
		updateOrderReportList(rpt, isNewRpt) { 
			// 全新的回報直接貼在最上面 (第一筆)
			if (isNewRpt) {
				this.orderReportList.unshift(rpt);
			}
		},
		// 更新 [包含成交] 回報列表
		updateFilledReportList(rpt) {
			// 本回報是否存在成交回報列表中
			let rptIdx = this.filledReportKeyList.indexOf(rpt.key);
			// 包含成交回報 && 不在列表內 -> 新增
			if (rptIdx === -1 && rpt.CUM_QTY > 0) {
				this.filledReportList.unshift(rpt);
				this.filledReportKeyList.unshift(rpt.key);
			}
		},
		//更新 [有效委託] 回報列表
		updateAvailableReportList(rpt) {
			// 本回報是否存在於有效委託回報列表中
			let rptIdx = this.availableReportKeyList.indexOf(rpt.key);
			let status = rpt.REPORT_KEY.status;
			// 非有效單 && 存在列表內 -> 移除
			if (rptIdx !== -1 && !rpt.$ISWORKING) {
				this.availableReportList.splice(rptIdx, 1);
				this.availableReportKeyList.splice(rptIdx, 1);
				rpt.$REMOVED = true;
				// 移除有效回報
				eventBus.$emit("AVAILABLE-REPORT-REMOVE", rpt);
			}
			// 有效單 && 不在列表內 -> 新增
			else if (rptIdx === -1 && rpt.$ISWORKING) {
				this.availableReportList.unshift(rpt);
				this.availableReportKeyList.unshift(rpt.key);
				// 新增有效回報
				eventBus.$emit("AVAILABLE-REPORT-APPEND", rpt);
				// 有效單回報編號
				rpt.$INDEX = rpt.$INDEX || this.workingIndex++;				
			}
			// 狀態是改價或改量 && 存在列表內  -> 修改
			else if((status == 'Replaced'|| status == 'Reduced') && rpt.$ISWORKING){
				eventBus.$emit("AVAILABLE-REPORT-REPLACE", rpt);
			}
		},
		// 更新 [雲端委託] 回報列表
		updateCloudReportList(rpt) {
			// 本回報是否存在雲端委託回報列表中
			let rptIdx = this.cloudReportKeyList.indexOf(rpt.key);
			// 存在列表內 && (不是雲端單(已送往後台) 或 不是委託中) -> 移除
			if (rptIdx !== -1 && (!rpt.$IS_CLOUD || !rpt.$ISWORKING)) {
				this.cloudReportList.splice(rptIdx, 1);
				this.cloudReportKeyList.splice(rptIdx, 1);
			}
			// 不在列表內 && 雲端單 && 委託中 -> 新增
			if (rptIdx === -1 && rpt.$IS_CLOUD && rpt.$ISWORKING) {
				this.cloudReportList.unshift(rpt);
				this.cloudReportKeyList.unshift(rpt.key);
				this.newCloudReport = true;
			}
		},
		isSMOtype(type) {
			switch(type){
				case "STOP":
				case "STPLMT":
				case "MIT":
				case "LIT":
				case "TSTOP":
				case "TSTPLMT":
					return true;
				default:
					return false;
			}
		},
		// 擴增方便性/必要性欄位
		extendColumn(rpt, data) {
			rpt.$CD = data.$CD;
			rpt.$MSG = data.$MSG;
			rpt.$REMOVED = rpt.$REMOVED || false;

			// 改價前的價格
			rpt.$BEFORE_REPLACE_VALUE = rpt.$CONDITION_VALUE_NOR;
			// 改量前的數量
			rpt.$BEFORE_REPLACE_QTY = rpt.$AVAILABLE_QTY;
			
			// 此回報是 SMO 智慧單的回報
			rpt.$IS_SMO = !!rpt.SMO || this.isSMOtype(rpt.TC_ORDER_TYPE);
			// 本筆回報是否屬於仍在 Dcore 上的雲端單(phase <50) 且是洗價單類型
			rpt.$IS_CLOUD = (rpt.$IS_SMO || rpt.MARKET_WATCH) && rpt.REPORT_KEY.phase < 50;
			// 此回報是 OCO 單的回報
			rpt.$IS_OCO = !!(rpt.SMO && rpt.OCO) || rpt.OCO;
			// 合約代碼
			rpt.$SYMBOL = rpt.$IS_OCO ? rpt.OCO[0].SYMBOL : rpt.SYMBOL;
			// 交易所名稱
			rpt.$EXG_NAME = rpt.$EXG_NAME || M4C.Symbol.getExchangeName(rpt.$SYMBOL);
			// 合約名稱
			rpt.$CONTRACT_NAME = rpt.$CONTRACT_NAME || M4C.Symbol.getCNM4(rpt.$SYMBOL, " ");
			// 複式單
			if (rpt.SYMBOL2)
				rpt.$CONTRACT_NAME2 = rpt.$CONTRACT_NAME2 || M4C.Symbol.getCNM4(rpt.SYMBOL2);
			rpt.$SIDE = rpt.SIDE || (rpt.$IS_OCO ? rpt.OCO[0].SIDE : null);
			rpt.$POSITION_EFFECT = rpt.POSITION_EFFECT || (rpt.$IS_OCO ? rpt.OCO[0].POSITION_EFFECT : null);
			// 本委託是否為有效的 working 單
			rpt.$ISWORKING = rpt.AMENDABLE;
			// 委託數量
			// rpt.$ORDER_QTY = rpt.$IS_OCO && rpt.OCO[0] ? rpt.OCO[0].ORDER_QTY : rpt.ORDER_QTY;
			// 配合 Server 調整委託數量欄位邏輯 https://trello.com/c/BOG6SJm2
			rpt.$ORDER_QTY = rpt.ORDER_QTY != null ? rpt.ORDER_QTY : (rpt.$IS_OCO && rpt.OCO[0] ? rpt.OCO[0].ORDER_QTY : 0);
			// 是否為價差商品
			rpt.$IS_PRICE_DIFF = M4C.Symbol.isPriceDiff_FutSymbol(rpt.$SYMBOL);

			// 本商品價格是否超過 8 個字元長度
			let len1 = `${rpt.ORDER_PRICE || 0}`.length;
			let len2 = `${rpt.AVG_PRICE || 0}`.length;
			let len3 = `${rpt.STOP_PRICE || 0}`.length;
			rpt.$LONG = len1 > 8 || len2 > 8 || len3 > 8;

			// 委託狀態 (同一筆委託狀態會變)
			switch (rpt.REPORT_KEY.status) {
				case "Rejected":
					rpt.$STATUS = "委託失敗";
					rpt.$IS_FAIL = true;
					break;
				case "Cancelled":
					if (rpt.CUM_QTY > 0) {
						rpt.$IS_PARTIAL_FILLED = true;
						rpt.$STATUS = "部分成交其馀删单";
					}
					else
						rpt.$STATUS = "刪單成功";
					break;
				case "PendingNew":
					rpt.$STATUS = "委託收到";
					break;
				case "New":
					// 新的SMO單顯示洗價中
					if(rpt.$IS_CLOUD) rpt.$STATUS = "洗价中";
					// 一般委託顯示委託成功
					else rpt.$STATUS = "委託成功";
					break;
				case "PartiallyFilled":
				case "IOCFilled":
					rpt.$STATUS = "部份成交";
					rpt.$IS_FILLED = true;
					rpt.$IS_PARTIAL_FILLED = true;
					break;
				case "Filled":
					rpt.$STATUS = "完全成交";
					rpt.$IS_FILLED = true;
					rpt.$IS_TOTAL_FILLED = true;
					// [完全成交] 後，要刪除 [有效委託] / [部分成交] 標籤
					delete rpt.$IS_PARTIAL_FILLED;
					break;                
				case "Replaced":
					// 新的SMO單顯示洗價中
					if (rpt.$IS_CLOUD) rpt.$STATUS = "洗价中";
					else rpt.$STATUS = "改單成功";
					break;
				case "Reduced":
					rpt.$STATUS = "減量成功";
					break;
				case "Repriced":
					if (rpt.$IS_CLOUD) rpt.$STATUS = "洗价中";
					else rpt.$STATUS = "改價成功";
					break;
				case "PendingReplace":
					rpt.$STATUS = "改单收单成功";
					break;
				case "PendingCancel":
					rpt.$STATUS = "删单收单成功";
					break;
				case "Restated":
					rpt.$STATUS = "预约单已转换";
					break;
			}

			// OCO -> 剩餘有效委託數量
			// OCO 還沒被觸發前，不存在 rpt.AVAILABLE_QTY 欄位，需要依據 phase 來決定要從哪裡取得剩餘有效口數 (僅適用 Working 單)
			if (rpt.$IS_OCO && rpt.$ISWORKING && !rpt.AVAILABLE_QTY) {
				// 剩餘有效委託 : phase50前，顯示止盈止損的 ORDER_QTY ; phase50後，顯示上層的 LEAVES_QTY
				if (rpt.REPORT_KEY.phase < 50)
					rpt.$AVAILABLE_QTY = rpt.OCO[0].ORDER_QTY;
				else
					rpt.$AVAILABLE_QTY = rpt.LEAVES_QTY;
			}
			else
				rpt.$AVAILABLE_QTY = rpt.AVAILABLE_QTY;

			// 已撤單數量(須在加值欄位$AVAILABLE_QTY之後才計算否則會有問題)
			rpt.$REMOVED_QTY = (rpt.$ORDER_QTY || 0) - (rpt.$AVAILABLE_QTY || 0) - (rpt.CUM_QTY || 0);

			// 更新時間
			if (rpt.UPDATE_TIME)
				rpt.$UPDATE_TIME = new Date(rpt.UPDATE_TIME).time8();
			// 複式單 or 價差商品 -> 直接顯示委託價格，不做轉換處理
			if (rpt.SYMBOL2 || rpt.$IS_PRICE_DIFF) {
				rpt.$ORDER_PRICE = rpt.ORDER_PRICE;
				rpt.$ORDER_PRICE_TXT = rpt.ORDER_PRICE;
			}
			else {
				rpt.$ORDER_PRICE = rpt.ORDER_PRICE > 0? this.$updatePrice(rpt.SYMBOL, rpt.ORDER_PRICE): rpt.ORDER_PRICE;
				rpt.$ORDER_PRICE_TXT = rpt.ORDER_PRICE != 0 ? rpt.$ORDER_PRICE : (rpt.ORDER_TYPE == 'RANGED' ? this.$ln('一定范围市价') : this.$ln('市价'));
			}
			// 成交均價
			if (rpt.AVG_PRICE)
				rpt.$AVG_PRICE = this.$updatePrice(rpt.SYMBOL, rpt.AVG_PRICE);

			// 備註內容 https://trello.com/c/l9FmXH8d, https://trello.com/c/iX5HPcFf
			rpt.$MEMO = `${rpt.CODE}${rpt.MSG ? (' | '+ rpt.MSG) : ''}`;

			// 是否為一般委託單(根據SERVER提供的CONDITION_TYPE判斷，理論上會更新。但交易所的不確定)
			this.$set(rpt, "$IS_NormalOrder", rpt.CONDITION_TYPE == 'NORMAL');
			// 智慧單觸發價
			if (rpt.$IS_SMO || rpt.$IS_OCO) {
				let orderInfo1 = rpt.$IS_OCO? rpt.OCO[0]: rpt;
				let orderInfo2 = rpt.$IS_OCO? rpt.OCO[1]: {};
				let additionRpt1 = rpt.$IS_OCO && rpt.$ADDITIONAL_REPORT_SMO? rpt.$ADDITIONAL_REPORT_SMO.OCO[0] || {}: rpt.$ADDITIONAL_REPORT_SMO || {};
				let additionRpt2 = rpt.$IS_OCO && rpt.$ADDITIONAL_REPORT_SMO? rpt.$ADDITIONAL_REPORT_SMO.OCO[1] || {}: rpt.$ADDITIONAL_REPORT_SMO || {};
				// 這邊要用各種方法找出正確的 ticksize，從 RD 這邊的判斷是這樣拿的順序
				let curPrice = orderInfo1.ORDER_PRICE
					|| M4C.Quote.getQuoteObject(rpt.$SYMBOL).p
					|| (rpt.SMO ? (rpt.SMO.TRAILING_INITIAL || rpt.SMO.TRAILING_PEAK) : null)
					|| rpt.TRAILING_PEAK;
				let tsi = M4C.Symbol.getTickSize(rpt.$SYMBOL, curPrice);
				
				// 條件1
				let condition1 = orderInfo1;
				// 條件2
				let condition2 = orderInfo2? orderInfo2: {};
				// 條件1是否為保本單
				let isGUARANTEE1 = condition1.TRAILING_TYPE == 'GUARANTEE';
				// 條件2是否為保本單
				let isGUARANTEE2 = condition2.TRAILING_TYPE == 'GUARANTEE';
				// 條件1是否為移動停損
				let isTS1 = condition1.TRAILING_TYPE && condition1.TRAILING_TYPE != 'GUARANTEE';
				// 條件2是否為移動停損
				let isTS2 = condition2 && condition2.TRAILING_TYPE && condition2.TRAILING_TYPE != 'GUARANTEE';
				// SERVER的觸發價
				let _smoTrgPrice1 = condition1.SMO? condition1.SMO.TRG_PRICE: '';
				let smoTrgPrice1 = _smoTrgPrice1? this.$updatePrice(orderInfo1.SYMBOL, _smoTrgPrice1): '';
				let _smoTrgPrice2 = condition2.SMO? condition2.SMO.TRG_PRICE: '';
				let smoTrgPrice2 = _smoTrgPrice2? this.$updatePrice(orderInfo2.SYMBOL, _smoTrgPrice2): '';
				// 支持TC_ORDER_TYPE後調整的觸發價資料 新格式停損價 > 新格式觸價 > 原始SMO觸發價
				let _trg_price1 = condition1.STOP_PRICE || condition1.TOUCH_PRICE;
				let _trg_price2 = condition2.STOP_PRICE || condition2.TOUCH_PRICE;
				// 觸發價1
				let trgPrice = _trg_price1? this.$updatePrice(orderInfo1.SYMBOL, _trg_price1): '';
				// 觸發價2
				let trgPrice2 = _trg_price2? this.$updatePrice(orderInfo2.SYMBOL, _trg_price2): '';
				// 移動停損價1
				let _TRAILINGSTOP_Price1 = isTS1 && additionRpt1.PEAK_PRICE? this.$safeFloat(additionRpt1.PEAK_PRICE - tsi * orderInfo1.TRAILING_VALUE * (orderInfo1.SIDE =="BUY"? -1: 1)): "";
				let	TRAILINGSTOP_Price1 = _TRAILINGSTOP_Price1? this.$updatePrice(orderInfo1.SYMBOL, _TRAILINGSTOP_Price1): _TRAILINGSTOP_Price1;
				// 移動停損價2
				let _TRAILINGSTOP_Price2 = isTS2 && additionRpt2.PEAK_PRICE? this.$safeFloat(additionRpt2.PEAK_PRICE - tsi * orderInfo2.TRAILING_VALUE * (orderInfo1.SIDE =="BUY"? -1: 1)): "";
				let	TRAILINGSTOP_Price2 = _TRAILINGSTOP_Price2? this.$updatePrice(orderInfo2.SYMBOL, _TRAILINGSTOP_Price2): _TRAILINGSTOP_Price2;
				// 只有保本單(GUARANTEE)才帶價格，其餘是非價格資料
				// 觸發設定值1
				let trgValue1 = isGUARANTEE1? this.$updatePrice(orderInfo1.SYMBOL, condition1.TRAILING_VALUE): condition1.TRAILING_TYPE? condition1.TRAILING_VALUE: '';
				// 觸發設定值2
				let trgValue2 = isGUARANTEE2? this.$updatePrice(orderInfo2.SYMBOL, condition2.TRAILING_VALUE): condition2.TRAILING_TYPE? condition2.TRAILING_VALUE: '';
				// 顯示觸發設定值1(改以set方式響應，因某些下單方式(console命令)所收到的回報內容，在指派新變數時不是響應式的。)
				this.$set(rpt, "$CONDITION_VALUE", smoTrgPrice1 || trgPrice || TRAILINGSTOP_Price1 || trgValue1);
				// 原始設定值1(不加乘數、分數)
				this.$set(rpt, "$CONDITION_VALUE_NOR", _smoTrgPrice1 || _trg_price1 || _TRAILINGSTOP_Price1 || condition1.TRAILING_VALUE);
				// 顯示觸發設定值2
				this.$set(rpt, "$CONDITION_VALUE2", smoTrgPrice2 || trgPrice2 || TRAILINGSTOP_Price2 || trgValue2);
				// 原始設定值2(不加乘數、分數)
				this.$set(rpt, "$CONDITION_VALUE2_NOR", _smoTrgPrice2 || _trg_price2 || _TRAILINGSTOP_Price2 || condition2.TRAILING_VALUE);
				rpt.$ORDER_PRICE = orderInfo1.ORDER_PRICE != 0? this.$updatePrice(orderInfo1.SYMBOL, orderInfo1.ORDER_PRICE): orderInfo1.ORDER_PRICE;
				rpt.$ORDER_PRICE2 = orderInfo2.ORDER_PRICE != 0? this.$updatePrice(orderInfo2.SYMBOL, orderInfo2.ORDER_PRICE): orderInfo2.ORDER_PRICE;
				if(!rpt.$IS_OCO && !rpt.TOUCH_PRICE && condition1.CONDITION=='TOUCH') {
					rpt.TOUCH_PRICE = condition1.TRG_PRICE;
				}
				if(!rpt.$IS_OCO && !rpt.STOP_PRICE && condition1.CONDITION=='STOP') {
					rpt.STOP_PRICE = condition1.TRG_PRICE;
				}
				// 顯示用價格文字
				rpt.$ORDER_PRICE_TXT = orderInfo1.ORDER_PRICE != 0 ? this.$updatePrice(orderInfo1.SYMBOL, orderInfo1.ORDER_PRICE) : (orderInfo1.ORDER_TYPE == 'RANGED' ? this.$ln('一定范围市价') : this.$ln('市价'));
				if (orderInfo2.ORDER_PRICE != null)
					rpt.$ORDER_PRICE_TXT2 = orderInfo2.ORDER_PRICE != 0 ? this.$updatePrice(orderInfo2.SYMBOL, orderInfo2.ORDER_PRICE) : (orderInfo2.ORDER_TYPE == 'RANGED' ? this.$ln('一定范围市价') : this.$ln('市价'));
				
				// 以觸發價計算TS_LEVEL的委託價
				if(!orderInfo1.ORDER_PRICE && orderInfo1.TS_LEVEL) {
					let side = orderInfo1.SIDE == "BUY"? 1: -1;
					// 以觸發價計算委託價
					let orderPriceByTs = this.$safeFloat(rpt.$CONDITION_VALUE_NOR + (tsi * orderInfo1.TS_LEVEL * side));
					rpt.$ORDER_PRICE_TXT = orderInfo1.$ORDER_PRICE_TXT = this.$updatePrice(orderInfo1.SYMBOL, orderPriceByTs);
				}
				if(!orderInfo2.ORDER_PRICE && orderInfo2.TS_LEVEL) {
					let side = orderInfo2.SIDE == "BUY"? 1: -1;
					// 以觸發價計算委託價
					let orderPriceByTs = this.$safeFloat(rpt.$CONDITION_VALUE2_NOR + (tsi * orderInfo2.TS_LEVEL * side));
					rpt.$ORDER_PRICE_TXT2 = orderInfo2.$ORDER_PRICE_TXT = this.$updatePrice(orderInfo2.SYMBOL, orderPriceByTs);
				}

				// 洗價單OCO但已不在dcore洗價(已觸價)
				if(!rpt.$IS_CLOUD && rpt.$IS_OCO && rpt.SMO) {
					// 因SERVER更新的資料在SMO，所以不能取委託的OCO
					let oi1 = rpt.$IS_OCO? rpt.SMO.OCO[0]: rpt;
					let oi2 = rpt.$IS_OCO? rpt.SMO.OCO[1]: {};
					let oi1PriceDiff = Math.abs(rpt.SMO.TRG_PRICE - (oi1.SMO.TRG_PRICE || rpt.$CONDITION_VALUE_NOR));
					let oi2PriceDiff = oi2.SMO? Math.abs(rpt.SMO.TRG_PRICE - (oi2.SMO.TRG_PRICE || rpt.$CONDITION_VALUE2_NOR)): 9999;
					// 在SERVER 0.34.1版時，觸價時會在SMO欄位內加帶OCO_SUB_ID;
					let touch_OCO_SUB_ID = rpt.SMO.OCO_SUB_ID;
					let side = 0;
					// 有取到才用OCO_SUB_ID來判斷處理
					if(touch_OCO_SUB_ID) {
						// OCO內的OCO_SUB_ID在收單及觸價時，SERVER都會帶過來
						if(touch_OCO_SUB_ID === oi1.OCO_SUB_ID)
							side = 1;
						if(touch_OCO_SUB_ID === oi2.OCO_SUB_ID)
							side = 2;
					}
					else {
						// 判斷觸發邊(不能只以CONDITION判斷，需加判斷觸發價。CONDITION有可能兩邊都一樣，觸發價不一定就是OCO初始的觸發價所以要比大小來判斷。
						// 目前SERVER沒有這樣的資訊。)
						if(rpt.SMO.CONDITION == oi1.SMO.CONDITION && oi1PriceDiff <= oi2PriceDiff)
							side = 1
						if(rpt.SMO.CONDITION == oi2.SMO.CONDITION && oi2PriceDiff <= oi1PriceDiff)
							side = 2
					}
					this.$set(rpt, "$TOUCHED_SIDE", side);
					// 處理觸價後的一般單改價(將委託價同步到智慧單設定上)
					if(rpt.ORDER_PRICE && rpt.$TOUCHED_SIDE == 1) {
						rpt.$ORDER_PRICE_TXT = rpt.$ORDER_PRICE = this.$updatePrice(orderInfo1.SYMBOL, rpt.ORDER_PRICE);
					}
					if(rpt.ORDER_PRICE && rpt.$TOUCHED_SIDE == 2) {
						rpt.$ORDER_PRICE_TXT2 = rpt.$ORDER_PRICE2 = this.$updatePrice(orderInfo1.SYMBOL, rpt.ORDER_PRICE);
					}
				}
			}
			// 是否為保護限價
			if (!this.twMode && rpt.$SYMBOL) {
				rpt.$IS_PROTECTION = rpt.$SYMBOL.indexOf('I.S.SSE') === 0 && 
					(	rpt.TC_ORDER_TYPE === 'HIT' || 		// 對方價
						rpt.TC_ORDER_TYPE === 'JOIN' || 		// 本方價
						rpt.TC_ORDER_TYPE === '5LvlMKT' || 	// 五檔市價
						rpt.TC_ORDER_TYPE === '5LvlMTL'		// 五檔市價轉限價
					);
			}
		},
		// 取得此回報的倉別文字
		getPositionEffectText(rpt) {
			switch(rpt.$POSITION_EFFECT) {
				case 'AUTO': return this.$ln("自动");
				case 'OPEN': return this.$ln("新仓");
				case 'CLOSE': return this.$ln("平仓");
				case 'DAYTRADE': return this.$ln("当冲");
				case 'CTD': return this.$ln("平今");
				case 'CYD': return this.$ln("平昨");
				case 'CWO': return this.$ln("备兑开仓");
				case 'CWC': return this.$ln("备兑平仓");
				case 'PCTD': return this.$ln("優先平今");
				case 'PCYD': return this.$ln("優先平昨");
			}
			return '--';
		},
		// 取得此回報的委託價格別文字
		getOrderTypeText(rpt) {
			return vuex.config.mapOrderTypeLabel[rpt.TC_ORDER_TYPE] || rpt.TC_ORDER_TYPE;
		},
	},
	watch: {
		/** 資金帳號切換 -> 重查 */
        btaID(nv, ov){
            // 有切換帳號才重查，新登入不處理(交由loginReady時執行)。
            if(ov && nv != ov) {
                this.queryReport();
				// 重設回報編號
				this.workingIndex = 0;
			}
		},
		// 總表完成 && 登入完成
		mainformReadyAndLoginReady(nv) {
			if (nv)
				this.queryReport({first: true});
			else
				this.clearData();
		},
		/** 語系切換 -> 重查 (重造所有商品的名稱) */
		'$store.state.lang.language'(nv) {
			this.queryReport();
		},
	},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		baID() {
			return this.$store.state.login.baID;
		},
		btaID() {
			return this.$store.state.login.btaID;
		},
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		accountID() {
			return this.$store.state.login.accountID;
		},
		mainformReadyAndLoginReady() {
			return this.$store.state.status.mainformReady && this.$store.state.selectedWSConn.loginReady;
		},
		langCode() {
			return this.$store.state.lang.language;
		},
		mappingTable() {
			return this.$store.state.lang.mappingTable;
		},
		btID() {
			return this.$store.state.login.btID;
		},
		availableReportList() {
			return this.$store.state.data.availableReportList;
		},
		orderReportList() {
			return this.$store.state.data.orderReportList;
		},
		filledReportList() {
			return this.$store.state.data.filledReportList;
		},
		cloudReportList() {
			return this.$store.state.data.cloudReportList;
		},
		// 價格補小數位數
		$updatePrice() {return this.$store.state.fn.$updatePrice;},
	},
}
</script>
