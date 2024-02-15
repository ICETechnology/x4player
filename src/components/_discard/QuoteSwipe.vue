<template>
    <div class="flex-column">
		<TabGroup ref="tg" class="quote-swipe-group-ctn" :tabList="parseClsList($store.state.clsList)"
			tab-key="TG-Q" :suspend="suspend"></TabGroup>
    </div>
</template>

<script>
import QuoteSwipeContentList from "@/components/QuoteSwipeContentList.vue";
export default {
	props: ["suspend"],
	data() {
		return { }
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {
	},
	components: {
		QuoteSwipeContentList,
	},
    methods:{
		parseClsList(vuexClsList){//list資料由vuex的響應式物件提供，並觸發method執行。
			//第一次拿到的list會是初始空陣列，所以不執行。以免重複執行createSwiper, 導致TabGroup不連動的異常情形
			//TabGroup在beforemount時會處理清單資料。所以沒資料的時候先回傳空陣列。
			let tabList = [];
			//處理TabGroup所需要的資料
			vuexClsList.forEach((cls)=>{
				tabList.push({
					comClass: QuoteSwipeContentList,
					label: this.$ln(cls.label),
					param: {'sidList': cls.param},
				});
			});
			return tabList;
		},
	},
	watch: {
	},
    computed: {
    }
}
</script>

<style>
/* 針對 TabGroup 的頁簽的特別套用調整 */
.quote-swipe-group-ctn .tab {
	width: 60px;
	max-width: 60px;
	line-height: 15px;
	white-space: inherit !important;
}
</style>