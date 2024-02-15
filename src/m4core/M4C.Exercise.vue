<template>
	
</template>
<script>
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],	
	data() {
		return {
			// 行權資料mapping表
			ExerciseMap: {},
			// 行權回報清單列表
			exerciseReportList: [],
			// 行權回報索引列表
			exerciseReportKeyList: [],
			// 已行權數量mapping表
			ExerciseQtyMap: {},
			// 行權發送mapping表
			SymbolMap: {},
			// 可行權數量mapping表
			availableQtyMap:{},
			hasMktMap: {},
		}
	},
	beforeMount() {
		M4C.Exercise = this;
		// 註冊資料分派
		M4C.regDispatch({'s': 'TRADE', 'c': 'exercise.option.order', 'callback': this.onData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'exercise.option.get', 'callback': this.onData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'exercise.option.report', 'callback': this.onData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'exercise.option.count', 'callback': this.onData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'exercise.option.all', 'callback': this.onData.bind(this)});
		M4C.regDispatch({'s': 'Q', 'c': 'mkt', 'callback': this.onMktData.bind(this)});
	},
	beforeDestroy(){
        if(this.supportExercise){
            this.unSubExerciseList();
        }
    },
	methods: {
		// 查詢所有持倉商品市況
		queryMkt(posList) {
			// 空內容時不回補
			if (!posList || posList.length === 0)
				return;
			let cmd = {};
			cmd.s = 'Q';
			cmd.c = 'mkt';
			// 增加"DataMkt_"以辨別
			cmd.r = `Exercise_${"".random()}`;
			cmd.d = {};
			cmd.d.s = posList;
			M4C.send(cmd);
			return this.baseQuery('PosMkt');
		},
		// 收到市況資料
		onMktData(data) {
			if(data.r.indexOf("Exercise_") == 0){
				let result = this.baseOnData('PosMkt', data);
				if (data.cd === 40) {
					data.d.forEach((qo)=>{
						this.hasMktMap[qo.s] = true;
					});
				}
			}
		},
		createSimMsg(orderInfo){
			let msg = "";
			switch(orderInfo.ACTION){
				case 'NEW':
					if(orderInfo.TYPE === 'EXECUTE')
						msg = `${"执行行权"} ${orderInfo.QTY} ${"手"} ${"成功!"}`;
					if(orderInfo.TYPE === 'ABORT')
						msg = `${"放弃行权"} ${orderInfo.QTY} ${"手"} ${"成功!"}`;
					break;
				case "CANCEL":
						msg = `${"取消行权"} ${orderInfo.EXERCISE_ID} ${"成功!"}`;
					break;
			}
			this.$store.state.notify({
				head: `行权指令`,
				body: msg,
			});
		},
		// 執行委託
		sendOrder(orderInfo) {
			let cmd = {
				"s": "TRADE",
				"c": "exercise.option.order",
				"d": {},
				"r": "".random(16)
			}
			if(Object.keys(orderInfo).length > 0){
				cmd.d = orderInfo;
			}
			this.SymbolMap[cmd.r] = orderInfo;
			cmd.d.ACCOUNT_ID = this.accountID;
			M4C.send(cmd);
		},
		// 查詢行權申請列表
		queryExerciseList() {
			let cmd = {
				"s": "TRADE",
				"c": "exercise.option.get",
				"d": {},
				"r": "".random(16)
			}
			cmd.d.ACCOUNT_ID = this.accountID;
			M4C.send(cmd);
			this.$store.state.result.queryExerciseRecordResult = this.baseQuery('DataExerciseRecord');
		},
		getExerciseById(exerciseId) {
			return this.exerciseReportList.find( exerRpt => {
				return exerRpt.$key == exerciseId;
			});
		},
		// 訂閱行權申請列表
		subExerciseList() {
			let cmd = {
				"s": "TRADE",
				"c": "exercise.option.sub",
				"d": {},
				"r": "".random(16)
			}
			cmd.d.ACCOUNT_ID = [].concat(this.accountID);
			M4C.send(cmd);
		},
		// 解訂閱行權申請列表
		unSubExerciseList() {
			let cmd = {
				"s": "TRADE",
				"c": "exercise.option.unsub",
				"d": {},
				"r": "".random(16)
			}
			cmd.d.ACCOUNT_ID = [].concat(this.accountID);
			M4C.send(cmd);
		},
		// 查詢期權商品已行權數量
		queryExerciseQty(sid) {
			let cmd = {
				"s": "TRADE",
				"c": "exercise.option.count",
				"d": {},
				"r": "".random(16)
			}
			cmd.d.ACCOUNT_ID = this.accountID;
			cmd.d.SYMBOL = sid;
			M4C.send(cmd);
		},
		// 查詢期權商品有效剩餘行權數量
		queryAvailableQty(sid) {
			return;
			let cmd = {
				"s": "TRADE",
				"c": "exercise.option.all",
				"d": {},
				"r": "".random(16)
			}
			cmd.d.ACCOUNT_ID = this.accountID;
			cmd.d.SYMBOL = sid;
			M4C.send(cmd);
		},
        // 即時行權回報訊息
        flashMessage(rpt) {
            let icon = "";
            if(rpt.CODE >= 0)
                icon = `check_circle`;
            else 
                icon = `error`;
            this.$store.state.notify({keep: rpt, icon: icon, head: `行权记录`, 
				htmlBody: `<div class="word-break-all">${rpt.MSG}</div>`});
        },
		onExerciseReport(data, isRT) {
			if (data.d && data.d && data.d.KEY && data.d.REPORT) {
				let rpt = data.d.REPORT;
				rpt.$phase = data.d.KEY.phase;
				let key = rpt.$key = data.d.KEY.id;
				// 行權回報索引位置
				let orgRpt = this.exerciseReportList.find(rpt=> {return rpt.$key == key});
				// 新行權回報
				if (!orgRpt) {
					this.exerciseReportList.unshift(rpt);
					this.exerciseReportKeyList.unshift(key);
					if(isRT)
						this.flashMessage(rpt);
				}
				// 該行權回報已經存在
				else {
					// phase較大時 -> 欄位覆蓋
					if (rpt.$phase >= orgRpt.$phase) {
						let thisRpt = Object.assign(orgRpt, rpt);Object.assign(orgRpt, rpt);
						// 即時行權回報且phase >= 55才重查已申請數量。
						if(isRT && rpt.$phase >= 55){
							let self = this;
							this.flashMessage(thisRpt);
							// 調整收到行權回報後延遲2秒重查已行權數量
							setTimeout(() => {
								self.queryExerciseQty(orgRpt.SYMBOL);
								if(orgRpt.SYMBOL2)
									self.queryExerciseQty(orgRpt.SYMBOL2);
							}, 2000);
						}
					}
				}
			}
		},
		// 完整清除所有资料
		clearAllData() {
			// 行權資料mapping表
			this.ExerciseMap = {};
			// 行權回報清單列表
			this.exerciseReportList = [];
			// 行權回報索引列表
			this.exerciseReportKeyList = [];
			this.exerciseReportKeyMap = {};
			// 已行權數量mapping表
			this.ExerciseQtyMap = {};
			// 行權發送mapping表
			this.SymbolMap = {};
			// 可行權數量mapping表
			this.availableQtyMap = {};
		},
		onData(data) {
			switch(data.c) {
				case "exercise.option.order":
					if(data.d.REPORT && data.d.REPORT.CODE === 100)
						eventBus.$emit("RECEIVE-REALTIME-SUCCESS");
					else if(data.d.REPORT && data.d.REPORT.CODE < 0)
						eventBus.$emit("RECEIVE-REALTIME-FAILED");
					// 命令完成後重新查詢已申請行權數量
					if(data.cd === 4){
						let self = this;
						// 非同步，因此需要稍等一下才能查到新的數量
						setTimeout(() => {
							self.queryExerciseQty(self.SymbolMap[data.r].SYMBOL);
							self.createSimMsg(self.SymbolMap[data.r]);
							delete self.SymbolMap[data.r];
						}, 100);
					}
					break;
				// 回補的行權回報
				case "exercise.option.get":
					this.$store.state.result.queryExerciseRecordResult = this.baseOnTradeData('DataExerciseRecord', data);
					this.onExerciseReport(data, false);
					break;
				// 即時的行權回報
				case "exercise.option.report":
					this.onExerciseReport(data, true);
					break;
				case "exercise.option.sub":
					break;
				case "exercise.option.unsub":
					break;
				case "exercise.option.count":
					if(data.d.SYMBOL)
						this.$set(this.ExerciseQtyMap, data.d.SYMBOL, data.d.QTY);
					break;
				case "exercise.option.all":
					if(data.d.SYMBOL)
						this.$set(this.availableQtyMap, data.d.SYMBOL, data.d.QTY);
					break;
			}
		}
	},
	computed: {
		btID() {
			return this.$store.state.login.btID;
		},
		accountID() {
			return this.$store.state.login.accountID;
		},
        // 當前帳號支持行權功能 (SIM、ntp30000 不支持 )
        supportExercise() {
            return this.$store.state.login.brokerID !== "IceTech" && this.$store.state.config.CONFIG.ENABLE_EXERCISE && this.isOptionAcc;
        },
        // 當前帳號是期權
		isOptionAcc() {return this.$store.state.login.isOption;},
		selectedWSConn() {return this.$store.state.selectedWSConn;},
		isLoginReady() {if(this.selectedWSConn) return this.selectedWSConn.loginReady;},
	},
	watch: {
		btID(nv, ov) {
            if(this.isLoginReady && this.supportExercise && ov && ov != nv) {
                this.unSubExerciseList();
				this.clearAllData();
				this.queryExerciseList();
                this.subExerciseList();
            }
		},
		// 交易連線有連上
		isLoginReady(nv){
			if(nv && this.supportExercise){
				this.queryExerciseList();
				this.subExerciseList();
			}
		}
	},
}
</script>