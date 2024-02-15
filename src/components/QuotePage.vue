<template>
    <div class="quote-page flex-col" :class="{'pad': isSpacialRetina}">
		<!-- 表頭列 -->
		<QuotePageHead v-if="isPortrait" :param="{'noQoNav': true}"/>
		<!-- 商品資料列 -->
		<SymbolContentRow class="mgtb1" :suspend="suspend" v-if="isPortrait"/>
		<!-- 五檔/明細/分時/線圖/標的 -->
		<div class="flex-1 posr">
			<TabGroup class="FULL" tabKey="TG-QuotePage" :tabList="tabList" :suspend="suspend" :disablePrevNext="true"></TabGroup>
		</div>
		<div class="navigator-option flex-row pdtb4 pdlr2 flex-around" :class="{'font-size-big':largeSize}">
			<div class="flex-1 flex-row flex-center foot-opt-wrapper" :class="{'not-use': !isPortrait}" v-if="showBtmRouter">
				<span class="btn flex-center nowrap flex-1 tcef" v-if="enableTVC && twMode" @click="onPopupKClick('QuotePageTVC')">{{$ln('技術')}}</span>
				<span class="divider-left mglr2" v-if="enableTVC && twMode" />
				<span class="btn flex-center flex-1 tcef" v-if="!disableKChartOrder" @click="onPopupKClick('QuotePageKChartOrder')">{{$ln('图')}}</span>
				<span class="divider-left mglr2" v-if="!disableKChartOrder" />
				<span class="btn flex-center flex-1 tcef" v-if="!disableFastOrder" @click="onPopupKClick('QuotePageFastOrder')">{{$ln('快')}}</span>
				<span class="divider-left mglr2" v-if="!disableFastOrder" />
				<span class="btn flex-center flex-1 tcef" v-if="!(disableThunderN && disableThunderF)" @click="onPopupKClick('QuotePageThunder')">{{$ln('闪')}}</span>
				<span class="divider-left mglr2" v-if="!(disableThunderN && disableThunderF)" />
			</div>
			<OrderBSBtn class="mglr2" :class="{'flex-1': !showBtmRouter}" order-type="HIT" mode="fast" :useComName="selfComName"/>
		</div>
    </div>
</template>

<script>
import QuotePageHead from "@/components/QuotePageHead.vue";
import SymbolContentRow from "@/components/SymbolContentRow.vue";
import QuotePageSub from "@/components/QuotePageSub.vue";
import OrderBSBtn from "@/components/OrderBSBtn.vue";

import BS5 from "@/components/BS5.vue";
import SymbolDetail from "@/components/SymbolDetail.vue";
import ListByTime from "@/components/DesktopComponents/DesktopListByTime.vue";
import TvcLine from "@/components/TvcLine.vue";
import TvcUnderlying from "@/components/TvcUnderlying.vue";

export default {
	props: ['param', 'suspend'],
	data() {
		return {
			reRanderKey: 0,
        }
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {
		// 鎖定直向
		window.lockScreen('portrait');
	},
    methods: {
		onPopupKClick(comClassName) {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			if(comClassName == 'QuotePageTVC') {
				// 參考QuotePageHead取商品名稱的機制
				let title = `${this.$store.state.selectedSymbol.Name}${this.$store.state.selectedSymbol.CIDM4}`;
				eventBus.$emit("POPUP-DIALOG", "TvcKbar", null, {$HEAD:{title: title}});
				return;
			}
			// 圖形下單頁預設以KChart顯示。
			if(comClassName == 'QuotePageKChartOrder' && !this.enableTVC)
				this.$store.state.status.mixChartActivComclass = "SciKChart";
			// 如果點了閃且pdsetting又disable一般閃電須設定閃電模組為戰鬥閃電
			if(comClassName == 'QuotePageThunder' && this.disableThunderN) {
				this.$store.state.thunder.model = 'F';
			}
			eventBus.$emit("POPUP-DIALOG", QuotePageSub, {comClass: comClassName, noQoNav: true});
		},
	},
	watch: {
		// 閃電與戰鬥閃電是同一個組件，所以以reRanderKey做重新渲染的動作。
		"$store.state.thunder.model"(nv) {
			this.reRanderKey++;
		},
	},
    computed: {
		largeSize(){return this.$store.state.config.largeSize;},
		sid() {return this.$store.state.selectedSymbol.ID;},
		// 響應式轉向變數 (直向=true)
		isPortrait() {
			return this.$store.state.status.isPortrait;
		},
		// 商品行情顯示哪個元件
		displayClass() {
			return this.$store.state.status.quotePageDisplayClass;
		},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
		/** 顯示底部功能 */
		showBtmRouter() {
			// 非價差商品才顯示
			return !M4C.Symbol.isPriceDiff_FutSymbol(this.sid);
		},
		// 響應式轉向變數 (直向=true)
		isPortrait() {return this.$store.state.status.isPortrait;},
		isSpacialRetina() {return (this.isPortrait && window.outerHeight * 0.75 <= window.outerWidth) || (this.isPortrait && this.isPad);},
		isPad() {return this.$store.state.device.isPad;},
		/** 報價連線的 pdsetting */
		quotePdSetting() {return this.$store.state.config.quotePdSetting;},
		/** 支持從 quotePdSetting.function.disable 指定停用各功能 */
		// 停用圖表下單
		disableKChartOrder() {
			try{return this.quotePdSetting.function.disable.KChartOrder;}catch(e){};
		},
		// 停用快速下單
		disableFastOrder() {
			try{return this.quotePdSetting.function.disable.FastOrder;}catch(e){};
		},
		// 停用一般閃電
		disableThunderN() {
			try{return this.quotePdSetting.function.disable.ThunderN;}catch(e){};
		},
		// 停用戰鬥閃電
		disableThunderF() {
			try{return this.quotePdSetting.function.disable.ThunderF;}catch(e){};
		},
		// 啟用TVC
		enableTVC() {
			try{return this.$store.state.config.publicPdSetting.function.tvc;}catch(e){}
		},
		twMode() {return this.$store.state.config.twMode;},
		// 五檔/明細/分時/線圖/標的
		tabList() {
			let list = [
				{label: "五檔", comClass: BS5},
				{label: "資訊", comClass: SymbolDetail},
				{label: "明細", comClass: ListByTime},
				{label: "即時", comClass: TvcLine}
			];
			if (vuex.selectedSymbol.isOpt)
				list.push({label: "標的", comClass: TvcUnderlying});
			return list;
		},
    },
	components: {
		QuotePageHead,
		SymbolContentRow,
		QuotePageSub,
		OrderBSBtn,
		BS5,
		SymbolDetail,
		ListByTime,
		TvcLine,
		TvcUnderlying,
	},
}
</script>
 
<style lang="scss" scoped>
.foot {
	height: 50px;
    // background-color: #141414;
	justify-content: space-around;
}
.quote-page .kchart-ctn {
    margin: auto;
    width: 100%;
}
.foot {
	font-size: 10px;
}
.navigator-option {
	z-index: 1;
	background-color: #17202A;
}
.btn{
    width: 10vw;
    height: 10vw;
}
.divider-left {
	border-left: 1px solid gray;
	height: 1em;
}
.not-use {
	pointer-events: none;
	opacity: 0.5;
	color: #DDD !important;
}
.pad /deep/ .pdt2,.pad /deep/ .pdtb1,.pad /deep/ .pdb2, .pad /deep/ .pd1, .pad /deep/ .pdtb2, .pad /deep/ .pdtb4 {
	padding: 0;
}
.pad /deep/ .ht4 {height: 30px !important;}
.pad /deep/ .symbol-content-row-ctn, .pad /deep/ .quote-page-head-ctn, .pad /deep/ .quote-page-head-ctn .name-id-ctn .nowrap {
	font-size: 3.5vw;
}
@media screen and (orientation: landscape) {
	.navigator-option {
		position: absolute;
    	visibility: hidden;
	}
}
</style>