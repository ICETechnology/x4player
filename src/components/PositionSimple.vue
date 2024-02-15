<template>
    <div class="flex-col">
		<div v-for="(ps, i) in positionSumList" class="w100p flex-col mgb2">
			<div class="flex-start">
				{{ps.$CONTRACT_NAME}}
			</div>
			<div class="flex-row">
				<div class="flex-1" :class="ps.$CP=='C'?'clr-up':'clr-dn'">{{ps.$QTY}}@{{ps.$BSAVG}}</div>
				<div class="flex-1 flex-end" :class="[$clr0(ps.UNREALIZED_PL)]">$ {{parseFloat(ps.UNREALIZED_PL)}}</div>
			</div>
		</div>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			positionSumList: [],
		}
	},
	beforeMount() {
		this.positionSumList = M4C.Position.getPositionSumList();
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {},
    computed: {
		$clr0() {return this.$store.state.fn.$clr0;},
	},
}
</script>

<style scoped>
.cell1 {
	width: 40%;
	max-width: 40%;
    overflow: hidden;
	white-space: nowrap;
    text-overflow: ellipsis;
}
.cell2 {
	width: 35%;
	max-width: 35%;
}
.cell3 {
	width: 25%;
	max-width: 25%;
}
</style>