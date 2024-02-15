<template>
	<div class="scitchart-plugin-position hidden" />
</template>
<script>
import { ELabelPlacement } from "scichart/types/LabelPlacement";
import { HorizontalLineAnnotation } from "scichart/Charting/Visuals/Annotations/HorizontalLineAnnotation";
import {EHorizontalAnchorPoint, EVerticalAnchorPoint} from "scichart/types/AnchorPoint";
import { CustomAnnotation } from "scichart/Charting/Visuals/Annotations/CustomAnnotation";
import {ECoordinateMode} from "scichart/Charting/Visuals/Annotations/AnnotationBase";
export default {
	data() {
		return {
			positionSumLine: null,
			positionSumBlock: null,
			upC: "#99000080",
			dnC: "#00990080",
			bgcBuy: "#C90C00",
			bgcSell: "#2F7C00",
		}
	},
	props: ['sciObj', 'sciCB', 'sid'],
	beforeDestroy() {
		this.removeAnnotaion();
	},
	mounted() {
		this.initAnnotation();
	},
	methods: {
		// 建立annotations
		initAnnotation() {
			this.createLine();
			this.sciObj.sciChartSurface.annotations.add(this.positionSumBlock);
			this.sciObj.sciChartSurface.annotations.add(this.positionSumLine);
		},
		// 移除annotations
		removeAnnotaion() {
			this.sciObj.sciChartSurface.annotations.remove(this.positionSumLine);
			this.sciObj.sciChartSurface.annotations.remove(this.positionSumBlock);
		},
		// 更新annotations
		updatePositionSumAnnotation() {
			// 移除annotations
			this.removeAnnotaion();
			// 重建annotations
			this.initAnnotation();
		},
		// 建立標籤
		createLine() {
			this.positionSumBlock = new CustomAnnotation({
				id: 'positionSumblock',
				x1: 0.2,
				xCoordinateMode: ECoordinateMode.Relative,
				y1: this.$BSAVG,
				verticalAnchorPoint: EVerticalAnchorPoint.Center,
				horizontalAnchorPoint: EHorizontalAnchorPoint.Left,
				svgString: this.getArrowSVG(),
			});
			// Horizontal line stretched across the viewport
			this.positionSumLine = new HorizontalLineAnnotation ({
				id: 'positionSumLine',
				labelPlacement: ELabelPlacement.Left,
				showLabel: true,
				labelValue: `　`,
				stroke: this.ssps.$NET_QTY > 0? 'red': 'green', // 'gray',
				strokeDashArray: [3.0, 3.0],
				y1: this.$BSAVG,
				x1: 0.4,
				xCoordinateMode: ECoordinateMode.Relative,
			});
		},
		// 取得svg標籤字串
		getArrowSVG() {
			let isStyle2 = this.ssps.$NET_QTY > 999 || this.ssps.$PL.toString().length > 5;
			let style1 = `<rect width="80" height="24" rx="2" ry="2" fill="${this.ssps.$NET_QTY>0?this.bgcBuy: this.bgcSell}" />
				<rect width="48" height="22" x="30" y="1" rx="1" ry="2" fill="#00000080" />
				<text x="0" y="15" fill="white" font-size="12">
				<tspan x="5">${this.ssps.$NET_QTY>0?'+':''}${this.ssps.$NET_QTY}</tspan>
				<tspan x="30" fill="${this.ssps.$PL>0?'red':'green'}">${this.ssps.$PL>0?'+':''}${this.ssps.$PL || 0}</tspan>
				</text>`;
			let style2 = `<rect width="80" height="24" rx="2" ry="2" fill="${this.ssps.$NET_QTY>0?this.bgcBuy: this.bgcSell}" />
				<rect width="80" height="12" y="12" fill="#00000080" />
				<text fill="white" font-size="12">
				<tspan x="5" y="10">${this.ssps.$NET_QTY>0?'+':''}${this.ssps.$NET_QTY}</tspan>
				<tspan x="5" y="22" fill="${this.ssps.$PL>0?'red':'green'}">${this.ssps.$PL>0?'+':''}${this.ssps.$PL || 0}</tspan>
				</text>`;
			return [
				'<svg id="arrow_svg" xmlns="http://www.w3.org/2000/svg">',
				'<g transform="translate(20,0)">',
				'<polygon x="0" y="0" stroke="#4A90E2" stroke-width="0" fill="'+`${this.ssps.$NET_QTY>0?this.bgcBuy: this.bgcSell}`+
				'" points="0,24 -20,12 0,0"/>',
				isStyle2? style2: style1,
				"</g>",
				"</svg>"
			].join("");
		},
	},
	watch: {
		// 持倉均價變動
		$BSAVG(nv) {
			if(this.positionSumLine){
				this.positionSumLine.y1 = nv;
			}
		},
		// 持倉更新時
		UPDATE_TIME(nv, ov) {
			// 更新整塊annotation
			this.updatePositionSumAnnotation();
		},
		// 持倉損益更新時
		$PL(nv, ov) {
			// 更新整塊annotation
			this.updatePositionSumAnnotation();
		},
		// 持倉變動
		ssps(nv, ov) {
			if(ov){
				this.sciObj.sciChartSurface.annotations.remove(this.positionSumLine);
				this.sciObj.sciChartSurface.annotations.remove(this.positionSumBlock);
			}
		},
	},
	computed: {
		// 當前商品持倉資料
		ssps() {return this.$store.state.selectedSymbol.positionSum;},
		// 當前商品持倉損益
		$PL() {
			try {
				return this.ssps.$PL;
			}catch (e) {};
		},
		// 當前商品持倉均價
		$BSAVG() {
			try {
				return this.ssps.$BSAVG;
			}catch (e) {};
		},
		UPDATE_TIME() {
			try {return this.ssps.UPDATE_TIME;}catch (e) {};
		},
	},
}
</script>
<style scoped>

</style>