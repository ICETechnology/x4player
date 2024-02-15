<template>
	<!-- 备兑证券不足提醒 -->
	<div class="flex-col">
		<div class="flex-row font-size-small col-head" v-if="$store.state.device.isDesktop">
			<span class="flex-1"/>
			<span class="desktop-btn mg1" @click="onRefresh"><i class="material-icons">refresh</i><span>{{$ln('重查')}}</span></span>
		</div>
		<div class="flex-row clr-gray divider-bottom pd2">
			<div class="contract w40vw">{{$ln('合约')}}</div>
			<div class="flex-1 flex-row flex-center">
				<div class="LOCK_AMOUNT flex-1 flex-end">{{$ln('锁定数')}}</div>
				<div class="SHORT_AMOUNT flex-1 flex-end">{{$ln('缺口数')}}</div>
				<div class="PRESHORT_AMOUNT flex-1 flex-end">{{$ln('预估缺口')}}</div>
			</div>
		</div>	
		<div class="flex-1 posr">
			<ScrollBounce ref="sb" class="FULL" :refresh="true" @refresh="onRefresh" :status="stampStatus">
				<div class="flex-col divider-bottom font-size-small card pd2 pdtb2" v-for="(cs, key) in coverShortageList" :key="key">									
					<div class="flex-row">
						<div class="contract w40vw flex-col" v-html="getContractName(cs.STK_ID)" />
						<div class="flex-1 flex-row flex-center">
							<div class="LOCK_AMOUNT flex-1 flex-end">{{cs.LOCK_AMOUNT}}</div>
							<div class="SHORT_AMOUNT flex-1 flex-end">{{cs.SHORT_AMOUNT}}</div>
							<div class="PRESHORT_AMOUNT flex-1 flex-end">{{cs.PRESHORT_AMOUNT}}</div>
						</div>
					</div>
					<div class="flex-row pdt1">
						<div class="Notice clr-gray pdr2">{{$ln('提示讯息')}}</div>
						<div class="flex-1 NOTICE">{{cs.NOTICE}}</div>
					</div>
				</div>
				<Stamp v-if="coverShortageList.length===0" :stampStatus="stampStatus" />
			</ScrollBounce>
		</div>
	</div>
</template>
<script>
export default {
	data(){
		return {
			coverShortageQuery: [],
		}
	},
	beforeMount() {
		// this.$store.state.result.queryCoverShortageResult = M4C.CommonQuery.queryCoverShortage();
	},
	methods: {
		onRefresh() {
			this.$store.state.result.queryCoverShortageResult = M4C.CommonQuery.queryCoverShortage();
		},
		getContractName(monthSymbol) {
			let name = M4C.Symbol.getContractName(monthSymbol);
			let cidm4 = M4C.Symbol.getCIDM4(monthSymbol);
			if(name && cidm4){
				return`<span>${name}</span><span>${cidm4}</span>`;
			}
			else return monthSymbol;
		},
	},
	computed: {
		coverShortageList(){return M4C.CommonQuery.CoverShortageDataList},
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