<template>
    <div class="search-plus" v-stop-propagation-y>
		<TabGroup v-if="tabList.length > 0" ref="tg" class="FULL" :selectedIdx="$store.state.searchPlus.tabIndex" :tabList="tabList"
			@onActiveTab="onActiveTab" :tabKey="`TG-Search`" />
    </div>
</template>

<script>
export default {
	props: ['param'],
	data() {
		return {
			tabList: [
				{label: '搜寻', comClass: 'Search', param: this.param},
				{label: '证券', comClass: 'SearchStock', param: this.param},
				{label: '期货', comClass: 'SearchFutures', param: this.param},
				{label: '期权', comClass: 'SearchOption', param: this.param},
				{label: '自选', comClass: 'SearchSelfSelect', param: this.param},
			]
		}
	},
	beforeMount() {
		this.$emit('title', `搜寻商品`);
		// 依TW產品PM需求，不顯示證券分類
		if(this.twMode) {
			this.tabList.splice(1,1);
		}
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onActiveTab(obj) {
			this.$store.state.searchPlus.tabIndex = obj.idx;
		}
	},
	watch: {},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
	},
}
</script>

<style scoped>
.search-plus /deep/ .head{
	background-color: #2A2A2A;
}
.search-plus /deep/ .tab {
	border-color: #2A2A2A;
}
</style>