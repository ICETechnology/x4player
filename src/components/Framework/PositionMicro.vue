<template>
	<div class="position-micro-ctn flex-row font-size-small" v-if="positionData">
		<span class="flex-center label bgc-up" v-if="positionData.$BQTY > 0">
			+{{parseInt(positionData.$BQTY)}}
		</span>
		<span class="flex-center label bgc-dn" v-if="positionData.$SQTY > 0">
			-{{parseInt(positionData.$SQTY)}}
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
			return this.$store.state.data.normalPositionSumList.find(pos => pos.SYMBOL == this.sid);
		},
	},
}
</script>
<style scoped>
.label {
	color: white;
	padding: 1px 6px;
	border-radius: 10px;
}
</style>
