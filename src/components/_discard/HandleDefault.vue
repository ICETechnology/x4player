<template>
    <div v-show="false">
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
        }
	},
	beforeMount() {
		//處理交易所選擇器預設值
		this.HandleExchangeSelect();
	},
	mounted() {
	},
	methods: {
		$genKey(key){
			return `${this.$store.state.config.projectID}_${key}_${M4C.Trader.getAccountID()}`;
		},
		HandleExchangeSelect(){
			let esText = localStorage.getItem(this.$genKey("EXCHANGE_SELECT_SEL")) || ''; //上次選擇的交易所
			let pos = localStorage.getItem(this.$genKey("EXCHANGE_SELECT_POS")) || ''; //上次選擇的區塊
			//取總表
			let clsList = M4C.Symbol.getClassification(this.$store.state.config.classification);
			//如果沒有預設的資料
			if (!esText && clsList) {
				let defaultExg = 0;
				//取第一個交易所及第一項商品做為預設值
				esText = clsList[defaultExg].ENG;
				localStorage.setItem(this.$genKey("EXCHANGE_SELECT_SEL"),esText);	//預設選擇的名稱
				localStorage.setItem(this.$genKey("EXCHANGE_SELECT_POS"),'opt');	//預設選擇的區塊
			}
		},
	},
}
</script>
