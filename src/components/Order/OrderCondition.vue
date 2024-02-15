<template>
    <div class="order-condition">
		<!-- 交易帳號選擇器 -->
		<LoginedBTOSelector class="logined-bto-selector" :orderMode="true" 
			:class="{'flex-1 setting-line mgb3': mode==1, 'list-item': !mode, 'mgr2': orderBoxMode===0 && !mode}" />
		<!-- 委託控制UI for 下單盒、高級下單盒 -->
		<div class="condition-group flex-col posr flex-1" v-if="!mode">
			<!-- 委託別下拉選單 -->
			<OrderTypeSelector :sid="sid" class="list-item order-type-selector" :param="param" />
			<!-- 市價轉設定價說明 -->
			<ConvertMarketPriceMemo v-if="enableCMP" class="list-item" />
			<!-- 效期別下拉選單 -->
			<TimeInForceSelector v-show="!enableCMP && orderBoxMode===1" :sid="sid" class="list-item" />
			<div class="list-item" v-if="orderBoxMode===1 && $store.state.order.inputTimeInForce == 'GTD'">
				<div class="flex-row btn-default-ht-rd tcef date-select" >
					<i class="material-icons mgt1 icon-right mgl3 mgr2">date_range</i>
					<div class="date-ctn posr flex-start">
						<span class="date-label">{{new Date(date).day10()}}</span>
						<input type="date" v-model="date" class="start-date-ctn flex-row row-reverse FULL" :min="minDate"/>
					</div>
				</div>
			</div>
			<!-- 停損價 or 觸價 -->
			<div class="list-item" v-show="displayStop">
				<InputPrice v-model.number="$store.state.order.inputStopPrice" :label="$ln(`停损`)" /></div>
			<div class="list-item" v-show="displayTouch">
				<InputPrice v-model.number="$store.state.order.inputTouchPrice" :label="$ln(`触价`)" /></div>
			<!-- 委託價 or 跳數 -->
			<div class="list-item" v-if="displayPriceInputCtn">
				<InputPrice v-model.number="$store.state.order.inputOrderPrice" :label="$ln(`价格`)" /></div>
			<div class="list-item" v-if="jumpInputCtn && !isSSEProtection">
				<InputQty v-model="$store.state.order.jumpCnt" :step="1" :min="0" :label="$ln(`跳数`)"/></div>
			<!-- 上海證券交易所/註冊制 : 保護限價 -->
			<div class="list-item" v-if="isSSEProtection">
				<InputPrice v-model.number="$store.state.order.inputProtectionPrice" :label="$ln(`保护限价`)" /></div>
			<!-- 手數 -->
			<div class="list-item">
				<InputQty v-model="$store.state.order.inputOrderQty" :label="qtyLabel" />
			</div>
			<!-- 備兌 -->
			<div v-if="isETF && !$store.state.login.isSIM" class="flex-row flex-start pdlr2">
				<span class="font-size-small clr-gray2 flex-1">{{$ln(`备兑`)}}</span>
				<Toggle class="mgl1 toggle-mini" v-model="$store.state.order.covered" :mode="'mini'" />
			</div>
		</div>
		<!-- 商品搜尋 -->
		<SymbolSearch class="symbol-search setting-line mgb3" v-if="mode==1"
			v-model="$store.state.order.symbolB" noValue="请选择商品B" lock="true" isStopSub="true" />
		<!-- 委託控制UI for 觸A下B -->
		<div class="condition-group flex-row" @click="onCheckClick" v-if="mode==1">
			<div class="left-ctn flex-col flex-1 mgr2" :class="{'pointer-events-none': !conditionEnabled}">
				<!-- 買進設定按鈕 -->
				<div class="setting-line mgb2">
					<Button class="pdlr3 bgc-333 clr-white" :class="{focus: side=='BUY'}" @click="side='BUY'">{{$ln('买进')}}</Button>
				</div>
				<!-- 委託別下拉選單 -->
				<OrderTypeSelector :sid="sid" class="list-item order-type-selector" :symbol="sid" :param="param" />
				<!-- 市價轉設定價說明 -->
				<ConvertMarketPriceMemo v-if="enableCMP" class="list-item" />
				<!-- 效期別下拉選單 -->
				<TimeInForceSelector v-show="!enableCMP && orderBoxMode===1" :sid="sid" class="list-item" :symbol="sid" />
				<div class="list-item" v-if="orderBoxMode===1 && $store.state.order.inputTimeInForce == 'GTD'">
				<div class="flex-row btn-default-ht-rd tcef date-select" >
					<i class="material-icons mgt1 icon-right mgl3 mgr2">date_range</i>
					<div class="posr flex-start">
						<span class="date-label">{{new Date(date).day10()}}</span>
						<input type="date" v-model="date" class="FULL" :min="minDate"/>
					</div>
				</div>
			</div>
			</div>
			<div class="right-ctn flex-col flex-1" :class="{'pointer-events-none': !conditionEnabled}">
				<!-- 賣出設定按鈕 -->
				<div class="setting-line mgb2">
					<Button class="pdlr3 bgc-333 clr-white" :class="{focus: side=='SELL'}" @click="side='SELL'">{{$ln('卖出')}}</Button>
				</div>
				<!-- 停損價 or 觸價 -->
				<div class="list-item" v-show="displayStop">
					<InputPrice v-model.number="$store.state.order.inputStopPrice" :label="$ln(`停损`)" :propSid="sid" /></div>
				<div class="list-item" v-show="displayTouch">
					<InputPrice v-model.number="$store.state.order.inputTouchPrice" :label="$ln(`触价`)" :propSid="sid" /></div>
				<!-- 委託價 or 跳數 -->
				<div class="list-item" v-if="displayPriceInputCtn">
					<InputPrice v-model.number="$store.state.order.inputOrderPrice" :label="$ln(`价格`)" :propSid="sid" /></div>
				<div class="list-item" v-if="jumpInputCtn">
					<InputQty v-model="$store.state.order.jumpCnt" :step="1" :min="0" :label="$ln(`跳数`)"/></div>
				<!-- 手數 -->
				<div class="list-item">
					<InputQty v-model="$store.state.order.inputOrderQty" :label="qtyLabel" :symbol="sid" />
				</div>
				<!-- 備兌 -->
				<div v-if="isETF && !$store.state.login.isSIM" class="flex-row flex-start pdlr2">
					<span class="font-size-small clr-gray2 flex-1">{{$ln(`备兑`)}}</span>
					<Toggle class="mgl1 toggle-mini" v-model="$store.state.order.covered" :mode="'mini'" />
				</div>
			</div>
		</div>
		<div class="hidden">
			{{buyOrderPrice}}
			{{sellOrderPrice}}
		</div>
    </div>
</template>

<script>
import ConvertMarketPriceMemo from "@/components/ConvertMarketPriceMemo.vue";
import SymbolSearch from '@/components/SymbolSearch';
export default {
	props: ['mode', 'propSid', 'param'],
	data() {
		return {
			date: new Date(),
			minDate: new Date().day10('-'),
		}
	},
	beforeMount() {
		// init 就決定 ticksize (如果隨跳動取 ticksize 太重)
		this.tickSize = M4C.Symbol.getTickSize(this.sid, this.qop);
	},
	beforeDestroy() {},
	components: {
		ConvertMarketPriceMemo,
		SymbolSearch
	},
    methods: {
		onCheckClick() {
			if(!this.$store.state.order.symbolB && this.mode == 1){
                // 防連點機制
			    if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 3000);
                this.$store.state.notify('请先选择委托商品B');
            }
		},
	},
	watch:{
		date(ov){
			this.$store.state.sync.datePick.date = ov;
		}
	},
    computed: {
		sid() {return this.propSid || this.$store.state.selectedSymbol.ID;},
		minfo() {return this.$store.state.selectedSymbol.MInfo;},
		qo() {return M4C.Quote.getQuoteObject(this.sid);},
		qop() {
			return this.qo.p || this.qo.r || this.qo.pc || 0;
		},
		twMode() {
			return this.$store.state.config.twMode;
		},
		qtyLabel() {
			return this.$ln(this.isStock ? '股数' : '手数');
		},
		isStock() {
			return this.sid.split(".")[1] === "S";
		},
		/** 当前商品是否为 ETF 期权 */
		isETF() {
			return (this.minfo.Exchange === "SSE" || this.minfo.Exchange === "SZSE") && this.minfo.Type === "O";
		},
		/** 台灣期交所 TWF */
		isTWF() {
			return this.minfo.Exchange === "TWF";
		},
		// 顯示停損介面
		displayStop() {
			return !this.displayTouch && (this.orderType==='STOP' || this.orderType==='STPLMT');
		},
		// 顯示觸價介面 (觸價價格)
		displayTouch() {
			return this.orderType === "MIT" || this.orderType === "LIT";
		},
		// 委託別
		orderType() {
			return this.$store.state.order.orderType;
		},
		$order() {
			return this.$store.state.order;
		},
		// 下單盒模式 (0:普通, 1:高級)
		orderBoxMode() {
			return this.$store.state.config.orderBoxMode;
		},
		// 是否顯示價格輸入區塊
		displayPriceInputCtn() {
			switch(this.orderType) {
				case 'LIMIT':	// 限價
				case 'STPLMT':	// 停損限價
				case 'LIT':		// 觸價限價
					return true;
			}
		},
		/** 是否顯示跳數輸入區塊 */
		jumpInputCtn() {
			// return this.orderType === 'HIT' || this.orderType === 'JOIN' ? true : false;
		},
		/** 當前交易所支持的委託別 */
		exgOrderType() {
			let exgOrderType;
			let tmp = this.sid.split('.');
			let sType = tmp[1];
			let exgId = tmp[2];
			// 從 pdsetting 取得 [交易所] 指定支持的委託別
			try{exgOrderType = this.$store.state.config.tradePdSetting.OrderType[sType][exgId];}catch(e){};
			// 未設定時預設的委託別
			exgOrderType = exgOrderType || this.$store.state.config.defaultOrderType;
			return exgOrderType;
		},
		/** 跳數 x TickSize */
		jumpDiff() {
			return +Big(this.tickSize).times(this.$store.state.order.jumpCnt);
		},
		/** 買進委託價格 */
		buyOrderPrice() {
			switch (this.orderType) {
				case 'LIMIT':
				case 'STPLMT':
				case 'LIT':
					return this.$order.buyOrderPrice = parseFloat(this.$order.inputOrderPrice);
				case 'HIT':
					return this.$order.buyOrderPrice = +Big(this.qo.sp1 || this.qop).plus(this.jumpDiff);
				case 'JOIN':
					return this.$order.buyOrderPrice = +Big(this.qo.bp1 || this.qop).minus(this.jumpDiff);
				default:
					return this.$order.buyOrderPrice = 0;
			}
		},
		/** 賣出委託價格 */
		sellOrderPrice() {
			switch (this.orderType) {
				case 'LIMIT':
				case 'STPLMT':
				case 'LIT':
					return this.$order.sellOrderPrice = parseFloat(this.$order.inputOrderPrice);
				case 'HIT':
					return this.$order.sellOrderPrice = +Big(this.qo.bp1 || this.qop).minus(this.jumpDiff);
				case 'JOIN':
					return this.$order.sellOrderPrice = +Big(this.qo.sp1 || this.qop).plus(this.jumpDiff);
				default:
					return this.$order.sellOrderPrice = 0;
			}
		},
		// 有市價轉換設定
		enableCMP() {
			return this.$order.orderType === 'MARKET' && this.$store.state.order.convertMarketPrice;
		},
		side: {
			set(v){this.$store.state.order.side = v;},
			get(){return this.$store.state.order.side;},
		},
		conditionEnabled() {return this.mode != 1 || (this.mode==1 && this.$store.state.order.symbolB)},
		// 上海證券交易所/註冊制 : 保護限價
		isSSEProtection() {
			return M4C.Order.isSSEProtection({'sid': this.sid, 'orderType': this.$order.orderType});
		},
	},
}
</script>

<style scoped>
.logined-bto-selector {
	height: 35.75px;
}
.label {
	white-space: nowrap;
	overflow: hidden;
}
input {
	text-align: center;
	height: 10vw;
	padding: 0;
	border: 0;
	border-radius: 6px;
}
.list-item {
	width: 44vw;
	margin-bottom: 3vw;
}
.setting-line {padding: 0;}
.left-ctn .focus {background-color: #FF3339 !important;}
.right-ctn .focus {background-color: #148A14 !important;}
.symbol-search {padding-left: 2vw;}
.desktop .list-item {
	width: 10em;
	margin-bottom: 0.5em;
}
.desktop .logined-bto-selector {
	height: 2.28em
}

input {
    background: rgba(0,0,0,0);
    border-width: 0;
    color: white;
    width: 5.5em;
    opacity: 0;
}
input::-webkit-calendar-picker-indicator {
    opacity: 0;
    background: rgba(0, 0, 0, 0);
    position: absolute;
    width: 200px;
    height: 1em;
    background-image: none !important;
}
input::-webkit-inner-spin-button {
    display: none;
    background: none !important;
    width:0;
}
.date-select{
	box-sizing: border-box;
	border: 1px solid #393939
}
</style>