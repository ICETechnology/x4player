<template>
    <tr @click="onClick" :class="{'selected': selected}">
		<td v-for="obj in columns" :style="{'text-align': obj.align || 'right'}" v-if="!obj.hide"
			class="nowrap pdtb1 pdlr2" @contextmenu.prevent="(e)=>{$emit('contextMenu', psd, obj, _self)}"
			:class="cellClass(obj)">
			{{cellText(obj)}}
		</td>
    </tr>
</template>

<script>
export default {
	props: ['psd', 'selectedObj'],
	data() {
		return {
			_self: this,
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onClick() {
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.psd.SYMBOL);
			// 支持切換 設定/移除 當前選擇持倉
			this.selectedObj.psd = this.selectedObj.psd === this.psd ? null : this.psd;
			// 將一般 click 過濾為 dbl-click (固定寫法)
			if (this.waitDoubleClick == null) {this.waitDoubleClick = true; setTimeout(self=>delete self.waitDoubleClick, 300, this); return;}
			eventBus.$emit("ORDER", {orderType: 'LIMIT'});
		},
		/** 欄位的 text 內容 */
		cellText(obj) {
			let key = obj.key;
			// 指定為價格類型欄位
			if (obj.isPrice)
				return M4C.Symbol.fillDecimalLength(this.sid, this.psd[key]);
			// 指定為損益類型欄位
			if (obj.isPL)
				return this.$displayPL(this.psd[key]);
			return this[key] || this.psd[key];
		},
		/** 欄位的 class 內容 */
		cellClass(obj) {
			let list = [];
			// 有指定此欄位要加入的 class 名稱
			if (obj.className)
				list.push(obj.className);
			// 有指定要得出此欄位的 class 的 compute 名稱
			if (obj.classKey)
				list.push(this[obj.classKey]);
			// 指定為損益類型欄位
			if (obj.isPL)
				return this.$clr0(this.psd[obj.key]);			
			return list;
		},
	},
	watch: {},
    computed: {
		$clr0() {return this.$store.state.fn.$clr0;},
		$displayPL() {return this.$store.state.fn.$displayPL;},
		sid() {
			return this.psd.SYMBOL;
		},
		columns() {
			return this.$store.state.desktop.positionColumns;
		},
		selected() {
			return this.selectedObj.psd === this.psd;
		}
	},
}
</script>

<style scoped>
tr:hover {
	color: aqua;
	background-color: #333;
}
</style>