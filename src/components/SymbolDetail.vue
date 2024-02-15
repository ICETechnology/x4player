<template>
    <div class="ctn flex-col font-size-small">
    	<div class="flex-1 flex-row " v-if="isOpt">
			<span class="flex-center bgc-head clr-gray">{{$ln('内在价值')}}</span>
			<span class="flex-1 flex-end value tcef">{{parseToFixed(qo.ev, 4)}}</span>
			<span class="flex-center bgc-head clr-gray">{{$ln('时间价值')}}</span>
			<span class="flex-1 flex-end value">{{parseToFixed(qo.tv, 4)}}</span>
		</div>
    	<div class="flex-1 flex-row " v-if="isOpt">
			<span class="flex-center bgc-head clr-gray">{{$ln('Delta')}}</span>
			<span :class="['flex-1 flex-end value tcef', $clr0(qo.de)]">{{parseToFixed(qo.de/100)}}</span>
			<span class="flex-center bgc-head clr-gray">{{$ln('Gamma')}}</span>
			<span :class="['flex-1 flex-end value', $clr0(qo.ga)]">{{parseToFixed(qo.ga)}}</span>
		</div>
    	<div class="flex-1 flex-row " v-if="isOpt">
			<span class="flex-center bgc-head clr-gray">{{$ln('Theta')}}</span>
			<span :class="['flex-1 flex-end value tcef', $clr0(qo.th)]">{{parseToFixed(qo.th)}}</span>
			<span class="flex-center bgc-head clr-gray">{{$ln('Rho')}}</span>
			<span :class="['flex-1 flex-end value', $clr0(qo.rh)]">{{parseToFixed(qo.rh)}}</span>
		</div>
    	<div class="flex-1 flex-row " v-if="isOpt">
			<span class="flex-center bgc-head clr-gray">{{$ln('Vega')}}</span>
			<span :class="['flex-1 flex-end value tcef', $clr0(qo.ve)]">{{parseToFixed(qo.ve)}}</span>
			<span class="flex-center bgc-head clr-gray">{{$ln('隐波率')}}</span>
			<span :class="['flex-1 flex-end value', $clr0(baIv)]">{{parseToFixed(baIv, 2)}}</span>
		</div>
    	<div class="flex-1 flex-row ">
			<span class="flex-center bgc-head clr-gray">{{$ln('最新价')}}</span>
			<span :class="['flex-1 flex-end value tcef price-cell', qo.$clr, lightUp.p?'lightUp':'']" @click="onPriceClick(qo.p)">{{updatePrice(qo.p)}}</span>
			<span class="flex-center bgc-head clr-gray">{{$ln('涨　跌')}}</span>
			<span :class="['flex-1 flex-end value', qo.$clr, lightUp.cg?'lightUp':'']">{{$cgTxt}}</span>
		</div>		
    	<div class="flex-1 flex-row">
			<span class="flex-center bgc-head clr-gray">{{$ln('买　价')}}</span>
			<span :class="['flex-1 flex-end value tcef price-cell', $clrUd(qo.bp1, qo.r), lightUp.bp1?'lightUp':'']" @click="onPriceClick(qo.bp1)">{{updatePrice(qo.bp1)}}</span>
			<span class="flex-center bgc-head clr-gray">{{$ln('涨跌幅')}}</span>
			<span :class="['flex-1 flex-end value', qo.$clr, lightUp.cg?'lightUp':'']">{{qo.$cgr}}</span>
		</div>
    	<div class="flex-1 flex-row">
			<span class="flex-center bgc-head clr-gray">{{$ln('卖　价')}}</span>
			<span :class="['flex-1 flex-end value tcef price-cell', $clrUd(qo.sp1, qo.r), lightUp.sp1?'lightUp':'']" @click="onPriceClick(qo.sp1)">{{updatePrice(qo.sp1)}}</span>
			<span class="flex-center bgc-head clr-gray">{{$ln('成交量')}}</span>
			<span class="flex-1 flex-end value" :class="{lightUp: lightUp.v}">{{$commas(qo.v)}}</span>
		</div>
    	<div class="flex-1 flex-row">
			<span class="flex-center bgc-head clr-gray">{{$ln('开盘价')}}</span>
			<span class="flex-1 flex-end value tcef price-cell" @click="onPriceClick(qo.o)">{{updatePrice(qo.o)}}</span>
			<span class="flex-center bgc-head clr-gray">{{$ln('昨成量')}}</span>
			<span class="flex-1 flex-end value">{{$commas(qo.pv)}}</span>
		</div>
    	<div class="flex-1 flex-row">
			<span class="flex-center bgc-head clr-gray">{{$ln('最高价')}}</span>
			<span class="flex-1 flex-end value tcef price-cell" @click="onPriceClick(qo.h)">{{updatePrice(qo.h)}}</span>
			<span class="flex-center bgc-head clr-gray">{{$ln('昨收盘')}}</span>
			<span class="flex-1 flex-end value tcef price-cell" @click="onPriceClick(qo.pc)">{{updatePrice(qo.pc)}}</span>
		</div>
    	<div class="flex-1 flex-row">
			<span class="flex-center bgc-head clr-gray">{{$ln('最低价')}}</span>
			<span class="flex-1 flex-end value tcef price-cell" @click="onPriceClick(qo.l)">{{updatePrice(qo.l)}}</span>
			<span class="flex-center bgc-head clr-gray">{{$ln('结算价')}}</span>
			<span class="flex-1 flex-end value tcef price-cell" @click="onPriceClick(qo.st)">{{qo.st || '--'}}</span>
		</div>
		<div class="flex-1 flex-row" v-if="twMode">
			<span class="flex-center bgc-head clr-gray">{{$ln('日盘限制口数')}}</span>
			<span class="flex-1 flex-end value tcef price-cell">{{lotLimitDay || '--'}}</span>
			<span class="flex-center bgc-head clr-gray">{{$ln('夜盘限制口数')}}</span>
			<span class="flex-1 flex-end value tcef price-cell">{{lotLimitNight || '--'}}</span>
		</div>
		<div class="flex-1 flex-row" v-if="twMode">
			<span class="flex-center bgc-head clr-gray">{{$ln('状态')}}</span>
			<span class="flex-1 flex-end value tcef price-cell">{{qoStatus}}</span>
			<span class="flex-center bgc-head clr-gray">{{$ln('原因')}}</span>
			<span class="flex-1 flex-end value tcef price-cell">{{qoResean}}</span>
		</div>
    	<div class="flex-1 flex-row">
			<span class="flex-center bgc-head clr-gray">{{$ln('开收盘')}}</span>
			<span class="flex-3 flex-center pdlr2">{{openCloseTime}}</span>
		</div>
    </div>
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';

export default {
	mixins: [QuoteAgent],
	props: ["suspend"],
	data() {
		return {
			lightUp: {
				p: false,
				v: false,
				bp1: false,
				sp1: false,
				cg: false,
			},
			// 商品行情狀態、原因對照表(目前bit只到2，後續如果有增減再做調整考量)
			qoStatusMap: {
				0 : "正常",
				1 : "試撮",
				2 : "暫停",
				3 : "禁刪",
				4 : "收盤",
				5 : "集合竸價",
				6 : "熔斷(可恢復交易)",
				7 : "熔斷(不可恢復交易)",
				8 : "停牌",
				9 : "非交易",
				10: "波動性中斷",
				11: "無狀態",
				12: "開盤前",
				13: "盤後交易",
				14: "休市",
				// 大於256 小於 512 表示暫停動態退單原因
				// 用bit表示同時多種原因
				bit0: "因應特殊市況",
				bit1: "動態價格穩定措施資訊異常",
				bit2: "因資訊異常基準價無法計算",
			}
        }
	},
	beforeMount() {
	},
    mounted() {
    },
	beforeDestroy() {},
	components: {
	},
    methods: {
		clr: function(v) {
			return v > this.qo.p ? 'clr-up' : (v < this.qo.p ? 'clr-dn' : 'clr-ref');
		},
		updatePrice: function(val) {
			return this.$symbolPrice(this.sid, val);
		},
		onPriceClick(orderPrice) {
			// 桌機版 : 將一般 click 過濾為 dbl-click (固定寫法)
			if (this.isDesktop && this.waitDoubleClick == null) {this.waitDoubleClick = true; setTimeout(self=>delete self.waitDoubleClick, 300, this); return;}
			// 彈出下單盒
			eventBus.$emit("ORDER", {
				orderType: 'LIMIT',
				orderPrice: orderPrice,
				// orderQty: 1,
				positionEffect: 'OPEN',
			});
		},
		// 處理浮點數顯示的小數位數
		parseToFixed(value, size) {
			// 空字串、無資料時回傳--
			if (isNaN(value) || value === "") return "--";
			return parseFloat(value).toFixed(size || 4);
		},
	},
	watch: {
		'qo.p': function(nv) {
			this.lightUp.p = true;
			setTimeout(()=>{this.lightUp.p = false;}, 1000);
		},
		'qo.v': function(nv) {
			this.lightUp.v = true;
			setTimeout(()=>{this.lightUp.v = false;}, 1000);
		},
		'qo.bp1': function(nv) {
			this.lightUp.bp1 = true;
			setTimeout(()=>{this.lightUp.bp1 = false;}, 1000);
		},
		'qo.sp1': function(nv) {
			this.lightUp.sp1 = true;
			setTimeout(()=>{this.lightUp.sp1 = false;}, 1000);
		},
		'qo.$cg': function(nv) {
			this.lightUp.cg = true;
			setTimeout(()=>{this.lightUp.cg = false;}, 1000);
		},
	},
    computed: {
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		$symbolChgTxtX() {return this.$store.state.fn.$symbolChgTxtX;},
		$clr0() {return this.$store.state.fn.$clr0;},
		isOpt() {return this.$store.state.selectedSymbol.isOpt},
		baIv() {
			let cp = this.sid.split(".")[5];
			if(this.isOpt && cp == 'C'){
				return this.qo.biv;
			}
			if(this.isOpt && cp == 'P'){
				return this.qo.aiv;
			}
		},
		$clrUd() {return this.$store.state.fn.$clrUd;},
		$commas() {return this.$store.state.fn.$commas;},
		sid() {return this.$store.state.selectedSymbol.ID;},
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		/** 開收盤時間的陣列 */
		tradingHoursList() {
			if (!this.sid) return;
			let val = M4C.Symbol.getTradingHours(this.sid);
			return val ? val.split(',') : [];
		},
		/** 開收盤時間顯示內容 */
		openCloseTime() {
			if (!this.tradingHoursList) return;
			let list = this.tradingHoursList.map((item)=>{
				let tmp = item.split('-');
				return tmp && tmp[1] ? `${tmp[0].substr(0,2)}:${tmp[0].substr(2,2)}~${tmp[1].substr(0,2)}:${tmp[1].substr(2,2)}` : '';
			});
			return list.join(' , ');
		},
		$cgTxt() {return this.$symbolChgTxtX({qo: this.qo, mode: 0});},
		twMode() {
			return this.$store.state.config.twMode;
		},
		// 行情狀態碼
		qoSta() {return this.qo.sta;},
		// 行情狀態
		qoStatus() {
			let sta = this.qoSta;
			// 小於等於256的值，直接顯示狀態
			if(!isNaN(sta) && sta <= 256) {
				return this.$ln(this.qoStatusMap[sta] || '');
			}
			// 大於256 小於 512 表示暫停動態退單原因
			else if(sta && sta > 256 && sta < 512) {
				return this.$ln('暫停動態退單')
			}
		},
		// 行情原因
		qoResean() {
			let sta = this.qoSta;
			// 大於256 小於 512 表示暫停動態退單原因
			if(sta && sta > 256 && sta < 512) {
				// 轉2進制陣列ex: 261 = 100000101
				let ar = Number(sta).toString(2).split('').reverse();
				let resean = '';
				ar.forEach((n, i)=> {
					// 值為1才加入原因
					if(n) {
						let str = this.$ln(this.qoStatusMap[`bit${i}`] || '');
						// 以、分隔多個原因
						if(resean && str)
							resean += `、${str}`;
						else if(str)
							resean += str;
					}
				});
				return resean;
			}
		},
		// 交易所總表
		exgMInfo() {return M4C.Symbol.getExgMainformInfo(this.sid);},
		// 日盤限制口數
		lotLimitDay() {return this.exgMInfo.lotLimitDay;},
		// 夜盤限制口數
		lotLimitNight() {return this.exgMInfo.lotLimitNight;},
    }
}
</script>

<style scoped>
.ctn > div > span {
	border-bottom: 1px solid #333;
}
.ctn > div {
	max-height: 18.9vw;
}
.bgc-head {
	width: 20vw;
}
.value {
	padding: 0 2vw;
	/* background-color: #111; */
}
/** 亮起 */
.lightUp {
	color: white !important;
	background: #DE781C !important;
}
/** 桌機版 */
.desktop .bgc-head {
	width: 20%;
	min-width: 20%;
}
.desktop .value {
	padding: 0 7px;
}
.desktop .price-cell:hover {
	color: aqua;
	background-color: #333F5A;
}
</style>