<template>
    <div class="flex-col font-size-little pdlr2">
		<div class="flex-1 posr">
			<div class="FULL flex-row">
				<div class="flex-1 flex-col pd2">
					<div class="font-size-mini clr-gray2 mgtb2 pdlr3">{{$ln('交易所')}}</div>
					<div class="flex-1 scrolling-y item-container pdtb1">
						<div class="item pd1 mgtb2" v-for="obj in exgList" :class="{selected: obj.id===selectedExgID}" @click="selectedExg = obj">{{obj.name}}</div>
					</div>
				</div>
				<div class="flex-1 flex-col pd2">
					<div class="font-size-mini clr-gray2 mgtb2 pdlr3">{{$ln('品种')}}</div>
					<div class="flex-1 scrolling-y item-container pdtb1">
						<div class="item pd1 mgtb2" v-for="obj in symList" :class="{selected: symKey(obj)===selectedSymID}" @click="selectedSym = obj">{{displaySymbolName(obj)}}</div>
					</div>
				</div>
			</div>
		</div>
		<div class="flex-1 posr">
			<div class="FULL flex-col pd2">
				<div class="font-size-mini clr-gray2 mgtb2 pdlr3">{{$ln('合约')}}</div>
				<div class="flex-1 scrolling-y item-container contracts pdtb1 pdl5 pdr2">
					<div class="item pd1 tcef flex-row mgtb2" v-for="sid in contractList">
						<span class="flex-1" @click="onContractClick(sid)">{{displayContractName(sid)}}</span>
						<FavoriteIcon class="icon-btn fav-icon mglr3" :symbol="sid" />
					</div>
				</div>
			</div>
		</div>
    </div>
</template>

<script>
export default {
	props: ['param'],
	data() {
		return {
			selectedExg: null,
			selectedSym: null,
		}
	},
	beforeMount() {},
    mounted() {
		if (this.exgList && this.exgList.length > 0)
			this.selectedExg = this.exgList[0];
		if (this.$store.state.searchPlus.searchFuturesSelected) {
			let obj = this.exgList.find(obj => this.searchFuturesSelected.indexOf(obj.id) !== -1);
			if (obj) this.selectedExg = obj;
		}
	},
	beforeDestroy() {},
	components: {},
    methods: {
		symKey(obj) {
			return obj.SYMBOL || obj.ENG;
		},
		displaySymbolName(obj) {
			let symKey = this.symKey(obj);
			return `${obj[this.langCode]} ${symKey==='HOT' ? '' : symKey}`;
		},
		displayContractName(sid) {
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
	watch: {
		symList(nv) {
			if (nv && nv.length > 0)
				this.selectedSym = this.symList[0];
		},
		selectedSym(nv) {
			this.$store.state.searchPlus.searchFuturesSelected = `${this.selectedExgID}|${this.selectedSymID}`;
		},
	},
    computed: {
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		selectedExgID() {
			return this.selectedExg ? this.selectedExg.id : '';
		},
		selectedSymID() {
			if (!this.selectedSym) return '';
			return this.selectedSym.SYMBOL || this.selectedSym.ENG;
		},
		searchFuturesSelected() {
			return this.$store.state.searchPlus.searchFuturesSelected;
		},
		/** 分類表內容 響應式 by M4C.Symbol.getClassification */
		classification() {
			return M4C.Symbol.getClassification(this.$store.state.config.classification);
		},
		/** 交易所內容 響應 by classification */
		exgList() {
			let list = [];
			// 處理TabGroup所需要的資料
			this.classification.forEach((exgItem)=>{
				if (M4C.Symbol.getExgType(exgItem) === "F") {
					list.push({
						id: exgItem.ENG,
						name: exgItem[this.$store.state.lang.mainformLangKey],
						exgNode: exgItem.Node,
					});
				}
			});
			return list;
		},
		symList() {
			if (!this.selectedExg || !this.selectedExg.exgNode) return [];
			return this.selectedExg.exgNode.filter(o=>o.ENG !== 'FutIndex00');
		},
		contractList() {
			if (!this.selectedExg || !this.selectedSym) return [];
			// 判斷當前交易所是否有熱門月分類表
			let exgNode = this.selectedExg.exgNode;
			this.hasHot = exgNode.findIndex(obj=>obj.ENG==="HOT") !== -1;
			const isF2 = this.selectedExgID === 'TWF(F2)' || this.selectedExgID === "StockFutures(F2)";
			// 無熱門月情境 ex. 證券, 個股期貨 (且不包含期貨價差或股期價差)
			if (!this.hasHot && !isF2) {
				// 蒐集此交易所底下所有合約
				let contracts = [];
				exgNode.forEach(obj=>{contracts = contracts.concat(obj.Contracts)});
				return contracts;
			}
			else {
				return this.selectedSym && this.selectedSym.Contracts ? this.selectedSym.Contracts : [];
			}
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
	color: aqua;
	background-color: #0065A4;
}
.item-container {
	border: 1px solid #222;
	box-sizing: border-box;
	border-radius: 0.3em;
}
.contracts {
	border:none;
}
.icon-btn {
	width: 16px;
	height: 16px;
}
.icon-btn /deep/ i.material-icons {
	font-size: 16px !important;
}
</style>