<template>
	<div class="scitchart-plugin-priceline hidden" />
</template>
<script>
import { ELabelPlacement } from "scichart/types/LabelPlacement";
import { HorizontalLineAnnotation } from "scichart/Charting/Visuals/Annotations/HorizontalLineAnnotation";
import {ECoordinateMode} from "scichart/Charting/Visuals/Annotations/AnnotationBase";
export default {
	data() {
		return {
			priceLine: null,
		}
	},
	props: ['sciObj', 'sciCB', 'sid', 'mode', 'qo', 'eventCall'],
	beforeDestroy() {
		// 在sciChart移除現價標籤
		this.sciObj.sciChartSurface.annotations.remove(this.priceLine);
	},
	mounted() {
		// 建立現價標籤
		this.priceLine = this.createLine({isEditable: this.mode == 'order'});
		// 將現價標籤加到sciChart中
		this.sciObj.sciChartSurface.annotations.add(this.priceLine);
	},
	methods: {
		createLine(config = {}) {
			return new HorizontalLineAnnotation ({
				id: 'priceLine',
				labelValue: this.$symbolPriceX({sid: this.sid, val: this.qop, noDeno: true, fillDecimal: true}),
				showLabel: true,
				stroke: "gray",
				strokeDashArray: [3.0, 3.0],
				y1: this.qop,
				axisLabelFill: 'rgba(250,150,25,0.8)',//this.close > this.open? 'red': this.close == this.open? 'gray': 'green',
				isEditable: config.isEditable || false,
				dragOnLabel: true,
				dragOnLine:false,
				onDragStarted: (args) => {
					this.onTouchStart();
				},
				onDrag: (args) => {
					this.onTouchMove();
				},
				onDragEnded: (args) => {
					this.onTouchEnd();
				},
			});
		},
		removeLine() {
			// 在sciChart移除現價標籤
			this.sciObj.sciChartSurface.annotations.remove(this.priceLine);
		},
		fillDecimalLength(price) {
			return M4C.Symbol.fillDecimalLength(this.monthSid, price);
		},
		onTouchStart() {
			console.log('onTouchStart');
		},
		onTouchMove() {
			this.eventCall.touchmove();
			this.priceLine.y1 = this.qop;
		},
		onTouchEnd() {
			this.eventCall.touchend();
			this.priceLine.y1 = this.qop;
		},
	},
	watch: {
		// 現價變動時
		qop(nv) {
			if(this.priceLine){
				this.priceLine.y1 = nv;
				this.priceLine.labelValue = this.$symbolPriceX({sid: this.sid, val: this.qop, noDeno: true, fillDecimal: true});
			}
		},
	},
	computed: {
		// 當前商品的月份代碼
		monthSid() {return M4C.Symbol.toMonthSymbol(this.sid);},
		// 當前商品現價資料
		qop(){return this.qo.p || this.qo.r || this.qo.pc;},
		// 當前商品的高
		open(){return this.qo.o;},
		// 當前商品的收
		close(){return this.qo.c || this.qop;},
		$symbolPriceX() {return this.$store.state.fn.$symbolPriceX;},
	},
}
</script>