<template>
	<div class="list-block flex-col">
		<table class="w100p">
			<tr class="title-row flex-start clr-gray2">
				<th class="col-title flex-1 flex-center pdlr1">{{$ln('持仓详情')}}</th>
				<th class="col-content1 flex-1 flex-center pdlr1">{{$ln('多')}}</th>
				<th class="col-content2 flex-1 flex-center pdlr1">{{$ln('空')}}</th>
				<th class="col-content3 flex-1 flex-center pdlr1">{{$ln('净')}}</th>
			</tr>
		</table>
		<div class="flex-1 w100p posr tbody-ctn">
			<ScrollBounce class="FULL" v-stop-propagation-y>
				<table class="flex-col">
					<tr class="flex-start content-row font-size-small" v-for="(posKey, idx) in detailList" :key="idx">
						<td class="col-title flex-1 flex-center">{{$ln(posKey.label)}}</td>
						<td class="col-content1 flex-1 flex-center pdlr1 font-size-mini">{{cellText1(psd[posKey.dataKey[0]], posKey.showPL)}}</td>
						<td class="col-content1 flex-1 flex-center pdlr1 font-size-mini">{{cellText1(psd[posKey.dataKey[1]], posKey.showPL)}}</td>
						<td class="col-content1 flex-1 flex-center pdlr1 font-size-mini" :class="cellClass(psd[posKey.dataKey[2]], posKey.showPL)">
							{{cellText(psd[posKey.dataKey[2]], posKey.showPL)}}</td>
					</tr>
				</table>
			</ScrollBounce>
		</div>
	</div>
</template>

<script>
export default {
	props: ['sid', 'psd'],
	data() {
		return {
			detailList: [],
		}
	},
	beforeMount() {
		if(this.twMode) {
			// 倉位資料
			this.detailList = this.showDetailList.slice(0, 4);
			// 加入逐筆損益
			this.detailList.push(this.showDetailList[5]);
		}
		else
			this.detailList = this.showDetailList;
	},
    mounted() {},
	beforeDestroy() {},
    methods: {
		// 欄位的 class
		cellClass(value, showPL) {
			if (!value) return;
			// 指定為損益類型欄位
			if (showPL)
				return this.$clr0(value);			
			return value;
		},
		// 淨欄位的文字內容
		cellText(value, showPL) {
			if (!value) return '-';
			// 指定為損益類型欄位
			if (showPL)
				return this.$displayPL(value) || '--';
			return value;
		},
		// 多、空欄位的文字內容(因目前只有均價兩列有需要特別格式化，所以暫時都以設定中的showPL來判斷，之後有調整的話再視情形變更)
		cellText1(value, showPL) {
			if(!value) return '-';
			if(showPL)
				return this.$symbolPrice(this.sid, value, this.precision);
			return value;
		},
	},
	watch: {},
    computed: {
		precisionBeyondTickSize() {try{return this.$store.state.config.CONFIG.POSITION.precisionBeyondTickSize;}catch(e){}},
		precision(){
			return isNaN(this.precisionBeyondTickSize) || this.precisionBeyondTickSize == null ? 1 : this.precisionBeyondTickSize
		},
		$clr0() {return this.$store.state.fn.$clr0;},
		$displayPL() {return this.$store.state.fn.$displayPL;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		showDetailList() {return this.$store.state.columnSD.position.showDetailList;},
		twMode() {return this.$store.state.config.twMode;},
	},
}
</script>

<style scoped>
.title-row {
	background-color: #2A2A2A;
}
.content-row:nth-child(odd){
	background: #111820;
}
table{
	border-spacing: 0px;
}
.tbody-ctn table{
	border-bottom: 2vw solid #111820;
}
th,td {
	min-width: 25%;
	max-width: 25%;
	height: 2.2em;
	overflow: hidden;
	box-sizing: border-box;
}
.content-row td.col-title{
	border-right: 2px solid #111820;
}
</style>