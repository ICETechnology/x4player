<template>
	<div class="FULL kbar-ctn flex-col">
		<div class="line-canvas-ctn flex-1 posr" ref="lineCanvasCtn">
			<!-- 格線 -->
			<canvas ref="gridCanvas" class="grid-canvas" :width="ratioWidth" :height="ratioHeight"></canvas>
			<!-- KBar 畫布 -->
			<canvas ref="canvas" class="KBar FULL" :width="ratioWidth" :height="ratioHeight"></canvas>
			<!-- 價格軸標籤 -->
			<div class="axis-label-ctn clr-gray font-size-mini">
				<span class="text nowrap" style="top: 1em">{{$symbolPriceX({sid, val: rangeData.maxValue, noDeno:true})}}</span>
				<span class="text nowrap" style="top:100%">{{$symbolPriceX({sid, val: rangeData.minValue, noDeno:true})}}</span>
			</div>
			<LoadingIcon v-if="isLoading" transparent="true"></LoadingIcon>
		</div>
		<div class="xAxis-time-ctn flex-row">
			<span class="text">{{parseTickTime(rangeFirstTick)}}</span>
			<span class="flex-1"/>
			<span class="text">{{parseTickTime(rangeLatestTick)}}</span>
		</div>
	</div>
</template>

<script>
import MiniKChartBase from '@/components/MiniKChartBase'

export default {
    mixins: [MiniKChartBase],
	props: ["suspend", "symbol", "ucid", "param", "subChart", "subIdcList", "propNk", "propCev", "model"],
	data() {
		return {
			canvasWidth: 0,
            canvasHeight: 0,
            DrawConfig: {
                upColor: '#D75442',
                dnColor: '#6BA583',
                stickColor: '#999999',
			},
            // 線圖原始資料
            chartData: {},
            // 線圖時間資料
            timeKeyList: [],
			rangeData: {},
			usuage: this.$store.state.Kchart.usuage.KBar = {drawCnt:0, drawCost:0, calcCnt:0, calcCost:0},
			displayCount: 0,
			perBarWidth: 1,
			perBarPadding: 1,
			isLoading: true,
		}
	},
	mounted() {
		this.gridCanvas = this.$refs.gridCanvas;
		let self = this;
		this.initSetting();
        if (!this.suspend && this.sid)
            M4C.ChartData.sub(this, this.sid, this.nk, this.subStartDay);
        // 收到即時/回補的線圖資料
        this.onChartData = (sid, chartData, timeKeyList, byRealTimeTick, queryErrCode) => {
            if (sid != self.sid) return;
            self.chartData = chartData;
            self.timeKeyList = timeKeyList;
            self.byRealTimeTick = byRealTimeTick;
            // 首次回補資料不足填滿畫面時，再回補一次。
            if(queryErrCode === 0 && !byRealTimeTick && timeKeyList.length < self.displayCount) {
                // 向核心取得當前 [商品,Nk] 的更多資料
                M4C.ChartData.getMore(self);
            }
            else {
				// 停止 LoadingIcon
            	this.isLoading = false;
				self.getRangeData();
				self.redraw();
			}
        };
        this.onChartError = (sid, errCode) => {
            // 此商品已經無更多資料
            if(errCode === -25)
                self.noData = true;
			// 時間區間無資料時持續回補舊資料
			if(errCode === -24) {
				// 向核心取得當前 [商品,Nk] 的更多資料
				M4C.ChartData.getMore(this);
			}
			// 非時間區間無資料才停止loading。
			if(errCode !== -24){
				// 停止 LoadingIcon
				this.isLoading = false;
			}
			// 有線圖資料時取資料並畫出k線
			if(this.timeKeyList.length) {
				self.getRangeData();
				self.redraw();
			}
        };
		setTimeout(()=>{
			self.drawGrid(self.$refs.gridCanvas, 4);
		});
	},
	beforeDestroy() {
		M4C.ChartData.unsub(this, this.sid, this.nk);
		// 回收gpu記憶體佔用量
		this.canvas.width = 0;
		this.canvas.height = 0;
		this.gridCanvas.width = 0;
		this.gridCanvas.height = 0;	
	},
	methods: {
		parseTickTime(tick) {
			if(tick && tick.timekey) {
				if(this.nk == 'd')
					return `${tick.timekey.substr(4,4).split('').join('')}`;
				else
					return `${tick.timekey.substr(8,2).split('').join('')}:${tick.timekey.substr(10,2).split('').join('')}`
			}
		},
		initSetting() {
			let ratio = this.$store.state.device.ratio;
			this.canvasWidth = this.$refs.lineCanvasCtn.clientWidth;
			// 取得畫布尺寸
			let width = this.$refs.lineCanvasCtn.clientWidth;
			let height = this.$refs.lineCanvasCtn.clientHeight;
			// 設定格線尺吋
			this.$refs.gridCanvas.style.width = width + 'px'; 
			this.$refs.gridCanvas.style.height = height + 'px'; 
			// 依ratio值調整寬高
			this.ratioWidth = this.$safeFloat(width * ratio);
			this.ratioHeight = this.$safeFloat(height * ratio);
			// 線圖元素
			this.canvas = this.$refs.canvas;
			// 最多可顯示kbar數量
			this.displayCount = parseInt(width/ (this.propsPerBarWidth + this.propsPerBarPadding));
		},
		getRangeData() {
			let t0 = new Date();
			if(!this.chartData) return;
			let curIdx = this.timeKeyList.length - 1;
			let _dataList = [];
			let max = Number.NEGATIVE_INFINITY;
			let min = Number.POSITIVE_INFINITY;
			let index = curIdx;
			// 取出當前畫面顯示根數
			while (_dataList.length < this.displayCount) {
				let tick = curIdx >= 0? this.chartData[this.timeKeyList[index]] || {}: {};
				tick.timekey = this.timeKeyList[index];
				_dataList.push(tick || {});
				// 範圍最大值
				max = tick && tick.h && (tick.h > max)? tick.h: max;
				// 範圍最小值
				min = tick && tick.l && (tick.l < min)? tick.l: min;
				index--;
			}
			// 加20%做極限
			let diff = this.$safeFloat((max - min) / 100 * 20);
			max = this.$safeFloat(max + diff);
			min = this.$safeFloat(min - diff);
			// 計算後沒有極限值時以0顯示
			max = max == Number.NEGATIVE_INFINITY? 0: max;
			min = min == Number.POSITIVE_INFINITY? 0: min;
			for(let i=0; i<4; i++) {
				_dataList.unshift({});
			}
			this.rangeData = {filterData: _dataList, maxValue: max, minValue: min};
			this.usuage.calcCnt++;
			this.usuage.calcCost += (new Date() - t0);
		},
		redraw() {
			let t0 = new Date();
			let idcData = this.rangeData;
			this.clearCanvas();
			this.resetCanvas();
			this.drawLine(idcData);
			this.usuage.drawCnt++;
			this.usuage.drawCost += (new Date() - t0);
		},
		resetCanvas(){
			let self = this;
			// 重設canvas資訊
			// 每根 Bar 寬度
            self.perBarWidth = self.propsPerBarWidth * self.ratio;
            // 每根 Bar Padding
            self.perBarPadding = self.propsPerBarPadding * self.ratio;
            // 包含 Padding 後的每根 Bar 寬度
            self.perBarTotalWidth = self.perBarWidth + self.perBarPadding;
            self.halfBarWidth = self.perBarWidth / 2;
            self.halfBarPadding = self.perBarPadding / 2;
            // 繪圖 canvas
            self.canvas = self.$refs.canvas;
            // 繪圖區域寬度
			self.canvasWidth = self.canvas.width;
			// 繪圖區域高度
			self.canvasHeight = self.canvas.height;
		},
		// 畫線/柱狀
        drawLine(idcData) {
            let self = this;
            let ctx = self.canvas.getContext('2d');
            let stickX, stickY, stickYTo;
            let baseX, baseY;
            let reverseDatas = idcData.filterData;
            let dataLength = reverseDatas.length;
            let skyPrice = self.skyPrice = idcData.maxValue;
            let groundPrice = self.groundPrice = idcData.minValue;
			let data = null;
			//根據ratio設定線的寬度
            ctx.lineWidth = 1 * self.ratio;

            // 位移0.5，讓系統決定畫在哪個 pixel 上
            ctx.translate(0.5, 0.5);
			
            for (let i = 0; i < dataLength; i++) {
				data = reverseDatas[i];
				if (!data) {
					console.error(`not get kbar data`);
					debugger
				}
                // 本 Tick 柱狀圖左上角 X
                baseX = self.canvasWidth - (i + 1) * self.perBarTotalWidth;
                baseX = baseX + self.halfBarPadding;//a

                // 最高價位置
                let highPricePosition = self.getPricePosition(data.h, skyPrice, groundPrice, true);
                // 最低價位置
                let lowPricePosition = self.getPricePosition(data.l, skyPrice, groundPrice, true);

                // 蠟燭線 X 位置
				stickX = Math.round(baseX + self.halfBarWidth);

                // 最高價 Y 位置
                stickY = Math.round(highPricePosition);
                // 最低價 Y 位置
                stickYTo = Math.round(lowPricePosition);
				// kbar高度小於1以1畫線
                stickYTo = stickYTo - stickY < 1? stickY + 1: stickYTo;

                // candle
                // 收盤價位置
                let closePricePosition = self.getPricePosition(data.c, skyPrice, groundPrice, true);
                // 開盤價位置
                let openPricePosition = self.getPricePosition(data.o, skyPrice, groundPrice, true);
                // 價格差異
                let positionDifference = openPricePosition - closePricePosition;

                // 左上角位置
                baseY = closePricePosition - 1;

                // 看不到的 bar 就不畫了
                if (baseX + self.perBarTotalWidth < 0) {
                    break;
                }

				// 根據漲跌決定顏色
				if ((data.c > data.o)) {
					ctx.fillStyle = this.isEng? self.DrawConfig.dnColor : self.DrawConfig.upColor;
					ctx.strokeStyle = this.isEng? self.DrawConfig.dnColor : self.DrawConfig.upColor;
				} else if(data.c == data.o) {
					//開收一樣(平盤用白色)
					ctx.fillStyle = "white";
					ctx.strokeStyle = "white";
				}
				else {
					ctx.fillStyle = this.isEng? self.DrawConfig.upColor : self.DrawConfig.dnColor;
					ctx.strokeStyle = this.isEng? self.DrawConfig.upColor : self.DrawConfig.dnColor;
				}

                // 畫矩形時如果高度為 0 時，會導致在「IE上畫不出東西」，所以必須限制最小px
                if (Math.abs(positionDifference) < 1) {
                    if (positionDifference < 0) {
                        positionDifference = -1;
                    } else {
                        positionDifference = 1;
                    }
                }

                // 避免kbar圖形出現「渲染」的效果，加上0.5px
                baseY += 0.5;

				ctx.beginPath();
				// 畫直線
                ctx.moveTo(stickX, stickY);
				ctx.lineTo(stickX, stickYTo);
				// barwidth小於2之後就沒必要畫短形了(線與矩形同顏色就沒區別)
				if(this.propsPerBarWidth > 1){
					// 畫矩形
					ctx.rect(Math.round(baseX),
						Math.round(baseY),
						Math.round(self.propsPerBarWidth * self.ratio),
						Math.round(positionDifference));
					ctx.fill();
				}
				ctx.stroke();
            }

            // 位移回來，不然畫面會一直往右下角偏
            ctx.translate(-0.5, -0.5);
		},
	},
	computed: {
		nk() {return this.propNk;},
		isEng() {return this.$store.getters.getLanguage == "en";},
		sid(){return this.symbol;},
        subStartDay() {return M4C.ChartData.getThumbStartDate(this.sid, this.nk);},
		propsPerBarWidth() {return 1;},
		propsPerBarPadding() {return 1;},
		rangeLatestTick() {if(this.rangeData.filterData) return this.rangeData.filterData[4];},
		rangeFirstTick() {if(this.rangeData.filterData) return this.rangeData.filterData.slice(-1)[0];},
		$symbolPriceX() {return this.$store.state.fn.$symbolPriceX;},
	},
	watch: {
		nk(nv, ov) {
			if(nv != ov){
				this.isLoading = true;
				this.clearCanvas();
				this.idcData = [];
				M4C.ChartData.unsub(this, this.sid, ov);
				M4C.ChartData.sub(this, this.sid, nv);
			}
		},
		suspend(nv) {
			if(nv)
				M4C.ChartData.unsub(this, this.sid, this.nk);
			else
				M4C.ChartData.sub(this, this.sid, this.nk);
		},
	},
}
</script>

<style>
.kbar-ctn{
	overflow: hidden;
}
.kbar-ctn .line-canvas-ctn {
	margin: 0 2px;
    border: 1px solid #666;
}
.kbar-ctn .idc-tick-info {
	position: absolute;
	top: 0;
	left: 4px;
}
.kbar-ctn .axis-label-ctn {
	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
	pointer-events: none;
}
.kbar-ctn .axis-label-ctn span {
	position: absolute;
    left: 3px;
    margin-top: -1em;
}
.xAxis-time-ctn {
	margin: 0 2px;
	min-height: 1.2em;
}
</style>