<template>
    <div class="combine-report-card-list-ctn flex-col flex-1">
		<div class="flex-row head clr-gray font-size-small pdr2" v-if="!isDesktop">
			<div class="cell0" />
			<div class="flex-center cell1">{{$ln(`合约`)}}</div>
			<div class="flex-1 flex-center">{{$ln(`状态/策略`)}}</div>
			<div class="cell2 flex-center">{{$ln(`数量/时间`)}}</div>
		</div>
		<div class="flex-1 posr font-size-little" v-if="!isDesktop">
			<ScrollBounce class="FULL" :refresh="true" @refresh="onRefresh">
				<CombineReportCard class="" v-for="(cpd, i) in combinePositionList" :key="`CombinePositionCardList-${i}`"
					:combinePositionData="cpd" @onExpand="sid => expandSid = sid" :expandSid="expandSid"/>
				<Stamp v-if="combinePositionList.length===0" :stampStatus="stampStatus" />
			</ScrollBounce>
		</div>
		<div class="flex-row bgc-desktop-head clr-gray font-size-small" v-if="isDesktop">
			<div class="flex-center cell2">{{$ln(`时间`)}}</div>
			<div class="flex-start flex-1 contracts-ctn">{{$ln(`合约`)}}</div>
			<div class="flex-end cell1">{{$ln(`单号`)}}</div>
			<div class="flex-center cell2">{{$ln(`状态`)}}</div>
			<div class="flex-center cell2">{{$ln(`策略`)}}</div>
			<div class="flex-center cell2">{{$ln(`数量`)}}</div>
			<div class="flex-center cell1">{{$ln(`备注`)}}</div>
		</div>
		<div class="flex-1 posr font-size-little" v-if="isDesktop">
			<CombineReportCard class="" v-for="(cpd, i) in combinePositionList" :key="`CombinePositionCardList-${i}`"
				:combinePositionData="cpd" @onExpand="sid => expandSid = sid" :expandSid="expandSid"/>
			<Stamp v-if="combinePositionList.length===0" :stampStatus="stampStatus" />
		</div>
    </div>
</template>

<script>
import CombineReportCard from "@/components/CombineReportCard.vue";
export default {
	props: [],
	data() {
		return {
			/** 當前展開哪個商品 (各商品展開互斥) */
			expandSid: "",
			combinePositionQuery: [],
        }
	},
	mounted() {
		M4C.CombinePosition.queryCombinePosition();
	},
	methods: {
		onRefresh() {
			M4C.CombinePosition.reloadCombinePosition();
		}
	},
	watch: {
		/** 组合持倉變化時要重設 expandSid (以免平倉的下一列的商品被展開) */
		combinePositionList(nv, ov) {
			this.expandSid = "";
		}
	},
	computed: {
		/** 组合持倉資料 */
		combinePositionList() {
			let list = M4C.CombinePosition.getCombinePositionList().sort((a, b) => {
				let aTime = a.RECEIVE_TIME? Date.parse(a.RECEIVE_TIME): a.RECEIVE_TIME;
				let bTime = b.RECEIVE_TIME? Date.parse(b.RECEIVE_TIME): b.RECEIVE_TIME;
				let difftime = (bTime - aTime)
				let diffId = b.APPLY_ID > a.APPLY_ID? 1: -1
				return difftime + diffId;
			});
			return list;
		},
		// 查詢組合持倉回報結果
		queryCombineReportResult() {
			return this.$store.state.result.queryCombineReportResult;
		},
		/** 狀態章 */
		stampStatus() {
			return this.queryCombineReportResult.$STATUS;
		},
		isDesktop() {return this.$store.state.device.isDesktop;},
	},
	components: {
		CombineReportCard,
	},
}
</script>

<style>
.combine-report-card-list-ctn .head {
	height: 10vw;
	border-bottom: 1px solid #575C61;
}
.combine-btn {
	padding: 0 12vw;
}
/* 寬度設定 */
.combine-report-card-list-ctn .cell0 {width: 10vw; max-width: 10vw;}
.combine-report-card-list-ctn .cell1 {width: 31vw; max-width: 31vw;}
.combine-report-card-list-ctn .cell2 {width: 20vw; max-width: 20vw;}
.combine-report-card-list-ctn .cell3 {width: 20vw; max-width: 20vw;}

.desktop .combine-btn {
	padding: 0 0.4em;
	width: 4em;
}
.desktop .combine-report-card-list-ctn .head {
	height: 2em;
}
.desktop .combine-report-card-ctn:hover {
    background-color: #333F5A;
}
/* 寬度設定 */
.desktop .contracts-ctn {min-width: 12.4em;}
.desktop .combine-report-card-list-ctn .cell0 {min-width: 4em; max-width: 4em;}
.desktop .combine-report-card-list-ctn .cell1 {min-width: 12.4em; max-width: 12.4em;}
.desktop .combine-report-card-list-ctn .cell2 {min-width: 8em; max-width: 8em;}
.desktop .combine-report-card-list-ctn .cell3 {min-width: 8em; max-width: 8em;}
</style>