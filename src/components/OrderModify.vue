<template>
    <div class="order-modify-ctn flex-col">
		<div class="head flex-center mgtb3">
			<span>{{title}}</span>
		</div>
		<div class="body flex-col mgb3 pdlr5">
			<div class="flex-row flex-start mgb2">
				<div class="mgr2"><span class="flex-center cbtn" :class="[rpt.$SIDE==='BUY' ? 'bgc-up' : 'bgc-dn']">{{$ln(rpt.$SIDE==='BUY' ? '买' : '卖')}}</span></div>
				<SymbolCNM4 :sid="sid" />
			</div>
			<div class="flex-col">
				<div class="mgt3 flex-row" v-if="rpt1OrderPriceText">
					<span class="th">{{$ln(`委托单别`)}} :</span>
					<span class="td flex-1 pdl3">{{rptOrderTypeText}}</span>
				</div>
				<div class="mgt3 flex-row">
					<span class="th">{{$ln(`委托价格`)}} :</span>
					<span class="td flex-1 pdl3">{{rpt1OrderPriceText}}</span>
					<span class="td flex-1" v-if="isOCO">{{rpt2OrderPriceText}}</span>
				</div>
				<div class="mgt3 flex-row" v-if="isSMO">
					<span class="th">{{$ln(`触发价格`)}} :</span>
					<span class="td flex-1 pdl3" v-if="!rpt1IsTs">{{rpt.$CONDITION_VALUE}}</span>
					<span class="td flex-1 pdl3" v-if="rpt1IsTs">
						{{$ln('回撤')}}{{rpt.$CONDITION_VALUE}}{{rptInfo1.SMO.TRG_TYPE !== 'GUARANTEE'? $ln('档'): ''}}
					</span>
					<span class="td flex-1" v-if="isOCO && !rpt2IsTs">{{rpt.$CONDITION_VALUE2}}</span>
					<span class="td flex-1" v-if="rpt2IsTs">{{$ln('回撤')}}{{rpt.$CONDITION_VALUE2}}{{$ln('档')}}</span>
					</div>
				<div class="mgt3 flex-row">
					<span class="th">{{$ln(`有效手数`)}} :</span>
					<span class="td flex-1 pdl3">{{rpt.$AVAILABLE_QTY}}</span>					
				</div>
			</div>
			<!-- 一般改價(洗價單觸發後，以一般改價處理) -->
			<div class="flex-row flex-center mgt5" v-if="action==='REPRICE' && isNormalOrder && !isMarketOrder">
				<div>{{$ln(`改设价格`)}}</div>
				<div class="flex-1 pdl3"><InputPrice v-model.number="orderPrice" :from="from" /></div>
			</div>	
			<!-- SMO改價(SMO單且CONDITION_TYPE不是NORMAL, OCO不支持) -->
			<div class="flex-col nowrap" v-if="(isSMO && !isNormalOrder && !isOCO)">
				<div class="flex-row flex-center mgt2 w100p" v-if="action==='REPRICE' && !rpt1IsTs">
					<span class="th mgr4">{{$ln(getOrderCondition(rptInfo1))}}</span>
					<div class="flex-1 td"><InputPrice v-model.number="trgPrice" :from="from" /></div>
				</div>
				<div class="flex-row flex-center mgt2 w100p" v-if="rpt.$IS_OCO && rptInfo2 && action==='REPRICE' && !rpt2IsTs">
					<span class="th mgr4">{{$ln(getOrderCondition(rptInfo2))}}</span>
					<div class="flex-1 td"><InputPrice v-model.number="trgPrice2" :from="from" /></div>
				</div>
			</div>
			<!-- 減量 -->
			<div class="flex-row flex-center mgt5" v-if="action==='REDUCE'">
				<div>{{$ln(`减少手数`)}}</div>
				<div class="flex-1 pdl3"><InputQty v-model="cancelQty" :max="rpt.$AVAILABLE_QTY" :from="from" /></div>
			</div>
		</div>

		<div class="foot flex-row">
			<div class="flex-center flex-1 fd-content-bdc cancel-btn" @click="onClose">{{$ln('取消')}}</div>
			<div class="flex-center flex-1 fd-content-bdc confirm-btn" @click="onBtnConfirm" v-if="showConfrim">{{$ln('确认')}}</div>
		</div>
    </div>
</template>

<script>
export default {
	props: ["param"],
	data() {
		return {
			action: this.param.action,
			orderPrice: this.param.modifyPrice || this.param.rpt.ORDER_PRICE,
			trgPrice: 0,
			trgPrice2: 0,
			cancelQty: 1,
			from: 'orderModify'
		}
	},
	beforeMount() {
		// 除了證券需要取最低單位，其他數量只要1;
		this.cancelQty = this.qtyStep;
	},
	mounted() {
		this.trgPrice = this.param.modifyTrgPrice1 || this.trg_price1;
		this.trgPrice2 = this.param.modifyTrgPrice2 || this.trg_price2;
	},
    methods: {
		getOrderCondition(orderInfo){
			if (orderInfo.TC_ORDER_TYPE == 'MIT' || orderInfo.TC_ORDER_TYPE == 'LIT')
				return "改设止盈";
			else if (orderInfo.CONDITION_TYPE == "STOP" || orderInfo.TC_ORDER_TYPE == 'STOP' || orderInfo.TC_ORDER_TYPE == 'STPLMT')
				return "改设止损";
		},
		onClose(){
			if(typeof this.param.CB === "function"){
				this.param.CB();
			}
			this.$emit('close');
		},
		// 確認
		onBtnConfirm() {
			let rpt = this.rpt;
			let orderInfo = {
				'REPORT_ID': rpt.key,
				'SYMBOL': this.sid,
				'ACTION': this.action,
				'AP_PLUGIN': this.useComName || this.selfComName,
			};
			if (this.action === "REPRICE") {
				// OCO直接調整委託內容再送給server
				if(this.isOCO) {
					let smo = this.rpt.SMO;
					if(!this.rpt1IsTs){
						if(rpt.OCO[0].STOP_PRICE)
							rpt.OCO[0].STOP_PRICE = Number(this.trgPrice);
						else if(rpt.OCO[0].TOUCH_PRICE)
							rpt.OCO[0].TOUCH_PRICE = Number(this.trgPrice);
					}
					if(!this.rpt2IsTs){
						if(rpt.OCO[1].STOP_PRICE)
							rpt.OCO[1].STOP_PRICE = Number(this.trgPrice2);
						else if(rpt.OCO[1].TOUCH_PRICE)
							rpt.OCO[1].TOUCH_PRICE = Number(this.trgPrice2);
					}
					rpt.action = this.action;
					rpt.AP_PLUGIN = this.useComName || this.selfComName;
					rpt.REPORT_ID = rpt.key;
					orderInfo = rpt;
				}
				// 不是移動停損的智慧單
				else if(this.isSMO && !rpt.TRAILING_TYPE) {
					// SMO觸價單帶NEW_TOUCH_PRICE。
					if(rpt.TOUCH_PRICE)
						orderInfo.NEW_TOUCH_PRICE = Number(this.trgPrice);
					// SMO停損單帶NEW_STOP_PRICE。
					else 
						orderInfo.NEW_STOP_PRICE = Number(this.trgPrice);
				}
				else {
					orderInfo.NEW_PRICE = Number(this.orderPrice);
				}
			}
			if (this.action === "REDUCE") {
				// 減量至 0 -> 替換為刪單
				if (this.cancelQty === this.rpt.$AVAILABLE_QTY)
					orderInfo.ACTION = 'CANCEL';
				else
					orderInfo.CANCEL_QTY = this.cancelQty;
			}
			// 送出改單
			M4C.Order.sendOrder(orderInfo);
			// 關閉彈窗
			eventBus.$emit("CLOSE-FLOAT-DIALOG");
		}
	},
	watch: {},
    computed: {
		useComName() {return this.param.useComName;},
		isStock() {return this.sid.split(".")[1] === "S"},
		// 最低單位
		qtyStep() {return this.isStock? this.$store.state.order.stkQtyStep: 1},
		sid() {return this.rpt.$IS_OCO ? this.rpt.OCO[0].SYMBOL : this.rpt.SYMBOL},
		showConfrim() {
			if (this.action === "REPRICE")
				return !this.notSupportRepriceType;
			else return true;
		},
		// 不支援改价(有移动停损、對手價、排隊價、OCO不支援)、一般市價單(包含觸價後的)
		notSupportRepriceType() {
			// 一般市價單(包含觸價後的)
			let normalMarketOrder = this.isNormalOrder && this.isMarketOrder;
			let noSupportOrderType = ['HIT', 'JOIN'].indexOf(this.rpt1OrderType) != -1;
			return this.rpt1IsTs || this.rpt2IsTs || this.isOCO|| (noSupportOrderType && !this.isSMO) || normalMarketOrder;
		},
		rpt() {
			return this.param.rpt;
		},
		isSMO() {
			return (this.rpt.$IS_SMO || this.isFcmSupportSMO) && !this.isNormalOrder;
		},
		isOCO() {
			return this.rpt.$IS_OCO && !this.isNormalOrder;
		},
		// 上手是否支持洗價單
		isFcmSupportSMO() {
			// 支持洗價單種類
			let supportedSMO = ["STOP", "STPLMT", "TSTOP", "TSTPLMT", "MIT", "LIT"];
			return supportedSMO.indexOf(this.rptInfo1.TC_ORDER_TYPE) != -1;
		},
		rpt1IsTs() {
			try {
				if(this.isSMO)
					return this.rptInfo1.TRAILING_TYPE || this.rptInfo1.SMO.CONDITION == "TRAILINGSTOP";
			}catch(e) {}
		},
		rpt2IsTs() {
			try {
				if(this.isOCO)
					return this.rptInfo2.TRAILING_TYPE || this.rptInfo2.SMO.CONDITION == "TRAILINGSTOP";
			}catch(e) {}
		},
		title() {
			if (this.action === "CANCEL")
				return this.$ln(`删除委托`);
			else if (this.action === "REPRICE")
				return this.$ln(`委托改价`);
			else if (this.action === "REDUCE")
				return this.$ln(`委托减量`);
		},
		rptOrderTypeText() {
			if(this.isOCO) return "OCO";
			return this.$ln(this.$store.state.config.mapOrderTypeLabel[this.rptInfo1.TC_ORDER_TYPE]);
		},
		rptInfo1() {
			// 以觸價邊判斷取委託資訊
			let side = this.rpt.$TOUCHED_SIDE && this.rpt.$TOUCHED_SIDE == 2? 1: 0;
			return this.rpt.$IS_OCO ? this.rpt.OCO[side] : this.rpt;
		},
		trg_price1() {
			return this.rptInfo1.$CONDITION_VALUE_NOR || "";
		},
		rpt1OrderType() {return this.rptInfo1.TC_ORDER_TYPE;},
		rpt1OrderPriceText() {
			if(this.rptInfo1.TS_LEVEL){
				let orderTypeText = this.rpt1OrderType.split('_').slice(-1);
				return `${this.$ln(this.$store.state.config.mapOrderTypeLabel[orderTypeText])} ${this.$ln('加')}${this.rptInfo1.TS_LEVEL}${this.$ln('跳')}`;
			}
			// 已觸價且是第二邊取第二邊的委託價顯示。
			else if(this.rpt.$TOUCHED_SIDE == 2)
				return this.rpt.$ORDER_PRICE2 || this.$ln(`市价`);
			else {
				// 複式單 & 價差期貨 => 要看 ORDER_TYPE 決定是否直接顯示委託價格數值
				if (this.isMultiOrder || this.isPriceDiff) {
					if (this.rpt.TC_ORDER_TYPE === 'LIMIT' || this.rpt.TC_ORDER_TYPE === 'LIT' || this.rpt.TC_ORDER_TYPE === 'STPLMT')
						return this.rpt.$ORDER_PRICE;
				}

				return this.rpt.$ORDER_PRICE || this.$ln(`市价`);
			}
		},
		rptInfo2() {
			return this.rpt.$IS_OCO ? this.rpt.OCO[1] : {};
		},
		trg_price2() {
			return this.rptInfo1.$CONDITION_VALUE2_NOR || "";
		},
		rpt2OrderType() {return this.rptInfo2.TC_ORDER_TYPE;},
		rpt2OrderPriceText() {
			if(this.rptInfo2.TS_LEVEL){
				let orderTypeText = this.rpt2OrderType.split('_').slice(-1);
				return `${this.$ln(this.$store.state.config.mapOrderTypeLabel[orderTypeText])} ${this.$ln('加')}${this.rptInfo2.TS_LEVEL}${this.$ln('跳')}`;
			}
			else return this.rpt.$ORDER_PRICE2 || this.$ln(`市价`);
		},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
		// 當前委託是否為一般單(洗價單觸發後也是一般單，OCO目前沒有改價需求)
		isNormalOrder() {return this.rpt.$IS_NormalOrder;},
		// 市價單判斷(含智慧單)
		isMarketOrder() {
			let marketList = ['MARKET', 'STOP', 'TSTOP', 'MIT', 'MWP'];
			return marketList.indexOf(this.rptInfo1.TC_ORDER_TYPE) != -1;
		},
		// 期貨價差商品
		isPriceDiff() {
			return M4C.Symbol.isPriceDiff_FutSymbol(this.sid);
		},
		// 組合單
		isMultiOrder() {
			return this.rpt.SYMBOL && this.rpt.SYMBOL2;
		},
	},
	beforeDestroy() {
		if(typeof this.param.CB == "function")
			this.param.CB();
	}
}
</script>

<style scoped>
.order-modify-ctn {
	border-radius: 10px;
	min-width: 90vw;
	max-width: 90vw;
}
.th, .td{
	line-height: 1.2em;
}
.body {
	padding-bottom: 10vw;
}
.cbtn {
	color: white;
}
@media screen and (orientation: landscape) {
	.order-modify-ctn {
		border-radius: 10px;
		min-width: 90vh;
		max-width: 90vh;
	}
	.cbtn{
		border-radius: 5vh;
		width: 10vh;
		height: 10vh;
	}
	.mgt5{
		margin-top: 5vh;
	}
	.mgtb5 {
		margin: 5vh 0;
	}
}

/* 桌機版 */
.desktop .order-modify-ctn {
	min-width: 338px;
}
.desktop .body {
	padding-bottom: 38px;
}
.desktop .cbtn {
	border-radius: 19px;
	width: 38px;
	height: 38px;
}

</style>