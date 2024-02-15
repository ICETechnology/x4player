<template>
	<div class="input-selector-ctn">
		<!-- 仿 Input 顯示區 -->
		<div ref="inputEl" class="flex-row input-ctn ht2">
			<div class="flex-1 flex-center" @click="onInputClick">{{value}}</div>
			<div class="flex-center icon-ctn" v-if="arrowDown"><i class="material-icons md-24">arrow_drop_down</i></div>
		</div>
		<!-- 展開後彈出容器 -->
		<div v-if="expand" class="FULL input-selector-full-ctn" @click="expand=false">
			<div ref="itemListCtn" class="item-list-ctn scrolling-y" @scroll="optList?null:onListScroll()"
				:style="{top: ctnTop+'px', left: ctnLeft+'px', width: ctnWidth+'px'}" v-stop-propagation>
				<div class="item flex-center" v-for="num in itemList" :class="{selected: num==value}" 
					@click.stop="onItemClick(num)"><span :class="fontClr(num)">{{num}}</span></div>
			</div>
		</div>
	</div>
</template>

<script>
let VueScrollTo = require('vue-scrollto');
export default {
	props: ["value", "sid", "step", "min", "max", "optList", "arrowDown", "disable"],
	data() {
		return {
			expand: false,
			ctnTop: 0,
			ctnLeft: 0,
			ctnWidth: 0,
			itemList: this.optList || [],
			// minValue: isNaN(this.min) ? 0 : this.min,
			// maxValue: isNaN(this.max) ? Number.MAX_VALUE : this.max,
		}
	},
	beforeMount() {
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onInputClick() {
			this.expand = true;
			// 文字情境不展開 (ex. 市價)
			if (!this.optList && isNaN(this.value))
				this.expand = false;
		},
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
		reset(val){
			this.itemList = [];
			// 重設預設值(當預設值不在範圍內，重設為最小值)
			if(this.value > this.maxValue || this.value < this.minValue)
				this.$emit('input', val);
		},
	},
	watch: {
		expand(nv) {
			if (nv) {
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
			}
		},
		// props參數變換時更新itemlist
		max(nv, ov){
			if(this.itemList.length && nv != ov){
				this.reset(this.minValue);
			}
		},
		min(nv, ov){
			if(this.itemList.length && nv != ov){
				this.reset(this.minValue);
			}
		},
		step(nv, ov){
			if(this.itemList.length && nv != ov){
				this.reset(this.minValue);
			}
		},
	},
    computed: {
		$clrUd() {return this.$store.state.fn.$clrUd;},
		// 預期帶入的 sid 一定等於 selectedSymbol.ID 所以可以直接拿 (未來若可能不同時則需要修改)
		qo() {return this.$store.state.selectedSymbol.QO;},
		minValue() {return isNaN(this.min) ? 0 : this.min;},
		maxValue() {return isNaN(this.max) ? Number.MAX_VALUE : this.max;},
	},
}
</script>

<style scoped>
.input-selector-full-ctn {
	position: fixed;
	z-index: 2;
}
.input-ctn {
	width: 100%;
	min-width: 10vw;
	text-align: center;
	padding: 0;
	border: 0;
	color: black;
	background-color: white;
}
.item-list-ctn {
	position: absolute;	
	height: 60vw;
	color: black;
	background-color: white;
	/* box-shadow: 0 0 0 1px gray; */
}
.item {
	height: 10vw;
}
.item.selected {
	background-color: #F1F3F4;
}
.item-list-ctn .item .clr-ref {
	color: black !important;
}
.ts-jump-qty .input-selector-ctn .input-ctn{
	border-radius: 0.2em;
}

@media screen and (orientation: landscape) {
	.item-list-ctn {
		height: 60vh;
	}
	.input-ctn, .item {
		height: 10vh;
		min-width: 10vh;
	}
}
/** 桌機版 */
.desktop .input-ctn {
	width: 3em;
	height: 2.28em;
	min-width: 2.28em;
}
</style>