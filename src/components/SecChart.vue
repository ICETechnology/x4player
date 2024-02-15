<template>
    <div class="sec-chart-ctn flex-col posr">
		<!-- 走勢圖區域 -->
		<div class="flex-1 canvas-ctn posr" ref="lineCanvasCtn1" >
			<canvas v-show="displayCanvas" ref="gridCanvas1" class="grid-canvas" :width="canvasWidth" :height="canvasHeight1"></canvas>
			<canvas v-show="displayCanvas" ref="canvas1" class="trend-canvas" :width="ratioWidth" :height="ratioHeight1"></canvas>
			<span class="sky-price clr-gray2 font-size-micro">{{$symbolPrice(sid, skyPrice)}}</span>
			<span class="ground-price clr-gray2 font-size-micro">{{$symbolPrice(sid, groundPrice)}}</span>
			<span class="trading-price font-size-micro" :style="{top: lastY+'px'}">{{$symbolPrice(sid, lastPrice)}}</span>
		</div>
		<!-- 時間標籤容器 -->
		<div class="time-ctn font-size-micro clr-gray flex-row flex-center">
			<div>{{firstTickTime}}</div>
			<div class="flex-1"></div>
			<div>{{lastTickTime}}</div>
		</div>
		<!-- 量區域 -->
		<div class="canvas-ctn volumn-canvas-ctn posr" ref="lineCanvasCtn2">
			<canvas v-show="displayCanvas" ref="gridCanvas2" class="grid-canvas" :width="canvasWidth" :height="canvasHeight2"></canvas>
			<canvas v-show="displayCanvas" ref="canvas2" class="volumn-canvas" :width="ratioWidth" :height="ratioHeight2"></canvas>
			<!-- 量標籤 -->
			<div class="max-volume-axis-label-ctn flex-col font-size-micro clr-gray">
				<span>{{rangedMaxQ}}</span>
			</div>
		</div>	
		<LoadingIcon v-if="isLoading"></LoadingIcon>	
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			qo: {},
			displayCanvas: true,
			canvasWidth: 0,
            canvasHeight1: 0,
            canvasHeight2: 0,
			ratioWidth: 1,
			ratioHeight1: 1,
			ratioHeight2: 1,
            gridSetting: {
				'grid_y': 4,
				'gridColor': '#333',
			},
			// 走勢折線圖顏色
			priceLineColor: "#518FF5",
			// 走勢漸層色 最頂部
			clrLinearTop: "#DEEDFC",
			// 走勢漸層色 最底部
			clrLinearBtm: "#DEEDFC",
			// 量柱狀圖顏色
			volumeBarColor: "#666",
			// 天線價格
			skyPrice: 0,
			// 地線價格
			groundPrice: 0,
			// 區間最大單量
			rangedMaxQ: 0,
			// 時間標籤
			timeList: [],
			/** 訂閱傳入的秒線資料 */
			propTickList: [],

			lastY: 0,
			lastPrice: 0,
		}
	},
	beforeMount() {
		this.propTickList = M4C.ChartData.subSecTick(this.sid);
	},
    mounted() {
		this.canvas1 = this.$refs.canvas1;
		this.canvas2 = this.$refs.canvas2;
		this.resizeCanvas();
	},
	beforeDestroy() {
		M4C.ChartData.unsubSecTick(this.sid);
	},
	components: {},
    methods: {
		onResize() {
			this.displayCanvas = false;
			setTimeout(()=>{
				this.resizeCanvas();
				this.redraw();
				this.displayCanvas = true;
			}, 200);
		},
		// 同步畫布尺寸
		resizeCanvas() {
			let self = this;
			let ratio = this.ratio;
			// 取得畫布尺寸
			let width = this.$refs.lineCanvasCtn1.clientWidth;
			let height1 = this.$refs.lineCanvasCtn1.clientHeight;
			let height2 = this.$refs.lineCanvasCtn2.clientHeight;
			// 轉向過程可能拿到 height=0 的情況，應略過不處理
			if (width && height1 && height2) {
				this.canvasWidth = width;
				this.canvasHeight1 = height1;
				this.canvasHeight2 = height2;
				this.ratioWidth = width * ratio;
				this.ratioHeight1 = height1 * ratio;
				this.ratioHeight2 = height2 * ratio;
				this.canvas1.style.width = width + 'px';
				this.canvas1.style.height = height1 + 'px';
				this.canvas2.style.width = width + 'px';
				this.canvas2.style.height = height2 + 'px';
			}
		},
		// 清除畫布
		clearCanvas() {
			this.$refs.canvas1.getContext('2d').clearRect(0, 0, this.ratioWidth, this.ratioHeight1);
			this.$refs.canvas2.getContext('2d').clearRect(0, 0, this.ratioWidth, this.ratioHeight2);
		},
		// 分析價格軸
		analysisPriceAxisInfo() {
			let high = Number.MIN_VALUE, low = Number.MAX_VALUE, maxQ = 0;
			this.secTickList.forEach((obj)=>{
				high = obj.p > high ? obj.p : high;
				low = obj.p < low ? obj.p : low;
				maxQ = obj.q > maxQ ? obj.q : maxQ;
			});
			// 天地線價格
			this.skyPrice = +Big(high).plus(this.ticksize);
			this.groundPrice = +Big(low).minus(this.ticksize);
			// 天地價格區間
			this.priceRange = +Big(this.skyPrice).minus(this.groundPrice);
			this.rangedMaxQ = maxQ;
		},
		// 整張重畫
		redraw() {
			// 時間標籤
			this.timeList = [];
			// 清空線圖
			this.canvas1.getContext('2d').clearRect(0, 0, 9000, 9000);
			this.canvas2.getContext('2d').clearRect(0, 0, 9000, 9000);

			// 每個 tick 可佔多少寬度
			let tickWidth = this.ratioWidth / this.secTickList.length;
			// 分析價格軸 (依賴 getRangedData)
			this.analysisPriceAxisInfo();
		
			// 走勢折線圖
			let ctx = this.canvas1.getContext('2d');
			ctx.beginPath();
			ctx.strokeStyle = this.priceLineColor;
			ctx.lineWidth = 2 * this.ratio;
			// 量長條圖
			let ctx2 = this.canvas2.getContext('2d');
			ctx2.beginPath();
			ctx2.strokeStyle = this.volumeBarColor;
			ctx2.lineWidth = 8 * this.ratio;
			let offsetX = 0, lastOffsetY = 0;

			let len = this.secTickList.length;
			for (let i=0; i<len; i++) {
				let tick = this.secTickList[i];
				offsetX = parseInt(i * tickWidth);
				offsetX += 0.5;
				// 畫走勢折線圖
				let offsetY = (this.skyPrice - tick.p) / this.priceRange * this.ratioHeight1;
				if (i === 0) {	// 移動到初始位置
					ctx.moveTo(offsetX, offsetY);
					continue;
				}
				ctx.lineTo(offsetX, offsetY);

				// 最後的價格與位置
				if (i === len - 1) {
					let percent = (this.skyPrice - tick.p) / this.priceRange;
					this.lastY = percent * this.canvasHeight1 + (percent > 0.5 ? -15 : 3);
					this.lastPrice = tick.p;
				}

				// 畫量長條圖
				offsetY = (this.rangedMaxQ - tick.q) / this.rangedMaxQ * this.ratioHeight2;
				ctx2.moveTo(offsetX, this.ratioHeight2);
				ctx2.lineTo(offsetX, offsetY);
			}
			ctx.stroke();
			ctx2.stroke();
		},			
	},
	watch: {
		secTickList(nv) {
			if (nv.length === 0)
				return;
			// 最後一次驗證，完整重畫一次耗時 0.3-0.8ms
			this.redraw();
		},
	},
    computed: {
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		sid() {
			return this.$store.state.selectedSymbol.ID;
		},
		ticksize() {
			return Number(this.$store.state.selectedSymbol.MInfo.TickSize);
		},
		ratio() {
			return this.$store.state.device.ratio;
		},
		secTickList() {
			let list = this.propTickList;
			if (list.length===0) return [];
			// 複製來源列表 (長度31)
			let result = this.propTickList.slice(0);
			// 最後一根是空資料($FAKE)時拔除
			if (list[list.length-1].$BY === "FAKE")
				result.pop();
			// 只取最後30根
			result = result.slice(-30);
			// 列印最後一根資料 (for debugger)
			// let lt = result[result.length-1];
			// let d = new Date().resetByDT(lt.d, lt.t);
			// console.log(`SecChart.secTickList`, d.time8(), lt.p, lt.q, lt.$BY);
			// 回覆的內容是長度30的陣列
			return result;
		},
		firstTickTime() {
			if (this.secTickList.length === 0) return "";
			let tick = this.secTickList[0];
			return new Date().resetByDT(tick.d, tick.t).time8();
		},
		lastTickTime() {
			if (this.secTickList.length === 0) return "";
			let tick = this.secTickList[this.secTickList.length-1];
			return new Date().resetByDT(tick.d, tick.t).time8();
		},
		/** 由线图资料里直接提供现在是否在查询中 */
		isLoading() {
			return this.secTickList.querying;
		}
	},
}
</script>

<style scoped>
.canvas-ctn {
	margin: 0 2px;
	border: 1px solid #444;
	/* background-color: #000; */
}
canvas {
    position: absolute;
    top: 0;
    left: 0;
}
.price-axis-label-ctn {
	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
}
.volume-axis-label-ctn {
	position: absolute;
	top: 0;
	left: 0;
}
.max-volume-axis-label-ctn {
	position: absolute;
	top: 2px;
	left: 2px;
}
.time-ctn {
	overflow: hidden;
	height: 20px;
}
.volumn-canvas-ctn {
	height: 25%;
}
.time-ctn {
	margin: 0 2px;
}
.time-label {
	border-left: 1px solid #999;
	padding: 0 1px;
	position: absolute;
	top: 0;
}
.sky-price {
	position: absolute;
	top: -1px;
	right: 0;
}
.ground-price {
	position: absolute;
	right: 0;
	bottom: -2px;
}
.trading-price {
	position: absolute;
	right: 0;
}
</style>