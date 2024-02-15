<template>
	<div class="FULL flex-col scioptchart-ctn">
		<SciChart ref="sciChart" class="flex-1" :param="sciChartParam" :key="sciChartKey" @reload="reloadSciChart()" />
	</div>
</template>

<script>
import SciChart from '@/components/SciChart/SciChart';
import SciOptIVLine from '@/components/SciOptChart/SciOptIVLine';

export default {
	components: {SciChart, SciOptIVLine},
	props: ['colorList'],
	data() {
		return {
			sciChartKey: "".random(),
            // 啟用十字線
            enableCross: false,
			// SciChart 參數
			sciChartParam: {
				// 分割區列表
				partitionList: [
					{
						class: 'flex-2',
						labelPrecision: 'DECIMAL_LENGTH',
						idcList: [],
						strikeList: [],
					},
				],
				callback: {
					// onTouchStart: this.onTouchStart,
					onTouchMove: this.onTouchMove,
					// onTouchEnd: this.onTouchEnd,
				},
			},
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {},
	methods: {
		reloadSciChart() {
			this.sciChartKey = "".random();
		},
    },
	watch: {
		// 勾選清單改變時重建線圖
		itemList: {
			handler(nv, ov) {
				this.sciChartParam.partitionList[0].idcList.splice(0);
				nv.forEach((s, idx) => {
					this.sciChartParam.partitionList[0].idcList.splice(idx, 1, {component: SciOptIVLine, symbol: s, color: this.colorList[idx]});
				});
				this.sciChartKey = "".random();
			},
			deep: true,
		},
		// 履約價匯整清單改變時重設x軸
		strikeList(nv, ov) {
			this.sciChartParam.partitionList[0].strikeList = nv;
		}
	},
	computed: {
		// sciChart期權勾選清單
		itemList() {return this.$store.state.data.scichartOptionList;},
		// 波動率曲線資料
		smileCurveData() {return M4C.ChartData.smileCurveData;},
		// 波動率曲線資料匯整
		collectionChartData() {
			let list = [];
			this.itemList.forEach(item=>{
				if(this.smileCurveData && this.smileCurveData[item])
					list.push(this.smileCurveData[item].data);
			})
			return list;
		},
		// 履約價匯整清單(排序)
		strikeList() {
			let list = [];
			this.collectionChartData.forEach(data=>{
				let _strikeList = Object.keys(data);
				list = Array.from(new Set([...list.concat(_strikeList)]));
			});
			return list.sort((a,b) => (Number(a)-Number(b)));
		}
	},
}
</script>

<style scoped>
.cross-btn {
	position: absolute;
	top: 2px;
	right: 60px;
}
.cross-btn.selected {
	color: yellow;
}
.sec-tab:nth-child(1) {
	border-right: 1px solid gray;
}
.sec-tab.selected {
	color: yellow !important;
}
/** 標籤style設定 */
.scioptchart-ctn /deep/ .tickinfo {
	min-width: 7em;
}
.scioptchart-ctn /deep/ .scichart-vue .tick-info-2 {
	top: 30px;
	right: 2px;
}
.scioptchart-ctn /deep/ .scichart-vue .tick-info-3 {
	top: 44px;
	right: 2px;
}
.scioptchart-ctn /deep/ .scichart-vue .tick-info-4 {
	top: 58px;
	right: 2px;
}
.scioptchart-ctn /deep/ .scichart-vue .tick-info-5 {
	top: 72px;
	right: 2px;
}
.scioptchart-ctn /deep/ .scichart-vue .tick-info-6 {
	top: 86px;
	right: 8em;
}
.scioptchart-ctn /deep/ .scichart-vue .tick-info-7 {
	top: 90px;
	right: 8em;
}
.scioptchart-ctn /deep/ .scichart-vue .tick-info-8 {
	top: 104px;
	right: 8em;
}
.scioptchart-ctn /deep/ .scichart-vue .tick-info-9 {
	top: 118px;
	right: 8em;
}
.scioptchart-ctn /deep/ .scichart-vue .tick-info-10 {
	top: 132px;
	right: 8em;
}
.scioptchart-ctn /deep/ .scichart-vue .tick-info-11 {
	top: 146px;
	right: 8em;
}
</style>