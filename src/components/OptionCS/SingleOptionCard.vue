<template>
	<div class="option-single-card-ctn flex-item font-size-micro" >
		<!-- 單式選擇權UI -->
		<div class="flex-row flex-1" v-if="isSingle">
			<div class="check-ctn flex-top" @click="onCheck">
				<i class="material-icons" :class="{'clr-orange2': checked}">{{checked ? "check_box" : "check_box_outline_blank"}}</i>
			</div>
			<div class="contract-ctn flex-col">
				<!-- 商品名稱/代碼 -->
				<SymbolCNM4 :sid="sid" :sid2="sid2" :optWrap="true" :showCP="true" :showBS="positionBS" :nameFontSize="symbolNameFontSize" />
			</div>
			<!-- 口數 -->
			<div class="single-position-ctn">
				<div class="flex-1 flex-center flex-wrap flex-start">
					<span class="">{{qty}}</span><span v-if="!hosc" class="mglr1">/</span><span v-if="!hosc" class="">{{oqty}}</span>
				</div>
			</div>
			<!-- 價格 -->
			<div v-if="!hosc" class="price-ctn flex-col">
				<span class="flex-end flex-1">{{ displayPrice(avgPrice)}}</span>
				<span class="flex-end flex-1" :class="clr1">{{`${$ln('市')} / ${displayPrice(sett_price)}` }}</span>
			</div>
			<div class="pl-ctn flex-col flex-1">
				<!-- 損益 -->
				<div v-if="!hosc" class="flex-end flex-1" :class="plClass">{{ plText }}</div>
				<div class="flex-end flex-1 mgl2" @click="onClose">
					<span class="rbtn w10vw close-btn pdlr2 tcef">{{ $ln('平倉') }}</span>
				</div>
			</div>
		</div>
		<!-- 複式選擇權UI -->
		<div class="flex-row flex-1" v-if="isCombine">
			<div class="check-ctn flex-top" @click="onCheck">
				<i class="material-icons" :class="{'clr-orange2': checked}">{{checked ? "check_box" : "check_box_outline_blank"}}</i>
			</div>
			<div class="contract-ctn">
				<!-- 商品名稱/代碼 -->
				<SymbolCNM4 :sid="sid" :sid2="sid2" :optWrap="true" :showBS="positionBS" :nameFontSize="symbolNameFontSize" />
			</div>
			<div v-if="!hosc" class="price-ctn flex-col space-between">
				<!-- 損益 -->
				<div class="flex-end" :class="plClass">{{ plText }}</div>
				<!-- 價格 -->
				<div class="flex-end flex-row">
					<span>{{ displayPrice(avgPrice)}}</span>
					<span class="flex-1 pdl1" :class="clr1">{{`/ ${displayPrice(sett_price)}` }}</span>
				</div>
				<div class="flex-end flex-row">
					<span>{{ displayPrice(avgPrice2)}}</span>
					<span class="flex-1 pdl1" :class="clr2">{{`/ ${displayPrice(sett_price2)}` }}</span>
				</div>
			</div>
			<div class="combine-position-ctn flex-col flex-1 space-between">
				<div class="flex-end flex-1" @click="onClose">
					<span class="rbtn w10vw close-btn pdlr2 tcef">{{ $ln('平倉') }}</span>
				</div>
				<!-- 口數 -->
				<div class="flex-end flex-2 flex-wrap">
					<span class="">{{qty}}</span><span v-if="!hosc" class="mglr1">/</span><span v-if="!hosc" class="">{{oqty}}</span>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
import CompositePositionCloseBox from "@/components/CompositePositionCloseBox.vue";
export default {
	data() {
		return {}
	},
	props: ["csData", "checkList", "mode"],
	methods: {
		onCheck() {this.$emit('check', this.csData)},
		onClose() {
			// 複式選擇權 -> 彈出複式選擇權平倉盒
			if (this.csData.COMPOSITE_ID) {
				// 以選擇權拆分建議資料組出簡易持倉資訊，以便使用複式權平倉組件
				let psd = {
					$OFFSETABLE_QTY: this.csData.QTY,
					COMPOSITE_LIST: [
						{SYMBOL: this.csData.SYMBOL, SIDE: this.csData.SIDE},
						{SYMBOL: this.csData.SYMBOL2, SIDE: this.csData.SIDE2},
					]
				}
				eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: CompositePositionCloseBox, param: {psd: psd}});
				return;
			}
			// 單式選擇權
			this.$store.commit("setSelectedSymbol", this.sid);
			eventBus.$emit("ORDER", {
				// 台灣版本目前沒有對手價、排對價，因此平倉時帶限價委託別。
				orderType: this.twMode? 'LIMIT': 'HIT',
				orderQty: Math.abs(this.csData.QTY),
				positionEffect: 'CLOSE',
				disableBuy: this.twMode? false: true,
				disableSell: this.twMode? false: true,
			});
		},
		// 將undefined null 空字串的價格資料轉為 "--"
		displayPrice(price) {
			if(isNaN(price) || price === "" || price === null) return "--";
			return price;
		},
	},
	computed: {
		// 台灣操作模式
		twMode(){return this.$store.state.config.twMode;},
		$clr0() {return this.$store.state.fn.$clr0;},
		$displayPL() {return this.$store.state.fn.$displayPL;},
		// 持倉資料
		positionData() {
			let list = this.isSingle? this.$store.state.data.normalPositionSumList: this.$store.state.data.compositePositionSumList;
			// 過濾出對應的持倉資料
			return list.find(ps=> {
				if(this.isSingle)
					return ps.SYMBOL === this.csData.SYMBOL && ps.$BUYSELL.indexOf(this.csData.SIDE) != -1;
				if(this.isCombine) {
					let ps1 = ps.COMPOSITE_LIST[0];
					let ps2 = ps.COMPOSITE_LIST[1]
					return ps1.SYMBOL === this.csData.SYMBOL && ps1.SIDE === this.csData.SIDE 
					&& ps2.SYMBOL === this.csData.SYMBOL2 && ps2.SIDE === this.csData.SIDE2;
				}
			}) || {};
		},
		// 當前是否選取
		checked() {	
			return this.checkList.find(o => {
				let obj = this.csData;
				if(this.isCombine)
					return o.SYMBOL === obj.SYMBOL && o.SIDE === obj.SIDE && o.SYMBOL2 === obj.SYMBOL2 && o.SIDE2 === obj.SIDE2;
				else
					return o.SYMBOL === obj.SYMBOL && o.SIDE === obj.SIDE;
			});	
		},
		// 持倉買賣方向
		positionBS() {
			let side = this.csData.SIDE;
			if(side)
				side = side === "BUY"? 'B': 'S';
			if(this.isSingle) return side;
			let side2 = this.csData.SIDE2;
			if(side2)
				side2 = side2 === "BUY"? 'B': 'S';
			return `${side}${side2}`;
		},
		// 組合持倉清單
		COMPOSITE_LIST() {return this.positionData.COMPOSITE_LIST;},
		// 商品名稱
		symbolName() {
			return M4C.Symbol.getContractName(this.sid);
		},
		// 商品名稱字型大小
		symbolNameFontSize() {
			return this.symbolName.length <=5 ? 'font-size-small': null;
		},
		// 商品代碼1
		sid() {
			return this.csData.SYMBOL;
		},
		// 商品代碼2
		sid2() {
			return this.csData.SYMBOL2;
		},
		// 持倉數量(直接使用查詢清單內的數量，不使用持倉的資料)
		qty(){
			return this.csData.QTY;
		},
		// 可平數量
		oqty(){
			// 組合持倉以查詢回來的數量當可平數量。
			let qty = this.COMPOSITE_LIST? this.qty: this.csData.SIDE === 'BUY'? this.positionData.$OBQTY: this.positionData.$OSQTY;
			if(isNaN(qty) || qty === "" || qty === null) return "--";
			return Math.abs(qty);
		},
		// 持倉均價
		avgPrice() {
			if(!this.COMPOSITE_LIST) 
				return this.positionBS == 'B'? this.positionData.$BUY_PRICE: this.positionData.$SELL_PRICE;
			else
				return this.COMPOSITE_LIST[0].PRICE;
		},
		avgPrice2() {
			if(this.COMPOSITE_LIST)
				return this.COMPOSITE_LIST[1].PRICE;
		},
		// 最新價(由server提供)
		sett_price() {
			if(this.isSingle && this.positionData)
				return this.positionData.SETTLEMENT_PRICE
			if(this.COMPOSITE_LIST) 
				return this.COMPOSITE_LIST[0].SETTLEMENT_PRICE;
		},
		sett_price2() {
			if(this.COMPOSITE_LIST)
				return this.COMPOSITE_LIST[1].SETTLEMENT_PRICE;
		},
		/** 逐日盈虧:true / 逐笔盈亏:false */
		dailyPL() {
			return this.$store.state.position.dailyPL;
		},
		/** 逐日盈虧/逐筆盈虧 文字 (單一持倉) */
		plText() {
			return this.$displayPL(this.dailyPL ? this.positionData.UNREALIZED_DAILY_PL : this.positionData.UNREALIZED_PL);
		},
		/** 逐日盈虧/逐筆盈虧 樣式 */
		plClass() {
			return this.$clr0(this.dailyPL ? this.positionData.UNREALIZED_DAILY_PL : this.positionData.UNREALIZED_PL);
		},
		// 最新價漲跌顏色
		clr1() {
			let refPrice = M4C.Quote.getQuoteObject(this.sid).r;
			return this.$clr0(this.$safeFloat(this.sett_price - refPrice));
		},
		clr2() {
			if(this.sid2){
				let refPrice = M4C.Quote.getQuoteObject(this.sid2).r;
				return this.$clr0(this.$safeFloat(this.sett_price2 - refPrice));
			}
		},
		// 單式選擇權
		isSingle() {return this.mode === 'S';},
		// 複式選擇權
		isCombine() {return this.mode === 'C';},
		// 隱藏特定欄位 (未來後台支持後可拔除) https://trello.com/c/cUI1658H
		hosc() {try{return this.$store.state.config.publicPdSetting.function.hideOptionCSSomeColumn;}catch(e){}},
	}
}
</script>
<style scoped>
.close-btn {
	height: auto;
}
/** 這裡的css是為了symbolcnm4的cp、bs加入的。
因為透過組templat方式加入的class在v-html中，如果不是上層以上提供的class，是不渲染的。 */
.contract-ctn /deep/ .opt-cp {
	color: #A2A2A2;
	border: 1px solid #A2A2A2;
}
.contract-ctn /deep/ .B-icon {
	color: #2453AB;
	border: 1px solid #2453AB;
}
.contract-ctn /deep/ .S-icon {
	color: #945821;
	border: 1px solid #945821;
}
</style>