<template>
	<div class="composite-position-close-box flex-col">
		<div class="head mg5 flex-center">{{$ln('複式部位平倉')}}</div>
		<div class="head mgb5 flex-center clr-gray">{{symbolName}} - {{strategy.label}}</div>
		<div class="body pdlr5 mgb5 flex-col">
			<div class="flex-row space-between mgb2 pdlr5 list-block">
				<div class="flex-1"><span class="rbtn" :class="[psd1BS.class]">{{$ln(psd1BS.label)}}</span></div>
				<div class="flex-3 flex-start pdl3">{{ m1 }}</div>
				<div class="flex-1"><span class="rbtn" :class="[psd1CP.class]">{{$ln(psd1CP.label)}}</span></div>
				<div class="flex-2">{{ strike1 }}</div>
			</div>
			<div class="flex-row space-between mgb2 pdlr5 list-block">
				<div class="flex-1"><span class="rbtn" :class="[psd2BS.class]">{{$ln(psd2BS.label)}}</span></div>
				<div class="flex-3 flex-start pdl3">{{ m2 }}</div>
				<div class="flex-1"><span class="rbtn" :class="[psd2CP.class]">{{$ln(psd2CP.label)}}</span></div>
				<div class="flex-2">{{ strike2 }}</div>
			</div>
			<CompositePositionCloseBoxSuber :sid="sid1" :BS="side1" :oppositePriceObj="oppositePriceObj1" />
			<CompositePositionCloseBoxSuber :sid="sid2" :BS="side2" :oppositePriceObj="oppositePriceObj2" />
			<div class="divider-top mgtb3 bgc-gray"></div>
			<div class="mgt3 flex-row space-between">
				<div>
					<span class="th">{{$ln(`委託倉別`)}} :</span>
					<span class="td flex-1 pdl3">{{$ln(`平倉`)}}</span>
				</div>
			</div>
			<div class="mgt3 flex-row flex-center">
				<span class="th">{{$ln(`委託價格`)}} :</span>
				<div class="flex-1 pdl3">
					<SingleSelect class="w100p" :options="orderTypeOptions" v-model="orderType" />
				</div>
				<!-- 勾選取價 -->
				<div class="mgl5">
					<CheckBox v-if="orderType==='LIMIT' && strategy.key" v-model="checkFollow">{{$ln('取價')}}</CheckBox>
				</div>
			</div>
			<div v-if="orderType==='LIMIT'" class="mgt3 flex-row flex-center">
				<span class="th">{{$ln(`輸入價格`)}} :</span>
				<div class="flex-1 pdl3">
					<InputPrice class="input-item" v-if="!checkFollow" v-model.number="inputPrice" :label="$ln('價差')" :propSid="sid1" />
					<!-- 自動取價 -->
					<div v-if="checkFollow" class="flex-1 h100p flex-row">
						<div class="mgr2 flex-center">{{$ln('價差')}}</div>
						<div class="flex-1 price-ctn flex-center pdlr2">{{followPrice}}</div>
					</div>
				</div>
			</div>
			<div class="mgt3 flex-row flex-center">
				<span class="th">{{$ln(`平倉數量`)}} :</span>
				<span class="td flex-1 pdl3"><InputQty class="" v-model="closeQty" :label="$ln('手数')" :max="availableQty" /></span>					
			</div>
		</div>
		<div class="foot flex-row">
			<div class="flex-center tcef flex-1 fd-content-bdc cancel-btn" @click="onClose">{{$ln('取消')}}</div>
			<div class="flex-center tcef flex-1 fd-content-bdc confirm-btn" @click="onBtnConfirm">{{$ln('确认')}}</div>
		</div>
	</div>
</template>

<script>
import CompositePositionCloseBoxSuber from "@/components/CompositePositionCloseBoxSuber.vue";
export default {
	props: ['param'],
	data() {
		return {
			closeQty: 1,
			orderType: 'LIMIT',
			inputPrice: 0,
			checkFollow: false,
			oppositePriceObj1: {price: null},
			oppositePriceObj2: {price: null},
		}
	},
	beforeMount() {},
	mounted() {
		this.closeQty = this.psd.$OFFSETABLE_QTY;
	},
	beforeDestroy() {},
	components: {
		CompositePositionCloseBoxSuber,
	},
	methods: {
		onBtnConfirm() {
			let orderInfo = {
				"ACTION": "NEW",
				"SYMBOL": this.sid1,
				"SYMBOL2": this.sid2,
				"SIDE": this.psd1BS.side,
				"SIDE2": this.psd2BS.side,
				"POSITION_EFFECT": "CLOSE",
				"TC_ORDER_TYPE": this.orderType,
				"TIME_IN_FORCE": 'IOC', //複式選擇權一律帶 IOC
				"ORDER_PRICE": isNaN(this.orderPrice) ? 0 : Number(this.orderPrice),
				"ORDER_QTY": this.closeQty,
				"AP_PLUGIN": 'CompositePositionCloseBox',
			};
			M4C.Order.sendOrder(orderInfo);
			// 關閉彈窗
			eventBus.$emit("CLOSE-FLOAT-DIALOG");
		},
		onClose() {
			// 關閉彈窗
			eventBus.$emit("CLOSE-FLOAT-DIALOG");
		},
	},
	watch: {},
	computed: {
		psd() {
			return this.param.psd;
		},
		sid1() {
			return this.psd.COMPOSITE_LIST[0].SYMBOL;
		},
		sid2() {
			return this.psd.COMPOSITE_LIST[1].SYMBOL;
		},
		// 複式部位腳1買賣 (用object同時提供class)
		psd1BS() {
			let isBuy = this.psd.COMPOSITE_LIST[0].SIDE === 'BUY';
			return !isBuy ? {class: 'bgc-up', label: '買', side: 'BUY'} : {class: 'bgc-dn', label: '賣', side: 'SELL'};
		},
		// 複式部位腳2買賣 (用object同時提供class)
		psd2BS() {
			let isBuy = this.psd.COMPOSITE_LIST[1].SIDE === 'BUY';
			return !isBuy ? {class: 'bgc-up', label: '買', side: 'BUY'} : {class: 'bgc-dn', label: '賣', side: 'SELL'};
		},
		// 複式部位腳1CP (用object同時提供class)
		psd1CP() {
			return this.cp1 == 'C' ? {class: 'bgc-C', label: 'C', side: 'C'} : {class: 'bgc-P', label: 'P', side: 'P'};
		},
		// 複式部位腳2CP (用object同時提供class)
		psd2CP() {
			return this.cp2 == 'C' ? {class: 'bgc-C', label: 'C', side: 'C'} : {class: 'bgc-P', label: 'P', side: 'P'};
		},
		// 可平倉數量
		availableQty() {
			return this.psd.$OFFSETABLE_QTY;
		},
		// 委託價格類型
		orderTypeOptions() {
			return [
				{label: "市價", value: "MARKET"},
				{label: "限價", value: "LIMIT"},
			];
		},
		// 委託價格
		orderPrice() {
			if(this.orderType === 'MARKET') {
				return 0;
			} else if(this.checkFollow) {
				return this.followPrice;
			} else {
				return this.inputPrice;
			}
		},
		// 支持未傳入 sid 時使用 selectedSymbol.ID
		cptSid() {
			return this.sid || this.$store.state.selectedSymbol.ID;
		},
		symbolName() {
			return M4C.Symbol.getContractName(this.cptSid);
		},
		side1() {
			return this.psd1BS.side || 0;
		},
		side2() {
			return this.psd2BS.side || 0;
		},
		m1() {
			return this.sid1.split('.')[4];
		},
		m2() {
			return this.sid2.split('.')[4];
		},
		cp1() {
			return this.sid1.split('.')[5];
		},
		cp2() {
			return this.sid2.split('.')[5];
		},
		strike1() {
			return this.sid1.split('.')[6];
		},
		strike2() {
			return this.sid2.split('.')[6];
		},
		// 自動取價價格
		followPrice() {
			let price1 = this.oppositePriceObj1.price || 0;
			let price2 = this.oppositePriceObj2.price || 0;			
			switch(this.strategy.key) {
				// 遠月對手價權利金 - 近月對手價權利金
				case 'StDiffTime':		// 時間價差
					// 非週選時組合 W3 進去比大小 (順序是 W1>W2>X月>X4>X5)
					let mth1 = `${this.m1}${this.m1.length===6?'W3':''}`;
					let mth2 = `${this.m2}${this.m2.length===6?'W3':''}`;
					return +Big(price1).minus(price2).times(mth1 > mth2 ? 1 : -1);
				// 較低履約價權利金 - 高履約價權利金
				case 'BullCallSpread':	// 多頭價差(C)
				case 'BearCallSpread':	// 空頭價差(C)
					return +Big(price1).minus(price2).times(Number(this.strike1) > Number(this.strike2) ? -1 : 1);
				// 較高履約價權利金 - 低履約價權利金
				case 'BullPutSpread':	// 多頭價差(P)
				case 'BearPutSpread':	// 空頭價差(P)
					return +Big(price1).minus(price2).times(Number(this.strike1) > Number(this.strike2) ? 1 : -1);
				// 腳1履約價權利金 + 腳2履約價權利金
				case 'BuyStraddles':	// 買進跨式
				case 'SellStraddles':	// 賣出跨式
				case 'BuyStrangles':	// 買進勒式
				case 'SellStrangles':	// 賣出勒式
					return +Big(price1).plus(price2);
				// PUT腳位的權利金 - CALL腳位的權利金
				case 'Conversions':		// 轉換
				case 'Reversals':		// 逆轉
					return +Big(price1).minus(price2).times(this.cp1 === 'P' ? 1 : -1);
			}
		},
		// 依複式部位邏輯選用的策略
		strategy() {
			return M4C.Option.strategy(this.m1, this.m2, this.side1, this.side2, this.cp1, this.cp2, this.strike1, this.strike2);
		},
	},
}
</script>

<style scoped>
.input-qty-ctn, .input-price-ctn {
	width: 45vw;
}
.composite-position-close-box /deep/ .single-select-ctn .select-btn {
	border: 1px solid #666;
}
.price-ctn {
	height: 2.5em;
	border: 1px solid #393939;
	border-radius: 1vw;
	color: #AAA;
	background-color: #2A2A2A;
}
</style>