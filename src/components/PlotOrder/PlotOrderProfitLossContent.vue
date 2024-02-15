<template>
    <div class="pl-content-ctn flex-col pdlr1">
		<div v-if="!twMode" class="flex-1 flex-row">
			<div class="flex-1 flex-start">{{$ln(`权利金`)}}</div>
			<div class="flex-1 flex-end">{{$commas(premium)}}</div>
		</div>
		<div v-if="!twMode" class="flex-1 flex-row">
			<div class="flex-1 flex-start">{{$ln(`保证金`)}}</div>
			<div class="flex-1 flex-end">{{$commas(maintenanceMarginWithQty)}}</div>
		</div>
		<div class="flex-1 flex-row">
			<div class="flex-1 flex-start">{{$ln(`最大获利`)}}</div>
			<div class="flex-1 flex-end clr-up">{{maxProfit}}</div>
		</div>
		<div class="flex-1 flex-row">
			<div class="flex-1 flex-start">{{$ln(`最大损失`)}}</div>
			<div class="flex-1 flex-end clr-dn">{{maxLoss}}</div>
		</div>
		<div v-if="twMode" class="flex-1 flex-row">
			<div class="flex-1 flex-start">{{$ln(`损益两平`)}}</div>
			<div class="flex-1 flex-col clr-orange" v-html="breakeven" />
		</div>
		<div v-if="twMode" class="flex-1"/>
    </div>
</template>

<script>
export default {
	props: ["selectedStrategy", "gv"],
	data() {
		return {

		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
	watch: {
		profitLossResult(nv) {
			// console.log(nv);
		}
	},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		$commas() {return this.$store.state.fn.$commas;},
		// opt.profitLossResult = window.StrategyProfitLossCore.calc(...)
		profitLossResult() {
			return this.$store.state.opt.profitLossResult;
		},
		/** 最大獲利 */
		maxProfit() {
			if (!this.profitLossResult) return "";
			let str = "";
			let profit = this.profitLossResult._profit;
			if (Array.isArray(profit)) {
				for (var i=0 ; i<profit.length; i++) {
					if (!isFinite(profit[i]))
						return this.$ln('无限');
					else
						return (profit[i] > 0 ? "+" : "") + profit[i];
				}
			}
		},
		/** 最大損失 */
		maxLoss() {
			if (!this.profitLossResult) return "";
			let loss = this.profitLossResult._loss;
			if (Array.isArray(loss)) {
				for (var i=0 ; i<loss.length; i++) {
					if (!isFinite(loss[i]))
						return this.$ln('无限');
					else
						return (loss[i] > 0 ? "+" : "") + loss[i];
				}
			}
		},
		/** 損益兩平 */
		breakeven() {
			if (!this.profitLossResult) return "";
			let str = "";
			let breakeven = this.profitLossResult._breakeven;
			if (Array.isArray(breakeven)) { 
				for (var i=0; i<breakeven.length; i++) {
					str += `<div class="flex-1 w100p flex-end">${breakeven[i]}</div>`;
				}
			}
			return str;
		},

		sid1() {return this.$store.state.plOrder.sid1;},
		sid2() {return this.$store.state.plOrder.sid2;},
		qo1() {return this.$store.state.plOrder.qo1;},
		qo2() {return this.$store.state.plOrder.qo2;},
		qty() {return this.$store.state.plOrder.qty;},
		bs1() {return this.selectedStrategy.BS1;},
		bs2() {return this.selectedStrategy.BS2;},
		cp1() {return this.selectedStrategy.CP1;},
		cp2() {return this.selectedStrategy.CP2;},
		/** 合約總表 */
		minfo() {
			return M4C.Symbol.getMainformInfo(this.sid1);
		},
		/** 合約權重 */
		weight() {
			return this.minfo ? (this.minfo.Weight || 1): 1;
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

		/** 兩支腳的資料 */
		subList() {
			let list = [];
			if (this.sid1)
				list.push({sid: this.sid1, qo: this.qo1, cp: this.cp1});
			if (this.sid2)
				list.push({sid: this.sid2, qo: this.qo2, cp: this.cp2});
			return list;
		},
		/** 权利金 (尚未验证正确性) */
		premium() {
			let result = 0;
			if (this.gv.inputOrderPrice1)
				result += this.gv.inputOrderPrice1 * this.qty * (this.bs1==="B" ? -1 : 1) * this.weight;
			if (this.gv.inputOrderPrice2)
				result += this.gv.inputOrderPrice2 * this.qty * (this.bs2==="B" ? -1 : 1) * this.weight;
			return result.toFixed(2);
		},
		/** 保证金 */
		maintenanceMargin() {
			// 單腳買或雙腳買才回0(只要有賣出就不顯示0)。
			if (this.bs1==="B" && (!this.bs2 || this.bs2==='B')) return 0;
			if (!this.sid1 || !this.cp1) return "--";
			let result = 0;
			let exgID = this.sid1.split('.')[2];
			// 兩支腳都要計算
			this.subList.forEach((obj)=>{
				// 本合約QO
				let qo = M4C.Quote.getQuoteObject(obj.sid);
				// 標的物QO
				let uqo = this.underlyingQO;
				// 當前合約 履約價
				let dStrikePrice = M4C.Option.getStrike(obj.sid);
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
				// 其中保證金率如果上手支援，就取上手的，沒有就取總表LongMarginRate、ShortMarginRate這兩個欄位
				let dUsedMargin = dUnderlyingSettlementPrice * this.underlyingWeight * this.underlyingMarginRate;

				result += this.calc(exgID,
					obj.sid,
					obj.cp,
					dOptionSettlementPrice,	// 當前合約結算價
					dUnderlyingSettlementPrice,	// 合約標的最新价, 如果已收盘则取收盘价
					dUsedMargin,			// 標的保證金
					dStrikePrice,			// 當前合約的履約價
					dMultiplier,			// 當前選擇權合約乘數
					dOptionClosePrice,		// 當前選擇權最新价, 如果已收盘则取收盘价
					dUnderlyingClosePrice,	// 標的合約最新价, 如果已收盘则取收盘价
					dWeight					// 期权商品权重
				);
			});
			return result.toFixed(2);
		},
		// 保證金 x 口數 (公式是 1 口的錢)
		maintenanceMarginWithQty() {
			if (!isNaN(this.maintenanceMargin) && !isNaN(this.$store.state.plOrder.qty))
				return +Big(this.maintenanceMargin).times(this.$store.state.plOrder.qty);
		},
	},
    methods: {
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
	},
}
</script>

<style scoped>
.pl-content-ctn {
	margin: 1vw;
}

/** 桌機版 */
.desktop .pl-content-ctn {
	margin: 0.213em;
}
</style>