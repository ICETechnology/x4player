<template>
	<div class="thunder-table flex-1 flex-column table-block font-size-small posr">
		<div class="posr">
			<table>
				<thead>
					<tr class="flex-vertical-center thead">
						<th class="flex-1 flex-center" v-if="isNormal" @click="onPositionClick(1)"><span class="nowrap tcef" :class="{'cbtn buy-oco': ssps.$BAVG}">{{$ln('多仓')}}</span></th>
						<th class="flex-1 flex-center" @click="onOrderClick(1)"><span class="flex-row tcef nowrap" :class="{'cbtn': orderBuyList.length}">{{!isNormal?$ln('买删'):$ln('买单')}}</span></th>
						<th class="flex-1">{{$ln('买(SP)')}}</th>
						<th class="" :class="[{'flex-row space-around': !isNormal,'flex-2': !isDesktop, 'flex-1':isDesktop}]">
							<span class="setting cbtn mg1 flex-center flex-1 tcef" @click="$store.state.thunder.isMiddle += 1" v-if="!isNormal">
								<i class="material-icons setting-icon font-size-normal">reply</i>
							</span>
							<span class="setting cbtn mg1 flex-center flex-1 tcef" @click="$store.state.thunder.scrollLock = !$store.state.thunder.scrollLock" v-if="!isNormal">
								<span class="price-lock icon" :class="$store.state.thunder.scrollLock?'icon-lock-price-off':'icon-lock-price-on'"> </span>
							</span>
							<div v-if="isNormal"><InputQty v-model="$store.state.thunder.tsiJumpQty" min='0' max='100' step=1 :btnStyle="btnStyle" class="font-size-big posr ts-jump-qty" /></div>
						</th>
						<th class="flex-1">{{$ln('卖(SP)')}}</th>
						<th class="flex-1 flex-center" @click="onOrderClick(-1)"><span class="flex-row tcef nowrap" :class="{'cbtn': orderSellList.length}">{{!isNormal?$ln('卖删'):$ln('卖单')}}</span></th>
						<th class="flex-1 flex-center" v-if="isNormal" @click="onPositionClick(-1)"><span class="nowrap tcef" :class="{'cbtn sell-oco': ssps.$SAVG}">{{$ln('空仓')}}</span></th>
					</tr>
				</thead>
			</table>
			<div class="modify-tag divider pd3 flex-center" v-if="selectedEl">{{$ln('移动改价')}}</div>
		</div>
        <div ref="body" class="flex-1 mask thunder-body flex-col posr" :class="{'scroll-lock': selectedPrice}" @scroll="onBodyScroll" v-stop-propagation-y 
                @mousewheel="onMouseWheel">
            <table class="FULL" ref="dataTable">
				<tbody>
					<tr class="flex-vertical-center" v-for="(price,key) in tempList" :key="key" :ref="qop == price.p ?'REFLINE': ''" 
					:class="[Number($store.state.thunder.settings.other.showLine) ? {'height-line borc-up': price.p == qo.h, 'low-line borc-dn': price.p == qo.l}: '', `price_${price.p}`]">
						<!-- 多方持倉 -->
						<td class="position flex-1 flex-start flex-horizontal-center flex-start" :height="rowHeight" v-if="isNormal">
							<div class="pos-buy bgc-up-pos" v-if="showPos(1, price.p)" @click="closePos()">
								<span>{{Math.abs(ssps.$NET_QTY)}}</span>
							</div>
							<div class="H-L pl5" v-if="Number($store.state.thunder.settings.other.showLine)"><span v-if="(price.p == qo.h)">{{$ln('高')}}</span><span v-if="(price.p == qo.l)">{{$ln('低')}}</span></div>
						</td>
						<!-- 多方委託 -->
						<td class="BUY border-left order flex-1 flex-start flex-horizontal-center borc-up flex-start posr" :height="rowHeight" >									
							<div class="order-buy bgc-up borc-up font-size-micro" v-if="showBuyOrderTag(price.rpt)" @click="cancelOrder(price.rpt.BUY)" 
								@touchstart="selectedOrder = price.rpt.BUY" :class="[getSPSLBgc(price.rpt, 1, price.p)]" v-html="getBuyOrderTag(price.rpt)" />
							<orderList :report="price" side="BUY" v-if="selectedPrice==price.p"/>
						</td>
						<!-- 買量 -->
						<td class="BUY border-left border-right flex-1 flex-item flex-end borc-up posr" @click="onBtnOrder(price.p,'BUY')" :height="rowHeight">
							<div class='vo-icon bgc-up' :style="changeWidth(price.bv)" :class="{'opacity': enterType=='O'}"></div>
							<div class="vo-text" :class="{'opacity': enterType=='O'}">
								<span v-if="price.p > qop && enterType == 'Sm'"><span class='big-text'>S</span>M</span>
								<span v-if="price.p > qop && enterType == 'Sl'"><span class='big-text'>S</span>L</span>
								<span v-if="price.bv" class="nowrap">{{$volUnit(price.bv)}}</span>
							</div>
							<div class="oco-buy-select-ctn flex-row clr-black flex-center" v-if="isSelected(price.p, 'BUY')">
								<i class="material-icons font-size-little">clear</i><span>O</span><span class="flex-1 pdr1">{{$store.state.thunder.orderQty}}</span>
							</div>							
						</td>
						<!-- 價格 -->
						<td class="flex-col flex-horizontal-center posr flex-1d5" :height="rowHeight" @click="onPriceClick(price.p, price.rpt.BUY.length > 1 || price.rpt.SELL.length > 1, price.rpt)" 
							:class="[getClr(price), {'selected': selectedPrice===price.p,'flex-2': !isDesktop}]">
							<i class="orderList-icon material-icons font-size-micro clr-white" v-if="price.rpt.BUY.length > 1 || price.rpt.SELL.length > 1">content_copy</i>
							<div>{{updatePrice(price.p)}}<span v-if="qop == price.p">{{qo.q}}</span></div>
							<div v-if="showPos(ssps.$NET_QTY, price.p) && !isNormal" :class="[$clr0(ssps.$PL)]" >{{$displayPL(ssps.$PL)}}</div>
						</td>
						<!-- 賣量 -->
						<td class="SELL border-left border-right flex-1 flex-item flex-start borc-dn posr" @click="onBtnOrder(price.p,'SELL')" :height="rowHeight">
							<div class='vo-icon bgc-dn' :style="changeWidth(price.sv)" :class="{'opacity': enterType=='O'}"></div>
							<div class="vo-text" :class="{'opacity': enterType=='O'}">
								<span v-if="price.sv" class="nowrap">{{$volUnit(price.sv)}}</span>
								<span v-if="price.p < qop && enterType == 'Sm'"><span class='big-text'>S</span>M</span>
								<span v-if="price.p < qop && enterType == 'Sl'"><span class='big-text'>S</span>L</span>
							</div>
							<div class="oco-sell-select-ctn flex-row clr-black flex-center" v-if="isSelected(price.p, 'SELL')">
								<span class="flex-1 pdl1">{{$store.state.thunder.orderQty}}</span><span>O</span><i class="material-icons font-size-little">clear</i>
							</div>							
						</td>
						<!-- 空方委託 -->
						<td class="SELL border-right order flex-1 flex-end flex-horizontal-center flex-end borc-dn posr" :height="rowHeight" >
							<div class="order-sell bgc-dn borc-dn font-size-micro" v-if="showSellOrderTag(price.rpt)" @click="cancelOrder(price.rpt.SELL)" 
								@touchstart="selectedOrder = price.rpt.SELL" :class="[getSPSLBgc(price.rpt, -1, price.p)]" v-html="getSellOrderTag(price.rpt)" />
							<orderList :report="price" side="SELL" v-if="selectedPrice==price.p"/>
						</td>
						<!-- 空方持倉 -->
						<td class="position flex-1 flex-start flex-horizontal-center borc-dn flex-end" v-if="isNormal" :height="rowHeight" >
							<div class="pos-sell bgc-dn-pos" v-if="showPos(-1, price.p)" @click="closePos()">
								<span>{{Math.abs(ssps.$NET_QTY)}}</span>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
			<resize-observer @notify="resizeComponent" v-if="$store.state.device.isDesktop" />
		</div>
	</div>
</template>
<script>
import QuoteAgent from '@/components/QuoteAgent';
import ThunderOrder from "./ThunderOrder";
import orderList from "./orderList";
import { setTimeout } from 'timers';

var VueScrollTo = require('vue-scrollto');

export default {
	mixins: [QuoteAgent, ThunderOrder],
	data() {
		return {
			availableReportList: M4C.Report.availableReportList,
			volumeKey: ['sv10','sv9','sv8','sv7','sv6','sv5','sv4','sv3','sv2','sv1','bv1','bv2','bv3','bv4','bv5','bv6','bv7','bv8','bv9','bv10'],
			tempList:[],
			orderQty:1,
			selectedOrder: {},
			selectedEl: "",
			isOptUp: false,
			td_h: 31,
			defaultRow: 50,
			posMiddle: false,
			priceStr: "",
			buyVolStr: "",
			sellVolStr: "",
			repeat: 0,
			btnStyle: {add:'arrow_forward_ios', remove: 'arrow_back_ios'},
			throwttleQo: true,
			isExpandtr: false,
		};
	},
	props: ["param", "suspend", "reportList", "orgList", 'allBuyQty', 'allSellQty', 'noMask'],
	components: {orderList},
	mounted() {
		this.orderQty = this.$store.getters.getDefaultQty;
		// console.log('thundertable height', this.$refs.body.offsetHeight)
	},
	beforeDestroy() {
		// 取消捲動。
		if(this.cancelScrollObj)
			this.cancelScrollObj();
	},
	computed: {
		$clr0() {return this.$store.state.fn.$clr0;},
		$disObserver(){return this.$store.state.fn.$disObserver;},
		$volUnit(){return this.$store.state.fn.$volUnit;},
		$displayPL() {return this.$store.state.fn.$displayPL;},
		ssps() {return this.$store.state.selectedSymbol.positionSum;},
		sid() {return this.$store.state.selectedSymbol.ID;},
		$tickSize() {return M4C.Symbol.getTickSize(this.sid, this.qop)},
		orderBuyList(){
			return this.reportList.filter((rpt) => {
				let report = rpt.$IS_OCO? rpt.OCO: rpt;
				let isMatch = rpt.$IS_OCO? report.find(r => {return r.SIDE == "BUY";}): rpt.$SIDE == "BUY";
				// 過濾買方回報
				return isMatch;
			});
		},
		orderSellList(){
			return this.reportList.filter((rpt) => {
				let report = rpt.$IS_OCO? rpt.OCO: rpt;
				let isMatch = rpt.$IS_OCO? report.find(r => {return r.SIDE == "SELL";}): rpt.$SIDE == "SELL";
				// 過濾賣方回報
				return isMatch;
			});
		},
		//計算最大量
		maxVolume: function() {
			let maxVolume = 0;
			for (let i = 0; i < this.volumeKey.length; i++) {
				let key = this.volumeKey[i];
				if (this.qo[key] > maxVolume)
					maxVolume = this.qo[key];
			}
			return maxVolume;
		},
		qosn() {return this.qo.sn;},
		qop(){return this.$qoPrice;},
		enterType(){ return this.$store.state.thunder.enterType;},
        isMiddle(){ return this.$store.state.thunder.isMiddle},
		model() {return this.param && this.param.model? this.param.model: this.$store.state.thunder.model},
		isNormal() {return this.model == 'N'},
		rowRange() {
			return this.$store.state.thunder.settings.other.rowRange;
		},
		rowHeight() {
			return this.rowRange=="B"? "40px": this.rowRange=="S"? "25px": "31px";
		},
		thunderInit() {
			if(this.qosn && this.$refs.body){
				return true;
			}
			else return false;
		},
		selectedPrice() {return this.$store.state.thunder.selectedPrice;},
		isDesktop() {return this.$store.state.device.isDesktop;},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
		tsiJumpQty(){return this.$store.state.thunder.tsiJumpQty + 1;},
		$symbolPriceX() {return this.$store.state.fn.$symbolPriceX;},
		minfo() {return this.$store.state.selectedSymbol.MInfo;},
		/** 台灣期交所 TWF */
		isTWF() {
			return this.minfo.Exchange === "TWF";
		},
	},
	watch: {
		"$store.state.thunder.scrollLock"(nv) {
			if(nv) {
				this.selfSuspend = true;
                this.reBuildTable();
			}
            // if(nv) {this.scrollTo(nv);}
		},
		rowHeight(nv) {
			this.td_h = Number(nv.replace('px', ''));
			let self = this;
			setTimeout(() => {
				self.reBuildTable();
			}, 100);
		},
        isMiddle(nv){
            if(nv)
				this.reBuildTable();
        },
		sid: function(nv, ov) {
			if(this.qosn && this.qo.s == nv){
				this.$store.state.thunder.scrollLock = true;
                this.reBuildTable();
			}
			else {
				this.tempList = [];
			}
		},
		qop(np, op){
			if(this.qo.s == this.sid){
				if(np && !op) {
					// console.log("reBuildTable table qop", this.qo.sn, this.qo.s);
					this.priceStr = `_${np}_`;
					this.buyVolStr = `_${this.qo.bv1}_`;
					this.sellVolStr = `_${this.qo.sv1}_`;
					// 依現價資料初始化閃電表格
					this.selfSuspend = true;
					this.reBuildTable();
				}
				// 當置中且鎖定且沒有延伸額外tr時才以現價更新表格。
				else if(this.posMiddle && this.$store.state.thunder.scrollLock && !this.isExpandtr){
					this.createRow();
				}
			}
		},
		// 監看跳數變動時(完成後)延遲0.5秒呼叫一次重建。
		"$store.state.thunder.tsiJumpQty"(nv, ov) {
			let self = this;
			if(this.reBuildDelay)
				clearTimeout(this.reBuildDelay)
			this.reBuildDelay = setTimeout(() => {
				self.reBuildTable();
			}, 500);
		}
	},
	methods: {
		resizeComponent() {
			// console.log('thunder resize');
			this.selfSuspend = true;
			let self = this;
			setTimeout(()=>{
				self.selfSuspend = false;
			},500);
		},
		// 買方委託tag顯示判斷
		showBuyOrderTag(rpt){
            if(rpt.BUY.length) return true;
            else if(rpt.BT) return true;
            else if(rpt.BSM) return true;
            else if(rpt.BSL) return true;
            else if(rpt.BOCO) return true;
			else return false;
		},
		// 賣方委託tag顯示判斷
		showSellOrderTag(rpt){
            if(rpt.SELL.length) return true;
            else if(rpt.ST) return true;
            else if(rpt.SSM) return true;
            else if(rpt.SSL) return true;
            else if(rpt.SOCO) return true;
			else return false;
		},
		// 建出買方委託tag
		getBuyOrderTag(rpt) {
			let el = "";
			if(!rpt) return;
            if(rpt.BL) el += `<span>${rpt.BL}L</span>`;
            if(rpt.BM) el += `<span>${rpt.BM}M</span>`;
            if(rpt.BT) el += `<span>${rpt.BT}T</span>`;
            if(rpt.BTS) el += `<span>${rpt.BTS}TS</span>`;
            if(!rpt.BSL && rpt.BSM) el += `<span>${rpt.BSM}SM</span>`;
            if(!rpt.BSM && rpt.BSL) el += `<span>${rpt.BSL}SL</span>`;
            if(rpt.BSL && rpt.BSM) el += `<span>${rpt.BSL + rpt.BSM}S</span>`;
            if(rpt.BOCO) el += `<span>${rpt.BOCO}O</span>`;
			if(rpt.BUY.length == 1) el += `<span class="clr-black">#${rpt.BUY[0].$INDEX}</span>`;
			return el;
		},
		// 建出賣方委託tag
		getSellOrderTag(rpt) {
			let el = "";
			if(!rpt) return;
            if(rpt.SL) el += `<span>${rpt.SL}L</span>`;
			if(rpt.SM) el += `<span>${rpt.SM}M</span>`;
            if(rpt.ST) el += `<span>${rpt.ST}T</span>`;
            if(rpt.STS) el += `<span>${rpt.STS}TS</span>`;
            if(!rpt.SSL && rpt.SSM) el += `<span>${rpt.SSM}SM</span>`;
            if(!rpt.SSM && rpt.SSL) el += `<span>${rpt.SSL}SL</span>`;
            if(rpt.SSL && rpt.SSM) el += `<span>${rpt.SSL + rpt.SSM}S</span>`;
            if(rpt.SOCO) el += `<span>${rpt.SOCO}O</span>`;
			if(rpt.SELL.length == 1) el += `<span class="clr-black">#${rpt.SELL[0].$INDEX}</span>`;
			return el;
		},		
		// 價位click
		onPriceClick(price, isMultiOrder, rpt) {
			// 有多筆委託單在同檔位時
			if(isMultiOrder){
				if(this.selectedPrice == price)
					this.$store.state.thunder.selectedPrice = "";
				else {
					let target = this.$refs.body.getElementsByClassName(`price_${price}`)[0];
					this.scrollTo(false, target);
					this.$store.state.thunder.selectedPrice = price;
				}
			}
            else {
				this.reBuildTable();
			}
		},
		isSelected(P, S) {
			return this.$store.state.thunder.ocoOrder.find(oco => {return oco.price == P && oco.side == S;});
		},
		onBtnOrder(P, S) {
			// OCO下單模式
			if(this.enterType == 'O') {
				let isInOCOOrder = this.$store.state.thunder.ocoOrder.findIndex(oco => {return oco.price == P && oco.side == S;});
				// 點相同價位及方向時
				if(isInOCOOrder >= 0)
					this.$store.state.thunder.ocoOrder.splice(isInOCOOrder,1);
				// OCO少於2兩邊。
				else if(this.$store.state.thunder.ocoOrder.length < 2)
					this.$store.state.thunder.ocoOrder.push({'price': P, "side": S});
			}
			else
				this.sendOrder({price: P, side: S});
		},
		// 是否顯示持倉icon
		showPos(v, p){
			// 多倉
			if(v > 0)
				return this.ssps.$NET_QTY > 0 && Number(p) == Number(this.priceTick(this.ssps.$BAVG))
			// 空倉
			if(v < 0)
				return this.ssps.$NET_QTY < 0 && Number(p) == Number(this.priceTick(this.ssps.$SAVG))
		},
		priceTick(p){
			if(!p) return 0;
			let ts = this.getTickSize(p);
			// 回傳最低符合的檔位資料
            let price = this.$safeFloat(p - (p % ts)).toString();
			return price;
		},
		onPositionClick(BS){
			let self = this;
			let price = BS > 0? Number(this.ssps.$BAVG) : Number(this.ssps.$SAVG) ;
			let hasQty = BS > 0? this.ssps.$NET_QTY > 0: this.ssps.$NET_QTY < 0;
			if((!price) || (!hasQty)) return;
            // this.$store.state.thunder.scrollLock = false;
			let ts = this.getTickSize(price);
            price = this.$safeFloat(price - (price % ts)).toString();
			let target = this.$refs.body.getElementsByClassName(`price_${price}`)[0];
			// 價格不在目前的table中就重建
			if(!target){
				this.createRow((price));
			}
			setTimeout(() => {
				target = target? target: self.$refs.body.getElementsByClassName(`price_${price}`)[0];
				this.scrollTo(false, target);
			}, 100);
		},
		onOrderClick(BS){
			// 戰鬥閃電
			if((!this.isNormal) && BS > 0){
				this.cancelBuyOrder();
			}
			else if((!this.isNormal) && BS < 0){
				this.cancelSellOrder();
			}
			// 一般閃電
			else {
				let self = this;
                // this.$store.state.thunder.scrollLock = false;
				// 過濾該商品及方向的有效委託單
				let _rptList = [];
				if(BS > 0)
					_rptList = this.orderBuyList;
				if(BS < 0)
					_rptList = this.orderSellList;
				if(!_rptList.length) return;
				// 建立不重複的檔位陣列
				let ary = [];
				let priceList = _rptList.reduce((ary, rpt) => {
					let _side = BS > 0? "BUY": "SELL";
					if(rpt.$IS_OCO){
						if(rpt.OCO[0].SIDE == _side)
							ary.push(rpt.$CONDITION_VALUE_NOR);
						if(rpt.OCO[1].SIDE == _side)
							ary.push(rpt.$CONDITION_VALUE2_NOR);
					}
					else if(rpt.$IS_SMO && !rpt.$ADDITIONAL_REPORT_SMO) ary.push(rpt.$CONDITION_VALUE_NOR);
					else if(rpt.$IS_SMO && rpt.$ADDITIONAL_REPORT_SMO) ary.push(rpt.$CONDITION_VALUE_NOR);
					else ary.push(rpt.ORDER_PRICE);
					return ary;
				}, ary = []).filter((element, index, arr) => { return arr.indexOf(element) === index;});
				let idx = this.selectedTrgPrice? priceList.indexOf(this.selectedTrgPrice): 0;
				idx = idx < 0? 0: idx + 1;
				let price = priceList[idx] || 0;
					price = this.selectedTrgPrice = price? price: priceList[0];
				let target = this.$refs.body.getElementsByClassName(`price_${price}`)[0];
				
				if(!target && BS > 0){
					this.createRow(price);
				}
				else if(!target && BS < 0){
					this.createRow(price);
				}
				setTimeout(() => {
					target = target? target: self.$refs.body.getElementsByClassName(`price_${price}`)[0];
					this.scrollTo(false, target);
				}, 100);
			}
		},
		cleanSelectEl(){
			if(this.selectedEl){
				this.selectedEl.classList.remove("moveEl");
				this.selectedEl.style.top = '0px';
				this.selectedEl = "";
			}
		},
		cleanAllData(){
			this.allBuyQty = 0;
			this.allSellQty = 0;
			this.tempList = [];
			this.sumSv = 0;
			this.sumBv = 0;
			this.sumV = 0;
			this.oldPosPrice = 0;
		},
		closePos(){
			let side = this.ssps.$BUYSELL=='BUY'? 'SELL': 'BUY';
			let orderInfo = {
				'ACTION': 'NEW',						// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
				'SYMBOL': this.$store.state.selectedSymbol.ID,
				'SIDE': side,							// 買BUY/賣SELL
				'POSITION_EFFECT': 'CLOSE',		// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
				'TC_ORDER_TYPE': 'MARKET',				// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
				'TIME_IN_FORCE': 'ROD',		// ROD/IOC/FOK
				'ORDER_PRICE': 0,
				'ORDER_QTY': Math.abs(this.ssps.$NET_QTY),
				'AP_PLUGIN': this.useComName || this.selfComName,
				// 數量故意設字串可用於測試 order回應錯誤 / 無對應回報 / 委託無回應 情境
				// 'ORDER_QTY': `${this.inputOrderQty}`,
			};

			//是否跳出確認視窗
			if (this.$store.state.thunder.settings.other.closeConfirm){
				// 提示确认视窗
				let priceText = orderInfo.ORDER_PRICE == 0 ? this.$ln('市价') : orderInfo.ORDER_PRICE;
				let bsText = side=="BUY" ? this.$ln('买进') : this.$ln('卖出');
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `${ M4C.Symbol.getCNM4(this.sid)}`,
					content: `${priceText}, ${bsText} ${orderInfo.ORDER_QTY} ${this.$ln('手')} (${this.$ln('平仓')} ROD)`,
					confirm: () => {
						M4C.Order.sendOrder(orderInfo);
						// 關閉彈出下單盒 (此作法可能需再調整)
						this.$store.state.ui.floatDialog = null;
					}
				});
			}
			else {
				M4C.Order.sendOrder(orderInfo);
				// 關閉彈出下單盒 (此作法可能需再調整)
				this.$store.state.ui.floatDialog = null;
			}
		},
		//更新量的寬度
		changeWidth: function(val) {
			if(!val) return '';
			let value = this.$safeFloat(val/this.maxVolume*100);
				value = value > 100? 100: value;
			return `width: ${parseInt(value)}%`;
		},
		//補滿價位的長度。
		updatePrice: function(val) {
			return this.showTickPrice(val);
		},

		scrollTo(isLock, target){
			if(!this.$refs.body || !this.$refs.REFLINE) return;
			let self = this;
			this.selfSuspend = true;
			let body = this.$refs.body;
			let line = this.$refs.REFLINE[0];
			// 預設以現價線置中，不然是以目標檔位置中。
			line = target? target: line;
			if(!line){
				// 重試5次後放棄(不然會形成無窮迴圈)
				if(this.repeat > 5) return;
				this.repeat++;
				this.createRow();
				self.scrollTo(isLock);
				return;
			}
			else {
				// 重設重試次數
				this.repeat = 0;
				let elHeight = line.clientHeight;
				let bodyHeight = body.clientHeight;
				this.cancelScrollObj = this.$scrollTo(line, 500, {
					// 依據model找body(在父組件中會依據model添加class)
					container: body,
					offset: -bodyHeight/2 + elHeight/2,
					x: false,
					y: true,
					onDone: () => {
						self.posMiddle = isLock;
                        self.selfSuspend = false;
					},
				});
			}
		},
		// 捲到最新價置中
		autoScroll(isLock) {
			if(!this.$refs.body || !this.$refs.REFLINE) return;
			let body = this.$refs.body;
			let line = this.$refs.REFLINE[0];
			let elOffset = body.scrollTop + line.getBoundingClientRect().top - body.getBoundingClientRect().top;
			let elHeight = line.clientHeight;
			let bodyHeight = body.clientHeight;
			// 把 現價 捲到置中
			if(this.isInit){
				body.scrollTop = this.autoScrollTo = elOffset - ((bodyHeight / 2) - (elHeight / 2));
				this.isInit = false;
				let self = this;
				setTimeout(() => {
					self.$store.state.thunder.scrollLock = isLock;
				}, 100);
			}
		},
		// 捲動情境
		onBodyScroll() {
			//在還沒解鎖畫面前及正在處理更新表格時不處理scroll的事件
            if(!this.noMask || this.updateTable) return;
			let body = this.$refs.body;
			// 捲動時不更新quote
			this.selfSuspend = true;
			// table 捲動位置
			let scrollTop = body.scrollTop;
			let halfRowQty = parseInt(this.$safeFloat(body.offsetHeight / this.td_h / 2));

			// 捲動到頂 -> 以新價位更新array
			if (scrollTop == 0) {
				this.updateTable = true;
				// let price = this.$safeFloat(this.defPrice + (tsi * this.defaultRow));
				let firstP = this.tempList[0].p;
				//取array的第一筆的價位資料
				let _lastPrice = this.isInvalidPrice(firstP)? this.qop: firstP;
				// console.log('thunder scrolltop createrow _lastPrice', _lastPrice);
				for(let i =0 ; i<halfRowQty; i++) {
					_lastPrice = this.$safeFloat(_lastPrice - this.getTickSize(_lastPrice, true));
				}
				// console.log('thunder scrolltop createrow new price', _lastPrice);
				this.createRow(_lastPrice);
				body.scrollTop = this.defaultRow * this.td_h;
				this.updateTable = false;
				this.isExpandtr = true;
			}
			// 捲動到底 -> 以新價位更新array
			if (scrollTop >= body.scrollHeight - body.clientHeight - 5) {
				this.updateTable = true;
				// let price = this.$safeFloat(this.defPrice - (tsi * this.defaultRow));
				let _firstPrice = this.tempList[this.tempList.length-1].p;
				if(_firstPrice <= 0 && this.isTWF) {
					this.updateTable = false;
					return;
				}
				// console.log('thunder scrolltop createrow _firstPrice', _firstPrice);
				for(let i =0 ; i<halfRowQty; i++) {
					_firstPrice = this.$safeFloat(_firstPrice + this.getTickSize(_firstPrice));
				}
				// console.log('thunder scrolltop createrow new price', _firstPrice);
				this.createRow(_firstPrice);
				body.scrollTop = body.scrollTop - (this.defaultRow * this.td_h);
				this.updateTable = false;
				this.isExpandtr = true;
			}		
		},
		// 重建表格及現價置中
		reBuildTable() {
			let self = this;
			this.createRow();
			setTimeout(() => {
                self.scrollTo(true);
            }, 100);
			this.isExpandtr = false;
		},
		//建立表格
		createTable(){
			//建出預設的列數
			this.createRow();
		},
		//建出預設的列數
		createRow(price){
			this.selfSuspend = true;
			this.tempList = [];
			let _price = this.defPrice = this.isInvalidPrice(price)? this.qop: price;
			if(!_price) return;
			//建出map的資料(如果沒有的話)
			this.$emit("createOrgListObj", parseFloat(_price));
			this.tempList.push(this.orgList[_price]);
			for (let i = 0; i < this.defaultRow; i++) {
				this.appendRow(1);
				this.appendRow(-1);
			}
			this.selfSuspend = false;
		},
		//增加列數(by參數，往上增加是帶正數，往下增加是帶負數)
		appendRow(diff){
			if (diff > 0){
				let firstP = this.tempList[0].p;
				//取array的第一筆的價位資料
				let _lastPrice = this.isInvalidPrice(firstP)? this.qop: firstP;
				let addTsi = this.$safeFloat(this.getTickSize(_lastPrice) * this.tsiJumpQty);
				//根據ticksize資料增加價位，以用來做新的第一筆的價位資料
                let lastPrice = this.$safeFloat(Number(_lastPrice) + addTsi);
				//建出map的資料(如果沒有的話)
				this.$emit("createOrgListObj", parseFloat(lastPrice));
				// this.createOrgListObj(parseFloat(lastPrice));
				//取map的資料出來指派給列，列reference到map表的資料。之後只需要更新map表的資料，就可以連帶更新列。
				let elObj = this.orgList[lastPrice];
				//增加到array的第一筆
				this.tempList.unshift(elObj);
			}
			else if (diff < 0){
				let _firstPrice = this.tempList[this.tempList.length-1].p;
				let subTsi = this.$safeFloat(this.getTickSize(_firstPrice, true) * this.tsiJumpQty);
                let firstPrice = this.$safeFloat(_firstPrice - subTsi);
				// 台灣商品在閃電時不顯示小於0的價格
				if(firstPrice < 0 && this.isTWF) return;
				this.$emit("createOrgListObj", parseFloat(firstPrice));
				// this.createOrgListObj(parseFloat(firstPrice));
				let elObj = this.orgList[firstPrice];
				//增加到array的最後一筆
				this.tempList.push(elObj);
			}
		},
		getSymbolName(sid){
			let main = M4C.Symbol.getMainformInfo(sid);
			let date = sid.split('.');
			let langCode = window.mainformLangKey;
			let name = langCode == "ENG" ? main.Symbol : main.Name[langCode];
			
			return name + date[date.length-1] ;
		},
		//建立map的預設資料(如果map表沒該價位的key時)
		createOrgListObj(price){
			if(!this.orgList[price]){
				let clr = this.qop > price ? 'clr-up' : 'clr-dn';
				let emptyObj = { 'sv': '', 'p': price , 'bv': '', '$clr': clr, 'pos':{}, 'rpt': {'BUY': [], 'BL': 0, 'BSM': 0, 'BSL': 0, 'BOCO': 0, 'SELL': [], 'SL': 0, 'SSM': 0, 'SSL': 0,'SOCO': 0}};
				this.$set(this.orgList, price, emptyObj);
			}
		},
		//取得價位用的顏色class
		getClr(price){
			//比現價大為clr-up，比現價小為clr-dn，等於現價則用qo的$clr及now-price。
			let clr = this.qop < price.p ? 'clr-up' : this.qop > price.p ? 'clr-dn' : 'now-price clr-ref';
			return clr;
		},
		showTickPrice(val) {
			if(isNaN(val) || val === 0) return val;
			return this.$symbolPriceX({sid: this.sid, val, fillDecimal: true});
		},
		onMouseWheel(e) {},
		// 判斷出場委託的背景顏色
		getSPSLClass(type, side) {
			switch(type){
				case "STOP":
				case "STPLMT":
					return "bgc-sl-" + side;
				case "MIT":
				case "LIT":
					return "bgc-sp-" + side;
				case "TSTOP":
				case "TSTPLMT":
					return "bgc-ts-" + side;
				default:
					return "";
			}
		},
		// 取出場委託的背景顏色
		getSPSLBgc(rpt, side, price) {
			let styleClass = "";
			let isSingle = side > 0? rpt.BUY.length == 1: rpt.SELL.length == 1;
			let _side = side > 0? 'BUY': 'SELL';
			// 同價位同方向有多於1筆委託就不另外加背景色
			if(!isSingle) return styleClass;
			let _rpt = side > 0? rpt.BUY[0]: rpt.SELL[0];
			let oi1 = _rpt.$IS_OCO? _rpt.OCO[0]: _rpt;
			let oi2 = _rpt.$IS_OCO? _rpt.OCO[1]:'';
			// 有MAIN_ORDER_ID的才是出場委託
			if(_rpt.MAIN_ORDER_ID) {
				if(Number(_rpt.$CONDITION_VALUE_NOR) == Number(price) && oi1.SIDE == _side)
					styleClass = this.getSPSLClass(oi1.TC_ORDER_TYPE, _side);
				if(Number(_rpt.$CONDITION_VALUE2_NOR) == Number(price) && oi2.SIDE == _side)
					styleClass = this.getSPSLClass(oi2.TC_ORDER_TYPE, _side);
			}
			return styleClass;
		},
		// 取ticksize
		getTickSize(price, decrease) {return M4C.Symbol.getTickSize(this.sid, price, decrease)},
		// 判斷不正常價格資料
		isInvalidPrice(p) {return isNaN(p) || p === "" || p === null;},
	},
};
</script>
<style scoped>
.body{
	overflow: auto;
	background-color: #363C42;
}
.now-price{
	background-color:rgb(245,166,35);
}
.now-price span{
	color: black;
	font-size: 10px;
	position: absolute;
	right: 1px;
	top:1px;
}
.setting {
	color: rgb(255, 152, 0);
	/* color: black; */
	/* padding: 4px; */
	background-color:white;
	/* border-radius: 4px; */
	box-sizing: content-box;
    /* height: 24px;
    width: 24px; */
}
.modify-tag {
	position: absolute;
	top: 0;
	left: 0; 
	right: 0;
	margin:auto;
	background-color: rgba(0,0,0,0.8);
}
.table-block {
	/* height: calc(100% - 151px - 3em); */
	overflow: auto;
	
}
table {
	width: 100%;
	border: 0;
	border-spacing: 0px;
	border-collapse: collapse;
}
.thead {
    border: 0 solid gray;
    border-bottom-width: 1px;
    background-color: #111820;
	/* color: #A7A9AC; */
	height: 3em;
}
tr {
	background-color: #253445;
}
tr:nth-child(even) {
	background-color: #111820;
}
td {
	/* height: 31px; */
	text-align: center;
	align-items: center;
	/* position: relative; */
	padding: 0px;
}
.order-buy, .pos-buy{
	width: calc(100% - 5px);
	/* background-color:red; */
	height: calc(100% - 2px);
	display: flex;
	position: relative;
	align-items: center;
	justify-content: center;
	flex-flow: wrap;
	max-height: 2em;
}
.order-buy::after, .pos-buy::after{
	content: '';
	width: 0;
	height: 0;
    border-style: solid;
    border-width: 14px 0 14px 7px;
    border-color: transparent transparent transparent #f60000;
    position: absolute;
	left: calc(100% - 1px);
	margin: auto;
}
.ENG .order-buy::after{
	border-color: transparent transparent transparent #00d200;
}
.order-sell, .pos-sell{
	width: calc(100% - 5px);
	/* background-color:green; */
	height: calc(100% - 2px);
	display: flex;
	position: relative;
	align-items: center;
	justify-content: center;
	flex-flow: wrap;
	max-height: 2em;
}
.order-sell::before, .pos-sell::before{
	content: '';
	width: 0;
	height: 0;
    border-style: solid;
    border-width: 14px 7px 14px 0px;
    border-color: transparent #27B148 transparent transparent;
    position: absolute;
	right: calc(100% - 1px);
	margin: auto;
}
.ENG .order-sell::before{
	border-color: transparent #f60000 transparent transparent;
}
.BUY {
	text-align: right;
	border-width: 0;
	border-style: solid;
	border-color: #87293b;
}
.SELL {
	text-align: left;
	border-width: 0;
	border-style: solid;
	border-color: #2f673e;
}
.border-right {
	border-right-width: 1px;
}
.border-left {
	border-left-width: 1px;
}
.bsv div{
	height:5px;
}
.vo-icon{
	position: absolute;
	height: calc(100% - 2px);
}
.BUY .vo-icon{
	/* background-color: #87293b; */
	right:0;
}
.SELL .vo-icon{
	background-color: #2f673e;
	left:0;
}
.BUY .vo-text{/*量的單位要疊在ICON上所以用絕對定位*/
	position: absolute;
	right:2px;
}
.SELL .vo-text{
	position: absolute;
	left:2px;
}
.mask {
	overflow-y: auto;	
}
.bsv {
	background-color: #111820;
}
.height-line {
	border-bottom: 1px #C01C22 solid;
}
.low-line {
	border-bottom: 1px #236322 solid;
}
.big-text{
	font-size: 1.5em;
}
.icon{
	width: 1.3em;
	height: 1.3em;
	display: block;
}
.price-lock {
	transform: rotate(345deg);
}
/* 鎖定價格 */

.icon-lock-price-off {
	background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAwVJREFUeNrsnc1x2zAQRmGPCtCkAuWai5UOpArsVBC7giQNJHIaoFWB5AosV0ClAjmXXK0KMiohC2cPnMzIIbEAQVLvzWDogwcSvw+7+CMh5wAAAAAAAAAAAAAAknPW9gf+/vpuLJeplJmUCylj/bvrzN98/7WNXemoJdEncrmSctkTsVtjlFh4L/YnFb9r1GnNU43QfhkgwnvBCymTrrY8SSfzGvdRpo7YUWThpyo8aaYm5xHFX8hlh/gtR4B2sA+aL6HNCNBOdof4GQwQ8a/lUqYeJZCCjou/6vONa/T+j3HnDBiC+ErZuxSkrWbloP0IqIx22pidHqT87JhW+9wp6CFBTtxIefTCy8x0TwS8PsmKNdT0rXspZX2qolc5qyH+VMf6MbiTcivCH8j+9SOgiJQ/b1Kspw/aAF3VnBk/48n93cyg1QcMQwvEz2SAtv4J4ueLgI/GnI/4oaMgnXQ9G+qd0+HaIsCyh3uH+HYDQtOPTzm3yGowoPLcTghL8r49Aizj/jWS2g0Ibf0b1nbiGHARWNcjcsYxIHTyxcgnYwo6kH7iz4SbLjtARgOACCACIKMBPJpIBBABEMmAkA51rHsIEMGA0AnVDDnjGBD6SOAlcuZLQZ4r0lAcA7aG+q6RtBnHNuVDXzvyu2Fv2RWzD0PvA+vz25nfkNVuwMZQ5+ear//AMQN0bd9iwko398EwE14a6vWjoRITAjvhSmf87Hg+NFsEeL4Y658SCQYDpOVunH2z/eUNGzrmsAiIEQXVPqEgGhr0AZW+YBFxfM9Lek0NMM6OX+PkX1NtYoBPIzuX9vyEan/zo2NaJYnYRqcmakdanmi2SPLSSaMtSf0CN3Sd8Wh8WoqYsJZIeFlu6HuLrvE/hUu83x10XtAQTKiTTuQek8/gzw03sNZWxDJDDgMqrei949HEPAaoCXsp3gRezsthQMWIhUbDFlkzGKAmPOmRwB9cohOmTnYmHMLADu9OMhFr5fcDBnJ8fX8N+McMfsABAAAAAAAAAAAAAKBd/ggwAAXd747dRqFeAAAAAElFTkSuQmCC");
	background-size: 1.3em;
}

.icon-lock-price-on {
	background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA6BJREFUeNrsnd9t2zAQxhlDAwhdIH7uS+wJKk8Qe4LaEyRZoKm7gO0J4kxgewLJEyR96Ws9QeEN2iN8DAShkiiSEiX5+wFEjESgrO94x+MfMUIAAAAAAAAAAAAAAAAAALVz0/QN/3z7HNKPEZWIyh2VkD+3ncmnH7+SnGeS3z9O/WpJ137XqTRoSPQh/ZhSue+I2I0R1Cy8FPuBxW8bicY1I/bQbhmAhJeCr6gM29ryKERMNJ4jrttjA8fCj1h4hBlNBg7Fl53OG8Rv2AO4g91xvARNegB3sm8Q34MBSPw5574hZGw4BLH4L11+cPbeMsLWGaAP4jNx50IQt5oXAZr3gFS208To9EzlZ8u0OvkOQbsaYuKeykEKTyPTEzygeJDlKtWUrXtDZXutolcyAE8vPDu631pcpmrPiP76HrByFD8XefPp18xNSeufOuh438VlMaPTrZ7DcB63VOaZZOJYcP1H+A1qbv29EJ+pEoYjUTwpmaisalDS+ocQ318f8NUy5vdZ/FPFcUGYl0UGBYMum2XERc9b/qvuontqBiGuMhVhI/4a2Y4+A8fhR7b6JWS1MEBq344JG3S69h4QWdS3haT2BjBt/XvM7bgxwJ1hXQfI6cYApoMvZD4eQ9AZ4cdtGmoy7QA8GgDAA+ABwKMBsDURHgAPAI4MYNKhhryGABwYwHRAFUFONwYw3RJ4Dzn9hSDJFGHIjQESi/rmkNTSALyiZeoFD7yiBizT0FfD+qT4z5BVn7x9QXLbuOmuuEfygkPPd0Z8KdmqmOU27w+5e0PpBnJPqOn2FJnKjvu0QE96/HVY3cfBH0Uj4Y3FDWQ2FKM/sJiKYAudLOoewQjmfYDiSdhtT1dG6MM+0WVJjJ9nUvljSYgu7gNSsc/FiSHyhr19QcPmwCad2dAnB99R9QkrhKSKBiBLvgt3+z0fqfyWKRymLfQ9QLA7uVr3VYM1aYidfPP+mo1R5T3hmbicjOIyhEzVWIOMoDovxbFlWtXyWq22AeTNSaSZqPeMhSjncxuwTcvNQ1BmbLBA5PYTgpQRthwuun5ox0TjmpWoeb3b6LygPhhBZ0xCz1j74HFg8QBbbkV4I8aHAVKtaCywNdGPAVR2RGUs8HKeHwNkBmtjgRc1/BhATVvwkcAzUdMJU1efhmoaQi5p7tt8eDfP8pYx6qQBMp100tLj66PeesD/OmpxOS1r3eF/4AAAAAAAAAAAAAAAAAAAdJV/AgwAyEAl87gUsesAAAAASUVORK5CYII=");
    background-size: 1.3em;
}
/* 返回中間價格 */

.icon-back-price {
	background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABDpJREFUeNrsXNtR40AQXLscgOsSOPHLz0EE2BEAEWBHAE6AxyUAjkAmApsIJCKw+blfdAlQCuF2z+M6w+mxj1nJkrqrtlRgySV3z8zOjLQrBAAAAAAAAAAAAFApejonfdweT+ThTI6gxVy80jGWY/Pt56+0dgEk8UN5WMox6qBxJnKs5HiWYmzqEiDqKPlZYjzL8cTtGb0C8hXxEbj/BEX+nFOIfsFnV+D7P6iQfCfHuzTQC98CBOC7UIilFGFJ86QXAYByKC9YSxFOfAiQgF8tqEgRUarOKsAruDUKSaGNCGVp6FoeTsCvEaYyQ1pwzQFjVRWCUyOEJnOCbiviRh7OWxw+uL1c1Qin0hMSFgG6AEonVfF5RtmNaxqu+kmnEMBeECXCtXBrxTxIEe4hgLsQIYUqGxwVhSIUYiWQ5KmO6JHYdkatJmV4AJ83KDJtCq6xFDKGB7h7w1TFdYtL7+AB9XtCphfAA+w9wbRAvUII4sUlFVy6mGS1riGAvReo1HJueNkFBOAVQRVZicEl5xCAH3N4QL1YGGZQIwjAG4ZSQxEggAeYPD38DgH4ERucG0AAPympbjaEEOQJic1FEAACtAa/IUADAQEgQGvwAwLUiyEEqBe6L3elEIAZH7fHgYEHbCoV4Gv3r6Uw+Y2f6oWBJ9KVOz7ubkz+rQ6xHDOfKw5rhMl7s29ePYAsfp1hFX//z7W26sDCj8lvir0JQJa/LDktdF1XdWCYGJybfo0AfWbyI43JaCjs3i47ROtXv+Xa4JKVlzSU3FCHfJuYeci4M8z/X9kF2NvOoE1hRdfjb0zCD7sHEPmR6Ng6sj2jM8Eqa3V9vybyk4ZroMgPDK954G5FPDpY/rzB1h8K81Uzcd4ijYHDTdhmMk9NLMbI40PDnH+HWd4H/YrJX0jyZw2dcCNL8hdFBjcwvJGJA/kreq27aVZ/IwoWWGhkPoUGNzAkP7S8EWUB0wYRH5ChXTum17OyfYV6FZE/rmoPNgfCA/FvnfCI4WuVx1+WndTTuDkV/9YC8GJ0PQ3yI9GxKtcRKZGvlen1QH595OcKQLP/O8j3S35mHbDXYgD5nsnPK8Q611xjmHCPbKv7rDpg7pBydg2lu6HYzgGq+nsEv7mIBdMLBkVZkEvPp61IyOoXXF9YVgdABKpqxXYT7xX3F+tUwl0UIaUw8yJynmRxQacZN6OsyDYz2tAPaQLp6l4Tnc32KvOAL7WBrQhTzrjZJmjvF8QgwmlLX0usRgASIRDbzujQ0sXHEMFBABLBpUmXUtWYgvr8VkQhyILHwmyzoh12j/gAWwH2RLB9xHgO2h0FIBFWliKg0cchAImwEA162N46AfZEMNlLE1kQpwAkwr3Q37ToGbQzC0AiTDVESIThFl8QgE8EFXouUQM4FmKaxdpIbHeKDaheeEEvCAAAAAAAAAAAADgI/BFgAOVyayLI/utCAAAAAElFTkSuQmCC");
	background-size: 1.3em;
}

.H-L{
	position: absolute;
	z-index: 1;
}
.buy-oco{
	min-width: 1.5em;
	color:initial;
	background-color:#FFAEC9;
}
.sell-oco{
	min-width: 1.5em;
	color:initial;
	background-color:#B8E986;
}
.bgc-up-pos{
	background-color:#FFAEC9;
}
.bgc-up-pos::after{
	border-color: transparent transparent transparent #FFAEC9;
}
.bgc-dn-pos{
	background-color:#B8E986;
}
.bgc-dn-pos::before{
	border-color: transparent #B8E986 transparent transparent;
}
.moveEl{
	position: absolute;
}
.scrollLock{
	overflow: hidden;
}
/* 閃電所有按鈕調整一致大小與弧角 */
.cbtn {
	width: 8vw !important;
	height: 8vw !important;
	border-radius: 2vw !important;
}
.opacity {
	opacity: 0.2;
}
.oco-buy-select-ctn, .oco-sell-select-ctn {
	position: absolute;
	top:0;
	left: 0;
	bottom:0;
	right:0;
	border-radius: 1vw;
	max-height: 2em;
	margin: auto;
}
.oco-buy-select-ctn{
	border-top-left-radius: 2vw;
	border-bottom-left-radius: 2vw;
	background-color: rgb(255, 0, 98);
}
.ENG .oco-buy-select-ctn{
	background-color: rgb(0, 255, 115);
}
.oco-sell-select-ctn{
	border-top-right-radius: 2vw;
	border-bottom-right-radius: 2vw;
	background-color: rgb(0, 255, 115);
}
.ENG .oco-sell-select-ctn{
	background-color: rgb(255, 0, 98);
}
.oco-buy-select-ctn::before{
	content: '';
	width: 0px;
    height: 0px;
    border-width: 15px;
    border-style: solid;
    border-color: transparent transparent transparent rgb(255, 0, 98);
    position: absolute;
    top:0;
	bottom: 0;
    right:-28px;
	z-index: 1; /** 為了蓋過檔位前的多筆回報icon */
	margin: auto;
}
.ENG .oco-buy-select-ctn::before{
	border-color: transparent transparent transparent rgb(0, 255, 115);
}
.oco-sell-select-ctn::before{
	content: '';
	width: 0px;
    height: 0px;
    border-width: 15px;
    border-style: solid;
    border-color: transparent rgb(0, 255, 115) transparent transparent;
    position: absolute;
    top:0;
	bottom: 0;
    left:-28px;
	z-index: 1;  /** 為了蓋過檔位前的多筆回報icon */
	margin: auto;
}
.ENG .oco-sell-select-ctn::before{
	border-color: transparent rgb(255, 0, 98) transparent transparent;
}
.orderList-icon {
	position: absolute;
	left: 1vw;
}
.selected {
	box-shadow: 0px 0px 1vw 1vw rgba(255, 120, 0, 0.5);
	transform: scale(1.1);
	transition: all ease 0.3s;
	z-index: 1;
}
.table-mask {
	position: fixed;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	pointer-events: all;
	background-color: rgba(0,0,0,0.8);
}
.scroll-lock {
	overflow: hidden;
}
.space-row {
	opacity: 0;
	line-height: 1px;
}
.ts-jump-qty {
	font-weight: normal;
}
/** 出場背景色 */
.bgc-sp-SELL, .bgc-sp-BUY {background-color: #3399FF !important;}
.bgc-sp-SELL::before {border-color: transparent #3399FF transparent transparent !important;}
.bgc-sp-BUY::after {border-color: transparent  transparent transparent #3399FF !important;}
.bgc-sl-SELL, .bgc-ts-SELL, .bgc-sl-BUY, .bgc-ts-BUY {background-color: #9933FF !important;}
.bgc-sl-SELL::before, .bgc-ts-SELL::before {border-color: transparent #9933FF transparent transparent !important;}
.bgc-sl-BUY::after, .bgc-ts-BUY::after {border-color: transparent  transparent transparent #9933FF !important;}

.desktop .thead{
	min-height: 2.5em;
}
.desktop .cbtn {
    width: 2.25em !important;
    height: 2.25em !important;
	border-radius: 0.5em !important;
}
.desktop .cbtn:hover {
	color: aqua;
	background-color: #555;
    cursor: pointer;
}
.desktop .table-mask {
	/* position: absolute; */
}
.desktop .orderList-icon {
	left: 0.2em;
}
</style>
