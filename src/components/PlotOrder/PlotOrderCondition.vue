<!-- 策略下單盒 - 下方委託條件總成 -->
<template>
    <div class="plot-order-condition-ctn flex-col" :class="{'pad': isPad}">
		<div class="overflow-y-auto">
			<table>
				<tr>
					<td colspan="2">
						<!-- 單式下單/組合下單 -->
						<div v-if="enableMulti" class="w50vw">
							<radio class="radio-ctn flex-row bgc-white clr-black mgr1" v-model="modeSingleMulti">
								<span value="SINGLE">{{$ln(`单式下单`)}}</span>
								<span value="MULTI">{{$ln(`组合下单`)}}</span>
							</radio>
						</div>
					</td>
				</tr>
				<tr>
					<td class="w55p clr-gray2 font-size-mini pdtb2">{{$ln('部位')}}</td>
					<td class="w45p clr-gray2 font-size-mini pdtb2">{{$ln('委托价')}}</td>
				</tr>
				<tr>
					<td class="pdr2">
						<div class="flex-1 flex-row w100p">
							<div class="rbtn mgr2 clr-white" :class="`bgc-${selectedStrategy.BS1}`">{{BS1}}</div>
							<div class="rbtn mgr2 clr-white" :class="`bgc-${selectedStrategy.CP1}`">{{selectedStrategy.CP1}}</div>
							<div class="flex-1 flex-center">
								<!-- 履約價選擇器 -->
								<PlotOrderStrikePriceSelector ref="sps1" idx="1" class="w100p" :strikePriceList="strikePriceList" :closedPrice="closedPrice" 
									@onStrikePriceChange="p=>strikePrice1=p" :strategySP="selectedStrategy.SP1" :selectedStrategy="selectedStrategy" />
							</div>
						</div>
					</td>
					<td>
						<!-- 委託價1 -->
						<InputPrice v-if="price1Enable" class="w100p" v-model.number="inputOrderPrice1" :propSid="sid1" />
						<!-- 委託價1 (市價時替換為這個) -->
						<span v-if="isMarket" class="input-price-market font-size-mini flex-center">{{$ln('市价')}}</span>
						<!-- 組合下單的委託價 -->
						<InputPrice v-if="isMulti && !isMarket" class="w100p" v-model.number="inputOrderPriceMulti" :propSid="sid1" />
					</td>
				</tr>
				<tr>
					<td class="pdr2">
						<div class="flex-1 flex-row w100p" v-if="selectedStrategy.BS2">
							<div class="rbtn mgr2 clr-white" :class="[`bgc-${selectedStrategy.BS2}`, isMulti ? 'opacity0' : '']">{{BS2}}</div>
							<div class="rbtn mgr2 clr-white" :class="`bgc-${selectedStrategy.CP2}`">{{selectedStrategy.CP2}}</div>
							<div class="flex-1 flex-center">
								<!-- 履約價選擇器 -->
								<PlotOrderStrikePriceSelector ref="sps2" idx="2" class="w100p" :strikePriceList="strikePriceList2" :closedPrice="closedPrice"
									@onStrikePriceChange="p=>strikePrice2=p" :strategySP="selectedStrategy.SP2" :selectedStrategy="selectedStrategy" v-if="strikePriceList2.length"/>
							</div>
						</div>
					</td>
					<td>
						<!-- 委託價2 -->
						<InputPrice v-if="price2Enable" class="w100p" v-model.number="inputOrderPrice2" :propSid="sid2" />
						<!-- 委託價2 (市價時替換為這個) -->
						<span v-if="isMarket && !isMulti && selectedStrategy.BS2" class="input-price-market font-size-mini flex-center">{{$ln('市价')}}</span>
					</td>
				</tr>
				<tr><td class="clr-gray2 font-size-mini pdt4 pdb2" colspan="2">{{$ln('委托条件')}}</td></tr>
				<tr>
					<td class="pdr2">
						<!-- 仓别 -->
						<SingleSelect class="flex-1" :options="positionEffectOptList" v-model="positionEffect" />
					</td>
					<td class="flex-row">
						<!-- 市价/限价 -->
						<SingleSelect :options="orderTypeOptList" v-model="orderType" />
						<!-- ROD/IOC/FOK -->
						<SingleSelect class="flex-1" :options="timeInForceOptList" v-model="timeInForce" />
					</td>
				</tr>
				<tr>
					<td class="pdt2 pdr2">
						<!-- 數量 -->
						<InputQty :step="step"  v-model="inputQty" :label="$ln('手数')"/>
					</td>
					<td class="pdt2">
						<PriceRadioQtyBtn class="price-radio-qty-btn-ctn font-size-mini" @onPlusQty="n=>plusQty(n)" @onQty="n=>inputQty=n"/>
					</td>
				</tr>
			</table>
		</div>
		<div class="flex-1" />
		<!-- 取消與確認按鈕 -->
		<div class="mgt1 mgb4 flex-row flex-center">
			<Button class="btn-confirm mgr3 dark" @click="onBtnBack">{{$ln("取消")}}</Button>
			<Button class="btn-confirm mgl3" :class="{disabled: isDisableSend}" @click="onBtnOrder">{{$ln("送出委托")}}</Button>
		</div>
    </div>
</template>

<script>
import PlotOrderStrikePriceSelector from "@/components/PlotOrder/PlotOrderStrikePriceSelector.vue";
import PriceRadioQtyBtn from "@/components/PriceRadioQtyBtn.vue";

export default {
	props: ["selectedStrategy", "contracts", "closedPrice", "gv"],
	data() {
		return {
			qo1: {},
			qo2: {},
			/** 履約價 */
			strikePrice1: 0,
			strikePrice2: 0,
			/** 委託價 */
			inputOrderPrice1: 0,
			inputOrderPrice2: 0,
			inputOrderPriceMulti: 0,
			/** 委託量 */
			inputQty: 1,
			/** 倉別 */
			positionEffect: "OPEN",
			/** 效期別 */
			timeInForce: "ROD",
			/** 價格別 */
			orderType: "LIMIT",
			calcResult: {},
			/** 委託倉別選項 */
			positionEffectOptList: [
				{label: `自动`, value: "AUTO"},
				{label: `开仓`, value: "OPEN"},
				{label: `平仓`, value: "CLOSE"},
				{label: `平今`, value: "CTD"},
				{label: `平昨`, value: "CYD"},
				{label: `备开`, value: "CWO"},
				{label: `备平`, value: "CWC"},
			],
			/** 是否顯示組合下單 */
			enableMulti: false,
			/** 切換在單式下單或組合下單 */
			modeSingleMulti: 'SINGLE',
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {
		PlotOrderStrikePriceSelector,
		PriceRadioQtyBtn,
	},
    methods: {
		getOrderPrice(bsKey, qo) {
			let bs = this.selectedStrategy[bsKey];
			switch(this.orderType) {
				// case "LIMIT":		// 限价
				// 	return qo.p;
				case "HIT":	// 對手價
					return bs==="B" ? qo.sp1 : qo.bp1;
				case "JOIN":		// 排隊價
					return bs==="B" ? qo.bp1 : qo.sp1;
				case "LIMIT":		// 限价
					return bs==="B" ? qo.sp1 : qo.bp1;
				case "MARKET":		// 市價
					return this.$ln(`市价`);
			}
		},
		onBtnBack() {
			eventBus.$emit("CLOSE-DIALOG");
		},
		/** 增加指定數值，並且保證落在該數值倍數上 */
		plusQty(n) {
			this.inputQty = +Big(this.inputQty).plus(n);
			this.inputQty = +Big(this.inputQty).minus(this.inputQty % n);
		},
		/** 送出委托 */
		onBtnOrder() {
			let orderInfo1 = this.orderInfo1;
			let orderInfo2 = this.orderInfo2;
			// 組合下單情境
			if (this.isMulti) {
				orderInfo1 = this.orderInfoMulti;
				orderInfo2 = null;
			}
			// 跳出確認視窗
			if (this.$store.state.order.confirm){
				eventBus.$emit("POPUP-DIALOG", 'OrderConfirm', {orderInfo: orderInfo1, orderInfo2: orderInfo2}, {transName: 'float'});
			}
			// 直接送出下單
			else {
				M4C.Order.sendOrder(orderInfo1);
				if (orderInfo2)
					M4C.Order.sendOrder(orderInfo2);
				eventBus.$emit("CLOSE-FLOAT-DIALOG");
			}						
		},
		/** 檢查是否啟用組合下單功能 */
		checkEnableMulti() {
			// 僅鄭商所支持
			if (!this.sid1 || this.sid1.indexOf('.CZCE.') === -1) {
				this.enableMulti = false;
				return;
			}
			switch(this.selectedStrategy.key) {
				case 'BuyStraddles':	// 原点突破
				case 'SellStraddles':	// 原点盘整
				case 'BuyStrangles':	// 区间突破
				case 'SellStrangles':	// 区间盘整
					this.enableMulti = true;
					break;
				default:
					this.enableMulti = false;
					break;
			}
		},
		// 組合下單時只需要設定一個價格
		setInputOrderPriceMulti() {
			// 這裡會||0是為了避免價格為非數值，導致big運算報錯。
			this.inputOrderPriceMulti = +Big(this.inputOrderPrice1 || 0).plus(this.inputOrderPrice2 || 0);
			// 這裡多處理一段，當兩個價格都是空字串就設定為空字串，以符合無值情境。
			this.inputOrderPriceMulti = this.inputOrderPrice1 === "" && this.inputOrderPrice2 === ""? "": this.inputOrderPriceMulti;
		},
	},
	watch: {
		/** 切換履約價變更商品 -> 重設委託價 */
		sid1(nv) {
			this.qo1 = this.$store.state.plOrder.qo1 = M4C.Quote.getQuoteObject(this.sid1);
			this.inputOrderPrice1 = this.getOrderPrice("BS1", this.qo1);
			this.checkEnableMulti();
		},
		sid2(nv) {
			this.qo2 = this.$store.state.plOrder.qo2 = M4C.Quote.getQuoteObject(this.sid2);
			this.inputOrderPrice2 = this.getOrderPrice("BS2", this.qo2);
		},
		qo1p() {
			if (!this.inputOrderPrice1)
				this.inputOrderPrice1 = this.getOrderPrice("BS1", this.qo1);
		},
		qo2p() {
			if (!this.inputOrderPrice2)
				this.inputOrderPrice2 = this.getOrderPrice("BS2", this.qo2);
		},
		/** 切換價格別  -> 重設委託價 */
		orderType() {
			this.inputOrderPrice1 = this.getOrderPrice("BS1", this.qo1);
			this.inputOrderPrice2 = this.getOrderPrice("BS2", this.qo2);
		},
		inputQty(nv) {
			this.$store.state.plOrder.qty = nv;
		},
		profitLossResult(nv) {
			this.$store.state.opt.profitLossResult = nv;
		},
		// 切換單式下單/組合下單
		modeSingleMulti() {
			this.setInputOrderPriceMulti();
		},
		inputOrderPrice1() {
			this.setInputOrderPriceMulti();
			this.$set(this.gv, 'inputOrderPrice1', this.inputOrderPrice1);
		},
		inputOrderPrice2() {
			this.setInputOrderPriceMulti();
			this.$set(this.gv, 'inputOrderPrice2', this.inputOrderPrice2);
		},
		/** 切換策略 */
		'selectedStrategy.key'(nv) {
			this.checkEnableMulti();
		},
		strikePrice1(nv, ov) {
			// 原點突破/原點盤整 -> 同步履約價 (判斷要有 ov 可避開首次預設值呼叫過來的情況)
			if (ov && this.selectedStrategy.key === 'BuyStraddles' || this.selectedStrategy.key === 'SellStraddles')
				this.$refs.sps2.setSelectedSP(nv);
		},
		strikePrice2(nv, ov) {
			// 原點突破/原點盤整 -> 同步履約價 (判斷要有 ov 可避開首次預設值呼叫過來的情況)
			if (ov && this.selectedStrategy.key === 'BuyStraddles' || this.selectedStrategy.key === 'SellStraddles')
				this.$refs.sps1.setSelectedSP(nv);
		},
	},
    computed: {
		isPad() {
			return this.$store.state.device.isPad;
		},
		qo1p() {
			return this.qo1.p;
		},
		qo2p() {
			return this.qo2.p;
		},
		/** 第一檔商品 */
		BS1() {
			return this.$ln(this.selectedStrategy.BS1==="B" ? "买" : "卖");
		},
		sid1() {
			let tmp = this.$store.state.plOrder.sid1 = this.cpspToSid[`${this.selectedStrategy.CP1}.${this.strikePrice1}`];
			console.log(`PlotOrderCondition.sid1 : `, tmp);
			return tmp;
		},
		/** 第二檔商品 */
		BS2() {
			return this.$ln(this.selectedStrategy.BS2==="B" ? "买" : "卖");
		},
		sid2() {
			let tmp = this.$store.state.plOrder.sid2 = this.cpspToSid[`${this.selectedStrategy.CP2}.${this.strikePrice2}`];
			console.log(`PlotOrderCondition.sid2 : `, tmp);
			return tmp;
		},
		/** 履約價最長小數位數 */
		decimalLen() {
			let contracts = this.contracts.C;
			// 找出當前履約價的最長小數位數 (履約價補0用)
			let maxLen = 0;
			// 經驗上找五個 sid 就夠找出最長小數位數的商品，不用全爬完
			// (因為遇到第六個sid的小數位數更長的情形，所以先全爬完。約花0.01ms到0.4ms不等) 
			let cnt = contracts.length; //contracts.length > 5 ? 5 : contracts.length;
			for (let i=0; i<cnt; i++) {
				let tmp = contracts[i].split('.');
				let dlen = tmp[7] ? tmp[7].length : 0;
				maxLen = dlen > maxLen ? dlen : maxLen;
			}
			return maxLen;
		},
		/** 製作 CP.SP 對應 SID 的表 (ex. "C.2.800" -> "I.O.SSE.510050A.202001.C.2.8") */
		cpspToSid() {
			let map = {};
			let contracts = this.contracts;
			Object.keys(contracts).forEach((cp)=>{
				if (cp === "C" || cp === "P") {
					contracts[cp].forEach((sid)=>{
						let minfo = M4C.Symbol.getMainformInfo(sid);
						let tmp = sid.split('.');
						let sp = parseFloat(tmp.slice(6).join('.')).toFixed(this.decimalLen) + (minfo.SetPRIADJ || '');
						map[`${tmp[5]}.${sp}`] = sid;
					});
				}
			});
			return map;
		},
		/** 履約價1 Array */
		strikePriceList() {
			let self = this;
			if (this.contracts) {
				let contracts = this.contracts.C;
				return contracts.map((sid)=>{
					let minfo = M4C.Symbol.getMainformInfo(sid);
					let tmp = sid.split('.');
					return parseFloat(tmp.slice(6).join('.')).toFixed(this.decimalLen) + (minfo.SetPRIADJ || '');
				});
			}
		},
		/** 履約價2 Array */
		strikePriceList2() {
			let self = this;
			// 区间突破 || 区间盘整
			if (this.selectedStrategy.key === 'BuyStrangles' || this.selectedStrategy.key === 'SellStrangles') {
				let list = self.strikePriceList.filter((price)=>{
					return parseFloat(price) < parseFloat(self.strikePrice1);
				});
				return list;
			}
			// 其它
			return this.strikePriceList;
		},
		/** 當前商品代碼至 Call/Put 這一層 ex."I.O.SSE.510050.202001.C" */
		sidToMonth() {
			if (this.contracts) {
				let sid = this.contracts.C[0];
				return sid.split('.').slice(0,5).join('.');
			}
		},
		/** 下單內容 - 買賣別1 */
		orderSide1() {
			return this.selectedStrategy.BS1==="B" ? "BUY" : "SELL";
		},
		/** 下單內容 - 買賣別2 */
		orderSide2() {
			return this.selectedStrategy.BS2==="B" ? "BUY" : "SELL";
		},
		/** {最大獲利 / 最大損失 / 損益兩平} */
		profitLossResult() {
			if (!this.sid1)
				return;
			if (this.selectedStrategy.CP2 && !this.sid2)
				return;
			let p1 = this.orderType === "MARKET" ? this.qo1p : this.inputOrderPrice1;
			let p2 = this.orderType === "MARKET" ? this.qo2p : this.inputOrderPrice2;
			let product = [{
					Symbol: this.sid1,
					Quantity: this.inputQty,
				}, {
					Symbol: this.sid2,
					Quantity: this.inputQty,
				},
			];
			product[0][this.selectedStrategy.BS1==="B" ? "Bid" : "Ask"] = p1;
			product[1][this.selectedStrategy.BS2==="B" ? "Bid" : "Ask"] = p2;

			try {
				// 算出 最大獲利 / 最大損失 / 損益兩平
				return window.StrategyProfitLossCore.calc({
					StrategyName: this.selectedStrategy.key,
					Products: product,
					multiOrder: null,
				});
			}catch(err){}
		},
		/** 當前是否切在組合下單 */
		isMulti() {
			return this.enableMulti && this.modeSingleMulti === 'MULTI';
		},
		/** 委託單1 */
		orderInfo1() {
			// 除了市價單以外都以限價單送
			let orderType = this.orderType === 'MARKET' ? 'MARKET' : 'LIMIT';
			return {
				'ACTION': 'NEW',								// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
				'SYMBOL': this.sid1,
				'SIDE': this.orderSide1,						// 買BUY/賣SELL
				'POSITION_EFFECT': this.positionEffect,			// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
				'TC_ORDER_TYPE': orderType,						// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
				'TIME_IN_FORCE': this.timeInForce,				// ROD/IOC/FOK
				'ORDER_PRICE': isNaN(this.inputOrderPrice1) ? 0 : Number(this.inputOrderPrice1),
				'ORDER_QTY': parseFloat(this.inputQty),
				'AP_PLUGIN': this.useComName || this.selfComName,
			};
		},
		/** 委託單2 */
		orderInfo2() {
			// 除了市價單以外都以限價單送
			let orderType = this.orderType === 'MARKET' ? 'MARKET' : 'LIMIT';
			return this.sid2 ? {
				'ACTION': 'NEW',								// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
				'SYMBOL': this.sid2,
				'SIDE': this.orderSide2,						// 買BUY/賣SELL
				'POSITION_EFFECT': this.positionEffect,			// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
				'TC_ORDER_TYPE': orderType,						// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
				'TIME_IN_FORCE': this.timeInForce,				// ROD/IOC/FOK
				'ORDER_PRICE': isNaN(this.inputOrderPrice2) ? 0 : Number(this.inputOrderPrice2),
				'ORDER_QTY': parseFloat(this.inputQty),
				'AP_PLUGIN': this.useComName || this.selfComName,
			} : null;
		},
		/** 組合單 */
		orderInfoMulti() {
			let orderInfo = Object.assign({}, this.orderInfo1);
			orderInfo.SYMBOL2 = this.sid2;
			orderInfo.SIDE2 = orderInfo.SIDE;
			orderInfo.ORDER_PRICE = isNaN(this.inputOrderPriceMulti) ? 0 : Number(this.inputOrderPriceMulti);
			return orderInfo;
		},
		/** 当前商品是否为 ETF 期权 */
		isETF() {
			let minfo = M4C.Symbol.getMainformInfo(this.sid1);
			return minfo && (minfo.Exchange === "SSE" || minfo.Exchange === "SZSE") && minfo.Type === "O";
		},
		/** 效期別選項 */
		timeInForceOptList() {
			let list = [];
			// 組合單不支持 ROD (觀察X3來的)
			if (!this.isMulti) 
				list.push({label: `ROD`, value: "ROD"});
			// ETF期權不支持 IOC 選項
			if (!this.isETF)
				list.push({label: `IOC`, value: "IOC"});
			// FOK
			list.push({label: `FOK`, value: "FOK"});
			return list;
		},
		/** 價格別選項 */
		orderTypeOptList() {
			return [{label: `市价`, value: `MARKET`}, {label: `限价`, value: `LIMIT`}, {label: `对手价`, value: `HIT`}, {label: `本方价`, value: `JOIN`}];
		},
		isMarket() {
			return this.orderType === 'MARKET';
		},
		// 期權手數跳數
		step() {return this.$store.state.order.optQty;},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
		// 委託價1是否有效
		price1Enable() {return !this.isMulti && !this.isMarket;},
		// 委託價2是否有效
		price2Enable() {return !this.isMulti && !this.isMarket && this.selectedStrategy.BS2;},
		// 送出委託是否不可用
		isDisableSend() {
			// 委託價1有效，但價格為空，或委託價2有效，但價格為空
			return (this.price1Enable && this.inputOrderPrice1 === '') || (this.price2Enable && this.inputOrderPrice2 === '');
		},
	},
}
</script>

<style scoped>
.input-price-market {
	border: 1px solid #666;
	border-radius: 0.4em;
	box-sizing: border-box;
	height: 9vw;
}
.btn-confirm {
	width: 38vw;
	height: 10vw;
	border-radius: 2vw;
}
.w55p {
	width: 55%;
}
.w45p {
	width: 45%;
}

.desktop .input-price-market {
	height: 2.28em;
}
.desktop .radio-ctn {
	height: 2.28em !important;
}

/* for ipad 高度處理 */
.pad .radio-wrapper {
	height: 8vw;
}
.pad .btn-confirm, .pad .btn-cancel {
	height: 8vw;
	border-radius: 2vw;
}
</style>