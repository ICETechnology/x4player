<template>
	<div class="myhead-ctn flex-col flex-start" :style="{'background-color': bgcolor}">
		<div class="flex-row w100p h50 flex-center">
			<!-- 返回按鈕 -->
			<span class="icon-back" v-if="backType" @click="onBtnBack" :class="{touching: touching}"></span>
			<!-- 顯示文字 -->
			<span>{{$ln(showText)}}</span>
			<span class="flex-1"></span>
			<div class="flex-row">
				<div v-if="enableShare" class="flex-center cbtn mglr1" @click="$emit('onBtnShare')"><i class="material-icons">share</i></div>
				<div class="flex-center cbtn mglr1" @click="$emit('onBtnHelp')"><i class="material-icons">help</i></div>
			</div>
		</div>
		<!-- 第二列 -->
		<div class="flex-center w100p h50 posr" v-if="displayHeadMargin && $store.state.status.isPortrait">
			<component :is="$store.state.layout.head.row2"></component>
		</div>
		<!-- 輔助點擊容器 -->
		<div class="help-tap-ctn" @click="onHelpTapCtnClick" @touchstart="touching=true" @touchend="touching=false"></div>
	</div>
</template>

<script>
export default {
	props: ["showText", "backType", 'accBtn', 'backCB', 'margin', "enableShare"],
	data() {
		return {
			touching: false,
		}
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
	},
	computed: {
		/** 支持從 quotePdSetting.function.color.theme 取得背景色 */
		bgcolor() {
			try {return vue.$store.state.config.quotePdSetting.function.color.theme;}catch(e){}
		},
		displayHeadMargin() {
			return this.margin != null ? this.margin : this.$store.state.status.displayHeadMargin;
		},
	}
}
</script>

<style lang='scss' scoped>
.myhead-ctn {
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