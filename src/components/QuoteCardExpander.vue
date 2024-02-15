<template>
    <div class="quote-card-expander flex-col mgtb2 mgr5">
		<div class="flex-1 flex-row">
			<!-- 展開圖示 -->
			<div class="flex-center expand-btn" :class="{'mgl5': !hasExpand}">
				<i class="material-icons" v-if="hasExpand" @click.stop="onBtnExpand" @touchstart.stop="" @touchend.stop="">
					{{expand ? 'arrow_drop_up' : 'arrow_drop_down'}}</i>
			</div>
			<component class="flex-1 mgtb1" :is="quoteStyle" :sid="sid" :inFavorite="inFavorite" :suspend="suspend" columnKey="quote" :sortedList="sortedList" /> 
		</div>
		<!-- 展開區塊 (其它月份) -->
		<div class="flex-col" v-if="expand" :class="[quoteStyle]">
			<div class="mgt3 flex-row" v-for="(otherSid, i) in moreContracts">
				<i class="material-icons opacity0">arrow_drop_up</i>
				<component :is="quoteStyle" class="flex-1" :sid="otherSid" :suspend="suspend" :inside="true"
					:key="`QuoteCard-${sid}-${i}`" :sortedList="sortedList" />
			</div>
		</div>
    </div>
</template>

<script>
export default {
	props: ["sid", "expandObj", "suspend", "inside", "inFavorite", "sortedList"],
	data() {
		return {
			/** 當前是否展開 */
			expand: false,
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onBtnExpand() {
			// 多於1個合約才展開
			if(this.moreContracts.length < 2) return;
			this.expand = !this.expand;
			if (this.expand) {
				this.$emit("onExpand", this.$refs.qcCtn);
				this.$store.state.sync.quoteCardExpandID = this.sid;
			}
		},		
	},
	watch: {
		// 當前展開的商品代碼
		quoteCardExpandID(nv) {
			if (nv != this.sid) {
				this.expand = false;
			}
		},
		expand(nv) {
			eventBus.$emit("EXPAND");
		},
	},
    computed: {
		/** 本商品點擊展開的更多 sid */
		moreContracts() {
			return this.expandObj ? this.expandObj.moreContracts : [];
		},
		/** 報價卡片類別 */
		quoteStyle() {
			return this.$store.state.config.quoteStyle;
		},
		/** 存在展開圖示 */
		hasExpand() {
			return this.moreContracts && this.moreContracts.length > 1			
		},
	},
}
</script>

<style scoped>
</style>