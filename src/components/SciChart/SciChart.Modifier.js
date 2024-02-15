import {ZoomPanModifier} from "scichart/Charting/ChartModifiers/ZoomPanModifier";
import {MouseWheelZoomModifier} from "scichart/Charting/ChartModifiers/MouseWheelZoomModifier";
import {ZoomExtentsModifier} from "scichart/Charting/ChartModifiers/ZoomExtentsModifier";
import {PinchZoomModifier} from "scichart/Charting/ChartModifiers/PinchZoomModifier";

export default {
	data: function () {
		return {
			modifierGroupId: "group1",
			zoomPanModifier: [],
		}
	},
	methods: {
		// 建立所有圖區 chartModifiers
		initModifier() {
			this.partitionList.forEach((obj, idx)=>{
				this.addModifiers(idx);
			});
		},
		// 建立chartModifier並加入scichart
		addModifiers(idx = 0){
			let sciChartSurface = this.sciObj[idx].sciChartSurface;
			this.zoomPanModifier[idx] = new ZoomPanModifier();
			// 擴增功能
			sciChartSurface.chartModifiers.add(
				this.zoomPanModifier[idx],
				new ZoomExtentsModifier(),
				new MouseWheelZoomModifier(),
				new PinchZoomModifier(),
			);
		},
		// 移除全部的 chartModifiers
		removeAllModifiers() {
			this.partitionList.forEach((obj, idx)=>{
				this.removeModifiers(idx);
			});
		},
		// 移除指定圖區的 chartModifiers
		removeModifiers(idx = 0) {
			let sciChartSurface = this.sciObj[idx].sciChartSurface;
			let count = sciChartSurface.chartModifiers.items.length;
			for(let i = 0; i < count; i++) {
				let obj = sciChartSurface.chartModifiers.items[0];		
				sciChartSurface.chartModifiers.remove(obj);
			}
		},
	},
	watch: {
		enablePan(nv) {
			this.partitionList.forEach((obj, idx)=>{
				this.zoomPanModifier[idx].isEnabled = this.enablePan;
			});
		}
	},
	computed: {
	}
}