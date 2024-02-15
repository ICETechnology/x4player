import { ELabelPlacement } from "scichart/types/LabelPlacement";
import {LineAnnotation} from "scichart/Charting/Visuals/Annotations/LineAnnotation";
import { VerticalLineAnnotation } from "scichart/Charting/Visuals/Annotations/VerticalLineAnnotation";
import {ECoordinateMode} from "scichart/Charting/Visuals/Annotations/AnnotationBase";
import {EHorizontalAnchorPoint, EVerticalAnchorPoint} from "scichart/types/AnchorPoint";
export default {
  	data: function () {
		return {
			verticalLine: [],
		}
	},
	methods: {
		onCrossTouchMove({idx, e, hitTestInfo}) {
			let xValue = hitTestInfo.xCategoryValue;
			let curTimekey = this.unixTimestampToTimeKey(xValue);
			let lastTimekey = this.timeKeyList.slice(-1)[0];
			let tick = this.chartData[curTimekey];
			// 超出最新資料不處理
			if(!tick && Number(lastTimekey) < Number(curTimekey)) 
				return;
			// 送出當前關注Tick
			this.publishFocusTick({xValue, tick});
			// 定位與顯示垂直線
			this.displayVerticalLine({hitTestInfo});
		},
		// 首次建立垂直線
		createVerticalLine({hitTestInfo}) {
			let centerIndex = parseInt((this.xAxis[0].visibleRange.min + this.xAxis[0].visibleRange.max)/2);
			let xValue = hitTestInfo.xCategoryValue;
			this.partitionList.forEach((obj, idx)=>{
				let sciChartSurface = this.sciObj[idx].sciChartSurface;
				this.verticalLine[idx] = new VerticalLineAnnotation({
					labelPlacement: ELabelPlacement.Bottom,
					showLabel: idx===0,
					stroke: "SteelBlue",
					strokeThickness: 1,
					x1: centerIndex,
					axisLabelFill: "SteelBlue",
					axisFontSize: 14,
					labelValue: this.unixTimestampToDate(xValue).dayTime11(),
				}),
				sciChartSurface.annotations.add(this.verticalLine[idx]);
			});
		},
		// 定位與顯示垂直線
		displayVerticalLine({hitTestInfo}) {
			if (!this.verticalLine[0])
				return;
			let xValue = hitTestInfo.xCategoryValue;
			this.partitionList.forEach((obj, idx)=>{
				// this.verticalLine[idx].x1 = hitTestInfo.dataSeriesIndex;
				this.verticalLine[idx].x1 = hitTestInfo.xValue;
				if(xValue) {
					if(isNaN(this.$store.state.Kchart.NK))
						this.verticalLine[idx].labelValue = this.unixTimestampToDate(xValue).day5();
					else
						this.verticalLine[idx].labelValue = this.unixTimestampToDate(xValue).dayTime11();
				}
				else
					this.verticalLine[idx].labelValue = hitTestInfo.xValue;
				// this.verticalLine[idx].labelPlacement = ELabelPlacement.Bottom;
			});
		},
	},
	watch: {
		showCross(nv) {
			if (this.showCross)
				this.removeAllModifiers();
			else
				this.initModifier();
			// 首次建立垂直線
			if (this.showCross && !this.verticalLine[0])
				this.createVerticalLine({hitTestInfo: this.lastHitTestInfo});
			// 各圖區垂直線顯示/隱藏
			this.partitionList.forEach((obj, idx)=>{
				if(this.verticalLine[idx])
					this.verticalLine[idx].isHidden = !this.showCross;
			});
			// 顯示最後垂直線
			if (this.showCross && this.lastHitTestInfo) {
				this.displayVerticalLine({hitTestInfo: this.lastHitTestInfo});
			}
			// 更新focus資訊
			this.onCrossTouchMove({hitTestInfo: this.lastHitTestInfo});
		},
	},
	computed: {
		showCross() {
			return !this.disableCross && !this.enablePan;
		},
	}
}