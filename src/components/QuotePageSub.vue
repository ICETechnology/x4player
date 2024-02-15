<template>
    <div class="quote-page quote-page-sub flex-col" :class="{'pad': isSpacialRetina}">
		<!-- 表頭列 -->
		<QuotePageHead v-if="isPortrait" :param="param"/>
		<!-- 商品資料列 -->
		<SymbolContentRow class="mgtb1" :suspend="suspend" v-if="isPortrait && displayClass != 'QuotePageThunder'"/>

		<div class="flex-1 posr">
			<transition name="slide-left">
				<component class="FULL" :is="displayClass" @rerander="reRanderKey++" :suspend="suspend" :key="reRanderKey" :param="{model: model}"/>
			</transition>
		</div>
		<!-- TickChart 資料管理元件 -->
		<TickChartData/>
    </div>
</template>

<script>
import QuotePageHead from "@/components/QuotePageHead.vue";
import SymbolContentRow from "@/components/SymbolContentRow.vue";
import QuotePageFastOrder from "@/components/QuotePageFastOrder.vue";
import QuotePageThunder from "@/components/QuotePageThunder.vue";
import TickChartData from "@/components/TickChartData.vue";

export default {
	props: ['param', 'suspend'],
	data() {
		return {
			reRanderKey: 0,
			model: 'order'
        }
	},
	beforeMount() {
		if(this.param && this.param.comClass) {
			this.$store.state.status.quotePageDisplayClass = this.param.comClass;
		}
	},
    mounted() {
		// this.updateLockScreen();
		this.$store.state.thunder.scrollLock = true;
	},
	beforeDestroy() {
		// 子行情頁消滅時回復k線圖為市場模組。
		this.$store.state.Kchart.model = "market";
		this.$store.state.status.quotePageDisplayClass = "QuotePageMixChart";
		// 鎖定直向
		window.lockScreen('portrait');
	},
    methods: {
		/** 更新鎖定螢幕 */
		updateLockScreen() {
			let cls = this.$store.state.status.quotePageDisplayClass;
			// K時解鎖 (允許使用者轉向)
			if (cls === "QuotePageMixChart")
				screen.orientation.unlock();
			// 鎖定直向
			else
				window.lockScreen('portrait');
		},
	},
	watch: {
		// 切換上下一檔合約情境(sid改變)，直接重新渲染整個元件，不覆用以減低元件處理複雜度
		sid() {
			this.reRanderKey++;
		},
		displayClass(nv) {
			// this.updateLockScreen();
		},
		// 閃電與戰鬥閃電是同一個組件，所以以reRanderKey做重新渲染的動作。
		"$store.state.thunder.model"(nv) {
			this.reRanderKey++;
		},
		isPortrait(nv, ov) {
			// 橫置時顯示一般線圖橫置(因有一些非預期ui無法顯示ex:登入、委託確認，因此不在橫置時顯示圖形下單。有需要再by設計調整)
			if(!nv) {
				this.model = "market";
				this.reRanderKey++;
			}
			else
				this.model = "order";
				this.reRanderKey++;
		},
	},
    computed: {
		sid() {return this.$store.state.selectedSymbol.ID;},
		// 響應式轉向變數 (直向=true)
		isPortrait() {
			return this.$store.state.status.isPortrait;
		},
		// 商品行情顯示哪個元件
		displayClass() {
			return this.$store.state.status.quotePageDisplayClass;
		},
		// 響應式轉向變數 (直向=true)
		isPortrait() {return this.$store.state.status.isPortrait;},
		isSpacialRetina() {return (this.isPortrait && window.outerHeight * 0.75 <= window.outerWidth) || (this.isPortrait && this.isPad);},
		isPad() {return this.$store.state.device.isPad;},
    },
	components: {
		QuotePageHead,
		SymbolContentRow,
		QuotePageFastOrder,
		QuotePageThunder,
		TickChartData,
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
.pad /deep/ .btn {
	width: 5vw;
	height: 5vw;
}
.pad /deep/ .order-BS-btn-wrapper .button-ctn{
	flex-flow: row;
}
.pad /deep/ .ht4, .pad /deep/ .order-option-ctn .ht4 {height: 30px !important;}
.pad /deep/ .order-btn {
	height: 40px !important;
}
.pad /deep/ .pdt2,.pad /deep/ .pdtb1,.pad /deep/ .pdb2, .pad /deep/ .pd1, .pad /deep/ .pdtb2, .pad /deep/ .pdtb4 {
	padding: 0;
}
.pad /deep/ .symbol-content-row-ctn, .pad /deep/ .quote-page-head-ctn, .pad /deep/ .quote-page-head-ctn .name-id-ctn .nowrap {
	font-size: 3.5vw;
}
.pad /deep/ .kchart-foot-wrapper {min-height: 9em;}
</style>