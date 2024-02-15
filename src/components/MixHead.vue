<template>
	<div v-if="$store.state.layout.head" class="mix-head-ctn flex-col">
		<!-- <div class="FULL bg-ctn"></div> -->
		<!-- 第一列 -->
		<div class="flex-row flex-start h50">
			<!-- 下拉選單 -->
			<div class="flex-start h100p mglr3">
				<component :is="$store.state.layout.head.com2"></component>
			</div>
			<div class="flex-1"/>
			<!-- 設定行情欄位 -->
			<div class="flex-center mgr3 tcef rd3" v-if="isMarketLayout && enableQuoteColumnConfig" @click="onConfigQuoteColumnSD">
				<i class="material-icons tcef">dashboard_customize</i></div>
			<!-- 切換報價樣式 -->
			<div class="flex-center mgr3 tcef rd3" v-if="isMarketLayout" 
				@click="switchStyle('quote')"><i class="material-icons tcef">loop</i></div>
			<!-- 切換持倉樣式 -->
			<!-- <div class="flex-center mgr3 tcef rd3" v-if="isPosition" 
				@click="switchStyle('position')"><i class="material-icons tcef">loop</i></div> -->
			<!-- 連續IOC -->
			<ContinuousIOCIcon v-if="!isMarketLayout && showContinuousIOC"></ContinuousIOCIcon>
			<!-- 搜尋 -->
			<div class="flex-center mgr3" @click="onBtnSearch"><i class="material-icons tcef">search</i></div>
			<!-- 雲端單 -->
			<div v-if="!hiddenSMO && $store.state.bottomBar.activeKey==='trading'" class="flex-row flex-center mgr3" @click="onBtnCloud">
				<i class="material-icons tcef">{{existCloudReport ? `cloud_upload` : `cloud_queue`}}</i>
				<div class="posr" v-if="newCloudReport"><span class="icon-alert"></span></div>
			</div>
			<!-- Menu -->
			<div class="mgr3"><component :is="$store.state.layout.head.com1"></component></div>
		</div>
		<!-- 第二列 (資金) -->
		<div class="flex-1 w100p" v-if="$store.state.status.displayHeadMargin">
			<component :is="$store.state.layout.head.row2"></component>
		</div>
	</div>
</template>

<script>
import PositionPLSumRow from "@/components/PositionPLSumRow.vue";
import ContinuousIOCIcon from "@/components/Framework/ContinuousIOCIcon.vue";
export default {
	data() {
		return {}
	},
	components: {PositionPLSumRow, ContinuousIOCIcon},
	methods: {
		/** 搜尋圖示按鈕 */
		onBtnSearch() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit("POPUP-DIALOG", 'SearchPlus', "", {transName: 'float'});
		},
		/** 雲端回報圖示按鈕 */
		onBtnCloud() {
			if(M4C.SmoAgreement.checkAgreeSMO(true)) {
				// 防連點機制
				if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
				// 關閉小紅點
				this.$store.state.m4c.report.newCloudReport = false;
				// 彈出雲端回報
				eventBus.$emit("POPUP-DIALOG", 'CloudReportCardList', "", {transName: 'float'});
			}
		},
		/** 設定行情卡片欄位 */
		onConfigQuoteColumnSD() {
			if (this.quoteStyle === 'QuoteCardSD')
				eventBus.$emit('POPUP-DIALOG', 'ConfigColumnSD', {key: 'quote', sample: 'QuoteCardSD'}, {transName: 'float', lock: true});
			else if (this.quoteStyle === 'QuoteTableX')
				eventBus.$emit('POPUP-DIALOG', 'ConfigColumnSD', {key: 'quote_tablex'}, {transName: 'float', lock: true});
		},
		onConfigPositionColumnSD() {
			eventBus.$emit('POPUP-DIALOG', 'ConfigColumnSD', {key: 'position', sample: 'PositionCardSD'}, {transName: 'float', lock: true});
		},
		/** 切換報價卡片類別 */
		switchStyle(type) {
			let typeStyle = this.$store.state.config[`${type}Style`];
			let list = this.$store.state.config[`${type}StyleList`];
			let idx = list.indexOf(typeStyle);
			let newIdx = ++idx % list.length;
			this.$store.state.config[`${type}Style`] = list[newIdx];
		},
	},
	computed: {
		/** 有新的雲端回報 */
		newCloudReport() {
			return this.$store.state.m4c.report.newCloudReport;
		},
		/** 有雲端委託回報 */
		existCloudReport() {
			return this.$store.state.data.cloudReportList.length > 0;
		},
		/** 支持從 quotePdSetting.function.color.theme 取得背景色 */
		bgcolor() {
			try {return vue.$store.state.config.quotePdSetting.function.color.theme;}catch(e){}
		},
		/** 當前是在市場版面 */
		isMarketLayout() {
			return this.$store.state.bottomBar.activeKey==='market';
		},
		/** 當前是在持倉畫面 */
		isPosition() {
			return this.$store.state.status.isPosition;
		},
		quoteStyle() {
			return this.$store.state.config.quoteStyle;
		},
		/** 報價卡片類別 */
		enableQuoteColumnConfig() {
			return this.quoteStyle === 'QuoteCardSD' || this.quoteStyle === 'QuoteTableX';
		},
		/** 是否隱藏SMO相關功能(By pdsetting) */
		hiddenSMO() {return this.$store.state.config.quotePdSetting.function.hiddenSMO;},
		/** 當前是否在成交列表 */
		isFillList() {return this.$store.state.status.isFillList;},
		activeTab() {return this.$store.state.bottomBar.activeKey;},
		showMixGreeks() {
			return this.isPosition || this.isFillList && this.activeTab == 'trading';
		},
		twMode() {
			return this.$store.state.config.twMode;
		},
		// 顯示連續IOC功能
		showContinuousIOC(){
			try {return this.$store.state.config.CONFIG.ContinuousIOC.showContinuousIOC} catch (error) {};
		}
	}
}
</script>

<style scoped>
.mix-head-ctn {
	/* height: 30vw; */
	background-color: #F58923;
}
.bg-ctn {
	margin-left: -20vw;
	background: linear-gradient(-45deg, #F58923 50%, transparent 50%),linear-gradient(90deg, #F17B2A 100%, transparent 100%);
}
/* .cbtn {
	min-width: 36px;
	color: white;
	background-color: #ff9800;	
} */
/* 警示提示icon */
.icon-alert {
	position: absolute;
	top: -12px;
	right: -6px;
	width: 12px;
	height: 12px;
	border-radius: 6px;
	background-color: red;
}

</style>