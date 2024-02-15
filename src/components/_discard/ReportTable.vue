<template>
    <div class="flex-column ctn">
		<MTable>
			<thead>
			  <tr>
				<th v-if="showColumn['UPDATE_TIME']">{{$ln('时间')}}</th>
				<th>{{$ln('合约名称')}}</th>
				<th v-if="showColumn['STATUS']">{{$ln('状态')}}</th>
				<th>{{$ln('买卖')}}</th>
				<th>{{$ln('仓别')}}</th>
				<th v-if="showColumn['AVG_PRICE']">{{$ln('成交均价')}}</th>
				<th v-if="showColumn['ORDER_PRICE']">{{$ln('委托价')}}</th>
				<th v-if="showColumn['ORDER_QTY']">{{$ln('原委托')}}</th>
				<th v-if="showColumn['AVAILABLE_QTY']">{{$ln('未成交')}}</th>
				<th v-if="showColumn['CUM_QTY']">{{$ln('已成交')}}</th>
			  </tr>
			</thead>
			<tbody>
				<tr v-for="(rpt, i) in reportList" :key="'R'+i" :class="[rpt.$ROW_HEIGHT_LIGHT, {selected: selectedRpt===rpt}]" @click="onRowClick(rpt)">
					<td v-if="showColumn['UPDATE_TIME']">{{new Date(rpt.UPDATE_TIME).time8()}}</td>
					<td class="contract"><div v-html="getContractNameHtml(rpt)"/></td>
					<td class="status" v-if="showColumn['STATUS']" v-html="getStatusHtml(rpt)"></td>
					<td><div v-html="getBuySellHtml(rpt)"/></td>
					<td>{{getOCText(rpt)}}</td>
					<td v-if="showColumn['AVG_PRICE']">{{rpt.AVG_PRICE}}</td>
					<td v-if="showColumn['ORDER_PRICE']"><div v-html="getPriceHtml(rpt)"/></td>
					<td v-if="showColumn['ORDER_QTY']"><div v-html="getOrderQtyHtml(rpt)"/></td>
					<td v-if="showColumn['AVAILABLE_QTY']"><div v-html="getAvailableQtyHtml(rpt)"/></td>
					<td v-if="showColumn['CUM_QTY']">{{rpt.CUM_QTY}}</td>
				</tr>
			</tbody>
		</MTable>
		<FloatPopup class="position-float-popup" :is-float="showFloatPopup" :is-btn="true" @close="onRowClick(selectedRpt)">
			<div class="flex-1 flex-row plr10" v-if="mode==1">
				<Button class="m5" color="white" @click="onBtnAll">{{$ln('全撤')}}</Button>
				<div class="flex-1"/>
				<Button class="m5" color="white" @click="onBtnEdit" v-if="selectedRpt && !selectedRpt.$IS_OCO">{{$ln('改价')}}</Button>
				<Button class="m5" color="white" @click="onBtnFall">{{$ln('撤单')}}</Button>
			</div>
			<div class="flex-1 flex-row p2" v-if="mode==2 && selectedRpt">
				<div class="flex-1 flex-col">
					<div class="flex-1 flex-row flex-vertical-center p2">
						<span class="flex-vertical-center"><i class="material-icons clock-icon">access_time</i>{{new Date(selectedRpt.UPDATE_TIME).time8()}}</span>
						<span class="flex-1 flex-center" v-html="getContractNameHtml(selectedRpt)"></span>
						<span >{{$ln('订单编号')}}：{{selectedRpt.ORDER_ID}}</span>
					</div>
					<div class="flex-1 flex-row p2">
						<span>{{$ln('委托别')}}：{{selectedRpt.TIME_IN_FORCE}}</span>
						<div class="flex-row flex-1 pl10 flex-vertical-center">
							<span >{{$ln('备注')}}：</span>
							<span class="flex-1">{{selectedRpt.MESSAGE}}</span>
						</div>
						
					</div>
				</div>
				<!-- <div class="flex-vertical-center">
					<Button color="white" class="m5" @click="onRowClick(selectedRpt)" v-touching>{{$ln('关闭(C)')}}</Button>
				</div> -->
			</div>
		</FloatPopup>		
    </div>
</template>

<script>
import ReportTableOCO from './ReportTable.OCO'
import Button from "@/components/Framework/Button.vue";
export default {
    mixins: [ReportTableOCO],
	props: ["param"],
	data() {
		return {
			mode: this.param ? this.param.mode : 2,
			reportList: [],
			showColumn: {},
			showFloatPopup: false,
			selectedRpt: null,
        }
	},
	beforeMount() {
		let self = this;
		switch(this.param.mode) {
			case 1:	// 掛單 (剩餘有效 > 0)
				self.setShowColumn(['ORDER_PRICE', 'ORDER_QTY', 'AVAILABLE_QTY', 'CUM_QTY', 'UPDATE_TIME']);
				self.reportList = M4C.Report.getAvailableReportList();
				break;
			case 2:	// 委託 (所有委託回報)
				self.setShowColumn(['STATUS', 'ORDER_PRICE', 'ORDER_QTY', 'CUM_QTY', 'UPDATE_TIME']);
				self.reportList = M4C.Report.getOrderReportList();
				break;
			case 3:	// 成交 (成交數量 > 0)
				self.setShowColumn(['AVG_PRICE', 'CUM_QTY', 'UPDATE_TIME']);
				self.reportList = M4C.Report.getFilledReportList();
				break;
		}
	},
    mounted() {
    },
	beforeDestroy() {
	},
	components: {Button
	},
	
	watch: {
		selectedRptIsRemoved (nv, ov){
			if (nv) {
				this.showFloatPopup = false;
			}
		}
	},
    computed: {
		// 用以 watch 指定 object.key 辦法
		selectedRptIsRemoved() {
			return this.selectedRpt ? this.selectedRpt.$REMOVED : false;
		}
    },
    methods: {
		// 點擊列
		onRowClick(rpt) {
			let self = this;
			// row.selected
			self.selectedRpt = self.selectedRpt === rpt ? null : rpt;
			// 顯示 floatPopup
			self.showFloatPopup = !!self.selectedRpt && ((self.mode == 1) || (self.mode == 2));
			// 商品連動
			let SYMBOL = rpt.SMO && rpt.OCO? rpt.OCO[0].SYMBOL : rpt.SYMBOL;
			eventBus.$emit('SYMBOL-CHANGE', SYMBOL);
		},
		// 全撤
		onBtnAll(){
			let self = this;
			eventBus.$emit("CONFIRM-DIALOG", {
				title: `全部撤单`,
				content: this.$ln(`确认要将全部共 {0} 张委托单撤单？`).format(self.reportList.length),
				confirm: () => {
					self.reportList.forEach((rpt)=>{
						let orderInfo = self.getOrderInfo(rpt);
						orderInfo.ACTION = 'CANCEL';
						M4C.Order.sendOrder(orderInfo);
					});
				}
			});
		},
		// 改價
		onBtnEdit(){
			if(!this.selectedRpt){
				eventBus.$emit("FLASHMESSAGE", "请选择一档商品");
				return;
			}
			let rpt = this.selectedRpt;
			eventBus.$emit("CONFIRM-DIALOG", {
				title: "改价",
				content: this.$ln(`合约{0},{1},{2}手`).format(rpt.$CONTRACT_NAME, this.getBSText(rpt), rpt.$AVAILABLE_QTY),
				Inputs:[{
					sid: rpt.SYMBOL,
					value: rpt.ORDER_PRICE,
					text: "价格",
				}],
				comfirmButton: "确认改价",
				confirm: (confirm) => {
					let refs = confirm.$refs;
					let orderInfo = this.getOrderInfo(rpt);
					for(let key in refs){
						let ipt = refs[key];
						if(ipt[0] && ipt[0].getValue){
							let priceObj = ipt[0].getValue();
							orderInfo.ORDER_TYPE = priceObj.ORDER_TYPE;		//改價可能不需要帶order type(參考ss2web的資料)但市價可能需要。
							orderInfo.NEW_PRICE = priceObj.price;			//改價的新價格
							orderInfo.ACTION = 'REPRICE';
							M4C.Order.sendOrder(orderInfo);
						}
					}
				}
			});
		},
		// 撤單
		onBtnFall(){
			if(!this.selectedRpt){
				eventBus.$emit("FLASHMESSAGE", "请选择一档商品");
				return;
			}
			let rpt = this.selectedRpt;
			let orderInfo = this.getOrderInfo(rpt);
			orderInfo.ACTION = 'CANCEL';
			let bsText = rpt.SIDE=="BUY" ? this.$ln('撤买') : this.$ln('撤卖');
			let self = this;
			eventBus.$emit("CONFIRM-DIALOG", {
				title: `撤单`,
				content: this.$ln(`确认要将 {0} {1} {2} 共 {3} 手？`).format(M4C.Symbol.getCNM4(orderInfo.SYMBOL), bsText, rpt.ORDER_PRICE, rpt.$AVAILABLE_QTY),
				confirm: () => {
					M4C.Order.sendOrder(orderInfo);
				}
			});
		},
		// 基本下單資訊
		getOrderInfo(rpt) {
			return {
				'REPORT_ID': rpt.key,						// 改價需帶REPORT_ID
				'SYMBOL': rpt.SYMBOL,						// "I.F.CME.6B.201906"
			};
		},
		// 要顯示的欄位
		setShowColumn(showColumnList) {
			let self = this;
			showColumnList.forEach((key)=>{
				self.showColumn[key] = true;
			});
		},
		//仓别文字
		getOCText(rpt){
			//OCO資料在rpt下沒有POSITION_EFFECT資料，所以改拿SMO裡的
			if(rpt.$IS_OCO)
				return this.$ln(rpt.OCO[0].POSITION_EFFECT + '(rp)');

			return this.$ln(rpt.POSITION_EFFECT + '(rp)');
		},
		// 買賣欄位文字
		getBSText(rpt) {
			return this.$ln(rpt.SIDE + '(rp)');
		},
		// 取得合約名稱HTML
		getContractNameHtml(rpt) {
			let html = rpt.$CONTRACT_NAME;
			// 進行 OCO 單檢查/處理
			html = this.ocoContractNameHtml(rpt) || html;
			return html;
		},
		// 取得狀態欄位HTML
		getStatusHtml(rpt) {
			let clr = "";
			if (rpt.REPORT_KEY.status === "Rejected") clr = "clr-warn";
			else if (rpt.REPORT_KEY.status === "Filled") clr = "clr-aqua";
			let html = `<span class="${clr}">${this.$ln(rpt.$STATUS)}</span>`;
			return html;
		},
		// 取得買賣價欄位HTML
		getBuySellHtml(rpt) {
			let cls = rpt.SIDE === "BUY" ? "clr-up" : (rpt.SIDE === "SELL" ? "clr-dn" : "clr-ref");
			let html = `<div class="nowrap ${cls}">${this.getBSText(rpt)}</div>`;
			// 進行 OCO 單檢查/處理，成交回報則不需要
			if(this.mode != 3)
				html = this.ocoBuySellHtml(rpt) || html;
			return html;
		},
		// 取得委託價欄位HTML
		getPriceHtml(rpt) {
			let html = rpt.ORDER_PRICE || this.$ln('市价');
			// 進行 OCO 單檢查/處理
			html = this.ocoPriceHtml(rpt) || html;
			return html;
		},
		// 取得原委託數量欄位HTML
		getOrderQtyHtml(rpt) {
			let html = rpt.ORDER_QTY;
			// 進行 OCO 單檢查/處理
			html = this.ocoOrderQtyHtml(rpt) || html;
			return html;
		},
		// 取得剩餘有效委託數量欄位HTML
		getAvailableQtyHtml(rpt) {
			let html = rpt.$AVAILABLE_QTY;
			// 進行 OCO 單檢查/處理
			html = this.ocoAvailableQtyHtml(rpt) || html;
			return html;
		}
	},
}
</script>

<style scoped>
td.contract {
	max-width: 70px;
}
td.status {
	max-width: 70px;
}
tr.selected td {
	color: white !important;
	background-color: #4B4B4B;
}
.p2{
	padding: 2px;
}
.clock-icon{
	font-size: 1em;
}
tr.ORDER_CHANGED td{
	background-color: #5B001F;
}
</style>