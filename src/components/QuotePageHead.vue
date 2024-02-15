<template>
	<div class="quote-page-head-ctn flex-col flex-start posr" :style="{'background-color': bgcolor}">
		<ContractsSwitch :isPageHead="true" class="contracts-switch-ctn font-size-mini flex-center" :preSidList="curContractsList" />
		<div class="flex-row w100p h50 flex-center">
			<!-- 返回按鈕 -->
            <div class="flex-1 md-30 mglr3">
                <i class="material-icons tcef icon-back" @click="onBtnBack"></i>
            </div>
			<div class="flex-row mgr1" v-if="!param || !param.noQoNav">
				<!-- <span class="btn" :class="{selected: displayClass==='QuotePageMixRT'}"
					v-if="!disableMixRT" @click="setDisplayClass('QuotePageMixRT')">{{$ln('即')}}</span>
				<span class="btn" :class="{selected: displayClass==='QuotePageMixChart'}"
					v-if="!disableMixChart" @click="setDisplayClass('QuotePageMixChart')">K</span> -->
				<span class="btn" :class="{selected: displayClass==='QuotePageKChartOrder'}" 
					v-if="!disableKChartOrder" @click="setDisplayClass('QuotePageKChartOrder')">{{$ln('图')}}</span>
				<span class="btn" :class="{selected: displayClass==='QuotePageFastOrder'}" 
					v-if="!disableFastOrder" @click="setDisplayClass('QuotePageFastOrder')">{{$ln('快')}}</span>
				<span class="btn" :class="{selected: displayClass==='QuotePageThunder' && thunderModel=='N'}" 
					v-if="!disableThunderN" @click="setDisplayThunderClass('QuotePageThunder', 'N')">{{$ln('闪')}}</span>
				<span class="btn" :class="{selected: displayClass==='QuotePageThunder' && thunderModel=='F'}" 
					v-if="!disableThunderF && twMode" @click="setDisplayThunderClass('QuotePageThunder', 'F')">{{$ln('战')}}</span>
			</div>
			<div class="pdlr1 flex-row flex-center">
				<div class="icon-btn mglr3" @click="onDollorSingClick" v-if="param && param.noQoNav">
				<!-- <div class="icon-btn mglr3" @click="onDollorSingClick" v-if="param && param.noQoNav && !param.noDollarSing"> -->
					<i class="material-icons md-24">monetization_on</i></div>
				<div class="icon-btn mglr3" @click="onBtnRP" v-if="enableResourcePlugin">
					<i class="material-icons md-24">video_library</i></div>
			</div>
		</div>
		<!-- 持倉列 -->
		<div class="flex-center w100p h50 posr" v-if="displayHeadMargin && $store.state.status.isPortrait">
			<SymbolPositionRow class="posStyle w100p" :isHead="true" :displayOnThunderF="displayOnThunderF" />
		</div>
	</div>
</template>

<script>
import RelativeVideoListDialog from "@/components/ResourcePlugin/RelativeVideoListDialog.vue";
import ContractsSwitch from "@/components/ContractsSwitch.vue";
export default {
	props: ['param'],
	data() {
		return {
			model: '',
			reRanderKey: 0,
		}
	},
    components: {
        ContractsSwitch,
    },
	mounted() {
		// 這一段單純是為了若預設的 『圖』(MixChart) 被停用時，得要找一個來 enable
		if (this.disableMixChart && this.displayClass === 'QuotePageMixChart') {
			if (!this.disableMixRT) this.setDisplayClass('QuotePageMixRT');
			else if (!this.disableKChartOrder) this.setDisplayClass('QuotePageKChartOrder');
			else if (!this.disableFastOrder) this.setDisplayClass('QuotePageFastOrder');
			else if (!this.disableThunderN) this.setDisplayThunderClass('QuotePageThunder', 'N');
			else if (!this.disableThunderF) this.setDisplayThunderClass('QuotePageThunder', 'F');
		}
	},
	methods: {
		onDollorSingClick() {
			// 若再把交易作為下層彈窗，可能出現多份交易元件，導致切換異常 https://trello.com/c/UbWmDxWf
			// eventBus.$emit("POPUP-DIALOG", 'MixTrading', "", {$HEAD: {title: this.$ln(`交易`)}});
			// 關閉全部彈窗
			eventBus.$emit("CLOSE-ALL-DIALOG");
			// 切換至交易版面
			vuex.bottomBar.activeKey = "trading";
		},
		onBtnBack() {
			//執行back額外執行的程式
			if (this.backCB)
				this.backCB();
			eventBus.$emit("CLOSE-DIALOG");
			eventBus.$emit("LOGIN-CLOSE-DIALOG");
		},
		setDisplayThunderClass(cls, m) {
			this.$store.state.thunder.model = m;
			this.$store.state.status.quotePageDisplayClass = cls;
		},
		setDisplayClass(cls) {
			this.$store.state.status.quotePageDisplayClass = cls;
		},
		onBtnRP() {
			let name = M4C.Symbol.getContractName(this.$store.state.selectedSymbol.ID);
			eventBus.$emit("POPUP-DIALOG", RelativeVideoListDialog, {keyword: name}, {transName: 'float', noHead: true});
		},
	},
	computed: {
        // 台灣模式
        twMode(){
            return this.$store.state.config.CONFIG.OPERATING_MODE === 'tw';
        },
		thunderModel() {return this.$store.state.thunder.model}, 
		sid() {
			return this.$store.state.selectedSymbol.ID;
		},
		displayHeadMargin() {
			return this.$store.state.status.displayHeadMargin;
		},
		displayClass() {
			return this.$store.state.status.quotePageDisplayClass;
		},
		line2FontSize() {
			let str = this.$store.state.selectedSymbol.CIDM4;
			if (str.length > 18)
				return `font-size-micro`;
			else if (str.length > 14)
				return `font-size-mini`;
			return `font-size-normal`
		},
		/** 報價連線的 pdsetting */
		quotePdSetting() {
			return this.$store.state.config.quotePdSetting;
		},
		/** 支持從 quotePdSetting.function.disable 指定停用各功能 */
		disableMixRT() {
			try{return this.quotePdSetting.function.disable.MixRT;}catch(e){};
		},
		disableMixChart() {
			try{return this.quotePdSetting.function.disable.MixChart;}catch(e){};
		},
		disableKChartOrder() {
			try{return this.quotePdSetting.function.disable.KChartOrder;}catch(e){};
		},
		disableFastOrder() {
			try{return this.quotePdSetting.function.disable.FastOrder;}catch(e){};
		},
		disableThunderN() {
			try{return this.quotePdSetting.function.disable.ThunderN;}catch(e){};
		},
		disableThunderF() {
			try{return this.quotePdSetting.function.disable.ThunderF;}catch(e){};
		},
		/** 支持從 quotePdSetting.function.color.theme 取得背景色 */
		bgcolor() {
			try {return vue.$store.state.config.quotePdSetting.function.color.theme;}catch(e){};
		},
		// 是否有啟用 resource plugin
		enableResourcePlugin() {
			try {return !!vue.$store.state.config.quotePdSetting.resource.plugin;}catch(e){};
		},
		// 當前關注合約列表
		curContractsList() {
			return this.$store.state.status.curContractsList;
		},
		// 當前正顯示在戰鬥閃電
		displayOnThunderF() {
			return this.displayClass==='QuotePageThunder' && this.thunderModel=='F';
		},
	},
	watch: {
		displayClass(nv){
			eventBus.$emit("TAB-ACTIVE");
		},
	}
}
</script>

<style lang='scss' scoped>
.quote-page-head-ctn {
	background-color: #F58923;
}
.right-ctn {
	margin-right: 10px;
}
.icon-btn {
	width: 16px;
	height: 16px;
	// margin: 12px;
	@extend .flex-center;
}
.icon-btn.green {
	color: #259B24;
}
.fav-icon /deep/ .selected{
	color: white;
}
.circle-border {
	border-radius: 50%;
	border: 2px solid white;
	background-color:white;
	color:black;
	font-size: 24px;
}
.name-id-ctn {
	max-width: 190px;
	overflow: hidden;
}
.btn {
	width: 8vw;
	height: 8vw;
	color: black;
	background-color: white;
	@extend .rd2;
	@extend .flex-center;
	@extend .font-bold;
	@extend .mglr1
}
.btn.selected {
	background-color: #F5A623;
}
.posStyle /deep/ .symbol-position-row{
    border-radius: 0;
    background-color: inherit !important;
}
.posStyle /deep/ .clr-gray2{
	@extend .clr-orange3;
}
.contracts-switch-ctn {
	position: absolute;
	top: 0;
	height: 50px;
}
.icon-back.touching {
    border-radius: 16px;
    background-color: #FF9800 !important;
}

</style>