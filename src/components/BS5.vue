<template>
	<div class="flex-col">
		<!-- 商品合約名稱 -->
		<div v-if="isDesktop" class="flex-center pd2 font-size-small flex-row">
			<span>{{symbolName}}</span>
			<span class="mgl1">{{symbolCIDM4}}</span>
			<span v-if="displayAsHot" class="mgl1">({{$ln('主连')}})</span>
		</div>
		<!-- App版 head -->
		<div v-if="!isDesktop && !noBSBtn && !largeSize" class="bs-label-ctn flex-row mgtb1 pdt1 space-evenly">
			<div class="flex-center"><span class="head-label b-label flex-center" :class="{'head-label-display10':display10}">{{$ln('委买')}}</span></div>
			<div class="flex-center"><span class="head-label s-label flex-center" :class="{'head-label-display10':display10}">{{$ln('委卖')}}</span></div>
		</div>
		<div v-else-if="largeSize" class="flex-row pdtb1d5 bgc-333 font-size-normal">
			<div class="flex-1 pdr3 mgr3 flex-end clr-up">{{$ln('委买')}}</div>
			<div class="flex-1 pdl3 mgl3 flex-start clr-dn">{{$ln('委卖')}}</div>
		</div>
		<div class="flex-1 flex-col" :class="{'pd1':!largeSize}" >
			<div class="flex-1 flex-row" :class="{'mgtb1':!largeSize}">
				<div class="flex-1 flex-end"><span class="bar bbar bgc-up" :class="{'bar-display10':display10}" :style="changeWidth(qo.bv1)"><span class="hh flex-start mgr1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{qo.bv1}}</span></span></div>
				<div class="flex-1 flex-end pdr3 clr-up tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(qo.bp1)">{{updatePrice(qo.bp1)}}</div>
				<div class="flex-1 flex-start pdl3 clr-dn tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(row1qop)">{{updatePrice(row1qop)}}</div>
				<div class="flex-1 flex-start"><span class="bar sbar bgc-dn" :class="{'bar-display10':display10}" :style="changeWidth(row1qov)"><span class="hh flex-start mgl1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{row1qov}}</span></span></div>
			</div>
			<div class="divider-bottom"/>
			<div class="flex-1 flex-row" :class="{'mgtb1':!largeSize}">
				<div class="flex-1 flex-end"><span class="bar bbar bgc-up" :class="{'bar-display10':display10}" :style="changeWidth(qo.bv2)"><span class="hh flex-start mgr1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{qo.bv2}}</span></span></div>
				<div class="flex-1 flex-end pdr3 clr-up tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(qo.bp2)">{{updatePrice(qo.bp2)}}</div>
				<div class="flex-1 flex-start pdl3 clr-dn tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(row2qop)">{{updatePrice(row2qop)}}</div>
				<div class="flex-1 flex-start"><span class="bar sbar bgc-dn" :class="{'bar-display10':display10}" :style="changeWidth(row2qov)"><span class="hh flex-start mgl1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{row2qov}}</span></span></div>
			</div>
			<div class="divider-bottom"/>
			<div class="flex-1 flex-row" :class="{'mgtb1':!largeSize}">			
				<div class="flex-1 flex-end"><span class="bar bbar bgc-up" :class="{'bar-display10':display10}" :style="changeWidth(qo.bv3)"><span class="hh flex-start mgr1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{qo.bv3}}</span></span></div>
				<div class="flex-1 flex-end pdr3 clr-up tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(qo.bp3)">{{updatePrice(qo.bp3)}}</div>
				<div class="flex-1 flex-start pdl3 clr-dn tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(row3qop)">{{updatePrice(row3qop)}}</div>
				<div class="flex-1 flex-start"><span class="bar sbar bgc-dn" :class="{'bar-display10':display10}" :style="changeWidth(row3qov)"><span class="hh flex-start mgl1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{row3qov}}</span></span></div>
			</div>
			<div class="divider-bottom"/>
			<div class="flex-1 flex-row" :class="{'mgtb1':!largeSize}">
				<div class="flex-1 flex-end"><span class="bar bbar bgc-up" :class="{'bar-display10':display10}" :style="changeWidth(qo.bv4)"><span class="hh flex-start mgr1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{qo.bv4}}</span></span></div>
				<div class="flex-1 flex-end pdr3 clr-up tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(qo.bp4)">{{updatePrice(qo.bp4)}}</div>
				<div class="flex-1 flex-start pdl3 clr-dn tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(row4qop)">{{updatePrice(row4qop)}}</div>
				<div class="flex-1 flex-start"><span class="bar sbar bgc-dn" :class="{'bar-display10':display10}" :style="changeWidth(row4qov)"><span class="hh flex-start mgl1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{row4qov}}</span></span></div>
			</div>
			<div class="divider-bottom"/>
			<div class="flex-1 flex-row" :class="{'mgtb1':!largeSize}">
				<div class="flex-1 flex-end"><span class="bar bbar bgc-up" :class="{'bar-display10':display10}" :style="changeWidth(qo.bv5)"><span class="hh flex-start mgr1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{qo.bv5}}</span></span></div>
				<div class="flex-1 flex-end pdr3 clr-up tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(qo.bp5)">{{updatePrice(qo.bp5)}}</div>
				<div class="flex-1 flex-start pdl3 clr-dn tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(row5qop)">{{updatePrice(row5qop)}}</div>
				<div class="flex-1 flex-start"><span class="bar sbar bgc-dn" :class="{'bar-display10':display10}" :style="changeWidth(row5qov)"><span class="hh flex-start mgl1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{row5qov}}</span></span></div>
			</div>
			<template v-if="display10" >
				<div class="divider-bottom"/>
				<div class="flex-1 flex-row" :class="{'mgtb1':!largeSize}">
					<div class="flex-1 flex-end"><span class="bar bbar bgc-up" :class="{'bar-display10':display10}" :style="changeWidth(qo.bv6)"><span class="hh flex-start mgr1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{qo.bv6}}</span></span></div>
					<div class="flex-1 flex-end pdr3 clr-up tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(qo.bp6)">{{updatePrice(qo.bp6)}}</div>
					<div class="flex-1 flex-start pdl3 clr-dn tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(row6qop)">{{updatePrice(row6qop)}}</div>
					<div class="flex-1 flex-start"><span class="bar sbar bgc-dn" :class="{'bar-display10':display10}" :style="changeWidth(row6qov)"><span class="hh flex-start mgl1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{row6qov}}</span></span></div>
				</div>
				<div class="divider-bottom"/>
				<div class="flex-1 flex-row" :class="{'mgtb1':!largeSize}">
					<div class="flex-1 flex-end"><span class="bar bbar bgc-up" :class="{'bar-display10':display10}" :style="changeWidth(qo.bv7)"><span class="hh flex-start mgr1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{qo.bv7}}</span></span></div>
					<div class="flex-1 flex-end pdr3 clr-up tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(qo.bp7)">{{updatePrice(qo.bp7)}}</div>
					<div class="flex-1 flex-start pdl3 clr-dn tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(row7qop)">{{updatePrice(row7qop)}}</div>
					<div class="flex-1 flex-start"><span class="bar sbar bgc-dn" :class="{'bar-display10':display10}" :style="changeWidth(row7qov)"><span class="hh flex-start mgl1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{row7qov}}</span></span></div>
				</div>
				<div class="divider-bottom"/>
				<div class="flex-1 flex-row" :class="{'mgtb1':!largeSize}">
					<div class="flex-1 flex-end"><span class="bar bbar bgc-up" :class="{'bar-display10':display10}" :style="changeWidth(qo.bv8)"><span class="hh flex-start mgr1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{qo.bv8}}</span></span></div>
					<div class="flex-1 flex-end pdr3 clr-up tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(qo.bp8)">{{updatePrice(qo.bp8)}}</div>
					<div class="flex-1 flex-start pdl3 clr-dn tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(row8qop)">{{updatePrice(row8qop)}}</div>
					<div class="flex-1 flex-start"><span class="bar sbar bgc-dn" :class="{'bar-display10':display10}" :style="changeWidth(row8qov)"><span class="hh flex-start mgl1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{row8qov}}</span></span></div>
				</div>
				<div class="divider-bottom"/>
				<div class="flex-1 flex-row" :class="{'mgtb1':!largeSize}">
					<div class="flex-1 flex-end"><span class="bar bbar bgc-up" :class="{'bar-display10':display10}" :style="changeWidth(qo.bv9)"><span class="hh flex-start mgr1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{qo.bv9}}</span></span></div>
					<div class="flex-1 flex-end pdr3 clr-up tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(qo.bp9)">{{updatePrice(qo.bp9)}}</div>
					<div class="flex-1 flex-start pdl3 clr-dn tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(row9qop)">{{updatePrice(row9qop)}}</div>
					<div class="flex-1 flex-start"><span class="bar sbar bgc-dn" :class="{'bar-display10':display10}" :style="changeWidth(row9qov)"><span class="hh flex-start mgl1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{row9qov}}</span></span></div>
				</div>
				<div class="divider-bottom"/>
				<div class="flex-1 flex-row" :class="{'mgtb1':!largeSize}">
					<div class="flex-1 flex-end"><span class="bar bbar bgc-up" :class="{'bar-display10':display10}" :style="changeWidth(qo.bv10)"><span class="hh flex-start mgr1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{qo.bv10}}</span></span></div>
					<div class="flex-1 flex-end pdr3 clr-up tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(qo.bp10)">{{updatePrice(qo.bp10)}}</div>
					<div class="flex-1 flex-start pdl3 clr-dn tcef price-cell" :class="{'font-size-big':largeSize}" @click="onPriceClick(row10qop)">{{updatePrice(row10qop)}}</div>
					<div class="flex-1 flex-start"><span class="bar sbar bgc-dn" :class="{'bar-display10':display10}" :style="changeWidth(row10qov)"><span class="hh flex-start mgl1" :class="{'hh-display10':display10,'font-size-big':largeSize}" >{{row10qov}}</span></span></div>
				</div>
			</template>
			<div class="divider-bottom"/>
			<div class="flex-row flex-horizontal-center" :class="{'mgtb1 flex-1':!largeSize}" >
				<div class="totalbar bbar bgc-up" :class="{'totalbar-display10':display10}" :style="bTotalBarWidth"><span class="hh flex-start mgr1" :class="{'hh-display10':display10}" >{{getBTotal}}</span></div>
				<div class="totalbar sbar bgc-dn" :class="{'totalbar-display10':display10}" :style="sTotalBarWidth"><span class="hh flex-start mgl1" :class="{'hh-display10':display10}" >{{getSTotal}}</span></div>
			</div>
		</div>
		<div class="flex-col" v-if="$store.state.config.CONFIG.BS5_BEST_ONE">
			<div class="flex-center bgc-333" :class="{'pdtb1':largeSize, 'font-size-normal':largeSize}">{{$ln(`最佳虚拟一档`)}}</div>
			<div class="flex-row mgtb1" :class="{'font-size-big':largeSize}" >
				<div class="flex-1 flex-end"><span class="hh flex-start mgr1" :class="{'hh-display10':display10}"  >{{qo.ibv || '--'}}</span></div>
				<div class="flex-1 flex-end pdr3 clr-up tcef" @click="onPriceClick(qo.ibp)">{{updatePrice(qo.ibp)}}</div>
				<div class="flex-1 flex-start pdl3 clr-dn tcef" @click="onPriceClick(qo.isp)">{{updatePrice(qo.isp)}}</div>
				<div class="flex-1 flex-start"><span class="hh flex-start mgl1" :class="{'hh-display10':display10}" >{{qo.isv || '--'}}</span></div>
			</div>
		</div>
	</div>
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';

export default {
	mixins: [QuoteAgent],
	props: ['suspend', 'noBSBtn'],
	data() {
		return {
			volumeList: ['sv5','sv4','sv3','sv2','sv1','bv1','bv2','bv3','bv4','bv5'],
			bTotal: 0,
			sTotal: 0,
		}
	},
	computed: {
		largeSize(){ return this.$store.state.config.largeSize;},
		twMode() {
			return this.$store.state.config.twMode;
		},
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		sid() {return this.$store.state.selectedSymbol.ID;},
		maxVolume() {
			let maxVolume = 0;
			this.volumeList = this.display10 ? ['sv10','sv9','sv8','sv7','sv6','sv5','sv4','sv3','sv2','sv1','bv1','bv2','bv3','bv4','bv5','bv6','bv7','bv8','bv9','bv10'] : ['sv5','sv4','sv3','sv2','sv1','bv1','bv2','bv3','bv4','bv5'];
			for (let i=0; i<this.volumeList.length; i++) {
				let key = this.volumeList[i];
				if (this.qo[key] > maxVolume)
					maxVolume = this.qo[key];
			}
			return maxVolume;
		},
		// 買量加總
		getBTotal() {
			let qo = this.qo;
			return this.bTotal = this.display10 ? Number(qo.bv1 + qo.bv2 + qo.bv3 + qo.bv4 + qo.bv5 + qo.bv6 + qo.bv7 + qo.bv8 + qo.bv9 + qo.bv10) : Number(qo.bv1 + qo.bv2 + qo.bv3 + qo.bv4 + qo.bv5);		 
		},
		// 賣量加總
		getSTotal() {
			let qo = this.qo;
			return this.sTotal = this.display10 ? Number(qo.sv1 + qo.sv2 + qo.sv3 + qo.sv4 + qo.sv5 + qo.sv6 + qo.sv7 + qo.sv8 + qo.sv9 + qo.sv10) : Number(qo.sv1 + qo.sv2 + qo.sv3 + qo.sv4 + qo.sv5);
		},
		// 買方總量Bar寬度
		bTotalBarWidth() {
			let bsTotal = this.bTotal + this.sTotal;
			return `width: ${this.bTotal/bsTotal*100}%`;
		},
		// 賣方總量Bar寬度
		sTotalBarWidth() {
			let bsTotal = this.bTotal + this.sTotal;
			return `width: ${this.sTotal/bsTotal*100}%`;
		},
		/** 視為熱門月(主連) */
		displayAsHot() {
			return this.$store.state.selectedSymbol.displayAsHot;
		},
		// "澳幣"
		symbolName() {
			return M4C.Symbol.getContractName(this.sid);
		},
		// "6A1906"
		symbolCIDM4() {
			return M4C.Symbol.getCIDM4(this.sid);
		},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		// 台灣模式賣方要由小到大 https://trello.com/c/fQLrUsTP
		row1qop() {return this.twMode ? this.qo.sp1 : this.isBS5 ? this.qo.sp5 : this.qo.sp10;},
		row2qop() {return this.twMode ? this.qo.sp2 : this.isBS5 ? this.qo.sp4 : this.qo.sp9;},
		row3qop() {return this.twMode ? this.qo.sp3 : this.isBS5 ? this.qo.sp3 : this.qo.sp8;},
		row4qop() {return this.twMode ? this.qo.sp4 : this.isBS5 ? this.qo.sp2 : this.qo.sp7;},
		row5qop() {return this.twMode ? this.qo.sp5 : this.isBS5 ? this.qo.sp1 : this.qo.sp6;},
		row6qop() {return this.twMode ? this.qo.sp6 : this.qo.sp5;},
		row7qop() {return this.twMode ? this.qo.sp7 : this.qo.sp4;},
		row8qop() {return this.twMode ? this.qo.sp8 : this.qo.sp3;},
		row9qop() {return this.twMode ? this.qo.sp9 : this.qo.sp2;},
		row10qop() {return this.twMode ? this.qo.sp10 : this.qo.sp1;},
		row1qov() {return this.twMode ? this.qo.sv1 : this.isBS5 ? this.qo.sv5 : this.qo.sv10;},
		row2qov() {return this.twMode ? this.qo.sv2 : this.isBS5 ? this.qo.sv4 : this.qo.sv9;},
		row3qov() {return this.twMode ? this.qo.sv3 : this.isBS5 ? this.qo.sv3 : this.qo.sv8;},
		row4qov() {return this.twMode ? this.qo.sv4 : this.isBS5 ? this.qo.sv2 : this.qo.sv7;},
		row5qov() {return this.twMode ? this.qo.sv5 : this.isBS5 ? this.qo.sv1 : this.qo.sv6;},
		row6qov() {return this.twMode ? this.qo.sv6 : this.qo.sv5;},
		row7qov() {return this.twMode ? this.qo.sv7 : this.qo.sv4;},
		row8qov() {return this.twMode ? this.qo.sv8 : this.qo.sv3;},
		row9qov() {return this.twMode ? this.qo.sv9 : this.qo.sv2;},
		row10qov() {return this.twMode ? this.qo.sv10 : this.qo.sv1;},
		// 顯示10檔
		display10() {
			// 有10檔顯示10檔，10檔以下顯示5檔	
			return this.qo.bp6;
		},
	},
	methods: {
		changeWidth(val) {
			return `width: ${parseInt(val/this.maxVolume*100)}%`;
		},
		updatePrice(val) {
			if (!val) return "--";
			return this.$symbolPrice(this.sid, val);
		},
		onPriceClick(orderPrice) {
			// 桌機版 : 將一般 click 過濾為 dbl-click (固定寫法)
			if (this.isDesktop && this.waitDoubleClick == null) {this.waitDoubleClick = true; setTimeout(self=>delete self.waitDoubleClick, 300, this); return;}
			// 彈出下單盒
			eventBus.$emit("ORDER", {
				orderType: 'LIMIT',
				orderPrice: orderPrice,
				positionEffect: 'OPEN',
			});
		},
	},
}
</script>

<style lang="scss" scoped>
.head-label {
	min-width: 40vw;
	height: 9vw;
	color: white;
	border-radius: 2vw;
}
.head-label-display10{
	height: 7.5vw;
}
.head-label.b-label {
	background-color: #FD0A28;
}
.head-label.s-label {
	background-color: #4A90E2;
}
.space-evenly{
	justify-content: space-evenly;
}

.bar {
	display: inline-block;
	height: 7vw;
}
.bar-display10{
	height: 4.5vw;
}
.sbar {
	text-align: left;
	background-color: #62A418;
}
.bbar {
	text-align: right;
	background-color: red;
}
.bbar span {
	float: right;
}
.totalbar {
	display: inline-block;
	height: 7vw;
}
.totalbar-display10 {
	height: 4.5vw;
}
.hh {
	height: 7vw;
}
.hh-display10 {
	height: 4.5vw;
}

@media screen and (max-height: 620px) {
	.bar {
		height: 5vw;
	}
	.totalbar {
		height: 5vw;
	}
	.hh{
		height: 5vw;
	}
	.mgtb1{
		margin-top: 0;
		margin-bottom: 0;
	}
}
@media screen and (orientation: landscape) {
	.bar, .hh, .totalbar {
		height: 20px;
	}
	.head-label {
		height: 24px;
	}
	.mgtb1 {
		margin-top: 4px;
		margin-bottom: 4px;
	}
	.pdt1 {
		padding-top: 4px;
	}
	.pd1 {
		padding: 4px;
	}
}
/** 桌機版 */
.desktop .head-label {
	min-width: 150px;
	height: 34px;
	color: white;
	border-radius: 8px;
}
.desktop .bar, .desktop .totalbar, .desktop .hh {
	height: 1.5em;
}
.divider-bottom {
	border-bottom: 1px solid #313131;
}
.desktop .price-cell:hover {
	color: aqua;
	background-color: #333F5A;
}
</style>