<template>
	<div class="list-by-time-ctn flex-col">
		<div class="list-by-time-symbol flex-center pdtb1" v-if="isDesktop">{{symbolName}}</div>
		<DesktopFlashTable :list="tickList" :headconf="columns" :bodyconf="bodycolumns" v-stop-propagation-y/>
		<!-- 狀態章 -->
		<Stamp v-if="listByTimeList.length===0" :stampStatus="stampStatus" :ignoreLogin="true"/>
	</div>
</template>
<script>
import QuoteAgent from '@/components/QuoteAgent';
import DesktopFlashTable from '@/components/DesktopFramework/DesktopFlashTable.vue';
export default {
	mixins: [QuoteAgent],
	data(){
		return {
			listByTimeList: [],
			stampStatus: "QUERY",
		}
	},
	beforeMount() {
		// 取得最近n個歷史交易日的資料帶入n=1 取得當前交易日的資料 https://trello.com/c/b4jCC79n/
		M4C.ChartData.subQuery(this, this.sid, 't', '' , '', 1);
	},
	beforeDestroy() {
		M4C.ChartData.unsub(this, this.sid, 't', '', '', 1);
	},
	mounted() {
		/* 
			分時明細的做法: 回補history data後，再append即時行情資料。
		*/
		let self = this;
		this.onChartData = (sid, chartData, timeKeyList, byRealTimeTick, queryErrCode) => {
			if (sid != this.sid) return;			
			// 回補時清資料。
			if(!byRealTimeTick){
				this.listByTimeList.splice(0);
			}
			for(let idx in chartData){
				let tick = chartData[idx];
				this.listByTimeList.push(tick);
				let t9 = `${tick.t}`.addZero(9);
				tick.sortKey = `${tick.d}${t9}`;
			}
			// 依時間排序
			this.listByTimeList.sort((a,b)=>{return Number(b.sortKey) - Number(a.sortKey)});
			// 處理資料
			this.processData();
			// 查詢完成
			this.onQueryFinished();
		};
		// 查詢收到cd小於0
		this.onChartError = (sid, errCode) => {
			if (errCode === -24) {
				this.onQueryFinished();
			}
		}
		
		// 10秒查詢timeout
		this.queryTimeout = setTimeout(()=>{
			self.stampStatus = "DONE";
			self.isRestore = true;
		}, 9988);
	},
	methods: {
		processData(){
			console.log('listByTimeList length', this.listByTimeList.length);
			for(let i = 0 ;i < this.listByTimeList.length; i++) {
				let tick = this.listByTimeList[i];
				// 加入持倉量變化資料
				if(!tick.$oichange) {
					let preTick = this.listByTimeList[i+1];
					// 無資料帶入'--'
					if(tick.oi === undefined || preTick === undefined) tick.$oichange = '--';
					// 當前持倉量變化 = 當前持倉量 - 前一持倉量。
					else{
						let preOi = preTick.oi;
						let diffOi = tick.oi - preOi;
						tick.$oichange = diffOi;
					}
				}
			}
		},
		tickTime(t) {
			if(twMode)
				return typeof t === "number"? new Date().resetTimetoMS(t).time11():"";
			else
				return typeof t === "number"? new Date().resetTimetoMS(t).time8():"";
		},
		$clr0(v) {return this.$store.state.fn.$clr0(v);},
		qClass(tick) {
			//現量欄位顏色邏輯:成交價=買價時為綠色；成交價=賣價時為紅色；若不等於買賣價則=原本顏色
			if(tick.p == tick.bp1) return 'clr-dn';
			else if(tick.p == tick.sp1) return 'clr-up';
		},
		getP(tick) {
			// 價位處理，除了補小數位數外，如果沒價位資料就回空字串。
			return !tick.p ? '' : this.$updatePrice(this.sid, tick.p);
		},
		getQ(tick) {return tick.q;},
		getOIClass() {return 'clr-orange2'},
		getOIDiff(tick, preTick){
			if((!tick.oi && tick.oi !== 0) || !preTick) return '--';
			return tick.oi - preTick.oi;
		},
		getPriceColColor(tick) {
			if(this.twMode) {
				// 台灣版改以參考價決定顯示顏色
				return this.$clr0(tick.p - this.qo.r);
			}
			else {
				// 有兩筆以上資料才判斷漲跌
				if(this.listByTimeList.length > 1)
					return this.$clr0(this.listByTimeList[0].p - this.listByTimeList[1].p);
				else return "";
			}
		},
		onQueryFinished() {
			// 清除查詢timeout(如果有的話)
			if(this.queryTimeout)
				clearTimeout(this.queryTimeout);
			// 結束loading
			this.stampStatus = "DONE";
			// 設定回補完成
			this.isRestore = true;
		},
	},
	computed: {
		isDesktop() {return this.$store.state.device.isDesktop;},
		today() {return new Date().day10().replaceAll('/', '');},
		tickList(){
			return this.listByTimeList;
		},
		sid() {return this.$store.state.selectedSymbol.ID;},
		symbolName() {return M4C.Symbol.getCNameCIDM4(this.sid)},
		// flashtable thead設定
		columns() {
			let columnList = [
				{label: '时间', align: 'center'},
				{label: '价位', align: 'center'},
				{label: '现手', align: 'center'},
				{label: '增仓', align: 'center'},
			];
			if(this.twMode) {
				// 台灣版增倉要改為總量
				columnList[3].label = '总量';
			}
			return columnList;
		},
		// flashtable tbody設定
		bodycolumns() {
			let columnList = [
				{key: 't', align: 'center', ctnFn: this.tickTime},
				{ctnFn: this.getP, align: 'center', classFn: this.getPriceColColor},
				{ctnFn: this.getQ, align: 'center', classFn: this.qClass},
				{key: '$oichange', align: 'center', classFn: this.getOIClass},
			];
			if(this.twMode) {
				// 台灣版增倉要改為總量
				columnList[3].key = 'v';
			}
			return columnList;
		},
		// 價格補小數位數
		$updatePrice() {return this.$store.state.fn.$updatePrice;},
		twMode() {
			return this.$store.state.config.twMode;
		},
	},
	watch: {
		qo: {
			handler(nv, ov){
				// console.log("watch qo", nv.t, nv.p);
				// 新增分時明細(有現量且現量不等於前一tick現量且總量不等於前一tick總量，台灣版指數商品有價無量，所以台灣版不判斷現量、總量)
				let isNew = (nv && this.tickList && this.tickList[0] && nv.q && this.tickList[0].q !== nv.q && nv.v !== this.tickList[0].v) || (this.isRestore && this.twMode);
				// 無資料情境(回補完成且tick數量是0)
				let isNoData = this.isRestore && this.tickList.length == 0;
				let preV = this.listByTimeList[0] ? this.listByTimeList[0].v : null;
				if(isNoData || isNew){
					// 總量一樣的話，只顯示相同總量的第一筆
					if(preV== nv.v) return ;
					// 建立新tick資料。
					// t 分時明細應使用成交時間，有mt先使用沒有再用t
					let tick = {d: nv.d, t: nv.mt || nv.t , bp1: nv.bp1, sp1: nv.sp1, p: nv.p, c: nv.c, q: nv.q, v: nv.v, oi: nv.oi, yoi: nv.yoi, $oichange: this.getOIDiff(nv, this.tickList[0])};
					this.tickList.splice(0, 0, tick);
				}
			},
			deep: true,
		},
		sid(nv, ov){
			if(ov && nv != ov){
				// 清空舊資料
				this.listByTimeList.splice(0);
				this.stampStatus = "QUERY";
				M4C.ChartData.unsub(this, ov, 't', this.today);
				M4C.ChartData.sub(this, nv, 't', this.today);
			}
		}
	},
	components: {
		DesktopFlashTable,
	},
}
</script>