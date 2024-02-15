<template>
    <div class="pl-chart-ctn flex-col">
		<div ref="canvasCtn" class="flex-1 canvas-ctn bgc-head posr">
			<canvas class="FULL" ref="canvas"/>
		</div>
		<div class="Prob-bar-ctn flex-row">
			<div v-for="(prob, key) in ProbList" :key="key" class="prob-bar posr flex-center" 
				:style="{'width': getProbWidth(key)+'%', 'background-color': getProbBGC(key)}">
				<span class="prob-value font-size-micro clr-gray">{{getProbValue(prob)}}</span>
			</div>
		</div>
		<div class="strike-ctn font-size-micro clr-gray">
			<!-- [轉折點] 與 [損益兩平點] 遮蔽問題未解決，因此先不顯示轉折點 -->
			<!-- <div class="posa turn-point" v-for="obj in turnPointList" :style="{left: `${obj.left}px`}">{{obj.text}}</div> -->
			<div class="posa break-even" ref="breakEvenLabel" v-for="(obj,i) in breakEvenList"
				:style="{left: `${obj.labelLeft}px`}">{{obj.text}}</div>
		</div>
		<PropCalulator :contracts="_Contracts" :list_bep_price="list_bep_price" ref="PropCalulator"/>
    </div>
</template>
<script>
import PropCalulator from '@/lib/PropCalculator';
export default {
	props: ["selectedStrategy", "contracts"],
	data() {
		return {
			/** 轉折點 */
			turnPointList: [],
			/** 損益兩平點 */
			breakEvenList: [],
			list_bep_price: [],
			PDFList: [],
			ProbList: [],
			PDFStrikeList:[],
			ProbGreen: '#74C580',
			ProbRed: '#FF8E89',
		}
	},
	beforeMount() {
	},
    mounted() {
		// 容器根節點
		this.canvasCtn = this.$refs.canvasCtn;
		// 畫布
		this.canvas = this.$refs.canvas;
		this.canvas.width = this.canvasCtn.clientWidth;
		this.canvas.height = this.canvasCtn.clientHeight;
		// 繪筆
		this.ctx = this.canvas.getContext('2d');
		// 預設元件可視
		this._visible = true;

		// this.updateData();
	},
	beforeDestroy() {},
	components: {PropCalulator},
    methods: {
		breakEvenLabelLeft(obj, i) {
			return obj.left - (this.$refs.breakEvenLabel ? this.$refs.breakEvenLabel[i].clientWidth/2 : 0);
		},
		updateData() {
			var self = this;
			if (!this.canvasCtn || !self.strategyName)
				return;
			if (!StrategyProfitLossCore._getStrategyInstance(self.strategyName))
				return;
			// 損益兩平點
			var breakEvenPoints = StrategyProfitLossCore.getBreakeven(self.strategyName).map(function (strike) {
				return {
					profit: 0,
					strike: strike,
					isBreakEven: true
				};
			});
			if (breakEvenPoints.length === 0)
				return;

			// 臨界點
			var criticalPoints = StrategyProfitLossCore.getCriticalPointList(self.strategyName);

			// 履約價格步進值
			var step = StrategyProfitLossCore.getStrikeStep(self.strategyName);

			var allCriticalPoints = breakEvenPoints.concat(criticalPoints).sort(function (point1, point2) {
				return point1.strike - point2.strike;
			});

			var middleStrike = allCriticalPoints[0].strike;
			var minStrike, maxStrike;
			var stepCount = 10;

			// 找出左右兩個虛擬位置
			if (allCriticalPoints.length > 1) {
				minStrike = allCriticalPoints[0].strike;
				maxStrike = allCriticalPoints[allCriticalPoints.length - 1].strike;

				let breakEvenPoints_start = allCriticalPoints[0].strike;
				let breakEvenPoints_end = allCriticalPoints[allCriticalPoints.length - 1].strike;
				let is_minStrike_probZero = false;
				let is_maxStrike_probZero = false;
				// 以10個履約價格步進值計算以取得最大、最小覆約價
				// 目前沒找到合適的計算公式，所以只能以迴圈方式找低於1%機率的覆約價方式訂出範圍
				for(let i = 0; i <= 100; i+=5) {
					minStrike = minStrike > 0? this.$safeFloat(breakEvenPoints_start - i * step): 0;
					// 最低覆約價為0或已找到機率<1%的覆約價時中斷迴圈
					if(minStrike === 0 || is_minStrike_probZero || is_maxStrike_probZero) break;
					maxStrike = this.$safeFloat(breakEvenPoints_end + i * step);
					let minProb, maxProb;
					// 最低覆約價機率大於1%時計算
					if(!is_minStrike_probZero)
						minProb = self.$refs.PropCalulator.CalcPDF(minStrike);
					// 最高覆約價機率大於1%時計算
					if(!is_maxStrike_probZero)
						maxProb = self.$refs.PropCalulator.CalcPDF(maxStrike);

					if(minProb < 0.01 && !is_minStrike_probZero) is_minStrike_probZero = true;
					if(maxProb < 0.01 && !is_maxStrike_probZero) is_maxStrike_probZero = true;
				}
				// console.log('plotorder chart minStrike, maxStrike', minStrike, maxStrike);
				middleStrike = Big(maxStrike).plus(minStrike).div(2);
				middleStrike = Big(middleStrike).div(step).round().times(step);

				var sectionLength = Math.max(
					middleStrike.minus(minStrike),
					Big(maxStrike).minus(middleStrike)
				);

				stepCount = Math.ceil(Big(sectionLength).div(step));
				stepCount = Math.max(stepCount, 10);
			} else {
				middleStrike = Big(middleStrike).div(step).round().times(step);
			}

			// 最左邊衍伸價格
			var leftMinStrike = middleStrike.minus(Big(step).times(stepCount));
			// 最右邊衍伸價格
			var rightMaxStrike = middleStrike.plus(Big(step).times(stepCount));
			let _minStrike = Number(leftMinStrike);//Number(this.strikeList[0]);
			let _maxStrike = Number(rightMaxStrike);//Number(this.strikeList.slice(-1)[0]);
			// 補入損益點
			allCriticalPoints.unshift(StrategyProfitLossCore.getProfitPoint(self.strategyName, _minStrike));
			allCriticalPoints.push(StrategyProfitLossCore.getProfitPoint(self.strategyName, _maxStrike));

			// normolize 繪圖資料
			var points = self._normalizePoints(
				allCriticalPoints
			);

			// normolize 損益兩平資料
			var normolizeBreakevenPoints = points.filter(function (item) {
				return item.isBreakEven;
			});

			this.PDFStrikeList = [];
			// 區分50個履約價
			let pointsQty = 49;
			let strikeScale = this.$safeFloat((_maxStrike - _minStrike) / pointsQty);
			for(let i = _minStrike; i <= _maxStrike;){
				this.PDFStrikeList.push(i);
				i = this.$safeFloat(strikeScale + i);
			}
			// console.log('PDFStrikeList is:', this.PDFStrikeList);
			// console.log('strikeList is:', this.strikeList);
			// console.log('point 0 of strike is:', points[0].strike);
			// console.log('point end of strike is:', points.slice(-1)[0].strike);
			// 計算機率
			this.ProbList = self.$refs.PropCalulator.CalcProb();
			this.PDFList = self.$refs.PropCalulator.CalcPDFList(this.PDFStrikeList);
			// console.log('ProbList is:', this.ProbList);
			// console.log('PDFList is:', this.PDFList);

			// 清除畫布
			self._clearDraw(self.ctx);

			// 繪圖
			self._updateDraw(self.ctx, points, normolizeBreakevenPoints);
		},

		/**
		 * 損益標準化
		 * @param  {Array<ProfitPoint>} profitList 損益資料
		 */
		_normalizePoints(profitList) {
			this.list_bep_price.splice(0);
			let self = this;
			// 價格軸極值
			var MAX_PROFIT = Math.max.apply(Math, profitList.map(function (point) {
				return Math.abs(point.profit);
			}));

			// 最小履約價格
			var MIN_STRIKE = profitList.reduce(function (value, item) {
				return value < item.strike ? value : item.strike;
			}, Number.POSITIVE_INFINITY);

			// 最大履約價格
			var MAX_STRIKE = profitList.reduce(function (value, item) {
				return value > item.strike ? value : item.strike;
			}, Number.NEGATIVE_INFINITY);

			// 履約價格範圍
			var RANGE = MAX_STRIKE - MIN_STRIKE;

			// normalize
			var points = profitList
				.sort(function (point1, point2) {
					return point1.strike - point2.strike;
				})
				.map(function (item) {
					if(!!item.isBreakEven) {
						self.list_bep_price.push(item.strike);
					}
					return {
						x: (item.strike - MIN_STRIKE) / RANGE,
						y: item.profit / MAX_PROFIT,
						strike: item.strike,
						isBreakEven: !!item.isBreakEven
					};
				}, []);

			return points;
		},

		/**
		 * 清除繪圖
		 * @param  {Object} ctx Canvas Context
		 */
		_clearDraw(ctx) {
			var width = ctx.canvas.width;
			var height = ctx.canvas.height;

			ctx.save();

			ctx.clearRect(0, 0, width + 1, height + 1);

			ctx.restore();
		},

		/**
		 * 更新繪圖
		 * @param  {Object} ctx Canvas Context
		 * @param  {Array<ProfitPoint>} points 損益資料
		 * @param  {Array<ProfitPoint>} breakevenPoints 損益兩平資料
		 */
		_updateDraw(ctx, points, breakevenPoints) {
			var self = this;

			var width = ctx.canvas.width;
			var height = ctx.canvas.height / 2;

			// 原點
			var orign = {
				x: 0,
				y: height
			};

			self._drawBackground(ctx, orign, width, height, points);

			self._drawMiddleLine(ctx, orign, width, height);

			self._drawProfitLine(ctx, orign, width, height, points);
			
			self._drawPDFPoint(ctx, orign, width, height, points);

			self._drawBreakevenPoint(ctx, orign, width, height, breakevenPoints);

		},

		/**
		 * 畫背景顏色
		 */
		_drawBackground(ctx, orign, width, height, points) {
			// 儲存當前狀態
			ctx.save();

			// 建立封閉路徑
			ctx.beginPath();

			ctx.strokeStyle = '#FFFFFF';

			ctx.lineTo(
				points[0].x * width + orign.x,
				-1 * points[0].y * height + orign.y
			);
			points.slice(1).map(function (point) {
				ctx.lineTo(
					point.x * width + orign.x,
					-1 * point.y * height + orign.y
				);
			});

			// 回到水平線
			ctx.lineTo(width, orign.y);

			// 回到原點
			ctx.lineTo(orign.x, orign.y);

			// 封閉路徑
			ctx.closePath();

			// 切割
			ctx.clip();

			// 上半部填滿紅色
			ctx.fillStyle = '#D0021B';
			ctx.fillRect(0, 0, width, height+0.5);

			// 下半部填滿綠色
			ctx.fillStyle = '#27AC1B';
			ctx.fillRect(0, height+0.5, width, height+0.5);

			// 恢復狀態
			ctx.restore();
		},

		/**
		 * 畫水平線
		 */
		_drawMiddleLine(ctx, orign, width, height) {
			// 儲存當前狀態
			ctx.save();

			// 建立封閉路徑
			ctx.beginPath();

			// 有支援 點現就使用點線
			if (typeof ctx.setLineDash === 'function') {
				ctx.setLineDash([5]);
			}

			// 畫筆設定
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 1;

			// 起點
			ctx.moveTo(orign.x, height+0.5);

			// 終點
			ctx.lineTo(orign.x + width, height+0.5);

			ctx.stroke();

			// 恢復狀態
			ctx.restore();
		},

		/**
		 * 畫損益線
		 */
		_drawProfitLine(ctx, orign, width, height, points) {
			var self = this;
			// 儲存當前狀態
			ctx.save();

			// 開始路徑
			ctx.beginPath();

			// 畫筆設定
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 1;

			// 起點
			var privisousPoint = points[0];
			ctx.moveTo(
				privisousPoint.x * width + orign.x,
				-1 * privisousPoint.y * height + orign.y
			);
			// 剩餘點
			self.turnPointList = [];
			points.slice(1).map(function (point, idx) {
				var xx = point.x * width + orign.x;
				ctx.lineTo(xx, -1 * point.y * height + orign.y);
				self.turnPointList.push({
					left: xx-25,
					text: point.strike,
				});
			});

			ctx.stroke();

			// 恢復狀態
			ctx.restore();
		},

		/**
		 * 畫損益兩平點
		 */
		_drawBreakevenPoint(ctx, orign, width, height, points) {
			var self = this;
			// 儲存當前狀態
			ctx.save();

			// 畫筆設定
			ctx.lineWidth = 0;

			self.breakEvenList = [];
			points.map(function (point, i) {
				var xx = parseInt(point.x * width + orign.x) + 0.5;
				var yy = parseInt(-1 * point.y * height + orign.y) + 0.5;
				// 外圈 (圓的外框)
				ctx.fillStyle = '#FFFFFF';
				ctx.beginPath();
				ctx.arc(xx, yy, 5, 0, 2 * Math.PI);
				ctx.fill();

				// 內圈
				ctx.fillStyle = '#FF9800';
				ctx.beginPath();
				ctx.arc(xx, yy, 4, 0, 2 * Math.PI);
				ctx.fill();

				// 垂直虛線 有支援 點現就使用點線
				if (typeof ctx.setLineDash === 'function') {
					ctx.setLineDash([5]);
				}
				ctx.beginPath();
				ctx.strokeStyle = '#FF9800';
				ctx.lineWidth = 1;
				ctx.moveTo(xx, yy + 6);
				ctx.lineTo(xx, yy + height);
				ctx.stroke();
				// 損益兩平點的標籤
				self.breakEvenList.push({
					left: xx,
					text: point.strike,
					labelLeft: null,
				});
				// (解決[轉折點標籤]可能跟[損益兩平點標籤]重疊的問題) -> 檢查所有轉折點標籤的位置，若跟損益兩平點標籤位置可能重疊，就隱藏掉
				// self.$strikeContainer.find('.turn-point').each(function(){
				// 	var diff = $(this).position().left - labelLeft;
				// 	if (Math.abs(diff) < labelWidth) {
				// 		$(this).hide();
				// 	}
				// });
			});

			// 恢復狀態
			ctx.restore();
		},
		_drawPDFPoint(ctx, orign, width, height, points) {
			var self = this;
			// 儲存當前狀態
			ctx.save();
			// 畫筆設定
			ctx.lineWidth = 0;
			self.breakEvenList = [];
			let pointQty = this.PDFList.length;
			let breakPoints = points.filter(p=>(p.isBreakEven));
			this.PDFList.map(function (prob, i) {
				var xx = self.$safeFloat((i / pointQty) * width + orign.x) + 0.5;
				var yy = self.$safeFloat((1 - prob) * (height * 2) );

				// 點
				ctx.fillStyle = 'gray';//'#FF9800';
				ctx.beginPath();
				ctx.arc(xx, yy, 1, 0, 1 * Math.PI);
				ctx.fill();
			});

			// 恢復狀態
			ctx.restore();
		},

		/**
		 * 擴展點
		 * @param  {ProfitPoint} start 起始點
		 * @param  {ProfitPoint} end 終止點
		 * @param  {Number} step 步進值
		 * @param  {Number} num 步進距離
		 * @return {ProfitPoint}
		 */
		_extendPoints(start, end, step, num) {
			var length = Big(end.strike).minus(start.strike);
			var sign = length.s;

			var unitLength = length.abs();
			var vector = {
				strike: +(Big(end.strike).minus(start.strike)).div(unitLength),
				profit: +(Big(end.profit).minus(start.profit)).div(unitLength)
			};

			var closeStrike = (Math.floor(end.strike / step) + (sign > 0 ? 1 : 0)) * step;
			var nextStrike = closeStrike + sign * step * (num - 1);

			if (nextStrike < 0) {
				nextStrike = 0;
			}

			var nextProfit = Big(start.profit).plus(
				(Big(start.strike).minus(nextStrike).abs()).times(
					vector.profit
				)
			);

			return {
				strike: nextStrike,
				profit: +nextProfit
			};
		},
		// 各機率bar的背景顏色
		getProbBGC(key){
			return this.selectedStrategy.colors[key]? this.ProbRed: this.ProbGreen;
		},
		// 各機率bar的寬度
		getProbWidth(key) {
			if(this.breakEvenList.length) {
				let endBreakEven = this.breakEvenList[key];
				// 當前圖形的總覆約價區間
				let strikeRange = this.PDFStrikeList.slice(-1)[0] - this.PDFStrikeList[0];
				// 判斷各個機率的覆約價區間
				let startStrike = this.breakEvenList[key - 1]?this.breakEvenList[key - 1].text: this.PDFStrikeList[0];
				let endStrike = endBreakEven? endBreakEven.text: this.PDFStrikeList.slice(-1)[0];
				// 以各個機率的覆約價區間計算佔當前整個圖形的履約價區間比率
				return this.$safeFloat((endStrike - startStrike) / strikeRange * 100);
			}
		},
		// 取區塊內計算後的機率資料(因有非預期的NaN所以在顯示時先做判斷，非數字時回空字串)
		getProbValue(v) {
			if(isNaN(v)) return "";
			return `${parseFloat(v * 100).toFixed(2)}%`;
		},
	},
	watch: {
		strategyName() {
			this.updateData();
		},
		profitLossResult() {
			this.updateData();
		},
		breakEvenList() {
			let self = this;
			// 損益兩平點改變 -> 由於需等文字填入以取得正確寬度，因此需要 delay
			setTimeout(()=>{
				self.breakEvenList.forEach((obj, i)=>{
					let minW = self.$refs.breakEvenLabel[i].clientWidth;
					let left = obj.left - minW/2;	// 損益位置扣掉一半文字寬度。
					obj.labelLeft = left;
					// 有兩個點以上
					if(i > 0) {
						// 兩點差異寬度
						let diff = left - self.breakEvenList[i - 1].labelLeft;
						// 超過文字寬度(重設兩點位置)
						if(diff < minW){
							self.breakEvenList[i - 1].labelLeft -= minW/2;	// 以前一損益點位置前顯示文字
							obj.labelLeft = obj.left;	// 以當前損益點位置後顯示文字
						}
					}
				});
			}, 10);
		},
	},
    computed: {
		strategyName() {
			return this.selectedStrategy.key;
		},
		profitLossResult() {
			return this.$store.state.opt.profitLossResult;
		},
		_Contracts() {
			return this.contracts['C'] || [];
		},
		// 履約價清單
		strikeList() {
			try {
				let list = []
				this._Contracts.forEach((strike, idx)=>{
					list.push(M4C.Option.getStrike(strike));
				});
				return list;
			}catch(e){ return [];}
		},
	},
}
</script>

<style scoped>
.pl-chart-ctn {
	margin: 1vw;
}
.strike-ctn {
	height: 3vw;
}
/* 損益兩平點 */
.break-even {
	
}
.low-strike {
	left: 0;
}
.high-strike {
	right: 0;
}
.Prob-bar-ctn {height: 0.5em;}
.prob-value {position: absolute; top: -1em;}
/** 桌機版 */
.desktop .pl-chart-ctn {
	margin: 0.2em;
}
.desktop .strike-ctn {
	height: 1em;
}
</style>