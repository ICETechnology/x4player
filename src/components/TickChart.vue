<template>
    <div class="sec-chart-ctn flex-row mgb2">
		<!-- 走勢圖區域 -->
		<div class="flex-1 canvas-ctn posr" ref="lineCanvasCtn">
			<!-- 格線 -->
			<div v-show="displayCanvas" class="grid-line" v-for="obj in gridList" :style="{top: `${obj.top}px`}" />
			<canvas v-show="displayCanvas" ref="canvas" :width="ratioWidth" :height="ratioHeight"></canvas>
		</div>
		<!-- 價格軸區域 -->
		<div class="price-ctn posr">
			<!-- 格線標籤 -->
			<div class="grid-label clr-gray2 flex-center" :class="{'font-size-micro': !isDesktop}" v-for="obj in gridList" :style="{top: `${obj.top}px`}">{{displayPrice(obj.price)}}</div>
			<!-- 最新價標籤 -->
			<div v-show="displayCanvas" class="price-label last-price flex-center" :class="[qo.$bgc, {'font-size-micro': !isDesktop}]" :style="{top: `${lastPriceTop}px`}">{{displayPrice(qo.p)}}</div>
		</div>
		<resize-observer @notify="onResize" v-if="isDesktop" />
    </div>
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';
export default {
	mixins: [QuoteAgent],
	props: [],
	data() {
		return {
			tickWidth: 2,
			canvasWidth: 0,
            canvasHeight: 0,
			ratioWidth: 1,
			ratioHeight: 1,
			// 區域內最高價
			maxPrice: -1,
			// 區域內最低價
			minPrice: -1,
			// 走勢折線圖顏色
			priceLineColor: "#FFFFFF",
			// 最右方保留寬度 (保證平線)
			rightKeepWidth: 20,
			// 最新價標籤的 Y 位置
			lastPriceTop: 0,
			// 格線資料
			gridList: [],
			// 是否顯示線圖
			displayCanvas: true,
		}
	},
	beforeMount() {
	},
    mounted() {
		this.canvas = this.$refs.canvas;
		this.resizeCanvas();
	},
	beforeDestroy() {
	},
	components: {},
    methods: {
		onResize() {
			this.displayCanvas = false;
			this.maxPrice = -1;
			this.minPrice = -1;
			this.gridList = [];
			setTimeout(this.resizeCanvas, 250);
			setTimeout(()=>{this.displayCanvas = true}, 500);
		},
		// 同步畫布尺寸
		resizeCanvas() {
			let self = this;
			let ratio = this.ratio;
			// 取得畫布尺寸
			let width = parseInt(this.$refs.lineCanvasCtn.clientWidth)+1;
			let height = this.$refs.lineCanvasCtn.clientHeight;
			// 轉向過程可能拿到 height=0 的情況，應略過不處理
			if (width && height) {
				this.canvasWidth = width;
				this.canvasHeight = height;
				this.ratioWidth = width * ratio;
				this.ratioHeight = height * ratio;
				this.canvas.style.width = width + 'px';
				this.canvas.style.height = height + 'px';
				this.maxTickLength = parseInt((this.ratioWidth - this.rightKeepWidth) / this.tickWidth);
				this.$store.state.tickChart.maxSize = this.maxTickLength;
			}
			// 必需要 setTimeout 讓 canvas 尺寸穩定後才能畫
			setTimeout(this.redraw, 250);
		},
		// 分析最大最小值
		analysisMaxMin() {
			let max = Number.MIN_VALUE, min = Number.MAX_VALUE;
			this.tickList.forEach((p)=>{
				if(p != ""){
					max = p > max ? p : max;
					min = p < min ? p : min;
				}
			});
			if (max !== this.maxPrice || min !== this.minPrice) {
				this.maxPrice = max;
				this.minPrice = min;
				try{this.analysisGrid();}catch(err){}
			}
		},
		analysisGrid() {
			this.gridList = [];
			// 天地線價格
			this.topPrice = +Big(this.maxPrice).plus(this.ticksize);
			this.btmPrice = +Big(this.minPrice).minus(this.ticksize);
			// 天地價格區間
			this.priceRange = +Big(this.topPrice).minus(this.btmPrice);
			// 原始應切分為多少格
			let orgStepCount = +Big(this.priceRange).div(this.ticksize);
			// 原始每一格應佔用高度
			let orgGridHeight = +Big(this.canvasHeight).div(orgStepCount);
			// 調整後使用幾個 grid 區間
			let useGridCounts = orgStepCount > 5 ? 5 : orgStepCount;
			// 調整後每一格 grid 佔用幾個 ticksize (無條件進位法)
			let gridTicksizeStep = Math.ceil(+Big(orgStepCount).div(useGridCounts));
			// Grid 之間的高度
			let useGridHeight = +Big(orgGridHeight).times(gridTicksizeStep);
			// 橫線數量
			let len = useGridCounts + 1;
			for (let i=0; i<len; i++) {
				let top = +Big(i).times(useGridHeight);
				if (top > this.canvasHeight) continue;
				this.gridList.push({
					top: top,
					price: +Big(this.topPrice).minus(Big(i).times(this.ticksize).times(gridTicksizeStep)),
				});
			}
		},
		// 整張重畫
		redraw() {
			if (this.tickList.length === 0)
				return;
			// 分析價格軸 (依賴 getRangedData)
			this.analysisMaxMin();
			// 走勢折線圖
			let ctx = this.canvas.getContext('2d');
			// 清空線圖
			ctx.clearRect(0, 0, 9000, 9000);
			// 走勢折線圖顏色
			ctx.strokeStyle = this.priceLineColor;
			ctx.lineWidth = 1;
			ctx.beginPath();
			let offsetX = 0, offsetY = 0;
			let len = this.tickList.length;
			for (let i=0; i<len; i++) {
				let price = this.tickList[i];
				offsetX = parseInt(i * this.tickWidth) + 0.5;
				offsetY = parseInt((this.topPrice - price) / this.priceRange * this.ratioHeight) + 0.5;
				if (i === 0) {	// 移動到初始位置
					ctx.moveTo(offsetX, offsetY);
					continue;
				}
				ctx.lineTo(offsetX, offsetY);
			}
			this.lastPriceTop = offsetY / this.ratio;
			ctx.lineTo(this.ratioWidth, offsetY);
			ctx.stroke();
			ctx.closePath();
		},
		displayPrice(price) {
			return this.$symbolPriceX({sid: this.sid, val: price, noDeno: true, fillDecimal: true});
		},
	},
	watch: {
		tickList(nv) {
			this.redraw();
		},
		sid(nv) {
			this.$store.state.tickChart.tickList = [];
		}
	},
    computed: {
		sid() {
			return this.$store.state.selectedSymbol.ID;
		},
		ticksize() {
			return Number(this.$store.state.selectedSymbol.MInfo.TickSize) || 1;
		},
		ratio() {
			// return this.$store.state.device.ratio;
			return 1;
		},
		tickList() {
			return this.$store.state.tickChart.tickList;
		},
		isDesktop() {return this.$store.state.device.isDesktop;},
		$symbolPriceX() {return this.$store.state.fn.$symbolPriceX;},
	},
}
</script>

<style scoped>
.price-ctn {
	width: 15vw;
}
canvas {
    position: absolute;
    top: 0;
    left: 0;
}
.price-label {
	position: absolute;
	left: 0;
	right: 0;
}
.price-label.last-price {
	margin-top: -6px;
	padding: 0 2px;
}
.grid-line {
	position: absolute;
	left: 0;
	right: 0;
	height: 0;
	border-top: 1px dashed #444;
}
.grid-label {
	position: absolute;
	left: 0;
	right: 0;
	margin-top: -6px;
	padding: 0 2px;
}
/** 桌機版 */
.desktop .price-ctn{
	width: 6em;
}
.desktop .grid-label, .desktop .price-label{
	margin-top: -0.5em;
}
</style>