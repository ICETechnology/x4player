<template>
	<div class="tvckbar-head-ctn flex-col flex-start" :style="{'background-color': bgcolor}">
		<div class="flex-row w100p h50 flex-center">
			<!-- 返回按鈕 -->
			<span class="tcef mgl2 icon-back" v-if="backType" @click="onBtnBack" :class="{touching: touching}"></span>
			<ContractsSwitch :isPageHead="true" class="flex-1 font-size-mini mgtb2 flex-center" :preSidList="curContractsList" />
			<!-- 對稱用的 -->
			<span class="mgr2 icon-back opacity0"></span>
			<div class="dollar-btn mglr3" @click="onDollorSingClick" v-if="true">
				<i class="material-icons md-24">monetization_on</i></div>
		</div>
		<div class="flex-center w100p h50 posr" v-if="$store.state.status.displayHeadMargin && $store.state.status.isPortrait">
			<SymbolPositionRow class="posStyle w100p" :isHead="true" />
		</div>

		<!-- 輔助點擊容器 -->
		<div class="help-tap-ctn" @click="onHelpTapCtnClick" @touchstart="touching=true" @touchend="touching=false"></div>
	</div>
</template>

<script>
import ContractsSwitch from "@/components/ContractsSwitch.vue";
export default {
	props: ["showText", "backType", 'accBtn', 'backCB', 'margin', "noSearch"],
	data() {
		return {
			touching: false,
		}
	},
    components: {
        ContractsSwitch,
    },
	methods: {
		/** 搜尋圖示按鈕 */
		onBtnSearch() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit('POPUP-DIALOG', 'Search', '', {transName: 'float'});
		},
		onBtnBack() {
			//執行back額外執行的程式
			if (this.backCB)
				this.backCB();
			eventBus.$emit("CLOSE-DIALOG");
			eventBus.$emit("LOGIN-CLOSE-DIALOG");
		},
		// 輔助點擊容器，點在此透明區域也可觸發 返回按鈕
		onHelpTapCtnClick() {
			this.onBtnBack();
		},
		onDollorSingClick() {
			// 若再把交易作為下層彈窗，可能出現多份交易元件，導致切換異常 https://trello.com/c/UbWmDxWf
			// eventBus.$emit("POPUP-DIALOG", 'MixTrading', "", {$HEAD: {title: this.$ln(`交易`)}});
			// 關閉全部彈窗
			eventBus.$emit("CLOSE-ALL-DIALOG");
			// 切換至交易版面
			vuex.bottomBar.activeKey = "trading";
		},
	},
	computed: {
		/** 支持從 quotePdSetting.function.color.theme 取得背景色 */
		bgcolor() {
			try {return this.$store.state.config.quotePdSetting.function.color.theme;}catch(e){}
		},		
		displayHeadMargin() {
			return this.margin != null ? this.margin : this.$store.state.status.displayHeadMargin;
		},
		// 當前關注合約列表
		curContractsList() {
			return this.$store.state.status.curContractsList;
		},
	}
}
</script>

<style lang='scss' scoped>
.tvckbar-head-ctn {
	background-color: #F58923;
}
.right-ctn {
	margin-right: 10px;
}
.icon-btn {
	width: 24px;
	height: 24px;
	margin: 6px;
	@extend .flex-center;
}
.icon-btn.green {
	color: #259B24;
}
.help-tap-ctn {
	position: absolute;
	top: 0;
	left: 0;
	width: 45px;
	height: 60px;
	// border: 1px dashed yellow;
}
.icon-back.touching {
	border-radius: 16px;
	background-color: #FF9800 !important;
}
.cbtn {
	min-width: 36px;
	color: white;
	background-color: #ff9800;	
}
.dollar-btn {
	position: absolute;
	right: 0;
	display: flex;
}
.posStyle /deep/ .symbol-position-row{
    border-radius: 0;
    background-color: inherit !important;
}
.posStyle /deep/ .clr-gray2{
	@extend .clr-orange3;
}
@media screen and (orientation: landscape) {
	.cbtn {
		width: 10vh;
    	height: 10vh;
	}
}

@media screen and (max-height: 620px) {
	.myhead-ctn .h50 {
		height: 35px;
	}
}
</style>