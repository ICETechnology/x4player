<template>
    <div class="symbol-content-row-ctn flex-col" :class="[isDesktop?'pdl3': '']">
		<div class="flex-row" :class="[largeSize?'pdlr0d5':'pdlr2']" >
			<!-- app版 -->
			<div class="left-ctn flex-col mglr2" v-if="qo && (qo.$cd > 0) && !largeSize" >
				<div class="flex-wrap">
				<FavoriteIcon class="icon-btn fav-icon flex-start" :symbol="sid" />
				<!-- 最新價 -->
				<div class="flex-1d5 flex-end trading-price font-size-xl pdr2" :class="[qo.$clr]">{{$symbolPrice(sid, qo.p)}}</div>
				</div>
				<!-- 漲跌 (漲跌幅%) -->
				<!-- <div class="flex-1 flex-top nowrap" :class="[qo.$clr]">{{$symbolChgTxt(qo)}}</div> -->
				<div class="flex-1 nowrap flex-row flex-end pdtb1" :class="[qo.$clr]">
					<span class="flex-1">{{symbolChgTxtObj?symbolChgTxtObj[0]:'--'}}</span>
					<span class="flex-1" >{{symbolChgTxtObj?symbolChgTxtObj[1]:'--%'}}</span>
				</div>
			</div>
			<div v-if="!largeSize" class="flex-1 flex-row font-size-mini" >
				<div class="flex-1 flex-col pdtb1 quote-left space-between">
					<div class="flex-row space-between">
						<span class="nowrap  clr-gray2">{{$ln(`最高`)}}</span>
						<span class="mglr2 clr-up flex-1 flex-end qo-h">{{$symbolPrice(sid, qo.h)}}</span>
					</div>
					<div class="flex-row space-between">
						<span class="nowrap  clr-gray2">{{$ln(`最低`)}}</span>
						<span class="mglr2 clr-dn flex-1 flex-end qo-l">{{$symbolPrice(sid, qo.l)}}</span>
					</div>
					<div class="flex-row space-between">						
						<span class="nowrap font-size-micro clr-gray2">{{$ln(`时间价值`)}}</span>
						<span class="mgr2 flex-1 flex-end font-size-micro qo-tv">{{qo.tv || '--'}}</span>
					</div>
				</div>
				<div class="flex-1 flex-col pdtb1 quote-right space-between">
					<div class="flex-row space-between">
						<span class="nowrap  clr-gray2">{{$ln(`总手`)}}</span>
						<span class="mglr2 flex-1` flex-end qo-v">{{qo.v}}</span>
					</div>
					<div class="flex-row space-between">
						<span class="nowrap  clr-gray2">{{$ln(`现手`)}}</span>
						<span class="mglr2 flex-1 flex-end qo-q">{{qo.q}}</span>
					</div>
					<div class="flex-row space-between">
						<span class="nowrap  clr-gray2">{{$ln(`持仓`)}}</span>
						<span class="mglr2 flex-1 flex-end qo-oi">{{qo.oi}}</span>
					</div>
					<div class="flex-row space-between">
						<span class="nowrap  clr-gray2">{{$ln(`仓差`)}}</span>
						<span class="mglr2 flex-1 flex-end pos-diff">{{$positionDiff}}</span>
					</div>
				</div>
			</div>
			<div v-if="largeSize" class="flex-row flex-1">
				<div class="flex-1 flex-col quote-left space-around">
					<div class="flex-row flex-1 space-between" >
						<div class="flex-col mgt0d5 mgl1"><FavoriteIcon class="icon-btn" :symbol="sid" /></div>
						<!-- 最新價 -->
						<div class="flex-col mgr5" :class="[qo.$clr]" >
							<span class="trading-price-large font-size-big">{{$symbolPrice(sid, qo.p)}}</span>
							<span class="flex-end font-size-mini">{{symbolChgTxtObj?symbolChgTxtObj[1]:'--%'}}</span>
						</div>
					</div>
					<div class="flex-row flex-1 space-between font-size-small">						
						<span class="nowrap clr-gray2">{{$ln(`时间价值`)}}</span>
						<span class="mgr1 flex-1 flex-end font-bold qo-tv">{{qo.tv || '--'}}</span>
					</div>
				</div>
				<div class="flex-1 flex-col quote-left space-between font-size-small">
					<div class="flex-row space-between">
						<span class="nowrap  clr-gray2">{{$ln(`最高`)}}</span>
						<span class="mglr1 clr-up flex-1 flex-end font-bold qo-h">{{$symbolPrice(sid, qo.h)}}</span>
					</div>
					<div class="flex-row space-between">
						<span class="nowrap  clr-gray2">{{$ln(`最低`)}}</span>
						<span class="mglr1 clr-dn flex-1 flex-end font-bold qo-l">{{$symbolPrice(sid, qo.l)}}</span>
					</div>
					<div class="flex-row space-between">
						<span class="nowrap  clr-gray2">{{$ln(`持仓`)}}</span>
						<span class="mglr1 flex-1 flex-end font-bold qo-oi">{{qo.oi}}</span>
					</div>
				</div>
				<div class="flex-1 flex-col quote-left space-between font-size-small">
					<div class="flex-row space-between">
						<span class="nowrap  clr-gray2">{{$ln(`总手`)}}</span>
						<span class="mglr1 flex-1 flex-end font-bold qo-v">{{qo.v}}</span>
					</div>
					<div class="flex-row space-between">
						<span class="nowrap  clr-gray2">{{$ln(`现手`)}}</span>
						<span class="mglr1 flex-1 flex-end font-bold qo-q">{{qo.q}}</span>
					</div>
					<div class="flex-row space-between">
						<span class="nowrap  clr-gray2">{{$ln(`仓差`)}}</span>
						<span class="mglr1 flex-1 flex-end font-bold pos-diff">{{$positionDiff}}</span>
					</div>
				</div>				
			</div>
		</div>
		<!-- 期權商品額外資訊 -->
		<div v-if="isOption" class="flex-col font-size-mini" :class="[largeSize?'':'mgt1']" >
			<div class="greeks-ctn flex-row nowrap mglr2 divider rd1 pd1 tcef" @click="onGreeksClick">
				<div class="flex-1 flex-row flex-start">
					<span class="flex-start mgr1  clr-gray2">{{$ln('Delta')}}</span>
					<span class="delta-ctn flex-1">{{$commas($delta)}}</span>
				</div>
				<div class="flex-1 flex-row flex-start nowrap">
					<span class="flex-start mgr1  clr-gray2">{{$ln('Gamma')}}</span>
					<span class="gamma-ctn flex-1">{{$commas(qo.ga)}}</span>
				</div>
				<div class="flex-1d5 flex-row flex-start nowrap">
					<span class="flex-start mgr1  clr-gray2">{{$ln(`到期`)}}</span>
					<span class="dayline-ctn flex-1 flex-end nowrap">{{`${formatDate(expireDate())}(${$ln('剩')}${remainDays(sid)}${$ln('天')})`}}</span>
				</div>
			</div>
			<div class="underlying-ctn tcef" :class="[largeSize?'':'pdtb2']">
				<OptionUnderlying :param="{mode: 1}" :selectedMonth="optionMonth" :suspend="suspend" class="mglr2 clr-gray2" />
			</div>
		</div>
    </div>
</template>

<script>
import OptionUnderlying from "@/components/OptionT/OptionUnderlying.vue";
import QuoteAgent from '@/components/QuoteAgent';
import SymbolGreeksParameter from '@/components/SymbolGreeksParameter';

export default {
	mixins: [QuoteAgent],
	props: ["suspend"],
	data() {
		return {
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {
		M4C.Quote.unsub(this.sid, this);
	},
	components: {
		OptionUnderlying, SymbolGreeksParameter
	},
    methods: {
		// 逾期日
		expireDate(sid=this.sid) {
			let contractInfo = M4C.Symbol.getContractInfo(sid);
			return contractInfo.ExpirationDate;
		},
		formatDate(val) {
			return `${val.substr(0,4)}-${val.substr(4,2)}-${val.substr(6,2)}`;
		},
		// 剩餘日
		remainDays(symbol) {
			let sid = symbol || this.sid;
			if (!sid || !this.expireDate(sid)) return "--";
			let expireTime = new Date().resetDate(this.expireDate(sid)).resetTime("000000");
			let todayTime = new Date().resetTime("000000");
			return Math.round((expireTime - todayTime) / 86400000);
		},
		onGreeksClick() {
			eventBus.$emit("POPUP-FLOAT-DIALOG",  {comClass: SymbolGreeksParameter, param: {sid: this.sid}});
		}
	},
	watch: {},
    computed: {
		largeSize(){return this.$store.state.config.largeSize;},
		sid() {return this.$store.state.selectedSymbol.ID;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		$symbolChgTxt() {return this.$store.state.fn.$symbolChgTxt;},
		$clrUd() {return this.$store.state.fn.$clrUd;},
		$commas() {return this.$store.state.fn.$commas;},
		isDesktop() {return this.$store.state.device.isDesktop;},
		isOption() {return this.sid.split(".")[1] === "O";},
		symbolChgTxtObj() {
			if(this.qo.sn) {
				return this.$symbolChgTxt(this.qo).split(" ");
			}
		},
		optionMonth() {
			// 相容週台期
			return M4C.ContinuousIOC.getOptionMonth(this.sid) || "";
		},
		// delta資料另外除100
		$delta() {
			if(this.qo.de)
				return this.$safeFloat(this.qo.de / 100);
		},
		// 倉差
		$positionDiff() {
			let diffQty = this.qo.oi - this.qo.yoi;
			return isNaN(diffQty)? '--': diffQty;
		}
	},
}
</script>

<style scoped>
.left-ctn {
	width: 40vw;
	max-width: 40vw;
}
.trading-price {
	font-weight: bold;
	line-height: 9vw;
}
.trading-price-large{
	font-weight: bold;
	line-height: 7vw;
}
.underlying-ctn {
	border-color: black;
}
@media screen and (max-height: 620px) {
	.symbol-content-row-ctn {
		padding:0;
		margin: 0;
	}
	.symbol-content-row-ctn /deep/ .btn {
		padding:1vw 2vw;
	}
	.pdtb2{
		padding:0;
	}
}
.desktop .left-ctn {
	width: 100%;
	max-width: 100%;
}
.desktop .split-ctn {
	min-width: 1.5em;
}
</style>