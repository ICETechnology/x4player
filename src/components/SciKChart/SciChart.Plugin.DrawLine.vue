<template>
	
</template>
<script>
import { LineAnnotation } from "scichart/Charting/Visuals/Annotations/LineAnnotation";
import { VerticalLineAnnotation } from "scichart/Charting/Visuals/Annotations/VerticalLineAnnotation";
import { HorizontalLineAnnotation } from "scichart/Charting/Visuals/Annotations/HorizontalLineAnnotation";
import { ELabelPlacement } from "scichart/types/LabelPlacement";
export default {
	data() {
		return {}
	},
	props: ['sciObj', 'sciCB', 'sid'],
	mounted() {
		if(this.orgDrawLineData){
			this.addAllDrawLineAnnotations();
		}
	},
	beforeDestroy() {
		if(this.orgDrawLineData) {
			this.removeAllDrawLineAnnotations();
		}
		this.cleanEmptyData();
	},
	methods: {
		// 根據資料加入sciChart劃線的annotation
		addAllDrawLineAnnotations() {
			for(let i = 0; i < this.orgDrawLineData.length; i++){
				let obj = this.orgDrawLineData[i];
				if(obj.options.timeKey1)
					obj.options.x1 = this.getXByTimeKey(obj.options.timeKey1);
				if(obj.options.x2)
					obj.options.x2 = this.getXByTimeKey(obj.options.timeKey2);
				let annotation = this.createAnnotation(obj);
				this.sciObj.sciChartSurface.annotations.add(annotation);
			}
		},
		// 根據資料將sciChart劃線的annotation移除
		removeAllDrawLineAnnotations() {
			for(let i = 0; i < this.orgDrawLineData.length; i++){
				let obj = this.orgDrawLineData[i].options;
				let annotation = this.sciObj.sciChartSurface.annotations.items.find(item => (item.id == obj.id));
				this.sciObj.sciChartSurface.annotations.remove(annotation);
			}
		},
		// 根據type重建劃線的annotation
		createAnnotation(obj) {
			// 設定拖曳後處理的動作
			obj.options.onDragEnded = ()=>{this.onDragEnded(obj.options.id);};
			switch(obj.type) {
				case "RenderContextVerticalLineAnnotation":
					return new VerticalLineAnnotation (obj.options);
				case "RenderContextHorizontalLineAnnotation":
					return new HorizontalLineAnnotation(obj.options);
				case "RenderContextLineAnnotation":
					return new LineAnnotation(obj.options);
				default:
					break;
			}
		},
		// 移除當前商品全部畫線資料
		onRemoveLine() {
			if(this.orgDrawLineData) {
				this.removeAllDrawLineAnnotations();
				this.orgDrawLineData.splice(0);
			}
		},
		// 移除資料(空陣列)
		cleanEmptyData() {
			if(this.orgDrawLineData && !this.orgDrawLineData.length) {
				this.$delete(this.drawLineData, this.sidTag);
			}
		},
		// 拖曳後存儲位置資料
		onDragEnded(id) {
			// annotation資料
			let annotation = this.sciObj.sciChartSurface.annotations.items.find(obj=> obj.id==id);
			// 儲存的畫線資料
			let drawLineData = this.orgDrawLineData.find(obj=> obj.options.id == id);
			drawLineData.options.x1 = annotation.x1;
			drawLineData.options.y1 = annotation.y1;
			let options = annotation.toJSON().options;
			// 另外儲存timekey資料(因scichart的x位置是以當前xAxes資料的index計算，不是以timeky方式)。
			if(drawLineData.options.timeKey1)
				drawLineData.options.timeKey1 = this.getTimeKeyByindex(options.x1);
			// 有第二個點才處理
			if(drawLineData.options.x2){
				drawLineData.options.x2 = annotation.x2;
				drawLineData.options.y2 = annotation.y2;
				drawLineData.options.timeKey2 = this.getTimeKeyByindex(options.x2);
			}
		},
		// 建立斜線
		createSlashAnnotation() {
			let id = `slash_${"".random()}`;
			let slash = new LineAnnotation ({
				id: id,
				stroke: "white",
				strokeThickness: 2,
				x1: this.$safeFloat(this.halfX + this.oneOfFourX),
				x2: this.$safeFloat(this.halfX - this.oneOfFourX),
				y1: this.$safeFloat(this.halfY + this.oneOfFourY),
				y2: this.$safeFloat(this.halfY - this.oneOfFourY),
				isEditable: true,
				onDragEnded: (args) => {
					this.onDragEnded(id);
				},
			});
			this.sciObj.sciChartSurface.annotations.add(slash);
			if(!this.orgDrawLineData)
				this.$set(this.drawLineData, this.sidTag, []);
			let config = slash.toJSON();
			// 另外儲存timekey資料(因scichart的x位置是以當前xAxes資料的index計算，不是以timeky方式)。
			config.options.timeKey1 = this.getTimeKeyByindex(config.options.x1);
			config.options.timeKey2 = this.getTimeKeyByindex(config.options.x2);
			this.orgDrawLineData.push(config);
		},
		// 建立直線
		createStraightAnnotation() {
			let id= `straight_${"".random()}`;
			let straight = new VerticalLineAnnotation ({
				id: id,
				labelPlacement: ELabelPlacement.Axis,
				// showLabel: true,
				stroke: "white",
				strokeThickness: 2,
				x1: this.halfX,
				axisLabelFill: "blue",
				isEditable: true,
				onDragEnded: (args) => {
					this.onDragEnded(id);
				},
			});
			this.sciObj.sciChartSurface.annotations.add(straight);
			if(!this.orgDrawLineData)
				this.$set(this.drawLineData, this.sidTag, []);
			let config = straight.toJSON();
			// 另外儲存timekey資料(因scichart的x位置是以當前xAxes資料的index計算，不是以timeky方式)。
			config.options.timeKey1 = this.getTimeKeyByindex(config.options.x1);
			this.orgDrawLineData.push(config);
		},
		// 建立橫線
		createHorizontalAnnotation() {
			let id= `horizontal_${"".random()}`;
			let horizontal = new HorizontalLineAnnotation ({
				id: id,
				labelPlacement: ELabelPlacement.Axis,
				showLabel: true,
				stroke: "white",
				strokeThickness: 2,
				y1: this.halfY,
				axisLabelFill: "blue",
				isEditable: true,
				onDragEnded: (args) => {
					this.onDragEnded(id);
				},
			});
			this.sciObj.sciChartSurface.annotations.add(horizontal);
			if(!this.orgDrawLineData)
				this.$set(this.drawLineData, this.sidTag, []);
			this.orgDrawLineData.push(horizontal.toJSON());
		},
		// 取x位置by timeKey
		getXByTimeKey(timeKey) {
			let len = this.timeKeyList[0].length;
			let _timeKey = "";
			// any => 日k
			if(len == 8){
				_timeKey = timeKey.substr(0, len);
			}
			// 日k => any
			else if(timeKey.length == 8){
				let monthSymbol = M4C.Symbol.toMonthSymbol(this.sid);
				let closeTime = M4C.Symbol.getOpenCloseList(monthSymbol).slice(-1)[0].close;
				_timeKey = `${timeKey}${closeTime}`;
			}
			// 其他
			else {
				let ts = this.timeKeyToTimestamp(timeKey);
				let timeStamp = this.ms * Math.round(ts / this.ms);
				_timeKey = this.timestampToTimeKey(timeStamp);
			}
			return this.timeKeyList.indexOf(_timeKey);
		},
		// 以index取TimeKey
		getTimeKeyByindex(idx) {
			let timeKey = this.timeKeyList[Math.round(idx)];
				// 找不到時，回傳最新的timeKey
				timeKey = timeKey? timeKey: this.timeKeyList.slice(-1)[0];
			return timeKey;
		},
		// 依timeKey轉換timestamp
		timeKeyToTimestamp(s){
			let d = new Date();
			d.setFullYear(s.substr(0,4));
			d.setMonth(parseInt(s.substr(4,2))-1);
			d.setDate(s.substr(6,2));
			d.setHours(s.substr(8,2));
			d.setMinutes(s.substr(10,2));
			d.setSeconds(0);
			return d.getTime();
		},
		// 依timestamp轉timeKey
		timestampToTimeKey(s) {
			let d = new Date(s);
			return d.getFullYear() + 
				("0" + (d.getMonth()+1)).slice(-2) +
				("0" + d.getDate()).slice(-2) +
				("0" + d.getHours()).slice(-2) + 
				("0" + d.getMinutes()).slice(-2);
		},
	},
	computed: {
		// 組件名稱
		componentTag() {return this.$options._componentTag;},
		// 商品代碼 + 組件名稱
		sidTag() {return `${this.sid}#${this.componentTag}`},
		// vuex中存放的畫線資料
		drawLineData() {return this.$store.state.Kchart.drawLineData;},
		// 當前組件所有畫線資料
		orgDrawLineData() {return this.drawLineData[this.sidTag];},
		// 當前x中點
		halfX() {
			try{
				let max = this.sciObj.sciChartSurface.xAxes.items[0].visibleRange.max;
				let min = this.sciObj.sciChartSurface.xAxes.items[0].visibleRange.min;
				return this.$safeFloat(min + (max - min) / 2);
			}catch(e){};
		},
		// 1/4 x
		oneOfFourX() {
			try{
				let max = this.sciObj.sciChartSurface.xAxes.items[0].visibleRange.max;
				let min = this.sciObj.sciChartSurface.xAxes.items[0].visibleRange.min;
				return this.$safeFloat((max - min) / 4);
			}catch(e){};
		},
		// 當前y中點
		halfY() {
			try{
				let max = this.sciObj.sciChartSurface.yAxes.items[0].visibleRange.max;
				let min = this.sciObj.sciChartSurface.yAxes.items[0].visibleRange.min;
				return this.$safeFloat(min + (max - min) / 2);
			}catch(e){};
		},
		// 1/4 y
		oneOfFourY() {
			try{
				let max = this.sciObj.sciChartSurface.yAxes.items[0].visibleRange.max;
				let min = this.sciObj.sciChartSurface.yAxes.items[0].visibleRange.min;
				return this.$safeFloat((max - min) / 4);
			}catch(e){};
		},
		// 基本mini second
		ms() {
			let base = 60000; // 1分
			// 非分K的對應表
			let mMap = {d: 1440, w: 1440 * 7, m: 1440 * 30};
			// 取分K數
			let mm = isNaN(this.NK)? mMap[this.NK]: this.NK;
			return base * mm;
		},
		// 分K
		NK() {return this.$store.state.Kchart.NK;},
		// timeKeyList的索引值
		timeKeyListKey() {return `${this.sid},${this.NK}`;},
		// timeKeyList
		timeKeyList() {return M4C.SciChartData.timeKeyList[this.timeKeyListKey];},
	},
	watch: {},
}
</script>