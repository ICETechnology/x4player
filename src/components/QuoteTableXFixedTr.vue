<template>
	<div class="quote-table-tr tcend flex-row td" @click="onTrClick" :sid="sid" :class="{'pointer-events-none': !isAvailable}" v-waypoint="{active: true, callback: onWaypoint}">
		<!-- 展開圖示 -->
		<div class="flex-center expand-btn" :class="{'opacity0 pointer-events-none': !hasExpand}" v-if="showExpand && visibility">
			<i class="material-icons" @click.stop="onBtnExpand" @touchstart.stop="" @touchend.stop="">
				{{propsExpand ? 'arrow_drop_up' : 'arrow_drop_down'}}</i>
		</div>
		<!-- 勾選圖示 -->
		<CheckBox :value="propsChecked" @input="onItemCheck" v-if="checkItem" class="mglr2"/>
		<div class="flex-1 flex-start nowrap" style="width: 40vw;" v-if="symbolName && visibility">
			<!-- 商品名稱/代碼 -->
			<SymbolCNM4 :sid="sid" :optWrap="true" :showCP="true" :nameFontSize="symbolNameFontSize" :isHot="displayAsHot"/>
		</div>
		<div class="flex-1 tcef flex-start" v-if="!sid && !comObj">
			{{expandObj[fixedIdx]}}
		</div>
		<div class="flex-1 tcef flex-start" v-if="!sid && !comObj.comClass && comObj">
			{{comObj}}
		</div>
		<component :is="comObj.comClass" v-if="comObj" >
			{{comObj.text}}
		</component>		
	</div>
</template>

<script>

export default {
	props: ["sid", "suspend", "expandObj", "fixedIdx", "expandSid", "propsExpand", "checkItem", "propsChecked", "noExpand", "sortedList"],
	data() {
		return {
			/** 當前是否展開 */
			expand: false,
			check: true,
			visibility: false,
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 滾動監聽 */
		onWaypoint({going, direction}) {
			if (going === 'in') {
				this.visibility = true;
				clearTimeout(this.offVisibilityTimeout);
			}
			else {
				if(this.visibility)	this.offVisibilityTimeout = setTimeout(()=>{this.visibility = false;}, 1000);
			}
		},
		onBtnExpand() {
			// 多於1個合約才展開
			if(this.moreContracts.length < 2) return;
			// this.expand = !this.expand;
			this.$emit("onExpand",  this.sid, this.moreContracts);
		},
		onItemCheck() {
			this.check = !this.check;
			this.$emit("onItemCheck",  this.sid);
		},
		onTrClick() {
			// 如果是物件資料，導到ComClassClick處理。
			if(this.comObj) {
				this.onComClassClick();
				return;
			}
			if(!this.sid || !this.getName) return;
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.sid);
			// 更新是否顯示為主連(熱門月)
			if (this.displayAsHot)
				this.$store.commit("setSelectedSymbolDisplayAsHot");			
			// 準備關注合約列表
			this.$store.commit("setContractsList", this.sortedList);
			// 彈出商品頁
			eventBus.$emit("POPUP-DIALOG", "QuotePage", {sid: this.sid});
		},
		/** 點擊『權』按鈕 */
		onClickOpt() {
			event.stopPropagation();
			// 轉為對應的 OptSid 後，作為切到期權後預設要顯示的商品
			this.$store.state.opt.selectedSymbol = M4C.Symbol.getOSIDbyFSID(this.sid);
			// 切換至期權版面
			this.$store.state.bottomBar.activeKey = "option";
		},
		onComClassClick() {
			if(this.comObj.cb)
				this.comObj.cb(this.expandObj);
		}
	},
	watch: {
		check(nv) {
			this.$emit("itemCheck", this.sid);
		},
	},
    computed: {
		largeSize(){return this.$store.state.config.largeSize;},
		displayAsHot() {
			return M4C.Symbol.isHotSID(M4C.Symbol.toHotSymbol(this.sid)) && this.moreContracts;
		},
		symbolName() {
			return M4C.Symbol.getContractName(this.sid);
		},
		symbolNameFontSize() {
			return this.symbolName.length >=5 ? 'font-size-mini': null;
		},
		// "澳幣"
		getName() {
			return M4C.Symbol.getContractName(this.sid);
		},
		// "6A1906"
		getSymbolMonth() {
			return this.displayAsHot ? this.$ln("主连") : M4C.Symbol.getCIDM4(this.sid);
		},
		/** 存在展開圖示 */
		hasExpand() {
			return this.moreContracts && this.moreContracts.length > 1			
		},
		/** 本商品點擊展開的更多 sid */
		moreContracts() {
			return this.expandObj ? this.expandObj.moreContracts : [];
		},
		/** 是否包含期权商品 */
		hasOpt() {
			return M4C.Symbol.getOSIDbyFSID(this.sid);
		},
		isOption() {return this.sid.indexOf('I.O') != -1;},
		// sid非商品代碼
		isNotSymbolCode() {return !this.sid || this.sid.indexOf('I.') < 0;},
		// 是否為價差期貨
		isPriceDiffFut() {
			return M4C.Symbol.isPriceDiff_FutSymbol(this.sid);
		},
		showExpand() {return !this.checkItem && !this.noExpand;},
		comObj() {
			try {
				return this.expandObj[this.fixedIdx];
			} catch(e) {}
		},
		// 有支援的商品
		isAvailable() {return this.$checkSupportedItem(this.sid) || this.isNotSymbolCode;},
		// 判斷是否支援
		$checkSupportedItem() {return this.$store.state.fn.$checkSupportedItem;},
	},
}
</script>

<style scoped>
/* 权 */
.has-opt-btn {
	width: 1.4em;
	height: 1.4em;
	border-radius: 3px;
	color: white;
	background-color: #4A90E2;
}
.trans-org-left {
	transform-origin: left;
}
.breakword {
	word-break: break-word;
    white-space: break-spaces;
}
</style>