<template>
    <div class="FULL desktop-quote flex-col font-size-small" :class="{'flex-center': !supportCombinePosition}">
		<!-- 工具列 -->
		<div class="flex-row" v-if="supportCombinePosition">
			<radio class="radio-ctn flex-row mg1" v-model="type">
				<span value="combine">{{$ln(`组合持仓`)}}</span>
				<span value="split">{{$ln(`组合报单`)}}</span>
			</radio>
			<div class="flex-1"></div>
			<div class="flex-row">
				<!-- <span class="icon-btn combine-btn" @click="onCombinePosition" v-if="type=='combine'">{{$ln('建构组合')}}</span> -->
				<!-- 欄位設定 -->
				<!-- <ColumnConfigIcon ref="columnConfigIcon" :default="$store.state.desktop.positionDefaultColumns" :current="$store.state.desktop.positionColumns" class="icon-btn" /> -->
				<!-- 重新查詢 -->
				<span class="icon-btn" @click="onRefresh" :title="`${$ln('重新查询')}`"><i class="material-icons">refresh</i></span>
			</div>
		</div>
		<div class="flex-1 scrolling-x scrolling-y" v-if="supportCombinePosition">
			<CombinePositionCardList v-if="type=='combine'" key="combine" class="h100p" @contextMenu="onCombinePostionContextMenu" />
			<CombineReportCardList v-if="type=='split'" key="split" class="h100p"/>
		</div>
		<div class="content-ctn font-size-large flex-center" v-if="!supportCombinePosition">
			<i class="material-icons md-36">work_off</i>
			<span class="mgl2">{{$ln('当前帐号不支持此功能')}}</span>
		</div>
    </div>
</template>

<script>
import CombinePositionCardList from "@/components/CombinePositionCardList.vue";
import CombineReportCardList from "@/components/CombineReportCardList.vue";
import CombinePositionOrder from "@/components/CombinePositionOrder.vue";
export default {
	props: [],
	data() {
		return {
			type: "combine",
			selectedObj: {psd: null},
		}
	},
	beforeMount() {
	},
    mounted() {},
	beforeDestroy() {},
	components: {CombinePositionCardList, CombineReportCardList, CombinePositionOrder},
    methods: {
		onRefresh() {
			if(this.type == 'combine')
				M4C.Position.queryPositionSum();
			else if(this.type == 'split') {
				M4C.CombinePosition.reloadCombinePosition();
			}
		},
		// 建构组合
		onCombinePostion(){
			eventBus.$emit("POPUP-DIALOG", CombinePositionOrder, {"type": 'combine'}, {transName: 'float'});
		},
		/** 組合持倉右鍵選單 */
		onCombinePostionContextMenu() {
			let self = this;
			this.contextmenu.pop({
				list: [
					// 建構組合
					{'icon': 'lock', 'label': '建构组合', onclick: ()=>{self.onCombinePostion()}},
				],
			});
		},
	},
	watch: {
	},
    computed: {
		contextmenu() {
			return this.$store.state.desktop.contextmenu;
		},
		/** 當前選擇的持倉 */
		psd() {
			return this.selectedObj.psd;
		},
		sid() {
			return this.psd.SYMBOL;
		},
		/** 所有委託回報 */
		positionList() {
			return this.$store.state.data.normalPositionSumList;
		},
		stampStatus() {
			return this.$store.state.result.queryPositionSumResult.$STATUS;
		},
		// 純證券帳號
        isPureStock() {return this.$store.state.login.isStock && !this.$store.state.login.isFut && !this.$store.state.login.isOption},
		// 當前帳號支援組合持倉功能 (SIM 不支持, 證券帳號不支持)
		supportCombinePosition() {
            // 該貼牌有設定啟用組合持倉 && 不是SIM && 不是純證券帳號
            return !this.$store.state.login.isSIM && this.$store.state.config.CONFIG.ENABLE_COMBINEPOSITION && !this.isPureStock;
		},
	},
}
</script>

<style scoped>
.content-ctn {
	padding: 8px 16px;
	border: 1px solid #999;
	border-radius: 8px;
}
</style>