<template>
    <div class="order-confirm-ctn flex-col pdlr5 mgt2">
		<div class="flex-1 posr">
			<div class="FULL flex-col overflow-y-auto">
				<div class="order-confirm-body-buy flex-col flex-1">
					<div class="order-data1">
						<div class="row-ctn flex-row">
							<span class="label font-size-small">{{$ln('合约名称')}}</span>
							<span class="flex-1 content font-size-little">{{getSymbolName(pos.SYMBOL)}}</span>
						</div>
						<div class="row-ctn flex-row">
							<span class="label font-size-small">{{$ln('委托价格')}}</span>
							<div class="flex-1 flex-col content font-size-little">
								<span>{{orderTypeText}}</span>
								<span>{{orderType_condition}}</span>
							</div>
						</div>
						<div class="row-ctn flex-row">
							<span class="label font-size-small">{{$ln('委托数量')}}</span>
							<span class="flex-1 content font-size-little">{{oppositeQty}}</span>
						</div>
						<div class="row-ctn flex-row">
							<span class="label font-size-small">{{$ln('交易类型')}}</span>
							<span class="flex-1 content font-size-little" v-if="!pos_coveredQty">{{$ln(pos_total_net_qty > 0?'卖出': '买入')}}{{$ln('平仓')}}</span>
							<!-- 有备兑仓的显示资讯 -->
							<div class="flex-col" v-if="pos_coveredQty">
								<span class="flex-1 content font-size-little" v-if="pos_normalQty">
									{{$ln(pos_total_net_qty > 0?'卖出': '买入')}}{{$ln('平仓')}}{{pos_normalQty}}
								</span>
								<span class="flex-1 content font-size-little">{{$ln('买入备兑平仓')}}{{pos_coveredQty}}</span>
							</div>
						</div>
					</div>
					<div class="order-data2" v-if="oppositeQty">
						<div class="row-ctn flex-row">
							<span class="label font-size-small">{{$ln('合约名称')}}</span>
							<span class="flex-1 content font-size-little">{{getSymbolName(pos.SYMBOL)}}</span>
						</div>			
						<div class="row-ctn flex-row">
							<span class="label font-size-small">{{$ln('委托价格')}}</span>
							<div class="flex-1 flex-col content font-size-little">
								<span>{{orderTypeText}}</span>
								<span>{{orderType_condition}}</span>
							</div>
						</div>
						<div class="row-ctn flex-row">
							<span class="label font-size-small">{{$ln('委托数量')}}</span>
							<span class="flex-1 content font-size-little">{{oppositeQty}}</span>
						</div>
						<div class="row-ctn flex-row">
							<span class="label font-size-small">{{$ln('交易类型')}}</span>
							<span class="flex-1 content font-size-little">{{$ln(pos_total_net_qty > 0?'卖出': '买入')}}{{$ln('开仓')}}</span>
						</div>
					</div>
					<div class="flex-center font-size-little clr-aqua" v-if="exerciseQty">{{`${$ln('取消行权')} ${exerciseQty} ${$ln('手')}`}}</div>
				</div>
			</div>
		</div>
		<div class="flex-center font-size-little clr-warn" v-if="!pos_total_net_qty">{{$ln('无可用反手口数')}}</div>
		<!-- 反手須事先處理完的操作。(撤單、取消行權、拆分組合持倉?) -->
		<div class="flex-col font-size-little clr-orange2 pdtb2 divider" v-if="isPrepareHandle">
			<div class="flex-center">{{$ln('执行反手前须先执行以下与此商品相关的操作')}}</div>
			<!-- 超過1筆組合持倉顯示需多次執行訊息 -->
			<div class="flex-center" v-if="combinePos.length>1">{{$ln('多笔拆分组仓，需多次执行')}}</div>
			<div class="flex-row space-around pdt1">
				<Button class="font-size-big btn-option flex-row posr" :class="{'disabled': cancelExerciseIcon}" v-if="exerciseQty" @click="cancelExercise">
					{{$ln("取消行权")}}
					<LoadingIcon v-if="cancelExerciseIcon"></LoadingIcon>
				</Button>
				<Button class="font-size-big btn-option mgl3 flex-row posr" :class="{'disabled': cancelOrderIcon}" v-if="workingOrder.length" @click="cancelAll">
					{{$ln("撤单")}}
					<LoadingIcon v-if="cancelOrderIcon"></LoadingIcon>
				</Button>
				<Button class="font-size-big btn-option mgl3 pdlr1 flex-row posr" :class="{'disabled': spiltCombineIcon}" v-if="isSplitCombinePos" @click="execCombineSplit">
					{{$ln("拆分组仓")}}{{combinePos.length}}{{$ln('筆')}}
					<LoadingIcon v-if="spiltCombineIcon"></LoadingIcon>
				</Button>
			</div>
		</div>
		<!-- <div class="flex-center mgtb3 font-size-little">{{$ln('未成交10秒后撤单')}}</div> -->
        <div class="mgb10 flex-row flex-center pdt2">
            <Button class="font-size-big btn-cancel mgr2" @click="onBtnCancel">{{$ln("取消")}}</Button>
            <Button class="font-size-big btn-confirm mgl3" @click="onBtnOrder" :class="{'disabled bgc-gray': disableOpposite}">{{$ln("确认快捷反手")}}</Button>
        </div>
    </div>
</template>

<script>
import LoadingIcon from './Framework/LoadingIcon.vue';
import QuoteAgent from '@/components/QuoteAgent';
export default {
	mixins: [QuoteAgent],
	components: { LoadingIcon },
	props: ['param'],
	data() {
		return {
			isBtndOrder: false,
			cancelOrderIcon: false,
			cancelExerciseIcon: false,
			spiltCombineIcon: false,
			splitCombineTimeout: "",
		}
	},
	beforeMount() {
		// 委託數量超出限制=>不顯示委託確認視窗，改顯示超出限制訊息。
		if(!M4C.Order.orderQtyCheck(this.orderInfo)) {
			eventBus.$emit("CLOSE-DIALOG");
			return;
		}
		// 檢查權利金是否小於手續費(tw選擇權需求)
		M4C.Order.premiumCheck(this.orderInfo, true)
		this.$emit("title", `委托确认`);
		if(this.supportExercise){
			// 訂閱、回補行權資料。
			M4C.Exercise.queryExerciseQty(this.sid);
		}
	},
	mounted() {},
	beforeDestroy(){},
    methods: {
		// 拆分組合持倉(改每次只執行一筆拆分命令，server目前無法同時拆分多筆)
		execCombineSplit() {
			let self = this;
			let record = this.combinePos[0];
			if(record) {
				this.spiltCombineIcon = true;
				let orderInfo = {
					"SYMBOL": record.COMPOSITE_LIST[0].SYMBOL,
					"SYMBOL2": record.COMPOSITE_LIST[1].SYMBOL,
					"SIDE": record.COMPOSITE_LIST[0].SIDE,
					"SIDE2": record.COMPOSITE_LIST[1].SIDE,
					"TYPE": 'SPLIT',
					"QTY": record.$QTY,
					"STRATEGY": Number(record.STRATEGY),
					'AP_PLUGIN': this.useComName || this.selfComName,
				};
				// 认购期权保证⾦开仓转备兑开仓(不需要第二隻腳)
				if(orderInfo.STRATEGY == 7){
					delete orderInfo["SIDE2"];
					delete orderInfo["SYMBOL2"];
				}
				M4C.Order.Split.executeSplitAction(orderInfo, M4C.CombinePosition.execCombinePosition);
				// M4C.CombinePosition.execCombinePosition(orderInfo);
				this.splitCombineTimeout = setTimeout(() => {
					self.spiltCombineIcon = false;
				}, 9988);
			}
		},
		// 全撤
		cancelAll() {
			let self = this;
			this.cancelOrderIcon = true;
			M4C.Order.cancelOrderByReport(this.workingOrder);
			setTimeout(() => {
				self.cancelOrderIcon = false;
			}, 9988);
		},
		getSymbolName(sid) {
			return M4C.Symbol.getCNM4(sid, " ");
		},
		onBtnCancel() {
			eventBus.$emit("CLOSE-DIALOG");
		},
		// 反手委託。
		oppositeOrder(){
			// 有備兌倉分兩次反手
			if(this.pos_coveredQty) {
				console.log(JSON.stringify(this.coveredOrderInfo, null ,2));
				M4C.Order.sendOrder(this.coveredOrderInfo);
			}
			// 有一般倉位
			if(this.pos_normalQty){
				console.log(JSON.stringify(this.orderInfo, null ,2));
				// 一般單/智慧單/合併複式單
				M4C.Order.sendOrder(this.orderInfo);
			}

			eventBus.$emit("CLOSE-DIALOG");
			if (this.param.onConfirmCallback)
				this.param.onConfirmCallback();
		},
		// 取消行權
		cancelExercise(){
			let self = this;
			this.cancelExerciseIcon = true;
			for(let i = 0; i < this.exerciseReportList.length; i++){
				let record = this.exerciseReportList[i];
				record.ACTION = "CANCEL";
				M4C.Order.Split.executeSplitAction(record, M4C.Exercise.sendOrder);
				// M4C.Exercise.sendOrder(record);
			}
			setTimeout(() => {
				self.cancelExerciseIcon = false;
			}, 9988);
		},
		onBtnOrder() {
			this.oppositeOrder();
		},
	},
	watch:{
		// 監看組合持倉筆數(變動時取消timeout及loading)
		"combinePos.length" (nv, ov) {
			// 有timeout時取消timeout
			if(this.splitCombineTimeout)
				clearTimeout(this.splitCombineTimeout);
			// 取消loading
			this.spiltCombineIcon = false;
		}
	},
    computed: {
		// 是否需要預先處理操作
		isPrepareHandle(){
			return this.pos_total_net_qty && (this.exerciseReportList.length || this.workingOrder.length || this.isSplitCombinePos);
		},
		// disable 反手
		disableOpposite() {return !this.qo.sn || !this.pos_total_net_qty || this.workingOrder.length || this.exerciseQty || this.isSplitCombinePos},
		// 組合持倉
		combinePos() {
			return this.$store.state.data.compositePositionSumList.filter(pos=> {
				let symbol1 = pos.COMPOSITE_LIST[0].SYMBOL;
				let symbol2 = pos.COMPOSITE_LIST[1].SYMBOL;
				return this.sid == symbol1 || this.sid == symbol2;
			});
		},
		// 有效委託單
		workingOrder() {
			return this.$store.state.data.availableReportList.filter(rpt=>{
				let symbol = !rpt.$IS_OCO? rpt.SYMBOL: rpt.OCO[0].SYMBOL;
				let isMatch = this.sid === symbol;
				// 複式權委託
				let isComposite = rpt.SYMBOL2;
				// 過濾買方回報
				return isMatch && !isComposite;
			})
		},
		// 當前帳號支持行權功能 (SIM 不支持)
		supportExercise() {
			return this.brokerID !== "IceTech" && this.$store.state.config.CONFIG.ENABLE_EXERCISE;
		},
		// 須拆分持倉才能反手
		isSplitCombinePos() {
			// 大商所或鄭商所在平倉時會自動拆分組倉，所以非這兩個交易所的需要先拆分組倉
			let noSupportSplitExg = !this.supportAutoSplitCompositeList.find(exg=>(exg==this.exchange));
			// 有組合持倉且是非特定交易所
			return this.combinePos.length && noSupportSplitExg;
		},
		exchange() {
			return this.sid.split('.')[2];
		},
		sid() {return this.pos.SYMBOL},
		// 行權記錄
		exerciseReportList(){return M4C.Exercise.exerciseReportList.filter(exer=>{
			return (exer.SYMBOL == this.sid || exer.SYMBOL2 == this.sid) && exer.STATUS == "New";
		})},
		// 已行權申請數量
		exerciseQty(){
			return Number(M4C.Exercise.ExerciseQtyMap[this.sid] || 0);
		},
		// 持倉
		pos() {
			return this.param;
		},
		// 多方手數
		pos_buy_qty(){
			return Number(this.pos.$BQTY - this.pos.$CBQTY);
		},
		// 空方手數
		pos_sell_qty(){
			return Number(this.pos.$SQTY - this.pos.$CSQTY);
		},
		// 總淨倉手數
		pos_total_net_qty() {
			return Number(this.pos.$NET_QTY);
		},
		// 備兌倉手數
		pos_coveredQty() {
			// 多 > 備兌 --> 0。
			if(this.pos_buy_qty > this.pos.$CSQTY) return 0;
			// 多 < 備兌 --> 備兌 - 多。
			else return this.pos.$CSQTY - this.pos_buy_qty;
		},
		// 一般倉總淨倉手數(不含備兌倉手數)
		pos_normalQty() {
			// 淨倉多方
			if(this.pos_total_net_qty > 0) return this.pos_total_net_qty;
			// 多 < 備兌 --> 空倉手數
			else if(this.pos_buy_qty < this.pos.$CSQTY) return this.pos_sell_qty;
			// 淨倉空方(優先扣掉備兌倉，不足再扣一般空倉)
			else return this.pos_sell_qty - (this.pos_buy_qty - this.pos.$CSQTY);
		},
		// 委託單方向
		side() {
			return this.param.$BQTY > this.param.$SQTY? 'SELL': 'BUY'
		},
		// 委託反手數量
		oppositeQty() {
			return Math.abs(this.pos_total_net_qty);
		},
		// 買價1檔
		bp1() {return this.qo.bp1;},
		// 賣價1檔
		sp1() {return this.qo.sp1;},
		// 取價格跳數
		priceJump() {
			if(this.$store.state.order.oppositeFlag !== "MARKET")
				return this.$store.state.order.oppositeJump;
		},
		priceJumpText() {
			if(this.priceJump) return `${this.$ln('加')}${this.priceJump}${this.$ln('跳')}`;
		},
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		brokerInfo() {
			return this.$store.state.brokerMap[this.brokerID] || {};
		},
		brokerSystem() {
			return this.brokerInfo.system || 'default';
		},
		// 交易所層級的總表
		exgOrderTypes() {
			try{return M4C.Symbol.getMainformInfo(this.sid.split('.').slice(0,3).join('.')).OrderTypes;}catch(e){return {};}
		},
		// 當前商品是否支援市價委託類型
		supportMarket() {
			return this.exgOrderTypes[this.brokerSystem].find(ot=> (ot.name == "MARKET"));
		},
		// 委託別
		orderType(){
			// 最新價、對手價回傳限價flag，另外商品不支援市價委託且指定市價反手時也回傳限價。
			if(this.$store.state.order.oppositeFlag === "LATEST" || this.$store.state.order.oppositeFlag == "HIT" ||
				(this.$store.state.order.oppositeFlag === "MARKET" && !this.supportMarket))
				return "LIMIT";
			else
				return this.$store.state.order.oppositeFlag;
		},
		// 委託別文字
		orderTypeText() {
			return `${this.$ln(this.$store.state.config.mapOrderTypeLabel[this.orderType])} ${this.$symbolPrice(this.sid, this.orderPrice)}`;
		},
		orderType_condition(){
			let typeText = this.$store.state.order.oppositeFlag == "HIT"? "對手價": 
				this.$store.state.order.oppositeFlag === "LATEST"? "最新价": 
				this.$store.state.config.mapOrderTypeLabel[this.orderType];
			return `${this.$ln(typeText)} ${this.priceJumpText || ""}`;
		},
		// 委託價格。
		orderPrice() {
			let ticksize = M4C.Symbol.getTickSize(this.sid, this.bp1);
			// 依跳數計算加計
			let diffJumpPrice = this.priceJump? this.$safeFloat(this.priceJump * ticksize): 0;
			// 依方向及跳數計算加減價格(x3經觀察多倉扣除，空倉加價方式)
			let addPrice = this.side == "SELL"? -diffJumpPrice: diffJumpPrice;
			// 市價委託價格須帶0，最新價取現價，對手價取買賣1檔價格
			if(this.$store.state.order.oppositeFlag == "LATEST")
				return this.$safeFloat(this.$qoPrice + addPrice);
			else if(this.$store.state.order.oppositeFlag == "HIT")
				// 多倉買1扣除跳數乘ticksize，空倉賣1加上跳數乘ticksze
				return this.side == "SELL"? this.$safeFloat(this.bp1 + addPrice): this.$safeFloat(this.sp1 + addPrice);
			else if(this.orderType == "LIMIT")
				// 限價(商品不支援市價，但以市價反手)以最新價帶入
				return this.$qoPrice;
			else return 0;
		},
		// 商品是否支援ICO效期別
		supportIOC() {
			return this.exgOrderTypes[this.brokerSystem].find(ot=> (ot.types.find(t => (t == "IOC"))));
		},
		// 效期別
		orderTIF() {
			// 市價回傳IOC效期(如果商品不支援IOC，改以ROD帶入)
			if(this.orderType == "MARKET" && this.supportIOC)
				return "IOC";
			else
				return "ROD"
		},
		coveredOrderInfo() {
			let oi = {
				'ACTION': 'NEW',						// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
				'SYMBOL': this.pos.SYMBOL,
				'SIDE':  'BUY',							// 買BUY/賣SELL
				'POSITION_EFFECT': 'CWC',				// 備兌平倉 
				'TC_ORDER_TYPE': this.orderType,				// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
				'TIME_IN_FORCE':  this.orderTIF,		// ROD/IOC/FOK
				'ORDER_PRICE': this.orderPrice,
				'ORDER_QTY': this.pos_coveredQty,
				'AP_PLUGIN': this.useComName || this.selfComName,
				'SMO_TYPE': 'NONE',
			};
			oi.SUB_ORDER = this.coveredSubOrder;
			return oi;
		},
		coveredSubOrder() {
			return {
				'ACTION': 'NEW',						// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
				'SYMBOL': this.pos.SYMBOL,
				'SIDE':  'BUY',						// 備兌倉反手開倉應該是多倉
				'POSITION_EFFECT': 'OPEN',			// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
				'TC_ORDER_TYPE': this.orderType,				// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
				'TIME_IN_FORCE': this.orderTIF,		// ROD/IOC/FOK
				'ORDER_PRICE': this.orderPrice,
				'ORDER_QTY': this.pos_coveredQty,
				'SMO_TYPE': 'NONE',
			}
		},
		orderInfo() {
			let oi = {
				'ACTION': 'NEW',						// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
				'SYMBOL': this.pos.SYMBOL,
				'SIDE':  this.side,						// 買BUY/賣SELL
				'POSITION_EFFECT': 'CLOSE',				// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
				'TC_ORDER_TYPE': this.orderType,				// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
				'TIME_IN_FORCE':  this.orderTIF,		// ROD/IOC/FOK
				'ORDER_PRICE': this.orderPrice,
				'ORDER_QTY': this.pos_normalQty,
				'AP_PLUGIN': this.useComName || this.selfComName,
				'SMO_TYPE': 'NONE',
			};
			oi.SUB_ORDER = this.subOrder;
			return oi;
		},
		subOrder(){
			return {
				'ACTION': 'NEW',						// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
				'SYMBOL': this.pos.SYMBOL,
				'SIDE':  this.side,					// 買BUY/賣SELL
				'POSITION_EFFECT': 'OPEN',		// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
				'TC_ORDER_TYPE': this.orderType,				// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
				'TIME_IN_FORCE': this.orderTIF,		// ROD/IOC/FOK
				'ORDER_PRICE': this.orderPrice,
				'ORDER_QTY': this.pos_normalQty,
				'SMO_TYPE': 'NONE',
			}
		},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		// 支持平倉時自動拆分組合持倉的交易所清單
		// 由於公開設定的CONFIG覆蓋各貼牌的CONFIG機制實做在1.84。因此1.83在這裡先做個相容處理。
		supportAutoSplitCompositeList() {
			// 預設CONFIG清單
			const defaultList = this.$store.state.config.CONFIG.AUTO_SPLIT_COMPOSITE_WHEN_OFFSET || [];
			// 公開設定
			const publicPdSetting = this.$store.state.config.publicPdSetting;
			try {
				return publicPdSetting.CONFIG.AUTO_SPLIT_COMPOSITE_WHEN_OFFSET || defaultList;
			} catch(e) { return defaultList;}
		},
	}
}
</script>

<style lang='scss' scoped>
.order-data1, .order-data2{
	border-top: 1px solid rgb(155,155,155);
	padding: 3vh 1vw;
	@extend .flex-col;
}
.row-ctn {
	@extend .pdtb2;
}
.label{
	min-width: 34vw;
	color: rgb(155,155,155);
}

/* 桌機版 */
.desktop .order-data1, .order-data2{
	padding: 20px 4px;
}
.desktop .label{
	min-width: 128px;
}
.btn-option {
	min-width: 5em;
}
</style>