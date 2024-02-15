<template>
    <div class="option-underlying-ctn flex-col">
		<!-- APP 版 -->
		<div v-if="!param || (!param.include_selector && !param.mode)" class="flex-1 flex-row" @click="onClick">
			<div class="w35vw flex-col" :class="[qoS.$clr]">
				<div class="flex-start font-size-large">{{displayPrice}}</div>
				<div class="flex-1 flex-start nowrap font-size-mini">{{$symbolChgTxt(qoS) || "--"}}</div>
			</div>
			<!-- <div class="flex-1"/> -->
			<div class="flex-1 flex-col flex-end mgl1 font-size-mini" :class="{'font-size-small':largeSize}" >
				<div class="flex-1 flex-row w100p">
					<div class="flex-start label">{{$ln(`隐含波动率`)}}</div>
					<div class="flex-center nowrap pdl1" :class="$clr0(diffIV)">{{qoS.iv ? qoS.iv.toFixed(2) : '--'}} ({{diffIV}})</div>
				</div>
				<div class="flex-1 flex-row w100p">
					<div class="flex-start label">{{$ln(`20天历史波动率`)}}</div>
					<div class="flex-center nowrap pdl1" :class="$clr0(diffHV4)">{{qoS.hv4 ? qoS.hv4.toFixed(2): '--'}} ({{diffHV4}})</div>
				</div>
			</div>
		</div>
		<!-- 包含期權選擇器模式 (桌機版期權雲個股版面) -->
		<div v-if="param && param.include_selector" class="FULL font-size-small">
			<table class="w100p h100p">
				<tr>
					<td rowspan="2" class="">
						<!-- 桌機版選擇權商品選擇器 -->
						<DesktopOptionSymbolSelector />
					</td>
					<td rowspan="2" class="text-align-center font-size-xl nowrap pdlr3" :class="[qoS.$clr]">{{displayPrice}}</td>
					<td rowspan="2" class="text-align-center font-size-xl nowrap" :class="[qoS.$clr]">{{$symbolChgTxt(qoS) || "--"}}</td>
					<td class="nowrap">{{$ln('最高')}}</td>
					<td class="nowrap" :class="[$clrUd(qoS.h, qoS.p)]">{{updatePrice(qoS.h)}}</td>
					<td class="nowrap">{{$ln('最低')}}</td>
					<td class="nowrap" :class="[$clrUd(qoS.l, qoS.p)]">{{updatePrice(qoS.l)}}</td>
					<td class="nowrap">{{$ln('隐含波动率')}}</td>
					<td class="nowrap" :class="$clr0(diffIV)">{{qoS.iv ? qoS.iv.toFixed(2) : '--'}} ({{diffIV}})</td>
				</tr>
				<tr>
					<td class="nowrap">{{$ln('成交量')}}</td>
					<td colspan="3" class="nowrap">{{$commas(qoS.v)}}</td>
					<td class="nowrap">{{$ln('20天历史波动率')}}</td>
					<td class="nowrap" :class="$clr0(diffHV4)">{{qoS.hv4 ? qoS.hv4.toFixed(2): '--'}} ({{diffHV4}})</td>
				</tr>
			</table>
		</div>
		<!-- 期權標的資訊 -->
		<div v-if="param && param.mode == '1'" class="font-size-small flex-col">
			<div class="flex-row flex-center" :class="[largeSize?'':'pdb2']">
				<div class="flex-1"><span class="icon-btn rd1 pdlr2 nowrap clr-orange font-bold">{{$ln('标的')}}</span></div>
				<div class="flex-1 nowrap">{{underlyingSymbolName()}} </div>
				<div class="flex-1" :class="[qoS.$clr,{'font-size-little':largeSize}]">{{displayPrice}}</div>
				<div class="flex-1 nowrap font-size-mini" :class="[qoS.$clr,{'font-size-little':largeSize}]">{{$symbolChgTxt(qoS) || "--"}}</div>
			</div>
			<div class="flex-row flex-center mgl2 font-size-mini">
				<div class="flex-1 flex-row">
					<div class="flex-start  label-text">{{$ln(`隐含波动率`)}}</div>
					<div class="flex-1 flex-center nowrap" :class="[$clr0(diffIV),{'font-size-little':largeSize}]">{{qoS.iv ? qoS.iv.toFixed(2) : '--'}} ({{diffIV}})</div>
				</div>
				<div class="flex-1 flex-row">
					<div class="flex-bottom-left label-text">{{$ln(`20天历史波动率`)}}</div>
					<div class="flex-1 flex-bottom nowrap" :class="[$clr0(diffHV4),{'font-size-little':largeSize}]">{{qoS.hv4 ? qoS.hv4.toFixed(2): '--'}} ({{diffHV4}})</div>
				</div>
			</div>
		</div>
    </div>
</template>

<script>
/**
如果underlying.F包含_U (include_U) 则，这是 [没有期货的个股期权]
	显示"合成期货/标的"
	内容显示 [Underlying.F+所选月份] 和 [underlying.S]

如果不包含_U (!include_U) 则
	如果underlying.S不等于underlying.F则这是 [有期货的个股期权]
		显示"热门期货/标的"
		内容显示 [underlying.F+HOT] 和 [underlying.S]
	如果underlying.F等于underlying.S则这是 [期货期权]
		显示"热门期货/标的"
		内容显示 [underlying.F+HOT(用月份表示)] 和 [underlying.F+所选月份]
*/
export default {
	props: ["fakeMthHeadTarget", "selectedMonth", "param"],
	data() {
		return {
			qoS: {},
		}
	},
	beforeMount() {
		let sid = this.sid;
		if (!sid) return;
		this.qoS = M4C.Quote.getQuoteObject(sid);
		// console.log(`OptionUnderlying.underlyingS : `, this.underlyingS, `->`, this.underlyingS);
		// 訂閱/解訂 Q
		M4C.Quote.sub(sid, this);
		// 加訂/解訂 O (以取得 IV/HV 值)
		M4C.send({"s": "OG", "c": "sub", "d": {"s": sid}, "r": "".random()});
	},
    mounted() {},
	beforeDestroy() {
		M4C.Quote.unsub(this.sid, this);
		M4C.send({"s": "OG", "c": "unsub", "d": {"s": [this.sid]}, "r": "".random()});
	},
	components: {},
    methods: {
		onClick() {
			let sid = this.sid;
			if (!sid) return;
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", sid);
			// 彈出商品頁
			eventBus.$emit("POPUP-DIALOG", "QuotePage", {sid: sid});
		},
		updatePrice(val) {
			if (!val) return;
			return M4C.Symbol.fillDecimalLength(this.sid, val);
		},
		underlyingSymbolName() {
			return M4C.Symbol.getContractName(this.underlyingS);
		},
	},
	watch: {
		qosPrice(nv) {
			this.$emit("onSubjectMatterPrice", nv);
		},
		// 商品切換
		sid(nv, ov) {
			if(ov) {
				// 解訂
				M4C.Quote.unsub(ov, this);
				M4C.send({"s": "OG", "c": "unsub", "d": {"s": [ov]}, "r": "".random()});
			}
			// 訂閱/解訂 Q
			M4C.Quote.sub(nv, this);
			// 加訂/解訂 O (以取得 IV/HV 值)
			M4C.send({"s": "OG", "c": "sub", "d": {"s": nv}, "r": "".random()});
			// 重設qo
			this.qoS = M4C.Quote.getQuoteObject(nv);
		},
	},
    computed: {
		largeSize(){ return this.$store.state.config.largeSize;},
		$clr0() {return this.$store.state.fn.$clr0;},
		$clrUd() {return this.$store.state.fn.$clrUd;},
		$commas() {return this.$store.state.fn.$commas;},
		$symbolChgTxt() {return this.$store.state.fn.$symbolChgTxt;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		underlying() {
			return this.$store.state.opt.underlying;
		},
		underlyingS() {
			return this.underlying.S;
		},
		underlyingF() {
			return this.underlying.F;
		},
		contracts() {
			if(this.fakeMthHeadTarget)
				return this.fakeMthHeadTarget.contracts;
			else {
				return this.$store.state.opt.contracts[this.selectedMonth];
			}
		},
		sid() {
			// 期货期权
			if (this.isFeatureOption) {
				// 相容週台期
				try{return `${M4C.Symbol.getMainformInfo(this.contracts.C[0]).Underlying.F}.${this.month6}`;}catch(e){}
				return `${this.underlyingF}.${this.fakeMthHeadTarget.month}`;
			}
			// 个股期权
			else
				return this.underlyingS;
		},
		// 固定取前六碼 (ex. "202009W2" -> "202009")
		month6() {
			if(this.fakeMthHeadTarget)
				return this.fakeMthHeadTarget.month.substr(0, 6);
			if(this.selectedMonth)
				return this.selectedMonth.substr(0, 6);
		},
		/** 標的合約類別(自定義) 1:没有期货的个股期权, 2:有期货的个股期权, 3:期货期权 */
		underlyingType() {
			if (this.underlyingF.indexOf("_U") != -1)
				return 1;
			else if (this.underlyingS === this.underlyingF)
				return 3;
			else
				return 2;
		},
		// 顯示最新價
		displayPrice() {
			let price = this.qoS.p || this.qoS.r || this.qoS.pc || "--";
			return isNaN(price)? price: this.$symbolPrice(this.sid, price);
		},
		/** 標的物最新價 */
		qosPrice() {
			return this.qoS.p;
		},
		/** 隱含波動率差值 */
		diffIV() {
			return ((this.qoS.iv || 0) - (this.qoS.piv || 0)).toFixed(1);
		},
		/** 20天歷史波動率差值 */
		diffHV4() {
			return ((this.qoS.hv4 || 0) - (this.qoS.phv4 || 0)).toFixed(1);
		},
		// 是期貨期權
		isFeatureOption() {
			return this.$store.state.opt.isFeatureOption;
		},
	},
}
</script>

<style scoped>
.label {
	width: 30vw;
}
.desktop .label {
	width: 8em;
	margin: 0 1em;
}
.desktop .flex-top-left, .desktop .flex-bottom-left {
	display: flex;
	align-items: center;
	justify-content: flex-start;
}
.desktop .flex-top, .desktop .flex-bottom {
	display: flex;
	align-items: center;
	justify-content: center;
}
.desktop .icon-btn {
	padding: 2px 0.5em;
}
</style>