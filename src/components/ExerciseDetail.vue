<template>
	<div class="Exercise-Detail-ctn flex-col flex-1">
		<MyHead class="head" :backType="1" :acc-btn=false show-text="行权明细" :margin="false"></MyHead>
		<div class="Detail-content-ctn flex-col flex-1 posr overflow-y-auto" v-stop-propagation-y>
			<ScrollBounce class="FULL" :refresh="true" @refresh="onRefresh">
				<!-- 非第二隻腳或第二隻腳有sid才顯示 -->
				<div v-for="(obj, idx) in labelList" :key="idx" v-if="obj.v !== 'SYMBOL2' || exerciseRecord[obj.v]" class="flex-row row-ctn flex-vertical-center">
					<span class="label">{{$ln(obj.t)}}</span>
					<span class="content flex-1 block-ctn">{{$ln(obj.f? obj.f(exerciseRecord[obj.v]): exerciseRecord[obj.v])}}</span>
				</div>
			</ScrollBounce>
		</div>
		<div class="foot-ctn flex-row pd3">
			<Button class="btn cancel-btn flex-1 flex-item flex-center" :disabled="isDisabled?'disabled':''"
			 @click="onCancel(exerciseRecord)">{{$ln(exerciseRecord.TYPE=='EXECUTE'? '取消行权': isAbort? '取消放弃行权': "--")}}</Button>
		</div>
	</div>
</template>
<script>
export default {
	data(){
		return{
			labelList:[
				{t: "品种", v: "SYMBOL", f: this.getNewSid},
				{t: "品种2", v: "SYMBOL2", f: this.getNewSid},
				{t: "交易帐户", v: "ACCOUNT_ID"},
				{t: "交易商", v: "BROKER_ID",f: this.getBrokerName},
				{t: "行权手数", v: "QTY"},
				{t: "投机套保标志", v: "HEDGE_FLAG", f: this.parseHedgeFlag},
				{t: "执行类型", v: "TYPE", f: this.parseType},
				{t: "保留持仓方向", v: "isKeePBS"},
				{t: "是否保留期货", v: "isKeepFut"},
				{t: "持仓", v: "Position"},
				{t: "是否自动平仓", v: "OFFSET_FLAG", f: this.parseOffsetFlag},
				{t: "行权编号", v: "EX_EXERCISE_ID"},
				{t: "行权状态", v: "STATUS", f: this.parseStatus},
				{t: "交易日", v: "TRANS_DATE"},
				{t: "结算编号", v: "SETTLEMENT_ID"},
				{t: "执行结果", v: "MSG"},
			],
		}
	},
	props:['param'],
	methods: {
		getNewSid(sid) {
			let newSid = `${M4C.Symbol.getContractName(sid)} ${M4C.Symbol.getCIDM4(sid)}`;
			return newSid == " "? sid: newSid;
		},
		onRefresh() {

		},
		getBrokerName(){
			return this.brokerNameMap[this.brokerID] || this.brokerID;
		},
		parseOffsetFlag(flag){
			let str = "";
			switch (flag) {
				case true:
					str = this.$ln('自动平仓');
					break;
				case false:
					str = this.$ln('不自动平仓');
					break;			
				default:
					str = '--';
					break;
			}
			return str;			
		},
		parseHedgeFlag(flag){
			let str = "";
			switch (flag) {
				case "HEDGING":
					str = this.$ln('套保');
					break;
				case "ARBITRAGE":
					str = this.$ln('套利');
					break;
				case "SPECULATION":
					str = this.$ln('投机');
					break;
				case "COVERED":
					str = this.$ln('备兑');
					break;			
				default:
					str = '--';
					break;
			}
			return str;
		},
		parseType(type){
			let str = "";
			switch (type) {
				case "EXECUTE":
					str = this.$ln('执行行权');
					break;
				case "DISABLE":
				case "ABORT":
					str = this.$ln('放弃行权');
					break;
			
				default:
					str = '--';
					break;
			}
			return str;
		},
		parseStatus(status){
			let str = "";
			switch (status) {
				case "New":
					str = this.$ln('申请成功');
					break;
				case "PendingNew":
					str = this.$ln('申报中');
					break;
				case "PendingCancel":
					str = this.$ln('取消中');
					break;
				case "Cancelled":
					str = this.$ln('取消成功');
					break;
				case "Rejected":
					str = this.$ln('失败');
					break;
				default:
					str = '--';
					break;
			}
			return str;
		},
		// 刪單
		onCancel(record) {
			record.ACTION = "CANCEL";
			M4C.Exercise.sendOrder(record);
		}
	},
	computed: {
		exerciseRecord(){
			return M4C.Exercise.getExerciseById(this.param.id);
		},
		brokerID() {
			return this.exerciseRecord.BROKER_ID;
		},
		brokerNameMap() {
			return this.$store.state.brokerNameMap;
		},
		isDisabled() {return (this.exerciseRecord.STATUS!=='New' && this.exerciseRecord.STATUS !== 'Rejected') || (this.exerciseRecord.CODE < 0)},
		isAbort() {return this.exerciseRecord.TYPE=='ABORT' || this.exerciseRecord.TYPE=='DISABLE'},
	},
}
</script>
<style scoped>
.label{
	width: 7em;
	text-align: right;
}
.row-ctn{
	padding: 2px 5px;
}
.block-ctn{
	border:1px solid #666;
	padding: 5px;
	margin: 0 5px;
	min-height: 1em;
	word-break: break-all;
}
</style>