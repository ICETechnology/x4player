<template>
    <div class="order-modify-ctn flex-col">
		<div class="head flex-center mgtb3">
			<span>{{title}}</span>
		</div>
		<div class="body mgb3 pdlr3 flex-col nowrap" v-if="!rpt.$IS_OCO">
			<div class="info flex-col pd1">
				<div class="flex-row flex-start">
					<div class="mgr2"><span class="flex-center cbtn" :class="[rpt.$SIDE==='BUY' ? 'bgc-up' : 'bgc-dn']">{{rpt.$SIDE==='BUY' ? '买' : '卖'}}</span></div>
					<SymbolCNM4 :sid="rpt.SYMBOL" />
				</div>
				<div class="mgt2">{{$ln(`委托价格`)}} : {{rpt.ORDER_PRICE || $ln(`市价`)}}</div>
				<div class="mgt2">{{$ln(`触发价格`)}} : {{rpt.SMO.TRG_PRICE}}</div>
				<div class="mgt1">{{$ln(`有效手数`)}} : {{rpt.$AVAILABLE_QTY}}</div>
			</div>
			<div class="options flex-col flex-end flex-1 pd1">
				<!-- 改止盈止損價 -->
				<div class="flex-row flex-center mgt2 w100p" v-if="action==='REPRICE'">
					<div>{{$ln(`改触发价`)}}</div>
					<div class="flex-1"><InputPrice v-model.number="trgPrice" /></div>
				</div>
				<!-- 減量 -->
				<div class="flex-row flex-center mgt2 w100p" v-if="action==='REDUCE'">
					<div>{{$ln(`减少手数`)}}</div>
					<div class="flex-1"><InputQty v-model="cancelQty" :max="rpt.$AVAILABLE_QTY" /></div>
				</div>
			</div>
		</div>
		<div class="body mgb3 pdlr3 flex-row nowrap" v-if="rpt.$IS_OCO">
			<div class="flex-col flex-1 pd1">
				<div class="flex-row flex-start">
					<div class="mgr2"><span class="flex-center cbtn" :class="[rpt.OCO[0].SIDE==='BUY' ? 'bgc-up' : 'bgc-dn']">{{rpt.OCO[0].SIDE==='BUY' ? '买' : '卖'}}</span></div>
					<SymbolCNM4 :sid="rpt.OCO[0].SYMBOL" />
				</div>
				<div class="mgt2 flex-row">
					<span class="th">{{$ln(`委托价格`)}} :</span>
					<span class="td flex-1">{{rpt.OCO[0].ORDER_PRICE || $ln(`市价`)}}</span>
					<span class="td flex-1">{{rpt.OCO[1].ORDER_PRICE || $ln(`市价`)}}</span>
				</div>
				<!-- <div class="mgt2">
					<div class="flex-row flex-center mgt2 w100p">
						<div class="flex-1"><InputPrice v-model.number="orderPrice" /></div>
					</div>
					<div class="flex-row flex-center mgt2 w100p" v-if="rpt.$IS_OCO && rpt.OCO[1]">
						<div class="flex-1"><InputPrice v-model.number="orderPrice2" /></div>
					</div>
				</div> -->
				<div class="mgt2 flex-row">
					<span class="th">{{$ln(`触发价格`)}} :</span>
					<span class="td flex-1">{{rpt.OCO[0].SMO.TRG_PRICE}}</span>
					<span class="td flex-1">{{rpt.OCO[1].SMO.TRG_PRICE}}</span>
				 </div>
				 <div class="mgt1 flex-row">
					<span class="th">{{$ln(`有效手数`)}} :</span>
					<span class="td flex-1">{{rpt.$AVAILABLE_QTY}}</span>					
				</div>
				<div class="mgt2">
					<div class="flex-row flex-center mgt2 w100p">
						<span class="th">{{$ln(getOrderCondition(rpt.OCO[0]))}} :</span>
						<div class="flex-1 td"><InputPrice v-model.number="trgPrice" /></div>
					</div>
					<div class="flex-row flex-center mgt2 w100p" v-if="rpt.$IS_OCO && rpt.OCO[1]">
						<span class="th">{{$ln(getOrderCondition(rpt.OCO[1]))}} :</span>
						<div class="flex-1 td"><InputPrice v-model.number="trgPrice2" /></div>
					</div>
				</div>
				
			</div>
		</div>
		<div class="foot flex-row">
			<div class="flex-center flex-1 fd-content-bdc cancel-btn" @click="$emit('close')">{{$ln('取消')}}</div>
			<div class="flex-center flex-1 fd-content-bdc confirm-btn" @click="onBtnConfirm">{{$ln('确认')}}</div>
		</div>
    </div>
</template>

<script>
export default {
	props: ["param"],
	data() {
		return {
			action: this.param.action,
			orderPrice: this.param.rpt.ORDER_PRICE,
			trgPrice: this.param.rpt.$IS_OCO? this.param.rpt.OCO[0].SMO.TRG_PRICE: this.param.rpt.SMO.TRG_PRICE,
			trgPrice2: this.param.rpt.$IS_OCO? this.param.rpt.OCO[1].SMO.TRG_PRICE: "",
			cancelQty: 1,
		}
	},
	mounted() {
		if(this.param.modifyPrice) {
			this.trgPrice = this.param.modifyPrice;
		}
		if(this.param.modifyPrice2) {
			this.trgPrice2 = this.param.modifyPrice2;
		}
	},
    methods: {
		getOrderCondition(orderInfo){
			let str = "";
			if (this.isOCO) {
				if (orderInfo.SMO.CONDITION == "IFTOUCHED")
					str += "改设止盈";
				if (orderInfo.SMO.CONDITION == "STOP")
					str += "改设止损";
			}
			return str;
		},
		/** 價格別文字 */
		getOrderType(orderInfo1) {
			let str = "";
			if (this.isOCO) {
				if (orderInfo1.SMO.CONDITION == "IFTOUCHED")
					str += "止盈";
				if (orderInfo1.SMO.CONDITION == "STOP")
					str += "止损";
			}
			switch (orderInfo1.TC_ORDER_TYPE) {
				case 'MARKET':	str += "市价单"; 	break;
				case 'LIMIT':	str += "限價单";	break;
				case 'HIT':str += "对手价";	break;
			}
			return str;
		},
		// 確認
		onBtnConfirm() {
			let rpt = this.rpt;
			let orderInfo = {
				'REPORT_ID': rpt.key,
				'SYMBOL': rpt.SYMBOL,
				'ACTION': this.action,
			};
			if (this.action === "REPRICE"){
				// orderInfo.NEW_PRICE = this.orderPrice;
				if(!this.rpt.$IS_OCO)
					orderInfo.NEW_STOP_PRICE = Number(this.trgPrice);
				else {
					let smo = this.rpt.SMO;
					smo.OCO[0].SMO.TRG_PRICE = Number(this.trgPrice);
					smo.OCO[1].SMO.TRG_PRICE = Number(this.trgPrice2);
					orderInfo.SMO = smo;
				}
			}
			if (this.action === "REDUCE")
				orderInfo.CANCEL_QTY = this.cancelQty;
			// 送出改單
			M4C.Order.sendOrder(orderInfo);
			// 關閉彈窗
			eventBus.$emit("CLOSE-FLOAT-DIALOG");
		}
	},
	watch: {},
    computed: {
		/** 是否為智慧單 */
		isOCO() {
			return this.rpt.$IS_OCO;
		},
		rpt() {
			return this.param.rpt;
		},
		title() {
			if (this.action === "CANCEL")
				return this.$ln(`删除委托`);
			else if (this.action === "REPRICE")
				return this.$ln(`委托改价`);
			else if (this.action === "REDUCE")
				return this.$ln(`委托减量`);
			else
				return this.$ln(`委托资讯`);
		}
	},
	beforeDestroy() {
		if(typeof this.param.CB == "function")
			this.param.CB();
	}
}
</script>

<style scoped>
.order-modify-ctn {
	/* padding: 2vh 4vw; */
	border-radius: 10px;
	min-width: 80vw;
}
.th {
	width: 25vw;
}
.cbtn {
	color: white;
}
@media screen and (orientation: landscape) {
	.order-modify-ctn {
		/* padding: 2vw 4vh; */
		border-radius: 10px;
		min-width: 80vh;
	}
	.cbtn{
		border-radius: 5vh;
		width: 10vh;
		height: 10vh;
	}
	.pd1{
		padding: 1vh;
	}
	.mgtb2 {
		margin: 2vh 0;
	}
	.mgt2{
		margin-top: 2vh;
	}
	.pdb2 {padding-bottom: 2vh;}
}
</style>