<template>
	<!-- 最外層容器，不會移動，佔滿FULL -->
	<div class="FULL overflow-hidden">
		<div ref="scroller" class="FULL scroll-bounce-ctn overflow-hidden" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd"
			:class="{transitionDuration: transitionDuration}" @scroll="onScroll" v-if="!$store.state.device.isDesktop">
			<!-- 有 refresh 參數時，下拉時所出現的圖示 -->
			<div v-if="refresh" ref="circle" class="reflash-circle flex-center" :class="{transitionDuration: transitionDuration}">
				<i class="material-icons md-30 refresh-icon" :style="{transform: `rotate(${translateY*2}deg)`}"
					:class="{light: approveRefresh}">refresh</i>
			</div>
			<!-- 資料內容 -->
			<slot></slot>
		</div>
		<!-- 桌機版 -->
		<div ref="scroller" class="FULL scroll-bounce-ctn overflow-hidden" @scroll="onScroll" v-if="$store.state.device.isDesktop">
			<!-- 資料內容 -->
			<slot></slot>
		</div>
	</div>
</template>

<script>
import anime from 'animejs/lib/anime.es.js';
export default {
	props: ["disable", "refresh", "slideRate", "status"],
	data() {
		return {
			/** Y 拉動超過這個數值才啟動 */
			diffYRange: 10,
			/** Y 拉動距離 */
			translateY: 0,
			/** 拉動比率 */
			divRate: 2,
			/** 動畫過場 */
			transitionDuration: true,
			/** 成立 refresh 需拉動距離 */
			approveRefreshDistance: 70,
			isPulling: false,
        }
	},
    methods:{
		onTouchStart(event) {
			if (this.isDisabled) return;
			let el = this.$refs.scroller;
			this.touchStartY =  event.targetTouches[0].pageY;
			this.atScrollTop = el.scrollTop === 0;
			this.atScrollBtm = Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 3;
			// 把當前的 relative viewport left 記下來
			this.rectLeft = this.$refs.scroller.getBoundingClientRect().left;
			// reset translateY
			this.translateY = 0;
			// 關閉漸變 (為了跟隨手指)
			this.transitionDuration = false;
		},
		onTouchMove(event) {
			if (this.isDisabled) return;
			// 防止左右 swipe 過程中，出現上下拉動的效果
			let elLeft = this.$refs.scroller.getBoundingClientRect().left;
			if (elLeft !== this.rectLeft) return;
			// 最頂端的 Overscroll Bounce 效果
			let thisY = event.targetTouches[0].pageY;
			if (this.atScrollTop) {
				let diffY = thisY - this.touchStartY;
				if (diffY > this.diffYRange) {
					// 利用 preventDefault 解決 iOS 原生拉動回彈效果可能導致閃爍的問題
					if (this.$store.state.device.isDeviceIOS) event.preventDefault();
					this.translateY = parseInt(diffY/this.divRate);
					this.pullDnElm.style.transform = `translate3d(0, ${this.translateY}px, 0)`;
					this.isPulling = true;
				}
			}
			// 最底部的 Overscroll Bounce 效果
			if (this.atScrollBtm) {
				let moveY = this.touchStartY - thisY;
				if (moveY > this.diffYRange) {
					// 利用 preventDefault 解決 iOS 原生拉動回彈效果可能導致閃爍的問題
					if (this.$store.state.device.isDeviceIOS) event.preventDefault();
					this.pullUpElm.style.transform = `translate3d(0, -${parseInt(moveY/this.divRate)}px, 0)`;
					this.isPulling = true;
				}
			}
		},
		onTouchEnd(event) {
			if (this.isDisabled) return;
			if (this.isPulling) {
				// 開啟漸變
				this.transitionDuration = true;
				// 歸位
				this.pullDnElm.style.transform = `translate3d(0, 0, 0)`;
				this.pullUpElm.style.transform = `translate3d(0, 0, 0)`;
				// 解除拉動中狀態
				delete this.isPulling;
				// 拉動至顯示完整 refresh-ctn 時才觸發 refresh 事件
				if (this.approveRefresh){
					this.$emit("refresh");
					eventBus.$emit("REFRESH");
				}
			}
		},
		onScroll(e) {
			let elm = e.srcElement;
			let scrollTop = elm.scrollTop;
			let offsetHeight = elm.offsetHeight;
			let scrollHeight = elm.scrollHeight;
			// 支持發送『捲到最底』的事件
			if (scrollTop + offsetHeight > scrollHeight - 10)
				this.$emit('scrollReachBottom');
			// 回呼給上層
			this.$emit('scroll', e);
		},
		// 取得當前的 scrollTop
		getScrollTop() {
			return this.$refs.scroller.scrollTop;
		},
		// 設定當前的 scrollTop (含捲動效果)
		setScrollTop(scrollTo, ms) {
			if (ms === 0) {
				this.$refs.scroller.scrollTop = scrollTo;
			}
			else {
				anime({
					targets: this.$refs.scroller,
					scrollTop: scrollTo,
					duration: ms || 500,
					// https://codepen.io/juliangarnier/pen/mWdraw
					easing: 'easeOutQuart'
				});
			}
		},
		// 取得當前的 clientHeight
		getHeight() {
			return this.$refs.scroller.clientHeight;
		},
	},
	watch: {
		status(nv, ov){
			if(nv != ov && ov){
				switch(nv){
					case "DONE":
						eventBus.$emit("QUERYDONE");
						break;
					case "FAIL":
						eventBus.$emit("QUERYFAIL");
						break;
					default:
						break;
				}
			}
			// console.log('scrollbounce status', nv);
		}
	},
    computed: {
		approveRefresh() {
			if (!this.$store.state.login.btaID)
				return false;
			return this.translateY >= this.approveRefreshDistance;
		},
		// 下拉時拉動哪個元素 (整體 or 圈圈圖示)
		pullDnElm() {
			return this.refresh ? this.$refs.circle : this.$refs.scroller;
		},
		pullUpElm() {
			return this.$refs.scroller;
		},
		// 停用
		isDisabled() {
			return this.disable || (this.status === "QUERY");
		}
    }
}
</script>

<style>
.scroll-bounce-ctn {
	/* has to be scroll, not auto */
	overflow-y: scroll;
}
.reflash-circle {
	position: absolute;
	top: -11vw;
	left: calc(50% - 5vw);
	width: 10vw;
	height: 10vw;
	border-radius: 5vw;
	background-color: white;
	box-shadow: 0px 0px 5px 0px rgb(255, 255, 255, 0.5);
	z-index: 1;
}
.reflash-circle .refresh-icon {
	color: #C8DDFC;
	transition-property: color;
	transition-duration: .5s;	
}
.reflash-circle .refresh-icon.light {
	color: #4087F7;
}
.scroll-bounce-ctn.transitionDuration, .scroll-bounce-ctn .transitionDuration {
	transition-duration: .3s;
}
/** 桌機版 */
.desktop .scroll-bounce-ctn {
	overflow-y: auto;
}
</style>