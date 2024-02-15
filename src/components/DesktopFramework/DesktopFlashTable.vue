<template>
	<div class="flash-table-ctn flex-row flex-1">
		<div class="flash-table-content flex-col flex-1 posr" ref="tableContent">
			<table class="desktop mw100p FULL" cellspacing="0"
				@mousewheel="onMousewheel" @touchstart="onTouchStart" @touchend="onTouchEnd" @touchmove="onTouchMove" >
				<!-- 標題列 -->
				<thead><tr class="clr-gray2">
					<th v-for="(hconf, hid) in headconf" class="nowrap pdlr2" :class="{'font-size-normal':largeSize}" :key="hid" :style="{'text-align': hconf.align || 'right'}">{{$ln(hconf.label)}}</th></tr>
				</thead>
				<!-- 表格內容 -->
				<tbody>
					<tr v-for="(row, rid) in showList" :key="rid">
						<td v-for="(obj, tid) in bconfig" :style="{'text-align': obj.align || 'right', 'min-height': rowH+'px', 'height': rowH+'px'}" :key="tid" @click="onCellClick(row[obj.key] || row)"
							class="nowrap pdtb1 pdlr2"
							:class="[`col-${obj.key || ''}`, `${obj.classKey ? _self[obj.classKey] : ''}`, obj.classFn && apendClass? obj.classFn(row[obj.key] || row, rid, showList):'',{'font-size-big font-bold':largeSize}]">
							{{obj.ctnFn? obj.ctnFn(row[obj.key] || row, rid, showList): _self[obj.key] || row[obj.key]}}
						</td>
					</tr>
					<!-- 無資料時稱高度用 -->
					<tr v-if="!showList.length"><td> </td></tr>
				</tbody>
			</table>
			<resize-observer @notify="onResize" v-if="isDesktop" />
		</div>
		<!-- 虛擬捲軸 -->
		<div class="flesh-table-scrollbar posr" v-show="list.length > maxRow">
			<div class="FULL overflow-y-auto" ref="virtualScroll" @scroll="onVirtualScroll" >
				<div class="flex-1 flex-col scrollBar-ctn" :style="{'height': barContent}">　</div>
			</div>
		</div>
	</div>
</template>
<script>
export default {
	data() {
		return {
			showIdx: 0,
			baseRowHeight: 30,
			maxRow: 0,
			hconfig: [],
			bconfig: [],
			rowCnt: 1,
			scrollTableIntval: "",
			preRowHeight: 30,			// 列高
			moveSensitivity: 1,			// 移動靈敏度(值越大越靈敏)
			maxtime: 48,				// 最高循環毫秒。
			friction: 0.75,				// 磨擦力係數。
			showList: [],
			apendClass: true,			// 是否上色(由於捲動時渲染變色會嚴重影響效能，所以加flag開關)
		}
	},
	props:["list", "status", "ignoreLogin", "headconf", "bodyconf", "rowHeight"],
	beforeMount() {
		// 指定設定。
		if(this.bodyconf) this.bconfig = this.bodyconf;
		if(this.headconf) this.hconfig = this.headconf;
		// 沒有內容設定時以標題設定為主。
		if(this.headconf && !this.bodyconf){
			this.bconfig = this.headconf;
		}
	},
	mounted() {
		// 最多可顯示幾列
		this.maxRow = Math.floor(this.$refs.tableContent.offsetHeight / this.rowH);
	},
	methods: {
		onResize() {
			this.maxRow = Math.floor(this.$refs.tableContent.offsetHeight / this.rowH);
		},
		onCellClick(cellObj){
			this.$emit('click', cellObj);
		},
		// 滾輪事件
		onMousewheel(e) {
			let self = this;
			let direction = e.deltaY < 0 ? 'up' : 'down';
			// 已經在最上面時候，如果還繼續往上捲可以不用處理。
			if (self.showIdx === 0 && direction === 'up')
				return;
			// 捲到最底時不再處理。
			if (self.showIdx + self.maxRow == this.list.length + 1 && direction === 'down') return;
			// 取得當前的資料陣列
			// self.currentDataList = self.currentDataList || self.baseCurrencyList;
			if (!self.showList || !self.showList.length)
				return
			this.updateIndex(direction === 'up' ? -1 : 1);
		},
		// 虛擬捲軸
		onVirtualScroll(e) {
			let self = this;
			let currentPos = e.currentTarget.scrollTop;
			self.showIdx = Math.ceil(currentPos / self.rowH);
		},
		// 更新索引
		updateIndex(diff) {
			let self = this;
			// 不需要捲動
			if(this.list.length < this.maxRow || !self.$refs.virtualScroll) return;
			// 增減列數
			let index = self.showIdx + diff * self.rowCnt;
			// 低於第一列就不再變動
			index = index > 0? index: 0;
			// 新的索引位置
			self.showIdx = index;
			// 捲軸移動
			self.$refs.virtualScroll.scrollTop = self.$safeFloat(self.showIdx * self.rowH);
			// 捲到第一列時取消漸停
			if(self.showIdx === 0) {
				this.cancelScrollTable();
			}
		},
		// 漸停捲動
		scrollTable(avgMove, time){
			let KE = Math.abs(avgMove);// 每1幀移動距離。
			let self = this;
			// 根據每1幀移動距離/bar寬*資料合併數量算出增減bar數
			let bars = Math.round(KE / this.preRowHeight) || 1;
			time = time && time < this.maxtime && bars == 1? time+=2 : time >= this.maxtime? this.maxtime: 16;
			let displayIndex = this.showIdx;
			this.cancelScrollTable();
			this.scrollTableIntval = setTimeout(() => {
				// 計算剩餘動能
				KE -= this.friction;
				let diff = avgMove > 0? bars: -bars;
				this.updateIndex(diff);
				// 還有剩餘動能且不是捲到極限時，重複漸停捲動。
				if(displayIndex != self.showIdx){
					displayIndex = self.showIdx;					
					let _KE = avgMove > 0? avgMove -= this.friction: avgMove += this.friction;
					self.scrollTable(_KE, time);
				}
				// 捲到極限時取消漸停捲動。
				else {
					self.apendClass = true;
					this.cancelScrollTable();
				}
				// 動能<0 取消漸停捲動
				if(KE < 0){
					self.apendClass = true;
					this.cancelScrollTable();
				}
			}, time);
		},
		// 取消漸停
		cancelScrollTable(){
			clearInterval(this.scrollTableIntval);
			this.scrollTableIntval = "";
		},
		onTouchStart(e) {
			// 起始事件
			let touch0 = e.targetTouches[0];
			// 依app或桌機取事件定位點
			let touch0X = this.isDesktop? touch0.offsetX: touch0.pageX;
			let touch0Y = this.isDesktop? touch0.offsetY: touch0.pageY;
			// 停止捲動
			this.cancelScrollTable();
			// 記錄最後的垂直位置
			this.lastY = touch0Y;
			// 點擊當下的座標
			this._startPoint = {x: touch0X, y: touch0Y};
			// 記錄移動的座標
			this._movePoint = {x: touch0X, y: touch0Y};
			// 記錄起始時間
			this._startTime = Date.now();
		},
		onTouchMove(e) {
			// 移動時不執行計算渲染樣式
			this.apendClass = false;
			let touch0 = e.targetTouches[0];
			let touch0X = this.isDesktop? touch0.offsetX: touch0.pageX;
			let touch0Y = this.isDesktop? touch0.offsetY: touch0.pageY;
			// 記錄移動的座標
			this._movePoint = {x: touch0X, y: touch0Y};
			// 記錄移動時間
			this._moveTime = Date.now();
			// 計算最後的垂直移動距離
			this.lastestMoveY = Math.abs(touch0Y - this.lastY);
			// 等比例移動
			let diffIdx = parseInt(this.$safeFloat((this.lastY - touch0Y) / this.preRowHeight * this.moveSensitivity));
			// 捲動超出一列時更新索引並更新最後的垂直位置
			if (Math.abs(diffIdx) != 0) {
				this.updateIndex(diffIdx);
				this.lastY = touch0Y;
			}
		},
		onTouchEnd(e) {
			// 總移動時間
			let moveTime = this._moveTime - this._startTime;
			// 總移動距離
			let moveRangey = this._startPoint.y - this._movePoint.y;
			// 平均移動速度
			let avgMove = this.$safeFloat(moveRangey / (moveTime/16));
			console.log("avgMove", avgMove, 'isRun', ((Date.now() - this._moveTime) < 300) && (this.lastestMoveY > (this.preRowHeight / 2)));
			console.log("avgMove date now", Date.now(), '_moveTime', this._moveTime, "moveRangey", moveRangey, "half row h", this.preRowHeight / 2);
			// 觸碰移動停頓不超過300ms且移動距離大於一半barwidth才執行漸停
			if(((Date.now() - this._moveTime) < 16) && (Math.abs(moveRangey) > (this.preRowHeight / 2))){
				// 執行漸停時也不計算渲染樣式
				this.apendClass = false;
				// 執行漸停
				this.scrollTable(avgMove);
			}
			// 捲動結束時計算渲染式
			else this.apendClass = true;
		},
	},
	computed: {
		largeSize(){ return this.$store.state.config.largeSize;},
		isDesktop() {return this.$store.state.device.isDesktop;},
		// 每列的列高
		rowH() {return this.rowHeight || this.baseRowHeight;},
		// 虛擬捲軸內容高度
		barContent(){return `${this.list.length * this.rowH}px`;},
	},
	watch: {
		// 當索引改變時更新顯示列表
		showIdx(nv) {
			// console.time('showlist time showIdx');
			let s = nv;
			let e = nv + this.maxRow;
			// console.log("showindex",s, e, this.list.length);
			let _list = [];
			// console.time('showlist time for showIdx');
			for(let i = s; i < e ; i++) {
				let tick = this.list[i];
				if(tick) 
					_list.push(tick);
				else 
					_list.push({});
			}
			// console.timeEnd('showlist time for showIdx');
			this.showList = _list;
			// console.timeEnd('showlist time showIdx');
		},
		list(nv, ov) {
			// 顯示最新資料
			if(nv.length && this.showIdx === 0){
				// console.time('showlist time');
				let s = this.showIdx;
				let e = this.showIdx + this.maxRow;
				let _list = [];
				// 取顯示範圍內的資料(不足補空物件)
				for(let i = s; i < e ; i++) {
					let aa = nv[i];
					if(aa) 
						_list.push(aa);
					else 
						_list.push({});
				}
				this.showList = _list;
				// console.timeEnd('showlist time');
			}
			else if(!nv.length) {
				// 列表清空重設index
				this.showIdx = 0;
				this.showList = [];
			}
		},
	}
}
</script>
<style scoped>
table {
	height: 100%;
	width: 100%;
}
.flash-table-content {
	overflow-x: auto;
	overflow-y: hidden;
}
.flesh-table-scrollbar, .scrollBar-ctn{
	width:10px;
}
</style>