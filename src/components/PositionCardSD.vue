<template>
	<div ref="ctn" class="quote-card-sd flex-col pdtb5 flex-1">
		<div class="flex-col pdl2 mgb4 pdr1 symbol-ctn flex-start">
			<!-- 合約名稱 -->
			<PositionCardSDName :sid="sid" class="w100p posCardSDName" />
			<!-- 實虛/剩餘天數 -->
			<PositionCardExtraInfo :sid="sid" :psd="psd" class="w100p" />
		</div>
		<!-- 欄位內容 -->
		<PositionCardSDContent :sid="sid" :psd="psd" class="mgb2 overflow-y-auto flex-3"/>
		<div class="flex-col flex-2">
			<!-- Greeks明細 -->
			<GreeksDetail class="pd2" v-if="!twMode" />
			<!-- 訂閱標的商品 (若有的話) -->
			<SubContract v-if="psd.$UNDERLYING_S" :sid="psd.$UNDERLYING_S" />
			<div class="flex-1"/>
			<ContractsSwitch v-if="normalPositionSumList.length > 0" class="clr-gray2 font-size-mini mgtb4 pdl2" :preSidList="posSidList" />
			<div class="flex-bottom pdlr4">
				<Button class="close-btn w100p ht2 rd1 clr-white"  @click="onCloseClick">{{$ln("确认")}}</Button>
			</div>
		</div>
	</div>
</template>

<script>
import SubContract from "@/components/SubContract.vue";
import PositionCardSDName from '@/components/PositionCardSDName';
import PositionCardSDContent from '@/components/PositionCardSDContent';
import PositionCardExtraInfo from '@/components/PositionCardExtraInfo';
import ContractsSwitch from "@/components/ContractsSwitch.vue";
import GreeksDetail from "@/components/GreeksDetail.vue";
/** 滾動監聽 */
import Vue from 'vue';
import VueWaypoint from 'vue-waypoint'

export default {
	props: ['positionSumData', 'suspend', 'isSample', 'inside', 'inFavorite', 'param'],
	data() {
		return {
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {SubContract, PositionCardSDName, PositionCardSDContent, PositionCardExtraInfo,	ContractsSwitch,GreeksDetail},
    methods: {
		onClick() {
			event.stopPropagation();
			if (this.isSample) return;
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.sid);
			// 彈出商品頁
			eventBus.$emit("POPUP-DIALOG", "QuotePage", {sid: this.sid});
		},
		onCloseClick() {eventBus.$emit("CLOSE-DIALOG");},
	},
	watch: {},
    computed: {
		psd() {
			return this.positionSumData || this.normalPositionSumList[0];
		},
		sid() {
			return this.psd.SYMBOL;
		},
		esid() {
			return this.sid + (this.psd.$IS_COMPOSITE ? this.psd.$COMPOSITE_IDX : '');
		},
		/** 持倉匯總資料 */
		normalPositionSumList() {
			return this.$store.state.data.normalPositionSumList;
		},
		posSidList() {
			return this.normalPositionSumList.map(pos=>(pos.SYMBOL));
		},
		twMode() {return this.$store.state.config.twMode;},
	},
}
</script>

<style scoped>
.posCardSDName {
	line-height: 1.2;
}
.quote-card-sd {
	background-color: #17202A;
	border-radius: 0.5em;
}
.close-btn {
	background-color: #0065A4;
}
.bdb1 {
	border-bottom: 1vw solid #111820;
}
</style>