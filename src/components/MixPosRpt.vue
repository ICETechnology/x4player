<template>
	<div class="PR-mix-Wrapper posr flex-col" v-stop-propagation-y>
		<div class='content flex-1 flex-item' :class="{'float-content': isFloat, 'float-dn-content': !isFloat}">
			<div class="flex-1 flex-center FULL clr-gray" v-if="!reportList.length && !Object.keys(this.ssps).length">{{$ln(emptyText)}}</div>
			<div ref="record" class="flex-col flex-start flex-1 posr record-list-ctn" v-if="recordList.length" >
				<div class="FULL scroll-ctn flex-col">
					<span class="flex-col flex-center posr pb5" @click="isFloat = !isFloat" >
						<i class="material-icons md-18">{{isFloat ? `expand_more` : `expand_less`}}</i>
						<i class="material-icons md-18 icon2 flex-center">{{isFloat ? `expand_more` : `expand_less`}}</i>
					</span>
					<div ref="recordCtn" class="flex-row record-list x-scroll" v-press="onPress" @touchstart="onTouchStart" @touchend="onTouchEnd" @touchmove="onTouchMove">
						<RecordCard class="card" v-for="(rpt,key) in recordList" :key="key" :record="rpt" @touchstart="selectRC=rpt"></RecordCard>
						<RecordCard></RecordCard>
					</div>
				</div>
			</div>
			<span class="cancel-all-btn flex-center font-size-mini" v-if="reportList.length" @click="onCancelAll">{{$ln('全删')}}</span>
		</div>
	</div>
</template>
<script>
import FloatPopupWrapper from "@/components/Framework/FloatPopupWrapper.vue";
import RecordCard from "@/components/RecordCard.vue";
export default {
	props: ["emptyText"],
	data(){
		return {
			transClass:"",
			isFloat: false,
			reportListSum: [],
			reportList:[],
			positionList:[],
			recordList: [],
			selectRC: {}
		}
	},
	mounted(){
		this.reportListSum = this.$store.state.data.availableReportList;
	},
	methods: {
		onPress(event) {
			this.selectedCard = event.srcElement.closest('.card');
			// 卡片的座標
			let cardT = this.selectedCard.getBoundingClientRect().top;
			let cardL = this.selectedCard.getBoundingClientRect().left;
			// 卡片與點擊的差距
			this.diffY = this.startPoint.y - cardT;
			this.diffX = this.startPoint.x - cardL;
			// 新的卡片座標
			let _top = this.startPoint.y - this.diffY;
			let _left = this.startPoint.x - this.diffX;
			// 設定座標
			this.selectedCard.style.top = _top + 'px';
			this.selectedCard.style.left = _left + 'px';
			// 設定可移動樣式
			this.selectedCard.classList.add("move-able");
		},
		moveCard(x, y) {
			if(!this.selectedCard) return;
			let transform = this.selectedCard.style["-webkit-transform"].replace(/translate\(\D*\d+[^,]*,\D*\d+[^,]*\)\s*/g, '');
			this.selectedCard.style["-webkit-transform"] = transform + " translate(" + x + "px," + y + "px)";
			// 計算卡片新的座標
			// this.selectedCard.style.top = (y - this.diffY) +'px';
			// this.selectedCard.style.left = (x - this.diffX) + 'px';
		},
		// 刪單or平倉
		dropCard() {
			if(!this.selectedCard) return;
			let rpt = this.selectedCard.__vue__.record;
			if(rpt.$SIDE){
				M4C.Order.cancelOrderByReport([rpt]);
			}
			else{
				this.closeAll();
			}
		},
		onTouchStart(event) {
			// 停止冒泡以免連動影響QuoteInfo
			if(this.selectedCard) event.stopPropagation();
			let touch0 = event.targetTouches[0];
			// 點擊當下的座標
			this.startPoint = {x: touch0.pageX, y: touch0.pageY};
		},
		onTouchMove(event) {
			let touch0 = event.targetTouches[0];
			let moveX = touch0.pageX - this.startPoint.x;
			let moveY = touch0.pageY - this.startPoint.y;
			this.lastPoint = {x: touch0.pageX, y: touch0.pageY};
			if(this.selectedCard){
				// 停止冒泡以免連動影響QuoteInfo
				event.stopPropagation();
				this.moveCard(moveX, moveY);
			}
		},
		onTouchEnd() {
			if(!this.selectedCard) return;
			// 停止冒泡以免連動影響QuoteInfo
			event.stopPropagation();
			this.checkDropCard();
		},
		checkDropCard() {
			if(!this.selectedCard) return;
			if(!this.lastPoint){
				this.cleanSelectedCard();
				return;
			}
			// mixPosRpt區塊的上下限值
			let ctnTop = this.$refs.recordCtn.getBoundingClientRect().top;
			let ctnBtm = this.$refs.recordCtn.getBoundingClientRect().bottom;
			// 卡片移動超出區塊的上下限值時刪單或平倉。
			if((this.selectedCard.getBoundingClientRect().bottom < ctnTop) || (this.selectedCard.getBoundingClientRect().top > ctnBtm)){
				this.dropCard();
			}
			this.cleanSelectedCard();
		},
		cleanSelectedCard() {
			// 還原卡片的樣式
			this.selectedCard.classList.remove("move-able");
			this.selectedCard.style = "";
			// 移除物件
			delete this.selectedCard;
			delete this.lastPoint;
		},
		// 組合持倉、委託資料。
		concatRecord(){
			// 過濾該商品的有效委託資料。
			this.recordList = this.reportListSum.filter(rpt=> {
				let isMatch = false;
				if(rpt.$IS_OCO){
					isMatch = rpt.OCO[0].SYMBOL === this.$store.state.selectedSymbol.ID;
				}
				else
					isMatch = rpt.SYMBOL === this.$store.state.selectedSymbol.ID;
				// 複式權委託
				let isComposite = rpt.SYMBOL2;
				// 過濾買方回報
				return isMatch && !isComposite;
			});
			this.reportList = [];
			this.reportList = Object.assign(this.reportList, [], this.recordList);
			// 將持倉資料放到第一筆(如果有的話，且淨倉不為0)
			if(Object.keys(this.ssps).length && this.ssps.$NET_QTY)
				this.recordList.unshift(this.ssps);
		},
		// 平倉動作
		onCloseAll(){
			eventBus.$emit("CONFIRM-DIALOG", {
				title: `全平`,
				content: this.$ln(`确认要将{0} {1}全部平仓？`).format(this.$store.state.selectedSymbol.Name, this.$store.state.selectedSymbol.CIDM4),
				confirm: () => {
					this.closeAll();
				}
			});
		},
		// 送出平倉命令
		closeAll(){
			let record = this.ssps;
			let orderInfo = {
				'ACTION': 'NEW',						// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
				'SYMBOL': record.SYMBOL,
				'SIDE': record.$NET_QTY > 0 ? "SELL" : "BUY",							// 買BUY/賣SELL
				'POSITION_EFFECT': 'CLOSE',		// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
				'TC_ORDER_TYPE': 'MARKET',				// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
				'TIME_IN_FORCE': record.timeInForce || 'ROD',		// ROD/IOC/FOK
				'ORDER_PRICE': 0,
				'ORDER_QTY': parseFloat(record.$QTY),
				'AP_PLUGIN': this.useComName || this.selfComName,
			};
			M4C.Order.sendOrder(orderInfo);
		},
		// 全撤單動作。
		onCancelAll(){
			eventBus.$emit("CONFIRM-DIALOG", {
				title: `全撤`,
				content: this.$ln(`确认要取消{0} {1}全部委托？`).format(this.$store.state.selectedSymbol.Name, this.$store.state.selectedSymbol.CIDM4),
				confirm: () => {
					this.cancelAll();
				}
			});
		},
		// 送出全撤命令
		cancelAll(){
			for(let idx = 0; idx < this.reportList.length; idx++){
				let record = this.reportList[idx];
				let type = record.$SIDE? "report": "position";
				if(type === "report"){
					M4C.Order.cancelOrderByReport([record]);
				}
			}
		}
	},
	computed: {
		ssps() {
			// 有效淨倉手數>0 (改直接取核心處理的加值欄位判斷)
			if(Math.abs(this.$store.state.selectedSymbol.positionSum.$NET_QTY) != 0)
				return this.$store.state.selectedSymbol.positionSum;
			else
				return {};
		},
		getFloat(){
			return this.isFloat && this.reportList.length;
		},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
	},
	watch:{
		reportListSum(nv, ov){
			this.concatRecord();
		},
		ssps(){
			this.concatRecord();
		},
		recordList(nv, ov){
			// 沒有紀錄卡時就不浮出
			if(!nv.length && this.isFloat){
				this.isFloat = false;
			}
		},
		isFloat(nv, ov){
			let self = this;
			// 浮出時加入flex wrap(自動換行)
			if(nv && nv != ov){
				self.$refs.recordCtn.classList.add('record-list-y');
			}
			else{
				// 結束浮出動畫後移除flex wrap(自動換行)
				setTimeout(() => {
					if(!this.isFloat && nv != ov){
						self.$refs.recordCtn.classList.remove('record-list-y');
					}
				}, 300);
			}
		}
	},
	components: {
		RecordCard,
		FloatPopupWrapper
	}
}
</script>
<style scoped>
.PR-mix-Wrapper{
	/* min-height: 3em; */
	min-height: 5em;
}
.content{
	background-color: rgb(37, 52, 69);
	border-radius: 1vh;
	/* padding: 0 5px; */
}
.options{
	background-color: rgb(37, 52, 69);
}
.record-list-ctn{
	overflow: hidden;
}

.scroll-ctn {
	right: 3px;
}
.record-list{
	align-items: center;
	/* 為了不要看到縮小時第三筆 */
	margin-right: 4.5vw;
}
.card{
	/* margin:2px; */
	margin: 0 2vw 2vw 2vw;
}
.record-list-y{
	flex-wrap: wrap;
	align-content: flex-start;
}
.cancel-all-btn{
	position: absolute;
	right: 2.5vw;
	bottom: 2.5vw;
	width: 12vw;
	height: 12vw;
	border-radius: 6vw;
	color: white;
	background-color: #DE6461;
	box-shadow: 0px 0px 5px 0px rgba(222, 100, 97, 0.5);	
}
.x-scroll{
	overflow: auto;
	-webkit-overflow-scrolling: touch
}
.move-able{
	position: fixed;
	z-index: 1;
}
.move-able /deep/ .card-item {
	background-color: #034cd3;
}

.mg1vh{
	margin: 1vh;
}
.float-content{
	position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
	height: 45vw;
	transition: height 0.3s;
	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
}
.float-dn-content{
	position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
	height: 20vw;
	transition: height 0.3s;
	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	/* overflow: hidden; */
}
.opt-btn{
	height: 14vw;
	position: absolute;
	bottom: 5px;
    right: 0px;
    padding: 0px 4px;
}
.icon2 {
	top: 5px;
	position: absolute;
	margin:auto;
}
@media screen and (orientation: landscape) {
	.float-content{
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 45vh;
		transition: height 0.3s;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		overflow: hidden;
	}
	.float-dn-content{
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 12vh;
		transition: height 0.3s;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		overflow: hidden;
	}
	.opt-btn{
		height: 12vh;
		position: absolute;
		bottom: 5px;
		right: 5px;
	}
	.cancel-all-btn {
		background-color: black;
		border-radius: 3vh;
		width: 12vh;
		height: 10vh;
	}
}
@media screen and (max-height: 620px) {
	.float-dn-content{
		height: 16vw;
	}
	.PR-mix-Wrapper{
		margin: 0 2vw;
		min-height: 3em;
	}
	.PR-mix-Wrapper .card{
		margin: 0 1vw 1vw 1vw;
	}
	.PR-mix-Wrapper /deep/ .card-item-ctn {
		font-size: 0.5em;
		min-width: 33vw;
   		max-width: 33vw;
	}
	.PR-mix-Wrapper /deep/ .card-item-ctn, .PR-mix-Wrapper /deep/ .card-item, .PR-mix-Wrapper /deep/ .side-icon{
		height: 8vw;
		border-radius: 4vw;
	}
	.PR-mix-Wrapper /deep/ .side-icon{
		min-width: 8vw;
	}
	.cancel-all-btn {
		bottom:0;
	}
}
</style>