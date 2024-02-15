<template>
	<div ref="ctn" class="flex-row pd2 pdlr3 mgb1 card-ctn list-complete-item"
		:class="{noTransition: noTransition, 'bgc-error': isError, 'clr-white': isError}"
		@touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
		<div class="mgr3 flex-center icon-ctn" :class="{'clr-white': isError}">
			<i class="material-icons md-30">{{obj.icon}}</i>
		</div>
		<div class="flex-1 flex-col h100p" @click="clickCard">
			<div v-if="obj.head" class="font-bold flex-start">{{obj.head}}</div>
			<!-- 一般 body 内容 -->
			<div v-if="obj.body" class="flex-1 body flex-start">{{obj.body}}</div>
			<!-- 指定为 Html 的 body 内容 -->
			<div v-if="obj.htmlBody" class="flex-1 body flex-start" v-html="obj.htmlBody"></div>
		</div>
		<div class="flex-col" @click="closeCard">
			<div class="font-size-micro clr-gray">{{obj.time}}</div>
			<div class="flex-1 flex-end clr-gray"><i class="material-icons md-18">close</i></div>
		</div>
	</div>
</template>

<script>
export default {
	props: ["obj"],
	data() {
		return {
			/** 動畫過場 */
			noTransition: false,
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 關閉卡片 */
		closeCard() {
			let obj = this.obj;
			if (event)
				event.stopPropagation();
			this.$emit("close", obj);
		},
		/** 點擊卡片 */
		clickCard() {
			let obj = this.obj;
			if (obj.onclick)
				obj.onclick(obj);
			this.closeCard(obj);
		},
		/** 支持滑動關閉 */
		onTouchStart(event) {
			let touch0 = event.targetTouches[0];
			this.moveX = 0;
			// 本次點擊開始的 X
			this.touchStartX = touch0.pageX;
			// 點擊開始的時間
			this.touchStartTime = new Date();
			// 關閉漸變 (為了跟隨手指)
			this.noTransition = true;
			// 點擊就不要自動關 (表示 user 可能想看，得要自己關)
			clearTimeout(this.obj.killTimeout);
		},
		onTouchMove(event) {
			if (!this.$refs.ctn)
				return;
			let touch0 = event.targetTouches[0];
			this.moveX = touch0.pageX - this.touchStartX;
			this.$refs.ctn.style.transform = `translateX(${this.moveX}px)`;
			// 遮罩變色效果
			let num = (180 - Math.abs(this.moveX)) / 180;
			this.$refs.ctn.style.opacity = num > 0.1 ? num : 0.1;
		},
		onTouchEnd(event) {
			// 開啟漸變
			this.noTransition = false;
			if (Math.abs(this.moveX) < 5 ) {
				return;
			}
			// 支持快速滑動擴增滑動量
			let slideTime = new Date() - this.touchStartTime;
			let times = slideTime < 200 ? 10 : (slideTime < 500 ? 2 : 1);
			this.moveX *= times;
			// 滑動達標 -> 關閉
			if (Math.abs(this.moveX) > 180) {
				this.$emit("close", this.obj);
			}
			// 滑動未達標 -> 恢復
			else if (this.$refs.ctn) {
				this.$refs.ctn.style.transform = `translateX(0)`;
				this.$refs.ctn.style.opacity = 1;
			}
		},		
	},
	watch: {},
    computed: {
		isError() {
			return this.obj.type === 'error';
		},
	},
}
</script>

<style scoped>
.card-ctn {
	color: black;
	background-color: white;
	border: 1px solid white;
	box-shadow: 0px 0px 5px 0px rgb(255, 255, 255, 0.5);
}
.card-ctn.noTransition {
	transition: none;
}
.icon-ctn {
	color: orange;
}
.icon-ctn i {
	width: 30px;
}

/** 桌機版 */
.desktop .card-ctn {
	width: 25em;
	height: fit-content;
}
</style>