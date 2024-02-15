<template>
    <div class="stop-loss-ctn flex-col">
		<MyHead class="head" :backType="1" :margin="$store.state.status.isPortrait"></MyHead>
		<div class="posr flex-1">
			<div class="FULL" :class="$store.state.status.isPortrait? 'flex-col': 'flex-row'">
				<div class="title flex-start" v-if="$store.state.status.isPortrait">{{$ln('快速止盈止损')}} - {{symbolText}}</div>
				<div ref="body" class="body flex-1 scrolling-y" @scroll="onBodyScroll" v-stop-propagation-y>
					<div class="line flex-row" v-for="(item, idx) in rowList" :key="'R'+idx" @click="onRowClick(item, idx)"
						:class="{'new-line': item.newLine, 'avg-line': item.avgLine, 'avg-up-line clr-up': item.avgUpLine, 'avg-dn-line clr-dn': item.avgDnLine}">
						<span class="col1 flex-end">
							<input type="radio" :checked="idx===stopGainIdx || idx===stopLossIdx"
								v-if="item.newUpLine || item.newDnLine" :name="item.newUpLine?'radio-gain':(item.newDnLine?'radio-loss':'')">
						</span>
						<span class="col2 flex-1 flex-center action">
							<span class="clr-up" v-if="idx===stopGainIdx">{{$ln('止盈')}}》</span>
							<span class="clr-dn" v-if="idx===stopLossIdx">{{$ln('止损')}}》</span>
						</span>
						<span class="col3 flex-1 flex-center price">{{item.price}}</span>
						<span class="col4 col1 label-ctn flex-center flex-column">
							<span class="newLabel" v-if="item.newLine">{{$ln('新')}}</span>
							<span class="avgLabel" v-if="item.avgLine">{{$ln('均')}}</span>
						</span>
						<span class="col5 flex-1 flex-end plval">{{item.profit}}</span>
					</div>
				</div>
				<div class="flex-col" :class="{'flex-1': !$store.state.status.isPortrait}">
					<div class="title flex-start" v-if="!$store.state.status.isPortrait">{{$ln('快速止盈止损')}} - {{symbolText}}</div>					
					<div class="foot foot-1 flex-row" :class="{'flex-1': !$store.state.status.isPortrait}">
						<div class="flex-1 clr-up flex-center">{{$ln('止盈')}}: {{stopGainText}}</div>
						<div class="flex-1 clr-dn flex-center">{{$ln('止损')}}: {{stopLossText}}</div>
						<div class="flex-center">
							<!-- 捲動置中圖示 -->
							<span v-if="showScrollMiddleIcon" class="scrollMiddleIcon" @click="onBtnScrollMiddle"><i class="material-icons">center_focus_strong</i></span>
						</div>
					</div>
					<!-- <div class="flex-1" v-if="!$store.state.status.isPortrait">　</div> -->
					<div class="foot foot-2 flex-row pdlr1" v-if="!param">
						<div class="flex-row flex-center inputs-ctn">
							<div class="flex-1"><InputQty v-model="qty" class="font-size-normal"/></div>
						</div>
						<div class="flex-row flex-center side-ctn mgl1 flex-1">
							<radio v-model="effect">
								<span value="AUTO">{{$ln('自')}} </span>
								<span value="OPEN">{{$ln('开')}} </span>
								<span value="CLOSE" v-if="offsetTable.OFFSETABLE_QTY!==0" @click="checkSide">{{$ln('平')}} </span>
							</radio>
						</div>
						<div class="flex-row flex-center side-ctn mgl1">
							<radio v-model="side">
								<span value="BUY">{{$ln('买')}} </span>
								<span value="SELL">{{$ln('卖')}} </span>
							</radio>
						</div>
					</div>
					<div class="foot foot-2 flex-row">
						<div class="flex-1 clr-gray flex-center">{{$ln('可平')}}: {{offsetTable.OFFSETABLE_QTY}}</div>
						<div class="flex-1 flex-center">
							<span v-if="offsetTable.OFFSETABLE_QTY===0 && param">{{$ln('已无可平仓手数')}}</span>
							<Button @click="onBtnOrder" v-if="offsetTable.OFFSETABLE_QTY!=0 || !param">{{$ln('送出委托')}}</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
    </div>
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';

export default {
	mixins: [QuoteAgent],
	props: ['param', 'suspend'],
	data() {
		return {
			sid: this.param? this.param.SYMBOL: this.$store.state.selectedSymbol.ID,
			// qo: this.param? M4C.Quote.getQuoteObject(this.param.SYMBOL): M4C.Quote.getQuoteObject(this.$store.state.selectedSymbol.ID),
			qty: this.param? this.param.$QTY: this.$store.state.order.orderQty,
			avgPrice: this.param? this.param.$OPEN_PRICE: 0,
			rowList: [],
			// 最新價正在哪一列上
			newLineIdx: -1,
			// 止盈正點擊在哪一列上
			stopGainIdx: -1,
			// 止損正點擊在哪一列上
			stopLossIdx: -1,
			// 止盈價格文字
			stopGainText: '-',
			// 止損價格文字
			stopLossText: '-',
			// 可平倉手數
			offsetTable: {},
			// 顯示捲動置中圖示
			showScrollMiddleIcon: false,
			side: 'BUY',
			effect: 'OPEN',				// CTP不支援AUTO所以預設改用OPEN
        }
	},
	beforeMount() {
		let qo = this.qo;
		// 總表
		let minfo = this.minfo = M4C.Symbol.getMainformInfo(this.sid);
		// 每點價值
		this.weight = parseFloat(this.minfo.Weight || 1, 10);
		// 跳動點數
		this.ticksize = M4C.Symbol.getTickSize(this.sid, qo.p);
		// 價格小數長度
		this.decimalLength = M4C.Symbol.getDecimalLength(this.sid, qo.p);

		// 損益的最大小數位數
		let pointVal = +Big(this.weight).times(this.ticksize);
		this.maxProfitDecimalLength = 0;
		for (let i=1; i<=10; i++) {
			let loss = +Big(this.qty).times(i).times(pointVal);
			let len = loss.toString().getDecimalLength();
			this.maxProfitDecimalLength = len > this.maxProfitDecimalLength ? len : this.maxProfitDecimalLength;
		}

		let ids = this.sid.split('.');
		let langCode = this.$store.getters.getMainformLangKey;
		this.symbolText = `${minfo.Name[langCode]} ${minfo.Symbol} ${ids[ids.length-1].substr(2)}`;

		// 查詢&顯示 可平倉手數
		if(this.param)
			this.offsetTable = M4C.Position.getOffsetTable(this.sid, this.param.$BUYSELL);
		else{
			let position = M4C.Position.getPositionSumList().filter(pos => pos.SYMBOL == this.sid)[0];
			let side = position? position.$BUYSELL: 'BUY';
			this.offsetTable = M4C.Position.getOffsetTable(this.sid, side);
		}
	},
    mounted() {
		let tpJump = this.$store.state.order.tpJumpCnt;
		let slJump = this.$store.state.order.slJumpCnt;
		if (this.qo.p) {
			this.createTable();
			let pRow = Math.ceil(this.rowList.length / 2);
			let tpRow = this.rowList[pRow - tpJump];
			let slRow = this.rowList[pRow + slJump];
			if(tpRow)
				this.onRowClick(tpRow, pRow - tpJump);
			if(slRow)
				this.onRowClick(slRow, pRow + slJump);
		}
    },
	beforeDestroy() {
		// M4C.Quote.unsub(this.sid, this);
	},
	components: {
	},
    methods: {
		checkSide(){
			this.side = this.offsetTable.SIDE == 'BUY'? 'SELL': 'BUY';
		},
		createTable() {
			// 最新價列
			this.appendRow(0);
			this.newLineIdx = 20; // 需與下方 20 對應改變
			// 往下/往下建列
			for (let i=1; i<=20; i++) {
				this.appendRow(1);
				this.appendRow(-1);
			}

			setTimeout(()=>{
				this.scrollMiddle();
			}, 100);
		},
		// 建立列
		appendRow(diff) {
			// 取最上面/下面的價格
			let idx = diff > 0 ? 0 : (this.rowList.length-1);
			// 前列的價格
			let lastPrice = diff===0 ? this.qo.p : this.rowList[idx].price;
			// 本列的價格
			let thisPrice = +Big(lastPrice).plus(+Big(diff).times(this.ticksize));
			// 本列與均價差多少個tick
			let rangeDiff = +Big(thisPrice).minus(this.avgPrice).div(this.ticksize);
			// 每 ticksize 價值
			let pointVal = +Big(this.weight).times(this.ticksize);
			// 本列的盈虧
			let thisProfit = +Big(this.qty).times(pointVal).times(rangeDiff);

			// 本列響應式物件
			let rowObj = {};
			rowObj.price = thisPrice.toFixed(this.decimalLength);
			rowObj.profit = thisProfit.toFixed(this.maxProfitDecimalLength);

			// 最新價列
			rowObj.newLine = thisPrice === this.qo.p;
			// 最新價上方列
			rowObj.newUpLine = thisPrice > this.qo.p;
			// 最新價下方列
			rowObj.newDnLine = thisPrice < this.qo.p;
			// 成交均價列
			rowObj.avgLine = thisPrice === this.avgPrice;
			// 成交均上方列
			rowObj.avgUpLine = thisPrice > this.avgPrice;
			// 成交均下方列
			rowObj.avgDnLine = thisPrice < this.avgPrice;

			// 加入至上方或下方
			this.rowList[diff > 0 ? 'unshift' : 'push'](rowObj);
		},
		// 捲到最新價置中
		scrollMiddle() {
			// if (self.lockIcon.is(':visible'))	return;
			let body = this.$refs.body;
			let line = body.getElementsByClassName('new-line')[0];
			let elOffset = body.scrollTop + line.getBoundingClientRect().top - body.getBoundingClientRect().top;
			let elHeight = line.clientHeight;
			let bodyHeight = body.clientHeight;
			body.scrollTop = this.scrollMiddleTop = elOffset - ((bodyHeight / 2) - (elHeight / 2));
		},
		// 捲動情境
		onBodyScroll() {
			let body = this.$refs.body;
			let scrollTop = body.scrollTop;
			console.log('throttleOnScroll.scrollTop', scrollTop);
			// 捲動到頂 -> 動態新增
			if (scrollTop == 0) {
				for (let i=0; i<5; i++) {this.appendRow(1);}
				body.scrollTop = 5*38;
			}
			// 捲動到底 -> 動態新增
			if (scrollTop >= body.scrollHeight - body.clientHeight - 5) {
				for (let i=0; i<5; i++) {this.appendRow(-1);}
			}
			// 捲動 -> 顯示置中按鈕
			if (scrollTop != this.scrollMiddleTop) {
				this.showScrollMiddleIcon = true;
			}
		},
		// 點擊列
		onRowClick(rowObj, idx) {
			// 點在最新列不處理
			if (rowObj.newLine) return;
			if (rowObj.newUpLine)
				this.stopGainIdx = idx === this.stopGainIdx ? -1 : idx;
			if (rowObj.newDnLine)
				this.stopLossIdx = idx === this.stopLossIdx ? -1 : idx;

			// 更新止盈止损价格列
			this.updateGainLossLabel();
		},
		// 更新止盈止损价格列
		updateGainLossLabel() {
			let rowObj = this.rowList[this.stopGainIdx];
			this.stopGainText = rowObj ? rowObj.price : '-';
			rowObj = this.rowList[this.stopLossIdx];
			this.stopLossText = rowObj ? rowObj.price : '-';
		},
		// 點擊捲動置中圖示
		onBtnScrollMiddle() {
			this.showScrollMiddleIcon = false;
			this.scrollMiddle();
		},
		getSide(){
			if(this.param){
				return this.param.$BS=="B" ? "SELL" : "BUY";
			}
			else
				return this.side;
		},
		getQty(){
			if(this.param) 
				return this.offsetTable.OFFSETABLE_QTY;
			else
				return this.qty; 
		},
		// 委託下單按鈕
		onBtnOrder() {
			let side = this.getSide();
			let qty = this.getQty();
			let stopGainPrice = parseFloat(this.stopGainText);
			let stopLossPrice = parseFloat(this.stopLossText);
			let effect = this.param? 'CLOSE': this.effect;
			let orderInfo;
			// 止損+止盈 智慧單
			if (stopGainPrice && stopLossPrice) {
				orderInfo = this.getOCOOrderObj(side, qty, stopGainPrice, stopLossPrice, effect);
			}
			// 單邊止盈或止損 一般單
			else {
				let price = stopGainPrice || stopLossPrice;
				orderInfo = this.getSMOOrderObj(side, price, qty, stopGainPrice, effect);
			}
			// 彈出下單確認頁
			eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: 'FloatOrderConfirm', param: {orderInfo: orderInfo}});
		},
		getSMOOrderObj(side, price, qty, stopGainPrice,effect){
			let orderInfo = {
				"ACTION": "NEW",
				"SYMBOL": this.sid,
				"SIDE": side,
				"POSITION_EFFECT": effect,
				"ORDER_TYPE": "MARKET",
				"CONDITION_TYPE": "NORMAL",
				"TIME_IN_FORCE": "ROD",
				"ORDER_PRICE": 0,
				"STOP_PRICE": price,
				"ORDER_QTY": qty,
				"SMO": {
					"CONDITION": stopGainPrice ? "IFTOUCHED" : "STOP",
					"TRG_PRICE": price,
					"SEND": true
				}
			}
			return orderInfo;
		},
		getOCOOrderObj(side, qty, stopGainPrice, stopLossPrice, effect){
			let orderInfo = {
				"ACTION": "NEW",
				"SMO": {
					"OCO": [{
						"SYMBOL": this.sid,
						"SIDE": side,
						"POSITION_EFFECT": effect,
						"ORDER_TYPE": "MARKET",
						"CONDITION_TYPE": "NORMAL",
						"TIME_IN_FORCE": "ROD",
						"ORDER_PRICE": 0,
						"STOP_PRICE": 0,
						"ORDER_QTY": qty,
						"SMO": {
							"CONDITION": "IFTOUCHED",
							"TRG_PRICE": stopGainPrice,
							"SEND": true
						}
					}, {
						"SYMBOL": this.sid,
						"SIDE": side,
						"POSITION_EFFECT": effect,
						"ORDER_TYPE": "MARKET",
						"CONDITION_TYPE": "NORMAL",
						"TIME_IN_FORCE": "ROD",
						"ORDER_PRICE": 0,
						"STOP_PRICE": 0,
						"ORDER_QTY": qty,
						"SMO": {
							"CONDITION": "STOP",
							"TRG_PRICE": stopLossPrice,
							"SEND": true
						}
					}]
				}
			};
			return orderInfo;
		},
	},
	watch: {
		// 最新價改變
		qop(thisPrice, oldPrice) {
			// 『新』移動到新的最新價的位置
			this.rowList.forEach((obj, idx)=>{
				obj.newLine = obj.price == thisPrice;
				obj.newUpLine = obj.price > thisPrice;
				obj.newDnLine = obj.price < thisPrice;
				if (obj.price == thisPrice)
					this.newLineIdx = idx;
			});
			// 最新價超越止盈止損，移除止盈止損標籤
			if (this.newLineIdx <= this.stopGainIdx)
				this.stopGainIdx = -1;
			if (this.newLineIdx >= this.stopLossIdx)
				this.stopLossIdx = -1;

			// 更新止盈止损价格列
			this.updateGainLossLabel();
			// 捲到最新價置中 (原本就在置中情境時)
			if (!this.showScrollMiddleIcon && oldPrice != undefined)
				this.scrollMiddle();
			// // 紀錄最新價
			// self.tradingPrice = qo.TradingPrice;			
		}
	},
    computed: {
		// 用以 watch 指定 object.key 辦法
		qop() {
			return this.qo.p;
		}
    }
}
</script>

<style scoped>
.title {
	height: 40px;
	padding: 0 10px;
	background-color: #000;
}
.body {
	background-color: #1E1E1E;
}
.body .line {
	height: 40px;
	padding: 0 15px;
	border-bottom: 1px solid #2f2f2f;
}
.body .line.avg-up-line {
	color: #f60000;
}
.body .line.avg-dn-line {
	color: #00d200;
}
.body .line.new-line {
    color: #77C3CB;
    background-color: #183C40;
}
.body .col1 {
	width: 20px;
}
.body .col2 {
	width: 90px;
}
.body .col4 {
	width: 30px;
}
.body .avgLabel {
	color: #FF9800;
}
.body .line input[type="radio"] {
    position: relative;
    display: inline-block;
    width: 13px;
    height: 13px;
    background: transparent;
    border: 1px solid #ddd;
    border-radius: 10px;
    box-shadow: inset 0 1px 1px hsla(0,0%,100%,.8), 0 0 0 1px hsla(0,0%,0%,.6), 0 2px 3px hsla(0,0%,0%,.6), 0 4px 3px hsla(0,0%,0%,.4), 0 6px 6px hsla(0,0%,0%,.2), 0 10px 6px hsla(0,0%,0%,.2);
    cursor: pointer;
    -webkit-appearance: none;
    pointer-events: none;
}
.body .line input[type="radio"]:checked {
    background-color: #d4760f;
}
.foot {
	height: 3em;
}
.foot.foot-2 {
	background-color: #000;
}
.scrollMiddleIcon {
	width: 24px;
    height: 24px;
    margin-right: 12px;
    border-radius: 3px;
    background-position: center center;
    background-repeat: no-repeat;
    background-color: #FF9800;	
}
</style>