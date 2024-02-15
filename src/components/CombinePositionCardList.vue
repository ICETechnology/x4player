<template>
    <div class="combine-position-card-list-ctn flex-col flex-1">
		<div class="flex-row head clr-gray font-size-small">
			<div class="cell0 flex-start"></div>
			<div class="flex-1 flex-start">{{$ln('合约')}}</div>
			<div class="cell1 flex-center">{{$ln(`买卖`)}}</div>
			<div class="cell1 flex-center">{{$ln(`手数`)}}</div>
			<div class="cell2 flex-center">{{$ln(`占用保证金`)}}</div>
		</div>
		<div class="flex-1 posr font-size-little" v-if="!isDesktop">
			<ScrollBounce class="FULL" :refresh="true" @refresh="onRefresh">
				<CombinePositionCard class="combine-position-card-ctn" v-for="(cpd, i) in combinePositionList" :key="i"
					:combinePositionData="cpd" @onExpand="sid => expandSid = sid" :expandSid="expandSid" :uid="i"/>
				<Stamp v-if="combinePositionList.length===0" :stampStatus="stampStatus" />
			</ScrollBounce>
		</div>
		<div class="flex-center" v-if="!isDesktop">
			<Button class="combine-btn bgc-white ht3 rd2 mgtb2" @click="onCombinePostion" :class="{'disabled': !positionSumList.length}">{{$ln("构建组合")}}</Button>
		</div>
		<!-- 桌機版 -->
		<div class="flex-row head clr-gray font-size-small pdlr2" v-if="isDesktop">
			<div class="cell1 flex-start">{{$ln(`策略`)}}</div>
			<div class="flex-1 flex-start">{{$ln(`合约`)}}</div>
			<div class="cell1 flex-center">{{$ln(`净仓`)}}</div>
			<div class="cell2 flex-center">{{$ln(`占用保证金`)}}</div>
		</div>
		<div class="flex-1 posr font-size-little" v-if="isDesktop">
			<CombinePositionCard class="combine-position-card-ctn pdtb2" v-for="(cpd, i) in combinePositionList" :key="i"
				@contextMenu="onContextMenu" :combinePositionData="cpd" :uid="i" />
			<Stamp v-if="combinePositionList.length===0" :stampStatus="stampStatus" />
		</div>
    </div>
</template>

<script>
import CombinePositionCard from "@/components/CombinePositionCard.vue";
import CombinePositionOrder from "@/components/CombinePositionOrder.vue";
export default {
	props: [],
	data() {
		return {
			/** 當前展開哪個商品 (各商品展開互斥) */
			expandSid: "",
			selectedCpd: {},
        }
	},
	mounted() {},
	methods: {
		// 建构组合
		onCombinePostion(){
			eventBus.$emit("POPUP-DIALOG", CombinePositionOrder, {"type": 'combine'}, {transName: 'float'});
		},
		onRefresh() {
			M4C.Position.queryPositionSum();
		},
		// 拆開多方組合持倉
		splitBuyCpd(cpd) {
			let cloneCpd = this.$disObserver(cpd);
			// 每手保證金
			let preMargin = this.$safeFloat(cloneCpd.TOTAL_MARGIN / (cloneCpd.$BQTY + cloneCpd.$SQTY));
			cloneCpd.$SQTY = 0;
			cloneCpd.$COMPOSITE_QTY = cloneCpd.$NET_QTY = cloneCpd.$BQTY;
			// 計算空方佔用保證金(尚未驗證)
			cloneCpd.TOTAL_MARGIN = preMargin * cloneCpd.$BQTY;
			return cloneCpd;
		},
		// 拆開空方組合持倉
		splitSellCpd(cpd) {
			let cloneCpd = this.$disObserver(cpd);
			// 每手保證金
			let preMargin = this.$safeFloat(cloneCpd.TOTAL_MARGIN / (cloneCpd.$BQTY + cloneCpd.$SQTY));
			cloneCpd.$BQTY = 0;
			cloneCpd.$NET_QTY = -cloneCpd.$SQTY;
			cloneCpd.$COMPOSITE_QTY = cloneCpd.$SQTY;
			// 計算空方佔用保證金(尚未驗證)
			cloneCpd.TOTAL_MARGIN = preMargin * cloneCpd.$SQTY;
			return cloneCpd;
			M4C.Position.queryPositionSum();
		},
		isDisableSplit(cpd){
			let cpd1 = cpd.COMPOSITE_LIST[0];
			let exgId = M4C.Symbol.getExchangeName(cpd1.SYMBOL);
			let supportSplitExg = ['DCE', 'SZSE', 'SSE'];	// 有支援的交易所
			// 不支援組拆的策略代碼 或 不支援的交易所。
			return Number(cpd.STRATEGY) <= 0 || (supportSplitExg.indexOf(exgId) < 0);
		},
		/** 拆分组合 */
		onBtnSplit(cpd) {
			eventBus.$emit("POPUP-DIALOG", CombinePositionOrder, {"type": 'split', "data": cpd}, {transName: 'float'});
		},
		/** 組合持倉右鍵選單 */
		onContextMenu(cpd) {
			this.selectedCpd = cpd;
			let self = this;
			this.contextmenu.pop({
				list: [
					// 建構組合
					{'icon': 'lock', 'label': '建构组合', onclick: ()=>{self.onCombinePostion()}},
					// 拆分
					this.isDisableSplit(cpd)? "null": {'icon': 'lock_open', 'label': '拆分', onclick: ()=>{self.onBtnSplit(cpd)}},
				],
				param: this.sid,
			});
			// 清除已選擇組合持倉
			setTimeout(() => {
				self.selectedCpd = {};
			}, 100);
		},
	},
	watch: {
		/** 组合持倉變化時要重設 expandSid (以免平倉的下一列的商品被展開) */
		combinePositionList(nv, ov) {
			this.expandSid = "";
		}
	},
	computed: {
		contextmenu() {
			return this.$store.state.desktop.contextmenu;
		},
		/** 组合持倉資料(TYPE:1=>組合, STATUS:New=>執行成功) */
		combinePositionList() {
			let list = [];
			this.$store.state.data.compositePositionSumList.forEach(cpd => {
				// 部分組合持倉會有多空併存情形(如白糖期權)。需要分開顯示。
				if(cpd.$BQTY > 0 && cpd.$SQTY > 0) {
					list.push(this.splitBuyCpd(cpd));
					list.push(this.splitSellCpd(cpd));
				}
				// 買賣其中有一方大於0才塞，都是0不加到清單
				else if(cpd.$BQTY > 0 || cpd.$SQTY > 0){
					list.push(cpd);
				}
			});
			return list;
		},
		/** 持倉匯總資料 */
		positionSumList() {
			return this.$store.state.data.normalPositionSumList;
		},
		// 持倉匯總查詢回報結果
		queryPositionSumResult() {
			return this.$store.state.result.queryPositionSumResult;
		},
		/** 狀態章 */
		stampStatus() {
			return this.queryPositionSumResult.$STATUS;
		},
		$disObserver(){return this.$store.state.fn.$disObserver;},
		isDesktop() {return this.$store.state.device.isDesktop;},
		isSelectedCpd() {
			return this.selectedCpd.$IS_COMPOSITE !== undefined;
		}
	},
	components: {
		CombinePositionCard,
		CombinePositionOrder,
	},
}
</script>

<style>
.combine-position-card-list-ctn .head {
	height: 10vw;
	/* border-bottom: 1px solid #575C61; */
}
.combine-btn {
	padding: 0 12vw;
}
.combine-position-card-ctn:nth-child(even){
	background-color: #000B18;
}
/* 寬度設定 */
.combine-position-card-list-ctn .cell0 {width: 10vw; max-width: 10vw;}
.combine-position-card-list-ctn .cell1 {width: 11vw; max-width: 11vw;}
.combine-position-card-list-ctn .cell2 {width: 24vw; max-width: 24vw;}

.desktop .combine-btn {
	padding: 0 0.4em;
	width: 4em;
}
.desktop .combine-position-card-list-ctn .head {
	height: 2em;
}
.desktop .combine-position-card-ctn:hover {
    background-color: #333F5A;
}
/* 寬度設定 */
.desktop .combine-position-card-list-ctn .cell0 {width: 4em; max-width: 4em;}
.desktop .combine-position-card-list-ctn .cell1 {width: 4.4em; max-width: 4.4em;}
.desktop .combine-position-card-list-ctn .cell2 {width: 9.6em; max-width: 9.6em;}
</style>