<template>
    <div class="flex-column mix-thunder-report-ctn">
		<TabGroup ref="tg" tab-key="Thunder-Report" :tabList="tabList" :suspend="suspend"></TabGroup>
    </div>
</template>

<script>
import reportCardList from "./reportCardList.vue";
export default {
	props: ["suspend"],
	data() {
		return {
			tabList: [
					{label: "全部", comClass: reportCardList},
					{label: "有效", comClass: reportCardList, param: "available"},
				],	
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods:{},
	watch: {},
    computed: {}
}
</script>

<style lang="scss" scoped>
.mix-thunder-report-ctn /deep/ .head {
	@extend .sys-bgc;
}
.mix-thunder-report-ctn /deep/ .tab-ctn>.flex-1{
	@extend .mglr5;
	flex:none;
	z-index: 1;
}
</style>