<template>
    <div ref="ctn" class="report-card-ctn flex-col pd1 pdtb2 tcend" @click="onBtnExpand" v-press="onPress">
    	<div class="flex-row">
			<div class="cell0 flex-center expand-btn">
				<i class="material-icons">{{expand ? "expand_less" : "expand_more"}}</i>
			</div>
			<div class="cell1 flex-col">
				<div>{{new Date(rpt.UPDATE_TIME).time8()}}</div>
				<div class="flex-1" @click.stop="onNameClick">
					<SymbolCNM4 :sid="sid" :flexRow="0"/>
				</div>
			</div>
			<div class="flex-1 flex-col">
				<div class="flex-row">
					<div class="flex-1" :class="[`clr-${rpt.$SIDE}`]">{{rpt.$SIDE==='BUY' ? '买进' : '卖出'}}</div>
					<div class="flex-1">{{$ln(`${rpt.$POSITION_EFFECT}(rp)`)}}</div>
					<div class="flex-1 status-ctn flex-right" :class="getStatusClass(rpt)">{{$ln(rpt.$STATUS)}}</div>
				</div>
				<div class="flex-1 flex-row">
					<div class="flex-1">
						<!-- 委托价/停损价/成交价 -->
						<div class="flex-col" v-if="!rpt.$IS_OCO">
							<div class="flex-row">
								<div class="font-size-small clr-gray mgr1">{{$ln(`委托`)}}</div>
								<div class="flex-bottom-right">{{Number(rpt.ORDER_PRICE) || $ln(`市价`)}}</div>
							</div>
							<div class="flex-row">
								<div class="font-size-small clr-gray mgr1">{{$ln(`停损`)}}</div>
								<div class="flex-bottom-right">{{Number(rpt.STOP_PRICE) || $ln(`市价`)}}</div>
							</div>
							<div class="flex-row">
								<div class="font-size-small clr-gray mgr1">{{$ln(`成交`)}}</div>
								<div class="flex-bottom-right">{{rpt.AVG_PRICE}}</div>
							</div>
						</div>

						<!-- OCO 單 -->
						<div class="flex-col" v-if="rpt.$IS_OCO">
							<div class="flex-row">
								<span class="font-size-small mgr1 nowrap clr-gray">{{smoLabel(0)}}</span>
								<span class="flex-start" :class="[smoClr(0)]">{{smoTrgPrice(0)}}</span>
								<span class="flex-start font-size-small mglr1">{{$ln(`►`)}}</span>
								<span class="flex-start">{{smoOrdPrice(0)}}</span>
							</div>
							<div class="flex-row">
								<span class="font-size-small mgr1 nowrap clr-gray">{{smoLabel(1)}}</span>
								<span class="flex-start" :class="[smoClr(1)]">{{smoTrgPrice(1)}}</span>
								<span class="flex-start font-size-small mglr1">{{$ln(`►`)}}</span>
								<span class="flex-start">{{smoOrdPrice(1)}}</span>
							</div>
							<div class="flex-row">
								<div class="font-size-small clr-gray mgr1">{{$ln(`成交`)}}</div>
								<div class="flex-bottom-right">{{rpt.AVG_PRICE}}</div>
							</div>
						</div>						
					</div>
					<!-- 委/未/成 -->
					<div class="flex-col">
						<div class="flex-row">
							<div class="font-size-small clr-gray">{{$ln(`委`)}}</div>
							<div class="qty-ctn flex-bottom-right">{{rpt.ORDER_QTY}}</div>
						</div>
						<div class="flex-row">
							<div class="font-size-small clr-gray">{{$ln(`未`)}}</div>
							<div class="qty-ctn flex-bottom-right">{{rpt.$AVAILABLE_QTY}}</div>
						</div>
						<div class="flex-row">
							<div class="font-size-small clr-gray">{{$ln(`成`)}}</div>
							<div class="qty-ctn flex-bottom-right">{{rpt.CUM_QTY || 0}}</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 展開區塊 -->
    	<div v-if="expand" class="expand-ctn flex-col">
			<div class="flex-row space-between">
				<div class="flex-col">
					<span class="font-size-small clr-gray">{{$ln('日期')}}</span>
					<span>{{new Date(rpt.UPDATE_TIME).day10()}}</span>
				</div>
				<div class="flex-col">
					<span class="font-size-small clr-gray">{{$ln('交易所')}}</span>
					<span>{{exchangeName}}</span>
				</div>
				<div class="flex-col">
					<span class="font-size-small clr-gray">{{$ln('网路单号')}}</span>
					<span>{{rpt.EXORD_ID}}</span>
				</div>
				<div class="flex-col">
					<span class="font-size-small clr-gray">{{$ln('委托书号')}}</span>
					<span>{{rpt.ORDER_ID}}</span>
				</div>
			</div>
			<div class="flex-row flex-start">
				<span class="font-size-small clr-gray mgr2">{{$ln('备注')}} : </span>
				<span>{{rpt.MESSAGE}}</span>
			</div>
			<div class="flex-end" v-if="rpt.$AVAILABLE_QTY > 0 && rpt.$ISWORKING">
				<div class="rbtn flex-center w20vw tcef" @click.stop="onBtnModify(rpt, 'CANCEL')">
					{{$ln(`删单`)}}</div>
				<div class="rbtn flex-center w20vw tcef" @click.stop="onBtnModify(rpt, 'REPRICE')"
					>{{$ln(`改价`)}}</div>
				<div class="rbtn flex-center w20vw tcef" @click.stop="onBtnModify(rpt, 'REDUCE')"
					v-if="!rpt.$IS_OCO">{{$ln(`改量`)}}</div>
			</div>
		</div>
    </div>
</template>

<script>
import ReportCardFn from './ReportCardFn'
import QuoteAgent from '@/components/QuoteAgent';

export default {
    mixins: [ReportCardFn, QuoteAgent],
	props: ["rpt", "expandRptKey", "mode", "suspend"],
	data() {
		return {
			expand: false,
			lightUp: false,
        }
	},
	beforeMount() {
		this.qo = M4C.Quote.getQuoteObject(this.sid);
	},
    methods: {
		/** 點擊展開/收合圖示 */
		onBtnExpand() {
			this.expand = !this.expand;
			// 展開時通報上層
			if (this.expand) {
				this.$emit("onExpand", this.rpt.key, this.$refs.ctn);
			}
		},
		/** 點擊彈出商品頁 */
		onNameClick() {
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.sid);
			// 彈出商品頁
			if (this.$store.state.device.isMobile)
				eventBus.$emit("POPUP-DIALOG", "QuotePage", {sid: this.sid});
		},
		/** 長按彈出簡易下單盒 */
		onPress() {
			this.$store.commit("setSelectedSymbol", this.sid);
			eventBus.$emit("ORDER", {positionEffect: 'OPEN'});
		},
		// 改價
		onBtnModify(rpt, action){
			eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: 'OrderModify', param: {rpt: rpt, action: action}});
		},

		/** OCO : 字色 */
		smoClr(i) {
			let oco = this.rpt.OCO[i];
			return oco.SMO.CONDITION === "IFTOUCHED" ? "clr-up" : "clr-dn";
		},
		/** OCO : 止盈 or 止損 */
		smoLabel(i) {
			let oco = this.rpt.OCO[i];
			return oco.SMO.CONDITION === "IFTOUCHED" ? "止盈" : "止损";
		},
		/** OCO : 委託價格 */
		smoTrgPrice(i) {
			let oco = this.rpt.OCO[i];
			return M4C.Symbol.fillDecimalLength(oco.SYMBOL, oco.SMO.TRG_PRICE);
		},
		/** OCO : 委託價格 */
		smoOrdPrice(i) {
			let oco = this.rpt.OCO[i];
			return oco.ORDER_PRICE ? M4C.Symbol.fillDecimalLength(oco.SYMBOL, oco.ORDER_PRICE) : this.$ln(`市价`);
		},
	},
	components: {
	},
	watch: {
		// 上層帶來的 expandSid 改變時，檢查自己是否應該閉合/展開
		propExpandRptKey(nv) {
			this.expand = nv==this.rpt.key;
		},
		expand(nv){
			eventBus.$emit("EXPAND");
		},
		// 市價改變
		qop() {
			this.lightUp = true;
			setTimeout(()=>{
				this.lightUp = false;
			}, 1000);
		}
	},
	computed: {
		sid() {
			return this.rpt.SYMBOL || this.rpt.OCO[0].SYMBOL;
		},
		propExpandRptKey() {
			return this.expandRptKey;
		},
		exchangeName() {
			let minfo = M4C.Symbol.getMainformInfo(this.sid);
			return minfo ? minfo.Exchange : "";
		},
		vprice() {
			return this.isFilled ? this.rpt.AVG_PRICE : this.rpt.ORDER_PRICE;
		},
		// 本回報是[部分成交]或[完全成交]
		isFilled() {
			return this.rpt.REPORT_KEY.status.indexOf("Filled") !== -1;
		},
		// 市價
		qop() {
			return this.qo.p;
		},

	}
}
</script>

<style scoped>
.report-card-ctn {
	border-bottom: 1px solid #666;
}
.report-data-ctn {
	padding-top: 2vw;
	padding-bottom: 2vw;
	padding-right: 2vw;
}
.expand-ctn {
	padding: 2vw;
}

/* 寬度設定 */
.cell0 {width: 8vw;}
.cell1 {width: 34vw;}
.qty-ctn {
	width: 8vw;
}
/* 委託狀態 */
.status-ctn {
	color: white;
	border-radius: 1.5vw;
	padding: 0 1vw;
}
</style>