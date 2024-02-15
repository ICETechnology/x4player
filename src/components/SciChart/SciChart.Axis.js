import {NumericAxis} from "scichart/Charting/Visuals/Axis/NumericAxis";
import {CategoryAxis} from "scichart/Charting/Visuals/Axis/CategoryAxis";
import {ENumericFormat} from "scichart/types/NumericFormat";
import {EAutoRange} from "scichart/types/AutoRange";
import {NumberRange} from "scichart/Core/NumberRange";
import {NumericTickProvider} from "scichart/Charting/Numerics/TickProviders/NumericTickProvider";
import {EAxisAlignment} from "scichart/types/AxisAlignment";
import { CentralAxesLayoutManager } from "scichart/Charting/LayoutManager/CentralAxesLayoutManager";
import { EInnerAxisPlacementCoordinateMode } from "scichart/Charting/LayoutManager/EInnerAxisPlacementCoordinateMode";
import {EHorizontalAnchorPoint, EVerticalAnchorPoint} from "scichart/types/AnchorPoint";
import { TextAnnotation } from "scichart/Charting/Visuals/Annotations/TextAnnotation";
import {ECoordinateMode} from "scichart/Charting/Visuals/Annotations/AnnotationBase";

export class CustomTickProvider extends NumericTickProvider {
	constructor(webAssemblyContext) {
		super();
		this.baseWeightMap = {d: 100000, w: 110000, m: 1000000, y: 10000000};
	}
	// Unix timestamp -> Date
	unixTimestampToDate(s) {
		return new Date((s - 28800) * 1000);
	}
	getMinorTicks(minorDelta, majorDelta, visibleRange) {
		return [];
	}
	// 加入日期標籤
	addDateLabelAnnotation(index, timeKey, prevTimeKey, showMonth) {
		// 向vuex取得分k的設定
		let nk = vue.$store.state.Kchart.NK;
		let weight = this.calcDateWeight(timeKey, prevTimeKey);
		let year = timeKey.substr(0,4);
		let month = timeKey.substr(4,2);
		let day = timeKey.substr(6,2);
		let baseWeight = this.baseWeightMap[nk] || 1000;
			// 有指定顯示月時以月的權重為主
			baseWeight = showMonth && baseWeight == 1000? this.baseWeightMap['d']: baseWeight;
		if(weight >= baseWeight) {
			let color = '';
			let opacity = 0;
			let showText = "";
			// 跨日
			if(weight >= 1000 && weight < 100000) {
				showText = month + '/' + day;
				color = '#FF6600', opacity = 0.4;
			}
			// 跨月
			else if(weight >= 100000 && weight < 1000000) {
				showText = Number(month) + '月';
				color = '#0066BB', opacity = 0.6;
			}
			// 跨年
			else if(weight >= 1000000) {
				showText = year;
				color = '#226644', opacity = 0.8;
			}
			return this.createDateLabelAnnotation(index, showText, color, opacity, weight, timeKey);
		}
	}
	// 移除日期標籤
	removeDateLabelAnnotations(sciSurfaceObj, annList) {
		// 移除日期標籤
		annList.forEach(ann=>{
			sciSurfaceObj.annotations.remove(ann);
		});
	}
	// 計算日期權重
	calcDateWeight(strTimeKey, prvStrTimeKey) {
		let weight = 0;
		if(!prvStrTimeKey) return 0;
		let year = strTimeKey.substr(0,4);
		let prevYear = prvStrTimeKey.substr(0,4);
		let month = strTimeKey.substr(4,2);
		let prevMonth = prvStrTimeKey.substr(4,2);
		let day = strTimeKey.substr(6,2);
		let time = strTimeKey.substr(10,2);
		let prevDay = prvStrTimeKey.substr(6,2);
		// 隔年
		if(year != prevYear) weight += 1000000;
		// 換月
		if(month != prevMonth) {
			weight += 100000;
			// 每季
			let seasonIdx = [1,4,7,10].indexOf(Number(month));
			if(seasonIdx != -1)
				weight+= 10000 * (seasonIdx + 1);
		}
		// 換日
		if(day != prevDay) {
			weight += 1000;
			// 同月換週或隔月次日。
			if(((Number(prevDay) + 1) !== Number(day) && (weight % 1000000 == 0)) || ((weight % 1000000 > 100000) && (Number(day) > 1)))
				weight += 100;						
		}
		// 60、30分k
		if(time == "00") weight += 60;
		if(time == "30") weight += 30;
		// 15分k
		if(time !== "00" && time !== "30" && (Number(time) % 15 == 0))
			weight += 15;
		return weight;
	}
	// 建立日期annotation
	createDateLabelAnnotation(x1, date, color, opacity, weight, timeKey) {
		return new TextAnnotation({
			// 以dateTextAnn當前綴，並以_分隔索引及日期權重。組成id
			id: `dateTextAnn_${timeKey}_${weight}`,
			x1: x1,
			y1: 1,
			yCoordinateMode: ECoordinateMode.Relative,
			verticalAnchorPoint: EVerticalAnchorPoint.Bottom,
			horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
			text: date,
			textColor: color,
			opacity: opacity,
		});
	}
	showDateLabelAnnotations(result, xValues, min, max) {
		let showMonth = result.length >= 3;
		let sciSurfaceObj = this.parentAxis.parentSurface;
		// 找出日期標籤
		let dateAnnList = sciSurfaceObj.annotations.items.filter(item => {
			// 日期id以_分隔，並且有dateTextAnn前綴，因此比對前綴來判斷是否為日期標籤。
			let info = item.id.split('_');
			return info[0] == "dateTextAnn";							
		});
		this.removeDateLabelAnnotations(sciSurfaceObj, dateAnnList);
		// 最低unix timestamp值
		let minTs = new Date("2000-1-1").getTime();
			minTs = Math.floor(minTs / 1000 + 28800);
		for (let i = min; i <= max; i++) {
			let xValue = xValues.get(i);
			let preXValue = xValues.get(i - 1);
			let uts = this.unixTimestampToDate(xValue);
			let preUts = this.unixTimestampToDate(preXValue);
			// 正常的日期才處理(大於2000年的unix timestamp且是正常日期)for前空幾根tick情境
			// 前空tick的xvalue經轉換後可能為1970年某月某日的unix timestamp或是Invalid Date
			if(xValue > minTs && preXValue > minTs && uts != "Invalid Date" && preUts != "Invalid Date"){
				let timeKey = `${uts.day8()}${uts.timeHHMM().replace(':', '')}`;
				let preTimeKey = `${preUts.day8()}${preUts.timeHHMM().replace(':', '')}`;
				let dateLabel = this.addDateLabelAnnotation(i, timeKey, preTimeKey, showMonth);
				if(dateLabel)
					sciSurfaceObj.annotations.add(dateLabel);
			}
		}
		// 找出日期標籤
		let annList = sciSurfaceObj.annotations.items.filter(item => {
			// 日期id以_分隔，並且有dateTextAnn前綴，因此比對前綴來判斷是否為日期標籤。
			let info = item.id.split('_');
			return info[0] == "dateTextAnn";							
		});
		let i = 1;
		// 處理日期標籤遮蔽顯示判斷
		if(annList.length > 1) {
			for(i; i < annList.length; i++){
				let item = annList[i];
				let j = i-1;
				// 如果前一個annotation被隱藏時，往前找沒被隱藏的annotation。
				if(annList[j].isHidden) {
					for(j; j > 0; j--) {
						if(annList[j] && i != j && !annList[j].isHidden)
							break;
					}					
				}
				let preItem = annList[j];
				let info = item.id.split('_');
				let weight = Number(info[2]);
				let preInfo = preItem.id.split('_');
				let preWeight = Number(preInfo[2]);
				// 由於sciChart計算相對位置時需帶入AxisCore的CoordinateCalculatorBase，因此從xAxes取得該method。
				// https://www.scichart.com/documentation/js/current/typedoc/classes/textannotation.html#getx1coordinate
				let sciCalculator = sciSurfaceObj.xAxes.items[0].getCurrentCoordinateCalculator();
				// 當前日期標籤定位點
				let itemPos = item.getX1Coordinate(sciCalculator, sciCalculator);
				// 前一日期標籤定位點
				let preItemPos = preItem.getX1Coordinate(sciCalculator, sciCalculator)
				// 前後標籤是否有互相遮蔽情形(35是文字預設寬度)
				let isCrossed = preItemPos + 35 > itemPos;
				// 當前日期標籤是否隱藏(當前權重小於等於前一權重且不是同一個日期標籤)
				item.isHidden = (isCrossed && (weight <= preWeight && info[1] != preInfo[1])) || (weight < 100000 && showMonth);
				// 前一個日期標籤是否隱藏(當前權重大於前一權重且不是同一個日期標籤)
				preItem.isHidden = (isCrossed && (weight > preWeight && info[1] != preInfo[1])) || (weight < 100000 && showMonth);
			}
		}
	}
	getMajorTicks(minorDelta, majorDelta, visibleRange) {
		let min = parseInt(visibleRange.min+1);
		let max = parseInt(visibleRange.max);
		min = min < 0 ? 0 : min;
		if (max === this.max && min === this.min)
			return this.majorTicks;
		this.max = max;
		this.min = min;
		let cnt = max - min;
		// console.log(`SciChart.Axis.getMajorTicks max: ${max}, min: ${min}, cnt: ${cnt}`);

		let result = [];
		let xValues = this.parentAxis.parentSurface.renderableSeries.items[0].dataSeries.getNativeXValues();
		// 加入跨日Tick
		this.crossDayQty = 0;
		for (let i=min; i<=max; i++) {
			if (i===0) continue;
			let lastUTS = xValues.get(i-1);
			let thisUTS = xValues.get(i);
			let lastDate = this.unixTimestampToDate(lastUTS);
			let thisDate = this.unixTimestampToDate(thisUTS);
			if (thisDate.getDate() !== lastDate.getDate() && thisDate.getTime() > lastDate.getTime())
				result.push(i);
		}
		// 依據跨日數量額外顯示日期標籤
		this.showDateLabelAnnotations(result, xValues, min, max);
		// 畫面內有兩個以上日期時直接結束 (不再顯示小時)
		if (result.length >= 3)
			return this.majorTicks = result;

		let stp = 5;
		if (cnt > 360)		stp = 120;
		else if (cnt > 180)	stp = 60;
		else if (cnt > 60)	stp = 30;
		else if (cnt > 30)	stp = 10;

		for (let i=min; i<=max; i++) {
			let val = xValues.get(i);
			if (!isNaN(val)) {
				let min = +Big(val).div(60);
				if (min % stp === 0)
					result.push(i);
			}
		}
		return this.majorTicks = result;
	}
}

export default {
	data: function () {
		return {
			xAxis: [],
			yAxis: [],
		}
	},
	methods: {
		// 建立 X,Y 軸
		initAxis() {
			// 逐分割區
			this.partitionList.forEach((obj, idx)=>{
				let sciChartSurface = this.sciObj[idx].sciChartSurface;
				let wasmContext = this.sciObj[idx].wasmContext;
				
				// X 軸 (為了要使用 CategoryAxis 必須等到資料回來才能作)
				const xAxis = this.xAxis[idx] = !this.noCustomXaxis? new CategoryAxis(wasmContext): new NumericAxis(wasmContext);
				// 客製化 tickProvider 來細緻化時間軸
				if(!this.noCustomXaxis)
					xAxis.tickProvider = new CustomTickProvider(wasmContext);
				sciChartSurface.xAxes.add(xAxis);
				// 固定只顯示第一個圖區的 X (時間)軸
				if (idx > 0) xAxis.isVisible = false;
				// X 軸 label
				if(!this.noCustomXaxis)
					xAxis.labelProvider.formatLabel = this.formatLabel;
				// X 軸 標籤樣式
				// xAxis.labelProvider.getLabelTexture = (labelText, textureManager, labelStyle)=>{
				// 	let customStyle = Object.assign({}, labelStyle);
				// 	if (labelText.indexOf(':') === -1)
				// 		customStyle.color = 'yellow';
				// 	return textureManager.createTextTexture([labelText], customStyle, this.rotationProperty);
				// };
				// 畫垂直子格線
				xAxis.drawMajorGridLines = this.param.drawMajorGridLinesX != null ? this.param.drawMajorGridLinesX : false;
				xAxis.drawMinorGridLines = this.param.drawMinorGridLinesX != null ? this.param.drawMinorGridLinesX : false;
				// 格塊背景
				xAxis.drawMajorBands = this.param.drawMajorBandsX != null ? this.param.drawMajorBandsX : false;
				
				// Y 軸
				let param = {
					labelFormat: ENumericFormat.Decimal,
					isInnerAxis: this.param.isInnerAxis==null ? true : this.param.isInnerAxis,
					axisAlignment: EAxisAlignment.Left,
				};
				// 因M4C.Symbol.getDecimalLength取長度會因tw的乘數、分數取到非預期長度，所以改以ticksize取長度
				let dcmLen = M4C.Symbol.getTickSize(this.sid, this.qo.p).toString().getDecimalLength();
				if (obj.labelPrecision) param.labelPrecision = obj.labelPrecision === 'DECIMAL_LENGTH' ? dcmLen : obj.labelPrecision;
				const yAxis = new NumericAxis(wasmContext, param);
				// 設定有指定額外處理Yaxis
				if (obj.formatLabelYAxis)
					yAxis.labelProvider.formatLabel = this.formatLabelYAxis;
				yAxis.autoRange = EAutoRange.Always;
				// 設定價格軸上下多加20%
				yAxis.growBy = new NumberRange(0.2, 0.2);
				// Y軸位置校正
				sciChartSurface.layoutManager.leftInnerAxesLayoutStrategy.coordinateMode = EInnerAxisPlacementCoordinateMode.Pixel;
				sciChartSurface.layoutManager.leftInnerAxesLayoutStrategy.axisPosition = -35;

				// 畫水平格線
				yAxis.drawMajorGridLines = this.param.drawMajorGridLinesY != null ? this.param.drawMajorGridLinesY : true;
				yAxis.drawMinorGridLines = this.param.drawMinorGridLinesY != null ? this.param.drawMinorGridLinesY : false;
				// 格塊背景
				yAxis.drawMajorBands = this.param.drawMajorBandsY != null ? this.param.drawMajorBandsY : false;
				sciChartSurface.yAxes.add(yAxis);
			});

			// Synchronize visible ranges
			this.xAxis.forEach((thisAxis, idx1)=>{
				thisAxis.visibleRangeChanged.subscribe((data)=>{
					this.xAxis.forEach((otherAxis, idx2)=>{
						if (idx2 !== idx1)
							otherAxis.visibleRange = data.visibleRange;
					});
				});
			});
		},
		// X 軸 Label 格式處理
		formatLabel(dataValue) {
			// 如果是非數字就不做日期轉換並回傳空字串
			if(isNaN(dataValue)) return '';
			let thisDate = this.unixTimestampToDate(dataValue);
			let thisTimeKey = this.dateToTimeKey(thisDate);
			// 日期長度不同時補0000(應該只有分k跨日會這樣)
			if(this.timeKeyList[0].length > thisTimeKey.length) {
				thisTimeKey += "0000";
			}
			// 向vuex取得分k的設定
			let nk = this.$store.state.Kchart.NK;
			let thisIndex = this.timeKeyList.indexOf(thisTimeKey);
			let prevTimeKey = this.timeKeyList[thisIndex-1];
			if (prevTimeKey) {
				let prevDate = this.timeKeyToDate(prevTimeKey);
				if (thisDate.getDate() !== prevDate.getDate())
					return thisDate.day5();
			}
			// 非分K只顯示日期
			if(isNaN(nk))
				return thisDate.day5();
			else
				return thisDate.timeHHMM();
		},
		formatLabelYAxis(dataValue) {
			let sid = this.$store.state.selectedSymbol.ID;
			return this.$store.state.fn.$symbolPriceX({sid, val: this.$safeFloat(dataValue), noDeno: true});
		},
	},
	watch: {
	},
	computed: {
	}
}