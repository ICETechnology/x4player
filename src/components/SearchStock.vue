<template>
    <div class="search-stock font-size-small flex-col pd5">
		<div class="font-size-mini clr-gray2 mgb1">{{$ln('证券商品')}}</div>
		<div class="flex-1 scrolling-y item-container pdtb1">
			<div class="item pd1 tcef flex-row font-size-little pdtb2 flex-start" v-for="sid in contractList">
				<div class="flex-start flex-row flex-1" @click="onContractClick(sid)">
					<span class="mglr2">{{displayExchangeName(sid)}}</span>
					<span class="flex-1">{{displayContractName(sid)}}</span>
				</div>
				<FavoriteIcon class="icon-btn fav-icon mglr3" :symbol="sid" />
			</div>
		</div>
    </div>
</template>

<script>
export default {
	props: ['param'],
	data() {
		return {
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		displayExchangeName(sid) {
			let minfo = M4C.Symbol.getMainformInfo(sid);
			try{return M4C.Symbol.getExgNameByExgId(minfo.Exchange);}catch(e){}
		},
		displayContractName(sid) {
			if (!sid) return;
			return M4C.Symbol.isHotSID(sid) ? M4C.Symbol.getCNameCIDHot(sid) : M4C.Symbol.getCNameCIDM4(sid, " ");
		},
		onContractClick(sid) {
			// 設定v-model值。
			if(typeof this.param.setSid === 'function') {
				this.param.setSid(sid);
			}
			// 沒參數或參數中沒有lock值才設定selectedSymbol
			if(!this.param || !this.param.lock){
				// 設定關注商品
				this.$store.commit("setSelectedSymbol", sid);
				// 如果是熱門月額外設定顯示
				if(sid.split('.').indexOf('HOT') >= 0) {
					this.$store.commit("setSelectedSymbolDisplayAsHot");
				}
			}
			// 關閉本畫面
			eventBus.$emit("CLOSE-DIALOG");
			// app版才彈出商品行情頁
			if((!this.param || !this.param.isStopSub) && !this.isDesktop && this.param.from!=='ContractsSwitch'){
				// 執行彈出商品行情頁。
				setTimeout(() => {
					eventBus.$emit("POPUP-DIALOG", "QuotePage");
				}, 10);
			}
		},
	},
	watch: {},
    computed: {
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		/** 分類表內容 響應式 by M4C.Symbol.getClassification */
		classification() {
			return M4C.Symbol.getClassification(this.$store.state.config.classification);
		},
		contractList() {
			let contracts = [];
			// 處理TabGroup所需要的資料
			this.classification.forEach((exgItem)=>{
				if (M4C.Symbol.getExgType(exgItem) === "S") {
					exgItem.Node.forEach((obj)=>{
						contracts = contracts.concat(obj.Contracts);
					});
				}
			});
			return contracts;
		},
		langCode() {
			return window.mainformLangKey;
		},		
	},
}
</script>

<style scoped>
.item.selected {
	background-color: #0065A4;
}
.item:hover {
	background-color: #0065A4;
}
.item-container {
	box-sizing: border-box;
	border-radius: 0.3em;
}
.icon-btn {
	width: 16px;
	height: 16px;
}
.icon-btn /deep/ i.material-icons {
	font-size: 16px !important;
}
</style>