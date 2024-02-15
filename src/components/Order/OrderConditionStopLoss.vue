<template>
    <div class="order-condition-stop-loss flex-row list-block">
		<!-- 交易帳號選擇器 -->
		<LoginedBTOSelector class="logined-bto-selector w100p mgb3" :orderMode="true" />
		<!-- 委託別下拉選單 -->
		<SingleSelect :options="orderTypeOptions" v-model="$order.orderType" class="w100p mgb3"/>
		<!-- 效期別下拉選單 -->
		<TimeInForceSelector :sid="sid" class="list-item mgb3" />
		<!-- 日期選擇器 -->
		<div class="w100p mgb3" v-if="$store.state.order.inputTimeInForce == 'GTD'">
			<div class="flex-row btn-default-ht-rd tcef date-select" >
				<i class="material-icons mgt1 icon-right mgl3 mgr2">date_range</i>
				<div class="date-ctn posr flex-start">
					<span class="date-label">{{new Date(date).day10()}}</span>
					<input type="date" v-model="date" class="start-date-ctn flex-row row-reverse FULL" :min="minDate"/>
				</div>
			</div>
		</div>
		<!-- 超價跳數 -->
		<div class="w100p mgb3" v-if="orderType=='OVER'">
			<InputQty v-model="$store.state.order.overJump" :label="$ln(`跳`)" />
		</div>
		<!-- 止盈觸發價格 -->
		<div class="w100p mgb3" v-if="isStopLoss">
			<InputPrice v-model.number="$order.inputOcoCondition1Price" :label="$ln(`价格`)" /></div>
		<!-- 止損觸發價格 -->
		<div class="w100p mgb3" v-if="isStopLoss">
			<InputPrice v-model.number="$order.inputOcoCondition2Price" :label="$ln(`价格`)" /></div>
		<!-- 觸發盈利價差檔數 -->
		<div class="w100p mgb3" v-if="isHomoto">
			<InputQty v-model="$order.inputOrderPipValue" min="0" :label="$ln(`价差`)" /></div>
		<!-- 手數 -->
		<div class="w100p mgb3">
			<InputQty v-model="$order.inputOrderQty" :max="availableQty" :label="$ln(`手数`)" />
		</div>
		<!-- 為對齊StopLossOrderInfo額外空的一列 -->
		<div class="w100p mgb3 ht2" v-if="showSpaceRow"/>
    </div>
</template>

<script>
export default {
	props: ["mode", "param"],
	data() {
		return {
			orderTypeOptions:[
				{label: '限價', value: 'LIMIT'}, 
				{label: '市价', value: 'MARKET'}, 
				{label: '对手价', value: 'HIT'}, 
			],
			date: new Date(),
			minDate: new Date().day10('-'),
		}
	},
	beforeMount() {},
    mounted() {
		// 初始化ui資料
		this.$order.orderType = "MARKET";
		this.$order.inputOrderQty = this.availableQty;
		this.$order.inputOcoCondition1Price = this.stopProfitPrice;
		this.$order.inputOcoCondition2Price = this.stopLossPrice;
		// 不是台灣版加入超價選項
		if(!this.twMode) {
			this.orderTypeOptions.push({label: '超价', value: 'OVER'});
		}
		// 台灣版且該商品支援一定範圍市價
		else if(this.twMode && this.isMWP){
			this.orderTypeOptions.push({label: '一定范围市价', value: 'MWP'});
		}
		// 不是台灣版且有漲跌停價時才加入停板價選項。
		if(!this.twMode && (this.qo.hl || this.qo.ll)) {
			this.orderTypeOptions.push({label: '停板价', value: 'PRICELIMIT'});
		}
	},
	beforeDestroy() {},
    methods: {},
	watch: {
		mode(nv, ov) {
			if(nv=="stoploss") {
				this.$order.inputOcoCondition1Price = this.stopProfitPrice;
				this.$order.inputOcoCondition2Price = this.stopLossPrice;
				this.$order.inputOrderPipValue = 0;
			}
			else {
				this.$order.inputOcoCondition1Price = this.homotoPrice;
			}
		},
		// 盈利價差點數
		pipValue(nv, ov) {
			// 變動時重新計算保本單觸發價
			if(nv) {
				this.$order.inputOcoCondition1Price = this.homotoPrice;
			}
		},		
		date(ov){
			this.$store.state.sync.datePick.date = ov;
		}
	},
    computed: {
		sid() {return this.$store.state.selectedSymbol.ID;},
		minfo() {return this.$store.state.selectedSymbol.MInfo;},
		qo() {return this.$store.state.selectedSymbol.QO;},
		qop() {
			return this.qo.p || this.qo.r || this.qo.pc || 0;
		},
		twMode() {
			return this.$store.state.config.twMode;
		},
		// 委託別
		orderType() {
			return this.$order.orderType;
		},
		$order() {
			return this.$store.state.order;
		},
		// 由部位加值欄位取淨倉數量
		offsetableNetQty() {
            return this.ssps? this.ssps.$NET_OFFSETABLE_QTY: 0;
		},
        // 有效(淨倉)數量
		availableQty() {
			return this.ssps? Math.abs(this.offsetableNetQty): 1;
		},
        // 關注商品的持倉資料
        ssps() {return this.$store.state.selectedSymbol.positionSum;},
		// 依止盈跳数算出预设止盈价
		stopProfitPrice() {
			let price = 0;
			let ts = M4C.Symbol.getTickSize(this.sid, this.$order.inputOcoCondition1Price);
			// 依多空計算止盈價
			if(this.offsetableNetQty > 0)
				price =  this.$safeFloat(this.qop + (ts * this.$store.state.order.tpJumpCnt));
			else
				price = this.$safeFloat(this.qop - (ts * this.$store.state.order.tpJumpCnt));
			// 止盈價小於0，以現價顯示。
			return price < 0? this.qop: price;
		},
		// 依止损跳数算出预设止损价
		stopLossPrice() {
			let price = 0;
			let ts = M4C.Symbol.getTickSize(this.sid, this.$order.inputOcoCondition2Price);
			// 依多空計算止損價
			if(this.offsetableNetQty > 0)
				price = this.$safeFloat(this.qop - (ts * this.$store.state.order.slJumpCnt));
			else
				price = this.$safeFloat(this.qop + (ts * this.$store.state.order.tpJumpCnt));
			// 止損價如果小於0，以現價顯示。
			return price < 0? this.qop: price;
		},
		// 盈利價差點數
		pipValue() {return this.$order.inputOrderPipValue;},
		// 保本價(加計盈利價差點數)
		homotoPrice() {
			// 盈利價差點數
			let pipValue = this.pipValue;
			let ts = M4C.Symbol.getTickSize(this.sid, this.$order.inputOcoCondition1Price);
			let maxBuyPrice = Math.ceil(this.$safeFloat(this.ssps.$BAVG / ts));
			let minSellPrice = Math.floor(this.$safeFloat(this.ssps.$SAVG / ts));
			// 依ticksize計算成本價(加計盈利價差點數)
			if(this.offsetableNetQty > 0)
				return this.$safeFloat((maxBuyPrice + pipValue) * ts);
			else 
				return this.$safeFloat((minSellPrice - pipValue) * ts);
		},
		// 平倉方向
		closeSide() {return this.offsetableNetQty > 0 ? "SELL" : "BUY";},
		// 是否為止盈止損單
		isStopLoss() {return this.mode == "stoploss";},
		// 是否為保本單
		isHomoto() {return this.mode == "homoto";},
		/** 效期別選單 */
		tifOptions(){
			let list;
			// 一定範圍市價不允許 ROD 選項
			if (this.orderType === 'MWP') {
				this.$order.inputTimeInForce = 'IOC';
				list = [
					{label: 'IOC', value: 'IOC'},
					{label: 'FOK', value: 'FOK'},
				];
			}
			else {
				list = [
					{label: 'ROD', value: 'ROD'},
					{label: 'IOC', value: 'IOC'},
					{label: 'FOK', value: 'FOK'},
				];
			}
			// 設定 selected
			let option = list.find(o => o.value === this.$order.inputTimeInForce);
			if (option) option.selected = true;
			return list;
		},
		// 可平備兌倉數量
        offsetableCoveredQty() {return this.ssps.OFFSETABLE_COVERED_SELL_QTY;},
		/** 当前商品是否为 ETF 期权 */
		isETF() {
			return (this.minfo.Exchange === "SSE" || this.minfo.Exchange === "SZSE") && this.minfo.Type === "O";
		},
		showSpaceRow() {
			return this.offsetableCoveredQty && this.isETF && !this.$store.state.login.isSIM;
		},
		// 該商品支援的委託類型
		orderTypeList() {return M4C.Symbol.getOrderType(this.sid).split(';');},
		// 是否可用一定範圍市價
		isMWP() {return this.orderTypeList.indexOf("MWP") != -1},
	},
}
</script>

<style scoped>
.logined-bto-selector {
	height: 35.75px;
}
.label {
	white-space: nowrap;
	overflow: hidden;
}
.inputs-ctn {
	width: 52vw;
}
input {
	text-align: center;
	height: 10vw;
	padding: 0;
	border: 0;
	border-radius: 6px;
}
.simpleW {
	width: 45vw;
	margin-bottom: 3vw;
}
input {
    background: rgba(0,0,0,0);
    border-width: 0;
    color: white;
    width: 5.5em;
    opacity: 0;
}
input::-webkit-calendar-picker-indicator {
    opacity: 0;
    background: rgba(0, 0, 0, 0);
    position: absolute;
    width: 200px;
    height: 1em;
    background-image: none !important;
}
input::-webkit-inner-spin-button {
    display: none;
    background: none !important;
    width:0;
}
.date-select{
	box-sizing: border-box;
	border: 1px solid #393939
}
</style>