<template>
    <div class="quote-table-X-list-ctn font-size-small FULL flex-item" :class="{'column-style': column,'quote-table-X-list-large':largeSize}">
		<div class="FULL scrolling-y flex-col" @touchstart.stop="" @touchmove.stop="" @touchend.stop="" v-press="onPress" v-if="!column || mode == 1">
			<div class="thead fixed-thead flex-row overflow-x-auto pdtb1">
				<div class="thead-fixed-x-ctn text-align-left th flex-row flex-start" :class="{'thead-fixed-x-large':largeSize}" v-if="!noFixed">
					<!-- 展開圖示 -->
					<div class="flex-center expand-btn opacity0 pointer-events-none" v-if="showExpand">
						<i class="material-icons" @click.stop="onBtnExpand" @touchstart.stop="" @touchend.stop="">arrow_drop_down</i>
					</div>
					<CheckBox :value="checkList.length==sortedList.length" @input="onCheckAll" class="mglr2" v-if="checkItem"/>
					{{fixedTitle}}
				</div>
				<div class="thead-scroll-x-ctn flex-1 posr">
					<div class="FULL overflow-hidden" ref="table_th">
						<div class="flex-1 flex-row flex-end fit-content h100p">
							<div class="flex-row flex-end th pdlr1" v-for="(obj, key) in showList" :key="key" @click="onClickSort(obj)" v-if="!(column&&key==fixedIdx)">
								<span class="nowrap pdr2">{{$ln(obj.label || obj)}}</span>
								<i v-if="!column" class="material-icons font-size-small flex-bottom sort-icon" :class="{'opacity0': obj.key!=sortKey || sortKey === ''}">
									{{obj.noSort? '': sortIcon}}
								</i>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="tbody flex-col flex-1 posr">
				<ScrollBounce :refresh="!!column && mode!=1" >
					<div class="flex-1 thead flex-row posr">
						<div class="tbody-fixed-x-ctn text-align-left flex-col" :class="{'tbody-fixed-x-large':largeSize}" v-if="!noFixed">
							<QuoteTableXFixedTr v-for="(expandObj, id) in sortedList" :sid="expandObj.sid" :key="`${expandObj.sid}${id}`"
							:expandSid="expandSid" :propsExpand="expandSid===expandObj.sid" :fixedIdx="fixedIdx" @onExpand="onExpand" :expandObj="expandObj" :noExpand="!showExpand"
							:propsChecked="!!(checkList.find((li)=>{return li.sid==expandObj.sid}))" :checkItem="checkItem" @itemCheck="onItemCheck" :suspend="suspend" class="tr"
							:sortedList="sortedList"/>
						</div>
						<div class="tbody-scroll-x-ctn flex-1 posr">
							<div class="FULL overflow-x-auto flex-col" @scroll="onTdScroll" ref="table_td">
								<div class="flex-1 flex-col fit-content">
									<QuoteTableXScrollTr v-for="(expandObj, eid) in sortedList" :sid="expandObj.sid" :key="`${expandObj.sid}${eid}`" :noFixedLeft="noFixedLeft" :mode="mode"
									:column="scrollColumn" :fixedIdx="fixedIdx" @onExpand="onExpand" :expandObj="expandObj" :suspend="suspend" class="tr" :sortedList="sortedList" />
								</div>
							</div>
						</div>
					</div>
				</ScrollBounce>
			</div>
		</div>
		<!-- 歷史查詢顯示處理 -->
		<div class="FULL scrolling-y flex-col history-query" @touchstart.stop="" @touchmove.stop="" @touchend.stop="" v-press="onPress" v-if="column && mode != 1">
			<div class="thead fixed-thead flex-row overflow-x-auto pdtb1 bgc-333 divider-bottom">
				<div class="thead-scroll-x-ctn flex-1 posr">
					<div class="FULL overflow-hidden" ref="table_th">
						<div class="flex-1 flex-row flex-end fit-content h100p">
							<div class="nowrap w20vw th" v-for="(obj, key) in column" :key="key" :class="cellClass(obj)">
								{{$ln(obj['label'] || obj)}}
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="tbody flex-col flex-1 posr">
				<ScrollBounce :refresh="!!column" @refresh="onRefresh" @scroll="onTdScroll" ref="table_td">
					<table>
						<tr v-for="(expandObj, eid) in expandObjList" :key="eid">
							<td class="break-all" v-for="(obj, idx) in column" :key="idx"
							:class="cellTdClass(obj)"
							>{{getCellText(expandObj, obj, idx)}}</td>
						</tr>
					</table>
					<Stamp v-if="!expandObjList.length" :stampStatus="propsStatus" />
				</ScrollBounce>
			</div>
		</div>
    </div>
</template>

<script>
import QuoteTableXScrollTr from "@/components/QuoteTableXScrollTr.vue";
import QuoteTableXFixedTr from "@/components/QuoteTableXFixedTr.vue";
import SortSymbolList from "@/components/SortSymbolList.vue";

export default {
	mixins: [SortSymbolList],
	props: ["param", "suspend", "mode"],
	data() {
		return {
			expandSid: '',
			expandContracts: [],
			fixedIdx: 0,
			sortedList: [],
			checkAll: true,
		}
	},
	beforeMount() {},
    mounted() {
		// 未點選任何商品來產出頁表時，就點選閃電，取當前頁(前後頁 suspend) sortedList 給閃電標頭用
		if(!this.$store.state.status.curContractsList.length && !this.suspend) this.setList(this.sortedList);
		this.table_th = this.$refs.table_th;
		this.table_td = this.$refs.table_td;
	},
	beforeDestroy() {},
	components: {
		QuoteTableXScrollTr,
		QuoteTableXFixedTr,
	},
    methods: {
		onClickSort(obj) {
			if(!obj.noSort)
				this.onSort(obj);
		},
		onRefresh() {
			if(this.column) {
				this.$emit("refresh");
			}
		},
		onTdScroll(e) {
			let scrollLeft = e.currentTarget.scrollLeft;
			this.table_th.scrollLeft = scrollLeft;
		},
		/** 長按 */
		onPress(e) {
			let quoteTableTr = e.srcElement.closest('.quote-table-tr');
			let sid = quoteTableTr.getAttribute("sid");
			if(!sid) return;
			// 拖曳中情境時，關閉長按功能
			this.$store.commit("setSelectedSymbol", sid);
			// 準備關注合約列表
			this.setList(this.sortedList);
			eventBus.$emit("ORDER", {positionEffect: 'OPEN'});
		},
		/** 展開某合約 */
		onExpand(sid, moreContracts) {
			let expand = this.expandSid != sid;
			this.expandSid = expand? sid : '';
		},
		// td樣式
		cellTdClass(obj){
			if(obj.tdClass) {
				return `${obj.tdClass} ${this.cellClass(obj)}`;
			}
			else return this.cellClass(obj);
		},
		// 欄位的 class
		cellClass(obj) {
			let list = [];
			let qo = this.qo;
			// 價格類欄位
			if (obj.isPrice) {
				list.push('is-price');
				list.push(this.$clrUd(qo[obj.key], qo.r));
			}
			// 依據最新價進行漲跌變色
			if (obj.udClr) {
				list.push(this.$clrUd(qo.p, qo.r));
			}
			// 有設定樣式class
			if(obj.contentClass) {
				return obj.contentClass;
			}
			return list;
		},
		/** 轉換歷史查詢資料內容(Dcore SIM) */
		getCellText(obj, key, idx) {
			let _key = typeof key === 'string'? idx: key.key;
			let cntText = obj[_key];
			let text = cntText;
			// 不在pdsetting的轉換清單中的不做處理。
			if(this.transLateList.indexOf(key) < 0) return text;
			switch(key){
				// 商品代碼轉換
				case "SYMBOL":
					text = M4C.Symbol.getCNM4(cntText);
					break;
				// 委託訊息代碼轉換
				case 'CODE':
					text = this.$ln(`TRADE_${cntText}`);
					break;
				// 其他依pdsetting設定的欄位做語系轉換
				default:
					text = this.$ln(cntText);
					break;
			}
			return text;
		},
		onCheckAll() {
			this.$emit("checkAll", this.checkList.length !== this.sortedList.length);
		},
		onItemCheck(sid) {
			this.$emit("itemCheck", sid);
		},
		setList(sortedList) {
			this.$store.commit("setContractsList", sortedList);
		}
	},
	watch: {
		checkAll(nv) {
			this.onCheckAll();
		},
		// 展開商品代碼
		expandSid(nv) {
			let symbolObj = this.sortedList.find(o=>o.sid===nv);
			// 加入新展開合約清單
			this.expandContracts = symbolObj? symbolObj.moreContracts.map(sid=>{return {'sid': sid}}) : [];
		},
		// 展開合約清單
		expandContracts(nv, ov) {
			// 加入展開的新合約清單
			if(nv.length) {
				let idx = this.sortedList.findIndex(o=>o.sid===this.expandSid);
				this.sortedList.splice(idx+1, 0, ...nv);
			}
			// 移除展開的舊合約清單(如果有的話)。
			if(ov.length) {
				ov.forEach(obj => {
					let idx = this.sortedList.findIndex(o=>!o.moreContracts && o.sid===obj.sid);
					// 有找到才移除
					if(idx != -1)
						this.sortedList.splice(idx, 1);
				});
			}
		},
	},
    computed: {
		largeSize(){return this.$store.state.config.largeSize;},
		/** 使傳入參數成為響應式 */
		propExpandList: function() {
            return this.param.expandList;			
		},
		/** 判別使用哪個清單 */
		expandObjList() {
			if(this.column|| this.dataList) return this.dataList;
			let list = this.propExpandList? [...this.propExpandList]: [];
			// 有展開時，將展開內容列表插入展開index
			if (this.expandSid && this.expandContracts.length) {
				let idx = this.propExpandList.findIndex(o=>o.sid===this.expandSid);
				list.splice(idx+1, 0, ...this.expandContracts);
			}
			return list;
		},
		/** 顯示欄位列表 */
		showList() {
			if(this.param && this.param.showList) return this.param.showList;
			else if(this.mode == 1) return this.param.column;
			else
				return this.$store.state.columnSD.quote_tablex.show;
		},
		/** 不凍結左側欄位 */
		noFixedLeft() {return this.param.noFixedLeft;},
		/** 是否為行情欄位資料 */
		isQuoteCol() {return !this.param.noQuoteCol;},
		scrollColumn() {return !this.isQuoteCol || this.mode == 1? this.showList: [];},
		/** 標題欄位資料 */
		column() {
			return this.param.column;
		},
		/** 資料欄位列表 */
		dataList() {
			return this.param.dataList;
		},
		// 排序icon
		sortIcon() {
			if(this.sortBy == 'desc') return 'north';
			else if(this.sortBy == 'asc') return 'south';
			else return 'adjust';
		},
		propsStatus() {
			try {
				return this.param.stampStatus;
			} catch(e) {
				return "Done";
			}
		},
		/** pdsetting中設定的需轉語系的內容欄位清單 */
		transLateList() {
			try{
				return this.$store.state.config.tradePdSetting.translate.history_query;
			}
			catch(e) {
				return [];
			}
		},
		/** 可勾選項目 */
		checkItem(){return this.param.isCheckItem;},
		checkList() {return this.param.checkList || [];},
		noFixed() {return this.param.noFixed;},
		showExpand() {return !this.checkItem && !this.param.noExpand;},
		fixedTitle() {
			// 預設顯示名稱
			let title = '名称';
			// 設定有label用label
			if(this.column && this.column[this.fixedIdx].label) 
				title = this.column[this.fixedIdx].label;
			// 純文字就指定fixedIdx內的資料
			else if(this.column && this.column[this.fixedIdx])
				title = this.column[this.fixedIdx];
			// param指定不顯示title文字
			else if(this.param.noFixedText) title = "";
			return this.$ln(title);
		},
	},
}
</script>

<style lang="scss" scoped>
.thead .th, .tbody /deep/ .td {
	width: 23vw;
	min-width: 23vw;
	box-sizing: border-box;
	text-align: right;
}
.thead-fixed-x-ctn.th,.tbody-fixed-x-ctn /deep/ .td {
	width: 31vw;
	min-width: 31vw;
	text-align: left;
}
.tbody-fixed-x-ctn{
	width: 31vw;
}
.thead-fixed-x-large.th,.tbody-fixed-x-large /deep/ .td {
	width: 40vw;
	min-width: 40vw;
	text-align: left;
}
.tbody-fixed-x-large{
	width: 40vw;
}
th.name, .tbody /deep/ .td.name {
	width: 20vw;
}
th.rate, .tbody /deep/ .td.rate {
	width: 10vw;
}
th.vol, .tbody /deep/ .td.vol {
	width: 10vw;
}
.fixed-name {
	width: 1px;
	overflow: hidden;
}
.quote-table-X-list-ctn /deep/ .quote-table-tr, .tbody table tr{
	height: 4em;
	padding-top: 1vw;
	padding-bottom: 1vw;
	box-sizing: border-box;
}
.quote-table-X-list-large /deep/ .quote-table-tr, .tbody table tr{
	height: 5em;
}
.fit-content {
	width: fit-content;
}
.tbody /deep/ .reflash-circle{
	z-index: 1;
}
.fixed-thead {
	padding-top:0;
	padding-bottom: 0;
	height: 3em;
	background-color: #2A2A2A;
}
.quote-table-tr{
	border-bottom: none;
}
.quote-table-tr:nth-child(even), .tbody table tr:nth-child(even){
	background: #17202A;
}
.thead-fixed-x-ctn, .tbody-fixed-x-ctn {
	border-right: 1px solid #111820;
}
.column-style .tbody-fixed-x-ctn{
	background: none !important;
}
.scroll-x-ctn {
	position: absolute;
	left: 0;
	right: 0;
}
/deep/ .scroll-bounce-ctn {
	overflow: auto;
}
.history-query .thead .th{
	min-width:31vw;
	max-width: 31vw;
}
.Withdrawal-Record-ctn .history-query .thead .th,
.Withdrawal-Record-ctn .history-query .tbody td {
	min-width: 27vw;
	max-width: 27vw;
	text-align: center;
}
.Withdrawal-Record-ctn .history-query .thead.fixed-thead {max-height: 2em;}
.tbody table {
	border-spacing: 0;
}
td{
	min-width:31vw;
	max-width: 31vw;
	padding:0;
	box-sizing: border-box;
}
.break-all {
	word-break: break-all;
}
</style>