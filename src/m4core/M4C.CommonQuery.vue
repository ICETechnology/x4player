<template>
    <div class="m4c-commonQuery hidden" />
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			HoldPromptData: [],
			ExecEtfOptExerciseDataList: [],
			CoverShortageDataList: [],
			dataTest: false,
		}
	},
	beforeMount() {
		M4C.CommonQuery = this;
		// 註冊資料分派
		M4C.regDispatch({'s': 'TRADE', 'c': 'account.positionsum.prompt', 'callback': this.onQueryPromptGet.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'exercise.option.result', 'callback': this.onQueryExerciseGet.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'position.lock.shortage', 'callback': this.onQueryPositionLockGet.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'notify.restore', 'callback': this.onRestore.bind(this)});
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		queryAllNotice() {
			this.$store.state.result.queryHoldPromptResult = this.queryHoldPrompt();
			this.$store.state.result.queryExecEtfOptExerciseResult = this.queryExecEtfOptExercise();
			this.$store.state.result.queryCoverShortageResult = this.queryCoverShortage();
		},
		// 查詢期權持倉合約即將到期資料
		queryHoldPrompt() {
			let rKey = "".random();
			if(this.dataTest){
				this.HoldPromptData.splice(0);
				this.createSimHoldPromptData(rKey);
				return {"$STATUS": "DONE"};
			}
			else{
				M4C.send({
					"s": "TRADE",
					"c": "account.positionsum.prompt",
					"d": {
						"BROKER_ID": this.$store.state.login.brokerID,
						"ACCOUNT_ID": this.accountID,
					},				
					"r" : rKey,
				});
				this.HoldPromptData.splice(0);
				return this.baseQuery('DataHoldPrompt');
			}
		},
		// 查詢行權指派資料
		queryExecEtfOptExercise() {
			let rKey = "".random();
			if(this.dataTest){
				this.ExecEtfOptExerciseDataList.splice(0);
				this.createSimExerciseAsignData(rKey);
				return {"$STATUS": "DONE"};
			}
			else{
				M4C.send({
					"s": "TRADE",
					"c": "exercise.option.result",
					"d": {
						"BROKER_ID": this.$store.state.login.brokerID,
						"ACCOUNT_ID": this.accountID,
					},
					"r" : rKey,
				});
				this.ExecEtfOptExerciseDataList.splice(0);
				return this.baseQuery('DataExecEtfOptExercise');
			}
		},
		// 查詢備兌不足資料
		queryCoverShortage() {
			let rKey = "".random();
			if(this.dataTest){
				this.CoverShortageDataList.splice(0);
				this.createSimCoverShortageData(rKey);
				return {"$STATUS": "DONE"};
			}
			else {
				M4C.send({
					"s": "TRADE",
					"c": "position.lock.shortage",
					"d": {
						"BROKER_ID": this.$store.state.login.brokerID,
						"ACCOUNT_ID": this.accountID,
					},
					"r" : rKey,
				});
				this.CoverShortageDataList.splice(0);
				return this.baseQuery('DataCoverShortage');
			}
		},
		// ========================= 收到資料 =========================
		// 收到回補完成通知
		onRestore(data) {
			if(this.supportNotice && (data.d.TYPE == "all" || data.d.TYPE == "report")){
                // 非當前關注帳號時，不往下處理，當作沒看到(notify.restore資料沒有主帳(traderID)先不比對)
                if (data.d.BROKER_ID !== this.$store.state.login.brokerID || 
                    // data.d.TRADER_ID !== this.$store.state.login.traderID || 
                    data.d.ACCOUNT_ID !== this.accountID)
                    return;
                this.queryAllNotice();
            }
		},
		// 收到持倉即將到期資料
		onQueryPromptGet(data){
			let self = this;
			self.baseOnTradeData('DataHoldPrompt', data);
			if(data.d && data.d.SYMBOL)
				this.HoldPromptData.push(data.d);
		},
		// 收到行權指派資料
		onQueryExerciseGet(data){
			let self = this;
			self.baseOnTradeData('DataExecEtfOptExercise', data);
			if(data.d && data.d.QUERY_ID)
				this.ExecEtfOptExerciseDataList.push(data.d);
		},
		// 收到備兌不足資料
		onQueryPositionLockGet(data){
			let self = this;
			self.baseOnTradeData('DataCoverShortage', data);
			if(data.d && data.d.QUERY_ID)
				this.CoverShortageDataList.push(data.d);
		},
		// ========================= 假資料處理 =========================
		createSimHoldPromptData(rkey) {
			for(let key in M4C.Position.positionSumMap){
				if(key.indexOf('I.O') >= 0 && key.indexOf("|") < 0){
					this.onQueryPromptGet({
						"s": "TRADE",
						"c": "account.positionsum.prompt",
						"d" : { 
							"BROKER_ID": "IceTech",
							"ACCOUNT_ID" : this.accountID, 
							"SYMBOL": key,
							"NOTICE": "该期权合约临近到期，请注意风险!"
						}, 
						"cd": 0,
						"r": rkey
					});
				}
			}
		},
		createSimExerciseAsignData(rkey) {
			for(let key in M4C.Position.positionSumMap){
				if(key.indexOf('I.O') >= 0 && key.indexOf("|") < 0){
					let exeObj = {
						"BROKER_ID": "IceTech",
						"ACCOUNT_ID" : this.accountID, 
						"OPT_ID":	key,	 
						"STK_ID":	key.replace('I.O', "I.S"),
						"OPTHOLD_TYPE":	 Math.round(Math.random() * 3), 	//0 : 權利方, 1 :義務方, 2 : 備兌方, 3:統計資料
						"EXERCISE_PRICE":	 M4C.Position.positionSumMap[key].$BSAVG,
						"EXERCISE_AMOUNT":	 M4C.Position.positionSumMap[key].$NET_QTY,
						"EXEFROZEN_BALANCE":	 M4C.Position.positionSumMap[key].$BSAVG * parseInt(M4C.Position.positionSumMap[key].$NET_QTY * Math.random()),	 
						"SETTLE_AMOUNT":	 parseInt(M4C.Position.positionSumMap[key].$NET_QTY * Math.random()), 
						"SETTLE_BALANCE":	M4C.Position.positionSumMap[key].$BSAVG * parseInt(M4C.Position.positionSumMap[key].$NET_QTY * Math.random()), 
					}
					this.onQueryExerciseGet({
						"s": "TRADE",
						"c": "exercise.option.result",
						"d" : {RESULT: exeObj}, 
						"cd": 0,
						"r": rkey
					});
				}
			}
		},
		createSimCoverShortageData(rkey) {
			for(let key in M4C.Position.positionSumMap){
				if(key.indexOf("|") < 0){
					let covObj = {
						"BROKER_ID": "IceTech",
						"ACCOUNT_ID" : this.accountID, 
						"STK_ID":	key,
						"LOCK_AMOUNT":	 parseInt(M4C.Position.positionSumMap[key].$NET_QTY * Math.random()) || 1,
						"SHORT_AMOUNT":	 parseInt(M4C.Position.positionSumMap[key].$NET_QTY * Math.random()) || 1,
						"PRESHORT_AMOUNT":	 parseInt(M4C.Position.positionSumMap[key].$NET_QTY * Math.random()) || 0,
						"NOTICE":	"提示訊息	字串",
					}
					this.onQueryPositionLockGet({
						"s": "TRADE",
						"c": "position.lock.shortage",
						"d" : {RESULT: covObj}, 
						"cd": 0,
						"r": rkey
					})
				}
			}
		},
	},
	watch: {
		// 當三大提醒資料查詢完成時，彈出視窗。
		popupNotification(nv) {
			if(nv){
				// 已彈出三大提醒視窗就不再彈出
				let isPopupNotice = this.$store.state.popup.dialogList.find(dlg => {
					return M4C.Analysis.getComponentClassName(dlg.cls) == "NoticeMSG";
				});
				if(!isPopupNotice)
					// 彈出三大提醒視窗
                    eventBus.$emit('POPUP-DIALOG', "NoticeMSG", "", {'$HEAD': {'title': `${this.$ln(`消息提醒`)} - ${this.accountID}`}, transName: 'float'});
			}
		}
	},
    computed: {
		accountID() {
			return this.$store.state.login.accountID;
		},
		// 支援三大提醒功能(台灣、SIM不支援)
		supportNotice() {
			return !this.twMode && this.$store.state.login.brokerID !== "IceTech" && this.isStockOptionAcc && this.threeAlert;
		},
		// 當前交易帳號的pdsetting
		acPdSetting() {
			return this.$store.state.config.tradePdSetting;
		},
		// pdsetting的三大提醒
		threeAlert() {
			if(this.acPdSetting && this.acPdSetting.broker)
				return this.acPdSetting.broker.three_alerts != false;
		},
		twMode() {return this.$store.state.config.twMode;},
		isStockOptionAcc() {return this.$store.state.login.isStockOption;},
		queryHoldPromptFinished() {return this.$store.state.result.queryHoldPromptResult.$STATUS && this.$store.state.result.queryHoldPromptResult.$STATUS != "QUERY"},
		queryExecEtfOptExerciseFinished() {return this.$store.state.result.queryExecEtfOptExerciseResult.$STATUS && this.$store.state.result.queryExecEtfOptExerciseResult.$STATUS != "QUERY"},
		queryCoverShortageFinished() {return this.$store.state.result.queryCoverShortageResult.$STATUS && this.$store.state.result.queryCoverShortageResult.$STATUS != "QUERY"},
		popupNotification() {
			let queryFinished = this.queryHoldPromptFinished && this.queryExecEtfOptExerciseFinished && this.queryCoverShortageFinished;
			// 三大提醒不在查詢中
			return queryFinished;
		}
	},
}
</script>

<style scoped>
</style>