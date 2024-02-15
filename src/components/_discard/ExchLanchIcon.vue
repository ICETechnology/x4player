<template>
	<i class="material-icons tabicon" @click="lanch">folder_open</i>
</template>
<script>
export default {
	data(){
		return {
			group: [],
			//這裡雖沒用到positionSum，但在使用posSumSymbollist需先執行M4C.Position.getPositionSumList()
			positionSum: M4C.Position.getPositionSumList(),
			posSumSymbollist: M4C.Position.getPositionSumSymbolList(),
		}
	},
	mounted() {
		// let self = this;
		//收到GET-GROUP事件時轉發ES-CHNAGE
		eventBus.$on("GET-GROUP", () => {
			this.$store.commit('setClassList', this.getGroup());
		});
		//渲染完後發出ES-CHANGE事件。預設是發給QuoteList通知清單變動。
		this.$store.commit('setClassList', this.getGroup());
	},
	methods: {
		lanch(){
			eventBus.$emit("POPUP-DIALOG", "ExchangeSelect", {});
		},
		setMainHead(esSel, pos) {
			//自選群組的話只顯示自選
			if (pos == "self") esSel = "自选";

			eventBus.$emit("MAIN-HEAD-DATA", {
				label: esSel,
				comName: "ExchLanchIcon"
			});
		},
		getGroup() {
			let esText = localStorage.getItem(this.$genKey("EXCHANGE_SELECT_SEL")); //已設定的交易所
			let pos = localStorage.getItem(this.$genKey("EXCHANGE_SELECT_POS")); //已設定的區塊
		
			switch(pos){
				case 'self':
					//自選群組
					this.group = M4C.SelfGroup.getGroup();
					//庫存商品
					this.group[0].param = this.posSumSymbollist;
					this.setMainHead(esText, pos);			//設定myhead
					break;
				case 'opt':
					let langCode = this.$store.getters.getMainformLangKey;
					//過濾交易所
					let exg = M4C.Symbol.getClassification("FMM_FREXG").filter(el => {
						return el.ENG == esText;
					})[0];
					//比對不到交易所時，以第一個交易所做選擇
					exg = exg? exg: M4C.Symbol.getClassification("FMM_FREXG")[0];
					let Node = exg.Node? exg.Node : [];
					this.group = this.getClassList(Node);
					this.setMainHead(exg[langCode], pos);
					break;
				default:
					break;
			}
			return this.group;
		},
		getClassList(node = []){
			let self = this;
			//取分類表及合約清單。
			return node.filter(item => item.Contracts).map(item =>{
				let langCode = self.$store.getters.getMainformLangKey;
				//1.依語系取分類顯示名稱 2.英文語系由於名稱過長，所以取代碼顯示 3.英文語系的熱門分類沒有SYMBOL所以用英文顯示名稱
				let text = langCode != "ENG" ? item[langCode] : item.SYMBOL ? item.SYMBOL : item.ENG;
				return {
					label: text,
					param: item.Contracts.map(c => c.trim())	//server有可能傳有空白的SID所以需處理
				}
			});
		},
		// 接受從外面呼叫，專門用來開啟選單
		onLabelClick() {
			this.lanch();
		},
	},
	beforeDestroy() {
		eventBus.$off("GET-GROUP");
	},
}
</script>
<style scoped>
.tabicon{
    padding-right: 10px;
}
</style>

