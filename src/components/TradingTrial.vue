<template>
	<div class="trading-trial-ctn flex-col posr">
		<div class="buy-sell-trial-ctn flex-col" v-if="mode=='BSTrial'" :class="{'content pdtb2 pdlr4 mgb5 mglr1 rd1': twMode}">
			<div class="flex-row" :class="{'mgt2': !twMode}" v-if="!isStock && (!twMode || isOption)">
				<div class="clr-up flex-1">{{$ln('买进试算')}}</div>
				<div class="clr-dn mgl5 flex-1" v-if="!twMode || (twMode && marginQuery)">{{$ln('卖出试算')}}</div>
			</div>
			<div class="flex-row" v-if="!isStock && (!twMode || isOption)">
				<div class="flex-1 flex-col" :class="{'pdl2': twMode}">
					<div class="flex-row flex-wrap mgb1" v-if="isOption">
						<div class="flex-start clr-gray2">{{$ln('权利金')}}:</div>
						<div class="flex-1 flex-end">{{premium("B")}}</div>
					</div>
					<!-- 台灣版不顯示買進保證金(PM需求) -->
					<div class="flex-row flex-wrap" v-if="!twMode">
						<div class="flex-start clr-gray2">{{$ln('保证金')}}:</div>
						<div class="flex-1 flex-end" v-if="isOption">0</div>
						<div class="flex-1 flex-end" v-if="isFut">{{futMargin("B")}}</div>
					</div>
				</div>
				<div class="flex-1 flex-col mgl5" :class="{'pdl2': twMode}">
					<!-- 台灣版不顯示賣出權利金(PM需求) -->
					<div class="flex-row flex-wrap mgb1" v-if="isOption && !twMode">
						<div class="flex-start clr-gray2">{{$ln('权利金')}}:</div>
						<div class="flex-1 flex-end">{{premium("S")}}</div>
					</div>
					<div class="flex-row flex-wrap" v-if="!twMode || (twMode && marginQuery)">
						<div class="flex-start clr-gray2">{{$ln('保证金')}}:</div>
						<div class="flex-1 flex-end" v-if="isOption && !twMode">{{maintenanceMarginWithQty}}</div>
						<div class="flex-1 flex-end" v-if="isFut && !twMode">{{futMargin("S")}}</div>
						<div class="flex-1 flex-end" v-if="twMode">{{totalMarginAmount}}</div>
					</div>
				</div>
			</div>
			<div class="flex-row flex-wrap mgt2" v-if="isStock">
				<div class="flex-start clr-gray2">{{$ln('个股交易成本')}}:</div>
				<div class="mgl5 flex-end">{{stockCost()}}</div>
			</div>
			<!-- 台灣版顯示期貨保證金 -->
			<div class="flex-row flex-1 flex-center" v-if="isFut && twMode && marginQuery">
				<div class="item_label mgr2 clr-gray2">{{$ln('保证金')}}：</div>
				<div class="item_value">{{showFutTotalMarginAmount}}</div>
			</div>
		</div>
		<div class="close-open-trial-ctn flex-row" v-if="mode=='COTrial'">
			<div class="flex-1 flex-row space-around">
				<span class="clr-up">{{$ln('可买开')}} {{$buyOpenQty}}</span>
				<span class="clr-gray2">{{$ln('可卖平')}} {{$sellCloseQty}}</span>
			</div>
			<div class="flex-1 flex-row space-around">
				<span class="clr-dn" v-if="!this.isStock">{{$ln('可卖开')}} {{$sellOpenQty}}</span>
				<span class="clr-gray2" v-if="!this.isStock">{{$ln('可买平')}} {{$buyCloseQty}}</span>
			</div>
		</div>
		<span @click="onToggle" class="toggle-icon material-icons tcef" v-if="!twMode">swap_horiz</span>
	</div>
</template>
<script>
export default {
	data(){
		return {
			mode: "BSTrial",
		}
	},
	props:[],
	beforeMount() {
		// 台灣版不支援margin.rate.query命令(實際遇到的情形，且台灣版用不到。)
		if(!this.twMode)
			M4C.Margin.queryMarginRate(this.sid);
		this.queryMarginAmount();
	},
	methods: {
		onToggle() {
			if(this.mode=='BSTrial') this.mode = 'COTrial';
			else this.mode = 'BSTrial';
		},
		/** 期權权利金 (尚未验证正确性) */
		premium(bs, qty = this.inputOrderQty) {
			let result = 0;
			let price = this.twMode? this.qop: bs == 'B'? this.sp1: this.bp1; // 台灣版價格取成交價(最新價)(PM提供的公式)。
			let flag = this.twMode? 1: -1;	// 台灣版買進權利金不帶負號
			if (bs === "B") {
				let buyPrice = this.buyOrderPrice || price;
				result += buyPrice * qty * flag * this.weight;
			}
			if (bs === "S") {
				let sellPrice = this.sellOrderPrice || price;
				result += sellPrice * qty * this.weight;
			}
			// 台灣版下單盒權利金顯示至整數 https://trello.com/c/CytkluR8
			return this.twMode ? result.toFixed(0) : result.toFixed(2);
		},
		/** 期貨保证金 */
		futMargin(bs, qty = this.inputOrderQty) {
			let result = 0;
			if (bs === "B") {
				// 總表中沒有LongMarginRate顯示無法試算
				if(!this.LongMarginRate) return this.$ln('无法试算');
				let buyPrice = this.buyOrderPrice || this.sp1;
				// 建多仓: 最新市价(或限价) Weight LongMarginRate 手数
				result += buyPrice * qty * this.weight * this.LongMarginRate;
			}
			if (bs === "S") {
				// 總表中沒有ShortMarginRate顯示無法試算
				if(!this.ShortMarginRate) return this.$ln('无法试算');
				let sellPrice = this.sellOrderPrice || this.bp1;
				// 建空仓: 最新市价(或限价) Weight ShortMarginRate 手数
				result += sellPrice * qty * this.weight * this.ShortMarginRate;
			}
			return result.toFixed(2);
		},
		/** 個股交易成本 */
		stockCost(qty = this.inputOrderQty){
			let result = 0;
			let price = this.buyOrderPrice || this.sp1;
			// 最新市价(或限价) * 下单股数
			result += price * qty;
			return result.toFixed(2);
		},
		// 期權保證金計算公式
		calc(exgID, 
			sid,
			cp,
			dOptionSettlementPrice,	// 當前合約結算價
			dUnderlyingSettlementPrice,	// 合約標的最新价, 如果已收盘则取收盘价
			dUsedMargin,			// 標的保證金
			dStrikePrice,			// 當前合約的履約價
			dMultiplier,			// 當前選擇權合約乘數
			dOptionClosePrice,		// 當前選擇權最新价, 如果已收盘则取收盘价
			dUnderlyingClosePrice,	// 標的合約最新价, 如果已收盘则取收盘价
			dWeight					// 期权商品权重
		) {
			let D, M, D1, D2, max = Math.max, min = Math.min;
			switch(exgID) {
				case "DCE":		// 大连交易所(DCE)商品期权
					if (cp === "C") {
						D = max(dStrikePrice - dUnderlyingSettlementPrice, 0) * dWeight;
					}
					else if (cp === "P") {
						D = max(dUnderlyingSettlementPrice - dStrikePrice, 0) * dWeight;
					}
					D1 = dOptionSettlementPrice * dWeight + dUsedMargin - 1 / 2.0 * D;
					D2 = dOptionSettlementPrice * dWeight + 1 / 2.0 * dUsedMargin;
					return max(D1, D2);
					break;
				case "CZCE":	// 郑州交易所(CZCE)商品期权
					if (cp === "C") {
						D = max(dStrikePrice - dUnderlyingSettlementPrice, 0) * dWeight;
					}
					else if (cp === "P") {
						D = max(dUnderlyingSettlementPrice - dStrikePrice, 0) * dWeight;
					}
					D1 = dOptionSettlementPrice * dWeight + dUsedMargin - D / 2;
					D2 = dOptionSettlementPrice * dWeight + dUsedMargin / 2;
					return max(D1, D2);
					break;
				case "SHFE":	// 上海期货交易(SHFE)商品期权
					if (cp === "C") {
						D = max(dStrikePrice - dUnderlyingSettlementPrice, 0) * dWeight;
					}
					else if (cp === "P") {
						D = max(dUnderlyingSettlementPrice - dStrikePrice, 0) * dWeight;
					}
					D1 = dOptionSettlementPrice * dWeight + dUsedMargin - 0.5 * D;
					D2 = dOptionSettlementPrice * dWeight + 0.5 * dUsedMargin;
					return max(D1, D2);
					break;
				case "CFFEX":	// 中国金融期货交易所(CFFEX)指数期权
					if (cp === "C") {
						D = max((dStrikePrice - dUnderlyingClosePrice) * dMultiplier, 0);
						M = dOptionSettlementPrice * dMultiplier + max(dUnderlyingClosePrice * dMultiplier * 0.1 - D, 0.5 * dUnderlyingClosePrice * dMultiplier * 0.1);
						return M;
					}
					else if (cp === "P") {
						D= max((dUnderlyingClosePrice - dStrikePrice) * dMultiplier, 0);
						M = dOptionSettlementPrice * dMultiplier + max(dUnderlyingClosePrice * dMultiplier * 0.1 - D, 0.5 * dStrikePrice * dMultiplier * 0.1);
						return M;
					}
					break;
				case "SSE":		// 上海证券交易所(SSE)ETF期权
					if (cp === "C") {
						let D = max(dStrikePrice - dUnderlyingSettlementPrice, 0);
						let M = (dOptionSettlementPrice + max(0.12 * dUnderlyingClosePrice - D, 0.07 * dUnderlyingClosePrice)) * dWeight;
						return M;
					}
					else if (cp === "P") {
						let D = max(dUnderlyingSettlementPrice - dStrikePrice, 0);
						let M = min(dOptionSettlementPrice + max(0.12 * dUnderlyingClosePrice - D, 0.07 * dStrikePrice), dStrikePrice) * dWeight;
						return M;
					}
					break;
				case "SZSE":	// 深圳证券交易所(SZSE)ETF期权/个股期权
					// ETF期权
					if (sid.indexOf("ETF") !== -1) {
						if (cp === "C") {
							D= max(dStrikePrice - dUnderlyingClosePrice, 0);
							M = (dOptionSettlementPrice + max(0.12 * dUnderlyingClosePrice - D, 0.07 * dUnderlyingClosePrice)) * dWeight;
							return M;
						}
						else if (cp === "P") {
							D = max(dUnderlyingClosePrice - dStrikePrice, 0);
							M = (min(dOptionSettlementPrice + max(0.12 * dUnderlyingClosePrice - D, 0.07 * dStrikePrice), dStrikePrice)) * dWeight;
							return M;
						}
					}
					else {
						if (cp === "C") {
							D = max(dStrikePrice - dUnderlyingClosePrice, 0);
							M = (dOptionSettlementPrice + max(0.21 * dUnderlyingClosePrice - D, 0.1 * dUnderlyingClosePrice)) * dWeight;
							return M;
						}
						else if (cp === "P") {
							D= max(dUnderlyingClosePrice - dStrikePrice, 0);
							M = (min(dOptionSettlementPrice + max(0.19 * dUnderlyingClosePrice - D, 0.1 * dStrikePrice), dStrikePrice)) * dWeight;
							return M;
						}
					}
					break;
			}
		},
		// 查詢商品保證金
		queryMarginAmount() {
			// 有在公開設定可透過DCore命令查詢保證金
			if(this.marginQuery)
				M4C.Margin.queryMarginAmount(this.sid);
		},
	},
	 computed: {
		isStock() {return this.sid.split(".")[1] === "S"},
		isFut() {return this.sid.split(".")[1] === "F"},
		isOption() {return this.sid.split(".")[1] === "O"},
		sid() {return this.$store.state.selectedSymbol.ID;},
		qo() {return this.$store.state.selectedSymbol.QO;},
		qop() {
			return this.qo.p || this.qo.r || this.qo.pc || 0;
		},
		bp1() {return this.qo.bp1;},
		sp1() {return this.qo.sp1;},
		/** 合約總表 */
		minfo() {
			return M4C.Symbol.getMainformInfo(this.sid);
		},
		/** 合約表 */
		contractInfo() {
			let monthSymbol = M4C.Symbol.toMonthSymbol(this.sid);
			return M4C.Symbol.getContractInfo(monthSymbol);
		},
		/** 合約權重 */
		weight() {
			return this.minfo ? (this.minfo.Weight || 1): 1;
		},
		cp() {
			if(this.isOption)
				return this.sid.split(".")[5];
		},
		buyOrderPrice() {
			return this.$store.state.order.buyOrderPrice;
		},
		sellOrderPrice() {
			return this.$store.state.order.sellOrderPrice;
		},
		inputOrderQty() {
			return this.$store.state.order.inputOrderQty;
		},
		/** 標的物Sid */
		underlyingS() {
			return this.$store.state.opt.underlyingS;
		},
		/** 標的物QO */
		underlyingQO() {
			return this.$store.state.opt.underlyingSQO;
		},
		/** 標的物總表 */
		underlyingMInfo() {
			return M4C.Symbol.getMainformInfo(this.$store.state.opt.underlyingS);
		},
		/** 標的物權重 */
		underlyingWeight() {
			return this.underlyingMInfo ? (this.underlyingMInfo.Weight || 1) : 1;
		},
		/** 標的物保證金率 */
		underlyingMarginRate() {
			let result = 0.1;
			let contractInfo = M4C.Symbol.getContractInfo(this.underlyingS);
			if (contractInfo)
				result = contractInfo.LongMarginRate || contractInfo.ShortMarginRate;
			return Number(result);
		},
		/** 多倉期貨保證金率 */
		LongMarginRate() {
			try{
				if(this.isOption)
					return this.BUY_RATE || this.underlyingMarginRate;
				else
					return this.BUY_RATE || this.contractInfo.LongMarginRate;
			}
			catch(e) {
				return 0;
			}
		},
		/** 空倉期貨保證金率 */
		ShortMarginRate() {
			try{
				if(this.isOption)
					return this.SELL_RATE || this.underlyingMarginRate;
				else
					return this.SELL_RATE || this.contractInfo.ShortMarginRate;
			}
			catch(e) {
				return 0;
			}
		},
		// 當前選擇幣別
		currency() {
			return this.$store.state.status.selectedCurrency;
		},
		// 以幣別為 key 的響應式資金資料
		allMarginData() {
			return this.$store.state.data.marginData;
		},
		// 可用資金
		availableMargin() {return this.allMarginData[this.currency]['AVAILABLE_MARGIN']},
		// 關注商品部位匯總
		ssps() {return this.$store.state.selectedSymbol.positionSum},
		// 可買開數量試算
		$buyOpenQty() {
			let stockCost = this.stockCost(100);	// 個股開倉成本 (最低100股) P.S.各股最低100股計算，未來如果變動可能有問題。
			let futMargin = this.futMargin("B", 1);	// 期貨買開保證金 (最低1手)
			let optBuyPremium = Math.abs(this.premium("B", 1));	// 期權買開權利金 (最低1手) P.S.期權買開權利金有另外乘上負號，因此另外調整。
			if(this.isStock && this.availableMargin && stockCost && !isNaN(stockCost) && Number(stockCost) != 0) 
				return parseInt(this.$safeFloat(this.availableMargin / stockCost));
			if(this.isFut && this.availableMargin && futMargin && !isNaN(futMargin) && Number(futMargin) != 0) 
				return parseInt(this.$safeFloat(this.availableMargin / futMargin));
			if(this.isOption && this.availableMargin && optBuyPremium && !isNaN(optBuyPremium) && Number(optBuyPremium) != 0) 
				return parseInt(this.$safeFloat(this.availableMargin / optBuyPremium));
			return this.$ln('无法试算');
		},
		// 可賣平數量試算
		$sellCloseQty() {return this.ssps? this.ssps.$OBQTY: 0},
		// 可賣開數量試算
		$sellOpenQty() {
			let stockCost = this.stockCost(100);	// 個股開倉成本
			let futMargin = this.futMargin("S", 1);	// 期貨賣開保證金
			let optSellMargin = this.maintenanceMargin; // 期權賣開保證金
			if(this.isStock && this.availableMargin && stockCost && !isNaN(stockCost) && Number(stockCost) != 0)
				return parseInt(this.$safeFloat(this.availableMargin / stockCost));
			if(this.isFut && this.availableMargin && futMargin && !isNaN(futMargin) && Number(futMargin) != 0) 
				return parseInt(this.$safeFloat(this.availableMargin / futMargin));
			if(this.isOption && this.availableMargin && optSellMargin && !isNaN(optSellMargin) && Number(optSellMargin) != 0) 
				return parseInt(this.$safeFloat(this.availableMargin / optSellMargin));
			return this.$ln('无法试算');
		},
		// 可買平數量試算
		$buyCloseQty() {return this.ssps? this.ssps.$OSQTY: 0},
		dataResult() {return this.$store.state.result.queryMarginRateResult;},
		rateData() {return this.$store.state.data.marginRateData;},
		BUY_RATE() {return this.rateData.BUY_RATE;},
		SELL_RATE() {return this.rateData.SELL_RATE;},
		/** 保证金 */
		maintenanceMargin() {
			if (!this.sid || !this.cp) return "--";		// 沒有商品代碼、不是期權。
			let result = 0;
			let exgID = this.sid.split('.')[2];
			// 兩支腳都要計算
			// this.subList.forEach((obj)=>{
				// 本合約QO
				let qo = M4C.Quote.getQuoteObject(this.sid);
				// 標的物QO
				let uqo = this.underlyingQO || M4C.Quote.getQuoteObject(this.sid);
				// 當前合約 履約價
				let dStrikePrice = M4C.Option.getStrike(this.sid);
				// 標的商品 結算價 > 最新價 > 參考價
				let dUnderlyingSettlementPrice = uqo.st || uqo.p || uqo.r;
				// 當前合約 結算價 > 參考價
				let dOptionSettlementPrice = qo.st || qo.r;
				// 當前合約 收盤價 > 結算價 > 最新價 > 參考價 > 前收盤價
				let dOptionClosePrice = qo.c || qo.st || qo.p || qo.r || qo.pc;
				// 標的商品 收盤價 > 結算價 > 最新價 > 參考價 > 前收盤價
				let dUnderlyingClosePrice = uqo.c || uqo.st || uqo.p || uqo.r || uqo.pc;
				// 當前選擇權合約乘數 (?)
				let dMultiplier = 1;
				// 期权商品权重
				let dWeight = this.weight;
				// === dUsedMargin算法 ===
				// dUsedMargin = dUnderlyingSettlementPrice * lWeight(點值) * dLongMargin(保證金率);
				// 其中保證金率如果上手支援，就取上手的，沒有就取總表ShortMarginRate這兩個欄位(取賣方保證金比率，期權只有賣方需要算保證金)
				let dUsedMargin = dUnderlyingSettlementPrice * this.underlyingWeight * this.ShortMarginRate;

				result += this.calc(exgID,
					this.sid,
					this.cp,
					dOptionSettlementPrice,	// 當前合約結算價
					dUnderlyingSettlementPrice,	// 合約標的最新价, 如果已收盘则取收盘价
					dUsedMargin,			// 標的保證金
					Number(dStrikePrice),			// 當前合約的履約價
					dMultiplier,			// 當前選擇權合約乘數
					dOptionClosePrice,		// 當前選擇權最新价, 如果已收盘则取收盘价
					dUnderlyingClosePrice,	// 標的合約最新价, 如果已收盘则取收盘价
					Number(dWeight)					// 期权商品权重
				);
			// });
			return result? result.toFixed(2): this.$ln('无法试算');
		},		
		// 保證金 x 口數 (公式是 1 口的錢)
		maintenanceMarginWithQty() {
			if (!isNaN(this.maintenanceMargin) && !isNaN(this.$store.state.plOrder.qty))
				return +Big(this.maintenanceMargin).times(this.$store.state.order.inputOrderQty);
			else return this.maintenanceMargin
		},
		twMode() {
			return this.$store.state.config.twMode;
		},
		/** 台灣期交所 TWF */
		isTWF() {
			return this.minfo.Exchange === "TWF";
		},
		// 台灣版保證金試算查詢結果
		marginAmountResult() {return this.$store.state.result.queryMarginAmountResult;},
		// 保證金試算資料
		marginAmountData() {try {return this.marginAmountResult.data.d}catch(e){return {}}},
		// 商品保證金
		itemAmount() {return this.marginAmountData.AMOUNT;},
		orderQty() {return this.$store.state.order.inputOrderQty;},
		// 商品總保證金(加計口數)
		totalMarginAmount() {
			if(isNaN(this.itemAmount) || this.itemAmount === "" || this.itemAmount == null)
				return "--";
			// 有在當沖保證金淢半清單中。
			let mult = this.isDayTradeMarginDisCount? 0.5: 1;
			// 有在當沖保證金原價清單中。
			mult = this.isDayTradeMargiOrigin? 1: mult;
			return this.$safeFloat(this.itemAmount * this.orderQty * mult) || 0;
		},
		showFutTotalMarginAmount() {
			if(this.totalMarginAmount !== "--")
				return `$${this.$commas(this.totalMarginAmount)}`;
		},
		$commas() {return this.$store.state.fn.$commas;},
		// 是否可查詢商品保證金
		marginQuery() {
			try{return this.$store.state.config.publicPdSetting.function.marginQuery;}catch(e){}
		},
		// 是否在當沖保證金折扣清單(當沖情境下才處理)
		isDayTradeMarginDisCount() {
			if(this.$store.state.order.dayTrade) {
				try {
					// 台灣版的外期一律打折(除非特別設定原價清單)。
					if(this.twMode && !this.isTWF) return true;
					return !!this.$store.state.config.CONFIG.DayTradeMarginDisCountList.find(li => this.sid.indexOf(li) !== -1);
				} catch(e) {}
			}
		},
		// 是否在當沖保證金原價清單(當沖情境下才處理)
		isDayTradeMargiOrigin() {
			if(this.$store.state.order.dayTrade) {
				try {
					return !!this.$store.state.config.CONFIG.DayTradeMarginOriginList.find(li => this.sid.indexOf(li) !== -1);
				} catch(e) {}
			}
		}
	 },
	 watch: {
		sid(nv ,ov) {
			// 切換商品時重查保證金
			this.queryMarginAmount();
		}
	 }
}
</script>
<style scoped>
.toggle-icon {
	position: absolute;
	top: -1em;
	left: 0;
}
.content {
	border: 1px solid #191B1D;
}
</style>