<template>
    <div class="tchart-ctn flex-col">
		<!-- 走勢圖區域 -->
		<div v-stop-propagation-touchmove class="flex-1 canvas-ctn posr" ref="lineCanvasCtn1" 
			@mousedown="onPanStart" @mouseup="onPanEnd" @mousemove="onPanMove" @mousewheel="onMouseWheel"
			@touchstart="onTouchStart" @touchend="onTouchEnd" @touchmove="onTouchMove">
			<div class="tickinfo-ctn flex-row flex-start font-size-mini clr-gray" v-if="!isThumbMode">
				<span>{{focus.time||"--"}}</span>
				<span class="flex-center ml5">{{$ln('价')}}{{focus.price||"-"}}</span>
				<span class="flex-center ml5" :style="{'color': 'yellow'}">{{$ln('均')}}{{focus.avg||"-"}}</span>
			</div>
			<canvas ref="gridCanvas1" class="grid-canvas" :width="canvasWidth" :height="canvasHeight1"></canvas>
			<canvas ref="canvas1" class="trend-canvas" :width="ratioWidth" :height="ratioHeight1"></canvas>
			<!-- 價格標籤 -->
			<div class="price-axis-label-ctn flex-col font-size-mini clr-gray">
				<span class="clr-up">{{skyPrice}}</span>
				<span class="flex-1"/>
				<span>{{qo.r}}</span>
				<span class="flex-1"/>
				<span class="clr-dn">{{groundPrice}}</span>
			</div>
			<!-- 漲跌幅標籤 -->
			<div class="chgrate-axis-label-ctn flex-col font-size-mini clr-gray">
				<span class="clr-up">{{changeRate}}%</span>
				<span class="flex-1"/>
				<span>0.00%</span>
				<span class="flex-1"/>
				<span class="clr-dn">{{changeRate}}%</span>
			</div>
			<!-- 十字線 -->
			<div class="cross-line" v-if="crossLineLeft>0" :style="{left: crossLineLeft + 'px'}"></div>
		</div>
		<!-- 縮放操作按鈕 -->
		<div class="posr">
			<div class="zoom-ctn flex-row flex-center font-size-mini clr-gray" v-if="!isThumbMode">
				<i class="material-icons mgr2 rd3 bgc-gray tcef" @click="onZoomIn">remove</i>
				<div class="pdlr2" />
				<i class="material-icons rd3 bgc-gray tcef" @click="onReset">reply</i>
				<div class="pdlr2" />
				<i class="material-icons mgl2 rd3 bgc-gray tcef" @click="onZoomOut">add</i>
			</div>
		</div>

		<!-- 時間標籤容器 -->
		<div class="time-ctn posr font-size-mini clr-gray">
			<div class="time-label" v-for="item in timeList" :style="{left: calcLeft(item.idx) + 'px'}">{{timeKeyToTimeLabel(item.timeKey)}}</div>
		</div>

		<!-- 量、vix值顯示區域 -->
		<div class="canvas-ctn volumn-canvas-ctn posr" ref="lineCanvasCtn2" :class="[combine?'combine':'']" v-show="mode != 'thumb'">
			<canvas ref="gridCanvas2" class="grid-canvas" :width="canvasWidth" :height="canvasHeight2" v-if="!combine"></canvas>
			<canvas ref="canvas2" class="volumn-canvas" :width="ratioWidth" :height="ratioHeight2"></canvas>
			<!-- 當前量、vix值 -->
			<div class="volume-axis-label-ctn flex-col font-size-mini clr-gray" v-if="!combine">
				<span v-if="subValue=='q'">{{$ln('量')}}:{{focus.qty}}</span>
				<span v-if="subValue=='vix'">{{vixKey}}:{{focus.vix ||'--'}}</span>
			</div>
			<!-- 量、vix最大值 -->
			<div class="max-volume-axis-label-ctn flex-col font-size-mini clr-gray" v-if="!combine">
				<span v-if="subValue=='q'">{{rangedMaxQ}}</span>
				<span v-if="subValue=='vix'">{{showRangedMaxVix}}</span>
			</div>
			<!-- 十字線 -->
			<div class="cross-line" v-if="crossLineLeft>0 && !combine" :style="{left: crossLineLeft + 'px'}"></div>
		</div>
		<!-- 量、vix切換 -->
		<radio v-model="subValue" class="switch-sub-btn rd1 pd2 ht1" v-if="showSubSwitch">
			<span value="q" class="switch-btn-q">{{$ln('成交量')}}</span>
			<span value="vix">{{$ln('隐含波动率')}}</span>
		</radio>
		<LoadingIcon v-if="isLoading"></LoadingIcon>
		<resize-observer @notify="onResize" v-if="$store.state.device.isDesktop" />
    </div>
</template>

<script>
import TChartBase from '@/components/TChartBase';
export default {
    mixins: [TChartBase],
	props: ["suspend", "combine", "param"],
	data() {
		return {
			qo: {},
			isLoading: true,
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
			// 區間最高價
			rangedHigh: 0,
			// 區間最低價
			rangedLow: Number.MAX_VALUE,
			// 區間最大單量
			rangedMaxQ: 0,
			rangedMaxVix: 0,
			rangedMinVix: 0,
			// 畫幾天
			dayCnt: parseInt(localStorage.getItem(`TChart.DayCnt`)) || 1,
			// 十字線的 left
			crossLineLeft: -100,
			// 當前指到的時間
			focus: {
				time: '',
				price: '',
			},
			// 時間標籤
			timeList: [],
			// 線圖資料
			chartData: [],
			dataMaxDay: 1,
			tchartNk: 1,
			subValue: 'q',
			rangedData: [],
			// 限制最多查多少交易日的資料
			limitDay: 7,
        }
	},
	beforeMount() {
		this.tchartNk = this.merge =  this.dayCnt = 1;

		// 收到即時/回補的線圖資料
		this.onChartData = (sid, chartData, timeKeyList, byRealTimeTick, errorcode, nk) => {
			let self = this;
			if (sid != this.sid) return;
			// 停止 LoadingIcon
			this.isLoading = false;
			// 線圖資料
			this.chartData = chartData;
			// 以時間格式組合出來的Array
			this.timeKeyList = timeKeyList;
			// 區間交易日列表 (依賴 this.chartData)
			if (this.rangedDateList === null)
				return;
			// 最新一筆的 timeKey
			this.latstTimeKey = this.timeKeyList[this.timeKeyList.length-1];
			// 最新一筆 tick
			this.latstTick = this.chartData[this.latstTimeKey];

			// 整張重畫
			// console.time("TChart.redraw");
			this.clearCanvas();
			this.redraw();
			// console.timeEnd("TChart.redraw");

			// 不在顯示十字線情境，顯示最新一筆資料
			if (this.crossLineLeft < 0) {
				this.displayTick(this.latstTick);
			}
		}
		this.onChartError = (sid, errCode) => {
			// 停止 LoadingIcon
			this.isLoading = false;
		};
		// 不支持VIX時，設定Q為預設顯示。
		if(this.notSupportedIdc && this.notSupportedIdc['VIX']) {
			this.subValue = 'q';
		}
	},
    mounted() {
		this.canvas1 = this.$refs.canvas1;
		this.canvas2 = this.$refs.canvas2;
		this.resizeCanvas();

		if (!this.suspend) {
			this.changeSymbol();
		}
		// 橫置時, 60ms後再重設canvas(處理橫置時，無法取得最後正確高度)
		if(!this.$store.state.status.isPortrait) {
			let self = this;
			setTimeout(() => {
				self.resizeCanvas();
			}, 60);
		}

		// 載入完成 -> 關掉轉向遮罩 (無轉向遮罩也無妨)
		setTimeout(()=>{eventBus.$emit("ROTATING-END");}, 300);
    },
	beforeDestroy() {
		M4C.ChartData.unsub(this, this.sid, this.tchartNk);
		this.resetData();
	},
	components: {
	},
    methods: {
		onReset() {
			this.dayCnt = 1;
		},
		onZoomIn() {
			this.perTickWidthChange(-1);
		},
		onZoomOut() {
			this.perTickWidthChange(1);
		},
		onResize() {
			if (!this.readyToDraw)
				return;
			let self = this;
			// 重設canvas寬高
			this.resizeCanvas();
			setTimeout(() => {
				// 延遲重畫。
				// self.redraw();	
			}, 20);			
		},
		// 區間交易日列表
		getRangedDateList(cnt) {
			// 開收盤時間
			let oc = M4C.Symbol.getOpenCloseTime(this.sid);
			if (oc === null) {
				this.$store.state.notify(`error`, `商品开收盘时间异常`);
				return null;
			}
			// 開盤日期時間
			let contractInfo = M4C.Symbol.getContractInfo(this.sid);
			let openDT = contractInfo ? new Date(contractInfo.TradingHours[0].open)
				: this.timeKeyToDate(`${this.qo.td}${oc.start}`);

			// 開盤時間 > 收盤時間 => 表示本商品為跨日商品 (香港期貨交易所) -> 需略過本日，直接找前一日的開盤時間 (避免已經超過當日的開盤時間時，會找到本日的開盤時間Data，導致異常)
			// let idx = oc.start > oc.close ? 1 : 0;
			let dateList = [];
			// 用開盤日期時間 逐日 往前找所有查詢日期看看有沒有資料
			for (let i=0; i<= this.dataMaxDay; i++) {
				let askDate = new Date(openDT.getTime() - i*24*60*60000 + this.tchartNk*60000);
				let timeKey = this.dateToTimeKey(askDate);
				// 該交易日(開盤時間)有資料
				if (this.chartData[timeKey]) {
					dateList.push(timeKey);
					cnt--;
				}
				// 已經達到指定的日數
				if (cnt === 0) {
					break;
				}
			}
			return dateList.reverse();
		},
		// 取得指定時間區間內的資料
		getRangedData(sid, chartData, timeKeyList) {
			let self = this;
			let sidx = timeKeyList.indexOf(this.rangedDateList[0]);
			// 以最後收盤時間計算
			let eidx = sidx!=0? sidx+this.rangedList.length-1: this.rangedList.length - 1;
			this.rangedData = [];
			this.rangedMaxVix = Number.NEGATIVE_INFINITY;
			this.rangedMinVix = Number.POSITIVE_INFINITY;
			for (let i = sidx; i <= eidx; i++) {
				let timeKey = timeKeyList[i];
				let tick = chartData[timeKey];
				if (tick) {
					let vix = tick[this.vixKey];
					// 統計區間最高/最低價
					this.rangedHigh = tick.h > this.rangedHigh ? tick.h : this.rangedHigh;
					this.rangedLow = tick.l < this.rangedLow ? tick.l : this.rangedLow;
					this.rangedMaxQ = tick.q > this.rangedMaxQ ? tick.q : this.rangedMaxQ;
					this.rangedMaxVix = vix && vix > this.rangedMaxVix ? vix : this.rangedMaxVix;
					this.rangedMinVix = vix && vix < this.rangedMinVix ? vix : this.rangedMinVix;
					tick.$c = tick.h > this.qo.r ? tick.h : tick.l;
					this.rangedData.push(tick);
				}
				// 沒有tick以空物件填入
				else this.rangedData.push({});
			}
			return this.rangedData;
		},
		// 取得指定時間區間內的成交均價資料
		getRangedAvgData(sid, chartData, timeKeyList) {
			let self = this;
			let sidx = timeKeyList.indexOf(this.rangedDateList[0]);
			let eidx = timeKeyList.length - 1;
			let rangedAvgData = [];
			for (let i = sidx; i <= eidx; i++) {
				let timeKey = timeKeyList[i];
				let tick = chartData[timeKey];
				let len = M4C.Symbol.getDecimalLength(sid, tick.c);
				let avg = 0;
				if(tick && i == sidx){
					avg = tick.$posAvgPrice = tick.c;
					// 初始化總量
					tick.$sumV = tick.q;
					rangedAvgData.push(avg);
					// this.chartData[timeKey].$AVG = avg;
				}
				if (tick && i > sidx) {
					// 均价线的计算公式：
					// =sum(每个价格*成交量）/sum（成交量）
					// =成交总额 /（成交总量）
					let preTick = chartData[timeKeyList[i - 1]];
					// 計算總量
					tick.$sumV = preTick.$sumV + tick.q;
					// 總量大於0時才計算。
					if(tick.$sumV){
						let preAvg = preTick.$posAvgPrice;
						let preSum = this.$safeFloat(preAvg * preTick.$sumV);
						// 取ticksize長度為小數位數
						avg = tick.$posAvgPrice = this.$safeFloat(((tick.c * tick.q) + preSum) / tick.$sumV, len+1);
					}
					else avg = tick.$posAvgPrice = 0;
					rangedAvgData.push(avg);

				}
				// 在chartData中加入均線資料。
				this.chartData[timeKey].$AVG = avg;
			}
			// 調整區間最高/最低價。
			let max = Math.max.apply(null, rangedAvgData);
			let min = Math.min.apply(null, rangedAvgData);
			if(max > this.rangedHigh) this.rangedHigh = max;
			if(min < this.rangedLow) this.rangedLow = min;
			return rangedAvgData;
		},
		// 取得指定時間區間內的 timeKey 列表
		getRangedList(sid) {
			let self = this;
			let rangedList = [];
			// 開收盤時間列表
			let ocList = M4C.Symbol.getOpenCloseList(sid);
			this.timeList = [];
			let nk = isNaN(this.tchartNk)? this.tchartNk == 'd'? 24 * 60: 30 * 24 * 60: this.tchartNk;
			this.rangedDateList.forEach((timeKey)=>{
				let d8 = timeKey.substr(0, 8);
				ocList.forEach((oc)=>{
					let timeKey1 = self.hhmmToTimeKey(d8, ocList[0].start, oc.start);
					let timeKey2 = self.hhmmToTimeKey(d8, ocList[0].start, oc.close);
					let date1 = self.timeKeyToDate(timeKey1);
					let date2 = self.timeKeyToDate(timeKey2);
					let diffCnt = parseInt(+Big(date2 - date1).div(nk).div(60000)) + 1;
					for (let i=0; i<diffCnt; i++) {
						let d = new Date(date1.getTime() + (i * nk * 60000));
						let timeKey = self.dateToTimeKey(d);
						let len = rangedList.push(timeKey);
						// 取得整數日時間，用以定位/製作時間標籤
						if (self.dayCnt == 1) {
							// 起始開盤時間與該時段有跨夜(ex:21:00~02:30)
							if(len === 1 || timeKey % 10000 === 0)
								this.timeList.push({'idx': len-1, 'timeKey': timeKey});
							// 非起始開盤時段是跨夜後(ex:21:00~23:00, 09:00~10:15)，以前一時段的日期跟當前日期判斷
							else if(this.timeList.length && (this.timeList.slice(-1)[0].timeKey.substr(0, 8) != timeKey.substr(0, 8)))
								this.timeList.push({'idx': len-1, 'timeKey': timeKey});
						}
						// 2天以上就只顯示線圖起始日期
						else if((len === 1) && self.dayCnt > 1)
							this.timeList.push({'idx': len-1, 'timeKey': timeKey});
						
					}
				});
			});
			return rangedList;
		},
		// 分析價格軸
		analysisPriceAxisInfo() {
			let qo = this.qo;
			if (!qo || !qo.r || this.rangedHigh == Number.NEGATIVE_INFINITY || this.rangedLow == Number.POSITIVE_INFINITY) return;
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
			let rangeHts = Math.ceil(this.rangedHigh / ticksize);
			let rangeLts = Math.ceil(this.rangedLow / ticksize);
			let diff20percent = Math.ceil(this.$safeFloat((this.rangedHigh - this.rangedLow) * 0.2 / ticksize));
			// 天地線價格
			this.skyPrice = this.$safeFloat((rangeHts + diff20percent) * ticksize);// +Big(qo.r).plus(diffPrice);
			this.groundPrice = this.$safeFloat((rangeLts - diff20percent) * ticksize);// +Big(qo.r).minus(diffPrice);
			// 天地價格區間
			this.priceRange = +Big(this.skyPrice).minus(this.groundPrice);
		},
		// 整張重畫
		redraw() {
			// 無市況或無chart data不處理。
			if(!this.timeKeyList || !this.qosn) return;
			// 總包含多少時間Tick的List (Array)
			this.rangedList = this.getRangedList(this.sid);
			// 每個 tick 可佔多少寬度
			// 截至目前為止有多少Tick的Data (Array)
			let rangedData = this.rangedData = this.getRangedData(this.sid, this.chartData, this.timeKeyList);
			// 每個 tick 可佔多少寬度
			let tickWidth = this.ratioWidth / rangedData.length;
			// 均價線資料。
			let avgRangeData = this.rangedAvgDataList;
			// 分析價格軸 (依賴 getRangedData)
			this.analysisPriceAxisInfo();
		
			// 走勢折線圖
			let ctx = this.canvas1.getContext('2d');
			ctx.beginPath();
			ctx.strokeStyle = this.priceLineColor;
			ctx.lineWidth = this.$store.state.device.isDesktop? 1: 3;
			// 量長條圖
			let ctx2 = this.canvas2.getContext('2d');
			ctx2.beginPath();
			ctx2.strokeStyle = this.volumeBarColor;
			ctx2.lineWidth = this.subValue == 'q'? 1: 1 * this.ratio;
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

				// 畫量長條圖
				let qY = (this.rangedMaxQ - tick.q) / this.rangedMaxQ * this.ratioHeight2;
				let vixY = this.ratioHeight2 * ((this.rangedMaxVix - tick[this.vixKey]) / (this.rangedMaxVix - this.rangedMinVix));
				offsetY = this.subValue=='q'? qY: vixY;
				if(this.subValue == 'q')
					ctx2.moveTo(offsetX, this.ratioHeight2);
				// 隱含波動率是折線圖，所以只要接前一根資料畫就好
				else if(this.subValue == 'vix' && i===0) {
					ctx2.moveTo(offsetX, offsetY);
					continue;
				}
				ctx2.lineTo(offsetX, offsetY);
				ctx2.stroke();
			}

			ctx.stroke();

			// 繪製漸層色
			ctx.lineTo(offsetX, this.ratioHeight1);
			ctx.lineTo(0, this.ratioHeight1);
			ctx.closePath();
			ctx2.closePath();

			// 均價折線圖
			ctx.beginPath();
			ctx.strokeStyle = "yellow";
			for(let j=0; j<len; j++){
				let price = avgRangeData[j];
				offsetX = parseInt(j * tickWidth);
				offsetX += 0.5;
				// 畫走勢折線圖
				let offsetY = (this.skyPrice - price) / this.priceRange * this.ratioHeight1;
				if (j === 0) {	// 移動到初始位置
					ctx.moveTo(offsetX, offsetY);
					continue;
				}
				ctx.lineTo(offsetX, offsetY);
			}
			ctx.stroke();
		},
		onPanStart(e) { 
            if(!e.targetTouches) e.targetTouches = [e];
            this.touchActive = true; 
            this.onTouchStart(e);
        },
        onPanEnd(e){
			if(!this.touchActive) return;
            if(!e.targetTouches) e.targetTouches = [e];
			this.touchActive = false;
			this.onTouchEnd(e);			
        },
        onPanMove(e){
			if(!this.touchActive) return;
			if(!e.targetTouches) e.targetTouches = [e];
			this.onTouchMove(e);
        },
		onTouchStart(event) {
			// 縮圖模式不執行
			if(this.isThumbMode) return;
			let touch0 = event.targetTouches[0];
			let touch0X = this.$store.state.device.isDesktop? touch0.offsetX: touch0.pageX;
			let touch0Y = this.$store.state.device.isDesktop? touch0.offsetY: touch0.pageY;
			let x = this.$store.state.device.isDesktop? touch0.offsetX: touch0.pageX;
			if (event.targetTouches.length===1) {
				this.displayTickByX(x- 3);
				// 點擊當下的座標
				this._startPoint = {x: touch0.offsetX, y: touch0.offsetY};
			}
			// 兩指情境：可能是縮放的開始，記下當前的兩指距離
			else if (event.targetTouches.length===2) {
				// 兩指情境下不出十字線
				this.crossLineLeft = -1;
				let touch1 = event.targetTouches[1];
				let touch1X = this.$store.state.device.isDesktop? touch1.offsetX: touch1.pageX;
				let touch1Y = this.$store.state.device.isDesktop? touch1.offsetY: touch1.pageY;
				this.lastDistance = parseInt(Math.hypot(touch1X - touch0X, touch1Y - touch0Y));
			}
		},
		onTouchEnd(event) {
			// 縮圖模式不執行
			if(this.isThumbMode) return;
			this.crossLineLeft = -100;
			this.displayTick(this.latstTick);
		},
		onTouchMove(event) {
			// 縮圖模式不執行
			if(this.isThumbMode) return;
			let touch0 = event.targetTouches[0];
			let x = this.$store.state.device.isDesktop? touch0.offsetX: touch0.pageX;
			if (event.targetTouches.length===1) {
				this.displayTickByX(x - 3);
			}	
		},
		onMouseWheel(data) {
			if(this.isThumbMode) return;
			// 桌機版滑鼠滾輪往上放大，往下縮小
			let increase = data.deltaY > 0 ? 1 : -1;
			this.perTickWidthChange(increase);
		},
		perTickWidthChange(cnt) {
			let count = this.dayCnt - cnt;
			this.dayCnt = count < 1? this.dayCnt: count > this.limitDay? this.limitDay: count;
		},
		displayTickByX(x) {
			this.crossLineLeft = x;
			let tickWidth = this.canvasWidth / this.rangedData.length;
			let tickIdx = Math.round(x / tickWidth);
			let tick = this.rangedData[tickIdx];
			this.displayTick(tick);
		},
		displayTick(tick) {
			tick = tick || this.latstTick;
			if(!tick) return;
			this.$set(this.focus, 'time', tick.d? this.tickToDisplayTime(tick):'--/-- --:--');
			this.$set(this.focus, 'price', M4C.Symbol.fillDecimalLength(this.sid, tick.c));
			this.$set(this.focus, 'qty', tick.q);
			this.$set(this.focus, 'avg', tick.$AVG);
			this.$set(this.focus, 'vix', tick[this.vixKey]);
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
			this.rangedLow = Number.POSITIVE_INFINITY;
			// 區間最大單量
			this.rangedMaxQ = 0;
			// 時間標籤
			this.timeList = [];
			// 線圖資料
			this.chartData = [];
			// 清空線圖
			this.canvas1.getContext('2d').clearRect(0, 0, 9000, 9000);
			if(this.canvas2)
			this.canvas2.getContext('2d').clearRect(0, 0, 9000, 9000);
		},
		// 計算該 idx 對應的 x 座標
		calcLeft: function(idx) {
			return Math.round(idx / this.rangedList.length * this.canvasWidth);
		},
		/** 切換連動商品 */
		changeSymbol(newSid, orgSid) {
			newSid = newSid || this.sid;
			this.isLoading = true;
			let dayCnt = this.isThumbMode? 1: this.dataMaxDay;
			let startDate = new Date(new Date() - dayCnt*24*60*60*1000).day8();
			// 清空資料
			this.resetData();
			// 更新市況
			this.qo = M4C.Quote.getQuoteObject(M4C.Symbol.toMonthSymbol(this.sid));
			// 訂閱
			if(this.tchartNk == "1") {
				// 調整改用merger中n個交易日查詢。
				M4C.ChartData.sub(this, this.sid, this.nk, null, null, 1);	
			}
			else
				M4C.ChartData.sub(this, newSid, this.tchartNk, null, null, dayCnt);
				// M4C.ChartData.sub(this, newSid, this.tchartNk, startDate);
			// 解訂閱
			if (orgSid)
				M4C.ChartData.unsub(this, orgSid, this.tchartNk);
		},
		zoomChart() {
			if(this.checkChangeNK()){
				// 重設極限
				this.rangedHigh = Number.NEGATIVE_INFINITY;
				this.rangedLow = Number.POSITIVE_INFINITY;
				// 清除與重畫
				this.clearCanvas();
				this.redraw();
			}
		},
		// 確認是否需要切換nk查新資料
		checkChangeNK() {
			const days = this.dayCnt;
			switch(true) {
				// 1分K只查5天，縮放改查別的分k資料。
				case (days < 2):
					if(this.tchartNk != "1") {
						// 解訂舊有的分k資料
						M4C.ChartData.unsub(this, this.sid, this.tchartNk);
						// 重設為1分k
						this.tchartNk = "1";
						// 最多查詢日數
						this.dataMaxDay = 1;
						// 回補及訂閱
						this.changeSymbol();
						// 回傳false以通知不需重畫(等回補資料時才重畫)
						return false;
					}
					break;
				// 以5分k處理7天以內的線圖，以優化重畫線圖花的時間。
				case (days > 1 && days <= 7):
					if(this.tchartNk != "5" || this.dataMaxDay != 7) {
						M4C.ChartData.unsub(this, this.sid, this.tchartNk);
						this.tchartNk = "5";
						this.dataMaxDay = 7;
						this.changeSymbol();
						return false;
					}
					break;
				// 以15分k處理14天以內的線圖，以優化重畫線圖花的時間。
				case (days > 7 && days < 14):
					if(this.tchartNk != "15" || this.dataMaxDay != 14) {
						M4C.ChartData.unsub(this, this.sid, this.tchartNk);
						this.tchartNk = "15";
						this.dataMaxDay = 14;
						this.changeSymbol();
						return false;
					}
					break;
				default:
					break;
			}
			return true;
		},
	},
	watch: {
		// 切換商品
		sid: function(nv, ov) {
			if (!this.suspend) {
				this.changeSymbol(nv, ov);
			}
		},
		// 顯示日數改變
		dayCnt: function(nv, ov) {
			if(this.timeKeyList){
				this.zoomChart();
			}
		},
		/** 啟用/停用 */
		suspend: function(nv, ov) {
			// 停用
			if (nv) {
				M4C.ChartData.unsub(this, this.sid, this.tchartNk);
			}
			// 啟用
			else {
				this.changeSymbol();
			}
		},
		subValue(nv, ov) {
			this.clearCanvas();
			this.redraw();
		},
		qosn(nv , ov) {
			if(nv){
				this.redraw();
			}
		},
	},
	computed: {
		mode() {if(this.param) return this.param.mode;},
		isThumbMode() {return this.mode === 'thumb'},
		propsSid() {if(this.param) return M4C.Symbol.toMonthSymbol(this.param.propsSid);},
		sid() {
			// 縮放時改熱門月取歷史資料。
			if(this.tchartNk == "1")
				return this.propsSid || this.$store.state.selectedSymbol.ID;
			else 
				return M4C.Symbol.toHotSymbol(this.propsSid) || M4C.Symbol.toHotSymbol(this.$store.state.selectedSymbol.ID);
		},
		changeRate: function() {
			return ((this.skyPrice - this.qo.r) / this.qo.r * 100).toFixed(2);
		},
		// 均價資料。
		rangedAvgDataList() {
			if(!this.rangedDateList.length) return [];
			let self = this;
			let sidx = this.timeKeyList.indexOf(this.rangedDateList[0]);
			let eidx = this.timeKeyList.length - 1;
			let rangedAvgData = [];
			let len = M4C.Symbol.getDecimalLength(this.sid, this.qo.p);
			for (let i = sidx; i <= eidx; i++) {
				let timeKey = this.timeKeyList[i];
				let tick = this.chartData[timeKey];
				let avg = 0;
				if(tick && i == sidx){
					avg = tick.$posAvgPrice = tick.c;
					// 初始化總量
					tick.$sumV = tick.q;
					rangedAvgData.push(avg);
					// this.chartData[timeKey].$AVG = avg;
				}
				if (tick && i > sidx) {
					// 均价线的计算公式：
					// =sum(每个价格*成交量）/sum（成交量）
					// =成交总额 /（成交总量）
					let preTick = this.chartData[this.timeKeyList[i - 1]];
					// 計算總量
					tick.$sumV = preTick.$sumV + tick.q;
					// 總量大於0時才計算。
					if(tick.$sumV){
						let preAvg = preTick.$posAvgPrice;
						let preSum = +Big(preAvg).times(preTick.$sumV);
						// 取ticksize長度為小數位數
						avg = tick.$posAvgPrice = +(Big(tick.c).times(tick.q).plus(preSum)).div(tick.$sumV).toFixed(len);
					}
					else avg = tick.$posAvgPrice = 0;
					rangedAvgData.push(avg);

				}
				// 在chartData中加入均線資料。
				this.chartData[timeKey].$AVG = avg;
			}
			// 調整區間最高/最低價。
			let max = Math.max.apply(null, rangedAvgData);
			let min = Math.min.apply(null, rangedAvgData);
			if(max > this.rangedHigh) this.rangedHigh = max;
			if(min < this.rangedLow) this.rangedLow = min;
			return rangedAvgData;
		},
		// 線圖資料
		rangedDateList () {
			let cnt = this.dayCnt;
			// 開收盤時間
			let oc = M4C.Symbol.getOpenCloseTime(this.sid);
			if (oc === null) {
				this.$store.state.notify(`error`, `商品开收盘时间异常`);
				return null;
			}
			// 開盤日期時間
			let contractInfo = M4C.Symbol.getContractInfo(M4C.Symbol.toMonthSymbol(this.sid));
			let openDT = contractInfo ? new Date(contractInfo.TradingHours[0].open)
				: this.timeKeyToDate(`${this.qo.td}${oc.start}`);

			// 開盤時間 > 收盤時間 => 表示本商品為跨日商品 (香港期貨交易所) -> 需略過本日，直接找前一日的開盤時間 (避免已經超過當日的開盤時間時，會找到本日的開盤時間Data，導致異常)
			// let idx = oc.start > oc.close ? 1 : 0;
			let dateList = [];
			// 依nk計算(目前只用到d跟m)
			let nk = isNaN(this.tchartNk)? this.tchartNk == 'd'? 24 * 60: 30 * 24 * 60: this.tchartNk;
			// 用開盤日期時間 逐日 往前找 20 天看看有沒有資料
			for (let i=0; i<20; i++) {
				let askDate = new Date(openDT.getTime() - i*24*60*60000 + nk*60000);
				let timeKey = this.dateToTimeKey(askDate);
				timeKey = isNaN(this.tchartNk)? timeKey.substr(0, 8): timeKey;
				// 該交易日(開盤時間)有資料
				if (this.chartData[timeKey]) {
					dateList.push(timeKey);
					cnt--;
				}
				// 已經達到指定的日數
				if (cnt === 0) {
					break;
				}
			}
			return dateList.reverse();
		},
		// 判斷是否有拿到行情資料
		qosn() {
			return this.qo.sn;
		},
		// 有行情資料、線圖資料、均價線資料時才重畫。
		readyToDraw() {
			return this.qosn && this.rangedDateList.length && this.rangedAvgDataList.length;
		},
		isOption() {return this.sid.split(".")[1] === "O";},
		vixKey() {return this.isOption? 'iv': 'vix'},
		/** 不支持的指標列表(By pdsetting) */
		notSupportedIdc(){
			return this.$store.state.config.quotePdSetting.function.hiddenIndicator ;
		},
		/** 顯示副圖切換列 */
		showSubSwitch() {
			// 縮圖及不支持vix指標(沒有不支持的指標列表或是vix不在不支持指標列表)時不顯示切換列。
			return !this.isThumbMode && (!this.notSupportedIdc || !this.notSupportedIdc['VIX']);
		},
		showRangedMaxVix() {
			if(this.rangedMaxVix !== Number.NEGATIVE_INFINITY)
				return this.rangedMaxVix;
			else return 'n/a';
		},
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
	/* background-color: #0E121A; */
}
.tchart-ctn canvas {
    position: absolute;
    top: 0;
    left: 0;
}
.tickinfo-ctn {
	position: absolute;
	top: 0;
	left: 60px;
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
	pointer-events: none;
}
.volume-axis-label-ctn {
	position: absolute;
	top: 0;
	left: 0;
}
.max-volume-axis-label-ctn {
	position: absolute;
	top: 0;
	right: 0;
}
.time-ctn {
	overflow: hidden;
	height: 20px;
}
.volumn-canvas-ctn {
	height: 30%;
}
/* 價量合併模式 */
.volumn-canvas-ctn.combine {
	position: absolute;
	left: 0;
	right: 0;
	border: 0;
	height: 50%;
	z-index: -1;
	/* 需與 .time-ctn 的 height 同步 */
	bottom: 20px;
}
.cross-line {
	position: absolute;
	top: 0;
	bottom: 0;
	background-color: gray;
	width: 1px;
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
.switch-sub-btn {
	color: gray;
}
.switch-sub-btn /deep/ .focus{
	background: none;
	color: orange;
}
.switch-btn-q {
	border-right: 1px solid gray;
}
.zoom-ctn {
	position: absolute;
	margin: auto;
	left: 0;
	right: 0;
	bottom: 0.5em;
}
@media screen and (orientation: landscape) {
	.switch-sub-btn {
		padding: 0px;
		height: 2em !important;
	}
}
</style>