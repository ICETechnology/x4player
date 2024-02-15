<template>
    <div class="quote-card-sd-height">
		<QuoteCardSD ref="ctn" :sid="$store.state.selectedSymbol.ID" :isSample="true" columnKey="quote" />
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {
		this.$nextTick(()=>{
			this.updateHeight();
		});
	},
	beforeDestroy() {},
	components: {},
    methods: {
		// 取得高度讓不在畫面上的 QuoteCardSD 也能佔用固定高度讓捲動平滑
		updateHeight() {
			let element = this.$refs.ctn.$el;
			let computedStyle = getComputedStyle(element);
			let elementHeight = element.clientHeight;  // height with padding
			elementHeight -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
			console.log('quoteCardSDHeight: ', elementHeight);
			this.$store.state.status.quoteCardSDHeight = elementHeight;
		}
	},
	watch: {
		'$store.state.columnSD.quote.show'() {
			this.$nextTick(()=>{this.updateHeight();});
		},
		'$store.state.columnSD.quote.rowColCnt'() {
			this.$nextTick(()=>{this.updateHeight();});
		},
	},
    computed: {},
}
</script>

<style scoped>
.quote-card-sd-height {
	position: absolute;
	pointer-events: none;
	opacity: 0;
	/* z-index: 9;
	border: 1px solid yellow;
	box-sizing: border-box; */
}
</style>