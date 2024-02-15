<template>
    <div class="mini-tchart tchart-ctn flex-col">
		<!-- 走勢圖區域 -->
		<div class="flex-1 canvas-ctn posr" ref="lineCanvasCtn1">
			<canvas ref="gridCanvas1" class="grid-canvas" :width="canvasWidth" :height="canvasHeight1"></canvas>
			<canvas ref="canvas1" class="trend-canvas" :width="ratioWidth" :height="ratioHeight1"></canvas>
			<!-- 價格標籤 -->
			<div class="price-axis-label-ctn flex-col font-size-micro clr-gray">
				<span class="clr-up">{{$symbolPriceX({sid, val: skyPrice, noDeno: true})}}</span>
				<span class="flex-1"/>
				<span>{{$symbolPriceX({sid, val: qo.r, noDeno: true})}}</span>
				<span class="flex-1"/>
				<span class="clr-dn">{{$symbolPriceX({sid, val: groundPrice, noDeno: true})}}</span>
			</div>
			<!-- 漲跌幅標籤 -->
			<div class="chgrate-axis-label-ctn flex-col font-size-micro clr-gray">
				<span class="clr-up">{{changeRate}}%</span>
				<span class="flex-1"/>
				<span>0.00%</span>
				<span class="flex-1"/>
				<span class="clr-dn">{{changeRate}}%</span>
			</div>
		</div>
		<!-- 時間標籤 -->
		<div class="time-ctn posr font-size-micro clr-gray">
			<div class="time-label" :style="{left: '0px'}">{{tradingDateTime.substr(4,4)}}</div>
		</div>
		<LoadingIcon v-if="isLoading"></LoadingIcon>
    </div>
</template>

<script>
import MiniTChartBase from '@/components/MiniTChartBase'
export default {
    mixins: [MiniTChartBase],
	props: ["suspend", "combine", "param"],
	data() {
		return {
			qo: {},
			isLoading: true,
			canvasWidth: 0,
            canvasHeight1: 0,
			ratioWidth: 1,
			ratioHeight1: 1,
            gridSetting: {
				'grid_y': 4,
				'gridColor': '#333',
			},
			// 走勢折線圖顏色
			priceLineColor: "#518FF5",
			// 天線價格
			skyPrice: 0,
			// 地線價格
			groundPrice: 0,
			// 區間最高價
			rangedHigh: 0,
			// 區間最低價
			rangedLow: Number.MAX_VALUE,
			// 使用幾分K的資料
            nk: '5',
			// 本交易日啟始日期時間12碼
            tradingDateTime: '',
        }
	},
	beforeMount() {},
    mounted() {
		this.canvas1 = this.$refs.canvas1;
		this.gridCanvas1 = this.$refs.gridCanvas1;
		if(!this.suspend) {
			this.resizeCanvas();
			this.changeSymbol();
		}
    },
	beforeDestroy() {
		let self = this;
		if (!this.suspend)
			M4C.ChartData.unsub(this, this.sid, this.nk);
		// 回收gpu記憶體佔用量
		self.canvas1.width = 0;
		self.canvas1.height = 0;
		self.gridCanvas1.width = 0;
		self.gridCanvas1.height = 0;
	},
	components: {
	},
    methods: {
		onChartData(sid, chartData, timeKeyList) {
			if (sid != this.sid) return;
			// 停止 LoadingIcon
			this.isLoading = false;
			// 線圖資料
			this.chartData = chartData;
			// 以時間格式組合出來的Array
			this.timeKeyList = timeKeyList;
			// 啟始日期時間 ex. '202109290905'
			this.tradingDateTime = timeKeyList[0];
			// 整張重畫
			this.redraw();
		},		
		// 取得指定時間區間內的資料
		getRangedData(sid, chartData, timeKeyList) {
			let self = this;
			let sidx = timeKeyList.indexOf(this.tradingDateTime);
			let eidx = timeKeyList.length - 1;
			let rangedData = [];
			for (let i = sidx; i <= eidx; i++) {
				let timeKey = timeKeyList[i];
				let tick = chartData[timeKey];
				if (tick) {
					// 統計區間最高/最低價
					this.rangedHigh = tick.h > this.rangedHigh ? tick.h : this.rangedHigh;
					this.rangedLow = tick.l < this.rangedLow ? tick.l : this.rangedLow;
					tick.$c = tick.h > this.qo.r ? tick.h : tick.l;
					rangedData.push(tick);
				}
			}
			return rangedData;
		},
		// 取得指定時間區間內的 timeKey 列表
		getRangedList(sid) {
			let self = this;
			let rangedList = [];
			// 開收盤時間列表
			let ocList = M4C.Symbol.getOpenCloseList(sid);
            let d8 = this.tradingDateTime.substr(0,8);
            ocList.forEach((oc)=>{
                let timeKey1 = self.hhmmToTimeKey(d8, ocList[0].start, oc.start);
                let timeKey2 = self.hhmmToTimeKey(d8, ocList[0].start, oc.close);
                let date1 = self.timeKeyToDate(timeKey1);
                let date2 = self.timeKeyToDate(timeKey2);
                let diffCnt = parseInt(+Big(date2 - date1).div(this.nk).div(60000)) + 1;
                for (let i=0; i<diffCnt; i++) {
                    let d = new Date(date1.getTime() + (i * this.nk * 60000));
                    let timeKey = self.dateToTimeKey(d);
                    let len = rangedList.push(timeKey);
                }
            });
			return rangedList;
		},
		// 分析價格軸
		analysisPriceAxisInfo() {
			let qo = this.qo;
			if (!qo || !qo.r) return;
			// 最高價與參考價價差
			let highDifference = parseFloat(Math.abs(this.rangedHigh - qo.r).toPrecision(8), 10);
			// 最低價與參考價價差
			let lowDifference = parseFloat(Math.abs(qo.r - this.rangedLow).toPrecision(8), 10);
			// 最大價差
			let maxDifference = Math.max(highDifference, lowDifference);
			// 跳動點數
			let ticksize = M4C.Symbol.getTickSize(this.sid, qo.r);
			// 最遠的價格需要幾個跳動點數 (取偶數)
			let diffTickCounts = Math.ceil(maxDifference / ticksize);
			// 增加 2~3 個 TickSize 作為天地線
			diffTickCounts += diffTickCounts%2 == 1 ? 3 : 2;
			// 天地線與參考價的價差
			let diffPrice = +Big(diffTickCounts).times(ticksize);
			// 天地線價格
			this.skyPrice = +Big(qo.r).plus(diffPrice);
			this.groundPrice = +Big(qo.r).minus(diffPrice);
			// 天地價格區間
			this.priceRange = +Big(this.skyPrice).minus(this.groundPrice);
		},
		// 整張重畫
		redraw() {
			// 有市況且已經回補完成才往下
			if (!this.tradingDateTime || !this.qos)
				return;
			// 清空畫布
			this.clearCanvas();
			// 總包含多少時間Tick的List (Array)
			let rangedList = this.getRangedList(this.sid);
			// 每個 tick 可佔多少寬度
			let tickWidth = this.ratioWidth / rangedList.length;
			// 截至目前為止有多少Tick的Data (Array)
			let rangedData = this.getRangedData(this.sid, this.chartData, this.timeKeyList);
			// console.log("TChart.rangedData", rangedData);
			// 分析價格軸 (依賴 rangedData)
			this.analysisPriceAxisInfo();
		
			// 走勢折線圖
			let ctx = this.canvas1.getContext('2d');
			ctx.beginPath();
			ctx.strokeStyle = this.priceLineColor;
			ctx.lineWidth = 2;
			let offsetX = 0, minY = 9999;

			let len = rangedData.length;
			for (let i=0; i<len; i++) {
				let tick = rangedData[i];
				offsetX = parseInt(i * tickWidth);
				offsetX += 0.5;
				// 畫走勢折線圖
				let offsetY = (this.skyPrice - tick.$c) / this.priceRange * this.ratioHeight1;
				if (i === 0) {	// 移動到初始位置
					ctx.moveTo(offsetX, offsetY);
					continue;
				}
				ctx.lineTo(offsetX, offsetY);
				minY = offsetY > 0 && offsetY < minY ? offsetY : minY;
			}
			ctx.stroke();
			ctx.closePath();
            // rangedList.length = 0;
            // rangedData.length = 0;
		},
		// 重置變數
		resetData() {
			// 天線價格
			this.skyPrice = 0;
			// 地線價格
			this.groundPrice = 0;
			// 區間最高價
			this.rangedHigh = 0;
			// 區間最低價
			this.rangedLow = Number.MAX_VALUE;
			// 清空線圖
			this.clearCanvas();
		},
		/** 切換連動商品 */
		changeSymbol(newSid, orgSid) {
			newSid = newSid || this.sid;
			this.isLoading = true;
			// 最多轉圈圈 10 秒
			setTimeout(self=>{self.isLoading = false;}, 9988, this);
			// 清空資料
			this.resetData();
			// 更新市況
			this.qo = M4C.Quote.getQuoteObject(newSid);
			// 訂閱
			M4C.ChartData.sub(this, newSid, this.nk, null, null, 1);
			// 解訂閱
			if (orgSid)
				M4C.ChartData.unsub(this, orgSid, this.nk);
		},
	},
	watch: {
		'$store.state.config.largeSize'(nv){
			this.resizeCanvas();
		},
		/** 啟用/停用 */
		suspend(nv, ov) {
			// 停用
			if (nv) {
				M4C.ChartData.unsub(this, this.sid, this.nk);
			}
			// 啟用
			else {
				this.changeSymbol();
			}
		},
		// 市況到達
		qos() {
			this.redraw();
		},
	},
	computed: {
		sid() {
            return M4C.Symbol.toMonthSymbol(this.param.propsSid);
		},
		qos(){return this.qo.s;},
		changeRate() {
			let rate = ((this.skyPrice - this.qo.r) / this.qo.r * 100).toFixed(2);
			return isNaN(rate)? '0.00': rate;
		},
		$symbolPriceX() {return this.$store.state.fn.$symbolPriceX;},
	},
}
</script>

<style scoped>
.tchart-ctn .head {
	margin: 0 2px;
	min-height: 40px;
}
.tchart-ctn .canvas-ctn {
	margin: 0 2px;
	border: 1px solid #666;
}
.tchart-ctn canvas {
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
.chgrate-axis-label-ctn {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
}
.time-ctn {
	overflow: hidden;
	height: 20px;
	margin: 0 2px;
}
.time-label {
	border-left: 1px solid #999;
	padding: 0 1px;
	position: absolute;
	top: 0;
}
</style>
