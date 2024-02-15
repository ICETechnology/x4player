<template>
    <div class="side-menu-mask" :class="{'FULL': fullOpen || dragging}" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
		<div ref="mask" class="FULL mask" @click="onClickMask" data-html2canvas-ignore="true"></div>
		<div ref="dialogCtn" class="side-menu-container posr" :class="{transitionDuration: transitionDuration}">
			<slot></slot>
		</div>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			/** 當前是否全開狀態 */
			fullOpen: false,
			width: 250,
			/** 當前是否套用漸變 */
			transitionDuration: false,
			/** 當前在 dragging 中 */
			dragging: false,
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onTouchStart(event) {
			let touch0 = event.targetTouches[0];
			// 本次點擊開始的 X
			this.touchStartX = touch0.pageX;
			// 本次 side-menu-container 的 Left
			this.curLeft = this.fullOpen ? this.leftInShowup : this.leftInHidden;
			// 本次位移
			this.moveX = 0;
			// 關閉漸變
			this.transitionDuration = false;
			// 點擊開始的時間
			this.touchStartTime = new Date();
			this.maskOpacity = parseFloat(this.$refs.mask.style.opacity || 0);
			// 顯示遮罩以遮蔽背後，避免觸發背後的東西變化
			this.dragging = true;
		},
		onTouchMove(event) {
			let touch0 = event.targetTouches[0];
			this.moveX = touch0.pageX - this.touchStartX;
			let left = this.curLeft + this.moveX;
			left = left < this.leftInShowup ? this.leftInShowup : left;
			this.$refs.dialogCtn.style.transform = `translate3d(${left}px, 0, 0)`;
			// 遮罩變色效果
			let opacity = this.maskOpacity - (this.moveX / (250*2));
			this.$refs.mask.style.opacity = opacity > 0.5 ? 0.5 : opacity;
		},
		onTouchEnd(event) {
			// 沒有位移的情況不往下處理
			if (this.moveX === 0)
				return;
			// 支持快速滑動擴增滑動量
			let slideTime = new Date() - this.touchStartTime;
			// alert(`time: ${slideTime}, moveX: ${this.moveX}`);
			let times = slideTime < 200 ? 10 : (slideTime < 500 ? 2 : 1);
			this.moveX *= times;

			// 開啟漸變
			this.transitionDuration = true;

			// 滑動達標 -> 切換顯示/隱藏
			if (Math.abs(this.moveX) > Math.abs(this.width)/2) {
				this.$store.state.status.showSideMenu = !this.fullOpen;
				return;
			}
			// 滑動未達標 -> 恢復
			else {
				this.$refs.dialogCtn.style.transform = this.showSideMenu ? `translate3d(${this.leftInShowup}px, 0, 0)` : `translate3d(${this.leftInHidden}px, 0, 0)`;
			}
			// 更新遮罩透明度
			this.$refs.mask.style.opacity = this.showSideMenu ? 0.5 : 0;
			this.dragging = false;
		},
		onClickMask() {
			this.$store.state.status.showSideMenu = false;
			setTimeout(()=>{this.dragging = false}, 300);
		},
	},
	watch: {
		/** 支持從 Vuex:showSideMenu 控制是否要顯示出選單 */
		showSideMenu(nv) {
			this.fullOpen = nv;
			// 啟用漸變
			this.transitionDuration = true;
			// 根據顯示/隱藏來設定位置
			this.$refs.dialogCtn.style.transform = this.fullOpen ? `translate3d(${this.leftInShowup}px, 0, 0)` : `translate3d(${this.leftInHidden}px, 0, 0)`;
			this.$refs.mask.style.opacity = nv ? 0.5 : 0;
			// this.dragging = false;
			setTimeout(()=>{this.dragging = false}, 300);
		}
	},
    computed: {
		leftInShowup() {
			return this.$store.state.device.width - this.width;
		},
		leftInHidden() {
			return this.$store.state.device.width;
		},
		/** 支持從 Vuex:showSideMenu 控制是否要顯示出選單 */
		showSideMenu: function() {
			return this.$store.state.status.showSideMenu;
		}
	},
}
</script>

<style scoped>
/* 最大容器 */
.side-menu-mask {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	width: 3px;
	z-index: 7;
}
/* 半透明遮罩 */
.side-menu-mask .mask {
	opacity: 0;
	background-color: black;
	transition-property: opacity;
}
/* 遮罩全滿 */
.side-menu-mask.FULL {
	width: 100%;
}

/* SideMenu 容器 */
.side-menu-container {
	position: absolute;
	top: 0;
	bottom: 0;
	width: 250px;
	background-color: #EEE;
	/* 需對應 defaultLeft */
	transform: translate3d(450px, 0, 0)
}
/* 漸變效果期間 */
.side-menu-container.transitionDuration {
	transition-duration: .3s;
}
</style>