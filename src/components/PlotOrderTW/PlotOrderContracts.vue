<!-- 策略下單盒 - 下方委託條件總成 -->
<template>
    <div class="plot-order-bscpstrike-ctn flex-col">
		<div class="overflow-y-auto">
			<table>
				<tr>
					<td class="clr-gray2 font-size-mini" colspan="4">{{$ln('合約')}}</td>
					<td class="clr-gray2 font-size-mini pdl2">{{$ln('對手價')}}</td>
				</tr>
				<tr>
					<td>
						<!-- 買賣 -->
						<div class="rbtn clr-white tcef" :class="`bgc-${selectedStrategy.BS1}`" @click="onBS1">{{BS1}}</div>
					</td>
					<td>
						<!-- 月份選擇器 -->
						<PlotOrderMonthSelector idx="1" class="w100p" :param="gv.contract1"/>
					</td>
					<td>
						<!-- C/P -->
						<div class="rbtn clr-white tcef" :class="`bgc-${selectedStrategy.CP1}`" @click="onCP1">{{selectedStrategy.CP1}}</div>
					</td>
					<td>
						<!-- 履約價選擇器 -->
						<PlotOrderStrikePriceSelector ref="sps1" idx="1" class="w100p" :from="from" :contractStrike="gv.contract1.strike" :strikePriceList="strikePriceList1" :closedPrice="closedPrice" 
							@onStrikePriceChange="p=>gv.contract1.strike=p" :strategySP="selectedStrategy.SP1" :selectedStrategy="selectedStrategy" />
					</td>
					<td class="w100p pdl2">
						<!-- 合約訂閱器，負責顯示與更新最新價(param.qop) -->
						<PlotOrderContractSuber :sid="sid1" :param="gv.contract1" :BS="selectedStrategy.BS1"/>
					</td>
				</tr>
				<tr>
					<td>
						<!-- 買賣 -->
						<div class="rbtn clr-white tcef" :class="[`bgc-${selectedStrategy.BS2}`]" @click="onBS2">{{BS2}}</div>
					</td>
					<td>
						<!-- 月份選擇器 -->
						<PlotOrderMonthSelector idx="1" class="w100p" :param="gv.contract2" />
					</td>
					<td>
						<div class="rbtn clr-white tcef" :class="[`bgc-${selectedStrategy.CP2}`]" @click="onCP2">{{selectedStrategy.CP2}}</div>
					</td>
					<td>
						<!-- 履約價選擇器 -->
						<PlotOrderStrikePriceSelector ref="sps2" idx="2" class="w100p" :from="from" :contractStrike="gv.contract2.strike" :strikePriceList="strikePriceList2" :closedPrice="closedPrice"
							@onStrikePriceChange="p=>gv.contract2.strike=p" :strategySP="selectedStrategy.SP2" :selectedStrategy="selectedStrategy" v-if="strikePriceList2 && strikePriceList2.length"/>
					</td>
					<td class="w100p pdl2">
						<!-- 合約訂閱器，負責顯示與更新最新價(param.qop) -->
						<PlotOrderContractSuber :sid="sid2" :param="gv.contract2" :BS="selectedStrategy.BS2" />
					</td>
				</tr>
			</table>
		</div>
    </div>
</template>

<script>
import PlotOrderMonthSelector from "@/components/PlotOrderTW/PlotOrderMonthSelector.vue";
import PlotOrderStrikePriceSelector from "@/components/PlotOrder/PlotOrderStrikePriceSelector.vue";
import PlotOrderContractSuber from "@/components/PlotOrderTW/PlotOrderContractSuber.vue";

export default {
	props: ["selectedStrategy", "closedPrice", "gv", "from"],
	data() {
		return {
			/** 委託量 */
			inputQty: 1,
		}
	},
	beforeMount() {
	},
    mounted() {
	},
	beforeDestroy() {},
	components: {
		PlotOrderMonthSelector,
		PlotOrderStrikePriceSelector,
		PlotOrderContractSuber,
	},
    methods: {
		onBS1() {
			if (!this.isUserDefine && !this.isStDiffTime) return;
			this.selectedStrategy.BS1 = this.selectedStrategy.BS1==='B' ? 'S' : 'B';
			if (this.isUserDefine) this.onChangeBSCP();
		},
		onBS2() {
			if (!this.isUserDefine && !this.isStDiffTime) return;
			this.selectedStrategy.BS2 = this.selectedStrategy.BS2==='B' ? 'S' : 'B';
			if (this.isUserDefine) this.onChangeBSCP();
		},
		onCP1() {
			if (!this.isUserDefine && !this.isStDiffTime) return;
			this.selectedStrategy.CP1 = this.selectedStrategy.CP1==='C' ? 'P' : 'C';
			if (this.isUserDefine) this.onChangeBSCP();
		},
		onCP2() {
			if (!this.isUserDefine && !this.isStDiffTime) return;
			this.selectedStrategy.CP2 = this.selectedStrategy.CP2==='C' ? 'P' : 'C';
			if (this.isUserDefine) this.onChangeBSCP();
		},
		onChangeBSCP() {
			// 掃描所有策略尋找當前應對應為哪個策略
			this.$store.state.opt.defaultStrategyList.forEach(obj=>{
				if (this.selectedStrategy.BS1 === obj.BS1 && this.selectedStrategy.BS2 === obj.BS2 && this.selectedStrategy.CP1 === obj.CP1 && this.selectedStrategy.CP2 === obj.CP2)
					this.selectedStrategy.key = obj.key;
			});
		},
		// 指定月份得到履約價列表
		getStrikeList(mth) {
			let contracts = this.$store.state.opt.contracts[mth].C;
			if (Array.isArray(contracts)) {
				return contracts.map((sid)=>{
					let minfo = M4C.Symbol.getMainformInfo(sid);
					let tmp = sid.split('.');
					return parseFloat(tmp.slice(6).join('.')).toFixed(this.decimalLen) + (minfo.SetPRIADJ || '');
				});
			}
			return [];
		},
	},
	watch: {
		profitLossResult(nv) {
			this.$store.state.opt.profitLossResult = nv;
		},
		// lockCP 時 -> 腳2的 [CallPut] 綁定腳1
		lockCP(nv) {
			if (nv) this.selectedStrategy.CP2 = this.selectedStrategy.CP1;
		},
		// lockSP 時 -> 腳2的 [履約價] 綁定腳1
		lockSP(nv) {
			if (nv) this.$refs.sps2.setSelectedSP(this.gv.contract1.strike);
		},
		// lockMTH 時 -> 腳2的 [月份] 綁定腳1
		lockMTH(nv) {
			if (nv) this.gv.contract2.mth = this.gv.contract1.mth;
		},
		// lockMTH 時 -> 腳2的 [買賣] 必須與腳1相反
		oppositeBS(nv) {
			if (nv) this.selectedStrategy.BS2 = this.selectedStrategy.BS1==='B' ? 'S' : 'B';
		},
		// 腳１ BuySell 改變
		'selectedStrategy.BS1'() {
			if (this.oppositeBS)
				this.selectedStrategy.BS2 = this.selectedStrategy.BS1==='B' ? 'S' : 'B';
		},
		// 腳２ BuySell 改變
		'selectedStrategy.BS2'() {
			if (this.oppositeBS)
				this.selectedStrategy.BS1 = this.selectedStrategy.BS2==='B' ? 'S' : 'B';
		},
		// 腳１ CallPut 改變
		'selectedStrategy.CP1'() {
			if (this.lockCP)
				this.selectedStrategy.CP2 = this.selectedStrategy.CP1;
		},
		// 腳２ CallPut 改變
		'selectedStrategy.CP2'() {
			if (this.lockCP)
				this.selectedStrategy.CP1 = this.selectedStrategy.CP2;
		},
		// 腳１履約價改變
		'gv.contract1.strike'(nv) {
			if (this.lockSP)
				this.$refs.sps2.setSelectedSP(this.gv.contract1.strike);
		},
		// 腳２履約價改變
		'gv.contract2.strike'(nv) {
			if (this.lockSP)
				this.$refs.sps1.setSelectedSP(this.gv.contract2.strike);
		},
		// 腳１月份改變
		'gv.contract1.mth'() {
			if (this.lockMTH)
				this.gv.contract2.mth = this.gv.contract1.mth;
		},
		// 腳２月份改變
		'gv.contract2.mth'() {
			if (this.lockMTH)
				this.gv.contract1.mth = this.gv.contract2.mth;
		},
		// 下拉策略改變
		plOrderStrategyKey() {
			if (this.isStDiffTime)
				this.selectedStrategy.BS2 = this.selectedStrategy.BS1==='B' ? 'S' : 'B';
		},
	},
    computed: {
		/** 第一檔商品 */
		BS1() {
			return this.$ln(this.selectedStrategy.BS1==="B" ? "买" : "卖");
		},
		sid1() {
			try{return this.gv.contract1.sid = `${this.contracts1.C[0].split('.').slice(0,5).join('.')}.${this.selectedStrategy.CP1}.${this.gv.contract1.strike}`;}catch(e){}
		},
		/** 第二檔商品 */
		BS2() {
			return this.$ln(this.selectedStrategy.BS2==="B" ? "买" : "卖");
		},
		sid2() {
			try{return this.gv.contract2.sid = `${this.contracts2.C[0].split('.').slice(0,5).join('.')}.${this.selectedStrategy.CP2}.${this.gv.contract2.strike}`;}catch(e){}
		},
		contracts1() {
			return this.$store.state.opt.contracts[this.gv.contract1.mth];
		},
		contracts2() {
			return this.$store.state.opt.contracts[this.gv.contract2.mth];
		},
		// CallPut必須相同
		lockCP() {
			return this.plOrderStrategy.lockCP;
		},
		// 鎖住第二隻腳的 StrikePrice
		lockSP() {
			return this.selectedStrategy.lockSP;
		},
		// 鎖住第二隻腳的 BS / Mth / CP
		lockMTH() {
			return this.selectedStrategy.lockMTH;
		},
		// 買賣必須相反
		oppositeBS() {
			return this.plOrderStrategy.oppositeBS;
		},
		// 是[自訂策略]策略
		isUserDefine() {
			return this.plOrderStrategyKey === 'UserDefine';
		},
		// 是[時間價差]策略
		isStDiffTime() {
			return this.plOrderStrategyKey === 'StDiffTime';
		},
		// 下拉選單選擇的策略
		plOrderStrategy() {
			return this.$store.state.plOrder.selectedStrategy;
		},
		// 下拉選單選擇的策略Key
		plOrderStrategyKey() {
			return this.plOrderStrategy.key;
		},
		/** 履約價最長小數位數 */
		decimalLen() {
			let contracts = this.contracts1.C;
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
		/** 履約價1 Array */
		strikePriceList1() {
			let strikeList1 = this.getStrikeList(this.gv.contract1.mth);
			return strikeList1;
		},
		/** 履約價2 Array */
		strikePriceList2() {
			let strikeList2 = this.getStrikeList(this.gv.contract2.mth);
			// 腳2履約價必須大於腳1
			if (this.plOrderStrategy.sp2MoreThenSP1) {
				return strikeList2.filter((price)=>{
					return parseFloat(price) > parseFloat(this.gv.contract1.strike);
				});
			}
			// 腳2履約價必須小於腳1
			if (this.plOrderStrategy.sp2LessThenSP1) {
				return strikeList2.filter((price)=>{
					return parseFloat(price) < parseFloat(this.gv.contract1.strike);
				});
			}
			return strikeList2;
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
			let product = [{
					Symbol: this.sid1,
					Quantity: this.inputQty,
				}, {
					Symbol: this.sid2,
					Quantity: this.inputQty,
				},
			];
			product[0][this.selectedStrategy.BS1==="B" ? "Bid" : "Ask"] = this.gv.contract1.oppositePrice;
			product[1][this.selectedStrategy.BS2==="B" ? "Bid" : "Ask"] = this.gv.contract2.oppositePrice;

			if (!StrategyProfitLossCore._getStrategyInstance(this.selectedStrategy.key))
				return;
			try {
				let param = {
					StrategyName: this.selectedStrategy.key,
					Products: product,
					// multiOrder: null,
				};
				// console.log('StrategyProfitLossCore.calc : ', JSON.stringify(param));
				// 算出 最大獲利 / 最大損失 / 損益兩平
				return StrategyProfitLossCore.calc(param);
			}catch(err){}
		},
	},
}
</script>

<style scoped>
</style>