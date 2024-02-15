<template>
	<div class="plot-order-head-ctn flex-col flex-start" :style="{'background-color': bgcolor}">
		<div class="flex-row w100p h50 flex-center">
			<!-- 返回按鈕 -->
			<i class="material-icons md-30 mglr3 tcef" @click="onBtnBack">keyboard_arrow_left</i>
			<span class="">{{`${symbolName} ${symbolID}`}}</span>
			<div class="flex-1" />
            <!-- <div class="mgr5">{{$store.state.opt.remainDays}}天</div> -->
			<!-- <div class="flex-row flex-center"><i class="material-icons md-30 tcef mglr3" :title="$ln('連續IOC')">list</i></div> -->
			<ContinuousIOCIcon v-if="showContinuousIOC" :param="param" ></ContinuousIOCIcon>
		</div>
	</div>
</template>

<script>
import ContinuousIOCIcon from '@/components/Framework/ContinuousIOCIcon.vue';
export default {
	props: ['param'],
	data() {
		return {
		}
	},
	components:{ContinuousIOCIcon},
	mounted() {},
	methods: {
		onBtnBack() {
			eventBus.$emit("CLOSE-DIALOG");
		},
    },
	computed: {
		sid() {
			return this.param.sid || this.param.contracts.C[0];
		},
		symbolName() {
			return M4C.Symbol.getContractName(this.sid);
		},
		symbolID() {
			let tmp = this.sid.split('.');
			return `${tmp[3]} ${tmp[4].substr(2)}`;
		},        
		/** 支持從 quotePdSetting.function.color.theme 取得背景色 */
		bgcolor() {
			try {return vue.$store.state.config.quotePdSetting.function.color.theme;}catch(e){}
		},
		// 顯示連續IOC功能
		showContinuousIOC(){
			try {return this.$store.state.config.CONFIG.ContinuousIOC.showContinuousIOC} catch (error) {};
		}
	},
}
</script>

<style lang='scss' scoped>
.plot-order-head-ctn {
	background-color: #F58923;
}
</style>