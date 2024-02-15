<template>
    <div class="flex-column mix-thunder-settings-ctn">
		<div class="flex-col pdtb3 domestic-trade-setting" v-if="twMode">
			<div class="setting-head font-size-large pdb4">{{$ln("国内交易设定")}}</div>
			<div class="setting-body mglr5">
				<CheckBox v-model="$store.state.thunder.useRangeMarket" class="flex-3">{{$ln('市价单使用〖一定范围市价〗送出')}}</CheckBox>
			</div>
		</div>
		<TabGroup ref="tg" tab-key="Thunder-settings" :tabList="settingTabList" :suspend="suspend" disablePrevNext="true"></TabGroup>
    </div>
</template>

<script>
import allSettings from "./allSettings.vue";
export default {
	props: ["suspend", "param"],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {
		this.$emit("title", '闪电设定');
		console.log("[Thunder] init useRangeMarket", this.$store.state.thunder.useRangeMarket);
	},
	beforeDestroy() {},
	components: {},
    methods:{},
	watch: {
		"$store.state.thunder.useRangeMarket" (nv) {
			console.log("[Thunder] change useRangeMarket", this.$store.state.thunder.useRangeMarket);
		}
	},
    computed: {
        // 台灣模式
        twMode(){
            return this.$store.state.config.CONFIG.OPERATING_MODE === 'tw';
		},
		model(){return this.param.model;},
		settingTabList() {
			if(this.twMode || this.model == 'F') {
				return  [
					{label: "进场设定", comClass: allSettings, param: "enter"},
					{label: "出场设定", comClass: allSettings, param: "outer"},
					{label: "其他", comClass: allSettings, param: "other"},
				];
			}
			else return [{label: "其他", comClass: allSettings, param: "other"}];
		}
	}
}
</script>

<style lang="scss" scoped>
.domestic-trade-setting {
	padding-left: 6vw;
}
.mix-thunder-settings-ctn /deep/ .head {
	@extend .sys-bgc;
}
.mix-thunder-settings-ctn /deep/ .tab-ctn>.flex-1{
	@extend .mglr5;
	flex:none;
	// z-index: 1;
}
</style>