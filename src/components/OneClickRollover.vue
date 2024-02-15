<template>
	<div class="composite-position-close-box flex-col">
		<div class="body pdlr5 mgtb5 flex-col flex-center">
			<div class="flex-col">
				<div class="mgt3 flex-row flex-center">
					<span class="th">{{$ln(`轉倉月份`)}} :</span>
					<div class="flex-1 pdl3">
						<!-- 月份選單 -->
						<SingleSelect class="w100p" :options="mthOptions" v-model="mth2" />
					</div>
				</div>
				<div class="mgt3 flex-row flex-center">
					<span class="th">{{$ln(`委託合約`)}} :</span>
					<div class="flex-1 pdl3 flex-row">
						<div class="mgr2"><span class="flex-center cbtn clr-white" :class="[psd1BS.class]">{{$ln(psd1BS.label)}}</span></div>
						<SymbolCNM4 :sid="sid1" />
						<div class="mgr2"><span class="flex-center cbtn clr-white" :class="[psd2BS.class]">{{$ln(psd2BS.label)}}</span></div>
						<SymbolCNM4 :sid="sid2" />
					</div>
				</div>
				<div class="mgt3 flex-row flex-center">
					<span class="th">{{$ln(`委託單別`)}} :</span>
					<div class="flex-1 pdl3">
						<!-- 委託別下拉選單 -->
						<OrderTypeSelector :sid="sid" class="list-item order-type-selector" :param="{orderType: 'LIMIT'}"/>
					</div>
				</div>
				<div class="mgt3 flex-row flex-center">
					<span class="th">{{$ln(`委託效期`)}} :</span>
					<div class="flex-1 pdl3">
						<!-- 效期別下拉選單 -->
						<TimeInForceSelector :sid="sid" class="list-item" />
					</div>
				</div>
				<div v-if="orderType==='LIMIT'" class="mgt3 flex-row flex-center">
					<span class="th">{{$ln(`委託價格`)}} :</span>
					<div class="flex-1 pdl3">
						<InputPrice class="input-item" v-model.number="inputPrice" :label="$ln('價差')" :propSid="sid1" />
					</div>
				</div>
				<div class="mgt3 flex-row flex-center">
					<span class="th">{{$ln(`轉倉數量`)}} :</span>
					<span class="td flex-1 pdl3"><InputQty class="" v-model="orderQty" :label="$ln('數量')" :max="availableQty" /></span>					
				</div>
			</div>
		</div>
		<div class="flex-1" />
        <div class="mgb10 flex-row flex-center pdt2">
            <Button class="font-size-big btn-cancel mgr2" @click="onClose">{{$ln("取消")}}</Button>
            <Button class="font-size-big btn-confirm mgl3" @click="onBtnConfirm" :class="[psd2BS.class]">{{$ln(confirmBtnText)}}</Button>
        </div>
	</div>
</template>

<script>
export default {
	props: ['param'],
	data() {
		return {
			orderQty: 1,
			inputPrice: 0,
			mth2: '',
		}
	},
	beforeMount() {
		this.$emit("title", this.$ln(`一鍵轉倉`));
		// 找出 sid1 的下個月份的 sid
		let idx = this.contractList.findIndex(sid=>sid===this.sid1);
		let sid = (idx !== -1 && idx !== this.contractList.length-1) ? this.contractList[idx+1] : this.sid1;
		this.mth2 = sid.split('.')[4];
	},
	mounted() {
		this.orderQty = Number(this.psd.OFFSETABLE_BUY_QTY) || Number(this.psd.OFFSETABLE_SELL_QTY);
	},
	beforeDestroy() {},
	components: {},
	methods: {
		onBtnConfirm() {
			let orderInfo = {
				"ACTION": "NEW",
				"SYMBOL": this.sid,
				"SIDE": this.psd2BS.side,
				"POSITION_EFFECT": "AUTO",
				"TC_ORDER_TYPE": this.orderType,
				"TIME_IN_FORCE": this.orderType === 'LIMIT' ? 'ROD' : 'IOC',
				"ORDER_PRICE": this.orderType === 'LIMIT' ? this.inputPrice : 0,
				"ORDER_QTY": this.orderQty,
				"AP_PLUGIN": 'OneClickRollover',
			}
			if (this.$store.state.order.confirm){
				// 提示确认视窗
				eventBus.$emit("POPUP-DIALOG", 'OrderConfirm', {
						orderInfo: orderInfo,
						from: 'OneClickRollover',
						onConfirmCallback: ()=>{eventBus.$emit("CLOSE-DIALOG");},
					}, {transName: 'float'});
			}
			else {
				M4C.Order.sendOrder(orderInfo);
				// 關閉彈窗
				eventBus.$emit("CLOSE-DIALOG");
			}
		},
		onClose() {
			// 關閉彈窗
			eventBus.$emit("CLOSE-DIALOG");
		},
	},
	watch: {},
	computed: {
		psd() {
			return this.param.psd;
		},
		symbolId() {
			return M4C.Symbol.getPureSymbol(this.sid1);
		},
		contractList() {
			return M4C.Symbol.mapSymbolToContracts[this.symbolId] || [];
		},
		// 月份下拉選單
		mthOptions() {
			let optionList = [];
			let sid1mth = M4C.Symbol.getPureMonth(this.sid1);
			this.contractList.forEach(sid=>{
				let mth = sid.split('.')[4];
				// 僅列出比合約一更遠的月份
				if (Number(mth) > Number(sid1mth))
					optionList.push({label: mth, value: mth, selected: sid===this.sid2});
			});
			return optionList;
		},
		// 'I.F.TWF.TXF.202211.TXF.202212'
		sid() {
			return `${this.sid1}.${this.sid2.split('.').slice(3,5).join('.')}`;
		},
		sid1() {
			return this.psd.SYMBOL;
		},
		sid2() {
			return `${this.symbolId}.${this.mth2}`;
		},
		psd1BS() {
            return this.psd.$BUYSELL === 'BUY' ? {class: 'bgc-dn', label: '賣', side: 'SELL'} : {class: 'bgc-up', label: '買', side: 'BUY'};
		},
		psd2BS() {
            return this.psd.$BUYSELL === 'BUY' ? {class: 'bgc-up', label: '買', side: 'BUY'} : {class: 'bgc-dn', label: '賣', side: 'SELL'};
		},
		// 可平倉數量
		availableQty() {
			return this.psd.$OFFSETABLE_QTY;
		},
		orderType() {
			return this.$store.state.order.orderType;
		},
		confirmBtnText() {
			return this.psd2BS.side === 'BUY' ? '買進' : '賣出';
		}
	},
}
</script>

<style scoped>
.single-select-ctn {
	width: 50vw;
}
.input-qty-ctn, .input-price-ctn {
	width: 45vw;
}
.composite-position-close-box /deep/ .single-select-ctn .select-btn {
	border: 1px solid #666;
}
</style>