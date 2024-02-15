<template>
    <div class="close-all-position-ctn" @click="onClick">{{$ln(`全平`)}}</div>
</template>

<script>
export default {
	data() {
		return {
			oiQueue: null,
        }
	},
	props: ["positionList"],
    methods: {
		onClick() {
			eventBus.$emit("CONFIRM-DIALOG", {
				title: `全部平仓`,
				content: `${this.$ln('确定对共')} ${this.totalPositionSumList.length} ${this.$ln('档商品全部平仓')} ?`,
				confirm: this.closeAllPosition.bind(this),
			});
		},
		closeAllPosition() {
			// 將所有要平倉的委託命令存到 oiQueue 裡 (準備分時發送)
			this.oiQueue = [];
			this.totalPositionSumList.forEach((psd)=>{
				// 由於目前複式權外層只會有COMPOSITE_LIST, 不會有OFFSETABLE_BUY_QTY、OFFSETABLE_SELL_QTY，所以以此區分。
				if(psd.OFFSETABLE_BUY_QTY > 0)
					this.oiQueue.push(this.getCloseOrderInfo(psd, 1));
				if(psd.OFFSETABLE_SELL_QTY > 0)
					this.oiQueue.push(this.getCloseOrderInfo(psd, -1));
				if(psd.COMPOSITE_LIST)
					this.oiQueue.push(this.getCloseOrderInfo(psd));
			});
			const oiQueue = [...this.oiQueue];
			console.log('發送全部平倉', oiQueue);

			if (this.oiQueue.length > 0)
				this.sendOrder();
		},
		// 開始發送委託
		sendOrder() {
			let oi = this.oiQueue.shift();
			M4C.Order.sendOrder(oi);
			if (this.oiQueue.length > 0)
				setTimeout(this.sendOrder, 250);
		},
		getTcOrderType(psd) {
			// TWF 要帶一定範圍市價
			try{return psd.SYMBOL.indexOf('.TWF.') !== -1 ? 'MWP' : 'MARKET';}catch(e){return 'MARKET';}
		},
		getCloseOrderInfo(psd, side) {
			let oi = {
				'ACTION': 'NEW',							// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
				'SYMBOL': psd.SYMBOL,						// 合約代碼
				'POSITION_EFFECT': "CLOSE",					// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
				'TC_ORDER_TYPE': this.getTcOrderType(psd),	// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
				'TIME_IN_FORCE': "IOC",						// ROD/IOC/FOK
				'ORDER_PRICE': 0,							// 委託價 (市價帶 0)
				"AP_PLUGIN": 'CloseAllPosition',
			};

			// 支持複式單平倉
			if (psd.COMPOSITE_LIST) {
				oi.SYMBOL = psd.COMPOSITE_LIST[0].SYMBOL;
				oi.SYMBOL2 = psd.COMPOSITE_LIST[1].SYMBOL;
				oi.SIDE = psd.COMPOSITE_LIST[0].SIDE === 'BUY' ? 'SELL' : 'BUY';
				oi.SIDE2 = psd.COMPOSITE_LIST[1].SIDE === 'BUY' ? 'SELL' : 'BUY';
				oi.ORDER_QTY = psd.$OFFSETABLE_QTY;
				return oi;
			}

			if (side == 1) {
				oi.SIDE = "SELL";
				oi.ORDER_QTY = Number(psd.OFFSETABLE_BUY_QTY);
				return oi;
			}
			if (side == -1) {
				oi.SIDE = "BUY";
				oi.ORDER_QTY = Number(psd.OFFSETABLE_SELL_QTY);
				return oi;
			}
			// 无可用数量的提示讯息
			this.$store.state.notify(`error`, `${M4C.Symbol.getCNM4(psd.SYMBOL)} ${this.$ln('平仓失败，无可用数量')}`);
		},
	},
	watch: {},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		/** 持倉匯總資料 */
		normalPositionSumList() {
			return this.$store.state.data.normalPositionSumList;
		},
		// 台灣複式選擇權持倉資料
		compositePositionSumList() {
			return this.$store.state.data.compositePositionSumList;
		},
		// 所有要呈現的持倉資料
		totalPositionSumList() {
			if(this.positionList) return this.positionList;
			if (this.twMode)
				return [].concat(this.normalPositionSumList).concat(this.compositePositionSumList);
			else
				return this.normalPositionSumList;
		},
	},
}
</script>

<style scoped>
</style>