<template>
    <div class="warrant-ctn flex-col">
		<div class="block1 flex-col mglr5 pd3">
			<div class="w100p flex-row mgt3">
				<div class="flex-start left-label font-size-small clr-gray">{{$ln(`标的`)}}</div>
				<div class="flex-1 pdr3"><SingleSelect :options="underlyingSList" v-model="underlyingSID" /></div>
			</div>
			<div class="w100p flex-row mgt5">
				<div class="flex-start left-label font-size-small clr-gray">{{$ln(`可锁定`)}}</div>
				<div class="flex-1 flex-center number-ctn mgr3">{{availLockQty}}</div>
			</div>
			<div class="w100p flex-row mgt5">
				<div class="flex-start left-label font-size-small clr-gray">{{$ln(`可解锁`)}}</div>
				<div class="flex-1 flex-center number-ctn mgr3">{{availUnLockQty}}</div>
			</div>
			<div class="w100p flex-row mgt5">
				<div class="flex-start left-label font-size-small clr-gray">{{$ln(`数量`)}}</div>
				<input class="flex-1 mgr3 input-qty font-size-big" type="number" v-model="qty" min="1" step="1" oninput="this.value=this.value.replace(/[^\d]/,'')" />
			</div>
			<div class="flex-row mgt5 flex-center">
				<Button class="ht4 rd6 tcef mgr2 btn-unlock" @click="onClickLock('UNLOCK')">解锁</Button>
				<Button class="ht4 rd6 tcef mgl2 btn-lock" @click="onClickLock('LOCK')">锁定</Button>
			</div>
		</div>
		<div class="flex-1 posr mgt3">
			<WarrantTable class="FULL" :positionLockReportList="positionLockReportList" @refresh="onRefresh" />
			<Stamp v-if="noData" :stampStatus="stampStatus" />
		</div>
		<LoadingIcon v-if="isLoading"/>
    </div>
</template>

<script>
import WarrantTable from "@/components/WarrantTable.vue";

export default {
	props: [],
	data() {
		return {
			/** 數量 */
			qty: 1,
			/** 所選標的代碼 */
			underlyingSID: "",
		}
	},
	beforeMount() {
		this.$emit('title', '备兑锁定与解锁');
		// 查詢可備兌商品及備兌紀錄列表
		M4C.Warrant.getPositionLockSymbolList();
		M4C.Warrant.getPositionLockReportList();
	},
    mounted() {},
	beforeDestroy() {},
	components: {
		WarrantTable,
	},
    methods: {
		onClickLock(type) {
			this.$store.state.notify(`${type === "LOCK" ? "锁定" : "解锁"} ${this.underlyingName} 数量 ${this.qty}`);
			M4C.Warrant.lock(this.underlyingSID, type, Number(this.qty));
		},
		onRefresh() {
			M4C.Warrant.refresh();
		},
	},
	watch: {
		underlyingSID(nv) {
			// 查詢可鎖定 / 可解鎖
			M4C.Warrant.getPositionLockCount(nv)
		},
		// 可備兌商品查詢
		querySymbolResult(nv) {
			if(nv.$CD < 0 && nv.$STATUS !== 'QUERY')
				this.$store.state.notify(`${this.$ln('可备兑商品查询失败')}(${nv.$CD})`);
		},
		// 備兌記錄查詢
		queryReportResult(nv) {
			if(nv.$CD < 0 && nv.$STATUS !== 'QUERY')
				this.$store.state.notify(`${this.$ln('备兑记绿查询失败')}(${nv.$CD})`);
		},
		// 備兌數量查詢
		queryCountResult(nv) {
			if(nv.$CD < 0 && nv.$STATUS !== 'QUERY')
				this.$store.state.notify(`${this.$ln('备兑数量查询失败')}(${nv.$CD})`);
		},
	},
    computed: {
		/** 可鎖定數量 */
		availLockQty() {
			if (this.queryCountResult.$STATUS == 'QUERY')
				return this.$ln(`查询中`);
			else if(this.queryCountResult.$STATUS == 'FAIL' || this.queryCountResult.$CD < 0)
				return this.$ln(`查询失败`);
			// 與狀態分開判斷是因為鎖定與解鎖時會延遲重查數量，但會先設定數量為-999
			else if (this.count.QTY === -999)
				return this.$ln(`查询中`);
			else if (this.count.QTY === -1)
				return this.$ln(`无资料`);
			else
				return this.count.QTY;
		},
		/** 可解鎖數量 */
		availUnLockQty() {
			if (this.queryCountResult.$STATUS == 'QUERY')
				return this.$ln(`查询中`);
			else if(this.queryCountResult.$STATUS == 'FAIL' || this.queryCountResult.$CD < 0)
				return this.$ln(`查询失败`);
			else if (this.count.QTY === -999)
				return this.$ln(`查询中`);
			else if (this.count.UNLOCK_QTY === -1)
				return this.$ln(`无资料`);
			else
				return this.count.UNLOCK_QTY;
		},
		/** 標的物列表 */
		underlyingSList() {
			return this.positionLockSymbolList.map((sid)=>{
				return {value: sid, label: M4C.Symbol.getContractName(sid)};
			});
		},
		/** 查詢中 */
		isLoading() {
			return this.querySymbolResult.$STATUS == "QUERY" || this.queryReportResult.$STATUS == "QUERY";
		},
		/** 標的商品名稱 */
		underlyingName() {
			return M4C.Symbol.getContractName(this.underlyingSID);
		},
		/** 狀態章 */
		stampStatus() {
			return this.isLoading ? "QUERY" : "EMPTY";
		},
		/** 是否無資料 */
		noData() {
			return this.positionLockReportList.length === 0 ? true : false;
		},
		/** 可備兌商品列表 */
		positionLockSymbolList() {return M4C.Warrant.positionLockSymbolList;},
		/** 備兌紀錄列表 */
		positionLockReportList() {return M4C.Warrant.positionLockReportList;},
		/* 可鎖定 / 可解鎖 */
		count() {return M4C.Warrant.count},
		/** 可備兌商品查詢結果 */
		querySymbolResult() {return M4C.Warrant.querySymbolListResult;},
		/** 備兌紀錄列表查詢結果 */
		queryReportResult() {return M4C.Warrant.queryReportListResult;},
		/** 可鎖定 / 可解鎖 查詢結果*/
		queryCountResult() {return M4C.Warrant.queryLockCountResult;},
	},
}
</script>

<style scoped>
.block1 {
	border-top: 2px solid #54575B;
}
.left-label {
	width: 30vw;
}
.number-ctn {
	height: 9vw;
	color: black;
	background-color: #AAA;
	border-radius: 2vw;
}
.input-qty {
	width: 100%;
	height: 8vw;
	border-radius: 2vw;
	text-align: center;
}
.btn-lock {
	width: 120px;
	color: white;
	background-color: #F5A623;
}
.btn-unlock {
	width: 120px;
	color: white;
	background-color: #F5A623;
}

/** 桌機版 */
.desktop .block1 {
	border-top: 0;
}
.desktop .left-label {
	width: 6em;
}
.desktop .number-ctn {
	height: 1.8em;
	border-radius: 0.4em;
}
.desktop .input-qty {
	height: 1.6em;
	border-radius: 0.4em;
}
</style>