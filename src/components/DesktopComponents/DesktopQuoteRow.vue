<template>
    <tr :class="{selected: isSelected}" @click="onClick" v-waypoint="{active: true, callback: onWaypoint}">
		<!-- 不在畫面上時 -->
		<td v-if="!visibility" colspan=30>&nbsp;</td>
		<!-- 在畫面上時 -->
		<td v-for="obj in columns" :style="{'text-align': obj.align || 'right'}" v-if="!obj.hide && visibility"
			class="nowrap pdtb1" @click="onCellDblClick(obj)" @contextmenu.prevent="onContextMenu(obj)"
			:class="cellClass(obj)">
			{{cellText(obj)}}
		</td>
    </tr>
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';
export default {
	mixins: [QuoteAgent],
	props: ['sid', 'spaceRowObj', 'displayAsHot'],
	data() {
		return {
			self: this,
			visibility: false,
			isHot: false,
		}
	},
	beforeMount() {
	},
    mounted() {
	},
	beforeDestroy() {},
	components: {},
    methods: {
		onContextMenu(obj) {
			this.onClick();
			this.$emit('contextMenu', this.sid, obj, this);
		},
		onClick() {
			// 本合約是否為熱門月
			this.isHot = M4C.Symbol.isHotSID(this.sid);
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.sid);
			// 更新是否顯示為主連(熱門月)
			if (this.displayAsHot || this.isHot)
				this.$store.commit("setSelectedSymbolDisplayAsHot");
		},
		onCellDblClick(obj) {
			// 將一般 click 過濾為 dbl-click (固定寫法)
			if (this.waitDoubleClick == null) {this.waitDoubleClick = true; setTimeout(self=>delete self.waitDoubleClick, 300, this); return;}
			this.popupOrder(obj);
		},
		/** 彈出下單盒 */
		popupOrder(obj) {
			let price = obj.isPrice ? this.qo[obj.key] : this.qo.p;
			eventBus.$emit("ORDER", {orderType: 'LIMIT', orderPrice: price});
		},
		/** 滾動監聽 */
		onWaypoint({going, direction}) {
			this.visibility = going === 'in';
		},
		cellClass(obj) {
			let list = [];
			let qo = this.qo;
			if (obj.isPrice) {
				list.push('is-price');
				list.push(this.$clrUd(qo[obj.key], qo.r));
			}
			// 依據最新價進行漲跌變色
			if (obj.udClr) {
				list.push(this.$clrUd(qo.p, qo.r));
			}
			return list;
		},
		cellText(obj) {
			if (obj.isPrice)
				return this.$symbolPrice(this.sid, this.qo[obj.key]);
			return this[obj.key] || this.qo[obj.key];
		},
	},
	watch: {
		'qo.sn'(nv) {
			// console.log('DesktopQuoteRow qo: ', JSON.stringify(this.qo));
			let self = this;
			let qo = self.qo;
			let spaceRowObj = self.spaceRowObj;
			self.columns.forEach((obj)=>{
				let key = obj.key;
				let val = qo[key] || self[obj.key] || '';
				let txt = obj.isPrice || obj.isChange ? `${M4C.Symbol.fillDecimalLength(qo.s, val)}` : `${val}`;
				if (txt && (!spaceRowObj[key] || txt.length > spaceRowObj[key].length)) {
					self.$set(spaceRowObj, key, txt);
				}
			});
		},
	},
    computed: {
		$clrUd() {return this.$store.state.fn.$clrUd;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		columns() {
			return this.$store.state.desktop.quoteColumns;
		},
		minfo() {
			return M4C.Symbol.getMainformInfo(this.sid);
		},
		sids() {
			return this.sid.split('.');
		},
		/** 代碼 */
		symbol() {
			return this.minfo ? this.minfo.Symbol : this.sids[3];
		},
		/** 名稱 */
		contractName() {
			return M4C.Symbol.getContractName(this.sid) + ' ' + this.month4 + this.hotString;
		},
		month4() {
			let sid = this.sid;
			if (this.sids[4]==='HOT')
				sid = M4C.Symbol.toMonthSymbol(this.sid);
			let mth = sid.split('.')[4];
			return mth ? mth.substr(2) : '';
		},
		hotString() {
			if (this.displayAsHot || this.sids[4]==='HOT')
				return ' ' + this.$ln('主连');
			return '';
		},
		/** 總量 */
		v() {
			return this.$store.state.fn.$commas(this.qo.v);
		},
		/** 持倉量 */
		oi() {
			return this.$store.state.fn.$commas(this.qo.oi);
		},
		/** 昨持倉 */
		yoi() {
			return this.$store.state.fn.$commas(this.qo.yoi);
		},
		isSelected() {
			if (this.isHot)
				return this.sid === M4C.Symbol.toHotSymbol(this.$store.state.selectedSymbol.ID);
			else
				return this.sid === this.$store.state.selectedSymbol.ID;
		},
	},
}
</script>

<style scoped>
</style>