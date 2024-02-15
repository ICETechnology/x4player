<template>
	<div class="scitchart-plugin-orderLine hidden" />
</template>
<script>
import { ELabelPlacement } from "scichart/types/LabelPlacement";
import { HorizontalLineAnnotation } from "scichart/Charting/Visuals/Annotations/HorizontalLineAnnotation";
import {EHorizontalAnchorPoint, EVerticalAnchorPoint} from "scichart/types/AnchorPoint";
import { TextAnnotation } from "scichart/Charting/Visuals/Annotations/TextAnnotation";
import {ECoordinateMode} from "scichart/Charting/Visuals/Annotations/AnnotationBase";
export default {
	data() {
		return {
			bgcBuy: "#D75442",
			bgcSell: "#6BA583",
			orderLine: null,
			orderWarring: null,
		}
	},
	props: ['sciObj', 'sid', 'qo'],
	beforeDestroy() {
		this.removeAnnotations();
	},
	mounted() {},
	methods: {
		// 移除委託標記
		removeAnnotations() {
			this.sciObj.sciChartSurface.annotations.remove(this.orderLine);
			this.sciObj.sciChartSurface.annotations.remove(this.orderWarring);
		},
		// 取委託價
		getPrice() {return this.qo.p || this.qo.r || this.qo.pc;},
		// 建立委託籤記
		creatAnnotation(e, yValue, marketOrder) {
			this.$store.state.order.orderType = marketOrder? "MARKET": "LIMIT";
			let price = yValue || this.getPrice();
			this.orderLine = new HorizontalLineAnnotation ({
				labelPlacement: this.isMarketOrder? ELabelPlacement.Right: ELabelPlacement.Axis,
				showLabel: true,
				labelValue: this.$symbolPriceX({sid: this.sid, val: price, noDeno: true, fillDecimal: true}),
				id: 'orderLine',
				stroke: "gray",
				strokeDashArray: [3.0, 3.0],
				y1: price,
				axisLabelFill: 'gray',
				x1: 1,
				xCoordinateMode: ECoordinateMode.Relative,
				isEditable: true,
			});
			this.orderWarring = new TextAnnotation({
						id: `orderWarring`,
						x1: 0.6,
						xCoordinateMode: ECoordinateMode.Relative,
						y1: price,
						verticalAnchorPoint: EVerticalAnchorPoint.Bottom,
						horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
						text: `${this.$ln(this.isMarketOrder?'市价':'委托')} ${this.orderQty}`,
					});
			this.sciObj.sciChartSurface.annotations.add(this.orderLine);
			this.sciObj.sciChartSurface.annotations.add(this.orderWarring);
		},
		// 依ticksize轉換價格
		convertPrice(price) {
			let ts = M4C.Symbol.getTickSize(this.monthSid, price);
			return this.$safeFloat(Math.round(price/ts) * ts);
		},
		// 彈出委託選擇
		emitOrder(){
			// 沒線圖資料不做處理
			// if(!Object.keys(this.idcData).length) return;
			let orderPrice = this.convertPrice(this.orderLine.y1);
			// 非市價單
			if(!this.isMarketOrder){
				eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: 'OrderSelect', param: {
					orderType: this.$store.state.order.orderType,
					orderPrice: orderPrice,
					orderQty: this.$defaultQty,
				}});
			}
			// 市價單
			if(this.isMarketOrder){
				let side = orderPrice > this.$qoPrice? "BUY": "SELL";
				this.sendMarketOrder(this.monthSid, side, this.$defaultQty);
			}
		},
		// 發市價委託
		sendMarketOrder(sid, side, qty){
			let orderInfo = {
					'ACTION': 'NEW',						// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
					'SYMBOL': sid,
					'SIDE': side,							// 買BUY/賣SELL
					'POSITION_EFFECT': 'OPEN',		// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
					'TC_ORDER_TYPE': 'MARKET',				// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
					'TIME_IN_FORCE': 'IOC',		// ROD/IOC/FOK
					'ORDER_PRICE': 0,
					'ORDER_QTY': qty,
				};
				if (this.$store.state.order.confirm){
					eventBus.$emit("CONFIRM-DIALOG", {
						title: `${ M4C.Symbol.getCNM4(sid)}`,
						content: `${this.$ln('市价')}, ${side === 'BUY'? this.$ln('买'): this.$ln('卖')} ${qty} ${this.$ln('手')}`,
						confirm: () => {
							M4C.Order.sendOrder(orderInfo);
						}
					});
				}
				else{
					M4C.Order.sendOrder(orderInfo);
				}
		},
		onTouchStart() {
			// console.log('order line on touch start');
		},
		onTouchMove(y) {
			if(this.orderLine){
				// 同步委託線annotation的位置
				this.orderWarring.y1 = this.orderLine.y1 = y;
				this.orderLine.x1 = 0.8;
				if(this.isMarketOrder) {
					this.orderLine.labelValue = y > this.$qoPrice? this.$ln('买'): this.$ln('卖');
					this.orderLine.axisLabelFill = y > this.$qoPrice? 'red': 'green';
				}
				else {
					this.orderLine.labelValue = this.$symbolPriceX({sid: this.sid, val: y, noDeno: true, fillDecimal: true});
				}
			}
		},
		onTouchEnd() {
			if(this.orderLine){
					this.emitOrder();
			}
		},
	},
	watch: {},
	computed: {
		// 商品月份代碼
		monthSid() {return M4C.Symbol.toMonthSymbol(this.sid);},
		orderQty() {return this.$store.state.Kchart.orderQty || 1},
		$qoPrice() {return this.qo.p || this.qo.r || this.qo.pc;},
		$defaultQty() {return this.$store.state.Kchart.orderQty || this.$store.getters.getDefaultQty || 1},
		isMarketOrder() {return this.$store.state.order.orderType === "MARKET"},
		$symbolPriceX() {return this.$store.state.fn.$symbolPriceX;},
	},
}
</script>