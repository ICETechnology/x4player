<template>
	<div class="flex-col flex-1 sub-report-card-content tcend" @click="onSubCardClick" >
	<!-- 子委託資訊(出場) -->
	<div class="flex-row flex-center pdt2" v-if="runRptOi1" :class="{'clr-gray': !runRptOi1Status}">
		<!-- 買賣方向 -->
		<div class="cell1 flex-top-left h100p" :class="{'clr-up': runRptOi1.SIDE == 'BUY', 'clr-dn': runRptOi1.SIDE == 'SELL'}">
			{{runRptOi1.SIDE == 'BUY'? $ln('买'): $ln('卖')}}
		</div>
		<div class="flex-1 flex-col flex-top" v-html="orderConditionText(runRptOi1)" />
		<div class="flex-top-left h100p">{{!isNaN(runningRpt.$INDEX)? `#${runningRpt.$INDEX}`: ''}}</div>
		<div class="cell2 flex-top flex-row">
			<!-- 委 -->
			<span>{{runningRpt.$ORDER_QTY || 0}}</span>
			<span>/</span>
			<!-- 成 -->
			<span>{{runRptOi1Status? runningRpt.CUM_QTY || 0: 0}}</span>
			<span>/</span>
			<!-- 撤 -->
			<span>{{runRptOi1Status? runningRpt.$REMOVED_QTY || 0: runningRpt.$ORDER_QTY}}</span>
		</div>
		<div class="cell1 flex-col"><span :class="runRptOi1Type" /></div>
		<div class="cell3 flex-end flex-row">
			<span class="nowrap" :class="runRptOi1Status? getStatusClass(runningRpt): 'clr-gray'">{{$ln(runRptOi1Status? runningRpt.$STATUS: "已删单")}}</span>
		</div>
	</div>
	<div class="flex-row flex-center" v-if="runRptOi2" :class="{'clr-gray': !runRptOi2Status}">
		<!-- 買賣方向 -->
		<div class="cell1 flex-top-left h100p" :class="{'clr-up': runRptOi2.SIDE == 'BUY', 'clr-dn': runRptOi2.SIDE == 'SELL'}">
			{{runRptOi2.SIDE == 'BUY'? $ln('买'): $ln('卖')}}
		</div>
		<div class="flex-1 flex-col flex-top" v-html="orderConditionText(runRptOi2)" />
		<div class="cell2 flex-top flex-row">
			<!-- 委 -->
			<span>{{runningRpt.$ORDER_QTY || 0}}</span>
			<span>/</span>
			<!-- 成 -->
			<span>{{runRptOi2Status? runningRpt.CUM_QTY || 0: 0}}</span>
			<span>/</span>
			<!-- 撤 -->
			<span>{{runRptOi2Status? runningRpt.$REMOVED_QTY || 0: runningRpt.$ORDER_QTY}}</span>
		</div>
		<div class="cell1 flex-col"><span :class="runRptOi2Type" /></div>
		<div class="cell3 flex-end flex-row">
			<span class="nowrap" :class="runRptOi2Status? getStatusClass(runningRpt): 'clr-gray'">{{$ln(runRptOi2Status? runningRpt.$STATUS: "已删单")}}</span>
		</div>
	</div>
</div>
</template>
<script>
import ReportCardDetail from '@/components/ReportCardDetail';
export default {
	data() {
		return {
			runningRptCondition: "",
			running1Condition: "",
			running2Condition: "",
		}
	},
	components: {ReportCardDetail},
	props: ['runningRpt'],
	beforeMount() {
		if(this.runningRpt && this.runningRpt.SMO) {
			this.setRunningCondition(this.runningRpt);
		}
	},
	methods: {
		// 智慧單觸發條件
		smoConditionText(rpt) {
			let orderPrice = rpt.$ORDER_PRICE_TXT || this.showPrice(rpt.ORDER_PRICE || this.$ln("市价"));
			let orderText = `<span>${this.$ln('委')} ${orderPrice}</span>`;
			switch(rpt.TC_ORDER_TYPE) {
				case "STOP":
				case "STPLMT":
					return `<span>${this.$ln('停')} ${this.showPrice(rpt.STOP_PRICE)}</span>${orderText}`;
				case "MIT":
				case "LIT":
					return `<span>${this.$ln('触')} ${this.showPrice(rpt.TOUCH_PRICE)}</span>${orderText}`;
				case "TSTOP":
				case "TSTPLMT":
					// 有算出觸發價時直接顯示
					if(rpt.$CONDITION_VALUE_NOR)
						// 調整觸發價優先取server提供的TRAILING_INITIAL資料(因TW要求顯示初始觸發價)，沒有才取計算後的值
						return `<span>${this.$ln('移')} ${this.showPrice(this.$TRAILING_INITIAL || rpt.$CONDITION_VALUE_NOR)}</span>${orderText}`;
					else
						return `<span>${this.$ln('移')} ${this.$ln('回撤')} ${rpt.TRAILING_VALUE} ${rpt.TRAILING_TYPE !== 'GUARANTEE'? this.$ln('档'): ''}</span>${orderText}`;
				default:
					break;
			}
		},
		// 委託類型文字
		orderConditionText(rpt) {
			// SMO
			if (rpt.$IS_SMO || rpt.SMO)
				return `<span class='flex-col'>${this.smoConditionText(rpt)}</span>`;
			// 一般委托单
			switch(rpt.TC_ORDER_TYPE) {
				case "MARKET":
					return this.$ln("市价");
				case "LIMIT":
					return this.showPrice(rpt.ORDER_PRICE);
				case "HIT":
					return this.$ln("对手价");
				case "JOIN":
					return this.$ln("本方价");
				case "MWP":
					return this.$ln("一定范围市价");
				default:
					break;
			}
		},
		showPrice(val) {
			if(isNaN(val)) return val;
			return this.$symbolPriceX({sid: this.sid, val: Number(val), fillDecimal: true});
		},
		onSubCardClick() {
			eventBus.$emit('POPUP-DIALOG', ReportCardDetail, {'rpt': this.runningRpt}, {transName: 'float'});
		},
		setRunningCondition(rpt) {
			if(rpt && rpt.SMO) {
				let oi1 = rpt.$IS_OCO? rpt.SMO.OCO[0]: rpt;
				let oi2 = rpt.$IS_OCO? rpt.SMO.OCO[1]: {};
				// 設定洗價單控制資料
				this.runningRptCondition = rpt.SMO.CONDITION;
				this.running1Condition = oi1.SMO.CONDITION;
				this.running2Condition = rpt.$IS_OCO? oi2.SMO.CONDITION: '';
			}
		},
		// 取得狀態欄位HTML
		getStatusClass(rpt) {
			let clr = "";
			switch(rpt.REPORT_KEY.status) {
				case "Rejected":
					clr = "clr-warn";
					break;
				case "Cancelled":
					clr = "clr-gray";
					break;
				case "PartiallyFilled":
				case "IOCFilled":
				case "Filled":
					clr = "clr-filled";
					break;                
				case "New":
					clr = rpt.$IS_CLOUD ? "clr-wash" : "clr-white";
					break;
				case "Replaced":
				case "Reduced":
				case "Repriced":
				case "PendingReplace":
				case "PendingCancel":
				case "PendingNew":
					clr = "clr-white";
					break;
			}
			return clr;
		},
	},
	watch: {
		"runningRpt.REPORT_KEY.status" (nv) {
			this.setRunningCondition(this.runningRpt);
		},
	},
	computed: {
		// 委託商品代碼
		sid() {
			return this.runningRpt.SYMBOL || this.runningRpt.OCO[0].SYMBOL;
		},
		// 子委託單第一邊
		runRptOi1(){
			if(this.runningRpt && this.runningRpt.$IS_OCO){
				this.$set(this.runningRpt.OCO[0], '$CONDITION_VALUE_NOR', this.runRptOi1TrgPrice);
				this.$set(this.runningRpt.OCO[0], '$ORDER_PRICE_TXT', this.runRptOi1OrderPrice);
				return this.runningRpt.OCO[0];
			}
			else return this.runningRpt;
		},
		// 子委託單第一邊類型
		runRptOi1Type(){
			if(this.runRptOi1 && this.runRptOi1.SMO)
				return this.runRptOi1.SMO.CONDITION == "STOP" || this.runRptOi1.SMO.CONDITION == "TRAILINGSTOP"? "SL-icon bgc-sl" : "SP-icon bgc-sp";
		},
		// 子委託單第一邊狀態(非成交邊回傳false)
		runRptOi1Status(){
			return this.runningRpt.$TOUCHED_SIDE? this.runningRpt.$TOUCHED_SIDE == 1: true;
		},
		// 子委託單第一邊觸發價
		runRptOi1TrgPrice() {return this.runningRpt.$CONDITION_VALUE_NOR;},
		// 子委託單第一邊委託價(顯示用)
		runRptOi1OrderPrice() {return this.runningRpt.$ORDER_PRICE_TXT;},
		// 子委託單第二邊
		runRptOi2(){
			if(this.runningRpt && this.runningRpt.$IS_OCO && this.runningRpt.SMO) {
				this.$set(this.runningRpt.OCO[1], '$CONDITION_VALUE_NOR', this.runRptOi2TrgPrice);
				this.$set(this.runningRpt.OCO[1], '$ORDER_PRICE_TXT', this.runRptOi2OrderPrice);
				return this.runningRpt.OCO[1];
			}
		},
		// 子委託單第二邊類型
		runRptOi2Type(){
			if(this.runRptOi2 && this.runRptOi2.SMO)
				return this.runRptOi2.SMO.CONDITION == "STOP" || this.runRptOi2.SMO.CONDITION == "TRAILINGSTOP"? "SL-icon bgc-sl" : "SP-icon bgc-sp";
		},
		// 子委託單第二邊狀態(非成交邊回傳false)
		runRptOi2Status(){
			return this.runningRpt.$TOUCHED_SIDE? this.runningRpt.$TOUCHED_SIDE == 2: true;
		},
		// 子委託單第二邊觸發價
		runRptOi2TrgPrice() {return this.runningRpt.$CONDITION_VALUE2_NOR;},
		// 子委託單第二邊委託價(顯示用)
		runRptOi2OrderPrice() {return this.runningRpt.$ORDER_PRICE_TXT2;},
		// 移動停損觸發價(初始價格由server提供)
		$TRAILING_INITIAL() {try {return this.runningRpt.SMO.TRAILING_INITIAL;}catch(e){}},
		$symbolPriceX() {return this.$store.state.fn.$symbolPriceX;},
	},
}
</script>
<style scoped>
.SL-icon{
	width: 1em;
	height: 1em;
	border-radius: 50%;
}
.SP-icon{
	width: 1em;
	height: 1em;
	border-radius: 50%;
}
.bgc-sp {background-color: #3399FF;}
.bgc-sl {background-color: #9933FF;}
</style>