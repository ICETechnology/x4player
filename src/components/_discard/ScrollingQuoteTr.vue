<template>
	<tr class="">
		<!-- 名称 -->
		<th class="vw33">
			<!-- 合約名稱 -->
			<div class="flex-1 w100p flex-start name font-size-big font-bold">{{getName}}</div>
			<!-- 代碼月份 -->
			<div class="flex-1 w100p flex-start clr-gray">{{getSymbolMonth}}</div>
		</th>
		<!-- 最新价 -->
		<td class="vw22">{{updatePrice(qo.p)}}</td>
		<!-- 涨跌 -->
		<td class="vw22 flex-col">
			<span :class="[qo.$clr]">{{`${qo.$cg>0?'+':''}${qo.$cg}`}}</span>
			<span :class="[qo.$clr]">{{`${qo.$cg>0?'+':''}${qo.$cgr}`}}</span>
		</td>
		<!-- 总量 -->
		<td class="vw22">{{$commas(qo.v)}}</td>
		<!-- 买价 -->
		<td class="vw22">{{updatePrice(qo.bp1)}}</td>
		<!-- 卖价 -->
		<td class="vw22">{{updatePrice(qo.sp1)}}</td>
		<!-- 最高 -->
		<td class="vw22">{{updatePrice(qo.h)}}</td>
		<!-- 最低 -->
		<td class="vw22">{{updatePrice(qo.l)}}</td>
		<!-- 昨结 -->
		<td class="vw22">{{updatePrice(qo.r)}}</td>
		<!-- 昨收 -->
		<td class="vw22">{{updatePrice(qo.pc)}}</td>
	</tr>
</template>

<script>
export default {
	props: ["sid", "expandObj", "suspend"],
	data() {
		return {
			// 未停用 (彈出下層視窗/切到其它頁簽等等，都會進入 suspend===true 狀態)
			notSuspend: !this.suspend,
			qo: M4C.Quote.getQuoteObject(this.sid),
			/** 當前是否展開 */
			expand: false,
		};
	},
	mounted() {
		if (this.notSuspend)
			M4C.Quote.sub(this.sid, this);
	},
	beforeDestroy() {
		M4C.Quote.unsub(this.sid, this);
	},
	methods: {
		onQuoteCardClick(evt) {
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.sid);
			// 彈出商品頁
			if (this.$store.state.device.isMobile)
				eventBus.$emit("POPUP-DIALOG", "QuotePage", {sid: this.sid});
		},
		updatePrice(val) {
			if (!val) return;
			return M4C.Symbol.fillDecimalLength(this.sid, val);
		},
	},
	computed: {
		/** 本商品點擊展開的更多 sid */
		moreContracts() {
			return this.expandObj ? this.expandObj.moreContracts : [];
		},
		// "澳幣1906"
		getName: function() {
			return M4C.Symbol.getContractName(this.sid);
		},
		// "6A1906"
		getSymbolMonth: function() {
			return M4C.Symbol.getCIDM4(this.sid);
		},
		// 買方寬度
		changeWidth: function() {
			let qo = this.qo;
			return `width: ${parseInt((qo.bv1 / (qo.sv1 + qo.bv1)) * 100)}%`;
		}
	},
	watch: {
		suspend: function(nv, ov) {
			// 進入 suspend 狀態
			if (nv && !ov) {
				setTimeout((self)=>{
					M4C.Quote.unsub(self.sid, self);
					self.notSuspend = false;
				}, 100, this);
			}
			// 解除 suspend 狀態
			else if (ov && !nv) {
				this.notSuspend = true;
				M4C.Quote.sub(this.sid, this);
			}
		}
	},
	components: {}
};
</script>

<style>
</style>