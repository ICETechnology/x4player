<template>
    <div class="m4c-chart-data hidden" />
</template>

<script>
import ChartDataWorker from './M4C.ChartData.worker.js'
import M4C_Base from '@/m4core/M4C.Base';
/**
 * 取得KBar時間
 * @member M4C_History_DataModule
 * @private
 * @param {TickData} tick 商品資料tick
 * @return {Date|undefined} KBar時間
 */
let parseTime = function(tick) {
	let tickDate = new Date();
	tickDate = tickDate.resetDate(tick.d);
	if (typeof tickDate === 'undefined') {
		console.error('[M4C.ChartData]', 'Cannot parse tick date: ' + tick.d);
		return;
	}
	tickDate = tickDate.resetTimetoMS(tick.t || 120000000);
	if (typeof tickDate === 'undefined') {
		console.error('[M4C.ChartData]', 'Cannot parse tick time: ' + tick.t);
		return;
	}
	return tickDate;
};

export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			/** 紀錄哪個元件訂閱哪個 QueryKey(sid,nk)，以供資料回來後對應發送 */
			mapQueryKeyToComponent: {},
			chartData: {},
			/** 記錄該查詢是幾分K (HistoryData 資料內未揭露) */
			mapRKeyToQueryKey: {},
			/** 紀錄哪個 QueryKey 是處於查詢中的狀態 */
			recoveringQueryKey: {},
			/** 各元件當前訂閱的 sid,nk */
			curSubContent: {},
			/** 每秒線圖資料容器 */
			secTickDataList: [],
			/** 最後訂閱的商品相關資 (斷線重連使用) */
			lastSub: {},

			mapRKeyToQuerySid: {},
			optionDefenceData: {},
			smileCurveData: {},
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.ChartData = this.$store.state.m4c.chartData = this;
		// 註冊資料分派
		M4C.regDispatch({'s': 'K', 'callback': this.onKData.bind(this)});
		M4C.regDispatch({'s': 'HistoryData', 'c': 'merger', 'callback': this.onHistoryData.bind(this)});
		M4C.regDispatch({'s': 'HistoryData', 'c': 'query', 'callback': this.onHistoryData.bind(this)});
		M4C.regDispatch({'s': 'OptionCloud', 'c': 'Query.OptionDefence', 'callback': this.onOptionDefence.bind(this)});
		M4C.regDispatch({'s': 'OptionCloud', 'c': 'Query.SmileCurve', 'callback': this.onSmileCurve.bind(this)});		
		M4C.regDispatch({'s': 'OptionCloud', 'c': 'Query.SmileCurve.Dispose', 'callback': this.onSmileCurveDispose.bind(this)});		

		this.worker = new ChartDataWorker();
		this.worker.onmessage = this.onWorkerMessage.bind(this);
	},
    methods: {
		// 查詢期權防守線
		queryOptionDefence(sid) {
			let tmp = sid.split('.');
			let rkey = "".random();
			this.mapRKeyToQuerySid[rkey] = sid;
			let map = this.optionDefenceData[sid] = this.optionDefenceData[sid] || {};
			// 取現有的資料中最舊的日期
			let date = Object.keys(map).sort()[0];
			let cmd = {
				"s": "OptionCloud",
				"c": "Query.OptionDefence",
				"d": {
					"type": tmp[1],
					"exchange": tmp[2],
					"commodity": tmp[3],
					"days": 1000,
				},
				"r" : rkey,
			}
			// 有date表示要回補更舊的資料
			if(date) {
				cmd.d["maxDate"] = Number(date);
			}
			M4C.send(cmd);
			return this.baseQuery('DataOptionDefence');
		},
		onOptionDefence(data) {
			let result = this.queryResult['DataOptionDefence'];
			if (!result) return;
			// 查詢完成
			if (data.cd === 0) {
				this.$set(result, "$STATUS", "DONE");
				clearTimeout(result.timeout);
				// 有資料
				let dd = data.d;
				let sid = this.mapRKeyToQuerySid[data.r];
				if (dd.data.length > 0) {
					this.$set(result, "$CD", data.cd);
					delete this.mapRKeyToQuerySid[data.r];
					let map = this.optionDefenceData[sid];
					dd.data.forEach((obj)=>{
						this.$set(map, obj.date, obj);
					});
					this.$set(result, "OptionDefenceData", map);
				}
				// 無資料
				else if (dd.data.length === 0) {
					// 調整$CD為-24無資料(與一般線圖機制同步)。
					this.$set(result, "$CD", -24);
					let map = this.optionDefenceData[sid];
					this.$set(result, "OptionDefenceData", map);
				}
			}
			// 查詢失敗
			else {
				this.$set(result, "$CD", data.cd);
				this.$set(result, "$STATUS", "FAIL");
				clearTimeout(result.timeout);
			}
		},
		// 查詢波動率資料
		querySmileCurve(sid) {
			let tmp = sid.split('.');
			let rkey = "".random();
			this.mapRKeyToQuerySid[rkey] = sid;
			let cmd = {
				"s": "OptionCloud",
				"c": "Query.SmileCurve",
				"d": {
					"exchange": tmp[2],
					"commodity": tmp[3],
					"month": tmp[4],
					"stream": true, // 訂閱
				},
				"r" : rkey,
			}
			M4C.send(cmd);
			return this.baseQuery('SmileCurveData');
		},
		// 解訂波動率資料
		unsubSmileCurve(sid) {
			let tmp = sid.split('.');
			let rkey = "".random();
			this.mapRKeyToQuerySid[rkey] = sid;
			let cmd = {
				"s": "OptionCloud",
				"c": "Query.SmileCurve.Dispose",
				"d": {
					"exchange": tmp[2],
					"commodity": tmp[3],
					"month": tmp[4],
				},
				"r" : rkey,
			}
			M4C.send(cmd);
			return this.baseQuery('unsubSmileCurveData');
		},
		// 收到波動率資料
		onSmileCurve(data) {
			let result = this.queryResult['SmileCurveData'];
			if (!result) return;
			// 查詢完成
			if (data.cd === 0) {
				this.$set(result, "$STATUS", "DONE");
				clearTimeout(result.timeout);
				// 有資料
				let dd = data.d;
				let sid = this.mapRKeyToQuerySid[data.r];
				let _data = dd.curve;
				if (_data && _data.length > 0) {
					this.$set(result, "$CD", data.cd);
					// delete this.mapRKeyToQuerySid[data.r];
					if(!this.smileCurveData[sid])
						this.$set(this.smileCurveData, sid, {data: {}, updateTime: ''});
						// this.smileCurveData[sid] = {};
					_data.forEach((obj)=>{
						this.$set(this.smileCurveData[sid].data, obj.strike, obj);
					});
					this.$set(this.smileCurveData[sid], 'updateTime',  dd.updateAt);
					this.$set(result, "SmileCurveData", this.smileCurveData[sid]);
					// this.$set(result, "updateTime", dd.updateAt);
				}
				// 無資料
				else if (_data && _data.length === 0) {
					// 調整$CD為-24無資料(與一般線圖機制同步)。
					this.$set(result, "$CD", -24);
					let map = this.smileCurveData[sid];
					this.$set(result, "SmileCurveData", map);
				}
			}
			// 查詢失敗
			else {
				this.$set(result, "$CD", data.cd);
				this.$set(result, "$STATUS", "FAIL");
				clearTimeout(result.timeout);
			}
		},
		// 收到解訂波動率資料
		onSmileCurveDispose(data) {
			let result = this.queryResult['unsubSmileCurveData'];
			if (!result) return;
			// 查詢完成
			if (data.cd === 0) {
				this.$set(result, "$STATUS", "DONE");
				clearTimeout(result.timeout);
			}
			// 解訂失敗
			else {
				this.$set(result, "$CD", data.cd);
				this.$set(result, "$STATUS", "FAIL");
				clearTimeout(result.timeout);
			}
		},
		/** 查詢並訂閱指定 [商品+Nk] 的資料 */
		sub(com_instance, sid, nk = '1', sdate, edate, nday) {
			if (!sid) return;
			this.doQuery(com_instance, sid, nk, sdate, edate, nday);
			this.lastSub = {'com_instance': com_instance, 'sid': sid, 'nk': nk};
		},
		/** 查詢並訂閱指定 [商品+Nk] 的資料(query方式，請依文件使用) */
		subQuery(com_instance, sid, nk = '1', sdate, edate, nday) {
			if (!sid) return;
			// 因query與merger使用差不多，暫時不多做調整，僅帶命令參數替換。
			this.doQuery(com_instance, sid, nk, sdate, edate, nday, "query");
			this.lastSub = {'com_instance': com_instance, 'sid': sid, 'nk': nk};
		},
		/** 取得更多資料 (自動依據上次查詢的參數) */
		getMore(com_instance, mul) {
			let subID = this._getComInstanceSubID(com_instance);
			let obj = this.curSubContent[subID];
			if (obj) {
				// 前次查詢的開始時間
				let edate = obj.sdate;
				// 本次查詢的開始時間
				let sdate = this.getStartDate(obj.sid, obj.nk, edate, mul);
				this.doQuery(com_instance, obj.sid, obj.nk, sdate, edate);
			}
		},
		/** 進行查詢 */
		doQuery(com_instance, sid, nk, sdate, edate, nday, command) {
			let rkey = "".random();
			// queryKey : [指定商品]+[指定分K] 的資料結構Key值
			let queryKey = `${sid},${nk}`;
			// 元件來訂閱表
			let subID = this._getComInstanceSubID(com_instance);
			this.mapRKeyToQueryKey[rkey] = queryKey;
			this.mapQueryKeyToComponent[queryKey] = this.mapQueryKeyToComponent[queryKey] || {};
			this.mapQueryKeyToComponent[queryKey][subID] = com_instance;
			
			// 此 queryKey 已經在查詢中 -> 不再送出查詢
			if (this.recoveringQueryKey[queryKey]) return;
			// 此 queryKey 進入 [查詢中] 狀態
			this.recoveringQueryKey[queryKey] = true;
			// 至多 10 秒得要清掉，避免永遠不再發出查詢
			setTimeout(self=>{delete self.recoveringQueryKey[queryKey];}, 9988, this);
		
			// 取得查詢的開始時間(有帶nday就不以起始時間查詢)
			sdate = !nday? sdate || this.getStartDate(sid, nk): null;
			// 回補命令
			let cmd = {
				"s": "HistoryData",
				"c": command || "merger",
				"d": {
					"s": sid,
					"type": isNaN(nk) ? nk : `k=${nk}`,
					"opt": 1,
				},
				"r": rkey
			};
			if(sdate)
				cmd.d.stime = sdate;
			if(edate)
				cmd.d.etime = edate;
			if(nday)
				cmd.d.n = nday;
			M4C.send(cmd);
			this.curSubContent[subID] = {sid: sid, nk: nk, sdate: sdate};
		},
		unsub(com_instance, sid, nk=1) {
			if (!sid) return;
			let queryKey = `${sid},${nk}`;
			// 元件來訂閱表
			let subID = this._getComInstanceSubID(com_instance);
			if (this.mapQueryKeyToComponent && this.mapQueryKeyToComponent[queryKey]) {
				delete this.mapQueryKeyToComponent[queryKey][subID];
				// 全部解訂後，刪除此 queryKey 記號，可避免 M4C.ChartData 與 M4C.SciChartData 有一邊出現多餘的忙碌
				if (Object.keys(this.mapQueryKeyToComponent[queryKey]).length === 0)
					delete this.mapQueryKeyToComponent[queryKey];
			}

			// 轉回單月SID (即時訂閱 server 不支持 .HOT)
			let singleMonthSid = M4C.Symbol.toMonthSymbol(sid);
			// 解除訂閱即時K資料
			let cmd = {
				"s": "K",
				"c": "unsub",
				"d": {
					"s": [`${singleMonthSid}#${nk}`],
				},
				"r": "".random()
			};
			M4C.send(cmd);
			if(sid == this.lastSub.sid)
				this.lastSub = {};
		},
		// 回補資料
		onHistoryData(data) {
			let rkey = data.r;
			// queryKey = "sid,nk"
			let queryKey = this.mapRKeyToQueryKey[rkey];
			if (!queryKey)
				return;
			let tmp = queryKey.split(',');
			let sid = tmp[0];
			let nk = tmp[1];
			// 移除此 queryKey 等待中狀態
			delete this.recoveringQueryKey[queryKey];
			// 查詢失敗 -> 回覆錯誤碼
			if (data.cd < 0) {
				// 送出給有訂閱的元件
				this.dispatchChartError(sid, queryKey, data.cd);
				delete this.mapRKeyToQueryKey[rkey];
				return;
			}
			// 合併回補後資料 (經測試約 1-2ms)
			this._combineData(queryKey, data.d);
			// 收到最後一筆資料
			if (data.lt) {
				// 移除此 rkey to queryKey 的對應關係
				delete this.mapRKeyToQueryKey[rkey];
				// 送出給有訂閱的元件
				this.dispatchChartData(sid, nk, queryKey, false, data.cd);
				// 訂閱即時Ｋ
				this.subK(sid, nk);
			}
		},
		// 訂閱即時Ｋ
		subK(sid, nk) {
			// 轉回單月SID (即時訂閱 server 不支持 .HOT)
			let singleMonthSid = M4C.Symbol.toMonthSymbol(sid);
			// 訂閱即時K資料
			let cmd = {
				"s": "K",
				"c": "sub",
				"d": {
					"s": [`${singleMonthSid}#${nk}`],
				},
				"r": "".random()
			};
			M4C.send(cmd);
		},
		// 即時K資料
		onKData(data) {
			let nk = data.d.k;
			if (!nk) return;
			let sid = data.d.s;
			let sidHot = M4C.Symbol.toHotSymbol(sid);
			// 支持同步反映到 [單月] 與 [熱門月] 的訂閱要求
			[sid, sidHot].forEach(sid=>{
				let queryKey = `${sid},${nk}`;
				if (!this.mapQueryKeyToComponent[queryKey])
					return;
				let thisChartData = this.chartData[queryKey];
				if (thisChartData) {
					let timeKey = this._getTimeKey(data.d);
					thisChartData[timeKey] = data.d;
					this.dispatchChartData(sid, nk, queryKey, true);
				}
			});
		},
		// 發送整理後資料給有訂閱此 [sid,nk] 的元件
		dispatchChartData(sid, nk, queryKey, byRealTimeTick, queryErrCode) {
			if (!this.mapQueryKeyToComponent[queryKey])
				return;
			// 送 worker 運算出 timeKeyList
			this.worker.postMessage({
				action: 'calc_TimeKeyList_ChartData',
				data: this.chartData[queryKey],
				p: {
					sid: sid,
					queryKey: queryKey,
					byRealTimeTick: byRealTimeTick,
					queryErrCode: queryErrCode,
					nk: nk,
				},
			});
		},
		onWorkerMessage(e) {
			let {action, result, p} = e.data;
			switch(action) {
				case 'calc_TimeKeyList_ChartData':
					// 回補情境 -> 將排序後的 chartData 填回來用 (即時情境不用)
					if (!p.byRealTimeTick)
						this.chartData[p.queryKey] = result.chartData;
					let instanceList = this.mapQueryKeyToComponent[p.queryKey];
					for (let subID in instanceList) {
						let com_instance = instanceList[subID];
						if (com_instance.onChartData) {
							let sid = p.sid;
							let timeKeyList = result.timeKeyList;
							let byRealTimeTick = p.byRealTimeTick;
							let queryErrCode = p.queryErrCode;
							let nk = p.nk;
							com_instance.onChartData(sid, this.chartData[p.queryKey], timeKeyList, byRealTimeTick, queryErrCode, nk);
						}
					}
					// 深度清理
					for (let key in p) {delete p[key];}
					for (let key in result) {delete result[key];}
					break;
			}
		},	

		// 查詢失敗回覆錯誤碼
		dispatchChartError(sid, queryKey, errCode) {
			let instanceList = this.mapQueryKeyToComponent[queryKey];
			if (instanceList) {
				for (let subID in instanceList) {
					let com_instance = instanceList[subID];
					if (com_instance.onChartError)
						com_instance.onChartError(sid, errCode);
				}
			}
		},
		// 提供元件一個 unique 訂閱ID 用以建立 [訂閱表]
		_getComInstanceSubID(com_instance) {
			if (!com_instance.ss2_subscribe_id)
				com_instance.ss2_subscribe_id = "".random();
			return com_instance.ss2_subscribe_id;
		},
		// 資料合併
		_combineData(queryKey, dataD) {
			let cd = this.chartData[queryKey] = this.chartData[queryKey] || {};
			if (dataD.$data && dataD.$data.gzip)
				dataD.data = dataD.$data.gzip;
			if (Array.isArray(dataD.data)) {
				// 以 gzip 內容作為主體
				dataD.data.forEach((o)=>{
					let timeKey = this._getTimeKey(o);
					cd[timeKey] = o;
				});
				// 合併 opt 資料
				if (dataD.$data && dataD.$data.opt) {
					// 非分鐘線時，忽略掉 t (不要用來組合 timeKey 以免 server 來的 opt 有 t 造成組合出同一日多根的情況)
					let ignoreTime = isNaN(queryKey.split(',')[1]);
					dataD.$data.opt.forEach((o)=>{
						let timeKey = this._getTimeKey(o, ignoreTime);
						// gzip有當日交易資料才記錄opt
						if(cd[timeKey]) 
							cd[timeKey] = Object.assign(cd[timeKey] || {}, o);
						else
							console.log(`[CHART DATA] No gzip data but has opt data on`, timeKey);
					});
				}
				// 合併 statistic 資料
				if (dataD.$data && dataD.$data.statistic) {
					// 非分鐘線時，忽略掉 t (不要用來組合 timeKey 以免 server 來的 opt 有 t 造成組合出同一日多根的情況)
					let ignoreTime = isNaN(queryKey.split(',')[1]);
					dataD.$data.statistic.forEach((o)=>{
						let timeKey = this._getTimeKey(o, ignoreTime);
						// gzip有當日交易資料才記錄statistic
						if(cd[timeKey]) 
							cd[timeKey] = Object.assign(cd[timeKey] || {}, o);
					});
				}
			}
			delete dataD.$data;
		},
		// 取得 tick 的 timeKey
		_getTimeKey(o, ignoreTime) {
			let key = '' + o.d;
			if (!ignoreTime && o.t != null) {
				key += (o.t/100000).toString().addZero(4);
			}
			return key;
		},
		/** 取得查詢的開始日期八碼 ex. "20190725" */
		getStartDate(sid, nk, ed, mul=1) {
			let dayLen = 30;
			switch(`${nk}`) {
				case '1':	dayLen = 2;		break;
				case '5':	dayLen = 5;		break;
				case '15':	dayLen = 30;	break;
				case '30':	dayLen = 30;	break;
				case '60':	dayLen = 30;	break;
				case 'd':	dayLen = 365*5;	break;
				case 'w':	dayLen = 365*10;break;
				case 'm':	dayLen = 365*10;break;
			}
			let edate = !ed ? new Date() : new Date(ed.substr(0,4), parseInt(ed.substr(4,2)) - 1, ed.substr(6,2));
			let sdate = new Date(edate.getTime() - mul*dayLen*24*60*60*1000);
			
			// 最少要拿合約第一盤開始時間 (以免多天連假情境，算出來的 sdate 還達不到開盤日)
			let contractInfo = M4C.Symbol.getContractInfo(sid);
			if (contractInfo) {
				let openDT = new Date(contractInfo.TradingHours[0].open);
				sdate = sdate < openDT ? sdate : openDT;
			}
			
			return sdate.day8();
		},
		/** 取得查詢的開始日期八碼 ex. "20190725" */
		getThumbStartDate(sid, nk) {
			let dayLen = 1;
			switch(`${nk}`) {
				case '1':	dayLen = 0.02;	break;
				case '5':	dayLen = 0.05;	break;
				case '15':	dayLen = 0.2;	break;
				case '30':	dayLen = 0.3;	break;
				case '60':	dayLen = 1;		break;
				case 'd':	dayLen = 30;	break;
				case 'w':	dayLen = 180;	break;
				case 'm':	dayLen = 365*2;	break;
			}
			let now = Date.now();
			let sdate = new Date(now - dayLen*24*60*60*1000);
			
			// 最少要拿合約第一盤開始時間 (以免多天連假情境，算出來的 sdate 還達不到開盤日)
			let contractInfo = M4C.Symbol.getContractInfo(sid);
			if (contractInfo) {
				let openDT = new Date(contractInfo.TradingHours[0].open);
				sdate = sdate < openDT ? sdate : openDT;
			}
			
			return sdate.day8();
		},
		// 取得指定 合約+NK 的開盤 TimeKey
		getOpenTimeKey(sid, nk) {
			let queryKey = `${sid},${nk}`;
			// 開盤日期時間
			let contractInfo = M4C.Symbol.getContractInfo(sid);
			let openDT = new Date(contractInfo.TradingHours[0].open);
			let dateList = [];
			// 用開盤日期時間 逐日 往前找所有查詢日期看看有沒有資料
			for (let i=0; i<=30; i++) {
				let askDate = new Date(openDT.getTime() - i*24*60*60000 + nk*60000);
				let timeKey = this.dateToTimeKey(askDate);
				let chartData = this.chartData[queryKey];
				// 該交易日(開盤時間)有資料
				if (chartData && chartData[timeKey])
					return timeKey;
			}
		},
		// Date -> '201906200601'
		dateToTimeKey(d) {
			return d.getFullYear() + 
				("0" + (d.getMonth()+1)).slice(-2) +
				("0" + d.getDate()).slice(-2) +
				("0" + d.getHours()).slice(-2) + 
				("0" + d.getMinutes()).slice(-2);
		},		
	},
	watch: {
		// 報價登入完成
		'$store.state.wsConnMap.quote.loginReady'(nv, ov) {
			if (nv) {
				let lastSub = this.lastSub;
				if (lastSub.sid) {
					this.sub(lastSub.com_instance, lastSub.sid, lastSub.nk);
				}
			}
		},
	},
    computed: {},
}
</script>
