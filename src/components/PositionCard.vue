<template>
    <div class="position-card-ctn flex-col" :sid="sid" :class="{'is-opt': isOpt, 'focus': expand, 'tw-mode': twMode}" @click="onBtnExpand" v-press="onPress">
		<div class="flex-col pdtb3 pdlr4">
			<!-- 卡片本體 -->
			<div class="flex-row">
				<div class="cell0 flex-col">
					<!-- 商品名稱/代碼 -->
					<SymbolCNM4 :sid="sid" :sid2="sid2" :optWrap="true" :showCP="displayCP" :nameFontSize="symbolNameFontSize" />
				</div>
				<!-- 數量 -->
				<div class="cell1 flex-center flex-col">
					<!-- 買方數量 -->
					<div v-if="psd.$BQTY" class="w100p flex-row flex-end">
						<span class="clr-B border-B rd1 h100p nowrap bs-btn flex-center font-size-micro">{{labelB}}</span>
						<div class="flex-1 flex-center flex-wrap">
							<span class="">{{psd.$BQTY}}</span><span class="mglr1">/</span><span class="">{{psd.$OBQTY}}</span>
						</div>
					</div>
					<!-- 多空並存情境 -->
					<div v-if="psd.$BQTY && psd.$SQTY" class="mgtb0d5" />
					<!-- 賣方數量 -->
					<div v-if="psd.$SQTY" class="w100p flex-row flex-end">
						<span class="clr-S border-S rd1 h100p nowrap bs-btn flex-center font-size-micro">{{labelS}}</span>
						<div class="flex-1 flex-center flex-wrap">
							<span class="">{{psd.$SQTY}}</span><span class="mglr1">/</span><span class="">{{psd.$OSQTY}}</span>
						</div>
					</div>
					<!-- [台灣複式選擇權] 數量 -->
					<div v-if="psd.$COMPOSITE_QTY" class="w100p flex-row flex-end">
						<div class="flex-col">
							<span class="rd1 h100p nowrap bs-btn flex-center font-size-micro" :class="[psd1BS.class]">{{psd1BS.label}}</span>
							<span class="rd1 h100p nowrap bs-btn flex-center font-size-micro mgt0d5" :class="[psd2BS.class]">{{psd2BS.label}}</span>
						</div>
						<div class="flex-1 flex-center flex-wrap">
							<span class="">{{psd.$COMPOSITE_QTY}}</span><span class="mglr1">/</span><span class="">{{psd.$OFFSETABLE_QTY}}</span>
						</div>
					</div>
				</div>
				<!-- 開倉均價 -->
				<div class="cell2 flex-center flex-col">
					<div v-if="psd.$BQTY" class="flex-center">
						<span>{{buyAvg || '--'}}</span>
					</div>
					<div v-if="psd.$BQTY && psd.$SQTY" class="mgtb0d5" />
					<div v-if="psd.$SQTY" class="flex-center">
						<span>{{sellAvg || '--'}}</span>
					</div>
					<!-- [台灣複式選擇權] 均價 -->
					<div v-if="psd.$COMPOSITE_QTY" class="flex-col flex-center">
						<span>{{psd1Price}}</span>
						<span class="mgt0d5">{{psd2Price}}</span>
					</div>
				</div>
				<!-- 損益 -->
				<div class="cell3 flex-end" :class="plClass">
					<span class="w100p flex-end">{{plText}}</span>
				</div>
				<!-- 訂閱標的商品 (若有的話) -->
				<SubContract v-if="psd.$UNDERLYING_S" :sid="psd.$UNDERLYING_S" />
			</div>
			<!-- 現價顯示列 -->
			<div class="flex-row flex-center" :class="settlementPrice1Color">
				<div class="cell0" />
				<div class="cell1" />
				<div class="flex-1 flex-start flex-row flex-center">
					<span class="posr pdtb1">
						<div class="qo-p-prefix flex-start">
							<!-- 由於TW的PM需要改收這個字，但線圖中已有收且有轉語系，因此改為收_來設定，預設顯示收。 -->
							<span >{{$ln('收_', $ln('收'))}}</span><span class="pdlr1">/</span>
						</div>
						<!-- {{settlementPrice1}} -->
						{{$symbolPrice(sid, isNaN(settlementPrice1)? '': settlementPrice1)}}
					</span>
				</div>
				<!-- <div class="cell3">　</div> -->
			</div>
			<!-- 現價顯示列2 -->
			<div class="flex-row flex-center" :class="settlementPrice2Color" v-if="psd.$IS_COMPOSITE">
				<div class="cell0" />
				<div class="cell1" />
				<div class="flex-1 flex-start flex-row flex-center">
					<span class="posr pdtb1">
						<div class="qo-p-prefix flex-start">
							<span >{{$ln('收_', $ln('收'))}}</span><span class="pdlr1">/</span>
						</div>
						{{$symbolPrice(sid2, isNaN(settlementPrice2)? '': settlementPrice2)}}
					</span>
				</div>
				<!-- <div class="cell3">　</div> -->
			</div>
			<!-- 更多資訊 : 實虛/組合/到期日 -->
			<PositionCardExtraInfo v-if="!psd.$IS_COMPOSITE" class="" :sid="sid" :psd="psd" />
		</div>
		<!-- 展開區 -->
		<PositionCardExpand class="" v-if="expand" :sid="sid" :psd="psd" />
    </div>
</template>

<script>
import Exercise from "@/components/Exercise.vue";
import SubContract from "@/components/SubContract.vue";
import PositionCardExpand from '@/components/PositionCardExpand';
import PositionCardExtraInfo from '@/components/PositionCardExtraInfo';
/** 滾動監聽 */
import Vue from 'vue';
import VueWaypoint from 'vue-waypoint'

export default {
	props: ["positionSumData", "expandSid", "suspend"],
	data() {
		return {
			expand: false,
			/** 加入/移除 風控命令結果 */
			updateRiskResult: {},
        }
	},
    methods: {
		/** 點擊展開/收合圖示 */
		onBtnExpand() {
			// 總表沒有這檔商品不支援其他操作功能。
			if (!this.supportItem) {
				this.$store.state.notify(`error`, this.$ln('商品表无此商品 !'));
				return;
			}
			// 合约已下市
			if (this.psd.$qo && this.psd.$qo.$delisting) {
				this.$store.state.notify(`error`, this.$ln('合约已下市 !'));
				return;
			}
			this.expand = !this.expand;
			// 展開時通報上層
			if (this.expand) {
				this.$emit("onExpand", this.esid);
				// 展開就視為關注此商品
				this.$store.commit("setSelectedSymbol", this.sid);
			}
		},
		/** 長按彈出簡易下單盒 */
		onPress() {
			// 合約表沒有這檔商品不支援其他操作功能。
			if(!this.isAvailable) return;
			this.$store.commit("setSelectedSymbol", this.sid);
			this.$emit("setContractsList");
			eventBus.$emit("ORDER", {positionEffect: 'OPEN'});
		},
		/** 滾動監聽 */
		onWaypoint({going, direction}) {
			// console.log(`QuoteCard.onWaypoint`, this.sid, going, direction);
			// this.visibility = going === "in";
			// Waypoint:out 超過 1 秒才設定為不可視，已解決行情ScrollBounce發生會快速 out->in 導致隱藏後又顯示的問題
			if (going === 'in') {
				this.visibility = true;
				clearTimeout(this.offVisibilityTimeout);
			}
			else {
				this.offVisibilityTimeout = setTimeout((self)=>{self.visibility = false;}, 1000, this);
			}
		},
	},
	components: {
		Exercise,
		SubContract,
		PositionCardExpand,
		PositionCardExtraInfo,
	},
	watch: {
		// 上層帶來的 expandSid 改變時，檢查自己是否應該閉合/展開
		propExpandSid(nv) {
			this.expand = nv === this.esid;
		},
		expand(nv){
			eventBus.$emit("EXPAND");
		},
	},
	computed: {
		precisionBeyondTickSize() {try{return this.$store.state.config.CONFIG.POSITION.precisionBeyondTickSize;}catch(e){}},
		precision(){
			return isNaN(this.precisionBeyondTickSize) || this.precisionBeyondTickSize == null ? 1 : this.precisionBeyondTickSize
		},
		$clr0() {return this.$store.state.fn.$clr0;},
		$displayPL() {return this.$store.state.fn.$displayPL;},
		twMode() {
			return this.$store.state.config.twMode;
		},
		symbolName() {
			return M4C.Symbol.getContractName(this.sid);
		},
		symbolNameFontSize() {
			return this.symbolName.length >=5 ? 'font-size-small': null;
		},
		isStockItem() {
			return this.sid.indexOf('I.S') == 0;
		},
		sid() {
			return this.psd.SYMBOL || (this.psd.COMPOSITE_LIST ? this.psd.COMPOSITE_LIST[0].SYMBOL : null);
		},
		sid2() {
			return this.psd.SYMBOL2 || (this.psd.COMPOSITE_LIST ? this.psd.COMPOSITE_LIST[1].SYMBOL : null);
		},
		psd() {
			return this.positionSumData;
		},
		iconType() {
			if (this.psd.$qo && this.psd.$qo.$delisting)
				return "block";
			else if (this.expand)
				return "arrow_drop_up";
			else
				return "arrow_drop_down";
		},
		propExpandSid() {
			return this.expandSid;
		},
		buyAvg() {
			return this.$symbolPrice(this.sid, this.psd.$BAVG, this.precision);
		},
		sellAvg() {
			return this.$symbolPrice(this.sid, this.psd.$SAVG, this.precision);
		},
		// 當前帳號支持行權功能 (SIM 不支持)
		supportExercise() {
			return this.$store.state.login.brokerID !== "IceTech" && this.$store.state.config.CONFIG.ENABLE_EXERCISE;
		},
		// 未實現損益
		unrealizedPL() {
			// 有設定以對手價計算損益時 -> 優先使用 [未平倉損益(對手價)] > [未平倉損益]
			return vuex.config.profitByOpposite ? (this.psd.UNREALIZED_OPPOSITE_PL || this.psd.UNREALIZED_PL) : this.psd.UNREALIZED_PL;
		},
		/** 逐筆盈虧 文字 */
		plText() {
			return this.$displayPL(this.unrealizedPL);
		},
		/** 逐筆盈虧 樣式 */
		plClass() {
			return this.$clr0(this.unrealizedPL);
		},
		esid() {
			return this.sid + (this.psd.$IS_COMPOSITE ? this.psd.$COMPOSITE_IDX : '');
		},
		/** 總表沒有這檔商品不支援。 */
		supportItem () {
			return M4C.Symbol.getMainformInfo(this.sid);
		},
		// 已行權申請數量
		exerciseQty(){
			return M4C.Exercise.ExerciseQtyMap[this.sid] || 0;
		},
		// 當前交易帳號的pdsetting
		acPdSetting() {
			return this.$store.state.config.tradePdSetting;
		},
		// 是否為期權商品
		isOpt() {
			return M4C.Option.isOpt(this.sid);
		},
		showInfo(){
			return this.visibility && !this.suspend;
		},
		// 名稱是否顯示 C/P
		displayCP() {
			// 台灣模式的複式選擇權不要顯示
			return this.psd.$IS_COMPOSITE ? false : true;
		},
		labelB() {
			return this.$ln(this.isOpt ? (this.twMode ? '買' : '权利') : '多');
		},
		labelS() {
			return this.$ln(this.isOpt ? (this.twMode ? '賣' : '义务') : '空');
		},
		// 複式部位腳1買賣 (用object同時提供class)
		psd1BS() {
			let isBuy = this.psd.COMPOSITE_LIST[0].SIDE === 'BUY';
			return isBuy ? {class: 'clr-B border-B', label: '買'} : {class: 'clr-S border-S', label: '賣'};
		},
		// 複式部位腳2買賣 (用object同時提供class)
		psd2BS() {
			let isBuy = this.psd.COMPOSITE_LIST[1].SIDE === 'BUY';
			return isBuy ? {class: 'clr-B border-B', label: '買'} : {class: 'clr-S border-S', label: '賣'};
		},
		// 複式部位腳1均價
		psd1Price() {
			return this.$symbolPrice(this.sid, Number(this.psd.COMPOSITE_LIST[0].PRICE));
		},
		// 複式部位腳2均價
		psd2Price() {
			return this.$symbolPrice(this.sid2, Number(this.psd.COMPOSITE_LIST[1].PRICE));
		},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		psdFoot1() {return this.psd.$IS_COMPOSITE? this.psd.COMPOSITE_LIST[0]: this.psd;},
		psdFoot2() {return this.psd.$IS_COMPOSITE? this.psd.COMPOSITE_LIST[1]: "";},
		// server夾在部位中的結算價
		settlementPrice1() {return Number(this.psdFoot1.SETTLEMENT_PRICE)},
		// 判斷結算價文字顯示顏色
		settlementPrice1Color() {
			let qo = M4C.Quote.getQuoteObject(this.sid);
			let cg = this.settlementPrice1 - qo.r;
			if(cg > 0) return 'clr-up';
			else if(cg < 0) return 'clr-dn';
			else return 'clr-ref';
		},
		// server夾在部位中的結算價
		settlementPrice2() {return Number(this.psdFoot2.SETTLEMENT_PRICE)},
		// 判斷結算價文字顯示顏色
		settlementPrice2Color() {
			let qo = M4C.Quote.getQuoteObject(this.sid2);
			let cg = this.settlementPrice2 - qo.r;
			if(cg > 0) return 'clr-up';
			else if(cg < 0) return 'clr-dn';
			else return 'clr-ref';
		},
		// 有支援的商品
		isAvailable() {return this.$checkSupportedItem(this.sid);},
		// 判斷是否支援
		$checkSupportedItem() {return this.$store.state.fn.$checkSupportedItem;},
	}
}
</script>

<style scoped>
.position-card-ctn {
	min-height: 7em;
	/* border-bottom: 1px solid #666; */
}
.expand-ctn {
	padding: 2vw;
}
.bs-btn {
	width: 7vw;
	max-height: 1.5em;
}
.tw-mode .bs-btn {
	width: 5vw;
}
.is-opt .clr-B {
	color: rgba(11,160,255,0.52) !important;
	border: 1px solid rgba(11,160,255,0.52) !important;
}
.is-opt .clr-S {
	color: rgba(245,137,35,0.54) !important;
	border: 1px solid rgba(245,137,35,0.54) !important;
}
.focus {
	border: 1px solid #DA9522;
}
.qo-p-prefix {
	position:absolute;
	margin: auto;
	top: 0;
	bottom: 0;
	left: -2em;
}
</style>