<template>
	<div class="tvc-position-ctn hidden" />
</template>

<script>
export default {
	props: ['widget'],
	data() {
		return {
            // PositionSumObject-ID map to PositionLine
			psoIDtoPositionLine: {},
		}
	},
	beforeMount() {},
	beforeDestroy() {
		eventBus.$off("NORMAL-POSITION-APPEND");
		eventBus.$off("NORMAL-POSITION-REMOVE");
		for (let key in this.psoIDtoPositionLine)
			this.psoIDtoPositionLine[key].remove();
	},
	mounted() {
		// 對當前合約所有部位建立PositionLine
		this.availablePositionList.forEach(pso => {
			this.append(pso);
		});
		// 即時新增的有效回報
		eventBus.$on("NORMAL-POSITION-APPEND", pso=>{
			console.log('[TVCPosition] NORMAL-POSITION-APPEND');
			this.append(pso);
		});
		// 即時移除的有效回報
		eventBus.$on("NORMAL-POSITION-REMOVE", pso=>{
			console.log('[TVCPosition] NORMAL-POSITION-REMOVE');
			this.remove(pso);
		});
	},
	components: {},
	methods: {
		getTcOrderType(pso) {
			// TWF 要帶一定範圍市價
			try{return pso.SYMBOL.indexOf('.TWF.') !== -1 ? 'MWP' : 'MARKET';}catch(e){return 'MARKET';}
		},
		append(pso) {
            let plText = this.$displayPL(this.dailyPL ? pso.UNREALIZED_DAILY_PL : pso.UNREALIZED_PL);
			let positionLine = this.psoIDtoPositionLine[pso.$SYMBOL] = this.widget.activeChart().createPositionLine()
					// 反手
					.onReverse(()=>{
                        eventBus.$emit("POPUP-DIALOG", "OrderConfirmOpposite", pso, {transName: 'float'});
					})
					// 點數量 -> 跳平倉盒 (同持倉匯總的平倉按鈕)
					.onModify(()=>{
						eventBus.$emit("ORDER", {
							orderPrice: pso.SETTLEMENT_PRICE,
							orderType: 'LIMIT',
							orderQty: Math.abs(pso.$NET_OFFSETABLE_QTY || pso.$NET_QTY || pso.$QTY),
							positionEffect: 'CLOSE',
							disableBuy: false,
							disableSell: false,
						});
					})
					// 點叉叉 -> 快速平倉提示 (參考全平)
					.onClose(()=>{
						let txtOrderType = pso.SYMBOL.indexOf('.TWF.') !== -1 ? '一定範圍市價' : '市價';
						eventBus.$emit("CONFIRM-DIALOG", {
							title: '確認平倉',
							content: `以 ${txtOrderType} 平倉 ${vuex.selectedSymbol.Name} ${vuex.selectedSymbol.CIDM4} ${pso.$NET_OFFSETABLE_QTY > 0 ? '多' : '空'}方 ${pso.$NET_OFFSETABLE_QTY}口 ?`,
							confirm: ()=>{
								let oi = {
									'ACTION': 'NEW',							// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
									'SYMBOL': pso.SYMBOL,						// 合約代碼
									'POSITION_EFFECT': "CLOSE",					// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
									'TIME_IN_FORCE': "IOC",						// ROD/IOC/FOK
									'ORDER_PRICE': 0,							// 委託價 (市價帶 0)
									"AP_PLUGIN": 'TVC.Position.onClose',
								};
								oi.TC_ORDER_TYPE = pso.SYMBOL.indexOf('.TWF.') !== -1 ? 'MWP' : 'MARKET';
								oi.SIDE = pso.$NET_QTY > 0 ? 'SELL' : 'BUY';
								oi.ORDER_QTY = pso.$NET_OFFSETABLE_QTY;
								M4C.Order.sendOrder(oi);
							},
						});
					})
					// .setLineLength(3)
					// .setLineStyle(0)
					.setText(`${pso.$NET_QTY > 0 ? '多' : '空'}${Math.abs(pso.$NET_QTY)} (${plText})`)
					.setQuantity(Math.abs(pso.$NET_OFFSETABLE_QTY))
					.setPrice(pso.$BSAVG);
			// 持倉數量變動
			this.$watch(()=>{return pso.$NET_OFFSETABLE_QTY}, (nv)=>{
				this.updateQty(pso);
			});
			// 成交均價變動
			this.$watch(()=>{return pso.$BSAVG}, (nv)=>{
				this.updatePrice(pso);
			});
		},
		// 移除
		remove(pso) {
			let positionLine = this.psoIDtoPositionLine[pso.$SYMBOL];
			if (positionLine)
				positionLine.remove();
			delete this.psoIDtoPositionLine[pso.$SYMBOL];
		},
		// 更新數量
		updateQty(pso) {
			try {
				this.psoIDtoPositionLine[pso.$SYMBOL].setQuantity(Math.abs(pso.$NET_OFFSETABLE_QTY));
			} catch(err) {
				console.log('[TVCPosition] updateQty error : ', err);
			}
		},
		// 更新價格
		updatePrice(pso) {
			try {
				this.psoIDtoPositionLine[pso.$SYMBOL].setPrice(pso.$BSAVG);
			} catch(err) {
				console.log('[TVCPosition] updatePrice error : ', err);
			}
		},
	},
	watch: {
	},
	computed: {
		$displayPL() {return this.$store.state.fn.$displayPL;},
		sid() {
			return vuex.selectedSymbol.ID;
		},
		availablePositionList() {
            return vuex.data.normalPositionSumList.filter(pso=>pso.$SYMBOL === this.sid);
		},
		dailyPL() {
			return this.$store.state.position.dailyPL;
		},

	},
}
</script>

<style scoped>
</style>