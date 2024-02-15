<template>
	<div class="scitchart-plugin-orderline hidden" />
</template>
<script>
import { ELabelPlacement } from "scichart/types/LabelPlacement";
import { HorizontalLineAnnotation } from "scichart/Charting/Visuals/Annotations/HorizontalLineAnnotation";
import {EHorizontalAnchorPoint, EVerticalAnchorPoint} from "scichart/types/AnchorPoint";
import { CustomAnnotation } from "scichart/Charting/Visuals/Annotations/CustomAnnotation";
import { TextAnnotation } from "scichart/Charting/Visuals/Annotations/TextAnnotation";
import {ECoordinateMode} from "scichart/Charting/Visuals/Annotations/AnnotationBase";
export default {
	data() {
		return {
			singleReportLine: {},
			workingList: [],
			OCOList: [],
			bgcBuy: "#D75442",
			bgcSell: "#6BA583",
			focusRptKey: '',
			warringAnnotation: null,
		}
	},
	props: ['sciObj', 'sid', 'mode'],
	beforeDestroy() {
		this.removeAllOrderReportAnnotations();
	},
	mounted() {
		this.availableReportList.forEach((rpt, idx)=>{
			// 複式權委託
			let isComposite = rpt.SYMBOL2;
			if(rpt.SYMBOL == this.monthSid && !rpt.$IS_OCO && rpt.$AVAILABLE_QTY && !isComposite) {
				this.workingList.push(rpt);
			}
			if(rpt.$IS_OCO && rpt.SMO.OCO[0].SYMBOL == this.monthSid) {
				this.OCOList.push(rpt);
			}
		});
		this.addAllOrderReportAnnotations();
	},
	methods: {
		// 移除所有委託標記
		removeAllOrderReportAnnotations(list = this.workingList) {
			list.forEach(rpt=> {
				if(this.singleReportLine[rpt.key])
					this.singleReportLine[rpt.key].forEach(obj=>{
						this.sciObj.sciChartSurface.annotations.remove(obj);
					});
				delete this.singleReportLine[rpt.key];
			});
		},
		// 加入所有委託標記
		addAllOrderReportAnnotations() {
			this.workingList.forEach(rpt=> {
				this.singleReportLine[rpt.key] = this.creatAnnotation(rpt);
				this.singleReportLine[rpt.key].forEach(obj=>{
					this.sciObj.sciChartSurface.annotations.add(obj);
				});
			});
		},
		// 取標籤價格
		getAnnotationPrice(rpt) {
			let price = Number(rpt.STOP_PRICE || 0) || Number(rpt.TOUCH_PRICE || 0) || Number(rpt.ORDER_PRICE);
			return price;
		},
		// 建立委託籤記
		creatAnnotation(rpt) {
			let reportBlock = new CustomAnnotation({
				id: `reportBlock_${rpt.key}`,
				x1: 0.2,
				xCoordinateMode: ECoordinateMode.Relative,
				y1: this.getAnnotationPrice(rpt),
				verticalAnchorPoint: EVerticalAnchorPoint.Center,
				horizontalAnchorPoint: EHorizontalAnchorPoint.Left,
				svgString: this.getArrowSVG(rpt),
				isEditable: this.mode == 'order'? true: false,
				onDragStarted: (args) => {
					this.onTouchStart(rpt.key);
				},
				onDrag: (args) => {
					this.onTouchMove(rpt.key);
				},
				onDragEnded: (args) => {
					this.onTouchEnd(rpt.key);
				},
			});
			let reportLine = new HorizontalLineAnnotation ({
				labelPlacement: ELabelPlacement.Axis,
				id: `reportLine_${rpt.key}`,
				showLabel: false,
				stroke: "gray",
				strokeDashArray: [3.0, 3.0],
				y1: this.getAnnotationPrice(rpt),
				axisLabelFill: '#642896',//rpt.SIDE == 'BUY'? 'red': 'green',
				x1: 0.4,
				xCoordinateMode: ECoordinateMode.Relative,
			});
			return [reportBlock, reportLine];
		},
		// 回報SVG TAG
		getArrowSVG(rpt) {
			let showPrice = this.showTickPrice(this.getAnnotationPrice(rpt));
			let isStyle2 = rpt.$AVAILABLE_QTY.toString().length + showPrice.length > 8;
			let style1 = `<text x="2" y="15" fill="black" font-size="12">
				${rpt.SIDE == 'BUY'? this.$ln('买'):this.$ln('卖')} ${rpt.$AVAILABLE_QTY}@${showPrice}
				</text>`;
			let style2 = `<text fill="black" font-size="10">
				<tspan x="2" y="10">${rpt.SIDE == 'BUY'? this.$ln('买'):this.$ln('卖')} ${rpt.$AVAILABLE_QTY}</tspan>
				<tspan x="2" y="22">@${showPrice}</tspan>
				</text>`;
			return [
				'<svg id="arrow_svg" xmlns="http://www.w3.org/2000/svg">',
				'<g transform="translate(20,0)">',
				'<polygon x="0" y="0" stroke="#4A90E2" stroke-width="0" fill="'+`${rpt.SIDE == 'BUY'?this.bgcBuy: this.bgcSell}`+'" points="0,24 -22,12 0,0"/>',
				'<rect width="80" height="24" rx="2" ry="2" y="0" fill="'+`${rpt.SIDE == 'BUY'?this.bgcBuy: this.bgcSell}`+'" />',
				`${isStyle2? style2: style1}`,
				"</g>",
				"</svg>"
			].join("");
		},
		// 依ticksize取價位
		convertPrice(price) {
			let ts = M4C.Symbol.getTickSize(this.monthSid, price);
			return this.$safeFloat(Math.round(price/ts) * ts);
		},
		// 重設回報annotation
		resetTag() {
			this.removeAllOrderReportAnnotations();
			this.addAllOrderReportAnnotations();
		},
		// 執行改價動作
		emitRepriceOrder(rKey, price) {
			let self = this;
			let record = this.workingList.find(rpt=>(rpt.key == rKey));
			let _param = {
				rpt: record, 
				action: "REPRICE",
				CB: () => {
					self.resetTag();
				}
			};
			if(record.$IS_SMO) {
				_param.modifyTrgPrice1 = price;
			}
			else {
				_param.modifyPrice = price;
			}
			if(record.$IS_OCO) {
				delete _param.modifyTrgPrice1;
				_param.modifyTrgPrice2 = price;
			}
			eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: 'OrderModify', param: _param});
		},
		createModifyAnnotation(rid, price) {
			return new TextAnnotation({
						id: `orderModify_${rid}`,
						x1: 0.8,
						xCoordinateMode: ECoordinateMode.Relative,
						y1: price,
						verticalAnchorPoint: EVerticalAnchorPoint.Bottom,
						horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
						text: `${this.$ln('改价')}`,
					});
		},
		onTouchStart(rKey) {
			// 設定標籤線在y軸顯示價格
			this.singleReportLine[rKey][1].showLabel = true,
			this.singleReportLine[rKey][1].labelValue = this.showTickPrice(this.singleReportLine[rKey][1].y1);
			this.singleReportLine[rKey][1].labelPlacement = ELabelPlacement.Axis;
			// 設定當前選取的委託單編號
			this.focusRptKey = rKey;
			this.$store.state.sciChartPlugin.curClick = `reportLine-${rKey}`;
		},
		onTouchMove(rKey) {
			// 固定annotation位置(x)不變
			this.singleReportLine[rKey][0].x1 = 0.2;
			this.singleReportLine[rKey][1].x1 = 0.3;
			// 調整線的位置
			this.singleReportLine[rKey][1].y1 = this.singleReportLine[rKey][0].y1;
			this.singleReportLine[rKey][1].labelValue = this.showTickPrice(this.singleReportLine[rKey][1].y1);
			// 調整改價文字位置(如果有的話)
			if(this.warringAnnotation)
				this.warringAnnotation.y1 = this.singleReportLine[rKey][1].y1;
			// console.log('sciChartPlugin order line',  this.warringAnnotation);
		},
		onTouchEnd(rKey) {
			// 調整線的位置
			let price = this.singleReportLine[rKey][1].y1 = this.singleReportLine[rKey][0].y1;
			this.singleReportLine[rKey][1].labelValue = this.showTickPrice(this.singleReportLine[rKey][1].y1);
			// 設定不顯示lable
			this.singleReportLine[rKey][1].showLabel = false;
			// 執行改價動作
			this.emitRepriceOrder(rKey, this.convertPrice(price));
			let self = this;
			setTimeout(() => {
				// 移除關注的回報id
				self.focusRptKey = '';
				self.$store.state.sciChartPlugin.curClick = null;
			}, 16);
		},
		showTickPrice(val) {
			if(isNaN(val)) return val;
			return this.$symbolPriceX({sid: this.sid, val, fillDecimal: true, noDeno: true});
		},
	},
	watch: {
		workingList(nv, ov) {
			if(this.sciObj && this.sciObj.sciChartSurface.annotations){
				if(ov.length) {
					this.removeAllOrderReportAnnotations(ov);
				}
				this.addAllOrderReportAnnotations();
			}
		},
		availableReportList: {
			handler(nv, ov) {
				this.workingList = [];
				this.OCOList = [];
				nv.forEach((rpt, idx)=>{
					if(rpt.SYMBOL == this.monthSid && !rpt.$IS_OCO && rpt.$AVAILABLE_QTY) {
						this.workingList.push(rpt);
					}
					if(rpt.$IS_OCO && rpt.SMO.OCO[0].SYMBOL == this.monthSid) {
						this.OCOList.push(rpt);
					}
				});
			},
			deep: true,
		},
		focusRptKey(nv, ov) {
			if(nv) {
				let price = this.singleReportLine[nv][0].y1;
				// 建立改價annotation
				this.warringAnnotation = this.createModifyAnnotation(nv, price);
				// 加入scichart
				this.sciObj.sciChartSurface.annotations.add(this.warringAnnotation);
			}
			else {
				if(this.warringAnnotation) {
					// 移除改價annotation
					this.sciObj.sciChartSurface.annotations.remove(this.warringAnnotation);
				}
			}
		},
	},
	computed: {
		// 有效委託清單
		availableReportList() { return this.$store.state.data.availableReportList;},
		// 商品月份代碼
		monthSid() {return M4C.Symbol.toMonthSymbol(this.sid);},
		$symbolPriceX() {return this.$store.state.fn.$symbolPriceX;},
	},
}
</script>