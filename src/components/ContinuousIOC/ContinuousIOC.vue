<template>
    <div class="flex-col continuous-ioc">
        <ContinuousIOCHead></ContinuousIOCHead>
		<div class="w100p bgc-black pdtb2">
			<div class="mgl3 flex-row font-size-small">
				<div class="mgr2 flex-center pdlr4 pdtb rd6 bgc-label" :class="{'bgc-ioc-all':statusType && statusType.length==0}" @click="switchType('ALL')" >{{ $ln("全部") }}</div>
				<div class="mgr2 flex-center pdlr4 pdtb rd6 bgc-label" :class="{'bgc-ioc-work':statusType.indexOf('ACTIVE')>=0}" @click="switchType('ACTIVE')"> {{ $ln("洗價中") }}</div>
				<div class="mgr2 flex-center pdlr4 pdtb rd6 bgc-label" :class="{'bgc-ioc-pending':statusType.indexOf('PAUSE')>=0}" @click="switchType('PAUSE')">{{ $ln("暫停") }}</div>
				<div class="mgr2 flex-center pdlr4 pdtb rd6 bgc-label" :class="{'bgc-ioc-stop':statusType.indexOf('STOP')>=0}" @click="switchType('STOP')">{{ $ln("停止") }}</div>
				<div class="flex-1" ></div>
				<div> 
					<i @click="onBtnDelete" class="material-icons md-30 mglr3 tcef">delete</i>
 				</div>
			</div>
		</div>
		<div class="flex-1 posr">
			<ScrollBounce @refresh="queryContiIOC" :refresh="true" :status="stampStatus" v-stop-propagation-y class="FULL">	
				<div class="pdlr2">
					<ContinuousIOCCard v-for="(contiioc, index) in contiiocList" :class="{'bgc-ioc-lightUp':lightUpKey==contiioc.CIOC_ID}" :key="index" :contiioc="contiioc" ></ContinuousIOCCard>	
				</div>
				<Stamp v-if="contiiocList.length == 0" :stampStatus="stampStatus" />
			</ScrollBounce>
		</div>
    </div>
</template>

<script>
import ContinuousIOCHead from '@/components/ContinuousIOC/ContinuousIOCHead.vue';
import ContinuousIOCCard from '@/components/ContinuousIOC/ContinuousIOCCard.vue';

export default {
	props: ['param'],
	data() {
		return {
			lightUpKey: '',
		}
	},
	beforeMount() {},
    mounted() {
		if(this.param && this.param.CIOC_ID){
			this.lightUpKey = this.param.CIOC_ID;
			setTimeout(()=>{
				this.lightUpKey = '';
			}, 1000)
        }

		this.queryContiIOC();
		this.$store.state.continuousIOC.statusType = [];
	},
	beforeDestroy() {},
	components: { ContinuousIOCHead, ContinuousIOCCard },
    methods: {
		queryContiIOC(){
			M4C.ContinuousIOC.queryContiIOC();
		},
		onBtnDelete(){
			eventBus.$emit("CONFIRM-DIALOG", {
				title: this.$ln("移除條件"),
				content: this.$ln("系統將移除所有停止中的條件"),
				confirm: () => {
					let stopList = this.continuousIOCList.filter(obj=> obj.STATUS === "STOP");
					stopList.forEach( delObj =>{
						M4C.ContinuousIOC.deleteContiIOC(delObj);
					}); 
				}
			});
		},
		switchType(status){
			const statusIndex = this.statusType.indexOf(status);
			if(status =="ALL"){
				this.$store.state.continuousIOC.statusType = [];
			}else if(statusIndex < 0){
				this.$store.state.continuousIOC.statusType.push(status);
			}else{
				this.$store.state.continuousIOC.statusType.splice(statusIndex,1);
			}
		}
	},
	watch: {},
    computed: {
		statusType(){
			return this.$store.state.continuousIOC.statusType;
		},
		contiiocList(){
			let result = this.continuousIOCList;
			if(this.statusType.length!=0){			
				result = this.continuousIOCList.filter(obj=> this.statusType.includes(obj.STATUS));
			}
			return result || [];
		},
		continuousIOCList(){
			return this.$store.state.data.continuousIOCList;
		},
		queryContinuousIOCResult() {
			return this.$store.state.result.queryContinuousIOCResult;
		},
		stampStatus() {
			return this.queryContinuousIOCResult.$STATUS;
		},

	},
}
</script>

<style scoped>
.bgc-label{
	background: #1D2127;
}
.bgc-ioc-all{
	background-color: #12171f;
}
.bgc-ioc-work{
	background-color: #2c5632;
}
.bgc-ioc-pending{
	background-color: #283343;
}
.bgc-ioc-stop{
	background-color: #3b3b3b;
}
</style>