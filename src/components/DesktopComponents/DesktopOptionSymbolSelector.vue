<template>
	<div class="desktop-option-symbol-selector">
		<!-- 按鈕本體 -->
		<div ref="ctn" class="desktop-option-symbol-selector-btn flex-row" @click="onClick">
			<div class="flex-1 flex-col pd1 font-size-mini">
				<span class="clr-gray2 flex-start nowrap">{{selectedExchangeName}}</span>
				<span class="flex-1 flex-start font-size-normal nowrap">{{selectedSymbolName}}</span>
			</div>
			<div class="flex-col">
				<div class="flex-1 arrow-drop-down-ctn flex-center">
					<i class="material-icons">arrow_drop_down</i>
				</div>
			</div>
		</div>
		<!-- 下拉選單 -->
		<div v-if="displayList" class="list-drop-down-mask" @click="displayList = false">
			<div ref="listCtn" class="list-drop-down-ctn" :style="{top: listTop, bottom: listBtm, left: listLeft, height: listHeight}">
				<table cellspacing="0">
					<tr v-for="obj in symList" @click="onSymClick(obj)">
						<td class="pdtb1 pdl5 clr-gray2 nowrap">{{getExgName(obj.exgObj)}}</td>
						<td class="pdtb1 pdr5 font-size-small nowrap">{{getSymName(obj.symObj)}}</td>
					</tr>
				</table>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			listTop: null,
			listBtm: null,
			listLeft: null,
			listHeight: null,
			displayList: false,
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onClick() {
			this.listTop = null;
			this.listBtm = null;
			this.listHeight = null;
			var viewportOffset = this.$refs.ctn.getBoundingClientRect();
			this.viewportTop = viewportOffset.top;
			this.viewportLeft = viewportOffset.left;
			// 判斷出選單要出現在下方還是上方
			if (this.viewportTop < this.$store.state.device.height/2)
				this.listTop = this.viewportTop + this.$refs.ctn.offsetHeight + 'px';
			else
				this.listBtm = this.$store.state.device.height - this.viewportTop + 'px';
			this.listLeft = this.viewportLeft + 'px';		
			this.displayList = true;
		},
		/** 交易所名称 */
		getExgName(exgObj) {
			return M4C.Symbol.getExgNameByExgId(exgObj.ENG);
		},
		/** 商品名称 */
		getSymName(symObj) {
			return symObj[`${this.langCode}_M`] || symObj[this.langCode];
		},
		onSymClick(obj) {
			// 設定當前選擇的 symbolObj
			this.$store.state.opt.selectedSymbol = M4C.Option.getOptPureSymbol(obj.symObj);
			this.displayList = false;
		},
	},
	watch: {
		displayList(nv) {
			if (nv) {
				this.$nextTick(() => {
					// 上方突破視窗邊界 -> 降低 height 出捲軸
					if (this.$refs.listCtn.offsetTop < 0)
						this.listHeight = this.$store.state.device.height - this.viewportTop + 'px';
					// 下方突破視窗邊界 -> 降低 height 出捲軸
					if (this.$refs.listCtn.offsetTop + this.$refs.listCtn.offsetHeight > this.$store.state.device.height)
						this.listHeight = this.$store.state.device.height - parseInt(this.listTop) - 10 + 'px';
				});
			}
		}
	},
    computed: {
		langCode() {
			return this.$store.state.lang.mainformLangKey;
		},
		selectedExchangeName() {
			let minfo = this.$store.state.opt.selectedMainformInfo;
			try{return M4C.Symbol.getExgNameByExgId(minfo.Exchange);}catch(e){}
		},
		/** 當前選擇商品代碼 */
		selectedSymbol() {
			return this.$store.state.opt.selectedSymbol;
		},
		/** 當前選擇商品的名稱 */
		selectedSymbolName() {
			return M4C.Symbol.getContractName(this.selectedSymbol);
		},
		exgList() {
			return M4C.Symbol.getClassification("OPT");
		},
		symList() {
			let list = [];
			this.exgList.forEach((exgObj)=>{
				exgObj.Node.forEach((symObj)=>{
					list.push({exgObj: exgObj, symObj: symObj});
				});
			});
			return list;
		},
	},
}
</script>

<style scoped>
.desktop-option-symbol-selector {
	min-width: 11em;
}
.desktop-option-symbol-selector-btn {
	margin: 0.2em;
	background-color: #073e6e;
    border: 1px solid #334981;
	border-radius: 3px;
	box-sizing: border-box;
}
.desktop-option-symbol-selector-btn:hover {
    border: 1px solid #00FFFF;
}
.arrow-drop-down-ctn {
	margin: 0.1em;
	background-color: rgba(0,0,0,.15);
}
.list-drop-down-mask {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 9;
}
.list-drop-down-ctn {
	position: fixed;
	border: 1px solid #767676;
	background-color: #073E6E;
	overflow-y: auto;
}
.list-drop-down-ctn tr:hover {
	background-color: #1E90FF;
}
</style>