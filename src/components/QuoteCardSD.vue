<template>
	<div ref="ctn" class="quote-card-sd quote-card-ctn border-gray flex-col pd2" @click.stop="onClick" :sid="sid" :class="{'pointer-events-none': !isAvailable}"
		:style="{'min-height': styleHeight}" v-waypoint="{active: true, callback: onWaypoint}">
		<div class="flex-row">
			<!-- 商品合約名稱 -->
			<QuoteCardSDName class="flex-1 mgl2 mgb2" :sid="sid" :displayAsHot="displayAsHot" />
			<div>
				<!-- 設定欄位 -->
				<i v-if="configColumn" class="material-icons md-18 tcef" @click.stop="onConfigColumn">dashboard_customize</i>
			</div>
		</div>
		<QuoteCardSDContent v-if="displayContent" :sid="sid" :qo="qo" :columnKey="useColumnKey" />
	</div>
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';
import QuoteCardSDName from '@/components/QuoteCardSDName';
import QuoteCardSDContent from '@/components/QuoteCardSDContent';
/** 滾動監聽 */
import Vue from 'vue';
import VueWaypoint from 'vue-waypoint'

export default {
	mixins: [QuoteAgent],
	props: ['sid', 'suspend', 'isSample', 'inside', 'inFavorite', 'configColumn', 'columnKey', 'autoHeight', 'notPopupDialog', "sortedList"],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {QuoteCardSDName, QuoteCardSDContent},
    methods: {
		/** 滾動監聽 */
		onWaypoint({going, direction}) {
			// Waypoint:out 超過 1 秒才設定為不可視，已解決行情ScrollBounce發生會快速 out->in 導致隱藏後又顯示的問題
			if (going === 'in') {
				this.visibility = true;
				clearTimeout(this.offVisibilityTimeout);
				// 訂閱OG
				M4C.Quote.sub(`${this.sid}+OG`, this);
			}
			else {
				this.offVisibilityTimeout = setTimeout((self)=>{self.visibility = false;}, 1000, this);
				// 解訂OG
				M4C.Quote.unsub(`${this.sid}+OG`, this);
			}
		},
		onClick() {
			event.stopPropagation();
			if (this.isSample) return;
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.sid);
			// 更新是否顯示為主連(熱門月)
			if (this.displayAsHot)
				this.$store.commit("setSelectedSymbolDisplayAsHot");
			
			// 準備關注合約列表
			this.$store.commit("setContractsList", this.sortedList);
			// 彈出商品頁 (若有指定 notPopupDialog 時不要彈出 ex. 下拉OC裡的關注卡片)
			if (!this.notPopupDialog)
				eventBus.$emit("POPUP-DIALOG", "QuotePage", {sid: this.sid});
			this.$emit('onQuoteCardClick');
		},
		onConfigColumn() {
			eventBus.$emit('POPUP-DIALOG', 'ConfigColumnSD', {sid: this.sid, key: `quote:${this.sid}`, sample: 'QuoteCardSD'}, {transName: 'float'});
		},
	},
	watch: {
	},
    computed: {
		quoteCardSDHeight() {
			return this.$store.state.status.quoteCardSDHeight;
		},
		styleHeight() {
			if (this.isSample || this.autoHeight)
				return;
			if (this.quoteCardSDHeight)
				return `${this.quoteCardSDHeight}px`;
		},
		/** 視為熱門月(主連) */
		displayAsHot() {
			// 在展開列表中 -> 不顯示為主連
			if (this.inside)
				return false;
			// 自選群組內時 -> 若商品代碼最後為 HOT 時，要顯示主連
			if (this.inFavorite)
				return M4C.Symbol.isHotSID(this.sid);
			// 非自選群組時 -> 該商品月份屬熱門月，要顯示主連
			else
				return M4C.Symbol.isHotSymbol(this.sid);
		},
		useColumnKey() {
			return this.columnKey || `quote:${this.sid}`;
		},
		displayContent() {
			if (this.isSample)
				return true;
			// (舊備註) this.qo 在 QuoteAgent 會因 suspend 而變為另個 instance 無法觸發 this.qo.$suspend，所以先暫時不看 qo.$suspend (副作用是可能會看到舊資料)
			// (新備註) 將 QuoteAgent 的 selfSuspend 移除後，此處的 qo.$suspend 功能恢復正常可用
			if (this.visibility && !this.suspend && !this.qo.$suspend)
				return true;
		},
		// 有支援的商品
		isAvailable() {return this.$checkSupportedItem(this.sid);},
		// 判斷是否支援
		$checkSupportedItem() {return this.$store.state.fn.$checkSupportedItem;},
	},
}
</script>

<style scoped>
.quote-card-sd {
	border-radius: 0.5em;
}
</style>