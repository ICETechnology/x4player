<template>
    <div class="">
		<ScrollBounce ref="scrollCtn" class="FULL quote-swipe-content" v-scroll-lock="true">
			<!-- 此分類表底下所有的 symbol 對應為 QuoteCard -->
			<QuoteCard class="quote-card-ctn" v-for="sid in param.sidList" :sid="sid" :key="sid" :suspend="suspend" :tab-key="tabKey"></QuoteCard>
		</ScrollBounce>
    </div>
</template>

<script>
export default {
	props: ["param", "suspend", "tabKey"],
	data() {
		return {
        }
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {},
    computed: {},
	watch: {
		// 交易所改變時，捲回最上方
		param: function(nv, ov) {
			this.$refs.scrollCtn.$el.scrollTop = 0;
		}
	},
}
</script>

<style scoped>
.quote-swipe-content {
	/* has to be scroll, not auto */
	overflow-y: scroll;
	/* ios scrolling 优化 */
	-webkit-overflow-scrolling: touch;
}
.quote-card-ctn {
	/* margin: 0.6em; */
	height: 45px;
}
</style>