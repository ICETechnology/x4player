<template>
	<!-- 組合顯示UI -->
	<div class="selected-list-ctn font-size-micro mgtb2">
		<div class="selected-card-ctn flex-col pdr2" v-for="(data, idx) in positionList" :key="idx">
			<!-- 商品名稱 -->
			<div class="symbol-name-ctn pdt2 pdlr4" v-if="symbolName(checkList[idx], idx)">{{ symbolName(checkList[idx], idx)}}</div>
			<div class="symbol-info-ctn flex-row pdtb2">
				<div class="check-ctn flex-top" @click="onUnCheck(checkList[idx])">
					<i class="material-icons clr-orange2">check_box</i>
				</div>
				<!-- 月份/CP/覆約價 -->
				<div class="contract-ctn flex-row flex-start">
					<div class="flex-1" v-html="contractInfo(checkList[idx])" />
				</div>
				<!-- 價格 -->
				<div v-if="!hosc" class="price-ctn flex-row flex-end">
					<span class="flex-1 flex-end">{{ idx==0?BSData1.Price: BSData2.Price }}</span>
					<span class="pdlr1">/</span>
					<span class="flex-1" :class="clr(data)">{{data.SETTLEMENT_PRICE}}</span>
				</div>
				<!-- 口數 -->
				<div v-if="!hosc" class="combine-position-ctn flex-col flex-1">
					<div class="flex-end flex-1 flex-wrap">
						<span class="">{{idx==0?BSData1.Qty: BSData2.Qty}}</span>
						<span class="mglr1">/</span>
						<span class="">{{idx==0?BSData1.Oqty: BSData2.Oqty}}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
export default {
	data() {
		return {}
	},
	props: ["checkList"],
	methods: {
		// 勾選事件
		onUnCheck(data) {
			this.$emit('check', data);
		},
		// 商品名稱
		symbolName(data, idx) {
			let isDiff = true;
			if(idx > 0) {
				let preSid = this.checkList[idx-1].SYMBOL.split('.').slice(0,4).join('.');
				let curSid = data.SYMBOL.split('.').slice(0, 4).join('.');
				isDiff = preSid !== curSid;
			}
			if(idx === 0 || isDiff)
				return this.$symbolname(data.SYMBOL);
		},
		// 月份/CP/覆約價
		contractInfo(data) {
			let cidm4 = M4C.Symbol.getCIDM4(data.SYMBOL);
			let text = `<span>${cidm4.split(' ').slice(1).join(' ')}</span>`;
			let cp = `<span class="opt-cp mglr1 rd1 pdlr1 font-size-micro">${this.$ln(data.SYMBOL.indexOf('.C.')!==-1?'购':'沽')}</span>`;
			let bs = `<span class="rd1 pdlr1 font-size-micro ${data.SIDE=='BUY'? 'B': 'S'}-icon">${this.bsText(data.SIDE)}</span>`;
			return `${text}${cp}${bs}`;
		},
		bsText(S) {
			if(S === 'BUY') return this.$ln('買');
			if(S === 'SELL') return this.$ln('賣');
		},
		// 依持倉結算價來判斷損益顏色
		clr(data) {
			let refPrice = M4C.Quote.getQuoteObject(data.$SYMBOL).r;
			return this.$clr0(this.$safeFloat(data.SETTLEMENT_PRICE - refPrice));
		},
	},
	computed: {
		$clr0() {return this.$store.state.fn.$clr0;},
		$symbolname() {return M4C.Symbol.getContractName},
		// 因台版單式選擇權會有多空併存，所以以建議清單的買賣方向過濾持倉，並依方向取資料。
		BSData1() {
			let data = {};
			const side = this.checkList[0].SIDE;
			const position = this.positionList[0];
			if(side === 'BUY') {
				data['Price'] = position.$BUY_PRICE;
				data['Qty'] = position.$BQTY;
				data['Oqty'] = position.$OBQTY;
			}
			if(side === 'SELL') {
				data['Price'] = position.$SELL_PRICE;
				data['Qty'] = position.$SQTY;
				data['Oqty'] = position.$OSQTY;
			}
			return data;
		},
		BSData2() {
			let data = {};
			const side = this.checkList[1].SIDE;
			const position = this.positionList[1];
			if(side === 'BUY') {
				data['Price'] = position.$BUY_PRICE;
				data['Qty'] = position.$BQTY;
				data['Oqty'] = position.$OBQTY;
			}
			if(side === 'SELL') {
				data['Price'] = position.$SELL_PRICE;
				data['Qty'] = position.$SQTY;
				data['Oqty'] = position.$OSQTY;
			}
			return data;
		},
		// 用已勾選清單過濾出持倉清單
		positionList() {
			return this.checkList.map(data => {
				return this.$store.state.data.normalPositionSumList.find(ps=> {
					return ps.SYMBOL === data.SYMBOL;
				}) || {};
			});
		},
		// 隱藏特定欄位 (未來後台支持後可拔除) https://trello.com/c/cUI1658H
		hosc() {try{return this.$store.state.config.publicPdSetting.function.hideOptionCSSomeColumn;}catch(e){}},
	},
}
</script>
<style scoped>
.selected-list-ctn .price-ctn {
	min-width: 30vw;
	max-width: 30vw;
}
</style>