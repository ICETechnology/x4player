<template>
    <div class="m4c-combineposition hidden" />
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			combinePositionList: {},
			combinePosition: {},
			cmdMap: {},
			TYPE: {COMBINE: "組合", SPLIT: "拆解"},
			STATUS: {
				PendingNew: "申請中",
				New: "執行成功",
				Rejected: "執行失敗",
			},
			// 回補部位計數器
			callRestoreCount: 0,
			// 最大回補次數
			maxRestoreCount: 3,
			// 回補間隔時間(5秒)
			intervalDelay: 5000,
			intervalRestorePositionSum: '',
			/**	策略對映表
			 * N: 策略名稱
			 * exg: 該策略有支援的交易所代碼(大寫)
			 * futName: 非股票期權交易所要顯示的名稱
			 * type: 有這參數時，該策略為期貨策略
			 */
			strategyMap: {
				1: {N: "認購牛市價差", exg:["SSE","SZSE","DCE","GFEX"], futName: "买入期权垂直价差组合"},//PS
				2: {N: "認沽熊市價差", exg:["SSE","SZSE"], futName: "买入期权垂直价差组合"},//PS
				3: {N: "認沽牛市價差", exg:["SSE","SZSE","DCE","GFEX"], futName: "卖出期权垂直价差组合"},//PS
				4: {N: "認購熊市價差", exg:["SSE","SZSE"], futName: "卖出期权垂直价差组合"},//PS
				5: {N: "跨式空頭", exg:[], futName: "期权跨式"},//STD
				6: {N: "寬跨式空頭", exg:[], futName: "期权宽跨式"},//STG
				7: {N: "認購期權保證金轉備兌", exg:["SSE","SZSE"]},//PRT
				8: {N: "認購期權備兌轉保證金", exg:["SZSE"]},//PRT
				9: {N: "期貨同合約對鎖", exg:["DCE","GFEX"], type:"F"},//DS
				10: {N: "期貨跨期套利", exg:["DCE","GFEX"], type:"F"},//SP
				11: {N: "期貨跨品種", exg:["DCE"], type:"F"},//SPC
				12: {N: "賣出期貨期權", exg:["DCE","GFEX"]},
				13: {N: "買入期貨期權", exg:["DCE","GFEX"]},
				14: {N: "期權對鎖", exg:["DCE","GFEX"]},
				15: {N: "日历价差组合", exg:["DCE","GFEX"]},
			},
			// 股票期權交易所清單(用來判斷是否顯示不同策略名稱)
			stkOptionExgList: ['SSE', 'SZSE'],
			// 可組建議清單
			combineAvailableAdvice: [],
			// 可拆建議清單
			splitAvailableAdvice: [],
			// 全組建議清單
			combineAllAdvice: [],
			// 選擇權互抵清單
			positionNetList: [],
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.CombinePosition = this.$store.state.m4c.combineposition = this;
		// 註冊資料分派
		M4C.regDispatch({'s': 'TRADE', 'c': 'position.combine.get', 'callback': this.onCombinePositionData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'position.combine.add', 'callback': this.onCombinePositionAddData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'position.combine.advice', 'callback': this.onCombinePositionAdviceData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'position.netting.add', 'callback': this.onPositionNetAddData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'position.netting.query', 'callback': this.onPositionNetData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'notify.refresh', 'callback': this.onCombinePositionRefresh.bind(this)});
	},
	mounted() {
		// 初始化策略對映表。(依據CONFIG或公開設定的資料重新調整有支援組合持倉各策略的各個交易所清單)
		if(this.COMPOSITE_EXG_STRATEGYMAP) {
			for(let key in this.strategyMap) {
				let obj = this.strategyMap[key];
				if(obj.exg.length)
					obj.exg.splice(0);
				let sn = Number(key) - 1;
				for(let exg in this.COMPOSITE_EXG_STRATEGYMAP) {
					if(this.COMPOSITE_EXG_STRATEGYMAP[exg].indexOf(sn) != -1)
						obj.exg.push(exg);
				}
			}
		}
	},
    methods: {
		// 清除並重查组合持倉
		reloadCombinePosition(accountID = this.accountID) {
			this.clearData(accountID);
			return this.queryCombinePosition(accountID);
		},
		// 完整清除此帳號的组合持倉資料
		clearData(accountID = this.accountID) {
			if (Array.isArray(this.combinePositionList[accountID]))
				this.combinePositionList[accountID].splice(0);
			delete this.combinePosition[accountID];
		},
		// 查詢組合持倉
		queryCombinePosition(accountID = this.accountID) {
			if (!this.accountID) return;
			if (!this.$store.state.selectedWSConn.loginReady) return;
			M4C.send({
				"s": "TRADE",
				"c": "position.combine.get",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": this.accountID,
				},
				"r": "".random()
			});
			this.clearData();
			this.$store.state.result.queryCombineReportResult = this.baseQuery('QueryCombinePositionData');
			// return this.baseQuery('QueryCombinePositionData');
		},
		// 取得組合持倉列表 (響應式Array)
		getCombinePositionList(accountID = this.accountID) {
			// 此資金帳號组合持倉轉為 Array List
			if (this.combinePositionList[accountID] == null) {
				this.$set(this.combinePositionList, accountID, []);
				let combinePositionData = this.combinePosition[accountID];
				for (let sid in combinePositionData) {
					this.combinePositionList[accountID].push(combinePositionData[sid]);
				}
			}
			return this.combinePositionList[accountID];
		},
		// 整合組合持倉即時資料
		collectResultData(data) {
			if(!data.d) return;
			let accountID = this.accountID;
			let resultD = data.d;
			let cmdData = this.cmdMap[data.r] || {};
			if (!this.combinePosition[accountID])
				this.combinePosition[accountID] = {};
			let uid = resultD.ID || resultD.APPLY_ID;
			if(uid){
				// 補齊server給的資料。
				cmdData["APPLY_ID"] = resultD.APPLY_ID;			// 單號
				cmdData["STATUS"] = resultD.STATUS;				// 執行結果
				cmdData["RECEIVE_TIME"] = resultD.RECEIVE_TIME;	// 執行時間
				// 新的組合持倉
				let isNewPosition = !this.combinePosition[accountID][uid];
				let cpo = this.combinePosition[accountID][uid] = cmdData;
				// 無該資金帳號的組合持倉，建立map清單。
				if(!this.combinePositionList[accountID])
					this.$set(this.combinePositionList, accountID, []);
				// 新的組合持倉時置頂
				if (isNewPosition) {
					this.combinePositionList[accountID].unshift(cpo);
				}
			}
			// 清除對應表
			delete this.cmdMap[data.r];
		},
		// 執行組合持倉(含拆分)
		execCombinePosition(data) {
			let cmd = {
				"s": "TRADE",
				"c": "position.combine.add",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": this.accountID,
				},
				"r": "".random()
			}
			// 合併資料
			cmd.d = Object.assign(cmd.d, data);
			// 發送資料的對應表
			this.cmdMap[cmd.r] = cmd.d;
			M4C.send(cmd);
			return this.baseQuery('ExecCombinePositiontData' + "_" + cmd.r);
		},
		// 組拆建議查詢	type: 1: 可組, 2:可拆, 3:全組
		queryCombinePositionAdvice(type) {
			if(type === "1")
				this.combineAvailableAdvice = [];
			if(type === "2")
				this.splitAvailableAdvice = [];
			if(type === "3")
				this.combineAllAdvice = [];
			let cmd = {
				"s": "TRADE",
				"c": "position.combine.advice",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": this.accountID,
					"TYPE": type
				},
				"r": "".random()
			}
			M4C.send(cmd);
			return this.baseQuery('QueryCombinePositionAdvice');
		},
		// 部位互抵申請
		addPositionNet(symbol, qty) {
			let cmd = {
				"s": "TRADE",
				"c": "position.netting.add",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": this.accountID,
					"SYMBOL": symbol,
					"QTY": qty,
				},
				"r": "".random()
			}
			M4C.send(cmd);
			return this.baseQuery('QueryPositionNetAdd');
		},
		// 部位互抵查詢
		queryPositionNet() {
			this.positionNetList.splice(0);
			let cmd = {
				"s": "TRADE",
				"c": "position.netting.query",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": this.accountID,
				},
				"r": "".random()
			}
			M4C.send(cmd);
			return this.baseQuery('QueryPositionNet');
		},
		// 收到組合持倉資料
		onCombinePositionData(data) {
			let self = this;
			let result = this.baseOnTradeData('QueryCombinePositionData', data);
			if (data.cd === 0 && data.d.POSITION_COMBINE) {
				let combineList = [];
				if(Array.isArray(data.d.POSITION_COMBINE)){
					this.clearData();
					combineList = data.d.POSITION_COMBINE;
				}
				else 
					combineList = [data.d.POSITION_COMBINE];
				combineList.forEach((obj, idx)=>{
					let accountID = obj.ACCOUNT_ID;
					if (self.combinePosition[accountID] == null)
						self.combinePosition[accountID] = {};

					let uid = obj.ID || obj.APPLY_ID;
					// 此組合是全新組合持倉
					let isNewPosition = !self.combinePosition[accountID][uid];

					// 同 APPLY_ID 時 -> 欄位覆蓋 (cpo = CombinePositionObject 簡寫)
					let cpo = self.combinePosition[accountID][uid] = Object.assign(
						self.combinePosition[accountID][uid] || {},
						obj
					);

					// 更新 [組合持倉] 響應式列表
					let combinePositionList = self.combinePositionList[accountID];
					if (combinePositionList) {
						// 新的組合持倉
						if (isNewPosition) {
							combinePositionList.push(cpo);
						}
					}
				});
				this.$set(result, "List", data.d.POSITION_COMBINE);
			}
		},
		// 收到執行組合/拆分持倉結果
		onCombinePositionAddData(data) {
			let result = this.baseOnTradeData('ExecCombinePositiontData' + "_" + data.r, data);
			if(data.cd < 0) {
				// 失敗通知
				this.$store.state.notify({
					head: `持倉${this.TYPE[data.d.TYPE] || "组拆"}命令`,
					body: `${this.STATUS[data.d.STATUS] || data.d.msg}`,
				});
			}
			if (data.cd === 0) {
				this.collectResultData(data);
				this.$set(result, data.d);
				// 通知
				this.$store.state.notify({
					head: `持倉${this.TYPE[data.d.TYPE]}命令`,
					body: `${this.STATUS[data.d.STATUS]}`,
				});
				// 組拆成功才重查部位匯總
				if(data.d.STATUS === 'New'){
					// 已在執行重複回補部位匯總就先清除
					if(this.intervalRestorePositionSum) {
						console.log(`[CombinePosition] clearInterval for reset interval run`);
						clearInterval(this.intervalRestorePositionSum);
					}
					// 執行重複回補部位匯總
					this.intervalRestorePositionSum = setInterval(()=> {
						// 重複執行次數到達限制
						if(this.callRestoreCount === this.maxRestoreCount) {
							console.log(`[CombinePosition] clearInterval for reach limit`);
							// 清除interval
							clearInterval(this.intervalRestorePositionSum);
							// 重設次數
							this.callRestoreCount = 0;
						}
						else {
							// 執行回補部位匯總(指定不清空部位匯總資料)
							M4C.Position.queryPositionSum({noClearData: true});
							// 遞增計數器
							this.callRestoreCount++;
							console.log(`[CombinePosition] execute restore positionsum for run`, this.callRestoreCount);
						}
					}, this.intervalDelay);
				}
			}
		},
		// 收到組拆建議查詢	
		onCombinePositionAdviceData(data) {
			let result = this.baseOnTradeData('QueryCombinePositionAdvice', data);
			if(data.d && data.$CD === 0) {
				let type = data.d.TYPE;
				switch(type){
					case "1":
						this.combineAvailableAdvice.push(data.d);
						break;
					case "2":
						this.splitAvailableAdvice.push(data.d);
						break;
					case "3":
						this.combineAllAdvice.push(data.d);
						break;
				}
			}
		},
		// 收到部位互抵申請結果
		onPositionNetAddData(data) {
			let result = this.baseOnTradeData('QueryPositionNetAdd', data);
		},
		// 收到部位互抵
		onPositionNetData(data) {
			let result = this.baseOnTradeData('QueryPositionNet', data);
			if(data.d && data.$CD === 0) {
				data.d.$_receiveTime= data._receiveTime;
				this.positionNetList.push(data.d);
			}
		},
		// 收到SERVER通知可以更新資料的通知
		onCombinePositionRefresh(data) {
			let dd = data.d;
			if(dd && dd.CMD && dd.CMD === "position.combine.get"){
                let self = this;
                if(this.restoreQuery){
                    clearTimeout(this.restoreQuery);
                }
                this.restoreQuery = setTimeout(() => {
                    self.queryCombinePosition();    
                }, 500);                
            }
		}
	},
	watch: {},
    computed: {
		accountID() {
			return this.$store.state.login.accountID;
		},
		// 交易所策略對映表
		// 由於公開設定的CONFIG覆蓋各貼牌的CONFIG機制實做在1.84。因此1.83在這裡先做個相容處理。
		COMPOSITE_EXG_STRATEGYMAP() {
			// 預設CONFIG清單
			const defaultMap = this.$store.state.config.CONFIG.COMPOSITE_EXG_STRATEGYMAP || "";
			// 公開設定
			const publicPdSetting = this.$store.state.config.publicPdSetting;
			try {
				return publicPdSetting.CONFIG.COMPOSITE_EXG_STRATEGYMAP || defaultMap;
			} catch(e) { return defaultMap;}
		},
		// 有支持組、拆的交易所清單(由COMPOSITE_EXG_STRATEGYMAP的key取得)
		supportedExg() {return Object.keys(this.COMPOSITE_EXG_STRATEGYMAP);},
	},
}
</script>
