<template>
	<div class="position-ctn flex-row" v-if="positionData">
		<span class="label clr-gray">{{$ln('部位')}}</span>
		<span class="value flex-center" :class="positionData.$BQTY > 0 ? 'clr-up': 'clr-dn'">
			{{parseInt(positionData.$BQTY) || parseInt(positionData.$SQTY)}}@{{parseFloat(positionData.BUY_PRICE_DAILY) || parseFloat(positionData.SELL_PRICE_DAILY)}}
		</span>
		<span class="flex-center border">|</span>
		<span class="label clr-gray">{{$ln('盈亏')}}</span>
		<span class="value flex-center" :class="parseFloat(positionData.UNREALIZED_PL) > 0 ? 'clr-up': 'clr-dn'">
			${{parseFloat(positionData.UNREALIZED_PL)}}
		</span>
	</div>
</template>
<script>
export default {
	props:["sid"],
	data(){
		return{
		}
	},
	computed: {
		positionData: function(){
			return this.$store.state.data.normalPositionSumList.filter(pos => pos.SYMBOL == this.sid)[0];
		},
	},	
}
</script>
<style scoped>
.position-ctn {
	white-space: nowrap;
	padding: 2px 4px;
	border: 1px solid gray;
}
.border {
	margin: 0 6px;
	color: gray;
}
.label {
	margin: 0 4px 0 0;
}
</style>
