<template>
    <div class="flex-col font-size-little pdlr2">
		<div class="flex-1 posr">
			<div class="FULL flex-col pd2">
				<div class="font-size-mini clr-gray2 mgtb2 pdlr3">{{$ln('品种')}}</div>
				<div class="flex-1 scrolling-y item-container pdtb1">
					<div class="item pd1 tcef flex-row mgtb2" v-for="obj in symList" @click="selectedSym = obj" :class="{selected: obj === selectedSym}">
						<span class="pdl5 mgr1 flex-1">{{obj.exgName}}</span>
						<span class="flex-1 flex-start">{{obj.symName}}</span>
					</div>
				</div>
			</div>
		</div>
		<div class="flex-1d5 posr">
			<div class="FULL flex-col pd2">
				<div class="font-size-mini clr-gray2 mgtb2 pdl3 flex-row ">
					<span class="contracts-label">{{`${$ln('合约')}/${$ln('履约价')}`}}</span>
					<span class="flex-1">{{$ln('看涨期权')}}</span>
					<span class="flex-1">{{$ln('看跌期权')}}</span>
				</div>
				<div class="flex-1 scrolling-y item-container pdtb1 contracts pdl3">
					<div class="" v-for="mthObj in mthList" @click="">
						<div class="pdlr1 flex-row mgtb2" v-for="obj in mthObj.contracts">
							<span class="flex-start pdtb1 contracts-label">{{mthObj.label}}</span>
							<div class="flex-1 flex-start item tcef pdtb1">
								<span class="" @click="onContractClick(obj.sid)">{{displayContract('C', obj)}}</span>
								<span class="font-bold clr-orange mgr2">{{setPRIADJ(obj.sid)}}</span>
								<span class="flex-1 flex-end">
									<FavoriteIcon class="icon-btn fav-icon mglr3 flex-item" :symbol="obj.sid" />
								</span>
							</div>
							<div class="flex-1 flex-start item tcef pdtb1">
								<span class="" @click="onContractClick(obj.sid, 'P')">{{displayContract('P', obj)}}</span>
								<span class="font-bold clr-orange mgr2">{{setPRIADJ(obj.sid)}}</span>
								<span class="flex-1 flex-end">
									<FavoriteIcon class="icon-btn fav-icon mglr3 flex-item" :symbol="obj.sid.replace('.C.', '.P.')" />
								</span>
							</div>
						</div>
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
			selectedSym: null,
		}
	},
	beforeMount() {},
    mounted() {
		if (this.$store.state.searchPlus.searchOptionSelected) {
			let obj = this.symList.find(obj => this.searchOptionSelected.indexOf(obj.exgName) !== -1 && this.searchOptionSelected.indexOf(obj.symName) !== -1);
			if (obj) this.selectedSym = obj;
		}
	},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 交易所名称 */
		getExgName(exgObj) {
			return M4C.Symbol.getExgNameByExgId(exgObj.ENG);
		},
		/** 商品名称 */
		getSymbolName(symbolObj) {
			return symbolObj[`${this.langCode}_M`] || symbolObj[this.langCode];
		},
		displayContract(cp, obj) {
			return `${cp}.${Number(obj.strike).toFixed(this.maxDecimalLength)}`;
			//return (cp==='C' ? this.$ln('看涨 Call') : this.$ln('看跌 Put')) + ' ' + Number(obj.strike).toFixed(this.maxDecimalLength);
		},
		onContractClick(sid, changeCP) {
			if (changeCP)
				sid = sid.replace('.C.', '.P.');
			// 設定v-model值。
			if(typeof this.param.setSid === 'function') {
				this.param.setSid(sid);
			}
			// 沒參數或參數中沒有lock值才設定selectedSymbol
			if(!this.param || !this.param.lock){
				// 設定關注商品
				this.$store.commit("setSelectedSymbol", sid);
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
		// 除權息標誌
		setPRIADJ(sid) {
			let minfo = M4C.Symbol.getMainformInfo(sid);
			return minfo ? (minfo.SetPRIADJ || '') : '';
		},
	},
	watch: {
		selectedSym(nv) {
			this.$store.state.searchPlus.searchOptionSelected = `${nv.exgName}|${nv.symName}`;
		}
	},
    computed: {
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		langCode() {
			return window.mainformLangKey;
		},
		exgList() {
			return M4C.Symbol.getClassification("OPT");
		},
		searchOptionSelected() {
			return this.$store.state.searchPlus.searchOptionSelected;
		},
		symList() {
			let list = [];
			this.exgList.forEach((exgObj)=>{
				let exgName = this.getExgName(exgObj);
				if (exgObj.Node) {
					exgObj.Node.forEach((symObj)=>{
						let symName = this.getSymbolName(symObj);
						list.push({
							exgName: exgName,
							symName: symName,
							symObj: symObj,
						});
					});
				}
			});
			return list;
		},
		mthList() {
			if (!this.selectedSym) return;
			let list = [];
			this.selectedSym.symObj.Node.forEach((mthObj)=>{
				if (mthObj.ENG !== "HOT") {
					list.push({
						label: mthObj.ENG,
						contracts: mthObj.Node[0].Contracts.map(sid=>{return {sid: sid, strike: M4C.Option.getStrike(sid)}}),
					});
				}
			});
			return list;
		},
		/** 取得最長的小數位數 (更正確的作法得要訂閱標的取得市況，算出標的商品的小數位數，但是因為牽涉訂閱，這邊先採用比較簡單的作法) */
		maxDecimalLength() {
			let maxLen = 0;
			this.mthList.forEach((mthObj)=>{
				mthObj.contracts.forEach((obj)=>{
					let len = Number(obj.strike).countDecimals();
					maxLen = len > maxLen ? len : maxLen;
				});
			});
			return maxLen;
		},
	},
}
</script>

<style scoped>
.item.selected {
	background-color: #0065A4;
	color: white;
}
.item:hover {
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
.contracts-label {
	width: 25vw;
}
.icon-btn {
	width: 16px;
	height: 16px;
}

.icon-btn /deep/ i.material-icons {
	font-size: 16px !important;
}
.desktop .contracts-label {
	width: 25%;
}
</style>