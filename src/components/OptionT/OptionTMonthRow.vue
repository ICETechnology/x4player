<template>
	<div class="optiont-month-row-ctn posr" :class="{'expand': fakeMthHeadTarget.monthExpand, 'is-feature-option': isFeatureOption}">
		<div class="optiont-month-row flex-row flex-center tcef font-size-small bgc-head"
			:class="{'expand': fakeMthHeadTarget.monthExpand,'font-size-normal':$store.state.config.largeSize}" @click="onClick">
			<!-- 展開箭頭 -->
			<div class="flex-center" :class="[isDesktop?'mgl5':'mgl1']">
				<i class="material-icons">{{fakeMthHeadTarget.monthExpand ? "arrow_drop_up" : "arrow_drop_down"}}</i>
			</div>
			<!-- 月份 -->
			<div class="" :class="{'clr-up': hotMonth==fakeMthHeadTarget.month }">{{fakeMthHeadTarget.month}}</div>
			<div class="mglr1"/>
			<!-- 此月份有倉位 -->
			<div v-if="$Q.C>0 || $Q.P>0">多<span class="clr-up">{{$Q.C}}</span> 空<span class="clr-dn">{{$Q.P}}</span></div>
			<div class="flex-1"/>
			<!-- 剩餘天數 -->
			<div class="mgr2">{{fakeMthHeadTarget.remainDays}}{{$ln(`天到期`)}}</div>
			<!-- 策略下單按鈕圖示 -->
			<div v-if="isTWF" class="mgr5 flex-center plot-order-btn" @click="popupPlotOrder" :title="$ln('开启策略下单盒')">
				<i class="material-icons md-18 mgr1">gps_fixed</i>
				<span class="">{{$ln(`策略`)}}</span>
			</div>
			<!-- 置中圖示按鈕 -->
			<div v-if="fakeMthHeadTarget.monthExpand" class="posa icon-btn flex-center" :title="$ln('最新价置中')">
				<i class="material-icons md-24 clr-orange tcef" @click="emitClosedPrice">replay</i>
			</div>
		</div>
		<!-- 標的區 (僅期貨期權) -->
		<div v-if="isFeatureOption && fakeMthHeadTarget.monthExpand" class="underlying-ctn tcef posr">
			<OptionUnderlying class="FULL pdlr5" :fakeMthHeadTarget="fakeMthHeadTarget" />
		</div>
	</div>
</template>

<script>
import OptionUnderlying from "@/components/OptionT/OptionUnderlying.vue";
export default {
	props: ['fakeMthHeadTarget'],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {OptionUnderlying},
    methods: {
		/** 點擊月份列 */
		onClick() {
			this.fakeMthHeadTarget.onMonthClick();
			this.$emit('onClick');
		},
		/** 點擊價平置中 */
		emitClosedPrice() {
			event.stopPropagation();
			this.fakeMthHeadTarget.emitClosedPrice();
		},
		/** 彈出策略下單盒 */
		popupPlotOrder() {
			this.fakeMthHeadTarget.popupPlotOrder();
		},
	},
	watch: {},
    computed: {
		minfo() {
			return M4C.Symbol.getMainformInfo(vuex.opt.selectedSymbol);
		},
		/** 台灣期交所 TWF */
		isTWF() {
			return this.minfo.Exchange === "TWF";
		},
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		hotMonth() {
			let hotSid = `${this.$store.state.opt.selectedSymbol}.HOT`;
			return M4C.Symbol.toMonthSymbol(hotSid).split('.').slice(-1)[0];
		},
		$Q() {
			return this.fakeMthHeadTarget.totalPositionQty || {};
		},
		// 是期貨期權
		isFeatureOption() {
			return this.$store.state.opt.isFeatureOption;
		},
	},
}
</script>

<style scoped>
.plot-order-btn {
	color: #F5A623;
	cursor: pointer;
}

.desktop .optiont-month-row:hover {
	color: aqua;
	cursor: pointer;
}
.expand {
	border-bottom: 1px solid #1C2333;
    box-sizing: border-box;	
}
.desktop .expand {
	background-color: #1C3766 !important;
}
.desktop .plot-order-btn:hover {
	color: aqua;
}

.optiont-month-row-ctn.expand.is-feature-option {
	height: 84px;
	min-height: 84px;
}
.underlying-ctn {
	position: absolute;
	top: 34px;
	left: 0;
	right: 0;
	height: 50px;
	min-height: 50px;
	background-color: #111820;
	box-sizing: border-box;
	border-bottom: 1px solid #333;
}
.optiont-month-row {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 34px;
	min-height: 34px;
}
</style>