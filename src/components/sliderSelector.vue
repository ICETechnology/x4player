<template>
	<div class="FULL slider-selector-ctn">
		<div class="selector-ctn overflow-auto">
			<span v-for="(opt, key) in options" :key="key">{{opt}}</span>
		</div>
	</div>
</template>
<script>
export default {
	props: ["value", "sid", "step", "min", "max", "optList", "arrowDown", "disable", "pos"],
	data(){
		return{
			ctnTop: 0,
			ctnLeft: 0,
			ctnWidth: 0,
			itemList: this.optList || [],
			minValue: isNaN(this.min) ? 0 : this.min,
			maxValue: isNaN(this.max) ? Number.MAX_VALUE : this.max,
		}
	},
	mounted(){
		// 首次展開，建立上下檔位
				if (this.itemList.length === 0) {
					let value = this.value;
					// 價格模式，補齊小數位數
					if (this.sid)
						value = M4C.Symbol.fillDecimalLength(this.sid, parseFloat(this.value));
					// 第一個值 (傳進來的值)
					this.itemList.push(value);
					// 預設上下加 N 檔
					for (let i=0; i<20; i++) {
						this.appendRow(1);
						this.appendRow(-1);
					}
				}

				setTimeout((self)=>{
					let itemListCtn = self.$refs.itemListCtn;
					// 定位列表容器位置與大小
					let ctnHeight = itemListCtn.clientHeight;
					self.ctnTop = self.$refs.inputEl.getBoundingClientRect().top - ctnHeight - 1;
					self.ctnLeft = self.$refs.inputEl.getBoundingClientRect().left;
					self.ctnWidth = self.$refs.inputEl.getBoundingClientRect().width;
					// 把 .selected 捲到置中
					let item = self.selectedItem = itemListCtn.querySelector('.selected');
					if (item) {
						// scrolling 效果
						let options = {
							container: '.item-list-ctn',
							easing: 'ease-in',
							offset: -itemListCtn.clientHeight/2 + item.clientHeight/2,
							force: true,
							cancelable: true,
							x: false,
							y: true
						}
						VueScrollTo.scrollTo(item, 1, options);
					}
				}, 10, this);
	},
	methods: {
		onItemClick(num) {
			this.$emit('input', num);
			this.expand = false;
		},
		onListScroll() {
			let body = this.$refs.itemListCtn;
			let scrollTop = body.scrollTop;
			// 捲動到頂且小於最大值 -> 動態新增
			if ((scrollTop == 0 )&& ( Number(this.maxValue) > +Big(this.itemList[0]))) {
				for (let i=0; i<20; i++) {this.appendRow(1);}
				body.scrollTop = 10 * this.selectedItem.clientHeight;
			}
			// 捲動到底且大於最小值 -> 動態新增
			if ((scrollTop >= body.scrollHeight - body.clientHeight - 5) && ( Number(this.minValue) < +Big(this.itemList[this.itemList.length - 1]))) {
				for (let i=0; i<20; i++) {this.appendRow(-1);}
			}
		},
		/** 向上或向下建立新一列 */
		appendRow(diff) {
			let list = this.itemList;
			// 取最上面/下面的值
			let idx = diff > 0 ? 0 : (list.length-1);
			let num = +Big(list[idx]).plus(+Big(diff).times(this.step));
			if (num < this.minValue)
				return;
			if (num > this.maxValue)
				return;
			if (this.sid)
				num = M4C.Symbol.fillDecimalLength(this.sid, num);
			// 加入至上方或下方
			list[diff > 0 ? 'unshift' : 'push'](num);
		},
		/** 文字顏色 */
		fontClr(price) {
			if (this.sid)
				return this.$clrUd(price, this.qo.r);
			return "";
		},
	},
	computed: {
		$clrUd() {return this.$store.state.fn.$clrUd;},
	}
}
</script>
<style scoped>
.slider-selector-ctn{

}
</style>