<template>
    <div class="position-card-detail flex-col mg5 overflow-y-auto">
		<PositionCardSD :positionSumData="psdData" class="FULL"/>
		<!-- <div class="flex-1"/> -->
    </div>
</template>

<script>
import PositionCardSD from "@/components/PositionCardSD.vue";
export default {
	props: ['param'],
	data() {
		return {}
	},
	beforeMount() {
		this.$emit('title', '持仓明细资料');
	},
    mounted() {},
	beforeDestroy() {},
	components: {PositionCardSD},
    methods: {},
	watch: {},
    computed: {
		psdData() {
			return this.normalPositionSumList.find(pos=>(pos.SYMBOL==this.$store.state.selectedSymbol.ID));
		},
		/** 持倉匯總資料 */
		normalPositionSumList() {
			return this.$store.state.data.normalPositionSumList;
		},
	},
}
</script>

<style scoped>
</style>