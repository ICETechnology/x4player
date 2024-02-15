<template>
	<div class="flex-center mgr3 tcef rd3">
        <i @click="onClick" class="material-icons tcef" :title="$ln('連續IOC')">dns</i>
    </div>
</template>
<script>

import ContinuousIOC from '@/components/ContinuousIOC/ContinuousIOC.vue';

export default {
	props: ['param'],
	mounted() {},
	methods: {
        onClick(){
			// 由連續IOC中的下單盒開啟的情境
			if(this.param && this.param.from == "ContiIOC"){
				const findIndex = this.dialogList.findIndex((obj)=>obj.cls === ContinuousIOC);
				if(findIndex < 0)
					eventBus.$emit("POPUP-DIALOG", ContinuousIOC); 
				// dialogList 如已開啟過，關閉後面其他視窗
				else
					eventBus.$emit("CLOSE-DIALOG-AFTER", ContinuousIOC);
			}else{
				// 由策略開啟，先關閉原先的下單盒，避免再由連續IOC開啟下單盒時，dialogList存留兩個下單盒。
				eventBus.$emit("CLOSE-DIALOG");				
				setTimeout(()=>{eventBus.$emit("POPUP-DIALOG", ContinuousIOC)},50)
			}
		}
	},
	computed: {
		dialogList() {
			return this.$store.state.popup.dialogList;
		},
	}

}
</script>
<style scoped>
.btn {
	padding: 2vw 3vw;
	color: black;
	background-color: #FFF;
	border-radius: 3vw;
}
</style>
