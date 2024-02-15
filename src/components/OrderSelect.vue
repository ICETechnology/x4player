<template>
    <div class="order-modify-ctn flex-col">
		<div class="head flex-center mgtb3">
			<span>{{$ln(`下单选择`)}}</span>
		</div>
		<div class="flex-1 flex-center pdtb10" v-if="notSupported">{{$ln('不支持的委託方式')}}</div>
		<div class="body mgb3 pdlr3 flex-col" v-else>
			<!-- 手数 -->
			<div class="flex-row flex-center">
				<div class="label">{{$ln(`手　　数`)}}</div>
				<div class="flex-1"><InputQty v-model="orderQty" /></div>
			</div>
			<div class="mgt5" v-if="$store.state.selectedSymbol.QO.p <= orderPrice">
				<radio class="flex-col radio-border" v-model="selectedTag">
					<div value="SL" v-if="!isStockItem">{{$ln(`限价卖出`)}}(SL)@{{showPrice}}</div>
					<div value="BS" v-if="!hiddenSMO" :class="{'disabled-ui': !isAgreeSMO}" @click="checkAgree">
						{{$ln(`突破买进`)}}(BS)@{{showPrice}}
					</div>
				</radio>
			</div>
			<div class="mgt5" v-if="$store.state.selectedSymbol.QO.p > orderPrice">
				<radio class="flex-col radio-border" v-model="selectedTag">
					<div value="BL">{{$ln(`限价买进`)}}(BL)@{{showPrice}}</div>
					<div value="SS" v-if="!isStockItem && !hiddenSMO" :class="{'disabled-ui': !isAgreeSMO}"  @click="checkAgree">
						{{$ln(`突破卖出`)}}(SS)@{{showPrice}}
					</div>
				</radio>
			</div>
		</div>
		<div class="foot flex-row only-confirm" v-if="notSupported">
			<div class="flex-center flex-1 fd-content-bdc confirm-btn" @click="$emit('close')">{{$ln('确认')}}</div>
		</div>
		<div class="foot flex-row" v-else>
			<div class="flex-center flex-1 fd-content-bdc cancel-btn" @click="$emit('close')">{{$ln('取消')}}</div>
			<div class="flex-center flex-1 fd-content-bdc confirm-btn" :class="{'disabled-ui': disableConfirm}" @click="onBtnConfirm">{{$ln('确认')}}</div>
		</div>
    </div>
</template>

<script>
export default {
	props: ["param"],
	data() {
		return {
			selectedTag: "",
			orderPrice: 0,
			orderQty: 1,
			/** 台灣交易所 - 倉別 */
			tw_PositionEffect: "AUTO",
			/** 当冲 */
			dayTrade: false,
		}
	},
	beforeMount() {
		this.orderPrice = this.param.orderPrice;
		this.orderQty = this.param.orderQty || this.$store.getters.getDefaultQty;
		if(this.$store.state.selectedSymbol.QO.p <= this.orderPrice){
			this.selectedTag = "SL";
			// 證券沒有限價賣出情境。
			if(this.isStockItem)
				this.selectedTag = "BS";
		}
		else{
			this.selectedTag = "BL";
		}
	},
    methods: {
		// 確認
		onBtnConfirm() {
			// 當證券商品突破買進但沒有簽署同意書的情況下
			if(this.disableConfirm) {
				this.checkAgree();
				return;
			}
			let rpt = this.rpt;
			// 預掛單(突破買進，突破賣出)
			let smoOrderInfo = {
				"ACTION": "NEW",
				"SYMBOL": this.sid,
				"SIDE": this.side,
				"POSITION_EFFECT": this.oiPositionEffect,			// 更改以下單盒邏輯判斷倉別(但暫不考慮備兌、平倉情境)
				"TC_ORDER_TYPE": "STOP",
				"TIME_IN_FORCE": this.param.timeInForce || "IOC",
				"ORDER_PRICE": 0,
				"ORDER_QTY": this.orderQty,
				"SMO_TYPE": "SMO",									// 指定由誰洗價SMO: Dcore, NONE: 上手。
				'AP_PLUGIN': this.useComName || this.selfComName,
			}
			if(this.selectedTag === "SS" || this.selectedTag === "BS") {
				smoOrderInfo.STOP_PRICE = Number(this.orderPrice);
			}
			// 限價賣出、限價買進
			let orderInfo = {
				'ACTION': 'NEW',									// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
				'SYMBOL': this.sid,
				'SIDE': this.side,									// 買BUY/賣SELL
				'POSITION_EFFECT': this.oiPositionEffect,			// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
				'TC_ORDER_TYPE': "LIMIT",							// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
				'TIME_IN_FORCE': this.param.timeInForce || "ROD",	// ROD/IOC/FOK
				'ORDER_PRICE': Number(this.orderPrice),
				'ORDER_QTY': this.orderQty,
				"SMO_TYPE": "NONE",
				'AP_PLUGIN': this.useComName || this.selfComName,
			};
			// 送出改單
			M4C.Order.sendOrder(this.selectedTag === "SS" || this.selectedTag === "BS"? smoOrderInfo: orderInfo);
			// 關閉彈窗
			eventBus.$emit("CLOSE-FLOAT-DIALOG");
		},
		checkAgree() {
			// 沒簽署同意書時，關閉視窗並跳出同意書訊息。
			if(!M4C.SmoAgreement.checkAgreeSMO()) {
				// 關閉彈窗
				eventBus.$emit("CLOSE-FLOAT-DIALOG");
				setTimeout(() => {
					M4C.SmoAgreement.popupAgreeMsg();	
				}, 10);
			}
		},
	},
	watch: {},
    computed: {
		sid() {return this.$store.state.selectedSymbol.ID},
		isStockItem() {
			return this.sid.indexOf('I.S') == 0;
		},
		/** 是否有簽署雲端條件單同意書 */
		isAgreeSMO() {
			return M4C.SmoAgreement.checkAgreeSMO();
		},
		/** 不支持賣出的情境 */
		notSupported() {
			// 證券商品且不顯示雲端單且是賣出情境(委託價比現在高)。
			return this.isStockItem && this.hiddenSMO && (this.$store.state.selectedSymbol.QO.p <= this.orderPrice);
		},
		/** 是否隱藏SMO相關功能(By pdsetting) */
		hiddenSMO() {return this.$store.state.config.quotePdSetting.function.hiddenSMO;},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
		side() {return this.selectedTag === "BL" || this.selectedTag === "BS"? "BUY": "SELL";},
		isStock() {return this.sid.split(".")[1] === "S"},
		twMode() {return this.$store.state.config.twMode;},
		/** 委託單 : 倉別 */
		oiPositionEffect() {
			// TW情境
			if (this.twMode) {
				return this.dayTrade ? "DAYTRADE" : this.tw_PositionEffect;
			}
			// 證券一律給AUTO
			if (this.isStock) {
				return "AUTO";
			}
			// 買賣按鈕一律帶 "OPEN" by https://trello.com/c/pYl8PPwm
			if (this.side === "BUY" || this.side === "SELL")
				return "OPEN";
			return "AUTO";
		},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		showPrice() {
			return this.$symbolPrice(this.sid, this.orderPrice);
		},
		// 確認按鈕是否加入disable ui
		disableConfirm() {
			let isSellSide = this.$store.state.selectedSymbol.QO.p <= this.orderPrice;
			return this.isStock && !this.isAgreeSMO && isSellSide;
		},
	},
}
</script>

<style scoped>
.confirm-btn {
	border-bottom-right-radius: 2vw;
}
.cancel-btn {
	border-bottom-left-radius: 2vw;
}
.only-confirm .confirm-btn {
	border-bottom-right-radius: 2vw;
	border-bottom-left-radius: 2vw;
}
.radio-border {
	border: 1px solid rgba(255, 152, 0);
}
.label {
	width: 30vw;
}
.order-modify-ctn {
	border-radius: 10px;
	min-width: 80vw;
	width: 80vw;
}
.cbtn {
	color: white;
}
.body /deep/ .radio-wrapper{
	height: auto;
}
.body /deep/ .radio-wrapper>*{
	min-height: 9vw;
}
@media screen and (orientation: landscape) {
	.order-modify-ctn {
		/* margin: 0 10vh;
		padding: 2vw 4vh; */
		border-radius: 10px;
		min-width: 80vh;
		width: 80vh;
	}
	.cbtn{
		border-radius: 5vh;
		width: 10vh;
		height: 10vh;
	}
	.mgt5{
		margin-top: 5vh;
	}
	.mgtb5 {
		margin: 5vh 0;
	}
}
</style>