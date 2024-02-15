<template>
    <div class="m4c-sci-chart-data hidden" />
</template>

<script>
import ChartDataWorker from './M4C.ChartData.worker.js'
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			chartData: {},
			timeKeyList: {},
			/** 紀錄哪個元件訂閱哪個 QueryKey(sid,nk)，以供資料回來後對應發送 */
			mapQueryKeyToComponent: {},
			/** 記錄該查詢的 command 內容 */
			mapRKeyToQueryKey: {},
			/** 紀錄哪個 QueryKey 是處於查詢中的狀態 */
			recoveringQueryKey: {},
			mapRKeyToQuerySid: {},
			optionDefenceData: {},
			// 各 NK 預設回補天數
			mapNkToDayLen: {
				'1': 1,
				'5': 5,
				'15': 15,
				'30': 30,
				'60': 30,
				'd': 365*5,
				'w': 365*10,
				'm': 365*10,
			},
			// 此 queryKey 最後回補的起始日期
			mapQueryKeyToStartDate: {},
			mapRKeyToBySub: {},
			// 此 queryKey 已經無更多資料
			queryKeyIsNoMoreData: {},
			// 當前訂閱中的表
			inSubscribeKey: {},
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.SciChartData = this.$store.state.m4c.sciChartData = this;
		// 註冊資料分派
		M4C.regDispatch({'s': 'K', 'callback': this.onKData.bind(this)});
		M4C.regDispatch({'s': 'HistoryData', 'c': 'merger', 'callback': this.onHistoryData.bind(this)});
		M4C.regDispatch({'s': 'HistoryData', 'c': 'query', 'callback': this.onHistoryData.bind(this)});
		this.worker = new ChartDataWorker();
		this.worker.onmessage = this.onWorkerMessage.bind(this);
	},
    methods: {
		/** 查詢並訂閱指定 [商品+Nk] 的資料 */
		sub({com_instance, sid, nk = '1', nday}) {
			if (!com_instance || !sid)
				return;
			// 相關資料記錄在元件身上
			this.recordComponent({com_instance, sid, nk});
			// 回補資料
			this.doQuery({sid, nk, nday, bySub: true});
		},
		// 解除訂閱
		unsub({com_instance, sid, nk=1}) {
			if (!sid) return;
			let queryKey = `${sid},${nk}`;
			// 元件來訂閱表
			if (this.mapQueryKeyToComponent && this.mapQueryKeyToComponent[queryKey]) {
				delete this.mapQueryKeyToComponent[queryKey][com_instance.$SCI_ID];
				// 全部解訂後，刪除此 queryKey 記號，可避免 M4C.ChartData 與 M4C.SciChartData 有一邊出現多餘的忙碌
				if (Object.keys(this.mapQueryKeyToComponent[queryKey]).length === 0)
					delete this.mapQueryKeyToComponent[queryKey];
				// 還有其他組件訂閱中就不執行解訂
				else return;
			}
			// 解除訂閱即時K資料
			let subKey = `${sid}#${nk}`;
			let cmd = {
				"s": "K",
				"c": "unsub",
				"d": {"s": [subKey]},
				"r": "".random()
			};
			M4C.send(cmd);
			delete this.inSubscribeKey[subKey];
		},
		// 將一些資訊直接記錄在元件身上
		recordComponent({com_instance, sid, nk}) {
			let queryKey = `${sid},${nk}`;
			com_instance.$SCI_ID = com_instance.$SCI_ID || "".random(20);
			com_instance.$SCI_SID = sid;
			com_instance.$SCI_NK = nk;
			com_instance.$SCI_QUERY_KEY = `${sid},${nk}`;
			this.mapQueryKeyToComponent[queryKey] = this.mapQueryKeyToComponent[queryKey] || {};
			this.mapQueryKeyToComponent[queryKey][com_instance.$SCI_ID] = com_instance;
		},
		/** 取得更多資料 (自動依據上次查詢的參數) */
		getMore({com_instance, sdate, edate}) {
			let sid = com_instance.$SCI_SID;
			let nk = com_instance.$SCI_NK;
			let queryKey = `${sid},${nk}`;
			// 若此 queryKey 已無更多資料 -> 直接回覆 false
			if (this.queryKeyIsNoMoreData[queryKey])
				return false;
			let timeKeyList = this.timeKeyList[queryKey];
			let oldestDataDate = this.timeKeyToDate(timeKeyList[0]);
			let lastQueryStartDate = this.mapQueryKeyToStartDate[queryKey];
			edate = edate || (oldestDataDate < lastQueryStartDate ? oldestDataDate : lastQueryStartDate);
			this.doQuery({sid, nk, sdate, edate});
			return true;
		},
		/** 進行查詢 */
		doQuery({sid, nk, nday, bySub, sdate, edate}) {
			let rkey = "".random();
			// queryKey : [指定商品]+[指定分K] 的資料結構Key值
			let queryKey = `${sid},${nk}`;
			// 此 queryKey 已經在查詢中 -> 不再送出查詢
			if (this.recoveringQueryKey[queryKey]) return;
			// 此 queryKey 進入 [查詢中] 狀態
			this.recoveringQueryKey[queryKey] = true;
			// 回補命令
			let cmd = {
				"s": "HistoryData",
				"c": "merger",
				"d": {
					"s": sid,
					"type": isNaN(nk) ? nk : `k=${nk}`,
					"opt": 1,
				},
				"r": rkey
			};
			// 回補 N 天
			if (nday) {
				cmd.d.n = nday;
			}
			// 支持指定回補日期範圍
			else if (sdate && edate) {
				cmd.d.stime = sdate;
				cmd.d.etime = edate;
				// 記錄此 queryKey 最後指定的 sdate
				this.mapQueryKeyToStartDate[queryKey] = sdate ? this.timeKeyToDate(`${sdate}0000`) : obj.sdate;
			}
			// 回補指定日期區間（核心算的）
			else {
				let obj = this.getStartEndDate({sid, nk, bySub, edate});
				cmd.d.stime = obj.sdate.day8();
				if (obj.edate)
					cmd.d.etime = obj.edate.day8();
				// 記錄此 queryKey 最後指定的 sdate
				this.mapQueryKeyToStartDate[queryKey] = obj.sdate;
			}
			M4C.send(cmd);
			// 記錄該查詢對應參數
			this.mapRKeyToQueryKey[rkey] = queryKey;
			// 記錄此查詢是不是由 sub 發起
			this.mapRKeyToBySub[rkey] = bySub;
		},
		// 回補資料
		onHistoryData(data) {
			let rkey = data.r;
			let bySub = this.mapRKeyToBySub[rkey];
			// queryKey = "sid,nk"
			let queryKey = this.mapRKeyToQueryKey[rkey];
			if (!queryKey)
				return;
			let tmp = queryKey.split(',');
			let sid = tmp[0];
			let nk = tmp[1];
			// 移除此 queryKey 等待中狀態
			delete this.recoveringQueryKey[queryKey];

			// 分K(-24) 是假日情境 -> 要自動繼續往前回補 (若是無更多資料則會回 -25)
			if (data.cd === -24 && !isNaN(nk)) {
				this.doQuery({sid, nk, edate: this.mapQueryKeyToStartDate[queryKey]});
				return;
			}
			// 分K(-25) || 日K(-24) -> 已無更多資料
			if (data.cd === -25 || (data.cd === -24 && isNaN(nk))) {
				this.queryKeyIsNoMoreData[queryKey] = true;
			}
			// 查詢失敗 -> 回覆錯誤碼
			if (data.cd < 0) {
				// 送出給有訂閱的元件
				this.dispatchChartError({sid, nk, queryKey, errCode: data.cd});
				delete this.mapRKeyToQueryKey[rkey];
				return;
			}
			// 合併回補後資料 (經測試約 1-2ms)
			this.prepareChartData(queryKey, data.d);
			// 收到最後一筆資料
			if (data.lt) {
				// 移除此 rkey to queryKey 的對應關係
				delete this.mapRKeyToQueryKey[rkey];
				this.onQueryComplete({queryKey, sid, nk, bySub});
			}
		},
		onQueryComplete({queryKey, sid, nk, bySub}) {
			let timeKeyList = this.timeKeyList[queryKey];
			// 已存在資料
			if (timeKeyList) {
				// 回補完成後資料長度仍沒有變時
				if (!bySub && Object.keys(this.chartData[queryKey]).length === timeKeyList.length) {
					// 繼續往前回補
					this.doQuery({sid, nk, edate: this.mapQueryKeyToStartDate[queryKey]});
				}
			}
			// 送出給有訂閱的元件
			this.prepareTimekeyList(sid, nk, queryKey);
			// 訂閱即時Ｋ
			let subKey = `${sid}#${nk}`;
			if (!this.inSubscribeKey[subKey]) {
				let cmd = {
					"s": "K",
					"c": "sub",
					"d": {"s": [subKey]},
					"r": "".random()
				};
				M4C.send(cmd);
				// 訂閱中的Key
				this.inSubscribeKey[subKey] = true;
			}
		},
		// 即時K資料
		onKData(data) {
			let nk = data.d.k;
			if (!nk) return;
			let sid = data.d.s;
			if (!sid) return;
			let queryKey = `${sid},${nk}`;
			let instanceList = this.mapQueryKeyToComponent[queryKey];
			if (!instanceList) return;
			let thisChartData = this.chartData[queryKey];
			let timeKeyList = this.timeKeyList[queryKey];
			if (thisChartData && timeKeyList) {
				let timeKey = this._getTimeKey(data.d, nk==='d');
				// 更新 timeKeyList
				if (!thisChartData[timeKey])
					timeKeyList.push(timeKey);
				let index = timeKeyList.length - 1;
				// 判斷是全新的還是更新的
				let method = thisChartData[timeKey] ? 'onUpdateTick' : 'onAppendTick';
				// 填入資料
				thisChartData[timeKey] = data.d;
				for (let subID in instanceList) {
					let com_instance = instanceList[subID];
					if (com_instance[method])
						com_instance[method](index, thisChartData[timeKey], timeKey, timeKeyList);
				}
			}
		},
		// 發送整理後資料給有訂閱此 [sid,nk] 的元件
		prepareTimekeyList(sid, nk, queryKey) {
			if (!this.mapQueryKeyToComponent[queryKey])
				return;
			// 送 worker 運算出 timeKeyList
			this.worker.postMessage({
				action: 'calc_TimeKeyList_ChartData',
				data: this.chartData[queryKey],
				p: {
					sid: sid,
					queryKey: queryKey,
					nk: nk,
				},
			});
		},
		// 在 worker 裡整理好 timeKeyList
		onWorkerMessage(e) {
			let {action, result, p} = e.data;
			let sid = p.sid;
			switch(action) {
				case 'calc_TimeKeyList_ChartData':
					let chartData = this.chartData[p.queryKey] = result.chartData;
					let timeKeyList = this.timeKeyList[p.queryKey] = result.timeKeyList;
					let instanceList = this.mapQueryKeyToComponent[p.queryKey];
					// 所有訂閱此 queryKey 的元件
					for (let subID in instanceList) {
						let com_instance = instanceList[subID];
						this.dispatchChartData({com_instance, sid, chartData, timeKeyList});
						// 深度清理
						for (let key in p) {delete p[key];}
						for (let key in result) {delete result[key];}
					}
					break;
			}
		},
		// 派發資料，幫元件區分 onInitData 或 onMoreData
		dispatchChartData({com_instance, sid, chartData, timeKeyList}) {
			let lastTimeKeyStart = com_instance.$SCI_TIMEKEY_START;
			// 該元件首次取得回補資料
			if (!lastTimeKeyStart) {
				com_instance.$SCI_TIMEKEY_START = timeKeyList[0];
				com_instance.onInitData({sid, chartData, timeKeyList});
			}
			// 該元件取得更多回補資料
			else if (timeKeyList[0] !== lastTimeKeyStart) {
				com_instance.$SCI_TIMEKEY_START = timeKeyList[0];
				let cnt = timeKeyList.indexOf(lastTimeKeyStart);
				com_instance.onMoreData({sid, chartData, timeKeyList, moreTimeKeyList: timeKeyList.slice(0, cnt)});
			}
		},
		// 查詢失敗回覆錯誤碼
		dispatchChartError({sid, nk, queryKey, errCode}) {
			let instanceList = this.mapQueryKeyToComponent[queryKey];
			if (instanceList) {
				for (let subID in instanceList) {
					let com_instance = instanceList[subID];
					if (com_instance.onChartError)
						com_instance.onChartError(sid, errCode);
				}
			}
		},
		// 資料合併
		prepareChartData(queryKey, dataD) {
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
						if (cd[timeKey]) 
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
						if (cd[timeKey]) 
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
		getStartEndDate({sid, nk, bySub, edate}) {
			let queryKey = `${sid},${nk}`;
			let dayLen = this.mapNkToDayLen[nk];
			// 結束時間
			// edate = edate || new Date();
			// 已有資料時，使用第一筆時間作為結束時間 (bySub 表示訂閱時的回補，一律要補到最新時間)
			if (!edate && !bySub) {
				let timeKeyList = this.timeKeyList[queryKey];
				if (timeKeyList && timeKeyList[0])
					edate = this.timeKeyToDate(timeKeyList[0]);
			}
			// 開始時間
			let sdate = new Date((edate || new Date()).getTime() - dayLen*24*60*60*1000);
			
			// 最少要拿合約第一盤開始時間 (以免多天連假情境，算出來的 sdate 還達不到開盤日)
			let contractInfo = M4C.Symbol.getContractInfo(sid);
			if (contractInfo) {
				let openDT = new Date(contractInfo.TradingHours[0].open);
				sdate = sdate < openDT ? sdate : openDT;
			}			
			return {sdate, edate};
		},
		// '201906200601' -> Date
		timeKeyToDate(s) {
			let d = new Date();
			d.setFullYear(s.substr(0,4));
			d.setMonth(parseInt(s.substr(4,2))-1);
			d.setDate(s.substr(6,2));
			d.setHours(s.substr(8,2));
			d.setMinutes(s.substr(10,2));
			d.setSeconds(0);
			return d;
		},
		// 取得指定 合約+NK 的開盤 TimeKey
		getOpenTimeKey(sid, nk) {
			let queryKey = `${sid},${nk}`;
			// 開盤日期時間
			let contractInfo = M4C.Symbol.getContractInfo(sid);
			if (contractInfo) {
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
		'$store.state.wsConnMap.quote.acReady'(nv, ov) {
			if (nv) {
				// 斷線重連情境 : 對所有已存在的訂閱進行重新訂閱
				for (let queryKey in this.mapQueryKeyToComponent) {
					let instanceList = this.mapQueryKeyToComponent[queryKey];
					for (let subID in instanceList) {
						let com_instance = instanceList[subID];
						let sid = com_instance.$SCI_SID;
						let nk = com_instance.$SCI_NK;
						this.sub({com_instance, sid, nk});
					}
				}
			}
		},
	},
    computed: {},
}
</script>
