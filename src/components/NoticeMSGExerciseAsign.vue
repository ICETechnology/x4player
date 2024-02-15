<template>
	<!-- 行權指派提醒 -->
	<div class="flex-col" v-if="true || showTab == 'exerciseAsign'">
		<div class="flex-row font-size-small col-head" v-if="$store.state.device.isDesktop">
			<span class="flex-1"/>
			<span class="desktop-btn mg1" @click="onRefresh"><i class="material-icons">refresh</i><span>{{$ln('重查')}}</span></span>
		</div>
		<div class="flex-1 posr">
			<ScrollBounce ref="sb" class="FULL" :refresh="true" @refresh="onRefresh" :status="stampStatus">
				<div class="flex-col divider-bottom font-size-small card pd2" v-for="(ea, key) in exerciseAsignList" :key="key">
					<div class="flex-row flex-1 exercise-info">
						<div class="flex-col">
							<div class="contract w40vw clr-gray2 font-size-mini">{{$ln('合约')}}</div>
							<div class="contract w40vw flex-col" v-html="getContractName(ea.OPT_ID || ea.STK_ID)" />
						</div>
						<div class="flex-row flex-1">
							<div class="flex-col flex-1">
								<div class="OPTHOLD_TYPE clr-gray2 font-size-mini">{{$ln('期权持仓类型')}}</div>
								<div class="OPTHOLD_TYPE">{{$ln(exerciseAsignTypeMap[ea.OPTHOLD_TYPE])}}</div>
								<div class="EXEFROZEN_BALANCE flex-1 clr-gray2 font-size-mini">{{$ln('行权冻结金额')}}</div>
								<div class="EXEFROZEN_BALANCE flex-1">{{ea.EXEFROZEN_BALANCE}}</div>
							</div>
							<div class="flex-col flex-1">
								<div class="EXERCISE_PRICE clr-gray2 font-size-mini">{{$ln('行权价格')}}</div>
								<div class="EXERCISE_PRICE">{{ea.EXERCISE_PRICE}}</div>
								<div class="EXERCISE_AMOUNT flex-1 clr-gray2 font-size-mini">{{$ln('行权数量')}}</div>
								<div class="EXERCISE_AMOUNT flex-1">{{ea.EXERCISE_AMOUNT}}</div>
							</div>
						</div>
					</div>
					<div class="settle-info flex-row pdt1">
						<div class="flex-row w40vw">
							<div class="SETTLE_AMOUNT clr-gray2 pdr2 font-size-mini">{{$ln('交收数量')}}</div>
							<div class="SETTLE_AMOUNT flex-vertical-center flex-1">{{ea.SETTLE_AMOUNT}}</div>
						</div>
						<div class="flex-1 flex-row">
							<div class="SETTLE_BALANCE clr-gray2 pdr2 font-size-mini">{{$ln('交收金额')}}</div>		
							<div class="SETTLE_BALANCE flex-vertical-center flex-1">{{ea.SETTLE_BALANCE}}</div>
						</div>
					</div>
				</div>
				<Stamp v-if="exerciseAsignList.length===0" :stampStatus="stampStatus" />
			</ScrollBounce>
		</div>
	</div>
</template>
<script>
export default {
	data(){
		return {
			exerciseAsignTypeMap:["權利方", "義務方", "備兌方", "統計資料"],
			exerciseAsignQuery: [],
		}
	},
	beforeMount(){
		// this.$store.state.result.queryExecEtfOptExerciseResult = M4C.CommonQuery.queryExecEtfOptExercise();
	}, 
	methods: {
		onRefresh() {
			this.$store.state.result.queryExecEtfOptExerciseResult = M4C.CommonQuery.queryExecEtfOptExercise();
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
		exerciseAsignList(){return M4C.CommonQuery.ExecEtfOptExerciseDataList},
		/** 狀態章 */
		stampStatus() {
			return this.$store.state.result.queryExecEtfOptExerciseResult.$STATUS;
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
.settle-info{
	line-height: 1;
}
</style>