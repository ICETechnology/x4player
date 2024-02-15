<template>
	<div class="scitchart-plugin-options hidden">
		<SciChartPluginDrawLine ref="SciChartPluginDrawLine" :sciObj="sciObj" :sid="sid" />
	</div>
</template>
<script>
import {EHorizontalAnchorPoint, EVerticalAnchorPoint} from "scichart/types/AnchorPoint";
import { CustomAnnotation } from "scichart/Charting/Visuals/Annotations/CustomAnnotation";
import {ECoordinateMode} from "scichart/Charting/Visuals/Annotations/AnnotationBase";
import {NumberRange} from "scichart/Core/NumberRange";
import KChartConfigSwitch from "@/components/KChart/KChart.Config.Switch.vue";
import SciChartPluginDrawLine from '@/components/SciKChart/SciChart.Plugin.DrawLine';
export default {
	data() {
		return {
			// 操作標示icon物件
			OptionIcon: null,
			// 操作物件清單
			OptionList: [],
			add_chart: "M6 9.99h2v7H6zm8 3h2v4h-2zm-4-6h2v10h-2zM20 7V4h-2v3h-3v2h3v3h2V9h3V7zm-2 12H4V5h12V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-5h-2v5z",
			close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
			cross: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
			replay: "M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z",
			zoom_out: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z",
			zoom_in: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z",
			delete_forever: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z",
			horizontal: "M19 13H5v-2h14v2z",
			slash: "M7 21L14.9 3H17L9.1 21H7Z",
			straight: "M11,3H13V21H11V3Z",
			// 是否展開清單
			isExpand: false,
			// 操作清單
			operatorItems: ['add_chart', 'cross', 'replay', 'zoom_out', 'zoom_in', 'delete_forever', 'horizontal', 'slash', 'straight'],
			// 拖曳起始記錄
			dragStart: {},
		}
	},
	components: {SciChartPluginDrawLine, KChartConfigSwitch},
	props: ['sciObj', 'sciCB', 'sid'],
	beforeDestroy() {
		this.removeOptionIcon();
		this.removeOptionList();
	},
	mounted() {
		this.createOptionIcon('add_chart');
		// 記錄線圖初始可視範圍(不需再計算)
		this.defaultXAxesVisiblerange = this.sciObj.sciChartSurface.xAxes.items[0].visibleRange;
		this.defaultYAxesVisiblerange = this.sciObj.sciChartSurface.yAxes.items[0].visibleRange;
	},
	methods: {
		executeOperator(item) {
			switch(item){
				// 圖形設定
				case 'add_chart':
					if(this.isDesktop)
						eventBus.$emit("POPUP-DIALOG", KChartConfigSwitch);
					else {
						// 目前橫置時在啟動設定ui時會因不明原因讓floatDialog也在點擊時收到click事件，導致無法正常叫出線圖設定，所以做延遲呼叫以避開這個情況。
						setTimeout(() => {
							eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: KChartConfigSwitch});	
						}, 16);						
					}
					break;
				// 十字線
				case 'cross':
					// 不使用eventBus方式是為了不無差別廣播，導致其他sciKChart也收到
					let sciChart = this.$parent.$parent.$refs.sciChart;
					// 設定十字線功能有效
					sciChart.disableCross = false;
					// 切換十字線
					sciChart.enableCross();
					break;
				// 放大
				case 'zoom_in':
					let zoomOutRange = new NumberRange(-0.1, -0.1);
					this.sciObj.sciChartSurface.xAxes.items[0].visibleRange = this.sciObj.sciChartSurface.xAxes.items[0].visibleRange.growBy(zoomOutRange);
					break;
				// 縮小
				case 'zoom_out':
					let zoomInRange = new NumberRange(0.1, 0.1);
					this.sciObj.sciChartSurface.xAxes.items[0].visibleRange = this.sciObj.sciChartSurface.xAxes.items[0].visibleRange.growBy(zoomInRange);
					break;
				// 重設
				case 'replay':
					this.sciObj.sciChartSurface.xAxes.items[0].visibleRange = this.defaultXAxesVisiblerange;
					this.sciObj.sciChartSurface.yAxes.items[0].visibleRange = this.defaultYAxesVisiblerange;					
					break;
				// 直線
				case 'straight':
					this.$refs.SciChartPluginDrawLine.createStraightAnnotation();
					break;
				// 橫線
				case 'horizontal':
					this.$refs.SciChartPluginDrawLine.createHorizontalAnnotation();
					break;
				// 斜線
				case 'slash':
					this.$refs.SciChartPluginDrawLine.createSlashAnnotation();
					break;
				// 清空畫線資料
				case 'delete_forever':
					this.$refs.SciChartPluginDrawLine.onRemoveLine();
					break;
				default:
					break;
			}
		},
		// 依名稱取得svg字串
		getIconSVG(iconName, name='icon') {
			return [
				`<svg id="${name}_svg_${iconName}" xmlns="http://www.w3.org/2000/svg">`,
				`<g transform="translate(0,0)">`,
				`<rect width="25" height="26" x="0" y="0" rx="5" ry="5" fill="${name=='icon'?'orange': '#FFFFFF'}" />`,
				`<path d="${this[iconName]}"/>`,
				`</g>`,
				`</svg>`,
			].join("");
		},
		// 建立操作標示icon
		createOptionIcon(iconName) {
			this.OptionIcon = new CustomAnnotation({
				id: 'OptionIcon',
				x1: 0.96,
				xCoordinateMode: ECoordinateMode.Relative,
				yCoordinateMode: ECoordinateMode.Relative,
				y1: 1,
				verticalAnchorPoint: EVerticalAnchorPoint.Bottom,
				horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
				svgString: this.getIconSVG(iconName, 'OptionIcon'),
				isEditable: true,
				isSelected: false,
				opacity:0.1,
				onDragStarted: (args) => {
					this.dragStart = {X:this.OptionIcon.x1, Y:this.OptionIcon.y1};
				},
				onDrag: (args) => {
					this.onOptionIconTouchMove();
				},
				onDragEnded: (args) => {
					// 點擊判斷，拖曳不超過5
					if(Math.abs(this.dragStart.X - this.OptionIcon.x1) < 5 && Math.abs(this.dragStart.Y - this.OptionIcon.y1) < 5) {
						this.isExpand = !this.isExpand;
						// 設定當前點擊的plugin
						this.$store.state.sciChartPlugin.curClick = iconName;
					}
					// 延遲清空當前點擊的plugin資料
					// 因sciChart annotation被點擊後，點擊其他非annotation會觸發onDragStarted所以只能在onDragEnded時設定參數及延遲移除參數處理
					let self = this;
					setTimeout(() => {
						self.$store.state.sciChartPlugin.curClick = null;
						self.OptionIcon.isSelected = false;
						self.OptionIcon.opacity = self.isExpand? 1: 0.1;
					}, 16);
				},
			});
			this.sciObj.sciChartSurface.annotations.add(this.OptionIcon);
		},
		updateOptionIcon(iconName) {
			this.removeOptionIcon();
			this.createOptionIcon(iconName);
		},
		// 移除操作標示icon
		removeOptionIcon(){
			this.sciObj.sciChartSurface.annotations.remove(this.OptionIcon);
		},
		// 建立操作清單
		createOptionList() {
			if(!this.OptionList.length) {
				this.operatorItems.forEach((iconName, idx)=> {
					this.OptionList.push(
						new CustomAnnotation({
							id: `icon_${idx}_${iconName}`,
							x1: this.otpIconPos - idx * this.iconPaddingRange,
							xCoordinateMode: ECoordinateMode.Relative,
							yCoordinateMode: ECoordinateMode.Relative,
							y1: 1,
							verticalAnchorPoint: EVerticalAnchorPoint.Bottom,
							horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
							svgString: this.getIconSVG(iconName),
							isEditable: true,
							onDragStarted: (args) => {
								this.dragStart = {X:event.clientX, Y:event.clientY};
							},
							onDrag: (args) => {
								this.onOptionTouchMove(idx);
							},
							onDragEnded: (args) => {
								// 點擊判斷，拖曳不超過5
								if(Math.abs(this.dragStart.X - event.clientX) < 5 && Math.abs(this.dragStart.Y - event.clientY) < 5) {
									console.log('onclick', iconName);
									// 執行操作
									this.executeOperator(iconName);
									// 設定當前點擊的plugin
									this.$store.state.sciChartPlugin.curClick = iconName;
									
								}
								// 延遲清空當前點擊的plugin資料
								let self = this;
								setTimeout(() => {
									self.$store.state.sciChartPlugin.curClick = null;
									self.OptionList[idx].isSelected = false;
								}, 16);
							},
						})
					);
				});
			}
			this.OptionList.forEach(obj=> {
				this.sciObj.sciChartSurface.annotations.add(obj);
			});
		},
		// 移除操作清單
		removeOptionList() {
			this.OptionList.forEach(obj=>{
				this.sciObj.sciChartSurface.annotations.remove(obj);
			});
		},
		onOptionTouchMove(idx) {
			// 設定固定位置
			this.OptionList[idx].x1 = this.otpIconPos - idx * this.iconPaddingRange;
			this.OptionList[idx].y1 = 1;
		},
		onOptionIconTouchMove(){
			// 設定固定位置
			this.OptionIcon.x1 = 0.96;
			this.OptionIcon.y1 = 1;
		},
	},
	watch: {
		// 是否展開操作清單
		isExpand(nv) {
			if(nv) {
				this.updateOptionIcon('close');
				this.createOptionList();
			}
			else {
				this.updateOptionIcon('add_chart');
				this.removeOptionList();
			}
		}
	},
	computed: {
		isDesktop() {return this.$store.state.device.isDesktop;},
		// 分K
		NK() {return this.$store.state.Kchart.NK;},
		// timeKeyList的索引值
		timeKeyListKey() {return `${this.sid},${this.NK}`;},
		// timeKeyList
		timeKeyList() {return M4C.SciChartData.timeKeyList[this.timeKeyListKey];},
		otpIconPos() {return this.isPortrait? 0.87: 0.92},
		iconPaddingRange() {return this.isPortrait? 0.092: 0.041},
		// 響應式轉向變數 (直向=true)
		isPortrait() {
			return this.$store.state.status.isPortrait;
		},
	},
}
</script>