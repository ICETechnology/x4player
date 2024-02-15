<template>
	<div class="convert-market-price-item mglr5">
		<table class="w100p">
			<tr>
				<td colspan="2">{{config.exgName}}</td>
				<td class="nowrap" :class="{'clr-disable': !enablePlus}">{{config.exgId==='I.S.SSE' ? $ln('保护限价加挂跳数') : $ln('加挂跳数')}}</td>
			</tr>
			<tr>
				<td class="cell1"><SingleSelect :options="orderTypeOptions" v-model="cmp.orderType" /></td>
				<td class="cell2"><SingleSelect :options="timeInForceOptions" v-model="cmp.timeInForce" /></td>
				<td class="cell3"><InputQty class="font-size-normal" v-model="cmp.jumps" :min="0" :step="1" :disable="!enablePlus" /></td>
			</tr>
		</table>
	</div>
</template>

<script>
export default {
	props: ['config'],
	data() {
		return {
			inputJump: 0,
		}
	},
	beforeMount() {},
	mounted() {
	},
	beforeDestroy() {},
	components: {},
	methods: {
	},
	watch: {
	},
	computed: {
		orderTypeOptions() {
			let options = [];
			this.config.orderTypeList.forEach(obj=>{
				let str = this.$store.state.config.mapOrderTypeLabel[obj.orderType] || obj.orderType;
				options.push({label: str, value: obj.orderType});
			});
			return options;
		},
		timeInForceOptions() {
			let selectedOrderType = this.config.orderTypeList.find(o=>o.orderType===this.cmp.orderType);
			if (selectedOrderType && selectedOrderType.timeInForceList)
				return selectedOrderType.timeInForceList.map(tif=>{return {label: tif, value: tif}});
			else
				return [{label: 'ROD', value:'ROD'},{label: 'IOC', value:'IOC'},{label: 'FOK', value:'FOK'}];
		},
		exgId() {
			return this.config.exgId;
		},
		// 本項目的設定
		cmp() {
			let cmp = this.$store.state.convertMarketPrice;
			if (!cmp[this.exgId])
				this.$set(cmp, this.exgId, {jumps: 0});
			return cmp[this.exgId];
		},
		// 啟用 加掛跳數
		enablePlus() {
			if (this.config.exgId==='I.S.SSE' && this.cmp.orderType === '5LvlMTL')
				return true;

			let result = false;
			switch(this.cmp.orderType) {
				case '5LvlMKT':
				case 'LATEST':
				case 'HIT':
				case 'JOIN':
					result = true;
					break;
			}
			if (!result)
				this.cmp.jumps = 0;
			return result;
		}
	},
}
</script>

<style scoped>
td.cell1 {
	width: 42%;
}
td.cell2 {
	width: 23%;
}
td.cell3 {
	width: 39%;
}
</style>