<template>
    <div class="report-card-list-ctn flex-col">
		<div class="flex-row head sys-bgc zindex-1 font-size-small pdlr2">
			<div class="cell0 flex-center" @click="checkAll=!checkAll" :class="{'disable-ui': !allAvailableRptList.length}">
				<i class="material-icons">{{checkAll?'check_box': 'check_box_outline_blank'}}</i>
			</div>
			<div class="flex-start flex-1">{{$ln(`策略`)}}</div>
			<div class="cell2 flex-center">{{$ln(`委/成/删`)}}</div>
			<div class="cell1" />
			<div class="cell3 flex-end">{{$ln(`状态`)}}</div>
		</div>
		<div class="flex-1 posr font-size-small" v-stop-propagation-y>
			<ScrollBounce ref="sb" class="FULL" :refresh="true" @refresh="onRefresh" :status="stampStatus">
				<reportCard class="report-working-card-ctn pdlr2" v-for="(rpt, i) in reportList" :subOrderMapList="subOrderMapList"
					:key="`reportCard-${i}`" :rpt="rpt" @onChecked="onChecked" :deleteCheckList="deleteCheckList"/>
				<Stamp v-if="reportList.length===0" :stampStatus="stampStatus" />
			</ScrollBounce>
		</div>
		<div class="flex-row flex-center pdtb3">
			<Button class="btn btn-delete-all w50vw rd6 clr-white" :class="{disabled: !availableReportList.length}" @click="onBtnDeleteAll">{{$ln('删除已选取委托')}}</Button>
		</div>
    </div>
</template>

<script>
import ReportCardListFn from '@/components/ReportCardListFn';
import reportCard from "./reportCard.vue";

export default {
	mixins: [ReportCardListFn],
	props: ["param"],
	data() {
		return {
			checkAll: false,
			// 刪單列表
			deleteCheckList: [],
        }
	},
	methods: {
		// 刪除已選取委託。
		onBtnDeleteAll() {
			if(this.deleteCheckList.length){
				for(let i = 0; i < this.deleteCheckList.length; i++){
					let key = this.deleteCheckList[i];
					let orderInfo = {
						'ACTION': 'CANCEL',			// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
						'REPORT_ID': key,
						'AP_PLUGIN': this.useComName || this.selfComName,
					}
					M4C.Order.sendOrder(orderInfo);
				}
				this.deleteCheckList = [];
			}
		},
		// 勾選項目
		onChecked(rptKeyList) {
			rptKeyList.forEach(rKey=>{
				let idx = this.deleteCheckList.indexOf(rKey);
				if(idx < 0) 
					this.deleteCheckList.push(rKey);
				else 
					this.deleteCheckList.splice(idx, 1);
			});			
		},
		// 重查
		onRefresh() {
			M4C.Report.queryReport();
		},
	},
	watch: {
		deleteCheckList(nv) {
			if(nv.length == 0){
				this.checkAll = false;
			}
			if(nv.length == this.allAvailableRptList.length)
				this.checkAll = true;
		},
		// 全部勾選or取消(有效委託)
		checkAll(nv) {
			if(nv) {
				this.deleteCheckList =  [];
				this.availableReportList.forEach(rpt => {
					// 母單未完全成交時也加到刪單清單中
					if(rpt.$AVAILABLE_QTY > 0)
						this.deleteCheckList.push(rpt.ORDER_ID);
					let subList = this.subOrderMapList[rpt.ORDER_ID];
					// 如果有子委託，取子委託的編號
					if(subList) {
						subList.filter(r=>(r.$AVAILABLE_QTY)).forEach(r=>{
							this.deleteCheckList.push(r.key);
						});
					}
				});
			}
			else 
				this.deleteCheckList = [];
		},
		param(nv){
			if(nv == "available")
				this.$emit('title', $ln('有效'));
			else 
				this.$emit('title', $ln('全部'));
		}
	},
	computed: {
		reportList() {
			if(this.param == "available")
				return this.availableReportList;
			else 
				return this.allReportList;
		},
		// 子委託map表
		subOrderMapList() {
			let self = this;
			let subList =  [];
			this.$store.state.data.orderReportList.forEach((rpt, idx)=>{
				let symbol = rpt.$IS_OCO? rpt.OCO[0].SYMBOL: rpt.SYMBOL;
				if(symbol == self.$store.state.selectedSymbol.ID && rpt.MAIN_ORDER_ID)
					subList.push(rpt);
			});
			let obj = {};
			let subOrderMap = subList.reduce((obj, rpt) => {
				if(!obj[rpt.MAIN_ORDER_ID])
					obj[rpt.MAIN_ORDER_ID] = [];
				obj[rpt.MAIN_ORDER_ID].push(rpt);
				return obj;
			}, obj = {});
			return subOrderMap;
		},
		/** 所有委託回報 */
		allReportList() {
			let self = this;
			return this.$store.state.data.orderReportList.filter((rpt)=>{
				let symbol = rpt.$IS_OCO? rpt.OCO[0].SYMBOL: rpt.SYMBOL;
				let isMatch = symbol == self.$store.state.selectedSymbol.ID && !rpt.MAIN_ORDER_ID;
				// 複式權委託
				let isComposite = rpt.SYMBOL2;
				// 觸A下B
				let isABorder = rpt.MARKET_WATCH;
				// 過濾回報
				return isMatch && !isComposite && !isABorder;
			});
		},
		/** 所有有效委託回報 */
		availableReportList() {
			return this.allReportList.filter(rpt => {
				// 母委託有有效量時直接回true
				if(rpt.$AVAILABLE_QTY > 0) return true;
				// 有子委託時看子委託總有效量
				else {
					let subList = this.subOrderMapList[rpt.ORDER_ID];
					let sum = 0;
					// 如果有子委託，取子委託的有效量判斷
					let subAvailableQty = subList? subList.reduce((sum, r)=>{
						return sum += Number(r.$AVAILABLE_QTY);
					}, sum=0): 0;
					return subAvailableQty > 0;
				}
			});
		},
		// 該商品的所有有效委託清單
		allAvailableRptList() {
			let self = this;
			return this.$store.state.data.availableReportList.filter((rpt)=>{
				let symbol = rpt.$IS_OCO? rpt.OCO[0].SYMBOL: rpt.SYMBOL;
				let isMatch = symbol == self.$store.state.selectedSymbol.ID;
				// 複式權委託
				let isComposite = rpt.SYMBOL2;
				// 觸A下B
				let isABorder = rpt.MARKET_WATCH;
				// 過濾回報
				return isMatch && !isComposite && !isABorder;
			});
		},
		stampStatus() {
			return this.$store.state.result.queryReportResult.$STATUS;
		},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
	},
	components: {
		reportCard,
	},
}
</script>

<style>
.report-card-list-ctn .head {
	height: 10vw;
	border-bottom: 1px solid #575C61;
}
.report-card-list-ctn .btn-delete-all{
	background-color: #006D75;
}
/* 寬度設定 */
.report-card-list-ctn .cell0 {width: 10vw; max-width: 10vw;}
.report-card-list-ctn .cell1 {width: 5vw; max-width: 5vw;}
.report-card-list-ctn .cell2 {width: 17vw; max-width: 17vw;}
.report-card-list-ctn .cell3 {width: 18vw; max-width: 18vw;}
.report-card-list-ctn .cell4 {width: 30vw; max-width: 30vw;}
.desktop .report-card-list-ctn .head {height: 2em;}
.desktop .report-card-list-ctn .cell0 {width: 2em; max-width: 2em;}
.desktop .report-card-list-ctn .cell1 {width: 1em; max-width: 1em;}
.desktop .report-card-list-ctn .cell2 {width: 4em; max-width: 4em;}
.desktop .report-card-list-ctn .cell3 {width: 4em; max-width: 4em;}
.desktop .report-card-list-ctn .cell4 {width: 6em; max-width: 6em;}
.desktop .btn-delete-all {width: 10em;}
.disable-ui {
	pointer-events: none;
	color: gray;
}
</style>