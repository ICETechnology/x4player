<template>
	<!-- 股票期权持仓到期合约提醒通知 -->
	<div class="flex-col font-size-small" v-if="true || showTab == 'holdPromp'">
		<div class="flex-row font-size-small col-head" v-if="$store.state.device.isDesktop">
			<span class="flex-1"/>
			<span class="desktop-btn mg1" @click="onRefresh"><i class="material-icons">refresh</i><span>{{$ln('重查')}}</span></span>
		</div>
		<div class="flex-row divider-bottom pd2 flex-center">
			<div class="contract w40vw clr-gray">{{$ln('合约')}}</div>
			<div class="Notice flex-1 clr-gray">{{$ln('提示讯息')}}</div>
		</div>
		<div class="flex-1 posr">
			<ScrollBounce ref="sb" class="FULL" :refresh="true" @refresh="onRefresh" :status="stampStatus">
				<div class="flex-row divider-bottom card pd2" v-for="(ps, key) in holdPromptList" :key="key">
					<div class="contract w40vw flex-col" v-html="getContractName(ps.SYMBOL)" />
					<div class="Notice">{{ps.NOTICE}}</div>
				</div>
				<Stamp v-if="holdPromptList.length===0" :stampStatus="stampStatus" />
			</ScrollBounce>
		</div>
	</div>
</template>
<script>
export default {
	data(){
		return {
			holdPromptQuery:[],
		}
	},
	beforeMount(){
		// this.$store.state.result.queryCoverShortageResult = M4C.CommonQuery.queryHoldPrompt();
	},
	methods: {
		onRefresh() {
			this.$store.state.result.queryCoverShortageResult = M4C.CommonQuery.queryHoldPrompt();
		},
		getContractName(monthSymbol) {
			let name = M4C.Symbol.getContractName(monthSymbol);
			let cidm4 = M4C.Symbol.getCIDM4(monthSymbol);
			if(name && cidm4){
				return `<span>${name}</span><span>${cidm4}</span>`;
			}
			else return monthSymbol;
		},
	},
	computed: {
		holdPromptList(){return M4C.CommonQuery.HoldPromptData},
		/** 狀態章 */
		stampStatus() {
			return this.$store.state.result.queryCoverShortageResult.$STATUS;
		}
	},
}
</script>
<style scoped>
.card {
	box-sizing: border-box;
}
.contract{
	box-sizing: border-box;
	word-break: break-all;
}
</style>